// Courses (task 040): layout, per-course words, status filtering, sticky unlock, and an old saved store that must keep working.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildContent } from '../core/content.js';
import { createStore, STORE_KEY } from '../core/profiles.js';
import { validateStore, validateCourse, validateUnit } from '../core/schema.js';
import { applyRev, isUnlocked } from '../core/progress.js';
import { allowedWords, select } from '../core/generate.js';
import { totalStars, nextUnit, visibleUnits, visibleCourses, currentCourse } from '../core/home.js';
import { loadRealContent, loadArchetypes, readCourses, memoryStorage, word } from './helpers.js';

const real = await loadRealContent();
const fixture = JSON.parse(readFileSync(new URL('./fixtures/store-pre-courses.json', import.meta.url), 'utf8')).store;
const courseUnits = (c, id) => c.units.filter((u) => u.course === id);

test('the existing content is course a1s1 and keeps its ids', () => {
  assert.deepEqual(real.errors, []);
  assert.ok(real.courses.some((c) => c.id === 'a1s1')); // other courses may be added by contributors
  const ids = courseUnits(real, 'a1s1').map((u) => u.id);
  assert.deepEqual(ids, ['a1-u0-demo', 'a1-u1-s1', 'a1-u1-s3', 'a1-u1-s5', 'a1-u1-s7']);
  assert.ok(real.words.filter((w) => w.course === 'a1s1').length > 0);
  assert.deepEqual(real.unitById['a1-u1-s1'].exercises.map((e) => e.id).slice(0, 2), ['numbers-listen', 'colours-spell']);
  assert.ok(real.words.some((w) => w.id === 'gato'));
});

test('existing units are "approved" (live as before), the demo unit stays dev', async () => {
  const real4 = courseUnits(real, 'a1s1').filter((u) => !u.dev);
  assert.ok(real4.every((u) => u.status === 'approved' && u.level.cefr === 'A1'));
  assert.deepEqual(visibleUnits(real.units, false).filter((u) => u.course === 'a1s1').map((u) => u.id).filter((id) => id !== 'a1-u0-demo'), real4.map((u) => u.id));
  assert.equal(visibleUnits(real.units, true).length, real.units.length);
  const prod = await loadRealContent({ includeDev: false });
  assert.deepEqual(visibleCourses(prod, { debug: false }).map((c) => c.id), ['a1s1']);
  assert.deepEqual(visibleCourses(real, { debug: true }).map((c) => c.id), ['a1s1']);
});

test('an old saved store loads with its stars, badges and unlocks', () => {
  const storage = memoryStorage();
  storage.setItem(STORE_KEY, JSON.stringify(fixture));
  assert.deepEqual(validateStore(fixture), []);
  const st = createStore({ storage });
  assert.equal(st.loadError, null);
  const p = st.data.profiles[0];
  assert.equal(p.courseId, undefined); // missing = the first course
  assert.equal(currentCourse(p, real.courses).id, 'a1s1');
  assert.equal(applyRev(p, real.units), p, 'revs match: nothing is dropped'); // same object = no change
  const units = courseUnits(real, 'a1s1').filter((u) => !u.dev);
  assert.deepEqual(units.map((u) => p.units[u.id]?.stars ?? 0), [3, 2, 0, 0]);
  assert.equal(totalStars(p, real.units), 5);
  assert.deepEqual(units.map((u) => isUnlocked(p, units, u.id)), [true, true, true, false]); // s5: s3 finished; s7: s5 has no stars
  assert.equal(nextUnit(p, units).id, 'a1-u1-s3'); // first open unit below 3 stars
  assert.equal(p.units['a1-u1-s5'].exercises['pets-listen'].done, true);
  assert.equal(p.badges.length, 2);
});

test('sticky unlock: a unit inserted before a finished one does not re-lock it', () => {
  const p = fixture.profiles[0]; // s1 and s3 finished, s5 started
  const units = courseUnits(real, 'a1s1').filter((u) => !u.dev);
  const fresh = { id: 'a1-u1-s2', order: 2 }; // new unit between s1 and s3, nothing played
  const withNew = [units[0], fresh, ...units.slice(1)];
  assert.deepEqual(withNew.map((u) => isUnlocked(p, withNew, u.id)), [true, true, true, true, false]); // s3 stays open though s2 has no stars
  const first = [{ id: 'a1-u0-new', order: 0 }, ...units]; // inserted before everything
  assert.deepEqual(first.map((u) => isUnlocked(p, first, u.id)), [true, true, true, true, false]);
  // the old rule would have locked them
  const oldRule = (list, id) => { const i = list.findIndex((u) => u.id === id); return i === 0 || (p.units[list[i - 1].id]?.stars ?? 0) > 0; };
  assert.equal(oldRule(withNew, 'a1-u1-s3'), false);
  // an unplayed unit after an unfinished one stays locked
  assert.equal(isUnlocked({ units: {} }, withNew, 'a1-u1-s3'), false);
});

// A second dummy course, built in memory.
const archetypes = await loadArchetypes();
const course = (id, prefix, extra = {}) => ({ schema: 1, id, unitPrefix: prefix, order: 20, title: { es: 'Curso', en: 'Course' }, level: 'A1', status: 'approved', ...extra });
const twoCourses = (opts, tweak = (x) => x) => {
  const base = readCourses();
  const b = { ...base, courses: { ...base.courses, '../courses/zz/course.json': course('zz', 'zz-') } };
  const src = base.units['../courses/a1s1/units/a1-u1-s1.json'];
  b.units = { ...base.units, '../courses/zz/units/zz-u1-s1.json': { ...src, id: 'zz-u1-s1', order: 110, status: 'approved' } };
  b.vocab = { ...base.vocab, '../courses/zz/vocab/zz-u1-s1.json': { schema: 1, words: [word('perro', { unit: 'zz-u1-s1', tags: ['animals'] }), word('zzword', { unit: 'zz-u1-s1' }), word('gato', { es: 'gato', unit: 'zz-u1-s1' })] } };
  return buildContent({ archetypes, ...tweak(b) }, opts);
};

