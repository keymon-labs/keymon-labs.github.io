// Brick Beats: photo of a brick mat → lanes of notes → playback with a moving line over the photo.
// UI and playback only; photo reading is vision.js, music rules rhythm.js, sound synth.js. Test hook: window.__brickBeats.
import { detect } from "./vision.js";
import { COLOURS, INSTRUMENTS, DEFAULT_INSTRUMENTS, SCALES, FRUITS, BEATS_PER_STUD, fruitById, semitone, midiOf, pitchLabel, hz, annotateFruits, fruitCounts } from "./rhythm.js";
import { NOTE_NAMES } from "../shared/music.js";
import { ensureAudio, audioNow, gainNode, masterBus, voice } from "./synth.js";
import { registerServiceWorker, keepAwake, releaseWake } from "../shared/pwa.js";

const EXAMPLES = { photo: new URL("./example-photo.jpg", import.meta.url).href, taped: new URL("./example-taped.png", import.meta.url).href };
const $ = (s) => document.querySelector(s);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const textOn = (hex) => { const n = parseInt(hex.slice(1), 16); return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150 ? "#14201a" : "#ffffff"; };

let uid = 1, res = null, tracks = [], loopLen = 20, sel = null, crop = null, objUrl = null;
const state = { bpm: 120, key: 0, scale: "pent", loop: true, fruits: false };

const secPerStud = () => (60 / state.bpm) * BEATS_PER_STUD;
const noteOf = (tr, b) => midiOf(tr.instrument, state.key, state.scale, b.cls);
const setStatus = (t, err) => { const s = $("#status"); s.textContent = t; s.classList.toggle("err", !!err); };

/* ---------- reading the photo ---------- */
function analyse(im) {
  const t0 = performance.now();
  const W = 640, H = Math.max(1, Math.round((im.naturalHeight * W) / im.naturalWidth));
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const c = cv.getContext("2d", { willReadFrequently: true });
  c.imageSmoothingQuality = "high";
  c.drawImage(im, 0, 0, W, H);
  const r = detect(c.getImageData(0, 0, W, H).data, W, H);
  r.ms = performance.now() - t0;
  return r;
}

async function useSource(src, example) {
  if (playing) stopPlay();
  setStatus("Reading the mat…");
  const im = new Image();
  im.src = src;
  try { await im.decode(); } catch { setStatus("That file could not be opened as a photo.", true); return false; }
  const r = analyse(im);
  if (!r.ok) { setStatus(r.msg, true); return false; }
  res = r;
  tracks = r.tracks.map((t, i) => ({
    row: t.row, mid: t.mid, instrument: DEFAULT_INSTRUMENTS[i % DEFAULT_INSTRUMENTS.length], mute: false, solo: false,
    bricks: t.bricks.map((b) => ({ id: uid++, cls: b.cls, sure: b.sure, start: b.start, len: b.len, box: { x: b.x, y: b.y, w: b.w, h: b.h } })),
  }));
  sel = null;
  let x0 = r.plate.x0, x1 = r.plate.x1, y0 = r.plate.y0, y1 = r.plate.y1;
  for (const t of tracks) for (const b of t.bricks) { x0 = Math.min(x0, b.box.x); x1 = Math.max(x1, b.box.x + b.box.w); y0 = Math.min(y0, b.box.y); y1 = Math.max(y1, b.box.y + b.box.h); }
  const m = 12;
  crop = { x0: Math.max(0, x0 - m), x1: Math.min(r.W, x1 + m), y0: Math.max(0, y0 - m), y1: Math.min(r.H, y1 + m) };
  // show only the plate: the photo is a wide "world" shifted and scaled inside the stage
  const cw = (crop.x1 - crop.x0) / r.W, ch = (crop.y1 - crop.y0) / r.H, world = $("#world");
  $("#stage").style.aspectRatio = `${crop.x1 - crop.x0} / ${crop.y1 - crop.y0}`;
  world.style.width = `${100 / cw}%`;
  world.style.aspectRatio = `${r.W} / ${r.H}`;
  world.style.left = `${(-crop.x0 / r.W / cw) * 100}%`;
  world.style.top = `${(-crop.y0 / r.H / ch) * 100}%`;
  $("#img").src = src;
  $("#tag").hidden = !example;
  refresh();
  return true;
}

