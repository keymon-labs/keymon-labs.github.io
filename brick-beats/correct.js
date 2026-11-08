// Straightens a photo of a brick mat before vision.js reads it: finds the green plate (with its tape) and rebuilds a flat top-down view
// of it with a perspective warp, turned so the lanes run left to right. Pure, no DOM; tests in test/correct.test.js.
// shortcut: colour balance against the plate and a lighting flat-field were tried and did not help on real photos, so they are not here; see README.
import { rgbToHsv } from "./vision.js";


const isPlate = (h, s, v) => h >= 135 && h < 190 && s > 0.3 && v > 0.15;
const isTape = (h, s, v) => h >= 196 && h < 224 && s >= 0.45 && s < 0.9 && v >= 0.45 && v < 0.98;

/** Average k x k blocks (k whole) into a smaller RGBA image. */
function shrink(src, W, H, k) {
  const w = Math.floor(W / k), h = Math.floor(H / k), out = new Uint8ClampedArray(w * h * 4), n = k * k;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let r = 0, g = 0, b = 0;
    for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) { const o = ((y * k + j) * W + x * k + i) * 4; r += src[o]; g += src[o + 1]; b += src[o + 2]; }
    out.set([r / n, g / n, b / n, 255], (y * w + x) * 4);
  }
  return { data: out, W: w, H: h };
}

/** Largest 4-connected blob of a mask, as a list of pixel indices. */
function biggestBlob(mask, W, H) {
  const seen = new Uint8Array(W * H), st = new Int32Array(W * H);
  let best = null;
  for (let s0 = 0; s0 < W * H; s0++) {
    if (!mask[s0] || seen[s0]) continue;
    const cur = [];
    let sp = 0;
    st[sp++] = s0; seen[s0] = 1;
    while (sp) {
      const i = st[--sp], x = i % W;
      cur.push(i);
      if (x > 0 && mask[i - 1] && !seen[i - 1]) { seen[i - 1] = 1; st[sp++] = i - 1; }
      if (x < W - 1 && mask[i + 1] && !seen[i + 1]) { seen[i + 1] = 1; st[sp++] = i + 1; }
      if (i >= W && mask[i - W] && !seen[i - W]) { seen[i - W] = 1; st[sp++] = i - W; }
      if (i < W * (H - 1) && mask[i + W] && !seen[i + W]) { seen[i + W] = 1; st[sp++] = i + W; }
    }
    if (!best || cur.length > best.length) best = cur;
  }
  return best;
}

