// Brick Beats: photo of a brick mat → lanes of notes → playback with a moving line over the photo.
// UI and playback only; photo reading is vision.js, music rules rhythm.js, sound synth.js. Test hook: window.__brickBeats.
import { detect, probe } from "./vision.js";
import { findCorners, turnQuad, warp, distortion, snapTargets, snapPoint, plateShare } from "./correct.js";
import { SQ, edgesFrom, gridOf, laneIdx, colOf, splitTallest, removeEdge, reviveMapping } from "./grid.js";
import { clearFor, tidy, mergeTracks } from "./merge.js";
import { emptyProfile, learnColour, learnedClass, reviveProfile } from "./profile.js";
import { COLOURS, INSTRUMENTS, DEFAULT_INSTRUMENTS, SCALES, FRUITS, BEATS_PER_STUD, fruitById, semitone, midiOf, pitchLabel, hz, annotateFruits, fruitCounts } from "./rhythm.js";
import { NOTE_NAMES } from "../shared/music.js";
import { ensureAudio, audioNow, gainNode, masterBus, voice } from "./synth.js";
import { registerServiceWorker, keepAwake, releaseWake } from "../shared/pwa.js";

const EXAMPLES = { photo: new URL("./example-photo.jpg", import.meta.url).href, taped: new URL("./example-taped.png", import.meta.url).href };
import TESTLIST from "./examples/index.json";
const TESTPICS = import.meta.glob("./examples/*.png", { query: "?url", import: "default", eager: true }); // generated test photos, see examples/index.json
const $ = (s) => document.querySelector(s);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const textOn = (hex) => { const n = parseInt(hex.slice(1), 16); return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150 ? "#14201a" : "#ffffff"; };

// Colours the player taught it live in this browser only (localStorage), so the next photo starts out knowing them.
const PROFILE_KEY = "brick-beats-profile-v1";
let profile = emptyProfile();
try { profile = reviveProfile(localStorage.getItem(PROFILE_KEY) || ""); } catch { /* storage blocked: nothing is remembered */ }
const saveProfile = () => { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch { /* not saved */ } };

let uid = 1, res = null, tracks = [], loopLen = 20, sel = null, crop = null, objUrl = null;
let edges = [], laneTilt = 0, lastExample = true, dragged = false; // lane boundary lines (image y at x=0), their slope, and whether the last photo was an example
let grid = { x0: 0, pitch: 28, cols: 0, rect: false }, gap = 0, editing = false, selEdge = -1; // gap: width of the tape or space between lanes (px, 0 = lanes touch) // the column grid (cols 0 = not a fixed matrix: the loop is as long as the bricks), grid-editing mode, selected lane line
// What is remembered between photos of one mat: grid, lane lines and corners (grid.js). Saved in this browser only; "Reset grid" forgets it.
const MAP_KEY = "brick-beats-map-v1";
let mapping = null;
try { mapping = reviveMapping(localStorage.getItem(MAP_KEY) || ""); } catch { /* not remembered */ }
const saveMapping = () => { try { if (mapping) localStorage.setItem(MAP_KEY, JSON.stringify(mapping)); else localStorage.removeItem(MAP_KEY); } catch { /* not saved */ } };
const state = { bpm: 120, key: 0, scale: "pent", loop: true, fruits: false };

const secPerStud = () => (60 / state.bpm) * BEATS_PER_STUD;
const noteOf = (tr, b) => midiOf(tr.instrument, state.key, state.scale, b.cls);
const setStatus = (t, err) => { const s = $("#status"); s.textContent = t; s.classList.toggle("err", !!err); };

