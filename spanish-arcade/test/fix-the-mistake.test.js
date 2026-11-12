// Tests for fix-the-mistake (generation, scoring, hints) and the shared spelling traps in core/spelling.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/rng.js';
import { resolveParams } from '../core/generate.js';
import { checkParams } from '../core/schema.js';
import { misspell, misspellings, key } from '../core/spelling.js';
import fix from '../archetypes/fix-the-mistake/index.js';
import { checkItem, parts } from '../archetypes/fix-the-mistake/logic.js';
import { word } from './helpers.js';

const pool = ['gato', 'perro', 'pero', 'niño', 'año', 'avión', 'huevo', 'taxi', 'casa', 'mesa', 'pingüino', 'sol']
  .map((es) => word(es, { id: es, es, spell: [] }));
const by = (es) => pool.find((w) => w.es === es);
const run = (targets, params = {}, seed = 1, diff = 1) =>
  fix.make(resolveParams(fix, { difficulty: diff, params }), { targets, pool }, createRng(seed)).rounds;
const diffCount = (r) => r.words.filter((w, i) => w !== r.text.split(' ')[i]).length;

test('misspell: one trap per focus', () => {
  const rng = createRng(1);
  assert.equal(misspell('niño', 'ñ', rng).as, 'nino');
  assert.equal(misspell('perro', 'rr', rng).as, 'pero');
  assert.equal(misspell('huevo', 'h', rng).as, 'uevo');
  assert.equal(misspell('avión', 'accent', rng).as, 'avion');
  assert.equal(misspell('pingüino', 'ü', rng).as, 'pinguino');
  assert.equal(misspell('taxi', 'x', rng).as, 'tasi');
  assert.equal(misspell('casa', 'ñ', rng), null);
});

test('misspell never spells another taught word, nor the word itself', () => {
  const taken = new Set(pool.map((w) => key(w.es)));
  assert.equal(misspell('perro', 'rr', createRng(1), taken), null); // pero is taught
  assert.ok(misspellings('perro', 'any').some((m) => m.as === 'pero'));
  for (const w of pool) for (const m of misspellings(w.es, 'any', taken)) {
    assert.ok(!taken.has(key(m.as)), `${w.es} -> ${m.as}`);
    assert.notEqual(key(m.as), key(w.es));
  }
});

test('misspell: same seed, same result; keeps capitals', () => {
  assert.deepEqual(misspell('huevo', 'any', createRng(5)), misspell('huevo', 'any', createRng(5)));
  assert.equal(misspell('Niño', 'ñ', createRng(1)).as, 'Nino');
});

test('parts splits glued punctuation', () => {
  assert.deepEqual(parts('¿Cómo?'), ['¿', 'Cómo', '?']);
  assert.deepEqual(parts('perro.'), ['', 'perro', '.']);
});

test('checkItem: at in range, as differs, perfect has no error', () => {
  const ok = { text: 'Mi hermano tiene un perro.', at: 4, as: 'pero.' };
  assert.equal(checkItem(ok), null);
  assert.match(checkItem({ ...ok, at: 5 }), /at must be/);
  assert.match(checkItem({ ...ok, at: -1 }), /at must be/);
  assert.match(checkItem({ ...ok, as: 'perro' }), /same word/);
  assert.match(checkItem({ text: 'Hola' }), /at must be/);
  assert.equal(checkItem({ text: 'Todo bien.', perfect: true }), null);
  assert.match(checkItem({ text: 'Todo bien.', perfect: true, at: 0 }), /perfect/);
});

test('difficulty defaults: no error-spotting and no perfect option at 1; typing and perfect at 3', () => {
  const d = (n) => resolveParams(fix, { difficulty: n, params: {} });
  assert.deepEqual([d(1).spot, d(1).allowPerfect, d(1).fix, d(1).size], [false, false, 'choice', 3]);
  assert.deepEqual([d(2).spot, d(2).fix, d(2).size], [true, 'choice', 4]);
  assert.deepEqual([d(3).spot, d(3).allowPerfect, d(3).fix, d(3).size], [true, true, 'type', 5]);
  assert.deepEqual(checkParams(fix.paramsSchema, d(3)), []);
});

test('list mode: one error per round, right answer among choices, words are single taught words', () => {
  const targets = ['niño', 'huevo', 'avión', 'gato', 'pingüino'].map(by);
  for (const diff of [1, 2, 3]) {
    const rounds = run(targets, { focus: 'any' }, 3, diff);
    assert.ok(rounds.length >= 3);
    for (const r of rounds.filter((x) => !x.perfect)) {
      assert.equal(diffCount(r), 1);
      assert.equal(r.words.length, diff + 2);
      assert.notEqual(key(r.words[r.at]), key(r.answer));
      assert.equal(r.words[r.at], r.wrongAs);
      assert.ok(!pool.some((w) => key(w.es) === key(r.wrongAs)), 'slip is not a taught word');
      assert.equal(r.wordIds.length, 1);
      if (diff < 3) { assert.ok(r.choices.includes(r.answer)); assert.ok(r.choices.length >= 2 && r.choices.length <= (diff === 1 ? 2 : 3)); }
      else assert.deepEqual(r.choices, []);
    }
  }
});

