// Match: result balls always come from pairs that touch right now. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/rng.js';
import { pairFor, refillTargets } from '../games/match/logic.js';
import { makeNumbers, radiusFor } from '../games/pop/logic.js';
import { createWorld, pour, step, settled, touchingPairs } from '../games/pop/world.js';
import levels from '../games/match/levels.json' with { type: 'json' };

const pair = (x, y) => ({ a: { n: x }, b: { n: y } });

test('refillTargets keeps valid results, drops dead ones and tops up with distinct values', () => {
  const pairs = [pair(2, 3), pair(4, 5), pair(6, 7), pair(3, 2)]; // 6, 20, 42, 6
  const out = refillTargets([20, 99], pairs, 3, createRng(1));
  assert.ok(out.includes(20) && !out.includes(99), 'keeps 20, drops 99');
  assert.equal(out.length, 3);
  assert.equal(new Set(out).size, 3, 'no duplicates');
  assert.ok(out.every((v) => pairFor(pairs, v)), 'every result has a pair');
});

test('refillTargets never invents a result when few pairs touch', () => {
  assert.deepEqual(refillTargets([], [pair(2, 3)], 3, createRng(1)), [6]);
  assert.deepEqual(refillTargets([5], [], 3, createRng(1)), []);
});

test('a result can be held on to for a while with keep()', () => {
  assert.deepEqual(refillTargets([99], [pair(2, 3)], 1, createRng(1), (v) => v === 99), [99]);
});

test('in a real funnel every result has a touching pair that makes it', () => {
  for (const l of levels) {
    const rng = createRng(21), w = createWorld();
    pour(w, makeNumbers(l, rng).map((n) => ({ n, r: radiusFor(n, l.max) })), rng);
    for (let i = 0; i < 900 && !(i > 60 && settled(w)); i += 10) step(w, 10);
    const pairs = touchingPairs(w);
    const targets = refillTargets([], pairs, l.targets, rng);
    assert.equal(targets.length, l.targets, `${l.id}: enough results`);
    for (const v of targets) {
      const { a, b } = pairFor(pairs, v);
      assert.equal(a.n * b.n, v);
    }
  }
});
