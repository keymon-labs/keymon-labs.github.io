// Drone Hide: webcam hide-and-seek for two. Camera → small buffer → logic.js rules → canvas. Data stays in this page.
import { foreground, adapt, countIn, hiddenShare, touches, rockMask, makeRocks } from "./logic.js";
import { createRng } from "../shared/rng.js";
import { unlockAudio, tone } from "../shared/audio.js";
import { keepAwake, releaseWake } from "../shared/pwa.js";

const W = 160, H = 120, S = 4;                 // buffer size and scale to the 640x480 canvas
const FAST = location.search.includes("fast"); // shorter countdowns for tests
const ROUND = FAST ? 12 : 60, BEAM = 19, GEM = 7;
const COLORS = ["#ff9f43", "#54a0ff"], NAMES = ["Left player", "Right player"];
const $ = (id) => document.getElementById(id);
const cv = $("c"), ctx = cv.getContext("2d"), video = $("v");
const pc = document.createElement("canvas"); pc.width = W; pc.height = H;
const pctx = pc.getContext("2d", { willReadFrequently: true });

const s = {
  phase: "start", t: 0, left: ROUND, bg: null, bgSum: null, bgN: 0, mask: new Uint8Array(W * H), rock: null, rocks: [],
  drone: { x: W / 2, y: H / 2, tx: W / 2, ty: H / 2, pause: 0, seen: -1 },
  gems: [], spawn: 0, debug: false, hid: [1, 1],
  p: [{ score: 0, immune: 0 }, { score: 0, immune: 0 }],
};
window.__droneHide = s;                         // test hook

function say(msg, btn, redo) { $("msg").textContent = msg; $("go").textContent = btn || ""; $("go").hidden = !btn; $("redo").hidden = !redo; $("ov").hidden = false; }

async function start() {
  unlockAudio();
  if (!navigator.mediaDevices?.getUserMedia) return say("This page needs a camera and a secure (https) connection.", "Try again");
  try {
    video.srcObject = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" }, audio: false });
    await video.play();
  } catch (e) { return say("No camera picture. Allow the camera for this page, then try again.", "Try again"); }
  keepAwake();
  empty();
}

function empty() {                              // everyone steps out, then we remember the empty room
  s.phase = "bg"; s.t = FAST ? 1 : 6; s.bgSum = new Float32Array(W * H * 4); s.bgN = 0;
  say("Step out of the picture! Taking a photo of the empty room…");
}

function newRound() {
  s.rocks = makeRocks(createRng(Date.now()), W, H); s.rock = rockMask(s.rocks, W, H);
  s.gems = []; s.left = ROUND; s.p.forEach(p => { p.score = 0; p.immune = 0; });
  Object.assign(s.drone, { x: W / 2, y: H / 3, tx: W / 2, ty: H / 3, pause: 1, seen: -1 });
  s.phase = "ready"; s.t = FAST ? 1 : 4;
  say("Come back in!\nHide behind the rocks when the drone's light comes.\nTouch the gems with your hands to collect them.");
}

function frameData() {
  pctx.save(); pctx.translate(W, 0); pctx.scale(-1, 1); pctx.drawImage(video, 0, 0, W, H); pctx.restore();   // mirrored, like a mirror
  return pctx.getImageData(0, 0, W, H).data;
}

function step(dt, cur) {
  if (s.phase === "bg") {
    s.t -= dt;
    if (s.t < .6) { for (let i = 0; i < cur.length; i++) s.bgSum[i] += cur[i]; s.bgN++; }
    if (s.t <= 0) { s.bg = s.bgSum.map(v => v / s.bgN); newRound(); }
    return;
  }
  if (!s.bg) return;
  s.mask = foreground(cur, s.bg, W, H);
  if (s.phase === "ready") { s.t -= dt; if (s.t <= 0) { s.phase = "play"; $("ov").hidden = true; $("hud").hidden = false; } }
  if (s.phase === "play") play(dt);
  adapt(s.bg, cur, s.mask, W, H);                // shortcut: a person standing still for minutes fades into the background; retake the room then
}

