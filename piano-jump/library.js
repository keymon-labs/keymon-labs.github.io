// Piano Jump song library: validate songs, read plain or password-encrypted library files, keep imports on this device.
// Format + LLM prompt: LIBRARY.md · used by game.js and scripts/pj-library.mjs
import { toMidi } from "../shared/music.js";

const STORE = "pianojump-library", ITER = 600000;
const PITCH = /^[A-G]#?-?\d$/, BEATS = [0.5, 1, 1.5, 2, 3, 4];
const te = new TextEncoder(), td = new TextDecoder();

export class LibraryError extends Error { constructor(msg, code) { super(msg); this.code = code; } }

const b64 = (u) => { let s = ""; for (const b of u) s += String.fromCharCode(b); return btoa(s); };
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function aesKey(password, salt, iter, usage) {
  const base = await crypto.subtle.importKey("raw", te.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, [usage]);
}

/** Library object → encrypted JSON text (PBKDF2-SHA256 → AES-256-GCM). */
export async function encryptLibrary(obj, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await aesKey(password, salt, ITER, "encrypt");
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, te.encode(JSON.stringify(obj))));
  return JSON.stringify({ pjlib: 1, kdf: "PBKDF2-SHA256", iter: ITER, salt: b64(salt), iv: b64(iv), data: b64(data) });
}

/** Encrypted envelope object → library object. Wrong password and damaged file look the same (by design). */
export async function decryptLibrary(env, password) {
  const bad = () => new LibraryError("Wrong password or damaged file", "password");
  try {
    if (env.pjlib !== 1 || !(env.iter >= 100000 && env.iter <= 2000000)) throw 0;   // bounded so a hostile file can't stall the page
    const key = await aesKey(password, unb64(env.salt), env.iter, "decrypt");
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(env.iv) }, key, unb64(env.data));
    return JSON.parse(td.decode(plain));
  } catch { throw bad(); }
}

/** Check a library object and return songs ready for the game (ids get a "lib-" prefix so they never clash with built-ins). */
export function validateLibrary(data) {
  const list = Array.isArray(data) ? data : data && data.songs;
  if (!Array.isArray(list) || !list.length) throw new LibraryError('No songs found: expected {"songs": [...]}');
  if (list.length > 200) throw new LibraryError("Too many songs (max 200)");
  const ids = new Set();
  return list.map((s, i) => {
    const bad = (m) => { throw new LibraryError(`Song ${i + 1}: ${m}`); };
    const str = (v, max) => typeof v === "string" && v.length >= 1 && v.length <= max;
    if (!s || typeof s !== "object") bad("not an object");
    if (typeof s.id !== "string" || !/^[a-z0-9_-]{1,40}$/i.test(s.id)) bad("id must be 1-40 letters, digits, - or _");
    if (ids.has(s.id)) bad(`duplicate id "${s.id}"`);
    ids.add(s.id);
    if (!str(s.title, 60)) bad("title must be 1-60 characters");
    if (!(s.bpm >= 30 && s.bpm <= 300)) bad("bpm must be 30-300");
    if (!Number.isInteger(s.bar) || s.bar < 1 || s.bar > 12) bad("bar (beats per bar) must be a whole number 1-12");
    if (!Array.isArray(s.notes) || !s.notes.length || s.notes.length > 500) bad("notes must be a list of 1-500 notes");
    const notes = s.notes.map((n, j) => {
      const at = `note ${j + 1}`;
      if (!Array.isArray(n)) bad(`${at} must be [pitch, beats, lyric?, finger?]`);
      const [pitch, beats, lyric, finger] = n;
      if (typeof pitch !== "string" || !PITCH.test(pitch) || toMidi(pitch) < 36 || toMidi(pitch) > 84) bad(`${at}: pitch "${pitch}" must look like C4 or F#3 (C2 to C6)`);
      if (!BEATS.includes(beats)) bad(`${at}: beats must be one of ${BEATS.join(", ")}`);
      if (lyric != null && !(typeof lyric === "string" && lyric.length <= 24)) bad(`${at}: lyric must be text up to 24 characters`);
      if (finger != null && !(Number.isInteger(finger) && finger >= 1 && finger <= 5)) bad(`${at}: finger must be 1-5`);
      return finger != null ? [pitch, beats, lyric ?? "", finger] : lyric != null ? [pitch, beats, lyric] : [pitch, beats];
    });
    const info = s.info == null ? "Library" : str(s.info, 40) ? s.info : bad("info must be 1-40 characters");
    return { id: "lib-" + s.id, title: s.title, info, bpm: s.bpm, bar: s.bar, notes };
  });
}

/** File text (plain or encrypted JSON) → songs. Throws LibraryError; code "password" means ask for / retry the password. */
export async function parseLibraryText(text, password) {
  let data;
  try { data = JSON.parse(text); } catch { throw new LibraryError("Not a valid library file"); }
  if (data && data.pjlib) {
    if (!password) throw new LibraryError("This library is encrypted: enter the password", "password");
    data = await decryptLibrary(data, password);
  }
  return validateLibrary(data);
}

// ---- Device storage: decrypted songs only; the password is never kept ----
export function loadStored() {
  try { return validateLibrary(JSON.parse(localStorage.getItem(STORE) || "null")).map((s) => ({ ...s, id: s.id.slice(4) })); } catch { return []; }
}
export function saveStored(songs) { try { localStorage.setItem(STORE, JSON.stringify(songs)); return true; } catch { return false; } }
export function clearStored() { try { localStorage.removeItem(STORE); } catch { /* nothing stored */ } }
