// Tests for paragraph-editor: authoring checks, rounds per mistake, free fixing order, judging, hints, determinism, whole unit through the session.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/rng.js';
import { resolveParams } from '../core/generate.js';
import { checkParams } from '../core/schema.js';
import pe from '../archetypes/paragraph-editor/index.js';
import { checkText, variants, sentenceOf, kindsLabel, countLabel, remaining } from '../archetypes/paragraph-editor/logic.js';
import { createUnitSession } from '../core/session.js';
import { loadRealContent } from './helpers.js';

const TEXT = {
  text: 'Ayer fuimos al río con mis tíos. El agua estaba muy fría y las piedras eran resbaladizas. ¿Quién quiere volver mañana?',
  errors: [{ at: 17, as: 'Quién', kind: 'punctuation' }, { at: 3, as: 'rio', kind: 'accent' }, { at: 16, as: 'resbaladizos.', kind: 'agreement' }],
};
const run = (params = {}, diff = 1, seed = 1) => pe.make(resolveParams(pe, { difficulty: diff, params: { texts: [TEXT], ...params } }), { targets: [], pool: [] }, createRng(seed)).rounds;
const fixOf = (r, e, fixed) => ({ at: e.at, fix: e.right, fixed });

test('schema accepts the sample and rejects unknown fields; defaults follow difficulty', () => {
  assert.deepEqual(checkParams(pe.paramsSchema, resolveParams(pe, { difficulty: 2, params: { texts: [TEXT] } })), []);
  assert.ok(checkParams(pe.paramsSchema, { texts: [{ text: 'a', errors: [{ at: 0, as: 'b', color: 1 }] }] }).length);
  assert.ok(checkParams(pe.paramsSchema, { texts: [{ text: 'a', errors: [] }] }).length > 0); // the schema needs 1+ errors
  assert.deepEqual(pe.defaults(1), { fix: 'choice', showCount: true, showKind: true, allowPerfect: false });
  assert.deepEqual(pe.defaults(3), { fix: 'type', showCount: false, showKind: false, allowPerfect: true });
});

test('checkText: at in range, as differs and is one word, 1-6 distinct errors', () => {
  assert.equal(checkText(TEXT), null);
  assert.match(checkText({ ...TEXT, errors: [] }), /at least 1/);
  assert.match(checkText({ ...TEXT, errors: [{ at: 99, as: 'x' }] }), /at must be/);
  assert.match(checkText({ ...TEXT, errors: [{ at: 3, as: 'río' }] }), /same/);
  assert.match(checkText({ ...TEXT, errors: [{ at: 3, as: 'rio' }, { at: 3, as: 'riu' }] }), /two errors/);
  assert.match(checkText({ ...TEXT, errors: [{ at: 3, as: 'a b' }] }), /one word/);
  assert.match(checkText({ ...TEXT, errors: [{ at: 3, as: 'rio', kind: 'x' }] }), /kind/);
  assert.throws(() => run({ texts: [{ ...TEXT, errors: [] }] }), /paragraph-editor/);
});

test('one round per mistake (+1 with allowPerfect); all on the same board, errors in text order', () => {
  const rs = run();
  assert.equal(rs.length, 3);
  assert.deepEqual(rs.map((r) => r.k), [0, 1, 2]);
  assert.deepEqual(rs[0].errors.map((e) => e.at), [3, 16, 17]);
  assert.deepEqual(rs[0].words, rs[2].words);
  assert.equal(rs[0].words[3], 'rio');
  assert.equal(rs[0].words[16], 'resbaladizos.');
  assert.equal(rs[0].clean[3], 'río');
  const p = run({ allowPerfect: true });
  assert.equal(p.length, 4);
  assert.ok(p[3].finish && !p[2].finish);
});

test('choices: the right token plus other forms, never duplicates; punctuation stays in the token', () => {
  for (const seed of [1, 2, 3, 4]) for (const r of run({}, 1, seed)) for (const e of r.errors) {
    assert.ok(e.choices.includes(e.right));
    assert.equal(new Set(e.choices).size, e.choices.length);
    assert.equal(e.choices.length, 3);
  }
  const e = run()[0].errors.find((x) => x.at === 16);
  assert.equal(e.right, 'resbaladizas.');
  assert.ok(e.choices.every((c) => c.endsWith('.')));
  assert.equal(run({ fix: 'type' }, 3)[0].errors[0].choices.length, 0);
  assert.equal(run({ options: 2 })[0].errors[0].choices.length, 2);
  const alts = run({ texts: [{ ...TEXT, errors: [{ at: 3, as: 'rio', alts: ['ryo'] }] }], options: 3 })[0].errors[0].choices;
  assert.ok(alts.includes('ryo') && alts.includes('río'));
});

test('variants: lost tilde, flipped ending, case; never the right form', () => {
  assert.ok(variants('río').includes('rio'));
  assert.ok(variants('pequeño.').includes('pequeña.'));
  assert.ok(variants('¿Quién').includes('Quién'));
  assert.ok(variants('agua').includes('água'));
  for (const w of ['río', 'resbaladizas.', '¿Quién', 'él.', '¡', 'a']) assert.ok(!variants(w).includes(w));
});

