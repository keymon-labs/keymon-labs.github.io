// Voice Pad app: touch pad, Gloop the singer (canvas), Song mode (lyrics, guide, takes). Rules: logic.js, lyrics.js · Sound: voice.js · Data: songs.json · Look: style.css
import { noteName } from "../shared/music.js";
import { VOICES, SCALES, VOWELS, REGISTERS, xToMidi, yToVowel, vowelById, scaleNotes, register, midiToHz, vibratoCents, consonantClass, parseTune, planSong, eventAt, sampleAt } from "./logic.js";
import { syllabify } from "./lyrics.js";
import { startAudio, sing, hush, burst, tick } from "./voice.js";
import SONGS from "./songs.json";

const $ = (id) => document.getElementById(id), cv = $("cv"), g = cv.getContext("2d");
const TAKES_KEY = "voicepad.takes", CTL_H = 250;
const s = { voice: "tenor", scale: "pentatonic", mode: "pad", finger: { down: false, midi: 60, y: 0.5 }, glow: null, on: false, x: 0.5, y: 0.5, speed: 0,
  midi: 60, vowel: yToVowel(0.5), t: 0, bounce: 0, mouth: [0.3, 0.2], notes: [], song: null };
let W = 0, H = 0, pad = { x: 0, y: 0, w: 0, h: 0 }, face = { x: 0, y: 0, r: 0 }, last = null;
const clamp01 = (v) => Math.min(1, Math.max(0, v)), place = (el, r) => Object.assign(el.style, { left: r.x + "px", top: r.y + "px", width: r.w + "px", height: r.h + "px" });

function layout() {
  const dpr = devicePixelRatio || 1, m = 10, song = s.mode === "song";
  W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const wd = W > H * 1.1;
  let box, lyr, ctl;
  if (wd) {
    const ch = Math.min(CTL_H, H - 54 - 2 * m - 130);   // keep the pad usable on short screens
    box = { x: 0, y: 40, w: W * 0.36, h: H - 40 - (song ? 120 : 0) };
    lyr = { x: m, y: H - 110 - m, w: W * 0.36 - 2 * m, h: 110 };
    ctl = { x: W * 0.36, y: H - m - ch, w: W * 0.64 - m, h: ch };
    pad = { x: W * 0.36, y: 54, w: W * 0.64 - m, h: H - 54 - m - (song ? ch + m : 0) };
  } else if (song) {
    box = { x: 0, y: 40, w: W, h: H * 0.22 };
    lyr = { x: m, y: 40 + H * 0.22, w: W - 2 * m, h: 58 };
    ctl = { x: m, y: H - CTL_H - m, w: W - 2 * m, h: CTL_H };
    pad = { x: m, y: lyr.y + lyr.h + 4, w: W - 2 * m, h: ctl.y - m - (lyr.y + lyr.h + 4) };
  } else {
    box = { x: 0, y: 40, w: W, h: H * 0.4 - 40 };
    pad = { x: m, y: H * 0.4, w: W - 2 * m, h: H * 0.6 - m };
  }
  face = { x: box.x + box.w / 2, y: box.y + box.h / 2, r: Math.min(box.w * 0.34, box.h * 0.36) };
  if (song) { place($("song"), ctl); place($("lyr"), lyr); }
}

/* ---------- finger ---------- */
function touch(px, py) {
  const x = (px - pad.x) / pad.w, y = (py - pad.y) / pad.h, now = performance.now();
  if (last) s.speed = Math.hypot(x - last.x, y - last.y) / Math.max(0.016, (now - last.t) / 1000);
  last = { x, y, t: now };
  s.x = clamp01(x); s.y = clamp01(y); s.glow = { x: s.x, y: s.y };
  const midi = xToMidi(s.x, s.voice, s.scale);
  s.finger = { down: true, midi, y: s.y };
  if (s.mode === "song") return record();      // the sound is driven by tickSong
  s.midi = midi; s.vowel = yToVowel(s.y); s.on = true;
  sing(midiToHz(midi), s.vowel.f, vibratoCents(s.speed));
  const r = register(midi, s.voice);
  $("hNote").textContent = `${noteName(Math.round(midi), "letters")} · ${s.vowel.id}`;
  $("hReg").textContent = `${r} voice`; $("hReg").title = REGISTERS[r];
}
function release() {
  s.finger = { ...s.finger, down: false }; last = null; s.speed = 0;
  if (s.mode === "song") { if (s.song?.kind === "sing") s.glow = null; return record(); }
  s.on = false; s.glow = null; hush();
}
cv.addEventListener("pointerdown", (e) => { cv.setPointerCapture(e.pointerId); startAudio(); touch(e.offsetX, e.offsetY); });
cv.addEventListener("pointermove", (e) => { if (s.finger.down) touch(e.offsetX, e.offsetY); });
for (const ev of ["pointerup", "pointercancel"]) cv.addEventListener(ev, release);

