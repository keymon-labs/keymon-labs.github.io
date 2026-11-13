// __ID__: rounds, judge, hints and authoring errors. Items are invented.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/rng.js';
import { resolveParams } from '../core/generate.js';
import { checkParams, validateArchetype } from '../core/schema.js';
import arch from '../archetypes/__ID__/index.js';
import example from '../archetypes/__ID__/example.json' with { type: 'json' };

const item = { prompt: 'Yo ___ una pelota.', answer: 'tengo', wrong: ['tienes', 'tiene'] };
const run = (items, extra = {}, seed = 1, difficulty = 1) =>
  arch.make(resolveParams(arch, { difficulty, params: { items, ...extra } }), { targets: [], pool: [] }, createRng(seed)).rounds;

test('the module has the right shape and example.json is valid', () => {
  assert.deepEqual(validateArchetype(arch), []);
  assert.deepEqual(checkParams(arch.paramsSchema, resolveParams(arch, { difficulty: 1, params: example })), []);
  assert.ok(run(example.items).length >= 1);
});

test('one round per item, n limits, same seed same rounds', () => {
  assert.equal(run([item, item, item]).length, 3);
  assert.equal(run([item, item], { n: 1 }).length, 1);
  assert.deepEqual(run([item]), run([item]));
  assert.deepEqual([...run([item])[0].options].sort(), ['tengo', 'tiene', 'tienes']);
});

test('judge: only the answer is right', () => {
  const r = run([item])[0];
  assert.equal(arch.judge(r, r.answer).correct, true);
  assert.ok(r.options.filter((o) => o !== r.answer).every((o) => !arch.judge(r, o).correct));
});

test('hints: level 1 removes a wrong option other than the last try, level 2 gives the answer', () => {
  const r = run([item])[0];
  const h1 = arch.hint(r, 1, 'tienes');
  assert.ok(h1.remove && h1.remove !== r.answer && h1.remove !== 'tienes');
  assert.equal(arch.hint(r, 2, 'tienes').answer, r.answer);
});

test('authoring errors are readable', () => {
  assert.throws(() => run([{ ...item, wrong: ['tengo'] }]), /items\[0\]: a wrong option equals the answer/);
  assert.throws(() => run([{ ...item, prompt: ' ' }]), /must not be blank/);
});
