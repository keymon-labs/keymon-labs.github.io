// Unit session engine (core/session.js), driven through the placeholder archetype and the real stub unit.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUnitSession, starsFor, orderExercises, LEG_SIZE } from '../core/session.js';
import { loadRealContent } from './helpers.js';

const content = await loadRealContent();
const unit = content.units[0];
const inOrder = { ...unit, exercises: unit.exercises.map((e) => ({ ...e, pin: true })) }; // pinned: exercises play in file order
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
  const s = createUnitSession({ unit: inOrder, content, seed: 2 });
  const { round } = s.current;
  const a1 = s.submit(wrong(round)), a2 = s.submit(wrong(round)), a3 = s.submit(wrong(round));
  assert.deepEqual([a1.action, a2.action, a3.action], ['hint', 'reveal', 'retry']);
  assert.equal(a1.hint.level, 1);
  assert.equal(a2.hint.level, 2);
  assert.equal(a2.hint.answer, round.answer);
  assert.deepEqual(a3.hint, a2.hint); // retry repeats the reveal (a resumed round has misses 2)
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
  assert.deepEqual(Object.keys(snap).sort(), ['exerciseIndex', 'finished', 'misses', 'order', 'played', 'results', 'rev', 'roundIndex', 'run', 'seed', 'unitId', 'words']);
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
    assert.notEqual(s.current.exercise.id, 'empty-one');
    assert.ok(logs.some((m) => /empty-one/.test(m)));
    while (!s.done) { assert.ok(s.current.round); s.submit(s.current.round.answer); }
    assert.equal(s.result().finished, true);
    const none = createUnitSession({ unit: { ...unit, exercises: empty.exercises.slice(0, 1) }, content, seed: 1 });
    assert.equal(none.done, true);
    assert.equal(none.current, null);
  } finally { console.warn = warn; }
});

test('skip counts like a reveal: no credit, stats.skipped, not two misses, answer shown through hint level 2', () => {
  const s = createUnitSession({ unit, content, seed: 3 });
  const first = s.current.round;
  const r = s.skip();
  assert.equal(r.action, 'skip');
  assert.equal(r.correct, false);
  assert.equal(r.skipped, true);
  assert.deepEqual(r.hint, { level: 2, answer: first.answer });
  assert.equal(s.current.roundIndex, 1);
  assert.equal(s.current.misses, 0);
  const st = s.result().exercises[unit.exercises[0].id];
  assert.deepEqual([st.skipped, st.reveals, st.hints, st.correct, st.total], [1, 1, 0, 0, 1]);
  assert.equal(s.result().words[first.wordIds[0]].wrong, 1);
  assert.equal(s.result().words[first.wordIds[0]].seen, 1);
});

test('a skipped round never counts as "without a reveal" and never gives 3 stars', () => {
  const s = createUnitSession({ unit, content, seed: 4 });
  s.skip();
  while (!s.done) s.submit(s.current.round.answer);
  const r = s.result();
  assert.equal(r.finished, true);
  assert.equal(r.correct, unit.exercises.length - 1); // the exercise with the skip does not count
  assert.notEqual(r.stars, 3);
});

test('skip after a miss does not count the word wrong twice; the last round still finishes the unit', () => {
  const s = createUnitSession({ unit, content, seed: 5 });
  const { round } = s.current;
  s.submit(wrong(round));
  s.skip();
  assert.equal(s.result().words[round.wordIds[0]].wrong, 1);
  let last;
  while (!s.done) {
    const c = s.current;
    last = c.exerciseIndex === unit.exercises.length - 1 && c.roundIndex === c.rounds - 1 ? s.skip() : s.submit(c.round.answer);
  }
  assert.equal(last.done, true);
  assert.equal(s.result().finished, true);
  assert.throws(() => s.skip(), /finished/);
});

test('submit and skip report exerciseDone when an exercise ends, with its stats', () => {
  const s = createUnitSession({ unit, content, seed: 6 });
  const seen = [];
  while (!s.done) {
    const c = s.current;
    const r = c.roundIndex === c.rounds - 1 && c.exerciseIndex === 1 ? s.skip() : s.submit(c.round.answer);
    if (r.exerciseDone) seen.push(r.exerciseDone);
  }
  assert.deepEqual(seen.map((d) => d.id), s.order);
  assert.equal(seen[0].stats.reveals, 0);
  assert.equal(seen[1].stats.skipped, 1);
});

