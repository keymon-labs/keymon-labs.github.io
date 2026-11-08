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
  const rms = samples.length >= 6 ? Math.sqrt(samples.reduce((t, q) => t + q[2] * q[2], 0) / samples.length) / len : 1; // how far the edge wobbles, as a share of its length
  return { p, d, rms };
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

/** Strong large-scale corners in colour (Harris on the colour gradients of a ~320 px copy, so single studs fade out). [{x, y, s}] in photo pixels, strongest first. */
function cornerBits(src, SW, SH) {
  const k = Math.max(1, Math.round(SW / 320)), sm = shrink(src, SW, SH, k), W = sm.W, H = sm.H, N = W * H;
  const box = (a, r) => { // separable box blur, radius r
    const t = new Float32Array(N), o = new Float32Array(N), n = 2 * r + 1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = 0; for (let j = -r; j <= r; j++) v += a[y * W + Math.min(W - 1, Math.max(0, x + j))]; t[y * W + x] = v / n; }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = 0; for (let j = -r; j <= r; j++) v += t[Math.min(H - 1, Math.max(0, y + j)) * W + x]; o[y * W + x] = v / n; }
    return o;
  };
  const xx = new Float32Array(N), yy = new Float32Array(N), xy = new Float32Array(N);
  for (let c = 0; c < 3; c++) { // a green / blue / wood edge counts even where the brightness barely changes
    const g = new Float32Array(N);
    for (let i = 0; i < N; i++) g[i] = sm.data[i * 4 + c];
    const b = box(box(g, 1), 1);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x, gx = b[i + 1] - b[i - 1], gy = b[i + W] - b[i - W];
      xx[i] += gx * gx; yy[i] += gy * gy; xy[i] += gx * gy;
    }
  }
  const A = box(box(xx, 2), 2), B = box(box(yy, 2), 2), C = box(box(xy, 2), 2), R = new Float32Array(N);
  let top = 0;
  for (let i = 0; i < N; i++) { R[i] = A[i] * B[i] - C[i] * C[i] - 0.05 * (A[i] + B[i]) ** 2; if (R[i] > top) top = R[i]; }
  const out = [];
  for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) {
    const v = R[y * W + x];
    if (v < top * 0.02) continue;
    let max = true;
    for (let j = -3; j <= 3 && max; j++) for (let i = -3; i <= 3; i++) if ((i || j) && R[(y + j) * W + x + i] > v) { max = false; break; }
    if (max) out.push({ x: (x + 0.5) * k, y: (y + 0.5) * k, s: v / top });
  }
  return out.sort((a, b) => b.s - a.s).slice(0, 300);
}

/** What a dragged dot can snap to: the plate's corners from the colour outline (even when the reader was not sure of them) and strong colour corners. */
export function snapTargets(src, SW, SH) {
  return { corners: findCorners(src, SW, SH)?.quad ?? null, bits: cornerBits(src, SW, SH) };
}

/** Where a dot let go at (x, y) lands: on a plate corner within r, else on the strongest colour corner within 0.6 r, else where it is. */
export function snapPoint(t, x, y, r) {
  let best = null, bd = r;
  for (const p of t.corners || []) { const d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; best = p; } }
  if (best) return best.slice();
  let bs = 0;
  for (const c of t.bits) { const d = Math.hypot(c.x - x, c.y - y); if (d > 0.6 * r) continue; const v = c.s * (1 - d / r); if (v > bs) { bs = v; best = [c.x, c.y]; } }
  return best || [x, y];
}

/** Does an earlier photo's quad (photo pixels) still sit on the plate? Returns { inside, ring }: the share of plate or tape colour inside it and in a band 12% wider just outside it. */
export function plateShare(src, SW, SH, quad) {
  const m = scan(src, SW, SH), c = quad.reduce((a, p) => [a[0] + p[0] / 4, a[1] + p[1] / 4], [0, 0]);
  const share = (pts) => {
    const q = pts.map(([x, y]) => [x / m.k, y / m.k]), sgn = Math.sign((q[1][0] - q[0][0]) * (q[2][1] - q[1][1]) - (q[1][1] - q[0][1]) * (q[2][0] - q[1][0])) || 1;
    let n = 0, hit = 0;
    for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) {
      if (!q.every((a, i) => { const b = q[(i + 1) % 4]; return sgn * ((b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0])) >= 0; })) continue;
      n++; hit += m.plate[y * m.W + x] | m.tape[y * m.W + x];
    }
    return [n, hit];
  };
  const [n, hit] = share(quad), [nw, hw] = share(quad.map(([x, y]) => [c[0] + (x - c[0]) * 1.12, c[1] + (y - c[1]) * 1.12]));
  return { inside: n ? hit / n : 0, ring: nw > n ? (hw - hit) / (nw - n) : 1 };
}