function play(dt) {
  s.left -= dt;
  const d = s.drone, speed = 26 + (ROUND - s.left) * .5;
  if (d.pause > 0) d.pause -= dt;
  else {
    const dx = d.tx - d.x, dy = d.ty - d.y, dist = Math.hypot(dx, dy);
    if (dist < 2) { d.tx = 12 + Math.random() * (W - 24); d.ty = 20 + Math.random() * (H - 30); d.pause = .5 + Math.random() * .6; }
    else { d.x += dx / dist * speed * dt; d.y += dy / dist * speed * dt; }
  }
  const beam = { cx: d.x, cy: d.y, r: BEAM };
  d.seen = -1;
  s.p.forEach((p, i) => {
    p.immune = Math.max(0, p.immune - dt);
    const half = { x0: i * W / 2, x1: (i + 1) * W / 2 };
    s.hid[i] = hiddenShare(s.mask, s.rock, W, H, half);
    if (countInHalf(beam, half) >= 25) {          // visible pixels of this player inside the light
      d.seen = i;
      if (p.immune <= 0) { p.immune = 2.5; p.score = Math.max(0, p.score - 1); tone(200, .35, "sawtooth", .2, 0, 80); }
    }
  });
  spawnGems(dt);
  s.gems = s.gems.filter(g => {
    g.life -= dt;
    if (touches(s.mask, W, H, { cx: g.x, cy: g.y, r: GEM })) { s.p[g.side].score++; tone(880, .12, "triangle", .2); tone(1320, .15, "triangle", .15, .08); return false; }
    return g.life > 0;
  });
  if (s.left <= 0) over();
}

// pixels of one player's half (rocks hide them) inside the beam
function countInHalf(beam, half) {
  const m = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = half.x0; x < half.x1; x++) m[y * W + x] = s.mask[y * W + x];
  return countIn(m, W, H, beam, s.rock);
}

function spawnGems(dt) {
  s.spawn -= dt;
  if (s.spawn > 0) return;
  s.spawn = 1.1;
  for (let side = 0; side < 2; side++) {
    if (s.gems.filter(g => g.side === side).length >= 3) continue;
    for (let t = 0; t < 30; t++) {
      const x = Math.round(side * W / 2 + 12 + Math.random() * (W / 2 - 24)), y = Math.round(18 + Math.random() * (H - 30));
      const free = [[0, 0], [GEM, 0], [-GEM, 0], [0, GEM], [0, -GEM]].every(([a, b]) => !s.rock[(y + b) * W + x + a]);
      if (free && Math.hypot(x - s.drone.x, y - s.drone.y) > BEAM + 8) { s.gems.push({ x, y, side, life: 9 }); break; }
    }
  }
}

function over() {
  s.phase = "over"; $("hud").hidden = true;
  const [a, b] = [s.p[0].score, s.p[1].score];
  say(`${a === b ? "A tie!" : (a > b ? NAMES[0] : NAMES[1]) + " wins!"}\n${NAMES[0]} ${a} ★   ${NAMES[1]} ${b} ★`, "Play again", true);
}

function draw(cur) {
  ctx.save(); ctx.scale(S, S);
  if (video.readyState >= 2) { ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1); ctx.drawImage(video, 0, 0, W, H); ctx.restore(); }
  ctx.fillStyle = "#0008"; ctx.fillRect(0, 0, W, H);                       // dim the room so the drone's light shows
  if (s.phase === "play" || s.phase === "ready") {
    ctx.strokeStyle = "#fff4"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.setLineDash([]);
    drawGems(); drawRocks(); drawDrone();
  }
  ctx.restore();
  if (s.debug) overlayMask();
  if (s.phase === "play") hud();
}

