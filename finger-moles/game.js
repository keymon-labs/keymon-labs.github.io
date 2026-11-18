// Finger Moles: whack-a-mole on a real piano. Each finger owns a coloured mole; the hand stays in C position.
// Rules: logic.js · Data: tunes.json · Look: style.css · Shared: ../shared/{midi,audio,rng,pwa}.js
import TUNES from "./tunes.json";
import { handKeys, judge, randomRound, tuneRound, tuneBeats, starsFor, upTime } from "./logic.js";
import { connectMidi, connectBluetoothMidi, keyboardNotes } from "../shared/midi.js";
import { unlockAudio, tone } from "../shared/audio.js";
import { createRng } from "../shared/rng.js";
import { registerServiceWorker, setupInstallButton, keepAwake } from "../shared/pwa.js";

const $ = (id) => document.getElementById(id);
const COL = { 1: "#ff5a5f", 2: "#ff9f1c", 3: "#ffd23f", 4: "#3ecf8e", 5: "#4d96ff" };
const FINGER = { 1: "thumb", 2: "pointer finger", 3: "middle finger", 4: "ring finger", 5: "pinky" };
const NUM = { 1: "One", 2: "Two", 3: "Three", 4: "Four", 5: "Five" };

// ---------- settings ----------
const opts = { hand: "R", tune: "buns", voice: "on", sound: "auto" };
try { Object.assign(opts, JSON.parse(localStorage.getItem("fingermoles") || "{}")); } catch {}
const save = () => { try { localStorage.setItem("fingermoles", JSON.stringify(opts)); } catch {} };
$("oTune").innerHTML = TUNES.map((t) => `<option value="${t.id}">${t.title}</option>`).join("");
for (const [id, k] of [["oTune", "tune"], ["oVoice", "voice"], ["oSound", "sound"]]) {
  $(id).value = opts[k]; $(id).onchange = (e) => { opts[k] = e.target.value; save(); };
}
const showHand = () => document.querySelectorAll(".hand").forEach((b) => b.classList.toggle("sel", b.dataset.hand === opts.hand));
document.querySelectorAll(".hand").forEach((b) => (b.onclick = () => { opts.hand = b.dataset.hand; save(); showHand(); }));
showHand();
registerServiceWorker();
setupInstallButton($("btnInstall"));
document.addEventListener("visibilitychange", () => { if (state !== "menu") keepAwake(); });

// ---------- sound and voice ----------
let piano = false;   // a real instrument is connected: it makes its own sound
const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);
const noteSound = (m, force, dur = .6) => { if (force || opts.sound === "on" || (opts.sound === "auto" && !piano)) tone(freq(m), dur, "triangle", .22); };
const sfx = {
  bonk() { tone(220, .12, "square", .05, 0, 110); },
  oops() { tone(300, .25, "sawtooth", .04, 0, 200); },
  cheer() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, .15, "sine", .07, i * .07)); },
};
function say(text) {
  if (opts.voice !== "on" || !window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text); u.rate = .95; u.pitch = 1.25; speechSynthesis.speak(u);
}

// ---------- input ----------
function onStatus(s) {
  piano = !!s.ok;
  $("hDot").classList.toggle("on", piano);
  $("hInput").textContent = s.ok ? s.name : "No piano";
  $("connText").textContent = s.ok ? `Connected: ${s.name}` : s.message;
}
$("btnMidi").onclick = () => { unlockAudio(); connectMidi(onNote, onStatus); };
$("btnBle").onclick = () => { unlockAudio(); connectBluetoothMidi(onNote, onStatus); };
keyboardNotes((m) => { unlockAudio(); onNote(m); });

// ---------- geometry ----------
const cv = $("cv"), ctx = cv.getContext("2d");
let W = 0, H = 0, kw = 50, kx = 0, ky = 0, kh = 0, holeY = 0;
const whites = () => { const b = handKeys(opts.hand)[0].midi; return [b - 1, b, b + 2, b + 4, b + 5, b + 7, b + 9]; };
const blacks = () => { const b = handKeys(opts.hand)[0].midi; return [[b + 1, 1], [b + 3, 2], [b + 6, 4], [b + 8, 5]]; };   // [midi, white index it sits after]
const colX = (c) => kx + (c + 1.5) * kw;   // hand key c is white key c+1
function resize() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  kw = Math.min((W - 24) / 7, (H - 60) / 5.6, 130);
  kx = (W - 7 * kw) / 2;
  const block = kw * 5.6, bottom = Math.min(H, 56 + block + (H - 56 - block) * .65);
  kh = kw * 2.1; ky = bottom - kw * 1.2 - kh; holeY = ky - kw * .75;
}
addEventListener("resize", resize); resize();