test('a resumed snapshot keeps skips', () => {
  const a = createUnitSession({ unit: inOrder, content, seed: 7 });
  a.skip();
  const b = createUnitSession({ unit: inOrder, content, seed: 7, resume: a.snapshot() });
  assert.equal(b.current.roundIndex, 1);
  assert.equal(b.result().exercises[unit.exercises[0].id].skipped, 1);
});

// --- task 031: order and legs ---
const ex = (id, archetype, difficulty, extra = {}) => ({ id, archetype, difficulty, ...extra });
const fake = (exercises) => ({ ...unit, exercises });
const mix = fake([ex('a', 'listen-pick-word', 1), ex('b', 'spell-tiles', 1), ex('c', 'read-answer', 2), ex('d', 'spell-fill-letters', 2),
  ex('e', 'spell-fill-letters', 2), ex('f', 'match-pairs', 2), ex('g', 'odd-one-out', 3)]);
const arch = (u, order) => order.map((id) => u.exercises.find((e) => e.id === id).archetype);

test('orderExercises: same seed same order, another seed can differ, a permutation, bands stay in order', () => {
  const seen = new Set();
  for (let seed = 0; seed < 40; seed++) {
    const o = orderExercises(mix, seed);
    assert.deepEqual(o, orderExercises(mix, seed));
    assert.deepEqual([...o].sort(), mix.exercises.map((e) => e.id).sort());
    assert.deepEqual(o.map((id) => mix.exercises.find((e) => e.id === id).difficulty), [1, 1, 2, 2, 2, 2, 3]);
    seen.add(o.join());
  }
  assert.ok(seen.size > 5);
});

test('orderExercises: no same archetype twice in a row when the bands allow, last exercise is a cool-down', () => {
  for (let seed = 0; seed < 40; seed++) {
    const a = arch(mix, orderExercises(mix, seed));
    a.forEach((x, i) => assert.notEqual(x, a[i - 1], `seed ${seed}: ${a}`));
  }
  const band2 = fake(mix.exercises.filter((e) => e.difficulty === 2));
  for (let seed = 0; seed < 40; seed++) assert.ok(['match-pairs', 'odd-one-out'].includes(arch(band2, orderExercises(band2, seed)).at(-1)));
});

test('orderExercises: pin keeps an exercise at its slot in its band', () => {
  const pinned = fake(mix.exercises.map((e) => (e.id === 'c' ? { ...e, pin: true } : e)));
  for (let seed = 0; seed < 40; seed++) assert.equal(orderExercises(pinned, seed)[2], 'c');
  const all = fake(mix.exercises.map((e) => ({ ...e, pin: true })));
  assert.deepEqual(orderExercises(all, 5), all.exercises.map((e) => e.id));
});

test('real unit: sessions play every exercise once, in the session order, with one leg end after exercise 3', () => {
  const s = createUnitSession({ unit, content, seed: 11 });
  assert.deepEqual([...s.order].sort(), unit.exercises.map((e) => e.id).sort());
  const played = [], legs = [];
  while (!s.done) {
    const c = s.current;
    if (!played.includes(c.exercise.id)) played.push(c.exercise.id);
    const r = s.submit(c.round.answer);
    if (r.legDone) legs.push(c.exerciseIndex);
  }
  assert.deepEqual(played, s.order);
  assert.deepEqual(legs, unit.exercises.length > LEG_SIZE ? [LEG_SIZE - 1] : []);
});

test('a snapshot saved before 031 (no order) loads in unit order and finishes', () => {
  const old = { unitId: unit.id, rev: unit.rev, seed: 9, exerciseIndex: 2, roundIndex: 0, misses: 0,
    results: { [unit.exercises[0].id]: { correct: 4, total: 4, tries: 4, hints: 0, reveals: 0 }, [unit.exercises[1].id]: { correct: 4, total: 4, tries: 4, hints: 0, reveals: 0 } },
    words: {} };
  const s = createUnitSession({ unit, content, seed: 0, resume: structuredClone(old) });
  assert.deepEqual(s.order, unit.exercises.map((e) => e.id));
  assert.equal(s.current.exercise.id, unit.exercises[2].id);
  assert.equal(s.current.roundIndex, 0);
  play(s);
  assert.equal(s.result().finished, true);
  assert.equal(s.snapshot().order.length, unit.exercises.length);
});

