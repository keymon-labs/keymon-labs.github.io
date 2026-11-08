// The matrix a mat is read into: lanes (rows between boundary lines) × columns (the stud grid). Pure; tests: test/grid.test.js.
// Positions are in the straightened view (correct.js: plate square of side 640 inside a 60 px margin); `edges[k]` is the y of line k at x = 0.
export const SQ = { x0: 60, x1: 700, y0: 60, y1: 700 };

/** Lane boundary lines from lane centres: halfway between neighbours, half a lane beyond the two ends. */
export function edgesFrom(c) {
  const n = c.length;
  if (!n) return [SQ.y0, SQ.y1];
  const e = [n > 1 ? c[0] - (c[1] - c[0]) / 2 : c[0] - 20];
  for (let i = 1; i < n; i++) e.push((c[i - 1] + c[i]) / 2);
  e.push(n > 1 ? c[n - 1] + (c[n - 1] - c[n - 2]) / 2 : c[0] + 20);
  return e;
}

/** Column grid from the fitted stud pitch and phase: column 0 starts at the first stud boundary inside the square, the columns fill the square. */
export function gridOf(fitA, pitch, sq = SQ) {
  const x0 = fitA - Math.floor((fitA - sq.x0) / pitch + 0.02) * pitch;
  return { x0, pitch, cols: Math.max(1, Math.floor((sq.x1 - x0) / pitch + 0.2)) };
}

/** Index of the lane a point (x, y) is in; the lines share one slope `tilt`. Points outside the first or last line belong to those lanes. */
export function laneIdx(edges, tilt, x, y) {
  let i = 0;
  while (i < edges.length - 2 && y >= edges[i + 1] + x * tilt) i++;
  return i;
}

/** Column a left edge x falls in. */
export const colOf = (g, x) => Math.round((x - g.x0) / g.pitch);

/** A new line through the middle of the tallest lane: { edges, at } with `at` the index of the new line. */
export function splitTallest(edges) {
  let at = 1, best = -1;
  for (let i = 0; i < edges.length - 1; i++) if (edges[i + 1] - edges[i] > best) { best = edges[i + 1] - edges[i]; at = i + 1; }
  const e = edges.slice();
  e.splice(at, 0, (edges[at - 1] + edges[at]) / 2);
  return { edges: e, at };
}

/** Without line k (only inner lines can go: the two lanes beside it become one), or null. */
export function removeEdge(edges, k) {
  if (k <= 0 || k >= edges.length - 1 || edges.length <= 2) return null;
  return edges.filter((_, i) => i !== k);
}

/** What is kept between photos (saved as JSON in the browser): the grid, the lane lines and the corners of the last photo (as fractions of it). */
export function reviveMapping(text) {
  try {
    const m = JSON.parse(text), nums = (a, n) => Array.isArray(a) && a.length === n && a.every(Number.isFinite);
    if (!m || !Number.isFinite(m.x0) || !(m.pitch > 4) || !Number.isFinite(m.cols) || !Number.isFinite(m.tilt) || !Array.isArray(m.edges) || m.edges.length < 2 || !m.edges.every(Number.isFinite)) return null;
    const quad = Array.isArray(m.quad) && m.quad.length === 4 && m.quad.every((p) => nums(p, 2)) && Number.isFinite(m.ar) ? m.quad : null;
    return { rect: !!m.rect, edges: m.edges, tilt: m.tilt, x0: m.x0, pitch: m.pitch, cols: Math.max(0, m.cols | 0), edited: !!m.edited, quad, ar: quad ? m.ar : 0 };
  } catch { return null; }
}