// ---------- round state ----------
let state = "menu", R = null, now = 0, nextAt = 0, hintAt = 0, awayT = -9, replay = null;
const moles = [0, 1, 2, 3, 4].map(() => ({ up: 0, want: 0, hit: 0, giggle: 0 }));
let parts = [], floats = [];
const keyOf = (m) => handKeys(opts.hand).find((k) => k.midi === m);
const target = () => (R && R.cur != null ? R.seq[R.i] : null);

function start(mode) {
  unlockAudio();
  const rng = createRng(Date.now() & 0xffff);
  const tune = TUNES.find((t) => t.id === opts.tune) || TUNES[0];
  const seq = mode === "song" ? tuneRound(tune, opts.hand) : randomRound(rng, opts.hand, mode === "speedy" ? 20 : 10);
  R = { mode, seq, tune, i: 0, cur: null, tries: 0, first: 0, score: 0, combo: 0, missed: 0, hits: 0, upUntil: 0 };
  moles.forEach((m) => Object.assign(m, { up: 0, want: 0, hit: 0, giggle: 0 }));
  parts = []; floats = []; replay = null;
  $("ovMenu").hidden = true; $("ovEnd").hidden = true;
  state = "play"; nextAt = now + 1; keepAwake();
  say(opts.hand === "R" ? "Thumb on C!" : "Pinky on C!");
  hud();
}
function popNext() {
  if (R.i >= R.seq.length) return finish();
  const k = keyOf(R.seq[R.i]);
  R.cur = k.col; R.tries = 0;
  Object.assign(moles[k.col], { want: 1, hit: 0 });
  hintAt = now + (R.mode === "song" ? 4 : 3);
  R.upUntil = now + upTime(R.hits);
}
function advance(delay) { R.cur = null; R.i++; nextAt = now + delay; hud(); }

function onNote(m) {
  if (state === "end" && !$("ovEnd").hidden) return;
  if (state !== "play" || !R) { noteSound(m); return; }
  const t = target();
  if (t == null) { noteSound(m); return; }   // between moles: free play
  const j = judge(m, t, opts.hand), k = keyOf(t);
  noteSound(m);
  if (j.kind === "hit") {
    const mo = moles[k.col]; mo.hit = .45; mo.want = 0;
    R.hits++; if (!R.tries) R.first++;
    R.combo = R.tries ? 0 : R.combo + 1;
    R.score += 1 + (R.combo >= 5 ? 1 : 0);
    sfx.bonk(); burst(colX(k.col), holeY - kw * .7, COL[k.finger]);
    if (R.combo && R.combo % 5 === 0) { sfx.cheer(); say(["Wow!", "Super!", "Amazing!"][(R.combo / 5 - 1) % 3]); float(`${R.combo} in a row!`, W / 2, holeY - kw * 2.2, "#ff7a45"); }
    advance(R.mode === "song" ? .5 : R.mode === "speedy" ? .25 + Math.random() * .4 : .6);
  } else {
    R.tries++; R.combo = 0; hintAt = now; sfx.oops();
    moles[k.col].giggle = .6;
    if (j.kind === "wrong") {
      if (!moles[j.col].want) float("?", colX(j.col), holeY - kw * .5, "#23314f");
      say(`${NUM[k.finger]}! ${FINGER[k.finger]}`);
    } else {
      awayT = now; float("Hands home!", W / 2, ky - kw * 2.4, "#ff5a5f");
      say(j.sameNote ? `Right note, wrong place. ${opts.hand === "R" ? "Thumb" : "Pinky"} on middle C.` : `Hands home! ${opts.hand === "R" ? "Thumb" : "Pinky"} on C.`);
    }
    hud();
  }
}

