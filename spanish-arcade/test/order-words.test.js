// Tests for order-words: tokenising, tiles and decoys, judge (accept lists, capitals, punctuation), hint, scoring through the session.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/rng.js';
import { resolveParams } from '../core/generate.js';
import { checkParams } from '../core/schema.js';
import { createUnitSession } from '../core/session.js';
import arch from '../archetypes/order-words/index.js';
import { tokens, tilesFor, textsOf } from '../archetypes/order-words/logic.js';
import { loadRealContent } from './helpers.js';

const rounds = (items, params = {}, seed = 1, difficulty = 1) =>
  arch.make(resolveParams(arch, { difficulty, params: { items, ...params } }), { targets: [], pool: [] }, createRng(seed)).rounds;
const one = (item, params, seed) => rounds([item], params, seed)[0];

test('tokens: glued vs separate punctuation, case and accents kept', () => {
  assert.deepEqual(tokens('¿Cómo estás?', false), ['¿Cómo', 'estás?']);
  assert.deepEqual(tokens('¿Cómo estás?', true), ['¿', 'Cómo', 'estás', '?']);
  assert.deepEqual(tokens('¡Hola,  amigo!', true), ['¡', 'Hola', ',', 'amigo', '!']);
  assert.deepEqual(tokens('  Es   lunes. ', true), ['Es', 'lunes', '.']);
});

test('same seed gives the same tiles; the shuffle is never the solved order', () => {
  const item = { es: 'Mi casa es azul.' };
  assert.deepEqual(one(item, {}, 5), one(item, {}, 5));
  for (let seed = 0; seed < 200; seed++) {
    const r = one({ es: 'Yo como pan' }, {}, seed);
    assert.notDeepEqual(r.tiles.map((t) => t.text), r.answer);
  }
  const two = one({ es: 'Sí, sí', accept: [] }, {}, 1); // repeated tokens still terminate
  assert.equal(two.tiles.length, 2);
});

test('decoys: look-alikes only, never a real token, count follows the param', () => {
  const item = { es: '¿Está la mesa aquí el lunes?' };
  for (let seed = 0; seed < 50; seed++) {
    const r = one(item, { punctuation: true, decoys: 3 }, seed);
    assert.equal(r.decoys.length, 3);
    for (const d of r.decoys) assert.ok(!r.answer.includes(d.text), d.text);
    assert.equal(r.tiles.filter((t) => t.decoy).length, 3);
  }
  const all = new Set();
  for (let seed = 0; seed < 80; seed++) one(item, { punctuation: true, decoys: 3 }, seed).decoys.forEach((d) => all.add(`${d.kind}:${d.text}`));
  for (const want of ['accent:Esta', 'case:Lunes', 'case:está', 'mark:¡', 'mark:!']) assert.ok(all.has(want) || all.has(want.replace('Esta', 'esta')), `${want} in ${[...all]}`);
  assert.equal(one(item, { decoys: 0 }).decoys.length, 0);
  // case flips only for the first word or a day/month: "mesa" never becomes "Mesa"
  assert.ok(![...all].some((x) => x.includes('Mesa')));
});

test('accent decoy only when the result differs', () => {
  const r = one({ es: 'Yo como pan' }, { decoys: 3 });
  assert.ok(r.decoys.every((d) => d.text !== 'como' && d.text !== 'pan' && d.text !== 'Yo'));
  assert.ok(r.decoys.some((d) => d.text === 'cómo') || r.decoys.some((d) => d.text === 'yo'));
});

test('judge: exact order, accept list, capitals, accents, punctuation', () => {
  const r = one({ es: 'Hoy es lunes.', accept: ['Hoy lunes es.'] }, { punctuation: true, decoys: 3 }, 2);
  assert.ok(arch.judge(r, ['Hoy', 'es', 'lunes', '.']).correct);
  assert.ok(arch.judge(r, ['Hoy', 'lunes', 'es', '.']).correct); // accepted order
  assert.ok(arch.judge(r, 'Hoy es lunes .').correct); // a string is tokenised the same way
  const bad = arch.judge(r, ['es', 'Hoy', 'lunes', '.']);
  assert.ok(!bad.correct);
  assert.match(bad.feedback.es, /cambia el orden/);
  assert.match(arch.judge(r, ['Hoy', 'es', 'lunes']).feedback.es, /Casi/);
  const cap = r.decoys.find((d) => d.kind === 'case');
  if (cap) assert.match(arch.judge(r, ['Hoy', 'es', cap.text, '.']).feedback.es, /tildes y las mayúsculas/);
});

