// fill-gap-choice rules: authored and generated items, distractors, accents, determinism, hints, judge.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/rng.js';
import { resolveParams } from '../core/generate.js';
import { checkParams } from '../core/schema.js';
import arch from '../archetypes/fill-gap-choice/index.js';
import { word } from './helpers.js';

const nouns = [
  word('gato', { emoji: '🐱' }), word('luna', { gender: 'f', article: 'la', emoji: '🌙' }),
  word('agua', { gender: 'f', article: 'el', elException: true, emoji: '💧' }),
  word('mesa', { gender: 'f', article: 'la', emoji: '🪑' }), word('pez', { emoji: '🐟' }),
  word('pelotas', { gender: 'f', number: 'pl', article: 'las', emoji: '⚽' }),
  word('globos', { number: 'pl', article: 'los', emoji: '🎈' }),
];
const feelings = ['contento', 'triste', 'enfadado', 'cansado'].map((id, i) =>
  word(id, { pos: 'adj', tags: ['feelings'], emoji: ['😀', '😢', '😠', '😴'][i], gender: undefined, article: undefined, number: undefined }));
const pool = [...nouns, ...feelings];
const items = [
  { text: 'Yo ___ una caja', options: ['tengo', 'tienes'], answer: 'tengo' },
  { text: '¿Dónde ___ el niño?', options: ['está', 'esta', 'estoy'], answer: 'está' },
  { text: '___ qué bonito!', options: ['¡', '¿'], answer: '¡' },
];
const run = (params, targets = [], seed = 1) =>
  arch.make(resolveParams(arch, { difficulty: 1, params }), { targets, pool }, createRng(seed)).rounds;

test('authored items: one round each, same seed same rounds, answer among unique options', () => {
  const rounds = run({ items });
  assert.equal(rounds.length, 3);
  assert.deepEqual(rounds, run({ items }));
  for (const r of rounds) {
    assert.ok(r.options.includes(r.answer));
    assert.equal(new Set(r.options).size, r.options.length);
    assert.equal(r.parts.length, 2);
  }
});

test('n takes that many authored items; unusable items are skipped silently', () => {
  assert.equal(run({ items, n: 2 }).length, 2);
  const bad = [{ text: 'sin hueco', options: ['a', 'b'], answer: 'a' }, { text: 'dos ___ huecos ___', options: ['a', 'b'], answer: 'a' },
    { text: 'falta ___', options: ['a', 'b'], answer: 'c' }, { text: 'repite ___', options: ['a', 'a'], answer: 'a' },
    { text: 'solo una ___', options: ['a'], answer: 'a' }, items[0]];
  assert.equal(run({ items: bad }).length, 1);
});

test('different seeds can shuffle options', () => {
  const orders = new Set();
  for (let s = 1; s < 20; s++) orders.add(run({ items }, [], s)[1].options.join());
  assert.ok(orders.size > 1);
});

test('article focus: exactly one correct option, no duplicates, only articles, elException respected', () => {
  for (let seed = 1; seed <= 30; seed++) {
    for (const r of run({ from: { n: 7 }, focus: 'article', options: 4 }, nouns, seed)) {
      assert.equal(r.options.filter((o) => o === r.answer).length, 1);
      assert.equal(new Set(r.options).size, r.options.length);
      assert.ok(r.options.every((o) => ['el', 'la', 'los', 'las'].includes(o)));
      const w = nouns.find((n) => n.id === r.wordIds[0]);
      assert.equal(r.answer, w.article);
      assert.equal(r.options.length, 4);
    }
  }
  const agua = run({ from: { n: 1 }, focus: 'article', options: 2 }, [nouns[2]])[0];
  assert.equal(agua.answer, 'el');
  assert.deepEqual([...agua.options].sort(), ['el', 'la']);
});

test('article focus: 2 options keep the noun\'s number', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const r = run({ from: { n: 1 }, focus: 'article', options: 2 }, [nouns[4]], seed)[0];
    assert.ok(r.options.every((o) => ['el', 'la'].includes(o)));
    const p = run({ from: { n: 1 }, focus: 'article', options: 2 }, [nouns[5]], seed)[0];
    assert.ok(p.options.every((o) => ['los', 'las'].includes(o)));
  }
});

