// Pure-logic tests. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../core/rng.js';
import { multiplication, addition, subtraction, fractionOf, fractionText } from '../core/problems.js';
import { createSession, starsFor } from '../core/session.js';
import { createProgress } from '../core/progress.js';

const many = (n, fn) => Array.from({ length: n }, (_, i) => fn(i));

test('rng is reproducible from a seed', () => {
  const a = createRng(42), b = createRng(42);
  assert.deepEqual(many(20, () => a.int(1, 100)), many(20, () => b.int(1, 100)));
});

test('multiplication stays within tables and factors', () => {
  const rng = createRng(1);
  for (const p of many(500, () => multiplication(rng, { tables: [3, 7], minFactor: 2, maxFactor: 12 }))) {
    assert.ok([3, 7].includes(p.a));
    assert.ok(p.b >= 2 && p.b <= 12);
    assert.equal(p.answer, p.a * p.b);
  }
});

test('addition and subtraction respect their limits', () => {
  const rng = createRng(2);
  for (const p of many(500, () => addition(rng, { max: 50, minA: 10, minB: 2, maxB: 12 }))) {
    assert.ok(p.a >= 10 && p.b >= 2 && p.b <= 12 && p.answer <= 50);
    assert.equal(p.answer, p.a + p.b);
  }
  for (const p of many(500, () => subtraction(rng, { max: 100, minB: 10, minGap: 8 }))) {
    assert.ok(p.a <= 100 && p.b >= 10 && p.answer >= 8);
    assert.equal(p.answer, p.a - p.b);
  }
});

test('fractionOf gives whole-number answers', () => {
  const rng = createRng(3);
  for (const p of many(500, () => fractionOf(rng, { denominators: [2, 3, 4, 5], minWhole: 6, maxWhole: 20 }))) {
    assert.equal(p.whole % p.denominator, 0);
    assert.ok(p.numerator >= 1 && p.numerator < p.denominator);
    assert.ok(Number.isInteger(p.answer));
  }
  assert.throws(() => fractionOf(rng, { denominators: [7], maxWhole: 6 }));
  assert.equal(fractionText(3, 4), '¾');
  assert.equal(fractionText(2, 7), '2/7');
});

test('session: retries, hint, reveal and stars', () => {
  let made = 0;
  const s = createSession({ rounds: 3, makeRound: () => ++made });
  assert.equal(s.round, 1);
  assert.deepEqual(s.submit(false), { advanced: false, done: false });
  assert.ok(s.showHint && !s.revealAnswer);
  s.submit(false);
  assert.ok(s.revealAnswer);
  s.submit(true); // round 1 hit after misses: not first try
  assert.equal(s.round, 2);
  assert.equal(s.misses, 0);
  s.submit(true);
  assert.deepEqual(s.submit(true), { advanced: true, done: true });
  assert.equal(s.firstTryHits, 2);
  assert.equal(s.stars, 2);
  assert.throws(() => s.submit(true));
});

test('starsFor thresholds', () => {
  assert.equal(starsFor(5, 5), 3);
  assert.equal(starsFor(3, 5), 2);
  assert.equal(starsFor(2, 5), 1);
  assert.equal(starsFor(0, 5), 1);
});

test('progress keeps the best stars and survives bad storage', () => {
  const mem = new Map();
  const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  const p = createProgress(storage);
  assert.equal(p.record('g', 'l1', 2), true);
  assert.equal(p.record('g', 'l1', 1), false);
  p.record('g', 'l2', 3);
  assert.equal(createProgress(storage).stars('g', 'l1'), 2);
  assert.equal(p.total('g'), 5);

  const broken = createProgress({ getItem: () => '{bad json', setItem: () => { throw new Error('full'); } });
  assert.equal(broken.stars('g', 'l1'), 0);
  assert.equal(broken.record('g', 'l1', 3), true);
  assert.equal(createProgress(null).stars('g', 'x'), 0);
});
