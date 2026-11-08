// Photo tips (quality.js) on generated photos: clean gives none, each fault gives its tip.
import test from "node:test";
import assert from "node:assert/strict";
import { measure, tips } from "../quality.js";
import { findCorners } from "../correct.js";
import { renderMat, distort, EXAMPLE } from "../../scripts/brick-beats-mat.mjs";

let cur = null; // the photo `each` is editing
const p0 = (i, c, f) => { cur.data[i + c] = f(cur.data[i + c]); };
const photo = (o = {}) => distort(renderMat(EXAMPLE, { margin: 160, wood: true }), { outW: 1000, outH: 1300, scale: 0.95, rot: 5, ...o });
const ids = (p) => { const f = findCorners(p.data, p.width, p.height); assert.ok(f, "corners"); return tips(measure(p.data, p.width, p.height, f.quad), p.width).map((t) => t.id); };
const each = (p, fn) => { cur = p; for (let y = 0; y < p.height; y++) for (let x = 0; x < p.width; x++) { const i = (y * p.width + x) * 4; fn(i, x, y); } return p; };

test("a clean photo gets no tips", () => assert.deepEqual(ids(photo()), []));
test("glare, a one-sided shadow and darkness are named", () => {
  assert.ok(ids(each(photo(), (i, x, y) => { const a = Math.max(0, 1 - Math.hypot(x - 520, y - 600) / 150) * 200; for (let c = 0; c < 3; c++) p0(i, c, (v) => Math.min(255, v + a)); })).includes("glare"));
  assert.ok(ids(each(photo(), (i, x) => { if (x > 500) for (let c = 0; c < 3; c++) p0(i, c, (v) => v * 0.55); })).includes("uneven"));
  assert.ok(ids(each(photo(), (i) => { for (let c = 0; c < 3; c++) p0(i, c, (v) => v * 0.6); })).includes("dark"));
});
test("a mat far away is too small", () => assert.ok(ids(photo({ scale: 0.6 })).includes("small")));

