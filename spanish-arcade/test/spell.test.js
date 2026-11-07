// Tests for the spelling archetypes' pure logic (spell-tiles, spell-fill-letters).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/rng.js';
import { resolveParams } from '../core/generate.js';
import { checkParams } from '../core/schema.js';
import tiles from '../archetypes/spell-tiles/index.js';
import fill from '../archetypes/spell-fill-letters/index.js';
import { sameWord } from '../core/spelling.js';
import { formable } from '../archetypes/spell-tiles/logic.js';
import { word } from './helpers.js';

const pool = ['gato', 'perro', 'pino', 'niño', 'año', 'avión', 'papá', 'papa', 'hola', 'huevo', 'taxi', 'pingüino', 'casa', 'asa', 'sac', 'mesa', 'sema']
  .map((es) => word(es, { id: es, es, spell: [] }));
const by = (es) => pool.find((w) => w.es === es);
const run = (arch, targets, params = {}, seed = 1, diff = 1, p = pool) =>
  arch.make(resolveParams(arch, { difficulty: diff, params }), { targets, pool: p }, createRng(seed)).rounds;

test('sameWord: case, ñ is not n, accents strict vs lenient', () => {
  assert.ok(sameWord('GATO', 'gato'));
  assert.ok(!sameWord('ano', 'año'));
  assert.ok(!sameWord('ano', 'año', 'lenient'));
  assert.ok(!sameWord('avion', 'avión'));
  assert.ok(sameWord('avion', 'avión', 'lenient'));
  assert.ok(sameWord('pinguino', 'pingüino', 'lenient'));
  assert.ok(!sameWord('pinguino', 'pingüino'));
  assert.ok(sameWord('año', 'año'), 'decomposed ñ equals ñ');
  assert.ok(sameWord(' perro ', 'perro'));
});

test('schemas declare accents (default strict), skill spelling, and validate', () => {
  for (const a of [tiles, fill]) {
    assert.equal(a.paramsSchema.accents.default, 'strict');
    assert.equal(a.skill, 'spelling');
  }
  assert.deepEqual(checkParams(tiles.paramsSchema, { from: { n: 2 }, extraLetters: 2, accents: 'lenient' }), []);
  assert.deepEqual(checkParams(fill.paramsSchema, { items: [{ es: '¿Cómo estás?' }], focus: '¿¡' }), []);
  assert.ok(checkParams(tiles.paramsSchema, { from: { n: 2 }, accents: 'loose' }).length > 0);
});

test('tiles: rounds are seeded, judged, and the tiles spell the word plus decoys', () => {
  const targets = ['gato', 'niño', 'avión'].map(by);
  const params = { from: { n: 3 }, extraLetters: 3 };
  const a = run(tiles, targets, params, 7);
  assert.deepEqual(a, run(tiles, targets, params, 7));
  for (const r of a) {
    assert.equal(r.tiles.length, [...r.answer].length + 3);
    assert.ok(formable(r.answer, r.tiles.map((t) => t.ch)));
    assert.ok(tiles.judge(r, r.answer).correct);
    assert.ok(!tiles.judge(r, 'xxxx').correct);
    assert.equal(r.wordIds.length, 1);
  }
});

test('tiles: tiles are not already in answer order when there are no decoys', () => {
  for (let seed = 1; seed < 30; seed++) {
    const [r] = run(tiles, [by('gato')], { from: { n: 1 } }, seed);
    assert.notEqual(r.tiles.map((t) => t.ch).join(''), 'gato');
  }
});

test('tiles: decoys never make a second valid word', () => {
  for (let seed = 1; seed < 80; seed++) {
    for (const es of ['mesa', 'casa', 'perro', 'papá', 'niño', 'hola']) {
      const [r] = run(tiles, [by(es)], { from: { n: 1 }, extraLetters: 4 }, seed);
      const chars = r.tiles.map((t) => t.ch);
      for (const w of pool) {
        if (formable(w.es, chars)) assert.ok(formable(w.es, [...es]), `${w.es} appeared from decoys added to ${es} (seed ${seed})`);
      }
    }
  }
});

test('tiles: judging with and without accents', () => {
  const [strict] = run(tiles, [by('avión')], { from: { n: 1 } });
  assert.ok(tiles.judge(strict, 'avión').correct);
  assert.ok(tiles.judge(strict, 'AVIÓN').correct);
  assert.ok(!tiles.judge(strict, 'avion').correct);
  const [lenient] = run(tiles, [by('avión')], { from: { n: 1 }, accents: 'lenient' });
  assert.ok(tiles.judge(lenient, 'avion').correct);
  const [ny] = run(tiles, [by('año')], { from: { n: 1 }, accents: 'lenient' });
  assert.ok(!tiles.judge(ny, 'ano').correct, 'lenient accents still keep ñ ≠ n');
});

test('tiles: hint 1 keeps the correct leading letters (at least one), hint 2 reveals', () => {
  const [r] = run(tiles, [by('gato')], { from: { n: 1 } });
  assert.deepEqual(tiles.hint(r, 1, 'gxto'), { level: 1, keep: 1 });
  assert.deepEqual(tiles.hint(r, 1, 'gaxo'), { level: 1, keep: 2 });
  assert.deepEqual(tiles.hint(r, 1, 'xato'), { level: 1, keep: 1 });
  assert.deepEqual(tiles.hint(r, 1, 'gatox'), { level: 1, keep: 3 });
  assert.deepEqual(tiles.hint(r, 2, 'xxx'), { level: 2, answer: 'gato' });
});