/* ---------- reading the photo ---------- */
function analyse(im, manualQuad) {
  const t0 = performance.now();
  const canvasOf = (w, h) => { const cv = document.createElement("canvas"); cv.width = w; cv.height = h; return cv; };
  // 1. whole plate in view: straighten it (perspective, rotation) and read the straightened view
  const BW = Math.min(1280, im.naturalWidth), BH = Math.max(1, Math.round((im.naturalHeight * BW) / im.naturalWidth));
  const big = canvasOf(BW, BH), bc = big.getContext("2d", { willReadFrequently: true });
  bc.drawImage(im, 0, 0, BW, BH);
  const bd = bc.getImageData(0, 0, BW, BH).data;
  let fixed = null, corr = null, f = null; // corr: how the straightening went: auto (found by the reader), prior (the last photo's corners), or manual (the player's)
  let prior = mapping?.quad && Math.abs(mapping.ar - BW / BH) < 0.05 ? mapping.quad.map(([u, v]) => [u * BW, v * BH]) : null;
  if (prior && !manualQuad) { const ps = plateShare(bd, BW, BH, prior); if (ps.inside < 0.45 || ps.ring > 0.3) prior = null; } // the plate is not where it was: do not trust the old corners
  if (manualQuad) {
    const quad = turnQuad(bd, BW, BH, manualQuad);
    fixed = warp(bd, BW, BH, quad); corr = { mode: "manual", quad, ...distortion(quad), sure: true };
  } else {
    f = findCorners(bd, BW, BH);
    if (f && (f.sure || !prior)) { fixed = warp(bd, BW, BH, f.quad); corr = { mode: "auto", quad: f.quad, score: f.score, level: f.level, sure: f.sure }; }
    else if (prior) { fixed = warp(bd, BW, BH, prior); corr = { mode: "prior", quad: prior, ...distortion(prior), sure: true }; } // not sure of this photo's corners: assume the camera has not moved
  }
  const shot = { url: big.toDataURL("image/jpeg", 0.85), W: BW, H: BH, quad: corr?.quad || f?.quad || null, data: bd }; // the photo as taken, for the corner editor
  let px, W, H, view = null;
  if (fixed) {
    px = fixed.data; W = fixed.W; H = fixed.H;
    const vc = canvasOf(W, H);
    vc.getContext("2d").putImageData(new ImageData(px, W, H), 0, 0);
    view = vc.toDataURL("image/jpeg", 0.88);
  } else { // 2. otherwise read the photo as it is
    W = 640; H = Math.max(1, Math.round((im.naturalHeight * W) / im.naturalWidth));
    const cv = canvasOf(W, H), c = cv.getContext("2d", { willReadFrequently: true });
    c.imageSmoothingQuality = "high";
    c.drawImage(im, 0, 0, W, H);
    px = c.getImageData(0, 0, W, H).data;
  }
  const r = detect(px, W, H, { classify: (rgb) => learnedClass(profile, rgb) });
  r.data = px; r.view = view; r.corr = corr; r.shot = shot; // kept so a tap can look at the photo again (addAt) and the straightened view can be shown
  r.ms = performance.now() - t0;
  return r;
}

