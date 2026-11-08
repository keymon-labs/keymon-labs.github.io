// Straightening step (correct.js), checked on generated mats that are rotated and seen at an angle (scripts/brick-beats-mat.mjs): no photos in the repo.
import test from "node:test";
import assert from "node:assert/strict";
import { correct, findCorners, distortion, warp, turnQuad } from "../correct.js";
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

test("distortion is scored from the corners: straight on is good, a steep angle is high", () => {
  assert.equal(distortion([[0, 0], [100, 0], [100, 100], [0, 100]]).level, "good");
  assert.equal(distortion([[20, 0], [80, 0], [100, 100], [0, 100]]).level, "high"); // far side much shorter
  const flat = photo({ rot: 10 }), steep = photo({ tilt: 0.0007 });
  assert.equal(findCorners(flat.data, flat.width, flat.height).level, "good");
  assert.equal(findCorners(steep.data, steep.width, steep.height).level, "high");
});

test("corners placed by hand (even in another turn) straighten the mat so the bricks read exactly", () => {
  const p = photo({ rot: -15, tilt: 0.0003 }), f = findCorners(p.data, p.width, p.height);
  const mine = [f.quad[2], f.quad[3], f.quad[0], f.quad[1]]; // the player started from another corner
  const q = turnQuad(p.data, p.width, p.height, mine), res = detect(...(({ data, W, H }) => [data, W, H])(warp(p.data, p.width, p.height, q)));
  assert.deepEqual(lanesOf(res), EXAMPLE);
});
