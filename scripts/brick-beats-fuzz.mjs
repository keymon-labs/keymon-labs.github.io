// Brick Beats robustness sweep (not part of `npm test`): renders many random mats under varied floors, lighting, noise, blur, rotation and
// perspective, runs corner finding + straightening + brick reading, and prints pass rates per factor so detection can be tuned.
//   node scripts/brick-beats-fuzz.mjs [--n 40] [--seed 1] [--save dir] [--only floor=tile]
// Results are only as good as the generator: it is a reference for tuning, never a proof. Nothing here uses real photos.
import fs from "node:fs";
import path from "node:path";
import { findCorners, warp } from "../brick-beats/correct.js";
import { detect, NAMES } from "../brick-beats/vision.js";
import { renderMat, distort, distortPoint, encodePng, BRICK_RGB } from "./brick-beats-mat.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const N = +arg("n", 40), SEED = +arg("seed", 1), SAVE = arg("save", ""), ONLY = arg("only", "");

const rng = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (r, a) => a[Math.floor(r() * a.length)], between = (r, a, b) => a + (b - a) * r(), gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

const FLOORS = { // [kind, colour]
  tan_wood: ["wood", [159, 133, 110]], grey_wood: ["wood", [150, 142, 135]], dark_wood: ["wood", [92, 66, 48]], pale_wood: ["wood", [205, 180, 150]],
  tile: ["tile", [190, 190, 185]], carpet: ["carpet", [120, 110, 125]], white: ["flat", [235, 235, 232]], stripes: ["stripes", [150, 120, 100]], checker: ["checker", [170, 165, 160]], busy_rug: ["blobs", [150, 140, 130]], dark: ["flat", [50, 50, 55]], grey_carpet: ["carpet", [140, 140, 140]],
};

/** 4 lanes of random non-overlapping bricks (one at stud 0 so starts are comparable). */
function randomLanes(r) {
  const names = Object.keys(BRICK_RGB);
  return Array.from({ length: 4 }, (_, k) => {
    const out = []; let x = k === 0 || r() < 0.3 ? 0 : Math.floor(between(r, 0, 4));
    while (x < 22 && out.length < 6) {
      const len = pick(r, [2, 2, 4, 4, 6]); if (x + len > 24) break;
      out.push([pick(r, names), x, len]); x += len + Math.floor(between(r, 1, 5));
    }
    return out.length ? out : [["red", 0, 2]];
  });
}

/** Lighting, colour cast, glare, a shadow band, noise and blur on the finished photo. */
function weather(r, ph, o) {
  const { data, width: W, height: H } = ph, th = r() * Math.PI * 2, gx = Math.cos(th), gy = Math.sin(th), diag = Math.hypot(W, H);
  const gl = [r() * W, r() * H], sb = r() * diag - diag / 2, sd = [Math.cos(th + 1), Math.sin(th + 1)];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, u = ((x - W / 2) * gx + (y - H / 2) * gy) / diag;
    let f = 1 + o.gradient * 2 * u;
    f *= 1 - o.vignette * (((x - W / 2) / W) ** 2 + ((y - H / 2) / H) ** 2) * 4;
    const sh = ((x - W / 2) * sd[0] + (y - H / 2) * sd[1] - sb) / 60;
    if (o.shadow) f *= 1 - o.shadow * Math.max(0, 1 - Math.abs(sh));
    const add = o.glare * Math.max(0, 1 - Math.hypot(x - gl[0], y - gl[1]) / 130);
    for (let c = 0; c < 3; c++) data[i + c] = Math.max(0, Math.min(255, data[i + c] * f * (1 + o.cast * (c - 1)) + add + o.noise * gauss(r)));
  }
  if (o.blur) { // one box blur pass: slightly out of focus
    const src = data.slice();
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) for (let c = 0; c < 3; c++) { let v = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) v += src[((y + j) * W + x + i) * 4 + c]; data[(y * W + x) * 4 + c] = v / 9; }
  }
}