function drawRocks() {
  for (const r of s.rocks) {
    const g = ctx.createRadialGradient(r.x - r.rx * .3, r.y - r.ry * .4, 2, r.x, r.y, Math.max(r.rx, r.ry));
    g.addColorStop(0, "#9a948c"); g.addColorStop(1, "#4b4741");
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(r.x, r.y, r.rx, r.ry, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#ffffff22"; ctx.beginPath(); ctx.ellipse(r.x - r.rx * .3, r.y - r.ry * .4, r.rx * .35, r.ry * .2, 0, 0, 7); ctx.fill();
  }
}

function drawGems() {
  for (const g of s.gems) {
    const pulse = 1 + .15 * Math.sin(performance.now() / 150), blink = g.life < 2 && Math.floor(g.life * 6) % 2;
    if (blink) continue;
    ctx.save(); ctx.translate(g.x, g.y); ctx.scale(pulse, pulse); ctx.fillStyle = COLORS[g.side]; ctx.strokeStyle = "#fff"; ctx.lineWidth = .8;
    ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 3.4 : 7; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
}

function drawDrone() {
  const d = s.drone, hit = d.seen >= 0;
  const g = ctx.createRadialGradient(d.x, d.y, 1, d.x, d.y, BEAM);
  g.addColorStop(0, hit ? "#ff5a5acc" : "#fff7b0cc"); g.addColorStop(1, hit ? "#ff5a5a22" : "#fff7b022");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(d.x, d.y, BEAM, 0, 7); ctx.fill();
  const bx = d.x, by = d.y - 24, t = performance.now() / 40;
  ctx.strokeStyle = "#fff5"; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(bx, by + 3); ctx.lineTo(d.x, d.y); ctx.stroke();
  ctx.fillStyle = "#2b2b3a"; ctx.strokeStyle = "#fff"; ctx.lineWidth = .8;
  ctx.beginPath(); ctx.ellipse(bx, by, 7, 3.5, 0, 0, 7); ctx.fill(); ctx.stroke();
  for (const sx of [-9, 9]) { ctx.beginPath(); ctx.ellipse(bx + sx, by - 3, 5 * Math.abs(Math.cos(t)), 1, 0, 0, 7); ctx.fillStyle = "#fffc"; ctx.fill(); }
  ctx.fillStyle = hit ? "#ff3b3b" : "#7bed9f"; ctx.beginPath(); ctx.arc(bx, by + 1, 1.6, 0, 7); ctx.fill();
}

function overlayMask() {
  const img = ctx.createImageData(W, H);
  for (let i = 0; i < W * H; i++) if (s.mask[i]) { img.data.set([0, 255, 0, s.rock?.[i] ? 90 : 160], i * 4); }
  pctx.putImageData(img, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(pc, 0, 0, W * S, H * S);
}

function hud() {
  $("p0").textContent = `${NAMES[0]}  ★ ${s.p[0].score}  ${s.hid[0] > .7 ? "🪨 hidden" : "👀 visible"}`;
  $("p1").textContent = `${s.hid[1] > .7 ? "🪨 hidden" : "👀 visible"}  ★ ${s.p[1].score}  ${NAMES[1]}`;
  $("time").textContent = Math.ceil(Math.max(0, s.left)) + "s";
  s.p.forEach((p, i) => { if (p.immune > 1.8) { ctx.fillStyle = "#ff3b3b55"; ctx.fillRect(i * W / 2 * S, 0, W / 2 * S, H * S); } });
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  const live = video.readyState >= 2;
  const cur = live ? frameData() : null;
  if (cur) step(dt, cur);
  draw(cur);
  requestAnimationFrame(loop);
}

$("go").onclick = () => { if (s.phase === "over") newRound(); else start(); };
$("redo").onclick = empty;
addEventListener("keydown", e => { if (e.key === "d") s.debug = !s.debug; });   // d = show what the camera sees as players (green)
addEventListener("pagehide", () => { video.srcObject?.getTracks().forEach(t => t.stop()); releaseWake(); });
say("Two players, one laptop camera. Stand side by side in front of it: left and right halves are your own zones.\nA drone's light hunts for you. Hide behind the rocks, then dash out to grab gems.\nThe camera picture stays on this computer.", "Start camera");
requestAnimationFrame(loop);
