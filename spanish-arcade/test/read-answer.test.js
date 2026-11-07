// read-answer rules: rounds from questions, judge, hints, and schema errors in params. Texts are invented.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/rng.js';
import { resolveParams } from '../core/generate.js';
import { checkParams } from '../core/schema.js';
import arch from '../archetypes/read-answer/index.js';

const text = ['Mira tiene un loro.', 'El loro es verde.', 'Come fruta por la mañana.'];
const abc = [
  { q: '¿Qué tiene Mira?', options: ['un loro', 'un gato', 'un pez'], answer: 0, evidence: 0 },
  { q: '¿De qué color es?', options: ['rojo', 'verde'], answer: 1, evidence: 1 },
  { q: '¿Cuándo come?', options: ['de noche', 'por la mañana', 'nunca'], answer: 1 },
];
const tf = [{ q: 'Mira tiene un gato.', ok: false, evidence: 0 }, { q: 'El loro es verde.', ok: true, evidence: 1 }];
const run = (params, seed = 1, difficulty = 1) =>
  arch.make(resolveParams(arch, { difficulty, params: { text, ...params } }), { targets: [], pool: [] }, createRng(seed)).rounds;

test('one round per question; same seed gives the same rounds; each round carries the text', () => {
  const rounds = run({ questions: abc });
  assert.equal(rounds.length, 3);
  assert.deepEqual(rounds, run({ questions: abc }));
  assert.deepEqual(rounds[0].text, text);
  assert.deepEqual(rounds[0].options.map((o) => o.text), ['un loro', 'un gato', 'un pez']);
});

test('judge: the right option is correct, any other is not (abc and tf)', () => {
  for (const r of run({ questions: abc })) {
    assert.equal(arch.judge(r, r.answer).correct, true);
    assert.ok(r.options.filter((o) => o.id !== r.answer).every((o) => !arch.judge(r, o.id).correct));
  }
  const [no, yes] = run({ kind: 'tf', questions: tf });
  assert.deepEqual(no.options.map((o) => o.id), ['true', 'false']);
  assert.equal(arch.judge(no, 'false').correct, true);
  assert.equal(arch.judge(no, 'true').correct, false);
  assert.equal(arch.judge(yes, 'true').correct, true);
});

test('options never duplicate each other, so no distractor equals the answer', () => {
  assert.throws(() => run({ questions: [{ q: '¿Qué?', options: ['loro', 'Loro '], answer: 0 }] }), /same/);
});

test('level-1 hint is a nudge: points at the evidence sentence, never names the answer or removes an option', () => {
  const [r, , noEv] = run({ questions: abc });
  assert.deepEqual(arch.hint(r, 1, '1'), { level: 1, evidence: 0 });
  assert.deepEqual(arch.hint(noEv, 1, '0'), { level: 1, evidence: null }); // inference-style: re-read the whole text
  const [t] = run({ kind: 'tf', questions: tf });
  assert.deepEqual(arch.hint(t, 1, 'true'), { level: 1, evidence: 0 });
});

test('level-2 hint reveals the answer and keeps the evidence', () => {
  const [r] = run({ questions: abc });
  assert.deepEqual(arch.hint(r, 2, '1'), { level: 2, answer: r.answer, evidence: 0 });
});

test('showTextWhileAnswering defaults on, is off at difficulty 3, and the exercise wins', () => {
  assert.equal(run({ questions: abc })[0].showText, true);
  assert.equal(run({ questions: abc }, 1, 3)[0].showText, false);
  assert.equal(run({ questions: abc, showTextWhileAnswering: false })[0].showText, false);
});

test('schema errors in params are reported', () => {
  const ok = { text, questions: abc };
  const errs = (p) => checkParams(arch.paramsSchema, resolveParams(arch, { difficulty: 1, params: p }));
  assert.deepEqual(errs(ok), []);
  assert.ok(errs({ questions: abc }).some((e) => e.includes('text: missing')));
  assert.ok(errs({ text }).some((e) => e.includes('questions: missing')));
  assert.ok(errs({ ...ok, kind: 'fill' }).some((e) => e.includes('kind')));
  assert.ok(errs({ ...ok, extra: 1 }).some((e) => e.includes('unknown param')));
  assert.ok(errs({ text, questions: [{ options: ['a', 'b'], answer: 0 }] }).some((e) => e.includes('q: missing')));
  assert.ok(errs({ text, questions: [{ q: 'x', options: ['a', 'b'], answer: 'a' }] }).some((e) => e.includes('answer')));
  assert.ok(errs({ text: [], questions: abc }).some((e) => e.includes('text')));
});

test('make rejects content the schema cannot check', () => {
  const bad = (p, re) => assert.throws(() => run(p), re);
  bad({ questions: [] }, /1-3 questions/);
  bad({ questions: [...abc, ...abc] }, /1-3 questions/);
  bad({ text: ['a', 'b', 'c', 'd', 'e', 'f'], questions: abc }, /2-5 sentences/);
  bad({ text: ['solo una'], questions: abc }, /2-5 sentences/);
  bad({ questions: [{ q: 'x', options: ['a'], answer: 0 }] }, /2-4 options/);
  bad({ questions: [{ q: 'x', options: ['a', 'b'], answer: 2 }] }, /answer/);
  bad({ questions: [{ q: 'x', options: ['a', 'b'] }] }, /answer/);
  bad({ questions: [{ q: 'x', options: ['a', 'b'], answer: 0, evidence: 3 }] }, /evidence/);
  bad({ kind: 'tf', questions: [{ q: 'x' }] }, /ok/);
  bad({ kind: 'tf', questions: [{ q: 'x', ok: true, options: ['a', 'b'] }] }, /options/);
});