/* ---------- song session: sing (live finger), hear (the song itself), take (recorded finger) ---------- */
function currentCfg() {
  const song = SONGS.find((x) => x.id === $("oSong").value), bpm = +$("oBpm").value;
  if (song) return { songId: song.id, text: song.sing, explicit: true, tune: parseTune(song.notes), shown: syllabify(song.lyrics, { explicit: true }), bpm };
  return { songId: null, text: $("tText").value, explicit: false, tune: null, bpm };
}
function takeCfg(t) {
  const song = SONGS.find((x) => x.id === t.songId);
  return { songId: t.songId, text: song ? song.sing : t.text, explicit: !!song, tune: song ? parseTune(song.notes) : null, shown: song ? syllabify(song.lyrics, { explicit: true }) : null, bpm: t.bpm };
}

function startSession(kind, take) {
  stopSession(); startAudio();
  const cfg = take ? takeCfg(take) : currentCfg(), syls = syllabify(cfg.text, { explicit: cfg.explicit }).slice(0, 400);
  if (!syls.length) return say("Type some words to sing.");
  if (kind === "hear" && !cfg.tune) return say("Pick a song to hear it.");
  const events = planSong(syls, cfg.tune, { voice: take?.voice ?? s.voice, bpm: cfg.bpm }), shown = cfg.shown ?? syls;
  $("lyr").replaceChildren(...shown.flatMap((x, i) => { const sp = document.createElement("span"); sp.textContent = x.text; sp.dataset.i = i; return [sp, document.createTextNode(x.wordEnd ? " " : "")]; }));
  $("lyr").hidden = false; $("lyr").scrollTop = 0;
  if (take) { s.voice = take.voice; s.scale = take.scale; $("oVoice").value = s.voice; $("oScale").value = s.scale; }
  s.song = { kind, cfg, events, take, spb: 60 / cfg.bpm, start: performance.now(), countIn: kind === "take" ? 0 : 4, beat: -1, idx: -1, t: -9, rec: [], recStarted: false, lastRec: 0, voiced: false, click: $("oClick").checked };
  $("bSing").textContent = "■ Stop"; say("");
}
function stopSession() {
  const sg = s.song; if (!sg) return;
  s.song = null; s.on = false; s.glow = null; hush();
  if (sg.kind === "sing" && sg.rec.some((r) => r.d)) saveTake(sg);
  $("bSing").textContent = "● Sing"; $("lyr").hidden = true;
}
const say = (msg) => { $("tMsg").textContent = msg; };

function record() {
  const sg = s.song; if (!sg || sg.kind !== "sing" || sg.t < 0 || sg.rec.length > 6000) return;
  const now = performance.now(), f = s.finger;
  if (f.down && sg.rec.at(-1)?.d && now - sg.lastRec < 30) return;
  sg.rec.push({ t: +sg.t.toFixed(3), d: f.down ? 1 : 0, m: +f.midi.toFixed(2), y: +f.y.toFixed(2) }); sg.lastRec = now;
}

