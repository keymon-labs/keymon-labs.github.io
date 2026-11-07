// odd-one-out and match-pairs rules: make (seeded), judge, hint, schema. Invented words only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/rng.js';
import { resolveParams } from '../core/generate.js';
import { checkParams } from '../core/schema.js';
import odd from '../archetypes/odd-one-out/index.js';
import match from '../archetypes/match-pairs/index.js';
import { word } from './helpers.js';

const pool = [
  word('gato', { emoji: '🐱', tags: ['animals'], article: 'el' }), word('perro', { emoji: '🐶', tags: ['animals'] }),
  word('pez', { emoji: '🐟', tags: ['animals'] }), word('pato', { emoji: '🦆', tags: ['animals'] }),
  word('mesa', { emoji: '🪑', tags: ['home'], gender: 'f', article: 'la' }), word('silla', { emoji: '💺', tags: ['home'], gender: 'f', article: 'la' }),
  word('lampara', { emoji: '💡', tags: ['home'], gender: 'f', article: 'la' }), word('cama', { emoji: '🛏️', tags: ['home'], gender: 'f', article: 'la' }),
  word('rojo', { emoji: '', tags: ['colours'], pos: 'adj' }),
];
const make = (arch, ex, seed = 1, targets = pool.slice(0, 4)) =>
  arch.make(resolveParams(arch, { difficulty: 1, ...ex }), { targets, pool }, createRng(seed)).rounds;

// ---------- odd-one-out ----------
test('odd-one-out: vocab mode is seeded; the intruder shares no topic with the others', () => {
  const ex = { params: { from: { n: 4 }, size: 4 } };
  assert.deepEqual(make(odd, ex, 3), make(odd, ex, 3));
  for (let seed = 1; seed <= 30; seed++) {
    for (const r of make(odd, ex, seed, [pool[0], pool[4], pool[1]])) {
      const byId = Object.fromEntries(pool.map((w) => [w.id, w]));
      const a = byId[r.answer];
      const others = r.options.filter((o) => o.id !== r.answer);
      assert.equal(r.options.length, 4);
      assert.equal(new Set(r.options.map((o) => o.es)).size, 4);
      assert.ok(others.every((o) => !byId[o.id].tags.some((t) => a.tags.includes(t))));
      assert.equal(new Set(others.map((o) => byId[o.id].tags[0])).size, 1);
      assert.ok(r.wordIds.includes(r.answer));
    }
  }
});

test('odd-one-out: targets with no other topic big enough are skipped', () => {
  const rounds = make(odd, { params: { from: { n: 1 }, size: 6 } }, 1, [pool[0]]);
  assert.deepEqual(rounds, []);
});

test('odd-one-out: authored groups; bad groups skipped; size caps the cloud', () => {
  const groups = [
    { words: ['uno', 'dos', 'tres', 'cuatro'], odd: 'azul', theme: 'números' },
    { words: ['sol', 'sol'], odd: 'luna' }, // only one distinct member
    { words: ['sol', 'luna'], odd: 'Luna' }, // intruder repeats a member
  ];
  const rounds = make(odd, { params: { groups, size: 4 } });
  assert.equal(rounds.length, 1);
  assert.equal(rounds[0].options.length, 4);
  assert.equal(rounds[0].answer, 'azul');
  assert.equal(rounds[0].theme, 'números');
  assert.deepEqual(make(odd, { params: { groups } }, 5), make(odd, { params: { groups } }, 5));
});

test('odd-one-out: judge and hints (nudge never reveals; theme when too few to grey out)', () => {
  const r = make(odd, { params: { groups: [{ words: ['a', 'b', 'c', 'd', 'e'], odd: 'z', theme: 'letras' }], size: 5 } })[0];
  assert.equal(odd.judge(r, r.answer).correct, true);
  assert.equal(odd.judge(r, 'a').correct, false);
  const h1 = odd.hint(r, 1, 'a');
  assert.ok(h1.remove && h1.remove !== r.answer && h1.remove !== 'a');
  assert.equal(odd.hint(r, 2, 'a').answer, r.answer);
  const three = make(odd, { params: { groups: [{ words: ['a', 'b'], odd: 'z', theme: 'letras' }] } })[0];
  assert.deepEqual(odd.hint(three, 1, 'a'), { level: 1, remove: null, theme: 'letras' });
});

test('odd-one-out: params validate', () => {
  assert.deepEqual(checkParams(odd.paramsSchema, { groups: [{ words: ['a', 'b'], odd: 'c' }], size: 4 }), []);
  assert.ok(checkParams(odd.paramsSchema, { groups: [{ words: ['a'], odd: 'c' }] }).length);
  assert.ok(checkParams(odd.paramsSchema, { size: 9 }).length);
});

// ---------- match-pairs ----------
const sol = (r) => r.pairs.map((p) => [p.id, p.id]);

