// Piano Jump song editor: tap notes onto a staff, preview, save to the on-device library, export JSON, import a scanned page.
// Model: song-model.js · drawing + tap meaning: staff-view.js · photo import: scan.js · library storage: ../library.js · styles: editor.css
import { newSong, place, cycle, setStem, setLyric, setMeta, clearNotes, bars, endBeat, stepToPitch, toLibrarySong, fromLibrarySong, layoutScanned, snapPitch, slugify, uniqueId, createHistory, BEATS } from "./song-model.js";
import { layout, hit, render } from "./staff-view.js";
import { loadStored, upsertStored, removeStored, libraryObject, libraryJson } from "../library.js";
import { toMidi } from "../../shared/music.js";
import { unlockAudio, tone } from "../../shared/audio.js";
import { initScan } from "./scan.js";

const $ = (id) => document.getElementById(id);
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => "&#" + c.charCodeAt(0) + ";");   // lyrics and titles can come from a scan or a library file
const DRAFT = "pianojump-editor-draft", SIZES = [9, 12, 15, 19];

/** Hook for "Load into Piano Jump". Wire it to the game; it receives a library object `{songs:[song]}` (ids without "lib-").
 *  The default copies the song text and returns the message to show. */
export const hooks = {
  async loadIntoPianoJump(libObj) {
    return (await copyText(libraryJson(libObj))) ? "Copied. In Piano Jump open Song library, paste, and press Load library." : "Could not copy; select the text below and copy it by hand.";
  },
};
window.pianoJumpEditorHooks = hooks;

// ---------- state ----------
const ui = { dur: 1, dotted: false, rest: false, bass: false, size: 1 };
let geo = null, timers = [];

function sane(d) {                       // restore a saved draft, dropping anything that is not a valid note
  if (!d || typeof d !== "object" || !Array.isArray(d.notes)) return null;
  const ok = (n) => n && Number.isFinite(n.start) && n.start >= 0 && n.start % 0.5 === 0 && BEATS.includes(n.beats) && (n.pitch === null || snapPitch(n.pitch) === n.pitch);
  return { ...newSong(), id: typeof d.id === "string" ? d.id : null, title: String(d.title ?? "My song").slice(0, 60), info: String(d.info ?? "").slice(0, 40),
    bpm: Math.min(300, Math.max(30, +d.bpm || 90)), bar: Math.min(12, Math.max(1, Math.round(+d.bar) || 4)),
    notes: d.notes.filter(ok).map((n) => ({ start: n.start, beats: n.beats, pitch: n.pitch, lyric: String(n.lyric ?? "").slice(0, 24), stem: n.stem === "up" || n.stem === "down" ? n.stem : null, staff: n.staff === "bass" ? "bass" : "treble", low: false })).sort((a, b) => a.start - b.start) };
}
let draft = null;
try { draft = sane(JSON.parse(localStorage.getItem(DRAFT))); } catch { /* no draft */ }
const hist = createHistory(draft || newSong());
const song = () => hist.get();
const saveDraft = () => { try { localStorage.setItem(DRAFT, JSON.stringify(song())); } catch { /* private mode: no autosave */ } };
const showBass = () => ui.bass || song().notes.some((n) => n.staff === "bass");