const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
function tickSong(now) {
  const sg = s.song; if (!sg) return;
  const el = (now - sg.start) / 1000, beat = Math.floor(el / sg.spb);
  if (beat !== sg.beat) {
    sg.beat = beat;
    if (beat < sg.countIn || (sg.click && beat >= 0)) tick(beat % 4 === 0);
    if (beat < sg.countIn) $("hNote").textContent = `Count-in ${sg.countIn - beat}`;
  }
  const t = sg.t = el - sg.countIn * sg.spb;
  if (t < 0) return;
  if (!sg.recStarted) { sg.recStarted = true; record(); }
  const last = sg.events.at(-1);
  if (t > last.start + last.dur + 0.3) return stopSession();
  const i = eventAt(sg.events, t), ev = i >= 0 ? sg.events[i] : null;
  if (ev && i !== sg.idx) {
    sg.idx = i; burst(consonantClass(ev.syl.onset));
    const cur = $("lyr").querySelector(".now"); cur?.classList.remove("now");
    const sp = $("lyr").querySelector(`[data-i="${i}"]`); sp?.classList.add("now"); if (sp) $("lyr").scrollTop = sp.offsetTop - 8;
  }
  let src;
  if (sg.kind === "sing") src = s.finger;
  else if (sg.kind === "take") { const sm = sampleAt(sg.take.samples, t); src = sm ? { down: !!sm.d, midi: sm.m, y: sm.y } : { down: false }; }
  else src = { down: !!ev, midi: ev?.midi, y: 0.35 };
  const frac = ev ? (t - ev.start) / ev.dur : 1;
  if (ev && src.down && frac < 0.94) {
    const a = vowelById(ev.syl.vowels[0]), b = vowelById(ev.syl.vowels.at(-1)), k = a === b ? 0 : smooth(0.4, 0.7, frac), mix = (u, v) => u + (v - u) * k;
    const f = a.f.map((v, n) => mix(v, b.f[n])), mouth = a.mouth.map((v, n) => mix(v, b.mouth[n]));
    sing(midiToHz(src.midi), f, vibratoCents(sg.kind === "sing" ? s.speed : 0), 0.15 + 0.55 * (1 - src.y));
    s.on = true; s.midi = src.midi; s.vowel = { id: a.id, f, mouth }; sg.voiced = true;
    const { lo, hi } = VOICES[s.voice]; s.glow = { x: clamp01((src.midi - lo) / (hi - lo)), y: src.y };
    $("hNote").textContent = `${noteName(Math.round(src.midi), "letters")} · ${ev.syl.text}`;
  } else if (sg.voiced) { sg.voiced = false; s.on = false; hush(); if (sg.kind !== "sing") s.glow = null; }
}

/* ---------- takes (saved on this device only) ---------- */
function loadTakes() { try { return JSON.parse(localStorage.getItem(TAKES_KEY) || "[]"); } catch { return []; } }
function saveTake(sg) {
  const takes = loadTakes(), n = (takes.at(-1)?.n ?? 0) + 1, c = sg.cfg;
  takes.push({ n, songId: c.songId, text: c.text, bpm: c.bpm, voice: s.voice, scale: s.scale, samples: sg.rec });
  while (takes.length > 12) takes.shift();
  try { localStorage.setItem(TAKES_KEY, JSON.stringify(takes)); say(`Saved Take ${n}.`); } catch { say("Could not save this take: browser storage is full."); }
  refreshTakes();
}
function refreshTakes() {
  $("tTakes").replaceChildren(...loadTakes().map((t) => {
    const row = document.createElement("div"), play = document.createElement("button"), del = document.createElement("button");
    row.className = "take"; play.textContent = `▶ Take ${t.n} · ${SONGS.find((x) => x.id === t.songId)?.title ?? "own words"}`; del.textContent = "✕"; del.setAttribute("aria-label", `Delete take ${t.n}`);
    play.onclick = () => startSession("take", t);
    del.onclick = () => { try { localStorage.setItem(TAKES_KEY, JSON.stringify(loadTakes().filter((x) => x.n !== t.n))); } catch {} refreshTakes(); };
    row.append(play, del); return row;
  }));
}

/* ---------- drawing ---------- */
function draw(ts) {
  const dt = Math.min(0.05, (ts - s.t) / 1000 || 0.016); s.t = ts;
  tickSong(performance.now());
  g.clearRect(0, 0, W, H);
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#3b3478"); bg.addColorStop(1, "#1d1a3a");
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  drawPad(); drawGloop(dt); requestAnimationFrame(draw);
}

