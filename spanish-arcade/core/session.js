// Runs one unit: exercises -> rounds, retries (hint after 1 miss, reveal after 2), stars, resume. Pure, no DOM.
// Idea from maths-arcade/core/session.js; rules in PLAN §4.3 and §5.
import { createRng } from '../../shared/rng.js';
import { makeExercise, seedFor, shuffle } from './generate.js';

export const HINT_AFTER = 1;
export const REVEAL_AFTER = 2;
export const LEG_SIZE = 3; // exercises per leg (tramo); a "parada" screen follows each leg that is not the last
export const RUN_MAX = 3; // task 036: most rounds of one exercise in a row while another exercise of the leg still has rounds left
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

/**
 * Play order and progress of a saved attempt after the unit may have changed without a `rev` bump: keep the saved ids that
 * still exist, put new ids at the end, and count only the finished ids that survive. Finished ids = `snap.finished` while it agrees
 * with `exerciseIndex` (task 036, exercises of a leg are mixed, so they are not a prefix); older snapshots had the first `exerciseIndex` ids of `order`;
 * no `order` (saved before task 031) = unit order.
 */
export function resolveOrder(unit, snap) {
  const ids = unit.exercises.map((e) => e.id);
  const saved = Array.isArray(snap.order) ? snap.order : ids;
  const kept = saved.filter((id, i) => ids.includes(id) && saved.indexOf(id) === i);
  const order = [...kept, ...ids.filter((id) => !kept.includes(id))];
  const pos = Math.max(0, Math.min(snap.exerciseIndex ?? 0, saved.length));
  const was = Array.isArray(snap.finished) && snap.finished.length === snap.exerciseIndex ? snap.finished : saved.slice(0, pos); // a lab bumps exerciseIndex alone
  const finished = was.filter((id, i) => kept.includes(id) && was.indexOf(id) === i);
  return { order, finished, exerciseIndex: finished.length };
}

/** Can these rounds still be played without RUN_MAX+1 in a row, given the run that just ended on `last`? left = [[id, rounds]]. */
const feasible = (left, last) => {
  const sum = left.reduce((n, [, r]) => n + r, 0);
  return left.every(([id, r]) => r <= RUN_MAX * (sum - r) + (id === last ? 0 : RUN_MAX));
};

const blank = () => ({ correct: 0, total: 0, tries: 0, hints: 0, reveals: 0 });

/**
 * resume: a snapshot() saved as profile.inProgress; ignored if it is for another unit or rev.
 * Each exercise has its own rng (seed + its index in unit.exercises), so resuming never needs to replay earlier rounds.
 * s.order = exercise ids in play order; s.finished = ids of ended exercises (exerciseIndex = their count; position = where the current one sits in order). A snapshot without `order` (saved before
 * task 031) was played in unit order, so it gets the identity order.
 */