/** Colour masks of a shrunk copy (the plate is found on ~640 px, the warp samples the full image). */
function scan(src, SW, SH) {
  const k = Math.max(1, Math.floor(SW / 640)), sm = shrink(src, SW, SH, k), W = sm.W, H = sm.H, N = W * H;
  const plate = new Uint8Array(N), tape = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const [h, s, v] = rgbToHsv(sm.data[i * 4], sm.data[i * 4 + 1], sm.data[i * 4 + 2]);
    if (isPlate(h, s, v)) plate[i] = 1; else if (isTape(h, s, v)) tape[i] = 1;
  }
  return { k, W, H, N, plate, tape };
}

/** Close small gaps in a mask (dilate then erode with a square of radius r): bricks, glare and thin lines must not split the plate. */
function closeMask(m, W, H, r) {
  const pass = (src, grow) => { // separable box max (grow) or min (shrink)
    const t = new Uint8Array(W * H), o = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let v = grow ? 0 : 1;
      for (let k = -r; k <= r; k++) { const xx = x + k; if (xx < 0 || xx >= W) { if (!grow) v = 0; continue; } if (grow ? src[y * W + xx] : !src[y * W + xx]) { v = grow ? 1 : 0; break; } }
      t[y * W + x] = v;
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let v = grow ? 0 : 1;
      for (let k = -r; k <= r; k++) { const yy = y + k; if (yy < 0 || yy >= H) { if (!grow) v = 0; continue; } if (grow ? t[yy * W + x] : !t[yy * W + x]) { v = grow ? 1 : 0; break; } }
      o[y * W + x] = v;
    }
    return o;
  };
  return pass(pass(m, true), false);
}

/** Best four corners on a convex outline: the 4-vertex polygon whose sides stay closest to the outline (rounded corners and bumps do not move it). */
function bestQuad(poly) {
  const per = poly.reduce((a, p, i) => a + Math.hypot(p[0] - poly[(i + 1) % poly.length][0], p[1] - poly[(i + 1) % poly.length][1]), 0), N = 96, ds = per / N, v = [];
  let carry = 0;
  for (let i = 0; i < poly.length; i++) { // resample the outline evenly
    const a = poly[i], b = poly[(i + 1) % poly.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let t = carry; t < len; t += ds) v.push([a[0] + ((b[0] - a[0]) * t) / len, a[1] + ((b[1] - a[1]) * t) / len]);
    carry = ((carry - len) % ds + ds) % ds; if (carry === ds) carry = 0;
  }
  const n = v.length;
  if (n < 16) return null;
  const cost = Array.from({ length: n }, () => new Float64Array(n)); // cost[i][len]: squared distance of the points between i and i+len to their chord
  for (let i = 0; i < n; i++) for (let len = 2; len < n; len++) {
    const a = v[i], b = v[(i + len) % n], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    let c = 0;
    for (let k = 1; k < len; k++) { const q = v[(i + k) % n], d = ((q[0] - a[0]) * dy - (q[1] - a[1]) * dx) / L; c += d * d; }
    cost[i][len] = c;
  }
  const min = 3; let best = Infinity, cuts = null;
  for (let s = 0; s < n; s++) { // dp over four consecutive sides starting at vertex s
    let f = new Float64Array(n + 1).fill(Infinity), from = [];
    f[0] = 0;
    for (let k = 1; k <= 4; k++) {
      const g = new Float64Array(n + 1).fill(Infinity), fr = new Int16Array(n + 1);
      for (let j = min * k; j <= n; j++) for (let i = min * (k - 1); i <= j - min; i++) { const c = f[i] + (j - i < n ? cost[(s + i) % n][j - i] : Infinity); if (c < g[j]) { g[j] = c; fr[j] = i; } }
      from.push(fr); f = g;
    }
    if (f[n] < best) { best = f[n]; const c = [n]; for (let k = 3; k >= 0; k--) c.unshift(from[k][c[0]]); cuts = c.slice(0, 4).map((i) => (s + i) % n); }
  }
  return cuts && cuts.map((i) => v[i]);
}


