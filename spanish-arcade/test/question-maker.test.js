// Tests for question-maker: focus validation, the three build modes, judge feedback, hints, scoring through the session.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/rng.js';
import { resolveParams } from '../core/generate.js';
import { checkParams } from '../core/schema.js';
import { createUnitSession } from '../core/session.js';
import arch from '../archetypes/question-maker/index.js';
import { splitFocus, tilesFor, textsOf } from '../archetypes/question-maker/logic.js';
import { loadRealContent } from './helpers.js';

const ITEMS = [
  { answer: 'Vivo en una casa azul.', focus: 'en una casa azul', question: '¿Dónde vives?', wrong: ['¿Dónde vivo?'] },
  { answer: 'Llego tarde porque perdí el autobús.', focus: 'porque perdí el autobús', question: '¿Por qué llegas tarde?' },
  { answer: 'Mi hermano tiene tres gatos.', focus: 'tres', question: '¿Cuántos gatos tiene tu hermano?', accept: ['¿Cuántos tiene tu hermano gatos?'] },
];
const rounds = (params = {}, difficulty = 1, seed = 1, items = ITEMS) =>
  arch.make(resolveParams(arch, { difficulty, params: { items, ...params } }), { targets: [], pool: [] }, createRng(seed)).rounds;
const find = (rs, q) => rs.find((r) => r.es === q);

test('defaults follow difficulty and params validate', () => {
  assert.deepEqual(['build', 'decoys'].map((k) => resolveParams(arch, { difficulty: 1, params: { items: ITEMS } })[k]), ['choice', 0]);
  assert.deepEqual(['build', 'decoys'].map((k) => resolveParams(arch, { difficulty: 3, params: { items: ITEMS } })[k]), ['type', 3]);
  const p = resolveParams(arch, { difficulty: 2, params: { items: ITEMS } });
  assert.deepEqual(checkParams(arch.paramsSchema, p), []);
  assert.ok(checkParams(arch.paramsSchema, { ...p, build: 'drag' }).length);
});

test('splitFocus and bad focus', () => {
  assert.deepEqual(splitFocus('Vivo en casa.', 'en casa'), ['Vivo ', 'en casa', '.']);
  assert.throws(() => rounds({}, 1, 1, [{ answer: 'Hola.', focus: 'adiós', question: '¿Qué?' }]), /focus/);
});

test('same seed, same rounds; n limits', () => {
  assert.deepEqual(rounds({}, 2, 7), rounds({}, 2, 7));
  assert.equal(rounds({ n: 2 }).length, 2);
});

test('choice: 3 options, one correct, wrong ones are never accepted', () => {
  for (let seed = 0; seed < 30; seed++) for (const r of rounds({}, 1, seed)) {
    assert.equal(r.options.length, 3);
    assert.equal(r.options.filter((o) => o.ok).length, 1);
    for (const o of r.options.filter((x) => !x.ok)) assert.equal(arch.judge(r, o.text).correct, false, o.text);
    assert.equal(arch.judge(r, r.options.find((o) => o.ok).text).correct, true);
  }
  const lone = rounds({}, 1, 1, [ITEMS[0]])[0]; // one item: authored wrong + accent-less look-alike
  assert.deepEqual(lone.options.map((o) => o.text).sort(), ['¿Dónde vives?', '¿Dónde vivo?', '¿Donde vives?'].sort());
  assert.throws(() => rounds({}, 1, 1, [{ answer: 'Es azul.', focus: 'azul', question: '¿Cuál es?' }].slice(0, 1).map((i) => ({ ...i, question: '¿Que es?' }))), /wrong/);
});

test('tiles: question tiles with marks, decoys include authored words, solved order never given', () => {
  for (let seed = 0; seed < 40; seed++) {
    const r = find(rounds({ decoys: 3 }, 2, seed), '¿Dónde vives?');
    assert.deepEqual(r.answer, ['¿', 'Dónde', 'vives', '?']);
    assert.equal(r.tiles.filter((t) => t.decoy).length, 3);
    assert.ok(r.decoys.some((d) => d.text === 'vivo'));
    for (const d of r.decoys) assert.ok(!r.answer.includes(d.text));
    assert.notDeepEqual(r.tiles.filter((t) => !t.decoy).map((t) => t.text), r.answer);
  }
  const r = find(rounds({}, 2), '¿Dónde vives?');
  assert.equal(arch.judge(r, r.answer).correct, true);
  assert.deepEqual(textsOf(r, tilesFor(r, ['¿', 'Dónde'])), ['¿', 'Dónde']);
});

test('judge: exact, accept order, accents, marks, order, typed strings', () => {
  const r = find(rounds({}, 3), '¿Cuántos gatos tiene tu hermano?');
  assert.equal(arch.judge(r, '¿Cuántos gatos tiene tu hermano?').correct, true);
  assert.equal(arch.judge(r, '¿Cuántos tiene tu hermano gatos?').correct, true);
  assert.match(arch.judge(r, '¿Cuantos gatos tiene tu hermano?').feedback.es, /tildes/);
  assert.match(arch.judge(r, '¿cuántos gatos tiene tu hermano?').feedback.es, /tildes|mayúsculas/);
  assert.match(arch.judge(r, 'Cuántos gatos tiene tu hermano').feedback.es, /signos/);
  assert.match(arch.judge(r, ['¿', 'Cuántos', 'tiene', 'gatos', 'tu', 'hermano', '?']).feedback.es, /orden/);
  assert.match(arch.judge(r, '___no').feedback.es, /Casi/);
  assert.equal(arch.judge(r, '___no').correct, false);
});

test('hint: choice drops a wrong option; tiles/type keep the question word; level 2 shows the question', () => {
  const c = find(rounds({}, 1), '¿Por qué llegas tarde?');
  const wrongText = c.options.find((o) => !o.ok).text;
  const h = arch.hint(c, 1, wrongText);
  assert.ok(!c.options[h.remove].ok && c.options[h.remove].text !== wrongText);
  const t = find(rounds({}, 2), '¿Por qué llegas tarde?');
  const h1 = arch.hint(t, 1, ['¿', 'Dónde']);
  assert.deepEqual(h1.prefix, ['¿', 'Por']);
  assert.equal(arch.hint(t, 1, ['¿', 'Por', 'qué', 'tarde']).keep, 3);
  assert.equal(arch.hint(t, 2).text, '¿Por qué llegas tarde?');
  assert.equal(arch.hint(t, 1, '').text, '¿Por');
});

test('session: the real scoring rules apply to each build', async () => {
  const content = await loadRealContent({ includeDev: true });
  for (const build of ['choice', 'tiles', 'type']) {
    const unit = { ...content.units[0], id: 'qm-test', rev: 1, pass: { minCorrect: 1 }, exercises: [{ id: 'q', archetype: 'question-maker', difficulty: 1, params: { items: ITEMS, build, n: 1 } }] };
    const s = createUnitSession({ unit, content, seed: 3 });
    assert.equal(s.submit('___no').action, 'hint');
    assert.equal(s.submit('___no').action, 'reveal');
    const r = s.current.round;
    assert.equal(s.submit(r.es).correct, true, build);
  }
});
