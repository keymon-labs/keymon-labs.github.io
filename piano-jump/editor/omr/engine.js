// Staff recogniser: pure JS, no model, no dependencies. Finds the five staff lines, note heads, stems, flags, dots and barlines in a
// picture of ONE staff and turns them into notes. A first draft: no rests, accidentals, ties or key changes; the editor is where it gets fixed.
// Contract (swap engines by changing one import in scan.js):
//   recognize(imageData, { clef }) → Promise<[{ pitch: "C4", beats: 0.5|1|1.5|2|3|4, bar: 0-based from the first note, confidence: 0..1, x, y }]>
//   imageData is { width, height, data (RGBA) }, cropped to one staff. Returns [] when it finds nothing.
import { stepToPitch } from "../song-model.js";

export const name = "classic";

/** Grey levels → 1 = ink, using Otsu's threshold. */
function binarize({ width: w, height: h, data }) {
  const n = w * h, grey = new Uint8Array(n), hist = new Uint32Array(256);
  for (let i = 0; i < n; i++) { const v = (data[4 * i] * 299 + data[4 * i + 1] * 587 + data[4 * i + 2] * 114) / 1000 | 0; grey[i] = v; hist[v]++; }
  let sum = 0; for (let t = 0; t < 256; t++) sum += t * hist[t];
  let wB = 0, sB = 0, best = 0, thr = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t]; const wF = n - wB; if (!wB) continue; if (!wF) break;
    sB += t * hist[t]; const d = sB / wB - (sum - sB) / wF, between = wB * wF * d * d;
    if (between > best) { best = between; thr = t; }
  }
  const ink = new Uint8Array(n);
  for (let i = 0; i < n; i++) ink[i] = grey[i] <= thr ? 1 : 0;
  return ink;
}

/** Five evenly spaced horizontal lines, found from the row totals. */
function findStaff(ink, w, h) {
  const rows = new Uint32Array(h);
  for (let y = 0; y < h; y++) { let c = 0; for (let x = 0; x < w; x++) c += ink[y * w + x]; rows[y] = c; }
  const max = Math.max(...rows);
  if (max < w * 0.3) return null;
  for (const f of [0.6, 0.45, 0.3]) {
    const bands = [];
    for (let y = 0; y < h;) {
      if (rows[y] >= f * max) { const y0 = y; while (y < h && rows[y] >= f * max) y++; bands.push({ y0, y1: y - 1, c: (y0 + y - 1) / 2 }); } else y++;
    }
    for (let i = 0; i < bands.length; i++) {                      // grow each band to its soft edges so blurred lines are removed whole
      const lo = i ? bands[i - 1].y1 + 1 : 0, hi = i < bands.length - 1 ? bands[i + 1].y0 - 1 : h - 1;
      while (bands[i].y0 > lo && rows[bands[i].y0 - 1] >= 0.2 * max) bands[i].y0--;
      while (bands[i].y1 < hi && rows[bands[i].y1 + 1] >= 0.2 * max) bands[i].y1++;
    }
    let best = null;
    for (let i = 0; i + 5 <= bands.length; i++) {
      const five = bands.slice(i, i + 5), gaps = [1, 2, 3, 4].map((k) => five[k].c - five[k - 1].c), sp = gaps.reduce((a, b) => a + b) / 4;
      const dev = Math.max(...gaps.map((g) => Math.abs(g - sp))) / sp;
      if (sp >= 5 && dev <= 0.25 && (!best || dev < best.dev)) best = { dev, lines: five, sp, lt: five.reduce((a, b) => a + (b.y1 - b.y0 + 1), 0) / 5 };
    }
    if (best) return best;
  }
  return null;
}

/** Wipe staff lines, but keep any pixel column where something crosses the line (heads, stems). */
function removeLines(ink, w, h, lines) {
  const clean = ink.slice();
  for (const L of lines) {
    for (let x = 0; x < w; x++) {
      const up = L.y0 > 0 && ink[(L.y0 - 1) * w + x], down = L.y1 < h - 1 && ink[(L.y1 + 1) * w + x];
      if (!up && !down) for (let y = L.y0; y <= L.y1; y++) clean[y * w + x] = 0;
    }
  }
  return clean;
}

