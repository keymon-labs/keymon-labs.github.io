// Test helper: draws a synthetic staff (lines, barlines, heads, stems, flags, beams, dots) into an RGBA image, optionally blurred and noisy.
// Notes use half-steps above the bottom line: 0 = bottom line, 1 = first space, 8 = top line, -2 = ledger line below.
export function drawStaff({ w = 560, h = 170, sp = 16, top = 50, notes = [], bars = [], beams = [], blur = false, noise = 0, seed = 7 }) {
  const img = new Uint8Array(w * h), lt = Math.max(1, Math.round(sp / 8));
  const rect = (x0, y0, x1, y1) => { for (let y = Math.max(0, Math.round(y0)); y <= Math.min(h - 1, Math.round(y1)); y++) for (let x = Math.max(0, Math.round(x0)); x <= Math.min(w - 1, Math.round(x1)); x++) img[y * w + x] = 1; };
  const ell = (cx, cy, rx, ry, ang, ring) => {
    const c = Math.cos(ang), s = Math.sin(ang);
    for (let y = Math.floor(cy - rx - 2); y <= cy + rx + 2; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const u = (x - cx) * c + (y - cy) * s, v = -(x - cx) * s + (y - cy) * c, o = (u / rx) ** 2 + (v / ry) ** 2;
      if (o <= 1 && (!ring || (u / ring[0]) ** 2 + (v / ring[1]) ** 2 >= 1)) img[y * w + x] = 1;
    }
  };
  const yOf = (s) => top + 4 * sp - (s * sp) / 2, bottom = yOf(0);
  for (let l = 0; l < 5; l++) rect(0, top + l * sp - lt / 2 + 0.5, w, top + l * sp + lt / 2 - 0.5 + (lt > 1 ? 0 : 0));
  for (const x of bars) rect(x - lt / 2, top, x + lt / 2 - 0.5, bottom);
  for (const n of notes) {
    const cy = yOf(n.s), rx = (n.kind === "whole" ? 0.8 : 0.65) * sp, ry = 0.5 * sp, ang = n.kind === "whole" ? 0 : -0.35;
    for (let s = -2; s >= n.s; s -= 2) rect(n.x - 1.1 * rx, yOf(s) - lt / 2, n.x + 1.1 * rx, yOf(s) + lt / 2 - 0.5);
    for (let s = 10; s <= n.s; s += 2) rect(n.x - 1.1 * rx, yOf(s) - lt / 2, n.x + 1.1 * rx, yOf(s) + lt / 2 - 0.5);
    ell(n.x, cy, rx, ry, ang, n.kind === "filled" ? null : n.kind === "whole" ? [rx * 0.5, ry * 0.72] : [rx * 0.58, ry * 0.5]);
    const dir = n.stem;
    if (dir) {
      const sx = dir === "up" ? n.x + rx - 1 : n.x - rx + 1, tip = cy + (dir === "up" ? -3.5 : 3.5) * sp;
      rect(sx - lt / 2, Math.min(cy, tip), sx + lt / 2 - 0.5, Math.max(cy, tip));
      if (n.flag) for (let t = 0; t <= 1; t += 0.04) rect(sx + t * sp, tip + (dir === "up" ? 1 : -1) * t * 1.7 * sp - 0.2 * sp, sx + t * sp + 0.4 * sp, tip + (dir === "up" ? 1 : -1) * t * 1.7 * sp + 0.2 * sp);
    }
    if (n.dot) rect(n.x + rx + 0.45 * sp, (n.s % 2 === 0 ? yOf(n.s + 1) : cy) - 0.15 * sp, n.x + rx + 0.75 * sp, (n.s % 2 === 0 ? yOf(n.s + 1) : cy) + 0.15 * sp);
  }
  for (const b of beams) rect(b.x1, b.y, b.x2, b.y + 0.5 * sp);
  // grey levels, optional blur and salt-and-pepper noise
  let grey = Float32Array.from(img, (v) => (v ? 20 : 245));
  if (blur) { const g2 = new Float32Array(grey); for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { let s = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += grey[(y + dy) * w + x + dx]; g2[y * w + x] = s / 9; } grey = g2; }
  let st = seed; const rnd = () => ((st = (st * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) { const v = noise && rnd() < noise ? (grey[i] > 128 ? 20 : 245) : grey[i]; data[4 * i] = data[4 * i + 1] = data[4 * i + 2] = v; data[4 * i + 3] = 255; }
  return { width: w, height: h, data };
}
