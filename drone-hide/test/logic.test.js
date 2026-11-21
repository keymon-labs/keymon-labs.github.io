// Checks the Drone Hide rules: foreground mask, hiding behind rocks, beam sight, gem touch, rock layout.
import { test } from "node:test";
import assert from "node:assert/strict";
import { foreground, countIn, hiddenShare, seen, touches, rockMask, makeRocks, adapt } from "../logic.js";
import { createRng } from "../../shared/rng.js";

const W = 40, H = 30;
const frame = (fn) => { const a = new Uint8ClampedArray(W * H * 4); for (let i = 0; i < W * H; i++) { const v = fn(i % W, (i / W) | 0); a.set([v, v, v, 255], i * 4); } return a; };
const bg = frame(() => 100);
const person = (x0, x1) => foreground(frame((x, y) => x >= x0 && x < x1 && y > 5 ? 220 : 100), bg, W, H);

test("foreground finds a person, ignores a lone speck", () => {
  const m = person(5, 12);
  assert.ok(countIn(m, W, H, { x0: 0, x1: 20 }) > 100);
  assert.equal(countIn(m, W, H, { x0: 20, x1: 40 }), 0);
  const speck = foreground(frame((x, y) => x === 10 && y === 10 ? 255 : 100), bg, W, H);
  assert.equal(countIn(speck, W, H, { x0: 0, x1: W }), 0);
});

test("hiding behind a rock: hidden share, and the drone cannot see", () => {
  const m = person(5, 12), half = { x0: 0, x1: 20 };
  const rock = rockMask([{ x: 8, y: 18, rx: 12, ry: 14 }], W, H);
  assert.ok(hiddenShare(m, rock, W, H, half) > .9);
  assert.equal(seen(m, rock, W, H, { cx: 8, cy: 18, r: 10 }), false);
  assert.equal(seen(m, rockMask([], W, H), W, H, { cx: 8, cy: 18, r: 10 }), true);
  assert.equal(hiddenShare(person(30, 31), rock, W, H, half), 1);   // nobody in that half
});

test("beam far from the player sees nothing; gem touch needs enough body", () => {
  const m = person(5, 12), none = new Uint8Array(W * H);
  assert.equal(seen(m, none, W, H, { cx: 32, cy: 20, r: 6 }), false);
  assert.equal(touches(m, W, H, { cx: 8, cy: 15, r: 3 }), true);
  assert.equal(touches(m, W, H, { cx: 30, cy: 15, r: 3 }), false);
});

test("rocks: 2 per half, inside their half, spread apart", () => {
  const rocks = makeRocks(createRng(7), 160, 120);
  assert.equal(rocks.length, 4);
  assert.equal(rocks.filter(r => r.x < 80).length, 2);
  for (const r of rocks) assert.ok(r.x - r.rx >= 0 && r.x + r.rx <= 160 && r.y + r.ry <= 120);
});

test("background follows light only where nobody stands", () => {
  const b = new Float32Array(frame(() => 100)), cur = frame(() => 140), mask = new Uint8Array(W * H); mask[0] = 1;
  adapt(b, cur, mask, W, H, .5);
  assert.equal(b[0], 100);
  assert.equal(b[4], 120);
});
