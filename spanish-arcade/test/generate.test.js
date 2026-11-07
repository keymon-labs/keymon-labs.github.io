// Seeded generation (core/generate.js). Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/rng.js';
import { seedFor, select, allowedWords, schemaDefaults, resolveParams, makeExercise, distractors } from '../core/generate.js';
import { buildContent } from '../core/content.js';
import placeholder from '../archetypes/placeholder/index.js';
import { word } from './helpers.js';

const unit = (id, order, from) => ({ schema: 1, id, rev: 1, order, title: { es: id, en: id }, intro: { es: 'x', en: 'x' },
  badge: { name: { es: 'b', en: 'b' }, icon: '⭐' }, pass: { minCorrect: 1 },
  exercises: ['a', 'b', 'c', 'd', 'e'].map((x) => ({ id: `${id}-${x}`, archetype: 'placeholder', difficulty: 1, params: { from }, prompt: { es: 'p', en: 'p' } })) });

const content = buildContent({
  archetypes: { './placeholder/index.js': placeholder },
  units: { 'u1.json': unit('u1', 1, { tag: 'animals', n: 2 }), 'u2.json': unit('u2', 2, { tag: 'animals', n: 3 }) },
  vocab: {
    'u1.json': { schema: 1, words: [word('gato', { tags: ['animals'] }), word('perro', { tags: ['animals'], spell: ['rr'] }), word('sol')] },
    'u2.json': { schema: 1, words: [word('pez', { tags: ['animals'], unit: 'u2' }), word('correr', { pos: 'verb', tags: ['animals'], spell: ['rr'], unit: 'u2', gender: undefined, article: undefined, number: undefined })] },
  },
});

test('fixture content is valid', () => assert.deepEqual(content.errors, []));

test('seedFor is stable and differs by part', () => {
  assert.equal(seedFor('p1', 'u1', 0), seedFor('p1', 'u1', 0));
  assert.notEqual(seedFor('p1', 'u1', 0), seedFor('p1', 'u1', 1));
  assert.notEqual(seedFor('p1', 'u1', 0), seedFor('p2', 'u1', 0));
});

test('upToUnit limits the pool to words already taught', () => {
  assert.deepEqual(allowedWords(content, 'u1').map((w) => w.id).sort(), ['gato', 'perro', 'sol']);
  assert.equal(allowedWords(content, 'u2').length, 5);
  const ids = (sel, u) => select(sel, content, u).map((w) => w.id).sort();
  assert.deepEqual(ids({ tag: 'animals' }, 'u1'), ['gato', 'perro']);
  assert.deepEqual(ids({ tag: 'animals', upToUnit: false }, 'u1'), ['correr', 'gato', 'perro', 'pez']);
  assert.deepEqual(ids({ spell: 'rr' }, 'u2'), ['correr', 'perro']);
  assert.deepEqual(ids({ spell: ['rr'], pos: 'noun' }, 'u2'), ['perro']);
  assert.deepEqual(ids({ tag: 'animals', exclude: ['gato'] }, 'u2'), ['correr', 'perro', 'pez']);
  assert.deepEqual(ids({ ids: ['sol', 'pez'] }, 'u1'), ['sol']);
});

test('resolveParams layers schema defaults < defaults(difficulty) < explicit params', () => {
  const ex = { difficulty: 2, params: { from: { tag: 'x', n: 1 } } };
  assert.equal(resolveParams(placeholder, ex).options, placeholder.defaults(2).options);
  assert.equal(resolveParams(placeholder, { ...ex, params: { ...ex.params, options: 2 } }).options, 2);
  assert.equal(resolveParams({ paramsSchema: { k: { type: 'int', default: 7 } } }, { difficulty: 1, params: {} }).k, 7);
});

test('schemaDefaults collects defaults', () => {
  assert.deepEqual(schemaDefaults(placeholder.paramsSchema), { options: 3 });
});

test('an unset optional selector gives targets: [] (exercise uses items)', () => {
  let got;
  const itemsArch = { id: 'items-game', paramsSchema: { from: { type: 'selector', optional: true }, items: { type: 'array', items: { type: 'string' }, optional: true } },
    make: (params, words) => { got = words; return { rounds: params.items.map((t) => ({ t })) }; } };
  const c = { ...content, archetypeById: { ...content.archetypeById, 'items-game': itemsArch } };
  const u = { ...content.unitById.u1, exercises: [{ id: 'x-items', archetype: 'items-game', difficulty: 1, params: { items: ['a', 'b'] } }] };
  const { rounds } = makeExercise(c, u, 0, createRng(1));
  assert.deepEqual(got.targets, []);
  assert.equal(got.pool.length, 3);
  assert.equal(rounds.length, 2);
});

test('makeExercise is deterministic per seed and varies across seeds', () => {
  const u = content.unitById.u2;
  const run = (seed) => makeExercise(content, u, 0, createRng(seed)).rounds;
  assert.deepEqual(run(5), run(5));
  const seen = new Set(Array.from({ length: 20 }, (_, s) => JSON.stringify(run(s))));
  assert.ok(seen.size > 1);
  assert.equal(run(5).length, 3);
});

test('distractors never equal the answer and prefer similar words', () => {
  const pool = [word('gato'), word('gata', { gender: 'f', article: 'la' }), word('pato'), word('mesa'), word('sol', { pos: 'adj', tags: ['x'] })];
  const answer = pool[0];
  for (let s = 0; s < 50; s++) {
    const d = distractors(answer, pool, 3, createRng(s));
    assert.equal(d.length, 3);
    assert.ok(!d.some((w) => w.id === answer.id || w.es === answer.es));
    assert.equal(new Set(d.map((w) => w.id)).size, 3);
  }
  const close = distractors(answer, pool, 2, createRng(1), { similar: true }).map((w) => w.id).sort();
  assert.deepEqual(close, ['gata', 'pato']);
  assert.deepEqual(distractors(answer, pool, 9, createRng(1), { filter: (w) => w.pos === 'adj' }).map((w) => w.id), ['sol']);
});