/* ---------- drawing ---------- */
let boxEls = new Map(), rbEls = new Map(), phEls = [];
const labelOf = (tr, b) => (state.fruits && b.fruit ? (b.fruitLead ? fruitById(b.fruit).name : "·") : pitchLabel(noteOf(tr, b)));

function renderBoxes() {
  const W = res.W, H = res.H, xb = crop.x0 + 6;
  let h = "";
  for (const tr of tracks) {
    let cy;
    if (res.lanes && tr.mid !== undefined) cy = (tr.mid + xb * res.lanes.sn) / res.lanes.cs;
    else cy = tr.bricks.length ? tr.bricks.reduce((a, b) => a + b.box.y + b.box.h / 2, 0) / tr.bricks.length : 0;
    if (tr.bricks.length || res.lanes) h += `<span class="rownum" style="top:${(cy / H) * 100}%;left:${(xb / W) * 100}%">${tr.row}</span>`;
    for (const b of tr.bricks) {
      const fc = state.fruits && b.fruit ? `border-color:${fruitById(b.fruit).hex};` : "";
      h += `<button type="button" class="brick${b.id === sel ? " sel" : ""}${b.sure === false ? " unsure" : ""}" data-id="${b.id}" style="${fc}left:${(b.box.x / W) * 100}%;top:${(b.box.y / H) * 100}%;width:${(b.box.w / W) * 100}%;height:${(b.box.h / H) * 100}%" aria-label="Lane ${tr.row}, ${COLOURS[b.cls].label}, ${pitchLabel(noteOf(tr, b))}"><span class="chip">${esc(labelOf(tr, b))}</span></button>`;
    }
  }
  const el = $("#boxes");
  el.innerHTML = h;
  boxEls = new Map();
  el.querySelectorAll(".brick").forEach((e) => boxEls.set(+e.dataset.id, e));
}

function renderLanes() {
  let h = "";
  tracks.forEach((tr, i) => {
    const opts = Object.keys(INSTRUMENTS).map((k) => `<option value="${k}"${k === tr.instrument ? " selected" : ""}>${INSTRUMENTS[k].label}</option>`).join("");
    const bricks = tr.bricks.map((b) => {
      const c = COLOURS[b.cls], top = 2 + (1 - semitone(b.cls, state.scale) / 12) * (46 - 18 - 6);
      const fc = state.fruits && b.fruit ? `border-left:5px solid ${fruitById(b.fruit).hex};` : "";
      return `<button type="button" class="rb${b.id === sel ? " sel" : ""}" data-id="${b.id}" style="${fc}left:${(b.start / loopLen) * 100}%;width:calc(${(b.len / loopLen) * 100}% - 2px);top:${top}px;background:${c.hex};color:${textOn(c.hex)}" aria-label="Lane ${tr.row}, ${c.label}">${esc(labelOf(tr, b))}</button>`;
    }).join("");
    h += `<div class="lane"><div class="lane-head"><span class="num">${tr.row}</span>
      <select data-instr="${i}" aria-label="Instrument for lane ${tr.row}">${opts}</select>
      <button type="button" class="ms" data-act="mute" data-i="${i}" aria-pressed="${tr.mute}" aria-label="Mute lane ${tr.row}">M</button>
      <button type="button" class="ms" data-act="solo" data-i="${i}" aria-pressed="${tr.solo}" aria-label="Solo lane ${tr.row}">S</button></div>
      <div class="roll${tr.bricks.length ? "" : " empty"}" style="--n:${loopLen}">${bricks}<i class="rph"></i></div></div>`;
  });
  $("#lanes").innerHTML = h;
  rbEls = new Map();
  $("#lanes").querySelectorAll(".rb").forEach((e) => rbEls.set(+e.dataset.id, e));
  phEls = [...$("#lanes").querySelectorAll(".rph")];
  for (const tr of tracks) for (const b of tr.bricks) b._on = false;
}

const findSel = () => { for (const tr of tracks) { const b = tr.bricks.find((x) => x.id === sel); if (b) return [tr, b]; } return null; };