function finish() {
  R.cur = null;
  if (R.mode === "song") { state = "replay"; replay = { i: 0, at: now + .6, beats: tuneBeats(R.tune) }; say(`You played ${R.tune.title}!`); return; }
  end();
}
function end() {
  state = "end";
  const total = R.seq.length, st = R.mode === "speedy" ? starsFor(R.hits, total) : starsFor(R.first, total);
  $("endStars").textContent = "⭐".repeat(st) + "☆".repeat(3 - st);
  $("endText").textContent = R.mode === "song" ? `You played “${R.tune.title}”!` : R.mode === "speedy" ? `You bonked ${R.hits} of ${total} moles!` : `You found all ${total} moles!`;
  $("ovEnd").hidden = false; sfx.cheer();
  if (R.mode !== "song") say(st === 3 ? "Super star!" : "Well done!");
}
function hud() {
  $("hScore").textContent = R ? R.score : 0;
  $("hLeft").textContent = R ? `🐾 ${Math.max(0, R.seq.length - R.i)}` : "🐾 0";
  $("hCombo").hidden = !R || R.combo < 3; if (R) $("hCombo").textContent = `🔥 ${R.combo}`;
}

$("btnMenu").onclick = () => { state = "menu"; R = null; $("ovEnd").hidden = true; $("ovMenu").hidden = false; hud(); };
$("btnHome").onclick = $("btnMenu").onclick;
$("btnAgain").onclick = () => start(R.mode);
document.querySelectorAll(".mode").forEach((b) => (b.onclick = () => start(b.dataset.mode)));

// Touch the screen keys or a mole hole: same as playing that key.
cv.addEventListener("pointerdown", (e) => {
  unlockAudio();
  const x = e.clientX, y = e.clientY, wi = Math.floor((x - kx) / kw);
  if (y > ky && y < ky + kh) {
    const b = blacks().find(([, after]) => y < ky + kh * .6 && Math.abs(x - (kx + (after + 1) * kw)) < kw * .3);
    if (b) return onNote(b[0]);
    if (wi >= 0 && wi < 7) onNote(whites()[wi]);
  } else if (y < ky && y > holeY - kw * 1.8 && wi >= 1 && wi <= 5) onNote(handKeys(opts.hand)[wi - 1].midi);
});

// ---------- effects ----------
function burst(x, y, c) {
  for (let i = 0; i < 14; i++) { const a = Math.random() * 6.28, v = kw * (2 + Math.random() * 3); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - kw * 2, t: 0, c: i % 3 ? c : "#ffe14d" }); }
}
function float(text, x, y, color) { floats.push({ text, x, y, t: 0, color }); }