test('difficulty 1 never asks to find the error; perfect rounds only when spotting is on', () => {
  const targets = ['niño', 'huevo', 'avión', 'pingüino'].map(by);
  for (const r of run(targets, { focus: 'any' }, 1, 1)) { assert.equal(r.spot, false); assert.equal(r.perfect, false); assert.equal(r.allowPerfect, false); }
  const many = [];
  for (let s = 1; s < 30; s++) many.push(...run(targets, { focus: 'any' }, s, 3));
  assert.ok(many.some((r) => r.perfect));
  const p = many.find((r) => r.perfect);
  assert.equal(p.at, -1); assert.equal(diffCount(p), 0);
  // even if an author asks for perfect at spot:false it is ignored
  assert.ok(run(targets, { focus: 'any', allowPerfect: true, spot: false }, 1, 1).every((r) => !r.perfect));
});

test('same seed gives the same rounds; a target without the trap is replaced by a word that has it', () => {
  const targets = ['niño', 'huevo', 'casa'].map(by);
  assert.deepEqual(run(targets, { focus: 'ñ' }, 4), run(targets, { focus: 'ñ' }, 4));
  const rounds = run(targets, { focus: 'ñ' });
  assert.equal(rounds.length, 2); // only niño and año have ñ
  assert.ok(rounds.every((r) => r.answer.includes('ñ')));
  assert.equal(run([by('perro')], { focus: 'rr' }).length, 0); // pero is taught
});

const items = [
  { text: 'Mi hermano tiene un perro.', at: 4, as: 'pero.' },
  { text: '¿Cómo estás hoy?', at: 0, as: '¿Como' },
  { text: 'Todo está bien.', perfect: true },
];
test('sentence mode: authored items, punctuation kept on the spoiled word, perfect only if allowed', () => {
  const rounds = run([], { items, mode: 'sentence' }, 2, 2);
  assert.equal(rounds.length, 2);
  const r = rounds.find((x) => x.text.startsWith('Mi'));
  assert.equal(r.words[4], 'pero.'); assert.equal(r.answer, 'perro'); assert.equal(r.focus, 'rr'); assert.equal(diffCount(r), 1);
  const c = rounds.find((x) => x.text.startsWith('¿'));
  assert.equal(c.words[0], '¿Como'); assert.equal(c.focus, 'accent');
  assert.equal(run([], { items }, 2, 3).length, 3); // mode inferred from items
  assert.ok(run([], { items }, 2, 3).some((x) => x.perfect));
});

test('sentence mode rejects a bad authored item', () => {
  assert.throws(() => run([], { items: [{ text: 'Hola amigo', at: 7, as: 'ola' }] }), /at must be/);
});

test('judge: right, wrong word, wrong fix, accent slip, perfect', () => {
  const r = run([], { items: [items[0], items[1]] }, 1, 2).find((x) => x.text.startsWith('Mi'));
  const c = run([], { items: [items[1]] }, 1, 2)[0];
  assert.equal(fix.judge(r, { at: r.at, fix: 'perro' }).correct, true);
  assert.equal(fix.judge(r, { at: r.at, fix: 'Perro.' }).correct, true); // case and glued punctuation do not matter
  assert.match(fix.judge(r, { at: 0, fix: 'perro' }).feedback.es, /está bien escrita/);
  assert.match(fix.judge(r, { at: r.at, fix: 'pero' }).feedback.es, /^Casi\./);
  assert.match(fix.judge(r, { at: -1, fix: '' }).feedback.es, /hay una palabra mal/);
  assert.equal(fix.judge(c, { at: 0, fix: 'Como' }).correct, false);
  assert.match(fix.judge(c, { at: 0, fix: 'Como' }).feedback.es, /tilde/);
  assert.equal(fix.judge(c, { at: 0, fix: 'Cómo' }).correct, true);
  const p = run([], { items: [items[2]], allowPerfect: true }, 1, 3)[0];
  assert.equal(fix.judge(p, { at: -1, fix: '' }).correct, true);
  assert.equal(fix.judge(p, { at: 0, fix: 'Todo' }).correct, false);
  assert.equal(fix.judge(r, undefined).correct, false);
});

test('test hook: submitting { at, fix: answer } is always right', () => {
  const targets = ['niño', 'huevo', 'avión'].map(by);
  for (const diff of [1, 2, 3]) for (const r of run(targets, { focus: 'any' }, 2, diff)) {
    assert.equal(fix.judge(r, r.perfect ? { at: -1, fix: '' } : { at: r.at, fix: r.answer }).correct, true);
  }
});

test('hint: level 1 names the slip and keeps at most 3 words, never dimming the wrong word; level 2 reveals', () => {
  const r = run([], { items: [{ text: 'Mi hermano tiene un perro pequeño.', at: 4, as: 'pero' }] }, 1, 2)[0];
  const h = fix.hint(r, 1, { at: 1, fix: 'x' });
  assert.equal(h.level, 1); assert.ok(h.keep.includes(4)); assert.ok(!h.keep.includes(1)); assert.ok(h.keep.length <= 3);
  assert.match(h.line.es, /rr/);
  assert.deepEqual(fix.hint(r, 2), { level: 2, at: 4, answer: 'perro', perfect: false });
  const easy = run([], { items: [{ text: 'Mi hermano tiene un perro.', at: 4, as: 'pero' }] }, 1, 1)[0];
  assert.equal(fix.hint(easy, 1).keep, null); // nothing to dim when the word is already pointed out
});