/** Plate outline: plate + the tape lying on it → gaps closed → hull → best four corners → sides refitted twice → corners (shrunk coordinates), or null. */
function plateQuad({ W, H, N, plate, tape }) {
  const both = closeMask(plate.map((v, i) => v | tape[i]), W, H, 3); // tape lanes cut the green into strips, so the plate is green + tape together
  const region = biggestBlob(both, W, H);
  if (!region || region.length < N * 0.04) return null;
  const pts = region.map((i) => [i % W, (i / W) | 0]);
  const cen = pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);
  const h = hull(pts.filter((_, i) => i % 2 === 0));
  let q = bestQuad(h), rms = 1;
  if (!q) return null;
  for (let pass = 0; pass < 2; pass++) {
    const sides = q.map((a, i) => fitSide(a, q[(i + 1) % 4], pts, cen));
    q = sides.map((s, i) => cross(sides[(i + 3) % 4], s)); // corner i = side i-1 ∩ side i
    rms = Math.max(...sides.map((s) => s.rms));
  }
  const area = (poly) => Math.abs(poly.reduce((a, p, i) => a + p[0] * poly[(i + 1) % poly.length][1] - poly[(i + 1) % poly.length][0] * p[1], 0)) / 2;
  const edge = 0.01 * Math.min(W, H);
  const inside = q.every((p) => p[0] > edge && p[0] < W - 1 - edge && p[1] > edge && p[1] < H - 1 - edge); // a plate cut off by the frame cannot be rectified
  if (!inside || area(q) < N * 0.08 || !q.every((p) => isFinite(p[0]) && isFinite(p[1]))) return null;
  // does the quad agree with the region it came from? (nothing left outside it, not much empty floor inside it)
  const tol = 0.012 * Math.max(W, H), sgn = Math.sign((q[1][0] - q[0][0]) * (q[2][1] - q[1][1]) - (q[1][1] - q[0][1]) * (q[2][0] - q[1][0])) || 1;
  const away = (p) => q.some((a, i) => { const b = q[(i + 1) % 4]; return (sgn * ((p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0]))) / Math.hypot(b[0] - a[0], b[1] - a[1]) > tol; }); // outside this side
  const out = pts.filter(away).length / pts.length;
  return { quad: q, rms, outside: out, excess: area(q) / area(h) };
}

/** Direction the tape lanes run (radians, in (-90, 90]) from the tape mask's edges, or null without tape. */
function laneAngle({ W, H, N, tape }) {
  let gxx = 0, gyy = 0, gxy = 0, tn = 0;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    if (!tape[i] && !tape[i - 1] && !tape[i + 1] && !tape[i - W] && !tape[i + W]) continue;
    tn += tape[i];
    const gx = tape[i + 1] - tape[i - 1], gy = tape[i + W] - tape[i - W];
    gxx += gx * gx; gyy += gy * gy; gxy += gx * gy;
  }
  if (tn <= 0.005 * N) return null;
  let phi = 0.5 * Math.atan2(2 * gxy, gxx - gyy) + Math.PI / 2; // gradient axis + 90 degrees, folded
  if (phi > Math.PI / 2) phi -= Math.PI;
  return phi;
}

