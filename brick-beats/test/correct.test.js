// Straightening step (correct.js), checked on generated mats that are rotated and seen at an angle (scripts/brick-beats-mat.mjs): no photos in the repo.
import test from "node:test";
import assert from "node:assert/strict";
import { correct } from "../correct.js";
import { detect, NAMES } from "../vision.js";
import { renderMat, distort, EXAMPLE } from "../../scripts/brick-beats-mat.mjs";

const lanesOf = (res) => res.tracks.map((t) => t.bricks.map((b) => [NAMES[b.cls], b.start, b.len]));
const photo = (opts) => distort(renderMat(EXAMPLE, { scale: 1.5 }), opts);

for (const [name, opts] of Object.entries({
  "rotated 25 degrees": { rot: 25 },
  "seen at an angle": { tilt: 0.0004 },
  "rotated, at an angle and smaller": { rot: -15, tilt: 0.0003, scale: 0.7 },
})) {
  test(`straightens a mat ${name} so the bricks read exactly`, () => {
    const p = photo(opts), c = correct(p.data, p.width, p.height);
    assert.ok(c, "plate found");
    const res = detect(c.data, c.W, c.H);
    assert.equal(res.ok, true);
    assert.ok(res.lanes, "tape lanes found");
    assert.deepEqual(lanesOf(res), EXAMPLE);
  });
}

test("a plate cut off by the edge of the photo is left alone", () => {
  const p = distort(renderMat(EXAMPLE, { scale: 1.5 }), { scale: 1.6 });
  assert.equal(correct(p.data, p.width, p.height), null);
});

test("no plate in the photo: nothing to straighten", () => {
  const p = distort(renderMat([], { scale: 1 }), { scale: 0.01 });
  assert.equal(correct(p.data, p.width, p.height), null);
});