function renderSel() {
  const f = findSel(), p = $("#selpanel");
  p.hidden = !f;
  if (!f) return;
  const [tr, b] = f;
  p.innerHTML = `<p class="sel-head">Lane ${tr.row} · ${COLOURS[b.cls].label} · plays ${pitchLabel(noteOf(tr, b))} · ${b.len} studs</p>
    <div class="swatches" role="group" aria-label="Change colour">${COLOURS.map((c, i) => `<button type="button" class="sw-btn${i === b.cls ? " on" : ""}" data-cls="${i}" title="${c.label}" aria-label="${c.label}" style="background:${c.hex}"></button>`).join("")}</div>
    <div class="sel-actions"><button type="button" class="btn btn-small" data-act="shorter">Shorter</button><button type="button" class="btn btn-small" data-act="longer">Longer</button><button type="button" class="btn btn-small" data-act="remove">Remove</button><button type="button" class="btn btn-small" data-act="close">Done</button></div>`;
}

function brickSvg(n) {
  const w = n * 16 + 4;
  let s = `<svg viewBox="0 0 ${w} 36" width="${w}" height="36" aria-hidden="true" style="color:var(--ink)"><rect x="1" y="1" width="${w - 2}" height="34" rx="5" fill="currentColor" fill-opacity=".1" stroke="currentColor" stroke-opacity=".6"/>`;
  for (let i = 0; i < n; i++) s += `<circle cx="${10 + i * 16}" cy="11" r="4.5" fill="none" stroke="currentColor" stroke-opacity=".7"/><circle cx="${10 + i * 16}" cy="25" r="4.5" fill="none" stroke="currentColor" stroke-opacity=".7"/>`;
  return s + "</svg>";
}

function renderLegend() {
  $("#sizes").innerHTML = [[2, "1 beat · Plum"], [4, "2 beats · Apple"], [6, "3 beats · Banana"], [8, "4 beats · Watermelon"]].map(([n, t]) => `<div class="size">${brickSvg(n)}<span>${t}</span></div>`).join("");
  $("#chips").innerHTML = COLOURS.map((c, i) => `<button type="button" class="cbtn" data-play="${i}"><i style="background:${c.hex}"></i><span>${c.label}</span><b>${NOTE_NAMES[(state.key + semitone(i, state.scale)) % 12]}</b></button>`).join("");
  $("#fruits").innerHTML = FRUITS.map((f) => `<div class="fruit" data-fruitcard="${f.id}"><div class="fhead"><i style="background:${f.hex}"></i><b>${f.name}</b><span>${f.beats.join(" + ")}</span></div><div class="beats">${f.beats.map((d) => `<span class="bx" style="width:${d * 34}px">${d}</span>`).join("")}</div><p>${f.recipe}</p><button type="button" class="btn btn-small" data-fruit="${f.id}">Hear it</button></div>`).join("");
}

const toJson = () => JSON.stringify({
  grid: { studs_per_loop: loopLen, bpm: state.bpm, key: NOTE_NAMES[state.key], scale: state.scale },
  lanes: tracks.map((tr) => ({ lane: tr.row, instrument: tr.instrument, bricks: tr.bricks.map((b) => ({ colour: COLOURS[b.cls].id, start: b.start, length: b.len })) })),
}, null, 1);

function renderStatus() {
  if (!res) return;
  const n = tracks.reduce((a, t) => a + t.bricks.length, 0), un = tracks.reduce((a, t) => a + t.bricks.filter((b) => b.sure === false).length, 0);
  let t = `Found ${n} bricks in ${tracks.length} ${res.lanes ? "lanes" : "rows"} in ${Math.max(1, Math.round(res.ms))} ms. One loop is ${(loopLen * secPerStud()).toFixed(1)} s.`;
  t += un ? " Dashed bricks need a check: tap them." : " Tap a brick if it looks wrong.";
  if (!res.lanes) t += " Tip: tape across the plate makes clear lanes.";
  if (state.fruits) {
    const c = fruitCounts(tracks), list = FRUITS.filter((f) => c[f.id]).map((f) => `${f.name} ×${c[f.id]}`);
    t += list.length ? ` Fruits found: ${list.join(", ")}.` : " No fruit patterns found yet.";
  }
  setStatus(t);
}

function refresh() {
  loopLen = Math.max(1, ...tracks.flatMap((t) => t.bricks.map((b) => b.start + b.len)));
  annotateFruits(tracks);
  renderBoxes(); renderLanes(); renderSel(); renderLegend();
  $("#json").textContent = toJson();
  renderStatus();
}