let lastSrc = null, shot = null;
async function useSource(src, example, quad, reset) {
  setStatus("Reading the mat…");
  const im = new Image();
  im.src = src;
  try { await im.decode(); } catch { setStatus("That file could not be opened as a photo.", true); return false; }
  const r = analyse(im, quad);
  shot = r.shot; lastSrc = src;
  if (!r.ok) { setStatus(r.msg, true); if (!quad && !example) openCorners(); return false; }
  res = r;
  const rect = !!r.view; // straightened: the plate fills a known square, so lanes and columns can be a fixed matrix
  // 1. the matrix: from this photo, or the remembered one when it agrees (same number of lines) or the player set it by hand
  const centres = r.tracks.map((t) => (r.lanes && t.mid !== undefined ? t.mid / r.lanes.cs : t.bricks.length ? t.bricks.reduce((a, b) => a + b.y + b.h / 2, 0) / t.bricks.length : 0));
  let g = rect ? { ...gridOf(r.fit.a, r.fit.b), rect } : { x0: r.fit.a, pitch: r.fit.b, cols: 0, rect }, e = edgesFrom(centres), tilt = r.lanes ? r.lanes.sn / r.lanes.cs : 0, fromMap = false, gp = r.lanes ? Math.min(r.lanes.gap || 0.9 * r.fit.b, 1.5 * r.fit.b) : 0; // tape lanes: the gap is the tape's own width
  const m = mapping;
  if (m && !reset && rect && m.rect && Math.abs(r.fit.b / m.pitch - 1) < 0.12 && (m.edited || m.edges.length === e.length || !r.lanes)) { g = { x0: m.x0, pitch: m.pitch, cols: m.cols, rect }; e = m.edges.slice(); tilt = m.tilt; gp = m.gap; fromMap = true; }
  // 2. the bricks, snapped to the matrix: a column from their left edge, a lane from their middle
  const shift = rect ? Math.round((r.fit.a - g.x0) / g.pitch) : 0, lanesNew = Array.from({ length: e.length - 1 }, (_, i) => newTrack(i));
  r.tracks.forEach((t) => t.bricks.forEach((b) => {
    const start = fromMap ? Math.max(0, colOf(g, b.x)) : b.start + shift;
    lanesNew[laneIdx(e, tilt, b.x + b.w / 2, b.y + b.h / 2)].bricks.push({ id: uid++, cls: b.cls, sure: b.sure, rgb: b.rgb, start, len: b.len, user: false, seen: 1, box: { x: b.x, y: b.y, w: b.w, h: b.h } });
  }));
  lanesNew.forEach((t) => { t.bricks = tidy(t.bricks); });
  // a retake of the same mat keeps what is known (ids, edits, lane settings); a different mat starts fresh
  const old = !example && !lastExample && !reset ? tracks : [];
  const merged = mergeTracks(old, lanesNew);
  const keepSel = merged && findBy(sel);
  tracks = merged || lanesNew;
  if (!keepSel) sel = null;
  res.merged = !!merged;
  edges = e; laneTilt = tilt; grid = g; gap = gp; selEdge = -1; r.fit = { a: g.x0, b: g.pitch };
  if (!rect) { // free loop: nothing may start before the first stud
    const mn = Math.min(0, ...tracks.flatMap((t) => t.bricks.map((b) => b.start)));
    if (mn < 0) { tracks.forEach((t) => t.bricks.forEach((b) => { b.start -= mn; })); r.fit.a += mn * r.fit.b; grid.x0 = r.fit.a; }
  } else clampCols();
  tracks.forEach((t) => t.bricks.forEach((b) => { if (b.dirty) place(t, b); }));
  lastExample = !!example;
  if (rect) { // remember: the matrix, and the corners when they were found or given (the next photo is read with them as a reference)
    const quadN = r.corr && r.corr.sure ? r.corr.quad.map(([x, y]) => [x / r.shot.W, y / r.shot.H]) : null;
    mapping = { gap, rect, edges: e.slice(), tilt, x0: g.x0, pitch: g.pitch, cols: g.cols, edited: fromMap ? m.edited : false, quad: quadN || (reset ? null : m?.quad) || null, ar: quadN ? r.shot.W / r.shot.H : (!reset && m?.ar) || 0 };
    saveMapping();
  }
  rebuildGains(); // keep playing: the new lanes take over at the next note
  let x0 = r.plate.x0, x1 = r.plate.x1, y0 = r.plate.y0, y1 = r.plate.y1;
  if (rect) ({ x0, x1, y0, y1 } = SQ);
  for (const t of tracks) for (const b of t.bricks) { x0 = Math.min(x0, b.box.x); x1 = Math.max(x1, b.box.x + b.box.w); y0 = Math.min(y0, b.box.y); y1 = Math.max(y1, b.box.y + b.box.h); }
  const mg = 12;
  crop = { x0: Math.max(0, x0 - mg), x1: Math.min(r.W, x1 + mg), y0: Math.max(0, y0 - mg), y1: Math.min(r.H, y1 + mg) };
  // show only the plate: the photo is a wide "world" shifted and scaled inside the stage
  const cw = (crop.x1 - crop.x0) / r.W, ch = (crop.y1 - crop.y0) / r.H, world = $("#world");
  $("#stage").style.aspectRatio = `${crop.x1 - crop.x0} / ${crop.y1 - crop.y0}`;
  world.style.width = `${100 / cw}%`;
  world.style.aspectRatio = `${r.W} / ${r.H}`;
  world.style.left = `${(-crop.x0 / r.W / cw) * 100}%`;
  world.style.top = `${(-crop.y0 / r.H / ch) * 100}%`;
  $("#img").src = r.view || src;
  $("#tag").hidden = !example;
  $("#fixbtn").disabled = false; $("#gridbtn").disabled = false;
  refresh();
  if (!example && !quad && (!r.corr || !r.corr.sure)) openCorners(); // the reader is not sure where the square is: ask
  return true;
}

/* ---------- drawing ---------- */
let boxEls = new Map(), rbEls = new Map(), phEls = [];
const labelOf = (tr, b) => (state.fruits && b.fruit ? (b.fruitLead ? fruitById(b.fruit).name : "·") : pitchLabel(noteOf(tr, b)));

// Lane boundary lines: edges[k] is the y of line k at x=0; the lines share one slope. A brick belongs to the lane its centre is in.
const ey = (k, x) => edges[k] + x * laneTilt;
const laneAt = (y, x) => tracks[laneIdx(edges, laneTilt, x, y)];
const laneY = (tr, x) => { const i = tracks.indexOf(tr); return (ey(i, x) + ey(i + 1, x)) / 2; };
// The lane's own strip (inside its lines, less half the gap on each side): where its notes sit, exactly.
const laneBand = (tr, x) => { const i = tracks.indexOf(tr), h = (ey(i + 1, x) - ey(i, x)) / 2, m = Math.min(gap / 2, h * 0.8); return [ey(i, x) + m, ey(i + 1, x) - m]; };
const newTrack = (i) => ({ row: i + 1, instrument: DEFAULT_INSTRUMENTS[i % DEFAULT_INSTRUMENTS.length], mute: false, solo: false, bricks: [] });
const renumber = () => tracks.forEach((t, i) => { t.row = i + 1; });
const rebuildGains = () => { if (playing) { tg = tracks.map(() => gainNode(bus)); applyMix(); } };