test('a new snapshot resumes in the same order even for another seed argument; a bad order falls back to unit order', () => {
  const a = createUnitSession({ unit, content, seed: 21 });
  a.submit(a.current.round.answer);
  const b = createUnitSession({ unit, content, seed: 0, resume: a.snapshot() });
  assert.deepEqual(b.order, a.order);
  const bad = createUnitSession({ unit, content, seed: 0, resume: { ...a.snapshot(), order: ['nope'] } });
  assert.deepEqual(bad.order, unit.exercises.map((e) => e.id));
});

test('resolveOrder keeps a saved attempt consistent when the unit changed without a rev bump', async () => {
  const { resolveOrder } = await import('../core/session.js');
  const unit = { exercises: [{ id: 'a' }, { id: 'b' }, { id: 'd' }, { id: 'e' }] }; // c was removed, e was added
  const r = resolveOrder(unit, { order: ['b', 'c', 'a', 'd'], exerciseIndex: 2 });
  assert.deepEqual(r.order, ['b', 'a', 'd', 'e']);
  assert.equal(r.exerciseIndex, 1); // b done, c vanished
  assert.deepEqual(resolveOrder(unit, { exerciseIndex: 2 }).order, ['a', 'b', 'd', 'e']); // old snapshot: unit order
  assert.deepEqual(resolveOrder(unit, { order: 'junk', exerciseIndex: 99 }).order, ['a', 'b', 'd', 'e']);
});

// --- task 036: runs of at most RUN_MAX rounds, alternating the exercises of a leg ---
const p2 = { ...content.archetypeById.placeholder, id: 'placeholder-b' }; // a second archetype id with the same behaviour
const mixContent = { ...content, archetypeById: { ...content.archetypeById, 'placeholder-b': p2 } };
const rx = (id, n, difficulty = 1, extra = {}) => ({ id, archetype: extra.archetype ?? 'placeholder', difficulty, params: { from: { n } }, prompt: { es: id, en: id }, ...extra });
const mixUnit = (exercises) => ({ ...unit, exercises });
// Plays a whole unit with right answers; -> [{ id, switched, roundIndex, legDone }] one row per round.
function trace(session) {
  const rows = [];
  while (!session.done) {
    const c = session.current;
    const r = session.submit(c.round.answer);
    rows.push({ id: c.exercise.id, switched: c.switched, roundIndex: c.roundIndex, legDone: Boolean(r.legDone), exerciseDone: r.exerciseDone?.id });
  }
  return rows;
}
const maxRun = (ids) => ids.reduce((m, id, i) => { const n = i && ids[i - 1] === id ? m.n + 1 : 1; return { n, max: Math.max(m.max, n) }; }, { n: 0, max: 0 }).max;

test('a leg alternates its exercises in runs of at most 3 (A3 B3 C3 A2 B2 C2) and every round is played once', () => {
  const u = mixUnit([rx('a', 5, 1, { pin: true }), rx('b', 5, 1, { pin: true }), rx('c', 5, 1, { pin: true })]);
  const s = createUnitSession({ unit: u, content: mixContent, seed: 1 });
  const rows = trace(s);
  assert.equal(rows.map((r) => r.id).join(''), 'aaabbbcccaabbcc');
  for (const id of 'abc') assert.deepEqual(rows.filter((r) => r.id === id).map((r) => r.roundIndex), [0, 1, 2, 3, 4]); // each round once, in order
  assert.deepEqual(rows.filter((r) => r.switched).map((r) => r.id).join(''), 'bcabc'); // switch flag exactly when the game changes
  assert.equal(s.result().correct, 3);
});