/** Barlines: columns that are ink from the top line to the bottom line and thin all the way (a stem and its head are wide where the head is). */
function findBarlines(ink, w, staff) {
  const top = Math.round(staff.lines[0].c), bot = Math.round(staff.lines[4].c), cols = [], limit = Math.max(3, Math.round(0.35 * staff.sp) + 1);
  const onLine = (y) => staff.lines.some((l) => y >= l.y0 - 1 && y <= l.y1 + 1);
  for (let x = 0; x < w; x++) {
    let c = 0; for (let y = top; y <= bot; y++) c += ink[y * w + x];
    if (c < 0.9 * (bot - top + 1)) continue;
    let thin = true;
    for (let y = top; y <= bot && thin; y++) {
      if (onLine(y)) continue;
      let a = x, b = x; while (a > 0 && ink[y * w + a - 1] && x - a < 40) a--; while (b < w - 1 && ink[y * w + b + 1] && b - x < 40) b++;
      thin = b - a + 1 <= limit;
    }
    if (thin) cols.push(x);
  }
  const groups = [];
  for (const x of cols) { const g = groups[groups.length - 1]; if (g && x - g.end <= 1) g.end = x; else groups.push({ start: x, end: x }); }
  return groups.map((g) => (g.start + g.end) / 2);
}

/** Square-window erosion: a pixel survives only if the whole (2r+1) window is ink. Thin things (stems, lines, beams) vanish; heads stay. */
function erode(src, w, h, r) {
  const k = 2 * r + 1, tmp = new Uint8Array(w * h), out = new Uint8Array(w * h), pre = new Uint32Array(Math.max(w, h) + 1);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) pre[x + 1] = pre[x] + src[y * w + x];
    for (let x = r; x < w - r; x++) tmp[y * w + x] = pre[x + r + 1] - pre[x - r] === k ? 1 : 0;
  }
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) pre[y + 1] = pre[y] + tmp[y * w + x];
    for (let y = r; y < h - r; y++) out[y * w + x] = pre[y + r + 1] - pre[y - r] === k ? 1 : 0;
  }
  return out;
}

/** Connected blobs of 1s: [{ x0, x1, y0, y1, area }]. */
function blobs(mask, w, h, eight) {
  const seen = new Uint8Array(w * h), out = [], stack = [];
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || seen[s]) continue;
    const b = { x0: w, x1: 0, y0: h, y1: 0, area: 0 };
    seen[s] = 1; stack.push(s);
    while (stack.length) {
      const p = stack.pop(), x = p % w, y = (p / w) | 0;
      b.area++; if (x < b.x0) b.x0 = x; if (x > b.x1) b.x1 = x; if (y < b.y0) b.y0 = y; if (y > b.y1) b.y1 = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if ((!dx && !dy) || (!eight && dx && dy)) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx; if (mask[q] && !seen[q]) { seen[q] = 1; stack.push(q); }
      }
    }
    out.push(b);
  }
  return out;
}

/** White areas completely enclosed by ink (the middle of a hollow head). */
function enclosed(clean, w, h) {
  const outside = new Uint8Array(w * h), stack = [], push = (x, y) => { const p = y * w + x; if (!clean[p] && !outside[p]) { outside[p] = 1; stack.push(p); } };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) { const p = stack.pop(), x = p % w, y = (p / w) | 0; if (x > 0) push(x - 1, y); if (x < w - 1) push(x + 1, y); if (y > 0) push(x, y - 1); if (y < h - 1) push(x, y + 1); }
  const holes = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) holes[i] = !clean[i] && !outside[i] ? 1 : 0;
  return blobs(holes, w, h, false);
}

/** Fraction of ink in a box (clamped to the picture). */
function density(img, w, h, x0, y0, x1, y1) {
  x0 = Math.max(0, Math.round(x0)); y0 = Math.max(0, Math.round(y0)); x1 = Math.min(w - 1, Math.round(x1)); y1 = Math.min(h - 1, Math.round(y1));
  if (x1 < x0 || y1 < y0) return 0;
  let c = 0; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) c += img[y * w + x];
  return c / ((x1 - x0 + 1) * (y1 - y0 + 1));
}

/** Longest straight ink run from (x, y) going up (-1) or down (+1), in pixels. */
function run(img, w, h, x, y, dir, limit) {
  let n = 0;
  for (let yy = y; yy >= 0 && yy < h && n < limit; yy += dir) { if (!img[yy * w + x]) break; n++; }
  return n;
}