/** Turn a quad (any scale) so the lanes (or else the flattest side) run left to right: corners TL, TR, BR, BL. */
function orderQuad(quad, phi) {
  const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
  const edges = quad.map((a, i) => ({ i, a: ang(a, quad[(i + 1) % 4]) }));
  const target = phi ?? edges.reduce((b, e) => (Math.abs(Math.sin(e.a)) < Math.abs(Math.sin(b.a)) ? e : b)).a;
  const dist = (e) => Math.abs(Math.sin(e.a - target));
  const cand = edges.filter((e) => dist(e) < 0.7).sort((p, q) => dist(p) - dist(q)).slice(0, 2);
  const upY = (i) => { const a = quad[i], b = quad[(i + 1) % 4]; return -((a[0] + b[0]) / 2) * Math.sin(target) + ((a[1] + b[1]) / 2) * Math.cos(target); };
  const top = cand.length ? cand.reduce((b, e) => (upY(e.i) < upY(b.i) ? e : b)).i : 0;
  const walk = [0, 1, 2, 3].map((j) => quad[(top + j) % 4]); // clockwise as seen with the top edge flat, from its left end
  const cr = (walk[1][0] - walk[0][0]) * (walk[2][1] - walk[1][1]) - (walk[1][1] - walk[0][1]) * (walk[2][0] - walk[1][0]);
  return cr > 0 ? walk : [walk[1], walk[0], walk[3], walk[2]];
}

/**
 * How much the camera angle squashed the square, from its four corners (TL, TR, BR, BL): 0 = seen straight on.
 * score 1 is where a straight-on retake is worth asking for; level is "good" (< 0.5), "ok" (< 1) or "high".
 */
export function distortion(q) {
  const d = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]), [A, B, C, D] = q;
  const top = d(A, B), right = d(B, C), bottom = d(C, D), left = d(D, A);
  const pr = Math.max(Math.abs(top - bottom) / Math.max(top, bottom), Math.abs(left - right) / Math.max(left, right)); // far side looks shorter
  const w = (top + bottom) / 2, h = (left + right) / 2, asp = Math.max(w, h) / Math.min(w, h) - 1; // one direction squashed
  let dev = 0;
  for (let i = 0; i < 4; i++) {
    const p = q[(i + 3) % 4], c = q[i], n = q[(i + 1) % 4];
    const a = Math.acos(Math.max(-1, Math.min(1, ((p[0] - c[0]) * (n[0] - c[0]) + (p[1] - c[1]) * (n[1] - c[1])) / (d(p, c) * d(c, n) || 1))));
    dev = Math.max(dev, Math.abs((a * 180) / Math.PI - 90));
  }
  const score = Math.max(pr / 0.25, asp / 0.5, dev / 30);
  return { score, level: score < 0.5 ? "good" : score < 1 ? "ok" : "high" };
}

/**
 * findCorners(rgba, W, H) → { quad: [TL, TR, BR, BL] in photo pixels, score, level, sure } or null when the whole plate is not in view.
 * `sure` says the four sides were straight lines (not hidden by a hand or cut by clutter) and the angle is not extreme.
 */
export function findCorners(src, SW, SH) {
  const m = scan(src, SW, SH), f = plateQuad(m);
  if (!f) return null;
  const quad = orderQuad(f.quad, laneAngle(m)).map((p) => [p[0] * m.k, p[1] * m.k]);
  const dis = distortion(quad);
  return { quad, ...dis, rms: f.rms, outside: f.outside, excess: f.excess, sure: f.rms < 0.03 && f.outside < 0.04 && f.excess < 1.25 && dis.score < 2.5 };
}

/** Corners the player placed (any order of turning) → turned so the lanes run left to right, when the tape shows which way that is. */
export function turnQuad(src, SW, SH, quad) {
  const phi = laneAngle(scan(src, SW, SH));
  return phi == null ? quad : orderQuad(quad, phi);
}

/** Flat top-down square (plate side `side`, with a margin) from a quad [TL, TR, BR, BL] in photo pixels. */
export function warp(src, SW, SH, quad, { side = 640, margin = 60 } = {}) {
  const Wout = side + 2 * margin;
  const Hm = homography([[margin, margin], [margin + side, margin], [margin + side, margin + side], [margin, margin + side]], quad);
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
  return { data: out, W: Wout, H: Wout };
}

/** correct(rgba, W, H) → { data, W, H, quad, score, level, sure } (the straightened view and how it went), or null when the whole plate is not in view. */
export function correct(src, SW, SH, opts) {
  const f = findCorners(src, SW, SH);
  return f && { ...warp(src, SW, SH, f.quad, opts), quad: f.quad, score: f.score, level: f.level, sure: f.sure, rms: f.rms };
}
