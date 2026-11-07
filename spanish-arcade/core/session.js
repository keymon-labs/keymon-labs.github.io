// Runs one unit: exercises -> rounds, retries (hint after 1 miss, reveal after 2), stars, resume. Pure, no DOM.
// Idea from maths-arcade/core/session.js; rules in PLAN §4.3 and §5.
import { createRng } from '../../shared/rng.js';
import { makeExercise, seedFor } from './generate.js';

export const HINT_AFTER = 1;
export const REVEAL_AFTER = 2;

/** PLAN §5. 3: no reveals and at most 1 hint. 2: at least minCorrect exercises without a reveal. 1: finished. */
export function starsFor({ hints, reveals, correct, minCorrect }) {
  if (reveals === 0 && hints <= 1) return 3;
  if (correct >= minCorrect) return 2;
  return 1;
}

const blank = () => ({ correct: 0, total: 0, tries: 0, hints: 0, reveals: 0 });

/**
 * resume: a snapshot() saved as profile.inProgress; ignored if it is for another unit or rev.
 * Each exercise has its own rng (seed + index), so resuming never needs to replay earlier rounds.
 */
export function createUnitSession({ unit, content, seed, resume = null }) {
  const ok = resume && resume.unitId === unit.id && resume.rev === unit.rev;
  const s = ok ? structuredClone(resume)
    : { unitId: unit.id, rev: unit.rev, seed, exerciseIndex: 0, roundIndex: 0, misses: 0, results: {}, words: {} };
  let ex = null;
  // An exercise that makes 0 rounds (words missing from the content) is skipped, never shown: mount always gets a round.
  const load = () => {
    ex = null;
    while (!ex && s.exerciseIndex < unit.exercises.length) {
      const made = makeExercise(content, unit, s.exerciseIndex, createRng(seedFor(s.seed, s.exerciseIndex)));
      if (made.rounds.length) ex = made;
      else { console.warn(`unit ${unit.id}: exercise "${made.exercise.id}" makes 0 rounds, skipped`); s.exerciseIndex++; s.roundIndex = 0; }
    }
    if (ex) s.results[ex.exercise.id] ??= blank();
  };
  load();

  const session = {
    get done() { return ex === null; },
    get current() {
      if (!ex) return null;
      return { exerciseIndex: s.exerciseIndex, roundIndex: s.roundIndex, rounds: ex.rounds.length, round: ex.rounds[s.roundIndex],
        exercise: ex.exercise, archetype: ex.archetype, params: ex.params, misses: s.misses };
    },

    /** -> { correct, feedback, action: "next"|"hint"|"reveal"|"retry", hint?, done } */
    submit(answer) {
      if (!ex) throw new Error('unit already finished');
      const round = ex.rounds[s.roundIndex];
      const r = s.results[ex.exercise.id];
      const { correct, feedback } = ex.archetype.judge(round, answer);
      r.tries++;
      if (!correct) {
        s.misses++;
        if (s.misses === 1) for (const id of round.wordIds || []) s.words[id] = { ...(s.words[id] ?? { seen: 0, wrong: 0 }), wrong: (s.words[id]?.wrong ?? 0) + 1 };
        const action = s.misses === HINT_AFTER ? 'hint' : s.misses === REVEAL_AFTER ? 'reveal' : 'retry';
        if (action === 'hint') r.hints++;
        if (action === 'reveal') r.reveals++;
        const out = { correct, feedback, action, done: false };
        if (action !== 'retry') out.hint = ex.archetype.hint(round, s.misses, answer);
        return out;
      }
      r.total++;
      if (s.misses === 0) r.correct++;
      for (const id of round.wordIds || []) s.words[id] = { wrong: 0, ...s.words[id], seen: (s.words[id]?.seen ?? 0) + 1 };
      s.misses = 0;
      s.roundIndex++;
      if (s.roundIndex >= ex.rounds.length) { s.exerciseIndex++; s.roundIndex = 0; load(); }
      return { correct, feedback, action: 'next', done: ex === null };
    },

    /** Save as profile.inProgress (JSON-safe). */
    snapshot: () => structuredClone(s),

    /** Totals for progress.recordUnit(). correct = exercises finished without a reveal. */
    result() {
      const list = unit.exercises.map((e) => s.results[e.id] ?? blank());
      const hints = list.reduce((n, r) => n + r.hints, 0);
      const reveals = list.reduce((n, r) => n + r.reveals, 0);
      const correct = list.filter((r) => r.total > 0 && r.reveals === 0).length;
      return { unitId: unit.id, rev: unit.rev, finished: ex === null, correct, hints, reveals,
        stars: starsFor({ hints, reveals, correct, minCorrect: unit.pass.minCorrect }),
        exercises: structuredClone(s.results), words: structuredClone(s.words) };
    },
  };
  return session;
}
