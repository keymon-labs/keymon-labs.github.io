// Unit session engine (core/session.js), driven through the placeholder archetype and the real stub unit.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUnitSession, starsFor } from '../core/session.js';
import { loadRealContent } from './helpers.js';

const content = await loadRealContent();
const unit = content.units[0];
const wrong = (round) => round.options.find((o) => o.id !== round.answer).id;

// Play the whole unit; misses(exIndex, roundIndex) says how many wrong answers to give first.
function play(session, misses = () => 0) {
  const actions = [];
  while (!session.done) {
    const { exerciseIndex, roundIndex, round } = session.current;
    for (let i = 0; i < misses(exerciseIndex, roundIndex); i++) actions.push(session.submit(wrong(round)));
    actions.push(session.submit(round.answer));
  }
  return actions;
}

test('real units, vocab and archetypes load without errors', () => {
  assert.deepEqual(content.errors, []);
  assert.ok(content.units.length >= 1 && content.archetypeById.placeholder);
});

test('a perfect run gives 3 stars and counts rounds', () => {
  const s = createUnitSession({ unit, content, seed: 1 });
  const actions = play(s);
  assert.ok(actions.every((a) => a.correct && a.action === 'next'));
  assert.equal(actions.at(-1).done, true);
  const r = s.result();
  assert.equal(r.stars, 3);
  assert.equal(r.correct, unit.exercises.length);
  for (const ex of unit.exercises) {
    const st = r.exercises[ex.id];
    assert.ok(st.total > 0);
    assert.deepEqual({ ...st, total: 0 }, { correct: st.total, total: 0, tries: st.total, hints: 0, reveals: 0 });
  }
  assert.ok(Object.values(r.words).every((w) => w.seen >= 1 && w.wrong === 0));
});

test('miss 1 gives a hint, miss 2 reveals, then retry until correct', () => {
  const s = createUnitSession({ unit, content, seed: 2 });
  const { round } = s.current;
  const a1 = s.submit(wrong(round)), a2 = s.submit(wrong(round)), a3 = s.submit(wrong(round));
  assert.deepEqual([a1.action, a2.action, a3.action], ['hint', 'reveal', 'retry']);
  assert.equal(a1.hint.level, 1);
  assert.equal(a2.hint.level, 2);
  assert.equal(a2.hint.answer, round.answer);
  assert.equal(a1.correct, false);
  assert.ok(a1.feedback.es && a1.feedback.en);
  assert.equal(s.current.roundIndex, 0);
  assert.equal(s.submit(round.answer).action, 'next');
  assert.equal(s.current.roundIndex, 1);
});

test('stars follow PLAN §5', () => {
  assert.equal(starsFor({ hints: 1, reveals: 0, correct: 5, minCorrect: 4 }), 3);
  assert.equal(starsFor({ hints: 2, reveals: 0, correct: 5, minCorrect: 4 }), 2);
  assert.equal(starsFor({ hints: 0, reveals: 1, correct: 4, minCorrect: 4 }), 2);
  assert.equal(starsFor({ hints: 0, reveals: 2, correct: 3, minCorrect: 4 }), 1);

  const oneHint = createUnitSession({ unit, content, seed: 3 });
  play(oneHint, (e, r) => (e === 0 && r === 0 ? 1 : 0));
  assert.equal(oneHint.result().stars, 3);

  const reveals = createUnitSession({ unit, content, seed: 3 });
  play(reveals, (e, r) => (e < 2 && r === 0 ? 2 : 0));
  const res = reveals.result();
  assert.equal(res.correct, unit.exercises.length - 2);
  assert.equal(res.stars, unit.exercises.length - 2 >= unit.pass.minCorrect ? 2 : 1);
  assert.equal(res.exercises[unit.exercises[0].id].reveals, 1);
  assert.ok(Object.values(res.words).some((w) => w.wrong > 0));
});

test('the same seed gives the same rounds; another seed differs', () => {
  const rounds = (seed) => { const s = createUnitSession({ unit, content, seed }); const out = []; while (!s.done) { out.push(s.current.round); s.submit(s.current.round.answer); } return out; };
  assert.deepEqual(rounds(7), rounds(7));
  assert.notDeepEqual(rounds(7), rounds(8));
});

test('resume from a snapshot continues where it stopped', () => {
  const a = createUnitSession({ unit, content, seed: 9 });
  a.submit(wrong(a.current.round)); a.submit(a.current.round.answer);
  while (a.current.exerciseIndex < 2) a.submit(a.current.round.answer);
  a.submit(a.current.round.answer);
  const snap = JSON.parse(JSON.stringify(a.snapshot()));
  assert.deepEqual(Object.keys(snap).sort(), ['exerciseIndex', 'misses', 'results', 'rev', 'roundIndex', 'seed', 'unitId', 'words']);
  const b = createUnitSession({ unit, content, seed: 0, resume: snap });
  assert.deepEqual(b.current.round, a.current.round);
  play(a); play(b);
  assert.deepEqual(b.result(), a.result());
  assert.throws(() => a.submit('x'), /finished/);
});

test('a snapshot from another rev is ignored', () => {
  const a = createUnitSession({ unit, content, seed: 9 });
  a.submit(a.current.round.answer);
  const s = createUnitSession({ unit, content, seed: 9, resume: { ...a.snapshot(), rev: unit.rev + 1 } });
  assert.equal(s.current.roundIndex, 0);
});

test('an exercise that makes 0 rounds is skipped with a warning; mount never sees an undefined round', () => {
  const warn = console.warn; const logs = []; console.warn = (m) => logs.push(m);
  try {
    const empty = { ...unit, exercises: [{ ...unit.exercises[0], id: 'empty-one', params: { from: { tag: 'no-such-tag', n: 3 } } }, ...unit.exercises.slice(1)] };
    const s = createUnitSession({ unit: empty, content, seed: 1 });
    assert.ok(s.current.round);
    assert.equal(s.current.exercise.id, unit.exercises[1].id);
    assert.ok(logs.some((m) => /empty-one/.test(m)));
    while (!s.done) { assert.ok(s.current.round); s.submit(s.current.round.answer); }
    assert.equal(s.result().finished, true);
    const none = createUnitSession({ unit: { ...unit, exercises: empty.exercises.slice(0, 1) }, content, seed: 1 });
    assert.equal(none.done, true);
    assert.equal(none.current, null);
  } finally { console.warn = warn; }
});