// ---------- drawing ----------
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function drawScene() {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#bfe8ff"); g.addColorStop(1, "#e9f8ff");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff"; [[.15, .14], [.72, .1], [.45, .2]].forEach(([fx, fy], i) => {   // clouds drift
    const x = ((fx * W + now * 8 * (i + 1)) % (W + 160)) - 80, y = fy * H;
    ctx.beginPath(); ctx.ellipse(x, y, 44, 16, 0, 0, 7); ctx.ellipse(x + 26, y - 10, 28, 18, 0, 0, 7); ctx.fill();
  });
  ctx.fillStyle = "#8fd16a"; ctx.beginPath(); ctx.ellipse(W / 2, holeY + H, W * .9, H + kw * .9, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#7cc257"; ctx.fillRect(0, ky - kw * .15, W, H);
}
function drawMole(c, finger) {
  const m = moles[c], x = colX(c), mw = kw * .9, mh = kw * 1.35;
  const ring = COL[finger];
  // hole
  ctx.fillStyle = "#5b3a24"; ctx.beginPath(); ctx.ellipse(x, holeY, kw * .45, kw * .17, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#2c1a10"; ctx.beginPath(); ctx.ellipse(x, holeY + 2, kw * .38, kw * .12, 0, 0, 7); ctx.fill();
  if (m.up > .01) {
    ctx.save(); ctx.beginPath(); ctx.rect(x - kw, holeY - mh * 2, kw * 2, mh * 2); ctx.clip();
    const shake = m.giggle > 0 ? Math.sin(now * 60) * kw * .05 : 0, sink = m.hit > 0 ? (1 - m.hit / .45) * .3 : 0;
    const top = holeY - mh * m.up + mh * sink, bx = x + shake;
    ctx.fillStyle = ring; rr(bx - mw / 2, top, mw, mh * 1.3, mw / 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.45)"; ctx.beginPath(); ctx.ellipse(bx, top + mh * .72, mw * .3, mh * .26, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#23314f"; ctx.font = `800 ${kw * .34}px "Baloo 2",sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(finger, bx, top + mh * .76);
    const ey = top + mh * .3, ex = mw * .17;
    for (const s of [-1, 1]) {
      if (m.hit > 0) {   // bonked: X eyes
        ctx.strokeStyle = "#23314f"; ctx.lineWidth = kw * .04; const r = kw * .06;
        ctx.beginPath(); ctx.moveTo(bx + s * ex - r, ey - r); ctx.lineTo(bx + s * ex + r, ey + r); ctx.moveTo(bx + s * ex + r, ey - r); ctx.lineTo(bx + s * ex - r, ey + r); ctx.stroke();
      } else {
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(bx + s * ex, ey, kw * .09, 0, 7); ctx.fill();
        ctx.fillStyle = "#23314f"; ctx.beginPath(); ctx.arc(bx + s * ex + kw * .02 * Math.sin(now * 2), ey + kw * .02, kw * .05, 0, 7); ctx.fill();
      }
    }
    ctx.fillStyle = "#ff8fa3"; ctx.beginPath(); ctx.ellipse(bx, top + mh * .45, kw * .08, kw * .06, 0, 0, 7); ctx.fill();
    if (m.giggle > 0) { ctx.fillStyle = "#23314f"; ctx.fillText("hee", bx + mw * .75, top + mh * .1); }
    ctx.restore();
    // paws on the rim
    if (m.up > .7) { ctx.fillStyle = ring; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + s * mw * .32, holeY - kw * .02, kw * .1, kw * .07, 0, 0, 7); ctx.fill(); } }
  }
  // front lip of the mound, in the finger colour so empty holes still say which finger
  ctx.strokeStyle = ring; ctx.lineWidth = kw * .09; ctx.beginPath(); ctx.ellipse(x, holeY, kw * .45, kw * .17, 0, 0, Math.PI); ctx.stroke();
}
function drawKeys() {
  const ks = handKeys(opts.hand), t = target(), hint = t != null && now > hintAt, pulse = .5 + .5 * Math.sin(now * 8);
  whites().forEach((m, i) => {
    const k = ks.find((k) => k.midi === m), x = kx + i * kw;
    ctx.fillStyle = k ? "#fff" : "#e3e6ee"; rr(x + 1, ky, kw - 2, kh, kw * .12); ctx.fill();
    ctx.strokeStyle = "#9aa3b8"; ctx.lineWidth = 1; ctx.stroke();
    if (k) { ctx.fillStyle = COL[k.finger]; ctx.globalAlpha = hint && m === t ? .5 + .5 * pulse : .35; rr(x + 3, ky + kh * .78, kw - 6, kh * .2, kw * .1); ctx.fill(); ctx.globalAlpha = 1; }
    if (m % 12 === 0) { ctx.fillStyle = "#23314f"; ctx.font = `700 ${kw * .26}px "Baloo 2",sans-serif`; ctx.textAlign = "center"; ctx.fillText("C", x + kw / 2, ky + kh * .88); }
  });
  ctx.fillStyle = "#23314f";
  blacks().forEach(([, after]) => { rr(kx + (after + 1) * kw - kw * .3, ky, kw * .6, kh * .58, kw * .08); ctx.fill(); });
}
// A white cartoon glove resting on the five keys; the finger the mole wants lifts and glows.
function drawHand() {
  const ks = handKeys(opts.hand), t = target(), want = t != null ? ks.find((k) => k.midi === t).finger : 0;
  const away = now - awayT < .8 ? Math.sin((now - awayT) * 40) * kw * .15 : 0;
  const palmY = ky + kh + kw * .55, cx = colX(2) + away;
  ctx.fillStyle = "#fff"; ctx.strokeStyle = "#23314f"; ctx.lineWidth = kw * .04;
  ctx.beginPath(); ctx.ellipse(cx, palmY, kw * 2.5, kw * .75, 0, 0, 7); ctx.fill(); ctx.stroke();
  const len = { 1: .62, 2: .4, 3: .32, 4: .4, 5: .52 };
  ks.forEach((k) => {
    const lift = k.finger === want ? kw * (.25 + .12 * Math.sin(now * 10)) : 0, x = colX(k.col) + away, fw = kw * .6;
    const tip = ky + kh * len[k.finger] - lift;
    ctx.fillStyle = "#fff"; rr(x - fw / 2, tip, fw, palmY - tip, fw / 2); ctx.fill(); ctx.stroke();
    if (k.finger === want) { ctx.save(); ctx.shadowColor = COL[k.finger]; ctx.shadowBlur = kw * .5; }
    ctx.fillStyle = COL[k.finger]; ctx.beginPath(); ctx.arc(x, tip + fw * .5, fw * .42, 0, 7); ctx.fill();
    if (k.finger === want) ctx.restore();
    ctx.fillStyle = "#fff"; ctx.font = `800 ${kw * .34}px "Baloo 2",sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(k.finger, x, tip + fw * .52);
  });
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(cx, palmY + kw * .1, kw * 2.35, kw * .6, 0, 0, 7); ctx.fill();   // hide finger roots
}
function drawFx(dt) {
  parts = parts.filter((p) => (p.t += dt) < .9);
  for (const p of parts) { p.vy += kw * 9 * dt; p.x += p.vx * dt; p.y += p.vy * dt; ctx.globalAlpha = 1 - p.t / .9; ctx.fillStyle = p.c; ctx.font = `${kw * .3}px sans-serif`; ctx.fillText("★", p.x, p.y); }
  ctx.globalAlpha = 1;
  floats = floats.filter((f) => (f.t += dt) < 1.4);
  for (const f of floats) {
    ctx.globalAlpha = Math.min(1, 2 * (1.4 - f.t)); ctx.fillStyle = f.color; ctx.strokeStyle = "#fff"; ctx.lineWidth = 6;
    ctx.font = `800 ${Math.max(22, kw * .55)}px "Baloo 2",sans-serif`; ctx.textAlign = "center";
    ctx.strokeText(f.text, f.x, f.y - f.t * kw * .6); ctx.fillText(f.text, f.x, f.y - f.t * kw * .6);
  }
  ctx.globalAlpha = 1;
}