test('tiles: words with spaces or symbols are skipped', () => {
  const rounds = run(tiles, [word('buenos-dias', { es: 'buenos días' }), by('gato')], { from: { n: 2 } });
  assert.equal(rounds.length, 1);
});

test('fill: each focus blanks the right letters; options include the answer', () => {
  const cases = [['perro', 'rr'], ['niño', 'ñ'], ['huevo', 'h'], ['avión', 'accent'], ['pingüino', 'ü'], ['taxi', 'x'], ['mesa', 's'], ['hola', 'h']];
  for (const [es, focus] of cases) {
    const [r] = run(fill, [by(es)], { from: { n: 1 }, focus });
    assert.ok(r, es);
    assert.ok(fill.judge(r, es).correct, es);
    const gap = r.cells.find((c) => c.gap);
    assert.ok(gap.options.includes(gap.answer) && gap.options.length >= 2, es);
    assert.equal(r.focus, focus);
  }
});

test('fill: r needs vowels on both sides; pino has none', () => {
  assert.deepEqual(run(fill, [by('pino')], { from: { n: 1 }, focus: 'r' }), []);
  const [r] = run(fill, [word('pera', { id: 'pera', es: 'pera' })], { from: { n: 1 }, focus: 'r' });
  assert.equal(r.cells.find((c) => c.gap).answer, 'r');
});

test('fill: an option that spells another pool word is never offered (perro/pero)', () => {
  const p2 = [...pool, word('pero', { id: 'pero', es: 'pero' })];
  assert.deepEqual(run(fill, [by('perro')], { from: { n: 1 }, focus: 'rr' }, 1, 1, p2), []);
});

test('fill: judging with and without accents, ñ vs n', () => {
  const [s] = run(fill, [by('avión')], { from: { n: 1 }, focus: 'accent' });
  assert.ok(!fill.judge(s, 'avion').correct);
  const [l] = run(fill, [by('huevo')], { from: { n: 1 }, focus: 'h', accents: 'lenient' });
  assert.ok(fill.judge(l, 'huevo').correct);
  const [n] = run(fill, [by('niño')], { from: { n: 1 }, focus: 'ñ', accents: 'lenient' });
  assert.ok(!fill.judge(n, 'nino').correct);
  assert.ok(fill.judge(n, 'NIÑO').correct);
});

test('fill: feedback explains the rule in one sentence', () => {
  const [r] = run(fill, [by('perro')], { from: { n: 1 }, focus: 'rr' });
  const bad = fill.judge(r, 'pero').feedback;
  assert.match(bad.en, /rr/);
  assert.match(bad.es, /rr/);
  assert.ok(!fill.judge(r, 'pero').correct);
});

test('fill: items with ¿¡, and auto focus from the word', () => {
  const rounds = run(fill, [], { items: [{ es: '¿Cómo estás?', en: 'How are you?' }, { es: 'gato' }], focus: '¿¡' });
  assert.equal(rounds.length, 1);
  assert.ok(fill.judge(rounds[0], '¿Cómo estás?').correct);
  assert.ok(!fill.judge(rounds[0], 'Cómo estás?').correct);
  const [a] = run(fill, [{ ...by('niño'), spell: ['ñ'] }], { from: { n: 1 } });
  assert.equal(a.focus, 'ñ');
});

test('fill: seeded; gaps are capped by what the word has', () => {
  const t = [by('pingüino'), by('avión')];
  const p = { from: { n: 2 }, focus: 'accent' };
  assert.deepEqual(run(fill, t, p, 3), run(fill, t, p, 3));
  const [r] = run(fill, [], { items: [{ es: 'canción' }], focus: 'accent', gaps: 3 });
  assert.equal(r.cells.filter((c) => c.gap).length, 1);
  const [two] = run(fill, [], { items: [{ es: 'último café' }], focus: 'accent', gaps: 2 });
  assert.equal(two.cells.filter((c) => c.gap).length, 2);
});

test('fill: hint finds the first wrong gap and gives its first letter; hint 2 reveals', () => {
  const [r] = run(fill, [by('perro')], { from: { n: 1 }, focus: 'rr' });
  const h = fill.hint(r, 1, 'pero');
  assert.equal(h.level, 1);
  assert.equal(h.gap, 0);
  assert.equal(h.first, 'r');
  assert.equal(h.remove, null, 'two options: nothing to grey out');
  assert.deepEqual(fill.hint(r, 2, 'pero'), { level: 2, answer: 'perro' });
});

test('fill: a one-letter gap hint gives no first letter and no removal with two options', () => {
  const [r] = run(fill, [by('niño')], { from: { n: 1 }, focus: 'ñ' });
  const h = fill.hint(r, 1, 'nino');
  assert.equal(h.first, null);
  assert.equal(h.remove, null);
  assert.ok(h.rule.en);
});

test('fill: accent and ü are always strict, even when lenient is asked', () => {
  const [a] = run(fill, [by('avión')], { from: { n: 1 }, focus: 'accent', accents: 'lenient' });
  assert.ok(!fill.judge(a, 'avion').correct);
  const [u] = run(fill, [by('pingüino')], { from: { n: 1 }, focus: 'ü', accents: 'lenient' });
  assert.ok(!fill.judge(u, 'pinguino').correct);
});
