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

test('n takes that many authored items', () => {
  assert.equal(run({ items, n: 2 }).length, 2);
});

test('bad authored items throw items[i], whatever the seed or n', () => {
  const bad = [
    ['no gap', { text: 'sin hueco', options: ['a', 'b'], answer: 'a' }],
    ['two gaps', { text: 'dos ___ huecos ___', options: ['a', 'b'], answer: 'a' }],
    ['answer missing', { text: 'falta ___', options: ['a', 'b'], answer: 'c' }],
    ['duplicate', { text: 'repite ___', options: ['a', 'A'], answer: 'a' }],
    ['blank', { text: 'vacía ___', options: ['a', ' '], answer: 'a' }],
    ['one option', { text: 'solo una ___', options: ['a'], answer: 'a' }],
    ['five options', { text: 'muchas ___', options: ['a', 'b', 'c', 'd', 'e'], answer: 'a' }],
  ];
  for (const [name, it] of bad) for (const seed of [1, 2, 3]) {
    assert.throws(() => run({ items: [items[0], it, items[1]], n: 1 }, [], seed), /^Error: items\[1\]: /, name);
  }
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
  const [n] = run({ items: [{ text: 'Mi ___ es simpático', options: ['papá', 'papa'], answer: 'papá' }] });
  assert.equal(arch.judge(n, 'papá').correct, true);
  assert.equal(arch.judge(n, 'papa').correct, false);
  assert.equal(arch.judge(n, 'PAPÁ').correct, true);
  const [ñ] = run({ items: [{ text: 'Es muy ___', options: ['pequeño', 'pequeno'], answer: 'pequeño' }] });
  assert.ok(ñ.options.includes('pequeño'));
  assert.equal(arch.judge(ñ, 'pequeno').correct, false);
});

test('hint: level 1 never reveals and marks the gap; remove only with 4 options and never the answer or last answer', () => {
  const four = run({ items: [{ text: 'A ___ b', options: ['w', 'x', 'y', 'z'], answer: 'w' }] })[0];
  const [two, three] = run({ items });
  for (const [r, wantRemove] of [[two, false], [three, false], [four, true]]) {
    for (const last of r.options.filter((o) => o !== r.answer)) {
      const h = arch.hint(r, 1, last);
      assert.equal(h.level, 1);
      assert.equal(h.mark, true);
      assert.equal('answer' in h, false);
      if (!wantRemove) assert.equal(h.remove, null);
      else { assert.ok(h.remove && h.remove !== r.answer && h.remove !== last); }
      // the shell disables the tapped option only while more than 2 are enabled, then applies remove only while more than 2 are enabled
      let enabled = r.options.length;
      if (enabled > 2) enabled--;
      if (h.remove && enabled > 2) enabled--;
      assert.ok(enabled >= 2);
    }
  }
  assert.deepEqual(arch.hint(three, 2), { level: 2, answer: three.answer });
});

test('speaker text before the answer never contains it; full does', () => {
  const [r] = run({ items });
  assert.ok(!r.heard.includes('tengo'));
  assert.ok(r.heard.includes('hueco'));
  assert.equal(r.full, 'Yo tengo una caja');
});

test('feeling focus only uses adjectives', () => {
  const noun = word('alegria', { tags: ['feelings'], emoji: '🎉' });
  assert.deepEqual(run({ from: { n: 1 }, focus: 'feeling' }, [noun]), []);
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