// A brick's photo box follows its place on the grid (res.fit: px = a + b * studs) and its lane.
function place(tr, b) { const [y0, y1] = laneBand(tr, res.fit.a + res.fit.b * b.start); b.box = { x: res.fit.a + res.fit.b * b.start, w: res.fit.b * b.len, y: y0, h: y1 - y0 }; b.dirty = false; }

// Notes stay inside the matrix: when the matrix would end before a brick does, it grows to hold it (nothing is ever dropped).
function clampCols() {
  if (grid.cols) grid.cols = Math.max(grid.cols, ...tracks.flatMap((t) => t.bricks.map((b) => b.start + b.len)));
}

// The bricks sorted into the lanes that lines `e` would make, and whether two bricks in one lane would then overlap in time.
const lanesFor = (e) => {
  const lists = Array.from({ length: e.length - 1 }, () => []);
  for (const b of tracks.flatMap((t) => t.bricks)) lists[laneIdx(e, laneTilt, b.box.x + b.box.w / 2, b.box.y + b.box.h / 2)].push(b);
  return lists;
};
const clashes = (lists) => lists.some((l) => { const o = [...l].sort((a, b) => a.start - b.start); return o.some((b, i) => i && o[i - 1].start + o[i - 1].len > b.start); });

// After lane lines move, are added or removed: every brick joins the lane its centre is now in.
function regroup() {
  const all = tracks.flatMap((t) => t.bricks);
  tracks.forEach((t) => { t.bricks = []; });
  for (const b of all) laneAt(b.box.y + b.box.h / 2, b.box.x + b.box.w / 2).bricks.push(b);
  tracks.forEach((t) => { t.bricks = tidy(t.bricks); t.bricks.forEach((b) => b.dirty && place(t, b)); });
}

// The matrix was changed by hand: bricks the reader found stay where they are in the photo and re-snap to it; bricks the player placed move with it.
function commitGrid(oldPitch) {
  res.fit = { a: grid.x0, b: grid.pitch };
  const rescale = Math.abs(grid.pitch / oldPitch - 1) > 0.06;
  for (const t of tracks) for (const b of t.bricks) {
    if (b.user) { b.dirty = true; continue; }
    b.start = Math.max(0, colOf(grid, b.box.x));
    if (rescale) b.len = Math.max(1, Math.round(b.box.w / grid.pitch));
  }
  clampCols(); regroup();
  mapping = { ...(mapping || {}), gap, rect: grid.rect, edges: edges.slice(), tilt: laneTilt, x0: grid.x0, pitch: grid.pitch, cols: grid.cols, edited: true };
  mapping.quad ??= null; mapping.ar ??= 0;
  saveMapping();
}

function renderBoxes() {
  const W = res.W, H = res.H, xb = crop.x0 + 6, f = res.fit;
  let h = "";
  for (let k = 0; k <= loopLen; k++) h += `<i class="gl${k % 2 ? "" : " beat"}" style="left:${((f.a + f.b * k) / W) * 100}%"></i>`; // beats (heavy) and half-beats (thin)
  edges.forEach((_, k) => { h += `<i class="lline${editing ? "" : " thin"}${gap ? " gap" : ""}${k === selEdge ? " sel" : ""}" data-edge="${k}" style="top:${((ey(k, 0) - gap / 2) / H) * 100}%;${gap ? `height:${(gap / H) * 100}%;` : ""}transform:rotate(${Math.atan(laneTilt)}rad)" role="separator" aria-label="Lane line ${k + 1}: drag to move"></i>`; });
  if (editing) for (const [side, x] of [["l", f.a], ["r", f.a + f.b * loopLen]]) h += `<i class="cline" data-col="${side}" style="left:${(x / W) * 100}%" role="separator" aria-label="${side === "l" ? "Start" : "End"} of the columns: drag to move"></i>`;
  for (const tr of tracks) {
    h += `<span class="rownum" style="top:${(laneY(tr, xb) / H) * 100}%;left:${(xb / W) * 100}%">${tr.row}</span>`;
    for (const b of tr.bricks) {
      const fc = state.fruits && b.fruit ? `border-color:${fruitById(b.fruit).hex};` : "";
      const grips = b.id === sel ? '<i class="hl"></i><i class="hr"></i>' : "";
      const bx = f.a + f.b * b.start, [by0, by1] = laneBand(tr, bx); // exactly on the grid and inside the lane's lines
      h += `<button type="button" class="brick${b.id === sel ? " sel" : ""}${b.sure === false ? " unsure" : ""}${audible(tr) ? "" : " muted"}" data-id="${b.id}" style="${fc}left:${(bx / W) * 100}%;top:${(by0 / H) * 100}%;width:${((f.b * b.len) / W) * 100}%;height:${((by1 - by0) / H) * 100}%" aria-label="Lane ${tr.row}, ${COLOURS[b.cls].label}, ${pitchLabel(noteOf(tr, b))}"><span class="chip">${esc(labelOf(tr, b))}</span>${grips}</button>`;
    }
  }
  const el = $("#boxes");
  el.innerHTML = h;
  boxEls = new Map();
  el.querySelectorAll(".brick").forEach((e) => boxEls.set(+e.dataset.id, e));
  renderMutes();
}