function drawPad() {
  const { lo, hi } = VOICES[s.voice], { x, y, w, h } = pad, song = s.mode === "song";
  g.fillStyle = "rgba(255,255,255,.08)"; g.beginPath(); g.roundRect(x, y, w, h, 18); g.fill();
  g.font = "600 12px system-ui"; g.textBaseline = "middle";
  if (!song) VOWELS.forEach((v, i) => {            // vowel bands, top to bottom
    const yy = y + (h * i) / (VOWELS.length - 1);
    g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(x + 8, yy, w - 16, 1);
    g.fillStyle = "rgba(255,255,255,.7)"; g.textAlign = "left"; g.fillText(v.id, x + 12, Math.min(y + h - 30, Math.max(y + 12, yy)));
  });
  else { g.fillStyle = "rgba(255,255,255,.55)"; g.textAlign = "right"; g.fillText("louder ↑", x + w - 12, y + 14); g.fillText("softer ↓", x + w - 12, y + h - 30); }
  const notes = scaleNotes(s.scale, lo, hi); g.textAlign = "center";
  for (const m of notes) {                         // note lines
    const xx = x + ((m - lo) / (hi - lo)) * w, root = m % 12 === 0;
    g.fillStyle = root ? "rgba(255,210,90,.5)" : "rgba(255,255,255,.2)"; g.fillRect(xx - 1, y + 8, 2, h - 16);
    if (notes.length < 16 || root) { g.fillStyle = root ? "#ffd25a" : "rgba(255,255,255,.75)"; g.fillText(noteName(m, "letters"), xx, y + h - 12); }
  }
  const sg = s.song;
  if (sg?.cfg.tune && sg.kind !== "take") {        // guide rings: the note to sing now and the next two
    const from = Math.max(0, sg.events.findIndex((e) => sg.t < e.start + e.dur));
    for (let k = 0; k < 3 && sg.events[from + k]; k++) {
      const gx = x + clamp01((sg.events[from + k].midi - lo) / (hi - lo)) * w, r = k ? 14 : 22 + 3 * Math.sin(s.t / 120);
      g.strokeStyle = k ? "rgba(255,255,255,.4)" : "#ffd25a"; g.lineWidth = k ? 2 : 4; g.beginPath(); g.arc(gx, y + h * 0.5, r, 0, 7); g.stroke();
    }
  }
  if (s.glow) {
    const px = x + s.glow.x * w, py = y + s.glow.y * h, gl = g.createRadialGradient(px, py, 0, px, py, 46);
    gl.addColorStop(0, "rgba(255,255,255,.95)"); gl.addColorStop(1, "rgba(124,92,255,0)");
    g.fillStyle = gl; g.beginPath(); g.arc(px, py, 46, 0, 7); g.fill();
  }
}

function drawGloop(dt) {
  const hue = (((s.midi % 12) + 12) % 12) * 30, k = 1 - Math.exp(-dt * 14);
  const targetM = s.on ? s.vowel.mouth : [0.3, 0.1];
  s.mouth = s.mouth.map((v, i) => v + (targetM[i] - v) * k);
  const lift = s.on ? ((s.midi - VOICES[s.voice].lo) / (VOICES[s.voice].hi - VOICES[s.voice].lo)) * face.r * 0.5 : 0;
  s.bounce += (lift - s.bounce) * k;
  const wob = s.on ? Math.sin(s.t / 90) * 0.03 * (1 + (s.speed > 0.15 ? 0 : 1)) : Math.sin(s.t / 600) * 0.02;
  const cx = face.x, cy = face.y - s.bounce, r = face.r;
  g.fillStyle = "rgba(0,0,0,.25)"; g.beginPath(); g.ellipse(face.x, face.y + r * 1.05, r * (0.9 - s.bounce / r * 0.4), r * 0.18, 0, 0, 7); g.fill();
  g.fillStyle = `hsl(${hue} 75% 62%)`; g.beginPath();
  g.ellipse(cx, cy, r * (1 + wob), r * (1.05 - wob), 0, 0, 7); g.fill();
  const look = s.on ? (s.x - 0.5) * 0.12 * r : 0, lookY = s.on ? (s.y - 0.5) * 0.1 * r : 0;
  for (const side of [-1, 1]) {                    // eyes follow the finger
    const ex = cx + side * r * 0.38, ey = cy - r * 0.28;
    g.fillStyle = "#fff"; g.beginPath(); g.ellipse(ex, ey, r * 0.2, r * 0.24, 0, 0, 7); g.fill();
    g.fillStyle = "#231f3d"; g.beginPath(); g.arc(ex + look, ey + lookY, r * 0.1, 0, 7); g.fill();
  }
  g.strokeStyle = "#231f3d"; g.lineWidth = r * 0.06; g.lineCap = "round"; g.beginPath(); // eyebrows rise with pitch
  const brow = s.on ? -(s.x - 0.5) * r * 0.15 : 0;
  for (const side of [-1, 1]) { g.moveTo(cx + side * r * 0.2, cy - r * 0.6 + brow); g.lineTo(cx + side * r * 0.55, cy - r * 0.62 - brow * side); }
  g.stroke();
  g.fillStyle = "#4a1030"; g.beginPath();           // mouth shape comes from the vowel
  g.ellipse(cx, cy + r * 0.32, r * 0.5 * s.mouth[0], r * 0.04 + r * 0.38 * s.mouth[1], 0, 0, 7); g.fill();
  if (s.mouth[1] > 0.5) { g.fillStyle = "#ff6b8a"; g.beginPath(); g.ellipse(cx, cy + r * 0.45, r * 0.25 * s.mouth[0], r * 0.1 * s.mouth[1], 0, 0, 7); g.fill(); }
  if (s.on && Math.random() < dt * 6) s.notes.push({ x: cx + (Math.random() - 0.5) * r, y: cy - r, life: 1, ch: ["♪", "♫"][Math.random() < 0.5 ? 0 : 1] });
  g.font = `${r * 0.35}px system-ui`; g.textAlign = "center";
  s.notes = s.notes.filter((n) => (n.life -= dt * 0.7) > 0);
  for (const n of s.notes) { n.y -= dt * r * 0.8; g.fillStyle = `hsl(${hue} 90% 80% / ${n.life})`; g.fillText(n.ch, n.x, n.y); }
}

