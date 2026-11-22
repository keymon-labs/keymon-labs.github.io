// Voice Pad app: touch pad, Gloop the singer (canvas), menu and theory panel. Rules in logic.js, sound in voice.js.
import { noteName } from "../shared/music.js";
import { VOICES, SCALES, VOWELS, REGISTERS, xToMidi, yToVowel, scaleNotes, register, midiToHz, vibratoCents } from "./logic.js";
import { startAudio, sing, hush } from "./voice.js";

const $ = (id) => document.getElementById(id), cv = $("cv"), g = cv.getContext("2d");
const s = { voice: "tenor", scale: "pentatonic", on: false, x: 0.5, y: 0.5, speed: 0, midi: 60, vowel: yToVowel(0.5), t: 0, bounce: 0, mouth: [0.3, 0.2], notes: [] };
let W = 0, H = 0, pad = { x: 0, y: 0, w: 0, h: 0 }, face = { x: 0, y: 0, r: 0 }, last = null;

function layout() {
  const dpr = devicePixelRatio || 1;
  W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const wide = W > H * 1.1, m = 10;
  pad = wide ? { x: W * 0.36, y: 54, w: W * 0.64 - m, h: H - 54 - m } : { x: m, y: H * 0.4, w: W - 2 * m, h: H * 0.6 - m };
  const box = wide ? { x: 0, y: 40, w: W * 0.36, h: H - 40 } : { x: 0, y: 40, w: W, h: H * 0.4 - 40 };
  face = { x: box.x + box.w / 2, y: box.y + box.h / 2, r: Math.min(box.w * 0.34, box.h * 0.36) };
}

function touch(px, py) {
  const x = (px - pad.x) / pad.w, y = (py - pad.y) / pad.h, now = performance.now();
  if (last) s.speed = Math.hypot(x - last.x, y - last.y) / Math.max(0.016, (now - last.t) / 1000);
  last = { x, y, t: now };
  s.x = Math.min(1, Math.max(0, x)); s.y = Math.min(1, Math.max(0, y));
  s.midi = xToMidi(s.x, s.voice, s.scale); s.vowel = yToVowel(s.y); s.on = true;
  sing(midiToHz(s.midi), s.vowel.f, vibratoCents(s.speed));
  const r = register(s.midi, s.voice);
  $("hNote").textContent = `${noteName(Math.round(s.midi), "letters")} · ${s.vowel.id}`;
  $("hReg").textContent = `${r} voice`;
  $("hReg").title = REGISTERS[r];
}
function release() { s.on = false; last = null; s.speed = 0; hush(); }

cv.addEventListener("pointerdown", (e) => { cv.setPointerCapture(e.pointerId); startAudio(); touch(e.offsetX, e.offsetY); });
cv.addEventListener("pointermove", (e) => { if (s.on) touch(e.offsetX, e.offsetY); });
for (const ev of ["pointerup", "pointercancel"]) cv.addEventListener(ev, release);

function draw(ts) {
  const dt = Math.min(0.05, (ts - s.t) / 1000 || 0.016); s.t = ts;
  g.clearRect(0, 0, W, H);
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#3b3478"); bg.addColorStop(1, "#1d1a3a");
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  drawPad(); drawGloop(dt); requestAnimationFrame(draw);
}

function drawPad() {
  const { lo, hi } = VOICES[s.voice], { x, y, w, h } = pad;
  g.fillStyle = "rgba(255,255,255,.08)"; g.beginPath(); g.roundRect(x, y, w, h, 18); g.fill();
  g.font = "600 12px system-ui"; g.textBaseline = "middle";
  VOWELS.forEach((v, i) => {                       // vowel bands, top to bottom
    const yy = y + (h * i) / (VOWELS.length - 1);
    g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(x + 8, yy, w - 16, 1);
    g.fillStyle = "rgba(255,255,255,.7)"; g.textAlign = "left"; g.fillText(v.id, x + 12, Math.min(y + h - 30, Math.max(y + 12, yy)));
  });
  const notes = scaleNotes(s.scale, lo, hi); g.textAlign = "center";
  for (const m of notes) {                         // note lines
    const xx = x + ((m - lo) / (hi - lo)) * w, root = m % 12 === 0;
    g.fillStyle = root ? "rgba(255,210,90,.5)" : "rgba(255,255,255,.2)"; g.fillRect(xx - 1, y + 8, 2, h - 16);
    if (notes.length < 16 || root) { g.fillStyle = root ? "#ffd25a" : "rgba(255,255,255,.75)"; g.fillText(noteName(m, "letters"), xx, y + h - 12); }
  }
  if (s.on) {
    const px = x + s.x * w, py = y + s.y * h, gl = g.createRadialGradient(px, py, 0, px, py, 46);
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

function fillMenu() {
  $("oVoice").innerHTML = Object.entries(VOICES).map(([id, v]) => `<option value="${id}">${v.label}</option>`).join("");
  $("oScale").innerHTML = Object.entries(SCALES).map(([id, v]) => `<option value="${id}">${v.label}</option>`).join("");
  $("oVoice").value = s.voice; $("oScale").value = s.scale;
  $("tVoices").innerHTML = Object.values(VOICES).map((v) => `<li><b>${v.label}</b>: ${v.about}</li>`).join("");
  $("tRegisters").innerHTML = Object.values(REGISTERS).map((t) => `<li>${t}</li>`).join("");
  $("tVowels").innerHTML = VOWELS.map((v) => `<li><b>${v.id}</b>: ${v.f.join(", ")} Hz</li>`).join("");
}
$("oVoice").onchange = (e) => { s.voice = e.target.value; };
$("oScale").onchange = (e) => { s.scale = e.target.value; };
$("btnPlay").onclick = () => { startAudio(); $("ovMenu").hidden = true; };
$("btnMenu").onclick = () => { release(); $("ovMenu").hidden = false; };

fillMenu(); addEventListener("resize", layout); layout(); requestAnimationFrame(draw);
window.__vp = { state: s, touch: (x, y) => { startAudio(); touch(pad.x + x * pad.w, pad.y + y * pad.h); }, release };
