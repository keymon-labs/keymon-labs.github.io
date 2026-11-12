// Tests for letter-lock's pure logic: score() marking, clue ladder, make, judge, hint, and the riddles in the real vocab.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/rng.js';
import { resolveParams } from '../core/generate.js';
import { checkParams } from '../core/schema.js';
import ll from '../archetypes/letter-lock/index.js';
import { score, autoHints, clueLadder, cluesShown } from '../archetypes/letter-lock/logic.js';
import { word, loadRealContent } from './helpers.js';
import { validateVocab } from '../core/schema.js';

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

test('autoHints: first letter, length, ñ / tilde / ü', () => {
  assert.deepEqual(autoHints('gato'), ['Empieza por G', 'Tiene 4 letras']);
  assert.deepEqual(autoHints('piña'), ['Empieza por P', 'Tiene 4 letras', 'Lleva ñ']);
  assert.deepEqual(autoHints('médico'), ['Empieza por M', 'Tiene 6 letras', 'Lleva tilde']);
  assert.equal(autoHints('pingüino')[2], 'Lleva ü');
});

test('clue ladder: authored lines first, then auto hints; one more line per wrong try; never past the end', () => {
  const [r] = run([word('piña', { clues: ['uno', 'dos'] })], { clue: 'riddle' }, 1, 2);
  assert.deepEqual(cluesShown(r, 0), ['uno']);
  assert.deepEqual(cluesShown(r, 2), ['uno', 'dos', 'Empieza por P']);
  assert.deepEqual(cluesShown(r, 99), ['uno', 'dos', 'Empieza por P', 'Tiene 4 letras', 'Lleva ñ']);
});

test('clue ladder: firstLetter shows "Empieza por" from the start; no authored clues starts with the length; audio-only has no riddle', () => {
  const [d1] = run([word('gato', { clues: ['uno', 'dos'] })], {}, 1, 1);
  assert.deepEqual(cluesShown(d1, 0), ['uno', 'Empieza por G']);
  assert.deepEqual(clueLadder(d1).lines, ['uno', 'Empieza por G', 'dos', 'Tiene 4 letras']);
  const [bare] = run([word('gato')], {}, 1, 2);
  assert.deepEqual(cluesShown(bare, 0), ['Tiene 4 letras']);
  assert.deepEqual(cluesShown(d1, 0, false), ['Empieza por G']);
  const [d2] = run([word('gato', { clues: ['uno'] })], {}, 1, 2);
  assert.deepEqual(cluesShown(d2, 0, false), []);
});

test('make: clues and emoji travel with the round (the emoji is a reward, not a clue)', () => {
  const [r] = run([word('gato', { clues: ['uno', 'dos'] })]);
  assert.deepEqual(r.clues, ['uno', 'dos']);
  assert.equal(r.emoji, '⭐');
  assert.deepEqual(run([word('gato')])[0].clues, []);
  assert.deepEqual(checkParams(ll.paramsSchema, { from: { n: 2 }, clue: 'riddle' }), []);
  assert.ok(checkParams(ll.paramsSchema, { from: { n: 2 }, clue: 'picture' }).length > 0);
});

test('vocab clues: 2-4 lines, never the word itself', () => {
  const ok = word('gato', { clues: ['Dice miau.', 'Tiene bigotes.'] });
  assert.deepEqual(validateVocab({ schema: 1, words: [{ ...ok, unit: 'u1' }] }, 'u1'), []);
  const bad = (clues) => validateVocab({ schema: 1, words: [{ ...ok, clues }] }, 'u1').length;
  assert.ok(bad(['Dice miau.']) > 0);
  assert.ok(bad(['El gato dice miau.', 'Tiene bigotes.']) > 0);
});

test('real units: every word a letter-lock can draw has riddle clues', async () => {
  const content = await loadRealContent();
  const tags = new Set();
  for (const u of Object.values(content.units ?? {})) for (const ex of u.exercises ?? []) if (ex.archetype === 'letter-lock') tags.add(ex.params.from.tag);
  assert.ok(tags.size >= 3);
  for (const w of content.words.filter((x) => x.tags.some((t) => tags.has(t)))) assert.ok(w.clues?.length >= 2, w.id);
});
