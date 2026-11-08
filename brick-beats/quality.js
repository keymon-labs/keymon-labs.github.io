// Photo checks for Brick Beats: looks at the photo (inside the mat's corners) and returns tips such as "glare" or "too small". Pure; tests in test/quality.test.js.
const inQuad = (q, x, y) => { // point in a convex quad given in either winding
  let pos = 0, neg = 0;
  for (let i = 0; i < 4; i++) { const a = q[i], b = q[(i + 1) % 4], c = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]); if (c > 0) pos++; else if (c < 0) neg++; }
  return !(pos && neg);
};

/** { size, sharp, glare, uneven, dark }: raw measures over the mat area (sampled every 2nd pixel). */
export function measure(data, W, H, quad) {
  const xs = quad.map((p) => p[0]), ys = quad.map((p) => p[1]);
  const x0 = Math.max(1, Math.floor(Math.min(...xs))), x1 = Math.min(W - 2, Math.ceil(Math.max(...xs))), y0 = Math.max(1, Math.floor(Math.min(...ys))), y1 = Math.min(H - 2, Math.ceil(Math.max(...ys)));
  const area = Math.abs(quad.reduce((a, p, i) => a + p[0] * quad[(i + 1) % 4][1] - quad[(i + 1) % 4][0] * p[1], 0)) / 2;
  const grad = [], lum = (x, y) => { const i = (y * W + x) * 4; return 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2]; };
  let n = 0, hot = 0;
  const quads = [[], [], [], []], mid = [(x0 + x1) / 2, (y0 + y1) / 2];
  for (let y = y0; y <= y1; y += 2) for (let x = x0; x <= x1; x += 2) {
    if (!inQuad(quad, x, y)) continue;
    n++;
    const i = (y * W + x) * 4, r = data[i], g = data[i + 1], b = data[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mn > 238) hot++;
    grad.push(Math.hypot(lum(x + 1, y) - lum(x - 1, y), lum(x, y + 1) - lum(x, y - 1)));
    if (g > 70 && g > b * 1.05 && b > r * 2.5) quads[(x > mid[0] ? 1 : 0) + (y > mid[1] ? 2 : 0)].push(mx); // plate-like pixels: how bright is the mat in each quarter
  }
  grad.sort((p, q) => p - q);
  const med = (a) => { const s = a.slice().sort((p, q) => p - q); return s[s.length >> 1]; };
  const qm = quads.filter((a) => a.length > 50).map(med);
  return { size: area / (W * H), sharp: n ? grad[Math.floor(grad.length * 0.97)] : 0, glare: n ? hot / n : 0, uneven: qm.length >= 3 ? Math.max(...qm) / Math.max(1, Math.min(...qm)) : 1, dark: qm.length ? Math.max(...qm) : 255 };
}

/** Tips for the player: [{ id, msg }], most useful first. `m` is `measure`'s result (the photo's size is taken into account for sharpness). */
export function tips(m, W) {
  const out = [], k = W / 1280;
  if (m.size < 0.15) out.push({ id: "small", msg: "The mat is small in the photo. Come a bit closer, with the whole mat still in view." });
  if (m.sharp < 30 * Math.min(1, k + 0.3)) out.push({ id: "blur", msg: "The photo looks blurry. Hold still and let the camera focus." });
  if (m.glare > 0.015) out.push({ id: "glare", msg: "There is glare on the mat. Turn off the flash and tilt the phone away from the light." });
  if (m.uneven > 1.5) out.push({ id: "uneven", msg: "The light is uneven (a shadow or a lamp on one side). Even, soft light reads best." });
  if (m.dark < 90) out.push({ id: "dark", msg: "It is dark. Turn on a light or move closer to a window." });
  return out;
}