test('two courses: words and unlocks stay inside their course', () => {
  const c = twoCourses();
  assert.ok(c.errors.some((e) => /^courses\/zz\/units\/zz-u1-s1\.json .*unknown word "hermana"/.test(e)), 'words of course a1s1 do not exist for zz'); // the copied unit selects a1s1 words
  assert.deepEqual(c.errors.filter((e) => !e.startsWith('courses/zz/')), []);
  assert.deepEqual(c.courses.map((x) => x.id).filter((id) => id === 'a1s1' || id === 'zz'), ['a1s1', 'zz']);
  const zzWords = allowedWords(c, 'zz-u1-s1').map((w) => w.id).sort();
  assert.deepEqual(zzWords, ['gato', 'perro', 'zzword']);
  assert.ok(allowedWords(c, 'a1-u1-s7').every((w) => w.course === 'a1s1'));
  assert.equal(select({ ids: ['zzword'], n: 1 }, c, 'a1-u1-s7').length, 0);
  assert.deepEqual(c.courseOf['zz-u1-s1'], 'zz');
});

test('the same word id may exist in two courses (ids unique per course)', () => {
  const c = twoCourses();
  assert.equal(c.words.filter((w) => w.id === 'gato').length, 2);
  assert.ok(!c.errors.some((e) => /is also in/.test(e)));
  const twice = twoCourses({}, (b) => { const k = '../courses/zz/vocab/zz-u1-s1.json'; b.vocab[k] = { schema: 1, words: [word('perro', { unit: 'zz-u1-s1' }), word('perro', { unit: 'zz-u1-s1' })] }; return b; });
  assert.ok(twice.errors.some((e) => /^courses\/zz\/vocab\/zz-u1-s1\.json words\[1\]\.id: "perro" is also in zz-u1-s1$/.test(e)));
});

test('course checks: prefix, nested prefixes, unit ids global, id = folder', () => {
  const wrong = twoCourses({}, (b) => { b.courses['../courses/zz/course.json'] = course('zz', 'q-'); return b; });
  assert.ok(wrong.errors.some((e) => /zz-u1-s1\.json id: must start with the course prefix "q-"/.test(e)));
  const nested = twoCourses({}, (b) => { b.courses['../courses/zz/course.json'] = course('zz', 'a1-x'); return b; });
  assert.ok(nested.errors.some((e) => /prefix.*overlap/.test(e)));
  const dup = twoCourses({}, (b) => { b.units['../courses/zz/units/a1-u1-s1.json'] = b.units['../courses/a1s1/units/a1-u1-s1.json']; return b; });
  assert.ok(dup.errors.some((e) => /exists in two courses/.test(e)));
  assert.ok(validateCourse({ ...course('zz', 'zz-'), id: 'other' }, 'zz').some((e) => /^id:/.test(e)));
  assert.deepEqual(validateCourse(course('a1s2', 'a1s2-', { semester: 2, difficultyCap: [{ upToBookUnit: 4, max: 2 }], names: ['Nora'] }), 'a1s2'), []);
});

test('status draft stays out of production; review and approved are bundled', () => {
  const mk = (status) => twoCourses({ includeDev: false }, (b) => { b.units['../courses/zz/units/zz-u1-s1.json'].status = status; return b; });
  assert.ok(!('zz-u1-s1' in mk('draft').unitById));
  assert.ok('zz-u1-s1' in mk('review').unitById);
  assert.ok('zz-u1-s1' in mk('approved').unitById);
  assert.ok('zz-u1-s1' in twoCourses({ includeDev: true }, (b) => { b.units['../courses/zz/units/zz-u1-s1.json'].status = 'draft'; return b; }).unitById);
});

test('the course picker list: a course is listed once it has an approved unit', () => {
  const c = twoCourses({ includeDev: false });
  assert.deepEqual(visibleCourses(c, { debug: false }).map((x) => x.id), ['a1s1', 'zz']);
  assert.deepEqual(visibleCourses(c, { debug: true }).map((x) => x.id), ['a1s1', 'zz']);
  assert.equal(currentCourse({ courseId: 'zz' }, c.courses).id, 'zz');
  assert.equal(currentCourse({ courseId: 'gone' }, c.courses).id, 'a1s1'); // unknown id falls back to the first
});

test('unit status, level and profile fields are validated and optional', () => {
  const u = structuredClone(real.unitById['a1-u1-s1']);
  assert.deepEqual(validateUnit(u, archetypes_by_id()), []);
  assert.ok(validateUnit({ ...u, status: 'live' }, archetypes_by_id()).some((e) => e.startsWith('status:')));
  assert.ok(validateUnit({ ...u, level: { band: '1-2', cefr: 'C9' } }, archetypes_by_id()).length >= 2);
  delete u.status; delete u.level;
  assert.deepEqual(validateUnit(u, archetypes_by_id()), []); // all optional
  const p = { ...fixture.profiles[0], courseId: 'zz', band: '9-10' };
  assert.deepEqual(validateStore({ ...fixture, profiles: [p] }), []);
  assert.ok(validateStore({ ...fixture, profiles: [{ ...p, band: 'old' }] }).some((e) => /band/.test(e)));
  const st = createStore({ storage: memoryStorage() });
  const made = st.addProfile({ firstName: 'Test' });
  assert.equal(st.setCourse(made.id, 'zz').courseId, 'zz');
});
function archetypes_by_id() { return real.archetypeById; }