/** Candidate heads: solid ones from erosion, hollow ones from enclosed holes with an ink ring around them. */
function findHeads(clean, w, h, sp) {
  const r = Math.max(1, Math.round(sp * 0.28)), heads = [];
  for (const b of blobs(erode(clean, w, h, r), w, h, true)) {
    const bw = b.x1 - b.x0 + 1 + 2 * r, bh = b.y1 - b.y0 + 1 + 2 * r;
    if (bw < 0.75 * sp || bw > 2 * sp || bh < 0.6 * sp || bh > 1.5 * sp) continue;
    heads.push({ hollow: false, cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, hw: bw / 2, fill: b.area / ((b.x1 - b.x0 + 1) * (b.y1 - b.y0 + 1)) });
  }
  const t = Math.max(1, Math.round(sp * 0.18)), tmax = Math.max(2, Math.round(sp * 0.45));
  for (const b of enclosed(clean, w, h)) {
    const bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1;
    if (bw < 0.35 * sp || bw > 1.3 * sp || bh < 0.18 * sp || bh > 0.8 * sp || b.area < 0.06 * sp * sp || b.area / (bw * bh) < 0.5) continue;
    const cx = Math.round((b.x0 + b.x1) / 2), cy = Math.round((b.y0 + b.y1) / 2);
    const thick = (dx, dy) => {                       // ink thickness going outward from the hole edge; 0 if no ring
      let x = dx > 0 ? b.x1 + 1 : dx < 0 ? b.x0 - 1 : cx, y = dy > 0 ? b.y1 + 1 : dy < 0 ? b.y0 - 1 : cy, n = 0;
      for (let i = 0; i < tmax + 2 && x >= 0 && y >= 0 && x < w && y < h; i++, x += dx, y += dy) { if (!clean[y * w + x]) break; n++; }
      return n;
    };
    const ring = [thick(1, 0), thick(-1, 0), thick(0, 1), thick(0, -1)];
    if (ring.some((n) => n < 1)) continue;                      // ink on all four sides; how thick varies (stems and staff lines merge with the ring)
    heads.push({ hollow: true, cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, hw: bw / 2 + Math.min(...ring, tmax), fill: 1 });
  }
  heads.sort((a, b) => a.cx - b.cx);
  return heads.filter((a, i) => !heads.some((b, j) => j < i && Math.hypot(a.cx - b.cx, a.cy - b.cy) < 0.6 * sp));
}

export async function recognize(img, opts = {}) {
  await new Promise((r) => setTimeout(r));                      // let the page paint "Reading…" first
  const { width: w, height: h } = img, ink = binarize(img), staff = findStaff(ink, w, h);
  if (!staff) return [];
  const { sp, lt } = staff, bottom = staff.lines[4].c, bottomStep = opts.clef === "bass" ? -10 : 2;
  const clean = removeLines(ink, w, h, staff.lines), barlines = findBarlines(ink, w, staff), heads = findHeads(clean, w, h, sp);
  if (!heads.length) return [];
  const first = heads[0].cx;
  return heads.map((hd) => {
    const t = (bottom - hd.cy) / (sp / 2), step = Math.round(t);
    let conf = 1 - Math.abs(t - step);                             // heads sit on a line or in a space; in between means doubt
    // stem: the longest straight vertical run near the head's left or right edge
    let stemLen = 0, dir = -1, stemX = hd.cx;
    for (let x = Math.round(hd.cx - hd.hw - 1); x <= Math.round(hd.cx + hd.hw + 1); x++) {
      if (x < 0 || x >= w) continue;
      const u = run(clean, w, h, x, Math.round(hd.cy), -1, 4.6 * sp), d = run(clean, w, h, x, Math.round(hd.cy), 1, 4.6 * sp);
      if (Math.max(u, d) > stemLen) { stemLen = Math.max(u, d); dir = u >= d ? -1 : 1; stemX = x; }
    }
    const hasStem = stemLen >= 2.2 * sp;
    let beats;
    if (hd.hollow) beats = hasStem ? 2 : 4;
    else if (!hasStem) { beats = 1; conf -= 0.35; }
    else {
      const tip = hd.cy + dir * stemLen, y0 = dir < 0 ? tip : tip - 1.3 * sp, y1 = dir < 0 ? tip + 1.3 * sp : tip;
      const side = (a, b) => density(clean, w, h, stemX + a * sp, y0, stemX + b * sp, y1);
      beats = Math.max(side(0.3, 1.1), side(-1.1, -0.3)) >= 0.18 ? 0.5 : 1;   // a flag (right) or a beam (either side) at the stem's end
    }
    if (hd.fill < 0.5) conf -= 0.2;
    if (beats === 1 || beats === 2) {                                // dot: a small isolated blob beside the head, in the space above a line or on a space
      const dx = hd.cx + hd.hw + 0.65 * sp;
      for (const dy of [hd.cy, hd.cy - sp / 2]) {
        const r = 0.21 * sp, inner = density(clean, w, h, dx - r, dy - r, dx + r, dy + r), outer = density(clean, w, h, dx - 0.5 * sp, dy - 0.5 * sp, dx + 0.5 * sp, dy + 0.5 * sp);
        if (inner >= 0.4 && outer <= 0.3) { beats *= 1.5; break; }
      }
    }
    const bar = barlines.filter((x) => x > first && x < hd.cx).length;
    return { pitch: stepToPitch(bottomStep + step), beats, bar, confidence: Math.max(0, Math.min(1, conf)), x: hd.cx, y: hd.cy };
  });
}