test('judge: punctuation decoy and glued mode', () => {
  const r = one({ es: '¿Cómo estás?' }, { punctuation: true, decoys: 3 }, 3);
  const mark = r.decoys.find((d) => d.kind === 'mark');
  assert.ok(mark, 'a mark decoy exists');
  const wrong = r.answer.map((t) => (t === '¿' ? mark.text : t));
  assert.ok(!arch.judge(r, wrong).correct);
  const g = one({ es: '¿Cómo estás?' }, { punctuation: false, decoys: 0 });
  assert.deepEqual(g.answer, ['¿Cómo', 'estás?']);
  assert.ok(arch.judge(g, ['¿Cómo', 'estás?']).correct);
  assert.ok(!arch.judge(g, ['¿Cómo', 'estás']).correct);
  assert.ok(!arch.judge(g, ['¿como', 'estás?']).correct);
});

test('hint: level 1 locks the right prefix (1..n-1), level 2 reveals the sentence', () => {
  const r = one({ es: 'Mi casa es azul', accept: ['Mi casa azul es'] }, {});
  assert.deepEqual(arch.hint(r, 1, ['Mi', 'casa', 'azul', 'es']), { level: 1, keep: 3, prefix: ['Mi', 'casa', 'azul'] });
  assert.equal(arch.hint(r, 1, ['azul', 'Mi', 'casa', 'es']).keep, 1);
  assert.equal(arch.hint(r, 1, ['Mi', 'casa', 'es', 'azul']).keep, 3);
  const full = one({ es: 'Yo como pan' }, {});
  assert.equal(arch.hint(full, 1, ['Yo', 'como', 'pan']).keep, 2);
  assert.deepEqual(arch.hint(r, 2, []), { level: 2, answer: ['Mi', 'casa', 'es', 'azul'], text: 'Mi casa es azul' });
  assert.deepEqual(textsOf(r, tilesFor(r, ['Mi', 'casa'])), ['Mi', 'casa']);
});

test('make throws on bad items: 2-9 tiles, accept must use the same tiles', () => {
  assert.throws(() => rounds([{ es: 'Hola' }]), /2-9 tiles/);
  assert.throws(() => rounds([{ es: 'a b c d e f g h i j' }]), /2-9 tiles/);
  assert.throws(() => rounds([{ es: 'Hoy es lunes', accept: ['Hoy es martes'] }]), /same tiles/);
  assert.throws(() => rounds([{ es: 'Es lunes.', accept: ['Es lunes'] }], { punctuation: true }), /same tiles/);
  assert.equal(rounds([{ es: 'Uno dos' }, { es: 'Tres cuatro' }, { es: 'Cinco seis' }], { n: 2 }).length, 2);
});

test('schema, defaults by difficulty', () => {
  assert.deepEqual(checkParams(arch.paramsSchema, resolveParams(arch, { difficulty: 1, params: { items: [{ es: 'Hoy es lunes.', accept: ['Hoy lunes es.'], emoji: '📅' }] } })), []);
  assert.ok(checkParams(arch.paramsSchema, { items: [] }).length > 0);
  assert.ok(checkParams(arch.paramsSchema, { items: [{ es: 'x y', pick: 1 }] }).length > 0);
  assert.equal(arch.skill, 'grammar');
  assert.deepEqual([1, 2, 3].map((d) => arch.defaults(d)), [{ punctuation: false, decoys: 0 }, { punctuation: true, decoys: 1 }, { punctuation: true, decoys: 2 }]);
});

test('session: tapping the answer order scores; a wrong order gives a hint, then a reveal', async () => {
  const content = await loadRealContent({ includeDev: true });
  const unit = { id: 'ow-test', rev: 1, order: 99, title: { es: 'x', en: 'x' }, pass: { minCorrect: 1 },
    exercises: [{ id: 'order-demo', archetype: 'order-words', difficulty: 3, params: { items: [{ es: '¿Dónde está el gato?' }] } }] };
  const session = createUnitSession({ unit, content: { ...content, unitById: { ...content.unitById, 'ow-test': unit } }, seed: 4 });
  const { round } = session.current;
  const wrongFirst = [...round.answer].reverse();
  let r = await session.submit(wrongFirst);
  assert.equal(r.correct, false);
  assert.equal(r.action, 'hint');
  assert.ok(r.hint.keep >= 1 && r.hint.keep < round.answer.length);
  r = await session.submit(wrongFirst);
  assert.equal(r.action, 'reveal');
  assert.equal(r.hint.text, '¿Dónde está el gato?');
  r = await session.submit(round.answer);
  assert.equal(r.correct, true);
});
