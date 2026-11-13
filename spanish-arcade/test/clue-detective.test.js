// clue-detective rules: rounds, judge, hints and authoring errors. Cases are invented.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/rng.js';
import { resolveParams } from '../core/generate.js';
import { checkParams } from '../core/schema.js';
import arch from '../archetypes/clue-detective/index.js';
import example from '../archetypes/clue-detective/example.json' with { type: 'json' };

const suspects = ['Nico', 'Rita', 'Teo', 'Lola', 'Fran'].map((name) => ({ name, emoji: '🙂' }));
const kase = { suspects, clues: ['Es alto.', 'No lleva gafas.'], answer: 2, rules: [[0, 1], [3]] };
const run = (cases, extra = {}, seed = 1, difficulty = 1) =>
  arch.make(resolveParams(arch, { difficulty, params: { cases, ...extra } }), { targets: [], pool: [] }, createRng(seed)).rounds;

test('example params are valid and make a round', () => {
  assert.deepEqual(checkParams(arch.paramsSchema, resolveParams(arch, { difficulty: 1, params: example })), []);
  assert.equal(run(example.cases).length, 1);
});

test('one round per case, n limits, same seed same rounds, ids keep the author index', () => {
  const rounds = run([kase, kase], { n: 1 });
  assert.equal(rounds.length, 1);
  assert.deepEqual(rounds, run([kase, kase], { n: 1 }));
  assert.equal(rounds[0].suspects.find((s) => s.id === rounds[0].answer).name, 'Teo');
  assert.deepEqual(rounds[0].rules[0], ['0', '1']);
});

test('difficulty sets reveal; explicit param wins', () => {
  assert.equal(run([kase], {}, 1, 1)[0].reveal, 'all');
  assert.equal(run([kase], {}, 1, 2)[0].reveal, 'one');
  assert.equal(run([kase], { reveal: 'one' }, 1, 1)[0].reveal, 'one');
});

test('judge: only the culprit is right', () => {
  const r = run([kase])[0];
  assert.equal(arch.judge(r, r.answer).correct, true);
  assert.ok(r.suspects.filter((s) => s.id !== r.answer).every((s) => !arch.judge(r, s.id).correct));
  assert.equal(arch.judge(r, '___no').correct, false);
});

test('hints: rules name a clue and who it rules out; without rules the wrong pick is crossed out; level 2 gives the answer', () => {
  const r = run([kase])[0];
  assert.deepEqual(arch.hint(r, 1, '0'), { level: 1, clue: 0, out: ['0', '1'] });
  assert.ok(!arch.hint(r, 1, '0').out.includes(r.answer));
  assert.deepEqual(arch.hint(r, 2, '0'), { level: 2, answer: r.answer });
  const plain = run([{ ...kase, rules: undefined }])[0];
  assert.deepEqual(arch.hint(plain, 1, '0'), { level: 1, clue: null, out: ['0'] });
  assert.deepEqual(arch.hint(plain, 1, '___no'), { level: 1, clue: null, out: [] });
});

test('authoring errors are readable', () => {
  const bad = (c, re) => assert.throws(() => run([c]), re);
  bad({ ...kase, suspects: suspects.slice(0, 3), answer: 0, rules: undefined }, /4-6 suspects/);
  bad({ ...kase, answer: 9 }, /answer must be/);
  bad({ ...kase, clues: ['Es alto.', ' '] }, /blank/);
  bad({ ...kase, suspects: [...suspects.slice(0, 4), { name: 'nico' }] }, /same name/);
  bad({ ...kase, rules: [[0]] }, /one list per clue/);
  bad({ ...kase, rules: [[2], []] }, /never the answer/);
  const errs = checkParams(arch.paramsSchema, resolveParams(arch, { difficulty: 1, params: { cases: [{ suspects, clues: ['x'] }], reveal: 'two' } }));
  assert.ok(errs.some((e) => /answer: missing/.test(e)) && errs.some((e) => /reveal/.test(e)), errs.join('|'));
});