test('article focus: completed sentence contains the article and the noun; wordIds set', () => {
  const r = run({ from: { n: 1 }, focus: 'article' }, [nouns[0]])[0];
  assert.deepEqual(r.wordIds, ['gato']);
  assert.ok(r.full.includes(`${r.answer} gato`));
  assert.equal(r.emoji, '🐱');
});

test('feeling focus: distractors are other feelings; non-feelings are skipped', () => {
  for (let seed = 1; seed <= 20; seed++) {
    for (const r of run({ from: { n: 4 }, focus: 'feeling', options: 3 }, [...feelings, nouns[0]], seed)) {
      assert.equal(r.options.length, 3);
      assert.equal(new Set(r.options).size, 3);
      assert.ok(r.options.every((o) => feelings.some((f) => f.es === o)));
      assert.ok(r.options.includes(r.answer));
    }
  }
  assert.equal(run({ from: { n: 5 }, focus: 'feeling' }, [...feelings, nouns[0]]).length, 4);
});

test('generated items are deterministic; no matching metadata gives no rounds; a small pool gives fewer options', () => {
  const p = { from: { n: 7 }, focus: 'article' };
  assert.deepEqual(run(p, nouns, 5), run(p, nouns, 5));
  assert.deepEqual(run({ from: { n: 1 }, focus: 'feeling' }, [nouns[0]]), []);
  assert.deepEqual(run({ from: { n: 1 }, focus: 'article' }, [feelings[0]]), []);
  const tiny = arch.make(resolveParams(arch, { difficulty: 1, params: { from: { n: 1 }, focus: 'feeling', options: 4 } }),
    { targets: [feelings[0]], pool: feelings.slice(0, 2) }, createRng(1)).rounds;
  assert.equal(tiny[0].options.length, 2);
});

test('accents, ñ, ¿ and ¡ survive in options and compare strictly', () => {
  const [, r, q] = run({ items });
  assert.equal(arch.judge(r, 'está').correct, true);
  assert.equal(arch.judge(r, 'esta').correct, false);
  assert.equal(arch.judge(q, '¡').correct, true);
  assert.equal(arch.judge(q, '¿').correct, false);
  const [n] = run({ items: [{ text: 'El ___ es pequeño', options: ['año', 'ano'], answer: 'año' }] });
  assert.equal(arch.judge(n, 'año').correct, true);
  assert.equal(arch.judge(n, 'ano').correct, false);
  assert.equal(arch.judge(n, 'AÑO').correct, true);
});

test('hint: level 1 never reveals, marks the gap, avoids the last answer; 2 options are not narrowed', () => {
  const [two, three] = run({ items });
  const h2 = arch.hint(two, 1, 'tienes');
  assert.equal(h2.level, 1);
  assert.equal(h2.mark, true);
  assert.equal(h2.remove, null);
  assert.equal('answer' in h2, false);
  const last = three.options.find((o) => o !== three.answer);
  const h3 = arch.hint(three, 1, last);
  assert.notEqual(h3.remove, three.answer);
  assert.notEqual(h3.remove, last);
  assert.ok(three.options.includes(h3.remove));
  assert.deepEqual(arch.hint(three, 2), { level: 2, answer: three.answer });
});

test('params: schema accepts a valid exercise, rejects unknown params and bad values', () => {
  const ok = (params) => checkParams(arch.paramsSchema, params);
  assert.deepEqual(ok({ items }), []);
  assert.deepEqual(ok({ from: { tag: 'feelings', n: 3 }, focus: 'feeling', options: 3 }), []);
  assert.notDeepEqual(ok({ items, focus: 'verb-form' }), []);
  assert.notDeepEqual(ok({ items, bogus: 1 }), []);
  assert.notDeepEqual(ok({ items, options: 5 }), []);
});

test('defaults follow difficulty and the skill is grammar', () => {
  assert.equal(arch.skill, 'grammar');
  assert.equal(resolveParams(arch, { difficulty: 1 }).options, 2);
  assert.equal(resolveParams(arch, { difficulty: 3 }).options, 4);
});