// The column left of the photo: one button per lane, level with it.
function renderMutes() {
  const xb = crop.x0 + 6, ch = crop.y1 - crop.y0;
  $("#mutecol").innerHTML = tracks.map((tr, i) => `<button type="button" class="mc${audible(tr) ? "" : " off"}" data-act="mute" data-i="${i}" aria-pressed="${tr.mute}" aria-label="Mute lane ${tr.row}" style="top:${((laneY(tr, xb) - crop.y0) / ch) * 100}%">${audible(tr) ? "♪" : "✕"}</button>`).join("");
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

const findBy = (id) => { for (const tr of tracks) { const b = tr.bricks.find((x) => x.id === id); if (b) return [tr, b]; } return null; };
const findSel = () => findBy(sel);

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
  t += (un ? " Dashed bricks need a check: tap them." : " Tap a brick if it looks wrong.") + " Missed one? Tap it on the photo.";
  if (!res.lanes) t += " Tip: tape across the plate makes clear lanes.";
  const c = res.corr;
  if (!c) t += " Could not find the whole green square: tap Fix corners to mark it, or retake with the whole square in view.";
  else if (!c.sure) t += " Not sure where the corners of the square are: tap Fix corners to check them.";
  else if (c.level === "high") t += " The photo is very slanted. For the best reading, hold the phone straight above the mat with the whole square in view and retake, or tap Fix corners.";
  else t += c.mode === "manual" ? " Straightened with your corners." : c.mode === "prior" ? " Used the corners from your last photo: tap Fix corners if the mat moved." : " The photo was straightened first.";
  if (res.merged) t += " Joined with your earlier photo of this mat.";
  if (grid.cols) t += ` Grid: ${tracks.length} lanes × ${grid.cols} columns${mapping?.edited ? " (as you set it)" : ""}.`;
  if (state.fruits) {
    const c = fruitCounts(tracks), list = FRUITS.filter((f) => c[f.id]).map((f) => `${f.name} ×${c[f.id]}`);
    t += list.length ? ` Fruits found: ${list.join(", ")}.` : " No fruit patterns found yet.";
  }
  setStatus(t);
}

const renderLearned = () => { $("#learned").textContent = profile.colours.length ? `Remembers ${profile.colours.length} look${profile.colours.length === 1 ? "" : "s"} of colours you corrected.` : "Nothing learned yet: tap a brick, then a colour, to teach it."; };

