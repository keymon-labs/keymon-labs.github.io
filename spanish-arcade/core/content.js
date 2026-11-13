// Gathers archetypes (archetypes/*/index.js), courses (courses/<id>/course.json) with their units and vocab into one validated object.
// buildContent is pure (tests pass modules read from disk); loadContent is the Vite-only import.meta.glob wrapper.
import { validateContent, validateArchetype } from './schema.js';

const base = (path) => path.split('/').filter(Boolean).at(-1).replace(/\.json$/, '');
const folder = (path) => path.split('/').at(-2);
/** Course of a file path (".../courses/<id>/units/x.json"); null for the old flat layout (test fixtures). */
const courseIn = (path) => /(?:^|\/)courses\/([^/]+)\//.exec(path)?.[1] ?? null;

/** Maps are { path: module-or-json } as import.meta.glob returns them (eager, default import). */
export function buildContent({ archetypes, courses = {}, units, vocab }, { includeDev = true } = {}) {
  const archetypeById = Object.fromEntries(Object.entries(archetypes).map(([p, m]) => [m?.id ?? folder(p), m]));
  const errors = [];
  const courseMap = Object.fromEntries(Object.entries(courses).map(([p, c]) => [courseIn(p) ?? folder(p), c]));
  // Production (includeDev false): dev and draft units and their vocab (vocab/<unitId>.json) are not loaded or validated at all,
  // so a real unit that selects a demo word fails validation and demo words never reach content.words.
  // "review" units stay in: the app shows them in debug mode only (app.js, core/home.js visibleUnits).
  const keepUnit = (u) => includeDev || (!u?.dev && u?.status !== 'draft');
  const courseOf = {};
  const unitMap = {};
  const droppedIds = new Set();
  for (const [p, u] of Object.entries(units)) {
    const id = base(p);
    if (!keepUnit(u)) { droppedIds.add(id); continue; }
    if (id in unitMap) errors.push(`${p}: unit "${id}" exists in two courses (unit ids are global because progress is keyed by them)`);
    unitMap[id] = u;
    if (courseIn(p)) courseOf[id] = courseIn(p);
  }
  const vocabMap = {};
  for (const [p, v] of Object.entries(vocab)) {
    const id = base(p);
    if (droppedIds.has(id)) continue;
    vocabMap[id] = v;
    if (courseIn(p)) courseOf[id] ??= courseIn(p);
    if (courseIn(p) && courseOf[id] !== courseIn(p)) errors.push(`${p}: vocab file is in course "${courseIn(p)}" but unit "${id}" is in "${courseOf[id]}"`);
  }
  errors.push(...validateContent({ archetypes: archetypeById, units: unitMap, vocab: vocabMap, courses: courseMap, courseOf }));
  for (const [p, m] of Object.entries(archetypes)) {
    if (m?.id !== folder(p)) errors.push(`${p}: id must be "${folder(p)}" (the folder name)`);
    errors.push(...validateArchetype(m).map((e) => `${p} ${e}`));
  }
  for (const id of new Set(Object.values(courseOf))) if (!courseMap[id]) errors.push(`courses/${id}: course.json is missing`);
  const withCourse = (id, u) => (courseOf[id] ? { ...u, course: courseOf[id] } : u);
  const courseRank = (id) => courseMap[id]?.order ?? 0;
  // Units sorted by course (course.json "order") then by their own "order" (which is per course).
  const unitList = Object.entries(unitMap).map(([id, u]) => withCourse(id, u))
    .sort((a, b) => courseRank(a.course) - courseRank(b.course) || (a.course ?? '').localeCompare(b.course ?? '') || a.order - b.order);
  const courseList = Object.entries(courseMap).filter(([id]) => unitList.some((u) => u.course === id))
    .map(([id, c]) => ({ ...c, id })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id.localeCompare(b.id));
  return {
    archetypeById,
    courses: courseList,
    courseById: Object.fromEntries(courseList.map((c) => [c.id, c])),
    units: unitList,
    unitByFile: unitMap, // keyed by file name, for messages (a unit may lack an id)
    unitById: Object.fromEntries(unitList.map((u) => [u.id, u])),
    courseOf, // file name (unit id) -> course id, for messages
    words: Object.entries(vocabMap).flatMap(([id, v]) => (v?.words || []).map((w) => (courseOf[id] ? { ...w, course: courseOf[id] } : w))),
    errors,
  };
}

/** In the app: everything bundled at build time, so it works offline. */
export function loadContent({ includeDev = true } = {}) {
  return buildContent({
    archetypes: import.meta.glob('../archetypes/*/index.js', { eager: true, import: 'default' }),
    courses: import.meta.glob('../courses/*/course.json', { eager: true, import: 'default' }),
    units: import.meta.glob('../courses/*/units/*.json', { eager: true, import: 'default' }),
    vocab: import.meta.glob('../courses/*/vocab/*.json', { eager: true, import: 'default' }),
  }, { includeDev });
}
