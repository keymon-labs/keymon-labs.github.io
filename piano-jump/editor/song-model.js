// Song editor model: notes on a half-beat grid, bar sums, duration cycling, undo history, and conversion to/from the Piano Jump library format.
// Pure logic, no DOM; never mutate a song, every function returns a new one. Used by editor.js, staff-view.js, scan.js and omr/engine.js.
import { stepOf, toMidi } from "../../shared/music.js";
import { validateLibrary, LibraryError } from "../library.js";

export const BEATS = [0.5, 1, 1.5, 2, 3, 4];     // lengths the game accepts
export const LOW_CONFIDENCE = 0.6;               // scanned notes below this are highlighted for review
const MIDDLE_C = 60, LETTERS = "CDEFGAB";
const PITCH = /^([A-G])(#?)(-?\d)$/;

/** Staff step (middle C = 0, +1 per line/space) → natural pitch name, e.g. 2 → "E4". */
export const stepToPitch = (step) => LETTERS[((step % 7) + 7) % 7] + (4 + Math.floor(step / 7));
export const pitchToStep = (pitch) => stepOf(toMidi(pitch));
/** Pitches below middle C live on the bass staff. */
export const staffFor = (pitch) => (toMidi(pitch) < MIDDLE_C ? "bass" : "treble");

/** Note: { start (beats from song start), beats, pitch ("C4" or null for a rest), lyric, stem (null|"up"|"down"), staff, low (needs review) }. */
export const newSong = () => ({ id: null, title: "My song", info: "", bpm: 90, bar: 4, notes: [] });
const copy = (s) => ({ ...s, notes: s.notes.map((n) => ({ ...n })) });
const byStart = (notes) => [...notes].sort((a, b) => a.start - b.start);
export const endBeat = (s) => s.notes.reduce((m, n) => Math.max(m, n.start + n.beats), 0);
/** Index of the note that covers this beat, or -1. */
export const noteIndexAt = (s, beat) => s.notes.findIndex((n) => beat >= n.start && beat < n.start + n.beats);

/** Put a note (or a rest when pitch is null) at a grid beat. The length shrinks to fit the gap; fails if the beat is taken or too tight. */
export function place(s, { start, pitch, beats, staff = "treble" }) {
  if (!(start >= 0)) return { error: "Tap inside the staff" };
  if (noteIndexAt(s, start) >= 0) return { error: "That beat is already used" };
  const next = s.notes.reduce((m, n) => (n.start > start ? Math.min(m, n.start) : m), Infinity);
  const fit = [...BEATS].reverse().find((b) => b <= beats && b <= next - start);
  if (!fit) return { error: "No room for a note there" };
  const note = { start, beats: fit, pitch, lyric: "", stem: null, staff, low: false };
  const notes = byStart([...s.notes.map((n) => ({ ...n })), note]);
  return { song: { ...s, notes }, index: notes.indexOf(note) };
}

const NEXT = { 0.5: 1, 1: 2, 1.5: 2, 2: 4, 3: 4, 4: null };   // null = delete
export const nextBeats = (b) => NEXT[b] ?? null;
const push = (notes) => { let end = 0; for (const n of notes) { if (n.start < end) n.start = end; end = n.start + n.beats; } };   // growing a note pushes the next ones along

/** Tap on a note: quarter → half → whole → delete (eighth → quarter, dotted → next plain length). */
export function cycle(s, i) {
  const notes = s.notes.map((n) => ({ ...n })), nb = nextBeats(notes[i].beats);
  if (nb == null) notes.splice(i, 1);
  else { notes[i].beats = nb; notes[i].low = false; push(notes); }
  return { ...s, notes };
}
const edit = (s, i, patch) => ({ ...s, notes: s.notes.map((n, j) => (j === i ? { ...n, ...patch, low: false } : { ...n })) });
export const setStem = (s, i, stem) => edit(s, i, { stem });
export const setLyric = (s, i, lyric) => edit(s, i, { lyric: lyric.slice(0, 24) });
export const setMeta = (s, patch) => ({ ...copy(s), ...patch });
export const clearNotes = (s) => ({ ...s, notes: [] });

/** Per bar (up to the last bar that has notes): beat total and whether it matches the bar size. */
export function bars(s) {
  if (!s.notes.length) return [];
  return Array.from({ length: Math.ceil(endBeat(s) / s.bar) }, (_, b) => {
    const lo = b * s.bar, hi = lo + s.bar, inBar = s.notes.filter((n) => n.start >= lo && n.start < hi);
    const total = inBar.reduce((t, n) => t + n.beats, 0), crossing = inBar.some((n) => n.start + n.beats > hi);
    return { index: b, start: lo, total, crossing, ok: total === s.bar && !crossing };
  });
}
/** How many bars to draw: the used ones plus one empty bar to keep adding into (at least 2). */
export const barCount = (s) => Math.max(2, Math.ceil(endBeat(s) / s.bar) + 1);
const plural = (n) => `${n} beat${n === 1 ? "" : "s"}`;
export function barMessage(b, size) {
  if (b.ok) return `${b.total}/${size}`;
  if (b.crossing) return `${b.total}/${size} · note crosses the barline`;
  return b.total < size ? `${b.total}/${size} · needs ${plural(size - b.total)} more` : `${b.total}/${size} · ${plural(b.total - size)} too many`;
}

export const slugify = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "") || "song";
/** First free id: base, base-2, base-3… */
export function uniqueId(base, taken) {
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) { const id = `${base.slice(0, 36)}-${i}`; if (!taken.has(id)) return id; }
}