function refresh() {
  loopLen = Math.max(1, grid.cols || 0, ...tracks.flatMap((t) => t.bricks.map((b) => b.start + b.len)));
  annotateFruits(tracks);
  renderBoxes(); renderLanes(); renderSel(); renderLegend(); renderLearned();
  $("#gaptoggle").textContent = gap ? "Gaps: on" : "Gaps: off"; $("#gaptoggle").setAttribute("aria-pressed", String(!!gap));
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

// A tap above the first or below the last lane line starts a new lane there (the reader missed one).
function ensureLane(cy, cx) {
  const hs = edges.slice(1).map((e, i) => e - edges[i]).sort((a, b) => a - b), h = hs[hs.length >> 1] || 60;
  let n = 0;
  while (n < 3 && cy < ey(0, cx)) { edges.unshift(edges[0] - h); tracks.unshift(newTrack(0)); n++; }
  while (n < 3 && cy > ey(edges.length - 1, cx)) { edges.push(edges[edges.length - 1] + h); tracks.push(newTrack(tracks.length)); n++; }
  if (n) { renumber(); rebuildGains(); commitGrid(grid.pitch); }
}

// Tap empty space on the photo to add a brick the reader missed: it looks at that spot again, then you can fix colour and length.
function addAt(e) {
  const r = $("#world").getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * res.W, y = ((e.clientY - r.top) / r.height) * res.H;
  const f = probe(res.data, res.W, res.H, res, x, y);
  if (!f) { setStatus("That is the green plate. Tap the brick itself to add it.", true); return; }
  if (grid.cols && f.start >= grid.cols) { setStatus("That is past the last column. Drag the right edge in Edit grid to make the loop longer.", true); return; }
  ensureLane(f.box.y + f.box.h / 2, f.box.x + f.box.w / 2);
  const tr = laneAt(f.box.y + f.box.h / 2, f.box.x + f.box.w / 2);
  if (f.start < 0) { tracks.forEach((t) => t.bricks.forEach((b) => { b.start -= f.start; })); res.fit.a += f.start * res.fit.b; f.start = 0; }
  const b = { id: uid++, cls: f.cls, sure: f.sure, rgb: f.rgb, start: f.start, len: f.len, user: true, seen: 1, box: f.box };
  tr.bricks.push(b);
  tr.bricks = clearFor(tr.bricks, b);
  tr.bricks.forEach((x) => x.dirty && place(tr, x));
  sel = b.id;
  refresh(); preview(noteOf(tr, b));
}

document.addEventListener("click", (e) => {
  const t = e.target;
  if (dragged || t.closest(".lline")) return; // the click that ends a drag
  const br = t.closest(".brick, .rb");
  if (br) { select(+br.dataset.id); return; }
  if (t.closest("#world") && res) { addAt(e); return; }
  const ex = t.closest("[data-example]");
  if (ex) { useSource(EXAMPLES[ex.dataset.example], true); return; }
  const fr = t.closest("[data-fruit]");
  if (fr) { hearFruit(fr.dataset.fruit); return; }
  const pl = t.closest("[data-play]");
  if (pl) { preview(midiOf("pluck", state.key, state.scale, +pl.dataset.play)); return; }
  const sw = t.closest(".sw-btn");
  if (sw) {
    const f = findSel();
    if (f) {
      f[1].cls = +sw.dataset.cls; f[1].sure = true; f[1].user = true;
      if (f[1].rgb) { learnColour(profile, f[1].cls, f[1].rgb); saveProfile(); } // an explicit correction: remember how this brick looked
      refresh(); preview(noteOf(f[0], f[1]));
    }
    return;
  }
  const act = t.closest("[data-act]");
  if (!act) return;
  const a = act.dataset.act;
  if (a === "addlane") { const sp = splitTallest(edges); edges = sp.edges; tracks.splice(sp.at, 0, newTrack(sp.at)); renumber(); selEdge = sp.at; rebuildGains(); commitGrid(grid.pitch); refresh(); return; }
  if (a === "dellane") { const e2 = removeEdge(edges, selEdge); if (!e2) { setStatus("Tap an inner lane line first, then Remove line.", true); return; } if (clashes(lanesFor(e2))) { setStatus("Those two lanes have notes at the same time. Move or remove some first.", true); return; } tracks.splice(selEdge, 1); edges = e2; selEdge = -1; renumber(); rebuildGains(); commitGrid(grid.pitch); refresh(); return; }
  if (a === "colsless" || a === "colsmore") {
    const end = Math.max(1, ...tracks.flatMap((t) => t.bricks.map((b) => b.start + b.len))), old = grid.pitch;
    grid = { ...grid, cols: Math.max(end, (grid.cols || loopLen) + (a === "colsmore" ? 1 : -1)), rect: true }; commitGrid(old); refresh(); return;
  }
  if (a === "gaptoggle" || a === "gapless" || a === "gapmore") {
    const base = Math.max(0.9 * grid.pitch, 4);
    gap = a === "gaptoggle" ? (gap ? 0 : base) : Math.max(0, gap + (a === "gapmore" ? 1 : -1) * 0.15 * grid.pitch);
    tracks.forEach((t) => t.bricks.forEach((b) => { b.dirty = true; })); tracks.forEach((t) => t.bricks.forEach((b) => place(t, b)));
    commitGrid(grid.pitch); refresh(); return;
  }
  if (a === "resetgrid") { mapping = null; saveMapping(); toggleGrid(false); if (lastSrc) useSource(lastSrc, lastExample, undefined, true); return; }
  if (a === "gridok") { toggleGrid(false); return; }
  if (a === "forget") { profile = emptyProfile(); saveProfile(); renderLearned(); return; }
  if (a === "mute" || a === "solo") { const tr = tracks[+act.dataset.i]; tr[a] = !tr[a]; renderLanes(); renderBoxes(); applyMix(); return; }
  const f = findSel();
  if (!f) return;
  if (a === "shorter" || a === "longer") {
    f[1].len = Math.max(1, f[1].len + (a === "longer" ? 1 : -1)); f[1].user = true;
    f[0].bricks = clearFor(f[0].bricks, f[1]); // the next brick makes way
    f[0].bricks.forEach((x) => (x === f[1] || x.dirty) && place(f[0], x));
  }
  if (a === "remove") { f[0].bricks = f[0].bricks.filter((x) => x !== f[1]); sel = null; }
  if (a === "close") sel = null;
  refresh();
});

document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset?.instr !== undefined) { tracks[+t.dataset.instr].instrument = t.value; refresh(); }
  if (t.id === "testpics" && t.value) { useSource(TESTPICS[`./examples/${t.value}.png`], true); t.value = ""; }
});
for (const x of TESTLIST) $("#testpics").add(new Option(x.title, x.id));

