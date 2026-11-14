// Beat Tiles UI: composes a groove of cards (logic.js), plays it on a lookahead clock (sound.js), tap to change cards, themes, record your own voice.
// Data: themes.json (one word per sound count); art: art/*.svg (inlined at build). Recordings are saved on this device only (store.js).
import { registerServiceWorker, setupInstallButton, keepAwake, releaseWake } from "../shared/pwa.js";
import { createRng } from "../shared/rng.js";
import THEMES from "./themes.json";
import { NAMES, EFFECTS, cardsFor, composeGroove, evolveBars, retheme, nextCard, label, clipKey } from "./logic.js";
import { ensureAudio, now, hit, backing, decodeClip, previewClip, clipToPcm, pcmToClip } from "./sound.js";
import { saveClip, loadClips, clearClips } from "./store.js";

const svgs = import.meta.glob("./art/*.svg", { query: "?raw", import: "default", eager: true });
const ART = Object.fromEntries(Object.entries(svgs).map(([p, s]) => [p.split("/").pop().replace(".svg", ""), s]));
const $ = (s) => document.querySelector(s), seq = $("#seq");

const S = { theme: "fruits", cards: cardsFor(THEMES.fruits), bars: [], flat: [], rng: null, seed: 0, pass: 0, on: false, beat: 0, nextT: 0, timer: null, bpm: 80, swing: true, clips: {}, raw: {}, micOk: true }; // clips: AudioBuffers; raw: saved recordings not yet turned into buffers (that needs a tap first)
const has = (k) => !!(S.clips[k] || S.raw[k]);
const clipFor = (k) => S.clips[k] || (S.raw[k] ? (S.clips[k] = pcmToClip(S.raw[k].rate, S.raw[k].data)) : null);
const say = (m) => { $("#msg").textContent = m; };
const delay = (t) => Math.max(0, (t - now()) * 1000);

function renderSeq() {
  S.flat = S.bars.flat();
  seq.innerHTML = S.flat.map((c, i) => {
    const syl = c.kind === "word" ? c.syl.map((s, j) => `<span data-j="${j}">${s}</span>`).join("·") : label(c);
    return `<button class="card b${c.n}${i % 4 === 0 ? " bs" : ""}" data-i="${i}"><span class="num">${i % 4 + 1}</span><div class="art">${ART[c.id] || ""}</div><div class="lab">${syl}</div><div class="nm">${$("#names").checked ? NAMES[c.n] : ""}</div><div class="dots">${"<i></i>".repeat(c.n)}</div></button>`;
  }).join("");
  seq.querySelectorAll(".card").forEach((el) => el.addEventListener("pointerdown", (e) => { e.preventDefault(); swap(+el.dataset.i); }));
}
function mark(i, j) {
  seq.querySelectorAll(".now,.lit").forEach((x) => x.classList.remove("now", "lit"));
  const el = seq.children[i]; if (!el) return;
  el.classList.add("now");
  if (j >= 0) { const d = el.querySelectorAll(".dots i")[j], s = el.querySelector(`.lab span[data-j="${j}"]`); d && d.classList.add("lit"); s && s.classList.add("lit"); }
}
function speak(c) {
  if (!$("#speech").checked || c.kind !== "word" || !window.speechSynthesis) return;
  try { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(c.id)); } catch {} // shortcut: whole word at the start of the beat, timing is the browser's
}
function playCard(c, i, t, bs, withBacking) {
  const mode = $("#snd").value, clip = mode === "mine" ? clipFor(clipKey(S.theme, c.id)) : null;
  for (let j = 0; j < c.n; j++) {
    const tj = t + (j * bs) / c.n + (S.swing && c.n === 2 && j === 1 ? bs * 0.08 : 0);
    hit(c, j, tj, bs / c.n, mode, clip, $("#fx").value); setTimeout(() => mark(i, j), delay(tj));
  }
  if (c.n === 0) setTimeout(() => mark(i, -1), delay(t));
  if (withBacking) backing(i, t, bs, S.swing);
  setTimeout(() => speak(c), delay(t));
}
function tick() {
  const bs = 60 / S.bpm;
  while (S.nextT < now() + 0.12) {
    playCard(S.flat[S.beat % S.flat.length], S.beat % S.flat.length, S.nextT, bs, true);
    S.beat++; S.nextT += bs;
    if (S.beat % S.flat.length === 0) evolve(false); // shortcut: the picture changes up to 120 ms early; use a rAF clock if it shows
  }
}
function start() { ensureAudio(); S.on = true; S.beat = 0; S.nextT = now() + 0.1; S.timer = setInterval(tick, 25); $("#gp").textContent = "■ Stop"; keepAwake(); }
function stop() { clearInterval(S.timer); S.on = false; seq.querySelectorAll(".now,.lit").forEach((x) => x.classList.remove("now", "lit")); $("#gp").textContent = "▶ Start"; releaseWake(); }
function newGroove() {
  S.seed = 1000 + Math.floor(Math.random() * 9000); S.rng = createRng(S.seed);
  S.bars = composeGroove(S.rng, S.cards, +$("#bars").value); S.pass = 0; S.beat = 0;
  $("#gi").textContent = "groove #" + S.seed; renderSeq();
}
function evolve(force) {
  S.pass++;
  if (!(force || $("#auto").checked)) return;
  S.bars = evolveBars(S.bars, S.rng, S.cards, S.pass, force); renderSeq();
}
function swap(i) { // tap: next sound count (1, 2, 3, 4, rest); editing by hand turns auto-change off
  const nc = nextCard(S.flat[i], S.cards);
  S.bars[i >> 2] = S.bars[i >> 2].map((c, k) => (k === i % 4 ? nc : c)); $("#auto").checked = false; renderSeq();
  if (!S.on) { ensureAudio(); playCard(nc, i, now() + 0.02, 60 / S.bpm, false); }
}
function setTheme(key) {
  S.theme = key; S.cards = cardsFor(THEMES[key]);
  if (S.bars.length) { S.bars = retheme(S.bars, S.cards); renderSeq(); }
  renderRec();
}