/* ---------- playback ---------- */
// Notes are scheduled 140 ms ahead of the audio clock, one stud at a time, so edits and tempo changes apply straight away.
let playing = false, bus = null, tg = [], timer = null, raf = 0, nextTime = 0, step = 0, timeline = [], stopping = false;
const audible = (tr) => !tr.mute && (!tracks.some((t) => t.solo) || tr.solo);
const applyMix = () => tg.forEach((g, i) => tracks[i] && g.gain.setTargetAtTime(audible(tracks[i]) ? 1 : 0, audioNow(), 0.02));

function tick() {
  while (nextTime < audioNow() + 0.14) {
    if (!state.loop && step >= loopLen) {
      if (!stopping) { stopping = true; setTimeout(stopPlay, Math.max(0, (nextTime - audioNow() + 1.2) * 1000)); }
      return;
    }
    const st = step % loopLen;
    tracks.forEach((tr, i) => tr.bricks.forEach((b) => { if (b.start === st && tg[i]) voice(tr.instrument, hz(noteOf(tr, b)), nextTime, b.len * secPerStud(), tg[i]); }));
    timeline.push({ t: nextTime, s: step });
    nextTime += secPerStud();
    step++;
  }
  while (timeline.length > 3 && timeline[1].t < audioNow() - 0.5) timeline.shift();
}

function setActive(st) {
  for (const tr of tracks) for (const b of tr.bricks) {
    const on = st >= b.start && st < b.start + b.len;
    if (on !== !!b._on) { b._on = on; for (const e of [boxEls.get(b.id), rbEls.get(b.id)]) e?.classList.toggle("on", on); }
  }
}

function frame() {
  if (!playing) return;
  const now = audioNow();
  for (let i = timeline.length - 1; i >= 0; i--) {
    if (timeline[i].t <= now) {
      const pos = (timeline[i].s % loopLen) + Math.min(0.999, (now - timeline[i].t) / secPerStud());
      $("#ph").style.left = `${((res.fit.a + res.fit.b * pos) / res.W) * 100}%`;
      for (const e of phEls) e.style.left = `${(pos / loopLen) * 100}%`;
      setActive(Math.floor(pos));
      break;
    }
  }
  raf = requestAnimationFrame(frame);
}

const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>';
const ICON_STOP = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>';

function startPlay() {
  if (!res) return;
  ensureAudio();
  bus = gainNode();
  tg = tracks.map(() => gainNode(bus));
  applyMix();
  step = 0; nextTime = audioNow() + 0.1; timeline = []; stopping = false; playing = true;
  timer = setInterval(tick, 30);
  $("#stage").classList.add("playing"); $("#lanes").classList.add("playing");
  $("#play").innerHTML = ICON_STOP + "Stop";
  keepAwake();
  raf = requestAnimationFrame(frame);
}

function stopPlay() {
  playing = false;
  clearInterval(timer); cancelAnimationFrame(raf);
  if (bus) { const b = bus; b.gain.setTargetAtTime(0, audioNow(), 0.03); setTimeout(() => { try { b.disconnect(); } catch { /* already gone */ } }, 500); bus = null; }
  tg = [];
  setActive(-1);
  $("#stage").classList.remove("playing"); $("#lanes").classList.remove("playing");
  $("#play").innerHTML = ICON_PLAY + "Play";
  releaseWake();
}

function hearFruit(id) {
  ensureAudio();
  const f = fruitById(id), beat = 0.8, card = document.querySelector(`[data-fruitcard="${id}"]`);
  let t = audioNow() + 0.12;
  f.beats.forEach((d, i) => {
    voice("pluck", hz(72), t, d * beat);
    const el = card?.querySelectorAll(".bx")[i], wait = (t - audioNow()) * 1000;
    if (el) { setTimeout(() => el.classList.add("hit"), wait); setTimeout(() => el.classList.remove("hit"), wait + d * beat * 900); }
    t += d * beat;
  });
}

const preview = (midi) => { ensureAudio(); voice("pluck", hz(midi), audioNow() + 0.01, 0.4, masterBus()); };

