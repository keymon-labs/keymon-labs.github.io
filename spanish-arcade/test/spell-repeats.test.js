// Spelling regressions from the owner's play test: repeated letters in spell-tiles, and the harder spell-fill-letters (focus any, plain gaps).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/rng.js';
import { resolveParams } from '../core/generate.js';
import { checkParams } from '../core/schema.js';
import tiles from '../archetypes/spell-tiles/index.js';
import fill from '../archetypes/spell-fill-letters/index.js';
import { wordOf, leadingTiles } from '../archetypes/spell-tiles/logic.js';
import { word } from './helpers.js';

const run = (arch, targets, params = {}, seed = 1, diff = 2, pool = []) =>
  arch.make(resolveParams(arch, { difficulty: diff, params }), { targets, pool }, createRng(seed)).rounds;

// Every way to choose a distinct tile of the same letter for each position of the word.
const injections = (letters, tiles) => {
  const out = [];
  const go = (i, used) => {
    if (i === letters.length) return out.push(used);
    for (const t of tiles) if (t.ch === letters[i] && !used.includes(t.id)) go(i + 1, [...used, t.id]);
  };
  go(0, []);
  return out;
};

test('tiles: repeated letters are correct whichever identical tile was used (hermana, abuela, carretera, cumpleaños...)', () => {
  for (const es of ['hermana', 'abuela', 'carretera', 'cumpleaños', 'naranja', 'silla']) {
    const w = word(es, { id: es, es });
    for (const seed of [1, 2, 3]) for (const extra of [0, 4, 6]) {
      const [round] = run(tiles, [w], { extraLetters: extra }, seed, 2, [w]);
      const orders = injections([...es], round.tiles);
      assert.ok(orders.length >= 1);
      for (const ids of orders.slice(0, 500)) {
        assert.equal(wordOf(round, ids), es);
        assert.equal(tiles.judge(round, wordOf(round, ids)).correct, true, `${es} via tiles ${ids}`);
      }
    }
  }
});

test('tiles: leadingTiles (hint 1) spell the kept letters with distinct tiles; the rest may use any identical tile', () => {
  const w = word('hermana', { id: 'hermana', es: 'hermana' });
  const [round] = run(tiles, [w], { extraLetters: 4 }, 5, 2, [w]);
  for (let n = 1; n < 7; n++) {
    const ids = leadingTiles(round, n);
    assert.equal(new Set(ids).size, n);
    assert.equal(wordOf(round, ids), 'hermana'.slice(0, n));
    const rest = round.tiles.filter((t) => !ids.includes(t.id));
    for (const tail of injections([...'hermana'.slice(n)], rest)) assert.equal(tiles.judge(round, wordOf(round, [...ids, ...tail])).correct, true);
  }
  assert.deepEqual(tiles.hint(round, 1, 'hermaan'), { level: 1, keep: 5 });
});

test('fill: new foci ll, bv, gj blank the right letters', () => {
  const r = (es, focus) => run(fill, [], { items: [{ es }], focus })[0]?.cells.filter((c) => c.gap);
  assert.deepEqual(r('calle', 'll').map((g) => [g.answer, [...g.options].sort()]), [['ll', ['ll', 'y']]]);
  assert.deepEqual(r('playa', 'll').map((g) => g.answer), ['y']);
  assert.deepEqual(r('vaca', 'bv').map((g) => [g.answer, [...g.options].sort()]), [['v', ['b', 'v']]]);
  assert.deepEqual(r('girar', 'gj').map((g) => g.answer), ['g']);
  assert.equal(r('guitarra', 'gj'), undefined, 'gu is not a ge/gi trap');
});

test('fill: focus any mixes the traps of a word; each gap has its own rule and feedback names the wrong gap', () => {
  const [r] = run(fill, [], { items: [{ es: 'villa' }], focus: 'any', gaps: 3 }, 3);
  const gaps = r.cells.filter((c) => c.gap);
  assert.deepEqual(gaps.map((g) => g.focus).sort(), ['bv', 'll']);
  assert.equal(r.cells.map((c) => (c.gap ? c.answer : c.ch)).join(''), 'villa');
  assert.ok(gaps.every((g) => g.options.includes(g.answer) && g.rule));
  assert.match(fill.judge(r, 'viya').feedback.es, /ll o y/);
  assert.match(fill.judge(r, 'billa').feedback.es, /b y la v/);
  assert.equal(fill.hint(r, 1, 'viya').rule, gaps.find((g) => g.focus === 'll').rule);
});

test('fill: plain tops up to gaps with ordinary letters, never the first letter or inside rr ll ch qu gu', () => {
  for (let seed = 1; seed <= 30; seed++) {
    for (const es of ['cumpleaños', 'carretera', 'zanahoria', 'dieciséis', 'también', 'pingüino', 'mochila']) {
      const [round] = run(fill, [], { items: [{ es }], focus: 'any', gaps: 4, plain: true, mode: 'type' }, seed);
      assert.equal(round.cells.map((c) => (c.gap ? c.answer : c.ch)).join(''), es);
      const gaps = round.cells.filter((c) => c.gap);
      assert.ok(gaps.length >= 3 && gaps.length <= 4, `${es} has ${gaps.length} gaps`);
      assert.ok(!(round.cells[0].gap && round.cells[0].focus === 'plain'), 'first letter is never a plain gap');
      for (const g of gaps.filter((x) => x.focus === 'plain')) { assert.equal(g.options.length, 2); assert.match(g.answer, /^[a-z]$/); }
      assert.equal(fill.judge(round, es).correct, true);
    }
  }
});

test('fill: without plain gaps stay on the traps; a plain decoy never spells another taught word', () => {
  assert.equal(run(fill, [], { items: [{ es: 'cumpleaños' }], focus: 'any', gaps: 3 })[0].cells.filter((c) => c.gap).length, 1);
  const taught = ['casa', 'cosa', 'cesa'].map((es) => word(es, { id: es, es }));
  const bad = new Set(['cosa', 'cesa']);
  for (let seed = 1; seed <= 30; seed++) {
    const [round] = run(fill, [], { items: [{ es: 'casa' }], focus: 'any', gaps: 1, plain: true }, seed, 2, taught);
    const cell = round.cells.find((c) => c.gap);
    for (const o of cell.options) assert.ok(!bad.has(round.cells.map((c) => (c.gap ? o : c.ch)).join('')));
  }
});

test('fill: schema accepts gaps 1-4, plain and focus any', () => {
  assert.deepEqual(checkParams(fill.paramsSchema, { items: [{ es: 'hola' }], focus: 'any', gaps: 4, plain: true, mode: 'type' }), []);
  assert.ok(checkParams(fill.paramsSchema, { items: [{ es: 'hola' }], gaps: 5 }).length > 0);
});