/* ---------- dragging on the photo: bricks (move, stretch from either end), lane lines and the column edges ---------- */
$("#boxes").addEventListener("pointerdown", (e) => {
  const el = e.target.closest(".brick, .lline, .cline");
  if (!el || !res || e.button) return;
  const kind = el.classList.contains("lline") ? "edge" : el.classList.contains("cline") ? "col" : "brick";
  const k = res.W / $("#world").getBoundingClientRect().width, fit = res.fit, x0 = e.clientX, y0 = e.clientY;
  const part = e.target.closest(".hl") ? "l" : e.target.closest(".hr") ? "r" : "m";
  const [tr0, b] = kind === "brick" ? findBy(+el.dataset.id) || [] : [];
  if (kind === "brick" && !b) return;
  const k0 = kind === "edge" ? +el.dataset.edge : 0, e0 = kind === "edge" ? edges[k0] : 0, g0 = { ...grid }, nc = g0.cols || loopLen, maxC = grid.cols || Infinity;
  const o = b && { s: b.start, l: b.len, x: fit.a + fit.b * b.start, w: fit.b * b.len, cy: laneY(tr0, fit.a + fit.b * b.start) };
  let moved = false, to = null, gnew = null;
  el.setPointerCapture(e.pointerId);
  const move = (ev) => {
    const dx = (ev.clientX - x0) * k, dy = (ev.clientY - y0) * k;
    if (!moved && Math.hypot(dx, dy) < 5 * k) return;
    moved = true;
    if (kind === "edge") {
      edges[k0] = Math.min(Math.max(e0 + dy, (edges[k0 - 1] ?? -Infinity) + 12), (edges[k0 + 1] ?? Infinity) - 12);
      el.style.top = `${((edges[k0] - gap / 2) / res.H) * 100}%`;
      return;
    }
    if (kind === "col") { // left edge: slide the whole grid; right edge: stretch the stud size
      gnew = el.dataset.col === "l" ? { ...g0, x0: g0.x0 + dx } : { ...g0, pitch: Math.max(8, g0.pitch + dx / nc) };
      el.style.left = `${((gnew.x0 + (el.dataset.col === "l" ? 0 : gnew.pitch * nc)) / res.W) * 100}%`;
      return;
    }
    const ds = Math.round(dx / fit.b);
    let s = o.s, l = o.l;
    if (part === "m") s = Math.min(maxC - o.l, Math.max(0, o.s + ds));
    else if (part === "r") l = Math.max(1, Math.min(maxC - o.s, o.l + ds));
    else { s = Math.min(o.s + o.l - 1, Math.max(0, o.s + ds)); l = o.l + o.s - s; }
    const lane = part === "m" ? laneAt(o.cy + dy, o.x + o.w / 2) : tr0;
    to = { s, l, lane };
    el.style.left = `${((o.x + (s - o.s) * fit.b) / res.W) * 100}%`;
    el.style.width = `${((o.w + (l - o.l) * fit.b) / res.W) * 100}%`;
    if (part === "m") { const [y0, y1] = laneBand(lane, o.x); el.style.top = `${(y0 / res.H) * 100}%`; el.style.height = `${((y1 - y0) / res.H) * 100}%`; }
  };
  const up = (ev) => {
    el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up);
    if (!moved) { if (kind === "edge") { selEdge = k0; renderBoxes(); } return; }
    dragged = true; setTimeout(() => { dragged = false; }, 0);
    if (kind === "edge") {
      selEdge = k0;
      if (clashes(lanesFor(edges))) { edges[k0] = e0; setStatus("That line would put two notes at the same time in one lane, so it went back.", true); } else commitGrid(grid.pitch);
    }
    else if (kind === "col") { if (gnew) { grid = { ...gnew, cols: nc, rect: true }; commitGrid(g0.pitch); } }
    else if (to && ev.type === "pointerup") {
      const { s, l, lane } = to;
      if (lane !== tr0) { tr0.bricks = tr0.bricks.filter((x) => x !== b); lane.bricks.push(b); }
      b.start = s; b.len = l; b.user = true;
      lane.bricks = clearFor(lane.bricks, b);
      lane.bricks.forEach((x) => (x === b || x.dirty) && place(lane, x));
      sel = b.id;
    }
    refresh();
  };
  el.addEventListener("pointermove", move); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
});

