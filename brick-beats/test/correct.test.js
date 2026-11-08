// Straightening step (correct.js), checked on generated mats that are rotated and seen at an angle (scripts/brick-beats-mat.mjs): no photos in the repo.
import test from "node:test";
import assert from "node:assert/strict";
import { correct, findCorners, distortion, warp, turnQuad, plateShare, snapPoint } from "../correct.js";
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

test("a gap in the plate (a thin line across it, a hand) does not throw the corners off", () => {
  const p = photo({ rot: 8 }), ref = findCorners(p.data, p.width, p.height);
  for (let x = 0; x < p.width; x++) for (let y = 0; y < p.height; y++) { // a pale 5 px line across the whole photo, through the mat
    if (Math.abs(y - (0.5 * p.height + 0.1 * x)) < 2.5) { const o = (y * p.width + x) * 4; p.data[o] = p.data[o + 1] = p.data[o + 2] = 235; }
  }
  const f = findCorners(p.data, p.width, p.height);
  assert.ok(f && f.sure);
  f.quad.forEach((q, i) => assert.ok(Math.hypot(q[0] - ref.quad[i][0], q[1] - ref.quad[i][1]) < 8, `corner ${i} moved`));
});

test("old corners are trusted only while they still sit on the plate", () => {
  const p = photo({ rot: 10 }), f = findCorners(p.data, p.width, p.height);
  const ok = plateShare(p.data, p.width, p.height, f.quad);
  assert.ok(ok.inside > 0.5 && ok.ring < 0.3, JSON.stringify(ok));
  const c = f.quad.reduce((a, q) => [a[0] + q[0] / 4, a[1] + q[1] / 4], [0, 0]), small = f.quad.map((q) => [c[0] + (q[0] - c[0]) * 0.5, c[1] + (q[1] - c[1]) * 0.5]);
  assert.ok(plateShare(p.data, p.width, p.height, small).ring > 0.3); // the plate carries on outside a quad that is too small
});

test("a dot let go near a corner lands on it, far from any it stays", () => {
  const t = { corners: [[100, 100], [400, 100]], bits: [{ x: 250, y: 300, s: 1 }] };
  assert.deepEqual(snapPoint(t, 120, 90, 40), [100, 100]);
  assert.deepEqual(snapPoint(t, 255, 310, 100), [250, 300]); // a strong colour corner
  assert.deepEqual(snapPoint(t, 600, 600, 40), [600, 600]);
});

test("tape along the mat's edge counts as mat even when its colour is not recognised (the floor around it is what defines the outline)", async () => {
  const { renderMat } = await import("../../scripts/brick-beats-mat.mjs");
  const L = [[["red", 2, 2]], [["pink", 0, 2]], [["lime", 6, 6]], [["blue", 12, 2]]];
  for (const wood of [false, true]) {
    const p = renderMat(L, { edgeTape: true, wood }), f = findCorners(p.data, p.width, p.height);
    assert.ok(f && f.sure);
    const ys = f.quad.map((q) => q[1]);
    assert.ok(Math.min(...ys) < 26 && Math.max(...ys) > 613, `top ${Math.min(...ys)}, bottom ${Math.max(...ys)}`); // plate edges are at 32 and 608; the tape reaches 20 and 619
  }
});
