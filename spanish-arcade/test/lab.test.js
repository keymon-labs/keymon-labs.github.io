// Lab logic: deep links, params validation, sample vocab, and that the real session rules apply to every archetype.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateVocab } from '../core/schema.js';
import { SAMPLE_WORDS } from '../lab/sample.js';
import { parseQuery, parseParams, starterParams, makeNote, buildLabUnit, createLabSession, skipRound, createLog } from '../lab/logic.js';
import { loadRealContent } from './helpers.js';

const real = await loadRealContent({ includeDev: true });
const content = { ...real, words: SAMPLE_WORDS };

test('sample vocab is valid', () => {
  assert.deepEqual(validateVocab({ schema: 1, words: SAMPLE_WORDS }, 'lab-ejemplo'), []);
  assert.equal(SAMPLE_WORDS.length, 15);
});

test('parseQuery keeps only valid values', () => {
  assert.deepEqual(parseQuery('?unit=a1-u1-s1&exercise=traps-type&seed=7&difficulty=2'),
    { unit: 'a1-u1-s1', exercise: 'traps-type', archetype: null, seed: 7, difficulty: 2 });
  const bad = parseQuery('?unit=<x>&seed=-1&difficulty=9');
  assert.equal(bad.unit, null); assert.equal(bad.seed, null); assert.equal(bad.difficulty, null);
});

test('parseParams: JSON errors, schema errors in Spanish, valid params', () => {
  const a = real.archetypeById['listen-pick-word'];
  assert.match(parseParams('{ nope', a).errors[0], /JSON no válido/);
  assert.match(parseParams('[]', a).errors[0], /objeto/);
  const r = parseParams('{"from":{"n":0},"options":9,"x":1}', a);
  assert.ok(r.params === null && r.errors.length === 3, r.errors.join('|'));
  assert.ok(r.errors.some((e) => e.startsWith('options: debe ser como máximo 6')));
  assert.ok(r.errors.some((e) => e.startsWith('x: no existe')));
  assert.match(parseParams('{}', a).errors[0], /^from: falta/);
  assert.deepEqual(parseParams('{"from":{"n":2}}', a), { params: { from: { n: 2 } }, errors: [] });
});

test('note format', () => {
  assert.equal(makeNote({ archetype: 'a', exercise: 'e1', seed: 5, text: ' roto ' }), 'laboratorio: a e1 seed 5 — roto');
  assert.match(makeNote({ archetype: 'a', exercise: null, params: { x: 1 }, seed: 5 }), /^laboratorio: a params [0-9a-f]{6} seed 5$/);
});

test('every archetype plays with its starter params and sample vocab; session rules hold', () => {
  for (const a of Object.values(real.archetypeById)) {
    const own = starterParams(a);
    const { params, errors } = parseParams(JSON.stringify(own), a, 2);
    assert.deepEqual(errors, [], a.id);
    const unit = buildLabUnit({ archetype: a.id, difficulty: 2, params });
    const s = createLabSession({ unit, content, seed: 3 });
    assert.ok(!s.done, `${a.id} makes no rounds`);
    const round = s.current.round;
    const wrong = a.id === 'read-answer' ? [99] : '___no';
    const r1 = s.submit(wrong); // a deliberately wrong answer (shape may differ per archetype; judge must not throw)
    assert.equal(r1.correct, false, a.id);
    assert.equal(r1.action, 'hint'); assert.equal(r1.hint.level, 1);
    const r2 = s.submit(wrong);
    assert.equal(r2.action, 'reveal'); assert.equal(r2.hint.level, 2);
    assert.equal(s.submit(wrong).action, 'retry');
    assert.equal(s.current.misses, 3); assert.equal(s.current.round, round);
    const same = createLabSession({ unit, content, seed: 3 }).current.round;
    assert.deepEqual(same, round, `${a.id}: same seed, same rounds`);
  }
});

test('skipRound moves on without counting; log rows', () => {
  const a = real.archetypeById['placeholder'];
  const unit = buildLabUnit({ archetype: a.id, params: { from: { n: 3 } } });
  let s = createLabSession({ unit, content, seed: 1 });
  const first = s.current.round;
  const log = createLog();
  log.add({ misses: 0, skipped: true });
  s = skipRound(unit, content, s);
  assert.equal(s.current.roundIndex, 1); assert.notDeepEqual(s.current.round, first);
  s = skipRound(unit, content, s); s = skipRound(unit, content, s);
  assert.ok(s.done);
  log.add({ misses: 2 });
  assert.deepEqual(log.summary(), { rondas: 2, correctas: 1, saltadas: 1, fallos: 2 });
});

test('real exercise from a real unit loads with its own params', () => {
  const u = real.unitById['a1-u1-s1'];
  const e = u.exercises.find((x) => x.id === 'traps-type');
  assert.ok(e);
  const a = real.archetypeById[e.archetype];
  assert.deepEqual(parseParams(JSON.stringify(e.params), a, e.difficulty).errors, []);
  const s = createLabSession({ unit: buildLabUnit({ archetype: a.id, exerciseId: e.id, difficulty: e.difficulty, params: e.params, base: u }), content: real, seed: 1 });
  assert.ok(!s.done);
});
