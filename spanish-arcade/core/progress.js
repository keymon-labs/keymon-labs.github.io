// Progress rules on one profile (PLAN §4.4, §5). Pure: each function returns a new profile, never writes storage.
import { seedFor } from './generate.js';
import { resolveOrder } from './session.js';

export const HISTORY_MAX = 200;

/** Stats of one finished exercise plus flags: ok = finished without a reveal, bestOk = ever ok, at = when. Never loses bestOk. */
const exerciseEntry = (prev, stats, at) => {
  const ok = stats.reveals === 0;
  return { ...stats, done: true, ok, bestOk: Boolean(prev?.bestOk) || ok, at };
};

/** A unit entry that exists as soon as one exercise is done (stars 0 = attempted, not finished). */
const unitEntry = (old, unit) => old ?? { rev: unit.rev, stars: 0, bestCorrect: 0, attempts: 0, completedAt: null, exercises: {} };

/** Store one exercise as soon as it ends (session result.exerciseDone = { id, stats }), so leaving the unit loses nothing. */
export function recordExercise(profile, unit, done, at) {
  const old = unitEntry(profile.units[unit.id], unit);
  return { ...profile, units: { ...profile.units, [unit.id]: { ...old, lastAt: at,
    exercises: { ...old.exercises, [done.id]: exerciseEntry(old.exercises[done.id], done.stats, at) } } } };
}

/** Store a finished unit (result from session.result()); at = ISO time from the injected clock. */
export function recordUnit(profile, unit, result, at) {
  if (!result.finished) return profile;
  const old = profile.units[unit.id];
  const exercises = { ...old?.exercises };
  for (const [id, st] of Object.entries(result.exercises)) if (st.total > 0) exercises[id] = exerciseEntry(exercises[id], st, at);
  const words = { ...profile.words };
  for (const [id, w] of Object.entries(result.words)) {
    const prev = words[id] ?? { seen: 0, wrong: 0 };
    words[id] = { seen: prev.seen + w.seen, wrong: prev.wrong + w.wrong, lastAt: at };
  }
  const badges = profile.badges.some((b) => b.unitId === unit.id) ? profile.badges : [...profile.badges, { unitId: unit.id, earnedAt: at }];
  return {
    ...profile,
    units: { ...profile.units, [unit.id]: {
      rev: unit.rev,
      stars: Math.max(old?.stars ?? 0, result.stars),
      bestCorrect: Math.max(old?.bestCorrect ?? 0, result.correct),
      attempts: (old?.attempts ?? 0) + 1,
      completedAt: old?.completedAt ?? at,
      lastAt: at,
      last: { stars: result.stars, correct: result.correct, at }, // latest attempt, for "antes" on the result screen
      exercises, // latest attempt per exercise (+ bestOk)
    } },
    words,
    history: [...profile.history, { unitId: unit.id, at, correct: result.correct, stars: result.stars }].slice(-HISTORY_MAX),
    inProgress: null,
    badges,
  };
}

/** Units whose rev changed keep stars and badge but drop stats of exercises that no longer exist. Same object if nothing changed. */
export function applyRev(profile, units) {
  let changed = false;
  const out = { ...profile, units: { ...profile.units } };
  for (const unit of units) {
    const u = out.units[unit.id];
    if (u && u.rev !== unit.rev) {
      const keep = new Set(unit.exercises.map((e) => e.id));
      out.units[unit.id] = { ...u, rev: unit.rev, bestCorrect: Math.min(u.bestCorrect ?? 0, unit.exercises.length), exercises: Object.fromEntries(Object.entries(u.exercises ?? {}).filter(([id]) => keep.has(id))) };
      changed = true;
    }
    if (out.inProgress?.unitId === unit.id && out.inProgress.rev !== unit.rev) { out.inProgress = null; changed = true; }
  }
  return changed ? out : profile;
}

export const saveInProgress = (profile, snapshot) => ({ ...profile, inProgress: snapshot });

/**
 * In order: a unit opens when it is first, or already has a progress entry (sticky: inserting a unit before a finished one
 * never re-locks it), or the previous unit has been finished (any stars). units = one course, sorted by order.
 */
export function isUnlocked(profile, units, unitId) {
  const i = units.findIndex((u) => u.id === unitId);
  return i === 0 || (i > 0 && (Boolean(profile.units?.[unitId]) || profile.inProgress?.unitId === unitId || (profile.units?.[units[i - 1].id]?.stars ?? 0) > 0));
}

/** Seed for the next attempt: hash(profileId, unitId, attempt), so each replay differs but is reproducible. */
export const attemptSeed = (profile, unitId) => seedFor(profile.id, unitId, profile.units?.[unitId]?.attempts ?? 0);

/**
 * What to show the child about a unit (map, intro): stars, "n of m", which exercises are done, the last and best result.
 * An unfinished attempt (inProgress) wins over older data: its finished exercises are ip.finished (older snapshots: the first exerciseIndex of ip.order; none = unit order).
 */
export function unitProgress(profile, unit) {
  const u = profile.units?.[unit.id];
  const ip = profile.inProgress?.unitId === unit.id && profile.inProgress.rev === unit.rev ? profile.inProgress : null;
  const attempts = u?.attempts ?? 0;
  const finished = ip ? resolveOrder(unit, ip).finished : [];
  const rows = unit.exercises.map((e) => {
    const st = (ip ? ip.results?.[e.id] : u?.exercises?.[e.id]) ?? null;
    const done = ip ? finished.includes(e.id) : attempts > 0 || Boolean(u?.exercises?.[e.id]?.done);
    return { id: e.id, done, ok: done && st ? st.reveals === 0 : null, bestOk: Boolean(u?.exercises?.[e.id]?.bestOk) };
  });
  return {
    stars: u?.stars ?? 0, attempts, bestCorrect: u?.bestCorrect ?? 0, total: rows.length, rows,
    doneCount: rows.filter((r) => r.done).length, resumable: Boolean(ip), started: rows.some((r) => r.done) || Boolean(ip),
    last: u?.last ?? (attempts > 0 ? { stars: u.stars, correct: u.bestCorrect } : null),
  };
}

/** Ribbon rule (ENGAGEMENT §3.3): better than the best result before this attempt; never on a first attempt. best/now = { stars, correct }. */
export const isPersonalBest = (best, now) => Boolean(best) && (now.stars > best.stars || now.correct > best.correct);