test('match-pairs: word-picture is seeded, boards chunk the targets, words without an emoji are skipped', () => {
  const ex = { params: { from: { n: 8 }, size: 3 } };
  const t = pool.slice(0, 8);
  assert.deepEqual(make(match, ex, 4, t), make(match, ex, 4, t));
  assert.deepEqual(make(match, ex, 4, t).map((r) => r.pairs.length), [3, 3, 2]);
  assert.deepEqual(make(match, ex, 4, t.slice(0, 7)).map((r) => r.pairs.length), [3, 4]); // a lone leftover joins the last board
  const noEmoji = make(match, { params: { from: { n: 3 }, size: 3 } }, 1, [pool[0], pool[1], pool[8]]);
  assert.deepEqual(noEmoji.map((r) => r.pairs.length), [2]); // the word without an emoji is skipped
});

test('match-pairs: a board needs at least 2 pairs', () => {
  assert.equal(make(match, { params: { from: { n: 1 }, size: 3 } }, 1, [pool[0]]).length, 0);
  assert.equal(make(match, { params: { from: { n: 2 }, size: 3 } }, 1, [pool[0], pool[1]]).length, 1);
});

test('match-pairs: no duplicate words or pictures on a board; columns are permutations', () => {
  const dup = [pool[0], word('gata', { emoji: '🐱' }), pool[1], word('perro2', { es: 'perro', emoji: '🐕' }), pool[2]];
  for (let seed = 1; seed <= 20; seed++) {
    const [r] = make(match, { params: { from: { n: 5 }, size: 5 } }, seed, dup);
    assert.equal(new Set(r.pairs.map((p) => p.a)).size, r.pairs.length);
    assert.equal(new Set(r.pairs.map((p) => p.b)).size, r.pairs.length);
    assert.deepEqual([...r.left].sort(), r.pairs.map((p) => p.id).sort());
    assert.deepEqual([...r.right].sort(), r.pairs.map((p) => p.id).sort());
  }
});

test('match-pairs: article-noun mode pairs nouns with el/la; judge accepts equal texts', () => {
  const [r] = make(match, { params: { from: { n: 4 }, size: 4, mode: 'article-noun' } }, 2, [pool[0], pool[4], pool[1], pool[5]]);
  const art = Object.fromEntries(r.pairs.map((p) => [p.a, p.b]));
  assert.equal(art.gato, 'el');
  assert.equal(art.mesa, 'la');
  // perro and gato both take "el": swapping their articles is still right
  const gato = r.pairs.find((p) => p.a === 'gato').id;
  const perro = r.pairs.find((p) => p.a === 'perro').id;
  const swapped = sol(r).map(([l, rt]) => (l === gato ? [l, perro] : l === perro ? [l, gato] : [l, rt]));
  assert.equal(match.judge(r, swapped).correct, true);
});

test('match-pairs: explicit pairs make one board; blank or repeated sides are skipped', () => {
  const pairs = [{ a: '¿Cómo te llamas?', b: 'Me llamo Ana' }, { a: '¿Cuántos años tienes?', b: 'Tengo ocho' }, { a: 'x', b: '' }, { a: '¿Cómo te llamas?', b: 'y' }];
  const rounds = make(match, { params: { pairs } });
  assert.equal(rounds.length, 1);
  assert.equal(rounds[0].pairs.length, 2);
});

test('match-pairs: judge needs every pair right, once', () => {
  const [r] = make(match, { params: { from: { n: 3 }, size: 3 } }, 1, pool.slice(0, 3));
  assert.equal(match.judge(r, sol(r)).correct, true);
  const [p0, p1, p2] = r.pairs.map((p) => p.id);
  assert.equal(match.judge(r, [[p0, p1], [p1, p0], [p2, p2]]).correct, false);
  assert.equal(match.judge(r, [[p0, p0], [p1, p1]]).correct, false); // incomplete
  assert.equal(match.judge(r, [[p0, p0], [p0, p0], [p1, p1]]).correct, false); // repeated left
  assert.equal(match.judge(r, 'nope').correct, false);
});

test('match-pairs: hints nudge by unjoining wrong pairs; level 2 reveals exactly one pair', () => {
  const [r] = make(match, { params: { from: { n: 3 }, size: 3 } }, 1, pool.slice(0, 3));
  const [p0, p1, p2] = r.pairs.map((p) => p.id);
  const last = [[p0, p1], [p1, p0], [p2, p2]];
  const h1 = match.hint(r, 1, last);
  assert.deepEqual(h1, { level: 1, wrong: [p0, p1] });
  assert.ok(!('pair' in h1));
  const h2 = match.hint(r, 2, last);
  assert.deepEqual(h2.pair, [p0, p0]); // one correct pair, never the whole solution
  assert.deepEqual(match.hint(r, 1, undefined), { level: 1, wrong: [] });
});

test('match-pairs: params validate', () => {
  assert.deepEqual(checkParams(match.paramsSchema, { pairs: [{ a: 'x', b: 'y' }, { a: 'z', b: 'w' }] }), []);
  assert.ok(checkParams(match.paramsSchema, { mode: 'nope' }).length);
  assert.ok(checkParams(match.paramsSchema, { size: 1 }).length);
});
