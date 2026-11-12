// Tests for letter-lock's pure logic: score() marking, make, judge, hint.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/rng.js';
import { resolveParams } from '../core/generate.js';
import { checkParams } from '../core/schema.js';
import ll from '../archetypes/letter-lock/index.js';
import { score, keyStates } from '../archetypes/letter-lock/logic.js';
import { word } from './helpers.js';

const run = (targets, params = {}, seed = 1, diff = 1) =>
  ll.make(resolveParams(ll, { difficulty: diff, params }), { targets, pool: targets }, createRng(seed)).rounds;

test('score: all correct, none correct', () => {
  assert.deepEqual(score('gato', 'gato'), ['ok', 'ok', 'ok', 'ok']);
  assert.deepEqual(score('xyzw', 'gato'), ['no', 'no', 'no', 'no']);
});

test('score: near is placed elsewhere', () => {
  assert.deepEqual(score('toga', 'gato'), ['near', 'near', 'near', 'near']);
});

test('score: repeated letters follow Wordle counting', () => {
  assert.deepEqual(score('rrrrr', 'perro'), ['no', 'no', 'ok', 'ok', 'no']);
  assert.deepEqual(score('orrxx', 'perro'), ['near', 'near', 'ok', 'no', 'no']);
  assert.deepEqual(score('aabb', 'baca'), ['near', 'ok', 'near', 'no']);
  assert.deepEqual(score('abab', 'caab'), ['near', 'no', 'ok', 'ok']);
  assert.deepEqual(score('eeeee', 'perro'), ['no', 'ok', 'no', 'no', 'no']);
});

test('score: tilde for wrong accent, ñ never n', () => {
  assert.deepEqual(score('papa', 'papá'), ['ok', 'ok', 'ok', 'tilde']);
  assert.deepEqual(score('pinguino', 'pingüino'), ['ok', 'ok', 'ok', 'ok', 'tilde', 'ok', 'ok', 'ok']);
  assert.deepEqual(score('anos', 'años'), ['ok', 'no', 'ok', 'ok']);
  assert.deepEqual(score('año', 'ano'), ['ok', 'no', 'ok']);
  assert.equal(score('ávion', 'avión')[0], 'tilde');
  assert.equal(score('ávion', 'avión')[3], 'tilde');
});

test('score: decomposed input equals composed', () => {
  assert.deepEqual(score('año', 'año'), ['ok', 'ok', 'ok']);
});

test('keyStates: best state per letter', () => {
  const k = keyStates(['toga', 'gato'], 'gato');
  assert.equal(k.g, 'ok');
  assert.equal(keyStates(['xyz'], 'gato').x, 'no');
});

test('make: skips spaces and lengths outside 3-8, lowercases, deterministic', () => {
  const ws = [word('Gato'), word('ab'), word('mesa redonda'), word('hipopótamos'), word('luz')];
  const rounds = run(ws);
  assert.deepEqual(rounds.map((r) => r.answer), ['gato', 'luz']);
  assert.deepEqual(rounds[0].wordIds, ['Gato']);
  assert.deepEqual(run(ws, {}, 5), run(ws, {}, 5));
});

test('params: schema, defaults by difficulty', () => {
  assert.deepEqual(checkParams(ll.paramsSchema, { from: { n: 2 }, tries: 6, clue: 'audio' }), []);
  assert.ok(checkParams(ll.paramsSchema, { from: { n: 2 }, tries: 9 }).length > 0);
  const [a] = run([word('gato')], {}, 1, 1);
  const [c] = run([word('gato')], {}, 1, 3);
  assert.equal(a.firstLetter, true);
  assert.equal(c.firstLetter, false);
  assert.equal(c.tries, 5);
  assert.equal(ll.skill, 'spelling');
  assert.equal(ll.pictures, true);
});

test('judge: strict accents and ñ', () => {
  const [r] = run([word('avión')]);
  assert.ok(ll.judge(r, 'avión').correct);
  assert.ok(ll.judge(r, 'AVIÓN').correct);
  assert.ok(!ll.judge(r, 'avion').correct);
  const [n] = run([word('año')]);
  assert.ok(!ll.judge(n, 'ano').correct);
});

test('hint: level 1 pre-fills first letter and tilde letters, level 2 the word', () => {
  const [r] = run([word('pingüino')]);
  assert.deepEqual(ll.hint(r, 1, 'pinguino').fixed, [{ index: 0, ch: 'p' }, { index: 4, ch: 'ü' }]);
  assert.deepEqual(ll.hint(r, 1, 'xxxxxxxx').fixed, [{ index: 0, ch: 'p' }]);
  assert.deepEqual(ll.hint(r, 2, 'x'), { level: 2, answer: 'pingüino' });
});