/* ---------- menu and controls ---------- */
function setMode(mode) {
  stopSession(); release(); s.mode = mode; s.glow = null;
  if (mode === "song" && s.scale === "pentatonic") { s.scale = "major"; $("oScale").value = "major"; }   // the songs need F and B
  $("song").hidden = mode !== "song"; $("lyr").hidden = true; $("hReg").textContent = ""; $("hNote").textContent = "Touch the pad";
  $("mPad").classList.toggle("sel", mode === "pad"); $("mSong").classList.toggle("sel", mode === "song");
  layout();
}
function pickSong() {
  const song = SONGS.find((x) => x.id === $("oSong").value);
  $("tText").readOnly = !!song; $("bHear").disabled = !song;
  if (song) { $("tText").value = song.lyrics; $("oBpm").value = song.bpm; $("vBpm").textContent = song.bpm; }
}

function fillMenu() {
  $("oVoice").innerHTML = Object.entries(VOICES).map(([id, v]) => `<option value="${id}">${v.label}</option>`).join("");
  $("oScale").innerHTML = Object.entries(SCALES).map(([id, v]) => `<option value="${id}">${v.label}</option>`).join("");
  $("oVoice").value = s.voice; $("oScale").value = s.scale;
  $("tVoices").innerHTML = Object.values(VOICES).map((v) => `<li><b>${v.label}</b>: ${v.about}</li>`).join("");
  $("tRegisters").innerHTML = Object.values(REGISTERS).map((t) => `<li>${t}</li>`).join("");
  $("tVowels").innerHTML = VOWELS.map((v) => `<li><b>${v.id}</b>: ${v.f.join(", ")} Hz</li>`).join("");
  $("oSong").innerHTML = `<option value="">Own words</option>` + SONGS.map((x) => `<option value="${x.id}">${x.title}</option>`).join("");
  $("oSong").value = SONGS[0].id; pickSong(); refreshTakes();
}
$("oVoice").onchange = (e) => { s.voice = e.target.value; };
$("oScale").onchange = (e) => { s.scale = e.target.value; };
$("oSong").onchange = () => { stopSession(); pickSong(); };
$("oBpm").oninput = (e) => { $("vBpm").textContent = e.target.value; };
$("mPad").onclick = () => setMode("pad");
$("mSong").onclick = () => setMode("song");
$("bSing").onclick = () => (s.song ? stopSession() : startSession("sing"));
$("bHear").onclick = () => startSession("hear");
$("btnPlay").onclick = () => { startAudio(); $("ovMenu").hidden = true; };
$("btnMenu").onclick = () => { stopSession(); release(); $("ovMenu").hidden = false; };

fillMenu(); addEventListener("resize", layout); layout(); requestAnimationFrame(draw);
window.__vp = {
  state: s, release, takes: loadTakes,
  touch: (x, y) => { startAudio(); touch(pad.x + x * pad.w, pad.y + y * pad.h); },
  mode: setMode,
  sing: (songId, bpm) => { $("oSong").value = songId ?? ""; pickSong(); if (bpm) { $("oBpm").value = bpm; } startSession("sing"); },
  hear: (songId, bpm) => { $("oSong").value = songId; pickSong(); $("oBpm").value = bpm ?? 100; startSession("hear"); },
  playTake: (n) => startSession("take", loadTakes().find((t) => t.n === n)),
  stop: stopSession,
};
