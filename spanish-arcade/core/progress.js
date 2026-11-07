// Progress rules on one profile (PLAN §4.4, §5). Pure: each function returns a new profile, never writes storage.
import { seedFor } from './generate.js';

export const HISTORY_MAX = 200;

/** Store a finished unit (result from session.result()); at = ISO time from the injected clock. */
export function recordUnit(profile, unit, result, at) {
  if (!result.finished) return profile;
  const old = profile.units[unit.id];
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
      exercises: { ...old?.exercises, ...result.exercises }, // latest attempt per exercise
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

/** In order: a unit opens when the previous one has been finished (any stars). units sorted by order. */
export function isUnlocked(profile, units, unitId) {
  const i = units.findIndex((u) => u.id === unitId);
  return i === 0 || (i > 0 && (profile.units[units[i - 1].id]?.stars ?? 0) > 0);
}

/** Seed for the next attempt: hash(profileId, unitId, attempt), so each replay differs but is reproducible. */
export const attemptSeed = (profile, unitId) => seedFor(profile.id, unitId, profile.units?.[unitId]?.attempts ?? 0);