test('uneven exercises never run more than 3 in a row while another has rounds left; stats stay per exercise', () => {
  const u = mixUnit([rx('a', 7, 1, { pin: true }), rx('b', 5, 1, { pin: true }), rx('c', 6, 1, { pin: true }), rx('d', 4, 2, { pin: true }), rx('e', 3, 2, { pin: true })]);
  for (const seed of [1, 2, 3]) {
    const s = createUnitSession({ unit: u, content: mixContent, seed });
    const rows = trace(s);
    const n = (id) => rows.filter((r) => r.id === id).length;
    assert.deepEqual(['a', 'b', 'c', 'd', 'e'].map(n), [7, 5, 6, 4, 3]);
    assert.ok(maxRun(rows.map((r) => r.id)) <= 3, rows.map((r) => r.id).join(''));
    const leg1 = rows.slice(0, 18).map((r) => r.id).join('');
    assert.ok(/^[abc]+$/.test(leg1), 'leg 1 finishes before leg 2 starts');
    assert.equal(rows.filter((r) => r.legDone).length, 1);
    assert.equal(rows.filter((r) => r.legDone)[0].id, rows[17].id);
    const res = s.result();
    for (const [id, total] of [['a', 7], ['b', 5], ['c', 6], ['d', 4], ['e', 3]]) assert.equal(res.exercises[id].total, total);
    assert.equal(res.stars, 3);
  }
});

test('exerciseDone fires once per exercise, at its last round, with that exercise only', () => {
  const u = mixUnit([rx('a', 5, 1, { pin: true }), rx('b', 4, 1, { pin: true }), rx('c', 5, 1, { pin: true })]);
  const rows = trace(createUnitSession({ unit: u, content: mixContent, seed: 4 }));
  const done = rows.filter((r) => r.exerciseDone);
  assert.deepEqual(done.map((r) => r.exerciseDone).sort(), ['a', 'b', 'c']);
  for (const r of done) assert.equal(r.id, r.exerciseDone);
  assert.equal(rows.at(-1).exerciseDone !== undefined, true);
});

test('when the order leaves a clash between exercises of one archetype, the switch avoids it where it can', () => {
  const u = mixUnit([rx('a', 4, 1, { pin: true }), rx('b', 4, 1, { pin: true, archetype: 'placeholder-b' }), rx('c', 4, 1, { pin: true })]);
  const rows = trace(createUnitSession({ unit: u, content: mixContent, seed: 2 }));
  const arch = (id) => (id === 'b' ? 'B' : 'A');
  const ids = rows.map((r) => r.id).join('');
  assert.equal(ids.slice(0, 9), 'aaabbbccc'); // first runs: a b c
  assert.equal(arch(ids[9]), 'B'); // after c (A) the cycle would give a (A): the engine takes b (B) first
  assert.ok([...ids.slice(0, 11)].every((id, i) => !i || arch(id) !== arch(ids[i - 1]) || id === ids[i - 1]), ids); // no switch onto the same archetype while a B round is left
});

test('resume in the middle of a run and of a leg continues the same sequence, mid-run and across a leg end', () => {
  const u = mixUnit([rx('a', 5, 1, { pin: true }), rx('b', 5, 1, { pin: true }), rx('c', 5, 1, { pin: true }), rx('d', 4, 2, { pin: true }), rx('e', 4, 2, { pin: true })]);
  const full = trace(createUnitSession({ unit: u, content: mixContent, seed: 5 })).map((r) => r.id).join('');
  for (const cut of [1, 2, 3, 7, 10, 14, 15, 16, 21]) {
    const a = createUnitSession({ unit: u, content: mixContent, seed: 5 });
    const head = [];
    for (let i = 0; i < cut; i++) { head.push(a.current.exercise.id); a.submit(a.current.round.answer); }
    const b = createUnitSession({ unit: u, content: mixContent, seed: 0, resume: JSON.parse(JSON.stringify(a.snapshot())) });
    assert.deepEqual(b.current.round, a.current.round);
    assert.equal(head.join('') + trace(b).map((r) => r.id).join(''), full, `cut ${cut}`);
    trace(a);
    assert.deepEqual(b.result(), a.result());
  }
});

test('a resume after a miss keeps misses and the run', () => {
  const u = mixUnit([rx('a', 5, 1, { pin: true }), rx('b', 5, 1, { pin: true })]);
  const a = createUnitSession({ unit: u, content: mixContent, seed: 1 });
  a.submit(a.current.round.answer); a.submit(wrong(a.current.round));
  const b = createUnitSession({ unit: u, content: mixContent, seed: 1, resume: a.snapshot() });
  assert.equal(b.current.misses, 1);
  assert.equal(b.current.exercise.id, 'a');
  assert.equal(b.current.roundIndex, 1);
});