/* ---------- events ---------- */
function select(id) {
  sel = sel === id ? null : id;
  renderBoxes(); renderLanes(); renderSel();
  const f = findSel();
  if (f) preview(noteOf(f[0], f[1]));
}

document.addEventListener("click", (e) => {
  const t = e.target;
  const br = t.closest(".brick, .rb");
  if (br) { select(+br.dataset.id); return; }
  const ex = t.closest("[data-example]");
  if (ex) { useSource(EXAMPLES[ex.dataset.example], true); return; }
  const fr = t.closest("[data-fruit]");
  if (fr) { hearFruit(fr.dataset.fruit); return; }
  const pl = t.closest("[data-play]");
  if (pl) { preview(midiOf("pluck", state.key, state.scale, +pl.dataset.play)); return; }
  const sw = t.closest(".sw-btn");
  if (sw) { const f = findSel(); if (f) { f[1].cls = +sw.dataset.cls; f[1].sure = true; refresh(); preview(noteOf(f[0], f[1])); } return; }
  const act = t.closest("[data-act]");
  if (!act) return;
  const a = act.dataset.act;
  if (a === "mute" || a === "solo") { const tr = tracks[+act.dataset.i]; tr[a] = !tr[a]; renderLanes(); applyMix(); return; }
  const f = findSel();
  if (!f) return;
  if (a === "shorter") f[1].len = Math.max(1, f[1].len - 1);
  if (a === "longer") f[1].len += 1;
  if (a === "remove") { f[0].bricks = f[0].bricks.filter((x) => x !== f[1]); sel = null; }
  if (a === "close") sel = null;
  refresh();
});

document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset?.instr !== undefined) { tracks[+t.dataset.instr].instrument = t.value; refresh(); }
});

async function openPhoto(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const url = URL.createObjectURL(file);
  if (await useSource(url, false)) { if (objUrl) URL.revokeObjectURL(objUrl); objUrl = url; } else URL.revokeObjectURL(url);
}

$("#play").addEventListener("click", () => (playing ? stopPlay() : startPlay()));
$("#choose").addEventListener("click", () => $("#photo").click());
$("#photo").addEventListener("change", async (e) => { await openPhoto(e.target.files?.[0]); e.target.value = ""; });
const stageEl = $("#stage");
stageEl.addEventListener("dragover", (e) => { e.preventDefault(); stageEl.classList.add("drag"); });
stageEl.addEventListener("dragleave", () => stageEl.classList.remove("drag"));
stageEl.addEventListener("drop", (e) => { e.preventDefault(); stageEl.classList.remove("drag"); openPhoto(e.dataTransfer.files?.[0]); });

$("#fruitsbtn").addEventListener("click", (e) => {
  state.fruits = !state.fruits;
  e.currentTarget.setAttribute("aria-pressed", String(state.fruits));
  e.currentTarget.textContent = state.fruits ? "Hide fruits" : "Show fruits";
  renderBoxes(); renderLanes(); renderStatus();
});
$("#bpm").addEventListener("input", (e) => { state.bpm = +e.target.value; $("#bpmv").textContent = `${state.bpm} beats a minute`; renderStatus(); });
$("#loop").addEventListener("change", (e) => { state.loop = e.target.checked; });
$("#key").innerHTML = NOTE_NAMES.map((n, i) => `<option value="${i}">${n}</option>`).join("");
$("#scale").innerHTML = Object.keys(SCALES).map((k) => `<option value="${k}">${SCALES[k].label}</option>`).join("");
$("#key").addEventListener("change", (e) => { state.key = +e.target.value; refresh(); });
$("#scale").addEventListener("change", (e) => { state.scale = e.target.value; refresh(); });
$("#copy").addEventListener("click", async () => {
  const pre = $("#json");
  try { await navigator.clipboard.writeText(pre.textContent); $("#copy").textContent = "Copied"; setTimeout(() => { $("#copy").textContent = "Copy"; }, 1500); }
  catch { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
});
document.addEventListener("visibilitychange", () => { if (playing) keepAwake(); });

$("#play").innerHTML = ICON_PLAY + "Play";
const ready = useSource(EXAMPLES.photo, true);
window.__brickBeats = { ready, state, get tracks() { return tracks; }, get res() { return res; }, load: useSource, play: startPlay, stop: stopPlay, get playing() { return playing; } };
registerServiceWorker("sw.js");