// ---- my voice: one clip per word, saved on this device, squeezed into one beat ----
async function useBlob(id, blob) {
  try {
    const key = clipKey(S.theme, id), clip = await decodeClip(blob), pcm = clipToPcm(clip);
    S.clips[key] = clip; S.raw[key] = pcm; $("#snd").value = "mine";
    say((await saveClip(key, pcm.rate, pcm.data)) ? `Saved "${id}" on this device. It will be squeezed into one beat.` : `Got "${id}", but this browser would not keep it after you close the page.`);
  } catch { say("Could not read that sound, try again."); }
  renderRec();
}
async function forgetAll() { await clearClips(); S.clips = {}; S.raw = {}; renderRec(); say("Forgot all saved sounds."); }
function pickFile(id) { const i = document.createElement("input"); i.type = "file"; i.accept = "audio/*"; i.setAttribute("capture", ""); i.onchange = () => i.files[0] && useBlob(id, i.files[0]); i.click(); }
async function recordSlot(id) {
  if (!S.micOk || !navigator.mediaDevices || !window.MediaRecorder) return pickFile(id);
  try {
    const st = await navigator.mediaDevices.getUserMedia({ audio: true }), rec = new MediaRecorder(st), ch = [];
    rec.ondataavailable = (e) => ch.push(e.data); rec.onstop = () => { st.getTracks().forEach((x) => x.stop()); useBlob(id, new Blob(ch)); };
    rec.start(); say(`Say "${id}" now…`); setTimeout(() => rec.state === "recording" && rec.stop(), 2000);
  } catch { S.micOk = false; say("No microphone here: tap again to pick or record a sound file."); }
}
function renderRec() {
  const any = Object.keys({ ...S.clips, ...S.raw }).length > 0;
  $("#rec").innerHTML = '<span style="font-size:14px">My voice (kept on this device only):</span>' + THEMES[S.theme].words.map((w) => `<button data-id="${w.id}">${has(clipKey(S.theme, w.id)) ? "✓" : "🎙"} ${w.id}</button>${has(clipKey(S.theme, w.id)) ? `<button data-play="${w.id}" aria-label="Play ${w.id}">▶</button>` : ""}`).join("") + (any ? '<button id="forget">🗑 Forget my sounds</button>' : "");
  $("#rec").querySelectorAll("button[data-id]").forEach((b) => (b.onclick = () => recordSlot(b.dataset.id)));
  $("#rec").querySelectorAll("button[data-play]").forEach((b) => (b.onclick = () => previewClip(clipFor(clipKey(S.theme, b.dataset.play)), $("#fx").value, 60 / S.bpm)));
  if (any) $("#forget").onclick = forgetAll;
}

$("#theme").innerHTML = Object.entries(THEMES).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join("");
$("#fx").innerHTML = Object.entries(EFFECTS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join("");
$("#theme").onchange = (e) => setTheme(e.target.value);
$("#gp").onclick = () => (S.on ? stop() : start());
$("#gn").onclick = newGroove; $("#bars").onchange = newGroove; $("#ge").onclick = () => evolve(true);
$("#bpm").oninput = (e) => { S.bpm = +e.target.value; $("#bpmv").textContent = S.bpm; };
$("#sw").onchange = (e) => { S.swing = e.target.checked; }; $("#names").onchange = renderSeq;
if (!window.speechSynthesis) $("#speechL").style.display = "none";
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && S.on) keepAwake(); });
setupInstallButton($("#install")); registerServiceWorker("sw.js");
setTheme("fruits"); newGroove();
loadClips().then((all) => { S.raw = { ...all, ...S.raw }; renderRec(); const n = Object.keys(all).length; if (n) say(`Loaded ${n} saved sound${n > 1 ? "s" : ""} from this device.`); });
window.__beatTiles = { S, start, stop, swap, newGroove, evolve, setTheme, clipFor };