function hull(pts) { // monotone chain; pts = [[x, y]]
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

/** Drop the hull vertex that adds the least area until four are left. */
function toQuad(poly) {
  const q = poly.slice();
  while (q.length > 4) {
    let bi = 0, ba = Infinity;
    for (let i = 0; i < q.length; i++) {
      const a = q[(i + q.length - 1) % q.length], b = q[i], c = q[(i + 1) % q.length];
      const area = Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;
      if (area < ba) { ba = area; bi = i; }
    }
    q.splice(bi, 1);
  }
  return q;
}

/** Line through the outermost points along one side of the quad (robust to tape flaps and rounded corners). Returns {p, d}. */
function fitSide(a, b, pts, cen) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), tx = dx / len, ty = dy / len;
  let nx = -ty, ny = tx;
  if ((cen[0] - a[0]) * nx + (cen[1] - a[1]) * ny > 0) { nx = -nx; ny = -ny; } // outward
  const BINS = 24, best = new Array(BINS).fill(-Infinity), win = 0.15 * len;
  for (const [x, y] of pts) {
    const t = ((x - a[0]) * tx + (y - a[1]) * ty) / len, o = (x - a[0]) * nx + (y - a[1]) * ny;
    if (t < 0.12 || t > 0.88 || o < -win || o > win) continue;
    const k = Math.min(BINS - 1, Math.floor(((t - 0.12) / 0.76) * BINS));
    if (o > best[k]) best[k] = o;
  }
  let samples = best.map((o, k) => [0.12 + ((k + 0.5) / BINS) * 0.76, o]).filter((s) => s[1] > -Infinity);
  let m = 0, c = samples.length ? samples.reduce((s, q) => s + q[1], 0) / samples.length : 0; // offset = c + m * t
  for (let pass = 0; pass < 2 && samples.length >= 6; pass++) {
    const n = samples.length, sx = samples.reduce((s, q) => s + q[0], 0), sy = samples.reduce((s, q) => s + q[1], 0);
    const sxx = samples.reduce((s, q) => s + q[0] * q[0], 0), sxy = samples.reduce((s, q) => s + q[0] * q[1], 0), den = n * sxx - sx * sx;
    m = den ? (n * sxy - sx * sy) / den : 0; c = (sy - m * sx) / n;
    samples = samples.map((q) => [q[0], q[1], Math.abs(q[1] - (c + m * q[0]))]).sort((p, q) => p[2] - q[2]).slice(0, Math.ceil(n * 0.7));
  }
  const p = [a[0] + nx * c, a[1] + ny * c], d = [tx + nx * m / len, ty + ny * m / len]; // direction tilts by the fitted slope
  return { p, d };
}
const cross = (l, k) => { // intersection of two {p, d} lines
  const den = l.d[0] * k.d[1] - l.d[1] * k.d[0], t = ((k.p[0] - l.p[0]) * k.d[1] - (k.p[1] - l.p[1]) * k.d[0]) / den;
  return [l.p[0] + l.d[0] * t, l.p[1] + l.d[1] * t];
};

/** 3x3 homography H (h33 = 1) with H * from[i] = to[i], from four point pairs. */
function homography(from, to) {
  const A = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = from[i], [u, v] = to[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u], [0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }
  for (let c = 0; c < 8; c++) {
    let p = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < 8; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 9; k++) A[r][k] -= f * A[c][k]; }
  }
  return [...A.map((r, i) => r[8] / r[i]), 1];
}

/**
 * correct(rgba, W, H) → { data, W, H, quad } or null when the whole plate is not in view (the caller then uses the photo as it is).
 * The input can be large (1000+ px wide): the plate is found on a shrunk copy, the warp samples the full image.
 */