export function createUnitSession({ unit, content, seed, resume = null }) {
  const ok = resume && resume.unitId === unit.id && resume.rev === unit.rev;
  const s = ok ? structuredClone(resume)
    : { unitId: unit.id, rev: unit.rev, seed, exerciseIndex: 0, roundIndex: 0, misses: 0, results: {}, words: {} };
  const ids = unit.exercises.map((e) => e.id);
  if (ok) Object.assign(s, resolveOrder(unit, s));
  else { s.order = orderExercises(unit, s.seed); s.finished = []; }
  // Task 036: rounds of the exercises of a leg alternate in runs of at most RUN_MAX. s.run = { id, n } is the current run (n rounds
  // played in it); everything else is derived from the per-exercise round counts (s.played), so nothing replays.
  s.run ??= ok && resume.run === undefined && s.order[s.exerciseIndex] ? { id: s.order[s.exerciseIndex], n: s.roundIndex ?? 0 } : null;
  if (s.run && !ids.includes(s.run.id)) s.run = null; // the current exercise was removed without a rev bump
  // s.played[id] = rounds of that exercise already left behind. Snapshots without it (or with a roundIndex moved by hand, as the lab does) say it
  // through results[id].total and, for the current run, roundIndex.
  s.played = { ...Object.fromEntries(Object.entries(s.results).map(([id, r]) => [id, r.total])), ...(ok && resume.played) };
  if (s.run && s.roundIndex !== (s.played[s.run.id] ?? 0)) s.played[s.run.id] = s.roundIndex;
  const made = new Map();
  const build = (id) => {
    if (!made.has(id)) { const at = ids.indexOf(id); made.set(id, makeExercise(content, unit, at, createRng(seedFor(s.seed, at)))); }
    return made.get(id);
  };
  const left = (id) => build(id).rounds.length - (s.played[id] ?? 0);
  let ex = null, switched = false;
  // An exercise that makes 0 rounds (words missing from the content) is skipped, never shown: mount always gets a round.
  const load = () => {
    const before = ex?.exercise.id ?? null;
    ex = null;
    while (s.finished.length < s.order.length) {
      const todo = s.order.filter((id) => !s.finished.includes(id));
      const start = Math.floor(s.finished.length / LEG_SIZE) * LEG_SIZE;
      const leg = s.order.slice(start, start + LEG_SIZE).filter((id) => todo.includes(id));
      const inLeg = leg.length ? leg : todo.slice(0, LEG_SIZE);
      const empty = inLeg.find((id) => left(id) <= 0 && build(id).rounds.length === 0);
      if (empty) { console.warn(`unit ${unit.id}: exercise "${empty}" makes 0 rounds, skipped`); s.finished.push(empty); s.run = null; continue; }
      const cands = inLeg.filter((id) => left(id) > 0);
      if (!cands.length) { s.finished.push(...inLeg); continue; }
      const keep = s.run && cands.includes(s.run.id) && (s.run.n < RUN_MAX || cands.length === 1);
      if (!keep) {
        const from = inLeg.indexOf(s.run?.id); // next in the leg after the run, wrapping round (a run of an earlier leg: start of the leg)
        const turn = [...inLeg.slice(from + 1), ...inLeg.slice(0, from + 1)].filter((id) => cands.includes(id) && (id !== s.run?.id || cands.length === 1));
        const prev = s.run ? build(s.run.id).exercise.archetype : null;
        const ok = (id) => feasible(cands.map((c) => [c, left(c) - (c === id ? Math.min(RUN_MAX, left(c)) : 0)]), id);
        const id = [...turn.filter((c) => build(c).exercise.archetype !== prev), ...turn].find(ok)
          ?? [...turn].sort((x, y) => left(y) - left(x))[0];
        s.run = { id, n: 0 };
      }
      ex = build(s.run.id);
      break;
    }
    s.exerciseIndex = s.finished.length;
    if (ex) { s.results[ex.exercise.id] ??= blank(); s.roundIndex = s.played[ex.exercise.id] ?? 0; }
    else s.roundIndex = 0;
    switched = Boolean(ex && before && before !== ex.exercise.id);
  };
  load();

  // After a finished round: next round (same or another exercise of the leg), exerciseDone (its stats, to store at once) when an
  // exercise has no rounds left, legDone when the leg's last exercise ended, or the end.
  function advance() {
    s.misses = 0;
    s.run.n++;
    const id = ex.exercise.id;
    s.played[id] = (s.played[id] ?? 0) + 1;
    let exerciseDone, legDone = false;
    if (left(id) <= 0) {
      exerciseDone = { id, stats: structuredClone(s.results[id]) };
      s.finished.push(id);
      legDone = s.finished.length % LEG_SIZE === 0;
    }
    load();
    return { done: ex === null, ...(exerciseDone && { exerciseDone }), ...(legDone && ex && { legDone }) };
  }

  const session = {
    get done() { return ex === null; },
    /** Exercise ids in play order. */
    get order() { return [...s.order]; },
    get current() {
      if (!ex) return null;
      return { exerciseIndex: s.exerciseIndex, position: s.order.indexOf(ex.exercise.id), finished: [...s.finished], switched,
        roundIndex: s.roundIndex, rounds: ex.rounds.length, round: ex.rounds[s.roundIndex], exercise: ex.exercise, archetype: ex.archetype, params: ex.params, misses: s.misses };
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
