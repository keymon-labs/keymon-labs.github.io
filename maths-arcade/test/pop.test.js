// Pop and Match: ball sizes, numbers, scoring, levels, and the funnel physics run headless. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/rng.js';
import { makeNumbers, radiusFor, isCorrect, points, hint, R_MIN, R_MAX } from '../games/pop/logic.js';
import { createWorld, pour, removeBall, step, settled, allInside, touchingPairs, ballAt, pos, W } from '../games/pop/world.js';
import popLevels from '../games/pop/levels.json' with { type: 'json' };
import matchLevels from '../games/match/levels.json' with { type: 'json' };

const all = [...popLevels, ...matchLevels];

function startWorld(level, seed) {
  const rng = createRng(seed), w = createWorld();
  pour(w, makeNumbers(level, rng).map((n) => ({ n, r: radiusFor(n, level.max) })), rng);
  return w;
}
function settle(w, limit = 900, speed = 0.6) {
  let i = 0;
  do { step(w, 10); i += 10; } while (!(settled(w, speed) && i >= 60) && i < limit);
  return i;
}

test('every level is well formed', () => {
  for (const levels of [popLevels, matchLevels]) {
    const ids = new Set();
    for (const l of levels) {
      assert.ok(l.id && l.title, 'id and title');
      assert.ok(!ids.has(l.id), `duplicate id ${l.id}`);
      ids.add(l.id);
      assert.ok(l.balls % 2 === 0 && l.balls >= 8 && l.balls <= 36, `${l.id}: even ball count that fits the funnel`);
      assert.ok(l.max >= 2 && l.max <= 12, `${l.id}: max`);
      assert.ok(l.tables.every((t) => t >= 1 && t <= l.max), `${l.id}: tables within 1..max`);
    }
  }
  assert.ok(matchLevels.every((l) => l.targets >= 2 && l.targets <= 3), 'match shows 2 or 3 results');
});

test('ball size grows with the number, softly', () => {
  assert.equal(radiusFor(1, 12), R_MIN);
  assert.equal(radiusFor(12, 12), R_MAX);
  assert.equal(radiusFor(10, 10), R_MAX);
  for (let n = 2; n <= 12; n++) assert.ok(radiusFor(n, 12) > radiusFor(n - 1, 12));
  assert.ok(radiusFor(12, 12) / radiusFor(1, 12) < 3, 'not proportional: 12 is far less than 12 times bigger');
});

test('numbers: range, count, focus tables', () => {
  const nums = makeNumbers({ balls: 200, tables: [7], max: 12 }, createRng(1));
  assert.equal(nums.length, 200);
  assert.ok(nums.every((n) => n >= 1 && n <= 12));
  assert.ok(nums.filter((n) => n === 7).length >= 100, 'sevens are common');
  assert.throws(() => makeNumbers({ balls: 5, max: 12 }, createRng(1)), /even/);
});

test('answers, points and hints', () => {
  const a = { n: 7 }, b = { n: 8 };
  assert.ok(isCorrect(a, b, 56) && !isCorrect(a, b, 54));
  assert.equal(points(a, b, 0), 66);
  assert.equal(points(a, b, 5), 132);
  assert.equal(points(a, b, 50), 132, 'streak bonus is capped at +100%');
  assert.equal(hint(a, b), 'Count in 7s: 7, 14, 21, 28…');
});

test('every level: balls pour in, settle inside the funnel and touch', () => {
  for (const l of all) {
    for (const seed of [1, 2, 3]) {
      const w = startWorld(l, seed);
      const steps = settle(w);
      assert.ok(steps < 900, `${l.id}/${seed}: never settled`);
      assert.equal(w.balls.length, l.balls);
      assert.ok(allInside(w), `${l.id}/${seed}: a ball left the funnel`);
      assert.ok(Math.min(...w.balls.map((b) => pos(b).y - b.r)) > 20, `${l.id}/${seed}: funnel overflows`);
      assert.ok(touchingPairs(w).length > 0, `${l.id}/${seed}: no touching pair`);
    }
  }
});

test('picking: the nearest ball under a point, with slack for fingers', () => {
  const w = startWorld(popLevels[0], 4);
  settle(w);
  const b = w.balls[0], p = pos(b);
  assert.equal(ballAt(w, p.x, p.y), b);
  assert.equal(ballAt(w, W / 2, -500), null);
  assert.ok(ballAt(w, p.x, p.y - b.r - 5, 10), 'a tap just outside the edge still counts');
});

test('a funnel can never get stuck: popping touching pairs at random always clears it', () => {
  for (const l of all) {
    for (const seed of [11, 12, 13]) {
      const rng = createRng(seed), w = startWorld(l, seed);
      settle(w, 900, 0.05);
      while (w.balls.length) {
        const pairs = touchingPairs(w);
        assert.ok(pairs.length > 0, `${l.id}/${seed}: ${w.balls.length} balls left and none touch`);
        const { a, b } = rng.pick(pairs);
        removeBall(w, a); removeBall(w, b);
        settle(w, 600, 0.05); // really at rest: the watchdog in play.js only steps in at this speed
        assert.ok(allInside(w), `${l.id}/${seed}: a ball left the funnel`);
      }
    }
  }
});