/* ---------- fixing the corners by hand ---------- */
const dlg = $("#corners"), cdots = [...dlg.querySelectorAll(".cdot")];
let cq = [], snapT = null; // the dots, and what they can snap to (plate corners, strong colour corners)
function drawCorners() {
  const w = shot.W, h = shot.H, d = distortion(cq);
  $("#cpoly").setAttribute("points", cq.map((p) => p.join(",")).join(" "));
  cdots.forEach((e, i) => { e.style.left = `${(cq[i][0] / w) * 100}%`; e.style.top = `${(cq[i][1] / h) * 100}%`; });
  $("#cscore").textContent = d.level === "high" ? "Very slanted: the reading will be rough. Retake from straight above if you can." : d.level === "ok" ? "A little slanted: fine, it will be straightened." : "Looks straight on.";
}
function openCorners() {
  if (!shot || dlg.open) return;
  const w = shot.W, h = shot.H;
  cq = shot.quad ? shot.quad.map((p) => p.slice()) : [[0.2 * w, 0.2 * h], [0.8 * w, 0.2 * h], [0.8 * w, 0.8 * h], [0.2 * w, 0.8 * h]];
  $("#cimg").src = shot.url;
  snapT = null; const sh = shot; setTimeout(() => { try { if (shot === sh) snapT = snapTargets(sh.data, sh.W, sh.H); } catch { /* no snapping */ } }, 60);
  $("#cwrap").style.width = `min(100%, ${(70 * w) / h}vh)`; // whole photo visible, dots map straight onto it
  $("#cpoly-svg").setAttribute("viewBox", `0 0 ${w} ${h}`);
  drawCorners();
  dlg.showModal();
}
cdots.forEach((e, i) => e.addEventListener("pointerdown", (ev) => {
  e.setPointerCapture(ev.pointerId);
  const mv = (m) => {
    const r = $("#cwrap").getBoundingClientRect();
    cq[i] = [Math.min(shot.W, Math.max(0, ((m.clientX - r.left) / r.width) * shot.W)), Math.min(shot.H, Math.max(0, ((m.clientY - r.top) / r.height) * shot.H))];
    drawCorners();
  };
  const up = () => {
    if ($("#snapon").checked && snapT) { cq[i] = snapPoint(snapT, cq[i][0], cq[i][1], 0.07 * shot.W); drawCorners(); } // let go near a corner: land on it
    e.removeEventListener("pointermove", mv); e.removeEventListener("pointerup", up); e.removeEventListener("pointercancel", up); };
  e.addEventListener("pointermove", mv); e.addEventListener("pointerup", up); e.addEventListener("pointercancel", up);
}));
$("#fixbtn").addEventListener("click", openCorners);
$("#cno").addEventListener("click", () => dlg.close());
$("#cok").addEventListener("click", () => { const q = cq.map((p) => p.slice()); dlg.close(); useSource(lastSrc, lastExample, q); });

async function openPhoto(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const url = URL.createObjectURL(file);
  if (await useSource(url, false)) { if (objUrl) URL.revokeObjectURL(objUrl); objUrl = url; } else URL.revokeObjectURL(url);
}

function toggleGrid(on) {
  editing = on; selEdge = -1;
  $("#gridbar").hidden = !on; $("#gridbtn").setAttribute("aria-pressed", String(on));
  if (res) renderBoxes();
}
$("#gridbtn").addEventListener("click", () => toggleGrid(!editing));
$("#play").addEventListener("click", () => (playing ? stopPlay() : startPlay()));
$("#choose").addEventListener("click", () => $("#photo").click());
$("#snap").addEventListener("click", () => $("#cam").click()); // capture="environment" asks phones for the back camera
for (const id of ["#photo", "#cam"]) $(id).addEventListener("change", async (e) => { await openPhoto(e.target.files?.[0]); e.target.value = ""; });
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
window.__brickBeats = { ready, state, get tracks() { return tracks; }, get res() { return res; }, load: useSource, play: startPlay, stop: stopPlay, get playing() { return playing; }, get grid() { return grid; }, get mapping() { return mapping; }, get edges() { return edges; } };
registerServiceWorker("sw.js");