// ---------- loop ----------
let last = performance.now();
function frame(ts) {
  const dt = Math.min(.05, (ts - last) / 1000); last = ts; now += dt;
  if (state === "play" && R) {
    if (R.cur == null && now >= nextAt && moles.every((m) => m.hit <= 0)) popNext();
    if (R.mode === "speedy" && R.cur != null && now > R.upUntil) {   // too slow: it giggles and hides
      moles[R.cur].want = 0; moles[R.cur].giggle = .5; R.missed++; R.combo = 0; advance(.5);
    }
  }
  if (state === "replay") {   // victory lap: the moles sing the tune back
    if (now >= replay.at) {
      if (replay.i >= R.seq.length) { if (moles.every((m) => m.up < .05)) end(); }
      else {
        const b = replay.beats[replay.i], m = R.seq[replay.i++], k = keyOf(m), sec = .4 * b;
        noteSound(m, true, sec + .2);
        Object.assign(moles[k.col], { want: 1, hit: 0 });
        setTimeout(() => (moles[k.col].want = 0), Math.min(sec * 1000 - 60, 600));
        replay.at = now + sec;
      }
    }
  }
  for (const m of moles) {
    m.up += (m.want - m.up) * Math.min(1, dt * (m.want ? 14 : 9));
    if (m.hit > 0) m.hit -= dt;
    if (m.giggle > 0) m.giggle -= dt;
  }
  drawScene();
  handKeys(opts.hand).forEach((k) => drawMole(k.col, k.finger));
  drawKeys(); drawHand(); drawFx(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.__fm = { onNote, start, get state() { return state; }, get target() { return target(); }, get round() { return R; } };