export function correct(src, SW, SH, { side = 640, margin = 60 } = {}) {
  const k = Math.max(1, Math.floor(SW / 640)), sm = shrink(src, SW, SH, k), W = sm.W, H = sm.H, N = W * H;
  const plate = new Uint8Array(N), tape = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const [h, s, v] = rgbToHsv(sm.data[i * 4], sm.data[i * 4 + 1], sm.data[i * 4 + 2]);
    if (isPlate(h, s, v)) plate[i] = 1; else if (isTape(h, s, v)) tape[i] = 1;
  }
  const both = plate.map((v, i) => v | tape[i]); // tape lanes cut the green into strips, so the plate is green + tape together
  const region = biggestBlob(both, W, H);
  if (!region || region.length < N * 0.04) return null;

  // plate outline: plate + the tape lying on it → hull → four sides refitted → corners
  const pts = region.map((i) => [i % W, (i / W) | 0]);
  const cen = pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);
  const hq = toQuad(hull(pts.filter((_, i) => i % 3 === 0)));
  let quad = null;
  if (hq.length === 4) {
    const sides = hq.map((a, i) => fitSide(a, hq[(i + 1) % 4], pts, cen));
    const c = sides.map((s, i) => cross(sides[(i + 3) % 4], s)); // corner i = side i-1 ∩ side i, same order as hq
    const area = Math.abs(c.reduce((a, p, i) => a + p[0] * c[(i + 1) % 4][1] - c[(i + 1) % 4][0] * p[1], 0)) / 2;
    const edge = 0.01 * Math.min(W, H);
    const inside = c.every((p) => p[0] > edge && p[0] < W - 1 - edge && p[1] > edge && p[1] < H - 1 - edge); // a plate cut off by the frame cannot be rectified
    if (inside && area > N * 0.08 && c.every((p) => isFinite(p[0]) && isFinite(p[1]))) quad = c;
  }

  if (!quad) return null;

  // turn the quad so the tape (or else the flattest side) runs left to right, corners TL, TR, BR, BL
  // lane direction = perpendicular to the dominant edge direction of the tape mask (the strips are long, so their edges agree)
  let phi = null, gxx = 0, gyy = 0, gxy = 0, tn = 0;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    if (!tape[i] && !tape[i - 1] && !tape[i + 1] && !tape[i - W] && !tape[i + W]) continue;
    tn += tape[i];
    const gx = tape[i + 1] - tape[i - 1], gy = tape[i + W] - tape[i - W];
    gxx += gx * gx; gyy += gy * gy; gxy += gx * gy;
  }
  if (tn > 0.005 * N) { // gradient axis + 90 degrees, folded into (-90, 90]
    phi = 0.5 * Math.atan2(2 * gxy, gxx - gyy) + Math.PI / 2;
    if (phi > Math.PI / 2) phi -= Math.PI;
  }
  const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
  const edges = quad.map((a, i) => ({ i, a: ang(a, quad[(i + 1) % 4]) }));
  const target = phi ?? edges.reduce((b, e) => (Math.abs(Math.sin(e.a)) < Math.abs(Math.sin(b.a)) ? e : b)).a;
  const dist = (e) => Math.abs(Math.sin(e.a - target));
  const cand = edges.filter((e) => dist(e) < 0.7).sort((p, q) => dist(p) - dist(q)).slice(0, 2);
  const upY = (i) => { const a = quad[i], b = quad[(i + 1) % 4]; return -((a[0] + b[0]) / 2) * Math.sin(target) + ((a[1] + b[1]) / 2) * Math.cos(target); };
  const top = cand.length ? cand.reduce((b, e) => (upY(e.i) < upY(b.i) ? e : b)).i : 0;
  // walk round the quad so that it is clockwise as seen with the top edge flat, starting at the top edge's left end
  const walk = [0, 1, 2, 3].map((j) => quad[(top + j) % 4]);
  const cr = (walk[1][0] - walk[0][0]) * (walk[2][1] - walk[1][1]) - (walk[1][1] - walk[0][1]) * (walk[2][0] - walk[1][0]);
  const tl = cr > 0 ? walk : [walk[1], walk[0], walk[3], walk[2]]; // reverse winding if needed
  const [A, B, C, D] = tl;
  const Wout = side + 2 * margin;
  const Hm = homography([[margin, margin], [margin + side, margin], [margin + side, margin + side], [margin, margin + side]], [A, B, C, D].map((p) => [p[0] * k, p[1] * k]));
  const out = new Uint8ClampedArray(Wout * Wout * 4);
  for (let y = 0; y < Wout; y++) for (let x = 0; x < Wout; x++) {
    const w = Hm[6] * x + Hm[7] * y + 1, sx = (Hm[0] * x + Hm[1] * y + Hm[2]) / w, sy = (Hm[3] * x + Hm[4] * y + Hm[5]) / w, o = (y * Wout + x) * 4;
    if (sx < 0 || sy < 0 || sx >= SW - 1 || sy >= SH - 1) { out[o] = out[o + 1] = out[o + 2] = 128; out[o + 3] = 255; continue; }
    const ix = sx | 0, iy = sy | 0, fx = sx - ix, fy = sy - iy, p = (iy * SW + ix) * 4;
    for (let c = 0; c < 3; c++) {
      const v = src[p + c] * (1 - fx) * (1 - fy) + src[p + 4 + c] * fx * (1 - fy) + src[p + SW * 4 + c] * (1 - fx) * fy + src[p + SW * 4 + 4 + c] * fx * fy;
      out[o + c] = v;
    }
    out[o + 3] = 255;
  }
  return { data: out, W: Wout, H: Wout, quad: tl };
}