const where = (n, k, bar) => `note ${k + 1} (${n.pitch || "rest"}, bar ${Math.floor(n.start / bar) + 1}, beat ${(n.start % bar) + 1})`;
/**
 * Editor song → library-format song `{id,title,info?,bpm,bar,notes:[[pitch,beats,lyric?]]}`.
 * The game has no rests: a rest (or empty gap) is added to the note before it, so timing and barlines stay right.
 * Returns { song } or { errors: [text naming the song and the note] }.
 */
export function toLibrarySong(s, id) {
  const name = s.title.trim() ? `Song "${s.title.trim()}"` : "Song (no title)";
  const items = byStart(s.notes), lib = [];
  let cursor = 0;
  for (const [k, n] of items.entries()) {
    if (n.start < cursor) return { errors: [`${name}: ${where(n, k, s.bar)} overlaps the one before it`] };
    const held = n.start - cursor + (n.pitch ? 0 : n.beats);
    if (held > 0 || !n.pitch) {
      if (!lib.length) return { errors: [`${name}: starts with a rest, start with a note instead`] };
      lib[lib.length - 1].beats += held;
    }
    if (n.pitch) lib.push({ pitch: n.pitch, beats: n.beats, lyric: n.lyric.trim(), k, n });
    cursor = n.start + n.beats;
  }
  const bad = lib.find((x) => !BEATS.includes(x.beats));
  if (bad) return { errors: [`${name}: ${where(bad.n, bad.k, s.bar)} lasts ${bad.beats} beats once the rests after it are added; allowed lengths are ${BEATS.join(", ")}`] };
  const raw = { id: id || s.id || slugify(s.title), title: s.title.trim(), bpm: s.bpm, bar: s.bar,
    notes: lib.map((x) => (x.lyric ? [x.pitch, x.beats, x.lyric] : [x.pitch, x.beats])) };
  if (s.info.trim()) raw.info = s.info.trim();
  try { validateLibrary([raw]); } catch (e) {
    if (!(e instanceof LibraryError)) throw e;
    const msg = e.message.replace(/^Song 1: /, "").replace(/note (\d+)/, (_, j) => where(lib[j - 1].n, lib[j - 1].k, s.bar));
    return { errors: [`${name}: ${msg}`] };
  }
  return { song: raw };
}

/** Library-format song (as stored: ids may have a "lib-" prefix) → editor song, notes laid end to end. */
export function fromLibrarySong(ls) {
  let start = 0;
  const notes = ls.notes.map(([pitch, beats, lyric]) => { const n = { start, beats, pitch, lyric: lyric || "", stem: null, staff: staffFor(pitch), low: false }; start += beats; return n; });
  return { id: ls.id.replace(/^lib-/, ""), title: ls.title, info: !ls.info || ls.info === "Library" ? "" : ls.info, bpm: ls.bpm, bar: ls.bar, notes };
}

export const snapBeats = (b) => BEATS.reduce((best, v) => (Math.abs(v - b) < Math.abs(best - b) ? v : best), BEATS[0]);
/** Pitch text → a pitch the game accepts (C2 to C6), or null if it isn't a pitch. */
export function snapPitch(p) {
  if (typeof p !== "string" || !PITCH.test(p)) return null;
  const m = toMidi(p);
  return m < 36 ? "C2" : m > 84 ? "C6" : p;
}
/**
 * Recogniser output [{pitch, beats, bar, confidence?}] → editor notes after `from` (beat). Pitches and lengths are snapped to allowed
 * values; a note keeps its printed bar when the previous bar came up short (the gap shows as a bar warning); low confidence = needs review.
 */
export function layoutScanned(found, barSize, from = 0) {
  let cursor = from;
  const notes = [];
  for (const f of found) {
    const pitch = snapPitch(f.pitch);
    if (!pitch) continue;
    cursor = Math.max(cursor, from + (f.bar || 0) * barSize);
    const beats = snapBeats(f.beats);
    notes.push({ start: cursor, beats, pitch, lyric: "", stem: null, staff: staffFor(pitch), low: (f.confidence ?? 1) < LOW_CONFIDENCE });
    cursor += beats;
  }
  return notes;
}

/** Undo/redo over immutable songs. `replace` swaps the current song without making an undo step. */
export function createHistory(initial, limit = 100) {
  let past = [], future = [], cur = initial;
  return {
    get: () => cur,
    push(s) { past.push(cur); if (past.length > limit) past.shift(); future = []; cur = s; return cur; },
    replace(s) { cur = s; return cur; },
    undo() { if (past.length) { future.push(cur); cur = past.pop(); } return cur; },
    redo() { if (future.length) { past.push(cur); cur = future.pop(); } return cur; },
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
    reset(s) { past = []; future = []; cur = s; },
  };
}
