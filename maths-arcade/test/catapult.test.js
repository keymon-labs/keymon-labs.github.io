// Catapult rules and level data. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/rng.js';
import { KINDS, makeRound, judge } from '../games/catapult/logic.js';
import levels from '../games/catapult/levels.json' with { type: 'json' };

test('every level is well formed and playable', () => {
  const ids = new Set();
  for (const level of levels) {
    assert.ok(level.id && level.title, `level needs id and title: ${JSON.stringify(level)}`);
    assert.ok(!ids.has(level.id), `duplicate level id ${level.id}`);
    ids.add(level.id);
    assert.ok(KINDS[level.kind], `${level.id}: unknown kind ${level.kind}`);
    assert.ok(level.rounds >= 1 && level.rounds <= 10, `${level.id}: rounds`);

    const rng = createRng(7);
    for (let i = 0; i < 200; i++) {
      const r = makeRound(level, rng);
      assert.ok(Number.isInteger(r.answer) && r.answer > 0 && r.answer < 1000, `${level.id}: answer fits the keypad`);
      assert.ok(r.castleX > r.catapultX && r.castleX < r.axisMax, `${level.id}: castle on screen`);
      assert.ok(r.prompt.title && r.prompt.text && r.hint, `${level.id}: texts`);
      assert.equal(judge(r, r.answer).hit, true, `${level.id}: correct answer hits`);
      assert.equal(judge(r, r.answer + 1).hit, false, `${level.id}: wrong answer misses`);
    }
  }
});

test('power: the typed number is the distance', () => {
  const r = makeRound({ kind: 'power', skill: { tables: [4], minFactor: 6, maxFactor: 6 } }, createRng(1));
  assert.equal(r.answer, 24);
  assert.equal(r.prompt.text, '4 bands × 6 pulls');
  assert.deepEqual(judge(r, 20), { landing: { x: 20 }, hit: false, diff: -4, message: 'Too short!' });
  assert.equal(judge(r, 30).message, 'Too far!');
});

test('pulls: distance is bands × typed pulls', () => {
  const r = makeRound({ kind: 'pulls', skill: { tables: [3], minFactor: 5, maxFactor: 5 } }, createRng(1));
  assert.equal(r.castleX, 15);
  assert.equal(judge(r, 4).landing.x, 12);
  assert.equal(judge(r, 5).hit, true);
});

test('distance and wind shift the landing', () => {
  const d = makeRound({ kind: 'distance', skill: { max: 50 } }, createRng(5));
  assert.equal(judge(d, d.answer).landing.x, d.castleX);
  const w = makeRound({ kind: 'wind', skill: { max: 50, minA: 20, minB: 3, maxB: 10 } }, createRng(5));
  assert.equal(judge(w, w.castleX).landing.x, w.castleX - w.wind, 'aiming at the castle falls short by the wind');
});

test('tower: the typed number is the block height', () => {
  const r = makeRound({ kind: 'tower', skill: { denominators: [4], minWhole: 12, maxWhole: 12 } }, createRng(2));
  assert.equal(r.tower.blocks, 12);
  assert.equal(r.answer % 3, 0);
  assert.equal(judge(r, r.answer - 1).message, 'Too low!');
  assert.equal(judge(r, r.answer + 1).message, 'Too high!');
});

test('unknown kind fails loudly', () => {
  assert.throws(() => makeRound({ kind: 'nope' }, createRng(1)), /Unknown catapult kind/);
});