test('judge: any remaining mistake may be fixed first; fixed, fine words and early "perfect" are misses', () => {
  const [r] = run();
  const last = r.errors.find((e) => e.at === 17);
  assert.equal(pe.judge(r, { at: 17, fix: last.right, fixed: [] }).correct, true);
  assert.equal(pe.judge(r, { at: 17, fix: 'Quién', fixed: [] }).correct, false);
  assert.equal(pe.judge(r, { at: 17, fix: last.right, fixed: [17] }).correct, false); // already fixed
  assert.equal(pe.judge(r, { at: 5, fix: 'x', fixed: [] }).correct, false); // a fine word
  assert.equal(pe.judge(r, { perfect: true }).correct, false);
  assert.equal(pe.judge(r, '___no').correct, false);
  assert.equal(pe.judge(r, null).correct, false);
  assert.match(pe.judge(r, { at: 3, fix: 'rio', fixed: [] }).feedback.es, /tilde|Casi/);
  assert.match(pe.judge(r, { at: 17, fix: '¿quién', fixed: [] }).feedback.es, /mayúsculas/);
  assert.match(pe.judge(r, { at: 3, fix: 'Rio', fixed: [] }).feedback.es, /Casi/);
});

test('judge without fixed assumes the first k are fixed (resume)', () => {
  const rs = run();
  const e0 = rs[0].errors[0];
  assert.equal(pe.judge(rs[1], { at: e0.at, fix: e0.right }).correct, false);
  assert.equal(pe.judge(rs[1], { at: 16, fix: 'resbaladizas.' }).correct, true);
});

test('finish round: only "perfect" is right', () => {
  const fin = run({ allowPerfect: true }, 3)[3];
  assert.equal(pe.judge(fin, { perfect: true }).correct, true);
  assert.equal(pe.judge(fin, { at: 3, fix: 'río', fixed: [3, 16, 17] }).correct, false);
  assert.equal(remaining(fin, [3, 16, 17]).length, 0);
});

test('hint 1: kind line and the correct sentence; hint 2: the right form of the word just tried', () => {
  const [r] = run();
  const h1 = pe.hint(r, 1, { at: 17, fix: 'x', fixed: [] });
  assert.equal(h1.level, 1);
  assert.equal(h1.kind, 'punctuation');
  assert.equal(h1.say, '¿Quién quiere volver mañana?');
  assert.ok(!h1.say.includes('rio') && !h1.say.includes('resbaladizos'));
  const h2 = pe.hint(r, 2, { at: 17, fixed: [] });
  assert.deepEqual([h2.at, h2.answer], [17, '¿Quién']);
  assert.equal(pe.hint(r, 2, '___no').at, 3); // no usable last answer: the first one left
  assert.equal(pe.hint(r, 1, undefined).kind, 'accent');
  assert.equal(pe.hint(run({ allowPerfect: true })[3], 1, { fixed: [3, 16, 17] }).at, -1);
});

test('sentenceOf, labels', () => {
  const w = TEXT.text.split(' ');
  assert.equal(sentenceOf(w, 3), 'Ayer fuimos al río con mis tíos.');
  assert.equal(sentenceOf(w, 16), 'El agua estaba muy fría y las piedras eran resbaladizas.');
  assert.equal(kindsLabel([{ kind: 'accent' }, { kind: 'agreement' }, { kind: 'accent' }]), '2 tildes, 1 concordancia');
  assert.equal(countLabel(1), 'Queda 1');
  assert.equal(countLabel(3), 'Quedan 3');
});

test('same seed, same rounds; the rounds are JSON-safe', () => {
  assert.deepEqual(run({}, 2, 7), run({}, 2, 7));
  assert.deepEqual(JSON.parse(JSON.stringify(run())), run());
});

test('a full text through the real session, fixing in the reverse order', async () => {
  const content = await loadRealContent();
  const unit = { ...content.units[0], id: 'pe-test', rev: 1, pass: { minCorrect: 1 }, exercises: [{ id: 'e1', archetype: 'paragraph-editor', difficulty: 3, params: { texts: [TEXT] } }] };
  const s = createUnitSession({ unit, content: { ...content, unitById: { ...content.unitById, 'pe-test': unit } }, seed: 5 });
  const fixed = [];
  for (const at of [17, 16, 3]) {
    const e = s.current.round.errors.find((x) => x.at === at);
    const r = s.submit({ at, fix: e.right, fixed: [...fixed] });
    assert.equal(r.correct, true, `fix ${at}`);
    fixed.push(at);
  }
  assert.ok(s.current.round.finish);
  assert.equal(s.submit({ at: 3, fix: 'río', fixed }).correct, false);
  assert.equal(s.submit({ perfect: true }).correct, true);
  assert.ok(s.done);
});
