// Brick Beats photo reading, checked on generated mats (scripts/brick-beats-mat.mjs): no real photos in the repo.
import test from "node:test";
import assert from "node:assert/strict";
import { detect, NAMES, rgbToHsv, classifyHSV } from "../vision.js";
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
