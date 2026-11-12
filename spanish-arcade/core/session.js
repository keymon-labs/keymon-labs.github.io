// Runs one unit: exercises -> rounds, retries (hint after 1 miss, reveal after 2), stars, resume. Pure, no DOM.
// Idea from maths-arcade/core/session.js; rules in PLAN §4.3 and §5.
import { createRng } from '../../shared/rng.js';
import { makeExercise, seedFor, shuffle } from './generate.js';

export const HINT_AFTER = 1;
export const REVEAL_AFTER = 2;
export const LEG_SIZE = 3; // exercises per leg (tramo); a "parada" screen follows each leg that is not the last
const COOL_DOWN = new Set(['match-pairs', 'odd-one-out']); // lightest archetypes: the unit ends on one when its last band has one

/**
 * ENGAGEMENT §3.1: exercise ids in play order. Difficulty bands stay in order; inside a band the free exercises are
 * shuffled with the seed (same seed, same order); `pin: true` keeps an exercise at its slot; the last slot prefers a
 * cool-down archetype; of 30 shuffles the one with fewest same-archetype neighbours wins (0 when the bands allow).
 */
export function orderExercises(unit, seed) {
  const rng = createRng(seedFor(seed, 'order'));
  const bands = [...new Set(unit.exercises.map((e) => e.difficulty))].sort((a, b) => a - b);
  const clashes = (list) => list.filter((e, i) => i && e.archetype === list[i - 1].archetype).length;
  let best = null;
  for (let tries = 0; tries < 30 && (best === null || clashes(best) > 0); tries++) {
    const out = [];
    bands.forEach((band, b) => {
      const items = unit.exercises.filter((e) => e.difficulty === band);
      const free = shuffle(items.filter((e) => !e.pin), rng);
      const cool = free.findIndex((e) => COOL_DOWN.has(e.archetype));
      if (b === bands.length - 1 && !items.at(-1).pin && cool >= 0) free.push(...free.splice(cool, 1));
      out.push(...items.map((e) => (e.pin ? e : free.shift())));
    });
    if (best === null || clashes(out) < clashes(best)) best = out;
  }
  return best.map((e) => e.id);
}

/** PLAN §5. 3: no reveals and at most 1 hint. 2: at least minCorrect exercises without a reveal. 1: finished. */
export function starsFor({ hints, reveals, correct, minCorrect }) {
  if (reveals === 0 && hints <= 1) return 3;
  if (correct >= minCorrect) return 2;
  return 1;
}

const blank = () => ({ correct: 0, total: 0, tries: 0, hints: 0, reveals: 0 });

/**
 * resume: a snapshot() saved as profile.inProgress; ignored if it is for another unit or rev.
 * Each exercise has its own rng (seed + its index in unit.exercises), so resuming never needs to replay earlier rounds.
 * s.order = exercise ids in play order; exerciseIndex is a position in it. A snapshot without `order` (saved before
 * task 031) was played in unit order, so it gets the identity order.
 */
export function createUnitSession({ unit, content, seed, resume = null }) {
  const ok = resume && resume.unitId === unit.id && resume.rev === unit.rev;
  const s = ok ? structuredClone(resume)
    : { unitId: unit.id, rev: unit.rev, seed, exerciseIndex: 0, roundIndex: 0, misses: 0, results: {}, words: {} };
  const ids = unit.exercises.map((e) => e.id);
  if (!(Array.isArray(s.order) && s.order.length === ids.length && ids.every((id) => s.order.includes(id)))) s.order = ok ? ids : orderExercises(unit, s.seed);
  let ex = null;
  // An exercise that makes 0 rounds (words missing from the content) is skipped, never shown: mount always gets a round.
  const load = () => {
    ex = null;
    while (!ex && s.exerciseIndex < s.order.length) {
      const at = ids.indexOf(s.order[s.exerciseIndex]);
      const made = makeExercise(content, unit, at, createRng(seedFor(s.seed, at)));
      if (made.rounds.length) ex = made;
      else { console.warn(`unit ${unit.id}: exercise "${made.exercise.id}" makes 0 rounds, skipped`); s.exerciseIndex++; s.roundIndex = 0; s.misses = 0; }
    }
    if (ex) s.results[ex.exercise.id] ??= blank();
  };
  load();

  // After a finished round: next round, or next exercise (exerciseDone = its stats, to store at once), or the end.
  function advance() {
    s.misses = 0;
    s.roundIndex++;
    let exerciseDone, legDone = false;
    if (s.roundIndex >= ex.rounds.length) {
      exerciseDone = { id: ex.exercise.id, stats: structuredClone(s.results[ex.exercise.id]) };
      legDone = (s.exerciseIndex + 1) % LEG_SIZE === 0;
      s.exerciseIndex++; s.roundIndex = 0; load();
    }
    return { done: ex === null, ...(exerciseDone && { exerciseDone }), ...(legDone && ex && { legDone }) };
  }

  const session = {
    get done() { return ex === null; },
    /** Exercise ids in play order. */
    get order() { return [...s.order]; },
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
        // retry repeats the level-2 reveal: after a reload misses is already 2, so the mount may never have shown it
        const out = { correct, feedback, action, done: false, hint: ex.archetype.hint(round, Math.min(s.misses, REVEAL_AFTER), answer) };
        return out;
      }
      r.total++;
      if (s.misses === 0) r.correct++;
      for (const id of round.wordIds || []) s.words[id] = { wrong: 0, ...s.words[id], seen: (s.words[id]?.seen ?? 0) + 1 };
      return { correct, feedback, action: 'next', ...advance() };
    },

    /**
     * Give up on this round: it counts like a reveal (no credit, never "without help"), is counted in stats.skipped
     * (not as misses), shows the answer through hint(round, 2) and moves on. -> { correct:false, skipped:true, action:"skip", hint, done, exerciseDone? }
     */
    skip() {
      if (!ex) throw new Error('unit already finished');
      const round = ex.rounds[s.roundIndex];
      const r = s.results[ex.exercise.id];
      r.total++;
      r.reveals++;
      r.skipped = (r.skipped ?? 0) + 1;
      for (const id of round.wordIds || []) {
        const w = s.words[id] ?? { seen: 0, wrong: 0 };
        s.words[id] = { ...w, wrong: w.wrong + (s.misses === 0 ? 1 : 0), seen: w.seen + 1 };
      }
      const hint = ex.archetype.hint(round, REVEAL_AFTER, null);
      return { correct: false, skipped: true, feedback: { es: 'Saltada.', en: 'Skipped.' }, action: 'skip', hint, ...advance() };
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
