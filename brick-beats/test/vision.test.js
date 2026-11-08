// Brick Beats photo reading, checked on generated mats (scripts/brick-beats-mat.mjs): no real photos in the repo.
import test from "node:test";
import assert from "node:assert/strict";
import { detect, probe, NAMES, rgbToHsv, classifyHSV } from "../vision.js";
import { renderMat, EXAMPLE, BRICK_RGB } from "../../scripts/brick-beats-mat.mjs";

const read = (lanes, opts) => {
  const m = renderMat(lanes, opts);
  return detect(m.data, m.width, m.height);
};
const lanesOf = (res) => res.tracks.map((t) => t.bricks.map((b) => [NAMES[b.cls], b.start, b.len]));

test("every camera colour is read as itself", () => {
  for (const [name, [r, g, b]] of Object.entries(BRICK_RGB)) {
    const [h, s, v] = rgbToHsv(r, g, b);
    assert.equal(NAMES[classifyHSV(h, s, v)], name);
  }
});

test("tape lanes: bricks come back lane by lane with start and length in studs", () => {
  const res = read(EXAMPLE);
  assert.equal(res.ok, true);
  assert.ok(res.lanes, "tape lanes found");
  assert.deepEqual(lanesOf(res), EXAMPLE);
  assert.equal(res.loopLen, 22);
});

test("no tape: rows are grouped by height", () => {
  const res = read(EXAMPLE, { tape: false });
  assert.equal(res.ok, true);
  assert.equal(res.lanes, null);
  assert.deepEqual(lanesOf(res), EXAMPLE);
});

test("an empty lane between tapes stays an empty track", () => {
  const res = read([EXAMPLE[0], [], EXAMPLE[2]]);
  assert.deepEqual(lanesOf(res), [EXAMPLE[0], [], EXAMPLE[2]]);
});

test("a photo with no green plate says so", () => {
  const w = 64, data = new Uint8ClampedArray(w * w * 4).fill(150);
  const res = detect(data, w, w);
  assert.equal(res.ok, false);
  assert.match(res.msg, /baseplate/);
});

test("reading a photo takes well under a second", () => {
  const m = renderMat(EXAMPLE);
  const t = performance.now();
  detect(m.data, m.width, m.height);
  assert.ok(performance.now() - t < 1000);
});

test("lime vs clear lime: vivid or bright is lime, dull and see-through is clear lime", () => {
  const name = (r, g, b) => NAMES[classifyHSV(...rgbToHsv(r, g, b))];
  assert.equal(name(136, 181, 53), "lime"); // vivid but darker, real photo
  assert.equal(name(160, 197, 145), "lime"); // bright but washed out, real photo
  assert.equal(name(138, 168, 117), "clear_lime");
});

test("probe finds a brick the reader missed from one tap", () => {
  const missing = EXAMPLE.map((l, k) => (k === 1 ? l.filter((b) => b[0] !== "white") : l)); // lane 2 without its white 6-stud brick
  const res = detect(...Object.values(renderMat(missing, { tape: true })).slice(0, 3));
  const full = renderMat(EXAMPLE), pb = 1.044 * 24;
  const f = probe(full.data, full.width, full.height, res, 32 + 12 + 11 * pb, 32 + 9 * 24); // middle of that brick
  assert.equal(NAMES[f.cls], "white");
  assert.equal(f.len, 6);
  assert.equal(f.start, 8);
  assert.equal(f.sure, true);
  assert.equal(probe(full.data, full.width, full.height, res, 32 + 5, 32 + 5), null); // plate corner
});

test("a mat that is not green (grey baseplate, a sheet of paper) is read once adapt is on", async () => {
  const { renderMat } = await import("../../scripts/brick-beats-mat.mjs");
  const L = [[["red", 2, 2], ["cyan", 8, 4]], [["pink", 0, 2]], [["lime", 6, 6]], [["blue", 12, 2], ["yellow", 17, 4]]];
  for (const mat of [{ plate: [135, 135, 140], studColour: [155, 155, 160] }, { plate: [246, 246, 240], studColour: null }]) {
    const p = renderMat(L, { tape: false, ...mat }), r = detect(p.data, p.width, p.height, { adapt: true });
    assert.equal(r.ok, true);
    assert.deepEqual(r.tracks.map((t) => t.bricks.map((b) => [NAMES[b.cls], b.start, b.len])), L);
  }
});