// ---------- small helpers ----------
function say(text, bad) { const m = $("msg"); m.textContent = text; m.className = bad ? "bad" : ""; }
const freq = (pitch) => 440 * 2 ** ((toMidi(pitch) - 69) / 12);
async function copyText(text) {
  const out = $("exportOut"); out.value = text; out.hidden = false;
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fall through */ }
  try { out.select(); return document.execCommand("copy"); } catch { return false; }
}
function download(name, text) {
  const a = document.createElement("a"), url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const ICON = {
  0.5: '<svg viewBox="0 0 26 26"><ellipse cx="9" cy="20" rx="5.2" ry="3.8" transform="rotate(-20 9 20)" fill="currentColor"/><path d="M13.6 19V4c1 4.5 7 5 4 11" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
  1: '<svg viewBox="0 0 26 26"><ellipse cx="10" cy="20" rx="5.2" ry="3.8" transform="rotate(-20 10 20)" fill="currentColor"/><path d="M14.6 19V3" stroke="currentColor" stroke-width="2"/></svg>',
  2: '<svg viewBox="0 0 26 26"><ellipse cx="10" cy="20" rx="5" ry="3.5" transform="rotate(-20 10 20)" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14.6 19V3" stroke="currentColor" stroke-width="2"/></svg>',
  4: '<svg viewBox="0 0 26 26"><ellipse cx="13" cy="13" rx="8" ry="5.2" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
  dot: '<svg viewBox="0 0 26 26"><ellipse cx="9" cy="19" rx="5" ry="3.6" transform="rotate(-20 9 19)" fill="currentColor"/><path d="M13.6 18V4" stroke="currentColor" stroke-width="2"/><circle cx="21" cy="19" r="2.2" fill="currentColor"/></svg>',
  rest: '<svg viewBox="0 0 26 26"><path d="M10 3l6 7-6 6 6 7" stroke="currentColor" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"/></svg>',
};
document.querySelectorAll("[data-dur] i").forEach((i) => { i.innerHTML = ICON[i.parentElement.dataset.dur]; });
$("btnDot").querySelector("i").innerHTML = ICON.dot;
$("btnRest").querySelector("i").innerHTML = ICON.rest;
$("inBar").innerHTML = Array.from({ length: 12 }, (_, k) => `<option value="${k + 1}">${k + 1}${k === 2 ? " (3/4)" : k === 3 ? " (4/4)" : ""}</option>`).join("");

// ---------- drawing ----------
function draw() {
  const s = song();
  geo = layout(s, { bass: showBass(), stepH: SIZES[ui.size] });
  const stage = $("stage");
  stage.style.width = geo.width + "px"; stage.style.height = geo.height + "px";
  stage.innerHTML = render(geo, s) + s.notes.map((n, i) => !n.pitch ? "" :
    `<input class="lyric" data-i="${i}" maxlength="24" value="${esc(n.lyric)}" aria-label="Lyric for note ${i + 1}" autocomplete="off" autocapitalize="none" spellcheck="false" style="left:${geo.x0 + n.start * geo.bw + 2}px;top:${geo.lyricTop}px;width:${Math.max(44, n.beats * geo.bw - 4)}px">`).join("");
  syncControls(); check(); saveDraft();
}
function syncControls() {
  const s = song();
  document.querySelectorAll("[data-dur]").forEach((b) => b.classList.toggle("on", +b.dataset.dur === ui.dur));
  $("btnDot").setAttribute("aria-pressed", ui.dotted); $("btnRest").setAttribute("aria-pressed", ui.rest); $("btnBass").setAttribute("aria-pressed", showBass());
  $("btnUndo").disabled = !hist.canUndo(); $("btnRedo").disabled = !hist.canRedo();
  $("btnSmaller").disabled = ui.size === 0; $("btnBigger").disabled = ui.size === SIZES.length - 1;
  if (document.activeElement !== $("inTitle")) $("inTitle").value = s.title;
  if (document.activeElement !== $("inInfo")) $("inInfo").value = s.info;
  if (document.activeElement !== $("inBpm")) $("inBpm").value = s.bpm;
  $("inBar").value = s.bar;
}
function commit(s) { hist.push(s); draw(); }

/** Live validation with the same rules the game uses; export and save are disabled while there are errors. */
function check() {
  const s = song(), box = $("check"), res = s.notes.length ? toLibrarySong(s, s.id || undefined) : null;
  const btns = ["btnSave", "btnCopy", "btnDownload", "btnLoad"].map($);
  btns.forEach((b) => { b.disabled = !res || !!res.errors; });
  if (!res) { box.className = "card"; box.innerHTML = "<p>Tap the staff to add the first note.</p>"; return; }
  if (res.errors) { box.className = "card bad"; box.innerHTML = res.errors.map((e) => `<p>⚠ ${esc(e)}</p>`).join(""); return; }
  const badBars = bars(s).filter((b) => !b.ok);
  box.className = "card good";
  box.innerHTML = `<p>✓ “${esc(s.title)}” is ready: ${res.song.notes.length} notes, ${Math.ceil(endBeat(s) / s.bar)} bars.</p>` +
    (badBars.length ? `<p>⚠ Bar${badBars.length > 1 ? "s" : ""} ${badBars.map((b) => b.index + 1).join(", ")} ${badBars.length > 1 ? "don't" : "doesn't"} add up to ${s.bar} beats. The game still plays it; check the marked bars.</p>` : "");
}

// ---------- taps on the staff ----------
function tap(x, y) {
  unlockAudio(); stop();
  const s = song(), h = hit(geo, s, x, y);
  if (h.kind === "empty") {
    const pitch = ui.rest ? null : stepToPitch(h.step), r = place(s, { start: h.beat, pitch, beats: ui.dotted ? ui.dur * 1.5 : ui.dur, staff: h.staff });
    if (r.error) return say(r.error, true);
    say(""); commit(r.song); if (pitch) tone(freq(pitch), 0.35, "triangle", 0.2);
  } else if (h.kind === "note") {
    const n = s.notes[h.index];
    if (h.zone === "head") { const next = cycle(s, h.index); say(next.notes.length < s.notes.length ? "Note removed" : ""); commit(next); if (n.pitch && next.notes.length === s.notes.length) tone(freq(n.pitch), 0.35, "triangle", 0.2); }
    else commit(setStem(s, h.index, h.zone === "above" ? "up" : "down"));
  } else say("Tap an empty beat on the staff to add a note.");
}
$("stage").addEventListener("click", (e) => {
  if (e.target.closest("input")) return;
  const r = $("stage").getBoundingClientRect();
  tap(e.clientX - r.left, e.clientY - r.top);
});
$("stage").addEventListener("change", (e) => {          // lyric typed: save without redrawing, so focus stays put
  const i = e.target.closest?.(".lyric")?.dataset.i;
  if (i == null) return;
  hist.push(setLyric(song(), +i, e.target.value)); syncControls(); check(); saveDraft();
});

// ---------- preview ----------
function stop() {
  timers.forEach(clearTimeout); timers = [];
  document.querySelectorAll("#stage .play").forEach((el) => el.classList.remove("play"));
  $("btnPlay").querySelector("span").textContent = "Play"; $("btnPlay").querySelector("i").textContent = "▶";
}
function play() {
  unlockAudio(); const s = song();
  if (!s.notes.length) return say("Add some notes first.", true);
  const sec = 60 / s.bpm;
  s.notes.forEach((n, i) => timers.push(setTimeout(() => {
    document.querySelectorAll("#stage .play").forEach((el) => el.classList.remove("play"));
    document.querySelector(`#stage .slot[data-i="${i}"]`)?.classList.add("play");
    if (n.pitch) tone(freq(n.pitch), n.beats * sec * 0.95, "triangle", 0.2);
  }, n.start * sec * 1000)));
  timers.push(setTimeout(stop, endBeat(s) * sec * 1000 + 200));
  $("btnPlay").querySelector("span").textContent = "Stop"; $("btnPlay").querySelector("i").textContent = "■";
}
$("btnPlay").onclick = () => (timers.length ? stop() : play());

// ---------- toolbar ----------
document.querySelectorAll("[data-dur]").forEach((b) => { b.onclick = () => { ui.dur = +b.dataset.dur; if (ui.dur === 0.5 || ui.dur === 4) ui.dotted = false; syncControls(); }; });
$("btnDot").onclick = () => { if (ui.dur === 1 || ui.dur === 2) ui.dotted = !ui.dotted; else say("Dotted works with quarter and half notes."); syncControls(); };
$("btnRest").onclick = () => { ui.rest = !ui.rest; say(ui.rest ? "Rest tool on: tap a beat to place a rest." : ""); syncControls(); };
$("btnUndo").onclick = () => { stop(); hist.undo(); draw(); };
$("btnRedo").onclick = () => { stop(); hist.redo(); draw(); };
$("btnClear").onclick = () => { if (song().notes.length) { commit(clearNotes(song())); say("Cleared. Undo brings the notes back."); } };
$("btnNew").onclick = () => { commit(newSong()); say("New song. Undo brings the old one back."); };
$("btnBass").onclick = () => { if (ui.bass && song().notes.some((n) => n.staff === "bass")) return say("Remove the bass notes first to hide the bass staff.", true); ui.bass = !ui.bass; draw(); };
$("btnSmaller").onclick = () => { ui.size = Math.max(0, ui.size - 1); draw(); };
$("btnBigger").onclick = () => { ui.size = Math.min(SIZES.length - 1, ui.size + 1); draw(); };

// ---------- title, info, tempo, bar size ----------
$("inTitle").onchange = (e) => commit(setMeta(song(), { title: e.target.value.slice(0, 60) }));
$("inInfo").onchange = (e) => commit(setMeta(song(), { info: e.target.value.slice(0, 40) }));
$("inBpm").onchange = (e) => commit(setMeta(song(), { bpm: Math.min(300, Math.max(30, Math.round(+e.target.value) || 90)) }));
$("inBar").onchange = (e) => commit(setMeta(song(), { bar: +e.target.value }));      // barlines re-flow; notes keep their beats

// ---------- save, copy, download, hook, library ----------
const current = () => { const s = song(), r = toLibrarySong(s, s.id || uniqueId(slugify(s.title), new Set(loadStored().map((x) => x.id.replace(/^lib-/, ""))))); if (r.errors) { say(r.errors[0], true); return null; } return r.song; };
$("btnSave").onclick = () => {
  stop(); const ls = current(); if (!ls) return;
  let stored;
  try { stored = upsertStored(ls); } catch (e) { return say(e.message, true); }
  if (!stored) return say("Could not save: this browser blocked storage. Use Download .json instead.", true);
  hist.replace({ ...song(), id: ls.id }); saveDraft(); drawLibrary();
  say(`Saved “${ls.title}”. ${stored.length} song${stored.length > 1 ? "s" : ""} in the library on this device; pick it in the Piano Jump menu.`);
};
$("btnCopy").onclick = async () => { const ls = current(); if (ls) say((await copyText(libraryJson({ songs: [ls] }))) ? "Copied the song JSON." : "Copy was blocked; the text is below, select and copy it.", false); };
$("btnDownload").onclick = () => { const ls = current(); if (ls) { const t = libraryJson({ songs: [ls] }); $("exportOut").value = t; download(`${ls.id}.json`, t); say("Downloaded."); } };
$("btnLoad").onclick = async () => { const ls = current(); if (ls) say(await hooks.loadIntoPianoJump({ songs: [ls] }, ls)); };

const armed = new Map();     // two taps to delete a saved song
function drawLibrary() {
  const list = loadStored();
  $("libList").innerHTML = list.length ? list.map((s) => `<li><span>${esc(s.title)} <small>${s.notes.length} notes</small></span><button data-open="${esc(s.id)}">Open</button><button data-del="${esc(s.id)}">Delete</button></li>`).join("") : '<li class="empty">Nothing saved yet.</li>';
  $("btnLibCopy").disabled = $("btnLibDownload").disabled = !list.length;
}
$("libList").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.open) {
    const s = loadStored().find((x) => x.id === b.dataset.open);
    if (s) { stop(); commit(fromLibrarySong(s)); say(`Opened “${s.title}”. Undo goes back to what you had.`); window.scrollTo({ top: 0, behavior: "smooth" }); }
  } else if (b.dataset.del) {
    if (!armed.has(b.dataset.del)) { b.textContent = "Tap again to delete"; armed.set(b.dataset.del, setTimeout(() => { armed.delete(b.dataset.del); drawLibrary(); }, 3000)); return; }
    clearTimeout(armed.get(b.dataset.del)); armed.delete(b.dataset.del); removeStored(b.dataset.del); drawLibrary(); say("Deleted from the library.");
  }
});
const libText = () => libraryJson(libraryObject(loadStored()));
$("btnLibCopy").onclick = async () => say((await copyText(libText())) ? "Copied the whole library." : "Copy was blocked; the text is below, select and copy it.");
$("btnLibDownload").onclick = () => { const t = libText(); $("exportOut").value = t; download("piano-jump-library.json", t); say("Downloaded the library."); };

// ---------- scan a page ----------
function addScanned(found) {
  const s = song(), from = s.notes.length ? Math.ceil(endBeat(s) / s.bar) * s.bar : 0, notes = layoutScanned(found, s.bar, from);
  commit({ ...s, notes: [...s.notes, ...notes] });
  say(`Added ${notes.length} note${notes.length === 1 ? "" : "s"} from the scan. Check the orange ones against your photo.`);
  return notes.length;
}
const scan = initScan({
  getBar: () => song().bar,
  onOpen: () => { stop(); $("work").hidden = true; },
  onClose: () => { $("work").hidden = false; },
  onResult: (found) => { const n = addScanned(found); $("split").classList.toggle("review", !$("photoPane").hidden); return n; },
  onPhotoGone: () => $("split").classList.remove("review"),
});
$("btnScan").onclick = () => scan.open();

// ---------- start ----------
addEventListener("pagehide", saveDraft);
draw(); drawLibrary();
window.__editor = { song, hist, ui, tap, geo: () => geo, draw, addScanned, scan, hooks, drawLibrary };
