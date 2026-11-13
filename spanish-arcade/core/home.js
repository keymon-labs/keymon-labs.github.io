// Pure helpers for the home screen (no DOM): stars chip, "done today" ring, which unit to offer first.
import { unitProgress, isUnlocked } from './progress.js';

export const DAILY_GOAL = 5;
export const THEMES = ['auto', 'light', 'dark'];
export const PALETTES = ['caramel', 'ocean', 'sunset'];

export const totalStars = (profile, units) => units.reduce((n, u) => n + (profile.units?.[u.id]?.stars ?? 0), 0);

/** Units a child may see: "review" units only in debug mode (so a reviewer can play them on the live site); "draft" never gets here in production (content.js). */
export const visibleUnits = (units, debug) => units.filter((u) => u.status !== 'review' || debug);

/** Courses with something to play, in picker order: approved (review in debug mode, draft in the dev server) and with a visible unit. */
export function visibleCourses(content, { debug = false, dev = false } = {}) {
  const shows = (c) => (c.status ?? 'approved') === 'approved' || (c.status === 'review' && debug) || dev;
  return content.courses.filter((c) => shows(c) && visibleUnits(content.units.filter((u) => u.course === c.id), debug).length);
}

/** The profile's course (profile.courseId), or the first one when unset or gone. */
export const currentCourse = (profile, courses) => courses.find((c) => c.id === profile.courseId) ?? courses[0] ?? null;

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** Exercises whose latest finish was today (local time). shortcut: only the latest `at` of each exercise is stored, so replays on the same day count once. */
export function doneToday(profile, now) {
  const today = dayKey(now);
  let n = 0;
  for (const u of Object.values(profile.units ?? {})) for (const e of Object.values(u.exercises ?? {})) if (e.at && dayKey(new Date(e.at)) === today) n++;
  return n;
}

/** The unit to offer under "Continuar": the one in progress, else the first unlocked unit without 3 stars, else the first. */
export function nextUnit(profile, units) {
  const open = units.filter((u) => isUnlocked(profile, units, u.id));
  const resume = open.find((u) => unitProgress(profile, u).resumable);
  return resume ?? open.find((u) => (profile.units?.[u.id]?.stars ?? 0) < 3) ?? open[0] ?? null;
}

const STONES = ['🌈', '🦋', '🚀', '🌳', '🐙', '🎈', '🌻', '🐢'];
/** Emoji for the unit's stone on the trail (stable per position). */
export const stoneEmoji = (index) => STONES[index % STONES.length];

/** A short line from the mascot, by state. */
export function mascotLine(done, goal = DAILY_GOAL) {
  if (done >= goal) return '¡Meta cumplida! Eres genial.';
  if (done > 0) return `¡Muy bien! Ya llevas ${done} hoy.`;
  return '¡Vamos a jugar!';
}