test('snapshot fixture saved before task 036 (no finished, run, played) loads and plays on', async () => {
  const { readFileSync } = await import('node:fs');
  const fx = JSON.parse(readFileSync(new URL('./fixtures/snapshot-pre-036.json', import.meta.url), 'utf8')).snapshot;
  const u = mixUnit([rx('a', 5, 1, { pin: true }), rx('b', 5, 1, { pin: true }), rx('c', 5, 1, { pin: true })]);
  const sub = { $unit: u.id, $rev: u.rev, $0: 'a', $1: 'b', $2: 'c' };
  const old = JSON.parse(JSON.stringify(fx), (k, v) => (typeof v === 'string' && v in sub ? sub[v] : v));
  for (const key of Object.keys(old.results)) if (key in sub) { old.results[sub[key]] = old.results[key]; delete old.results[key]; }
  assert.equal(old.finished, undefined);
  const s = createUnitSession({ unit: u, content: mixContent, seed: 0, resume: old });
  assert.deepEqual(s.order, ['a', 'b', 'c']);
  assert.equal(s.current.exercise.id, 'b'); // a was finished in the old order; b was at round 3
  assert.equal(s.current.roundIndex, 2);
  assert.equal(s.current.exerciseIndex, 1);
  const rows = trace(s);
  assert.equal(rows.map((r) => r.id).join(''), 'bcccbbcc'); // b finishes its run (it had 2 of 3), then c, then the rest of b and c
  assert.deepEqual(rows.filter((r) => r.id === 'b').map((r) => r.roundIndex), [2, 3, 4]); // b's remaining rounds once each
  assert.equal(rows.filter((r) => r.id === 'c').length, 5);
  assert.equal(rows.filter((r) => r.id === 'a').length, 0); // a stays finished
  assert.ok(maxRun(rows.map((r) => r.id)) <= 3);
  const res = s.result();
  assert.equal(res.finished, true);
  assert.equal(res.exercises.a.total, 3); // kept as saved
  assert.equal(res.exercises.b.total, 5);
  assert.deepEqual(Object.keys(s.snapshot()).sort(), ['exerciseIndex', 'finished', 'misses', 'order', 'played', 'results', 'rev', 'roundIndex', 'run', 'seed', 'unitId', 'words']);
});

test('unitProgress reads finished exercises of a mixed snapshot, and of an old one', async () => {
  const { unitProgress } = await import('../core/progress.js');
  const u = mixUnit([rx('a', 5, 1, { pin: true }), rx('b', 3, 1, { pin: true }), rx('c', 5, 1, { pin: true })]);
  const s = createUnitSession({ unit: u, content: mixContent, seed: 1 });
  while (s.current.exercise.id !== 'a' || s.current.roundIndex < 3) s.submit(s.current.round.answer); // a3 b3(done) c3 then a again
  const prof = { id: 'p', units: {}, inProgress: s.snapshot() };
  const rows = unitProgress(prof, u).rows;
  assert.deepEqual(rows.map((r) => r.done), [false, true, false]); // b is done though a, before it, is not
  const old = { ...s.snapshot() }; delete old.finished; delete old.run; delete old.played; old.exerciseIndex = 1;
  assert.deepEqual(unitProgress({ ...prof, inProgress: old }, u).rows.map((r) => r.done), [true, false, false]);
});

test('resume when the current exercise was removed without a rev bump does not throw (Opus review of 036)', () => {
  const full = mixUnit([rx('a', 5, 1, { pin: true }), rx('b', 5, 1, { pin: true }), rx('c', 5, 1, { pin: true })]);
  const s = createUnitSession({ unit: full, content: mixContent, seed: 1 });
  s.submit(s.current.round.answer); s.submit(s.current.round.answer); // two rounds into a's run
  const snap = JSON.parse(JSON.stringify(s.snapshot()));
  const cut = { ...full, exercises: full.exercises.filter((e) => e.id !== 'a') };
  const b = createUnitSession({ unit: cut, content: mixContent, seed: 1, resume: snap });
  const ids = trace(b).map((r) => r.id);
  assert.equal(ids.length, 10);
  assert.ok(!ids.includes('a'));
});