function makeCase(i) {
  const r = rng(SEED * 100003 + i), floorName = pick(r, Object.keys(FLOORS)), [kind, colour] = FLOORS[floorName];
  const lanes = randomLanes(r), edgeTape = r() < 0.2, tape = r() < 0.7;
  const lego = r() < 0.3, mat = { fine: lego ? 2 : 1, margin: 160, tape, overhang: tape && r() < 0.3 ? 0.6 : 0, edgeTape, floorKind: kind, floor: colour };
  const photo = { outW: 800, outH: 1040, scale: between(r, 0.55, 1), rot: between(r, -30, 30) * (r() < 0.3 ? 0 : 1), tilt: between(r, -0.0006, 0.0006) * (r() < 0.3 ? 0 : 1), fill: colour };
  const wx = { gradient: between(r, 0, 0.6) * (r() < 0.5 ? 0 : 1), vignette: r() < 0.4 ? between(r, 0.1, 0.5) : 0, cast: r() < 0.4 ? between(r, -0.18, 0.18) : 0, glare: r() < 0.2 ? between(r, 40, 110) : 0, shadow: r() < 0.25 ? between(r, 0.2, 0.45) : 0, noise: r() < 0.5 ? between(r, 3, 14) : 0, blur: r() < 0.25 };
  const tags = { bricks: lego ? "lego" : "duplo", floor: floorName, tape: tape ? "tape" : "no-tape", edge: edgeTape ? "edge-tape" : "-", rot: Math.abs(photo.rot) > 20 ? "rot>20" : Math.abs(photo.rot) > 6 ? "rot6-20" : "rot<6", tilt: Math.abs(photo.tilt) > 0.0003 ? "tilt-high" : "tilt-low", size: photo.scale < 0.7 ? "small" : "large", light: wx.gradient > 0.3 || wx.shadow ? "uneven" : "even", glare: wx.glare ? "glare" : "-", noise: wx.noise > 8 ? "noisy" : "clean", blur: wx.blur ? "blur" : "-", cast: Math.abs(wx.cast) > 0.1 ? "cast" : "-" };
  return { i, lanes, mat, photo, wx, tags, r };
}

function run(cs) {
  const m = renderMat(cs.lanes, cs.mat), ph = distort(m, cs.photo);
  weather(cs.r, ph, cs.wx);
  const p = 24, mg = cs.mat.margin, e = cs.mat.edgeTape ? 0.5 * p : 0;
  const truth = [[mg, mg - e], [mg + 24 * p, mg - e], [mg + 24 * p, mg + 24 * p + e], [mg, mg + 24 * p + e]].map((q) => distortPoint(q, m, cs.photo));
  const res = { ph, cornersFound: false, cornersOk: false, err: null, read: 0, exact: false };
  const f = findCorners(ph.data, ph.width, ph.height);
  if (!f) return res;
  res.cornersFound = true;
  const side = Math.hypot(truth[1][0] - truth[0][0], truth[1][1] - truth[0][1]);
  res.err = Math.max(...truth.map((t, k) => Math.hypot(t[0] - f.quad[k][0], t[1] - f.quad[k][1]))) / side;
  res.cornersOk = res.err < 0.025;
  const v = warp(ph.data, ph.width, ph.height, f.quad), d = detect(v.data, v.W, v.H);
  if (!d.ok) return res;
  const norm = (ls) => { const mn = Math.min(...ls.flat().map((b) => b[1])); return ls.flatMap((l, k) => l.map((b) => `${k}:${b[0]}:${b[1] - mn}:${b[2]}`)); };
  const want = norm(cs.lanes), got = d.tracks.length === 4 ? norm(d.tracks.map((t) => t.bricks.map((b) => [NAMES[b.cls], b.start, b.len]))) : [];
  res.read = want.filter((w) => got.includes(w)).length / want.length;
  res.exact = res.read === 1 && got.length === want.length;
  return res;
}

const rows = [];
for (let i = 0; i < N; i++) {
  const cs = makeCase(i);
  if (ONLY && !Object.values(cs.tags).includes(ONLY.split("=").pop())) continue;
  const t0 = performance.now(), r = run(cs);
  rows.push({ cs, r });
  process.stdout.write(`${r.cornersOk ? "." : r.cornersFound ? "c" : "x"}${r.exact ? "" : "~"} `);
  if (SAVE && (!r.cornersOk || !r.exact)) { fs.mkdirSync(SAVE, { recursive: true }); fs.writeFileSync(path.join(SAVE, `case${SEED}-${i}.png`), encodePng(r.ph)); }
}
console.log(`\n\n${rows.length} cases, seed ${SEED}. ( . corners ok, c corners off, x none; ~ bricks not all read)`);
const pct = (a, f) => `${Math.round((100 * a.filter(f).length) / Math.max(1, a.length))}%`;
console.log(`corners ok ${pct(rows, (x) => x.r.cornersOk)}, bricks exact ${pct(rows, (x) => x.r.exact)}, mean bricks read ${Math.round((100 * rows.reduce((a, x) => a + x.r.read, 0)) / Math.max(1, rows.length))}%\n`);
const groups = {};
for (const x of rows) for (const [k, v] of Object.entries(x.cs.tags)) (groups[`${k}=${v}`] ??= []).push(x);
console.log("factor".padEnd(22), "cases", "corners", "exact");
for (const [k, a] of Object.entries(groups).sort()) console.log(k.padEnd(22), String(a.length).padStart(5), pct(a, (x) => x.r.cornersOk).padStart(7), pct(a, (x) => x.r.exact).padStart(6));
const bad = rows.filter((x) => !x.r.cornersOk).slice(0, 8);
if (bad.length) { console.log("\nfirst corner failures (rerun with --seed " + SEED + " --only <tag>):"); for (const x of bad) console.log(`  case ${x.cs.i}: err ${x.r.err == null ? "none" : x.r.err.toFixed(3)}  ${Object.values(x.cs.tags).join(" ")}`); }
