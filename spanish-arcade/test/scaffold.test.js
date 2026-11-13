// Contributor kit: new:archetype / new:course / new:unit scaffolds and the check:content helpers. All data is invented and written to temp folders.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, symlinkSync, writeFileSync, readFileSync, readdirSync, existsSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { scaffoldArchetype, nextSteps } from '../scripts/new-archetype.mjs';
import { scaffoldCourse } from '../scripts/new-course.mjs';
import { scaffoldUnit } from '../scripts/new-unit.mjs';
import { lintSpanish, privacyFindings, snapshot, idChanges, unitStrings, runCheckContent } from '../scripts/check-content.mjs';
import { starterParams } from '../lab/logic.js';
import { validateCourse } from '../core/schema.js';
import { loadArchetypes } from './helpers.js';

const real = join(import.meta.dirname, '..');
const tmp = () => mkdtempSync(join(tmpdir(), 'scaffold-'));
const bad = (fn, re) => assert.throws(fn, re);

test('new:archetype writes a working archetype that passes its own test', () => {
  const root = tmp();
  try {
    const app = join(root, 'spanish-arcade');
    mkdirSync(join(app, 'archetypes'), { recursive: true });
    symlinkSync(join(real, '..', 'shared'), join(root, 'shared'));
    symlinkSync(join(real, 'core'), join(app, 'core'));
    symlinkSync(join(real, 'archetypes', '_template'), join(app, 'archetypes', '_template'));
    writeFileSync(join(root, 'package.json'), '{"type":"module"}');
    const written = scaffoldArchetype('zz-demo-game', { app });
    assert.deepEqual(written.sort(), ['archetypes/zz-demo-game/README.md', 'archetypes/zz-demo-game/example.json', 'archetypes/zz-demo-game/index.js', 'archetypes/zz-demo-game/logic.js', 'test/zz-demo-game.test.js']);
    for (const f of written) assert.doesNotMatch(readFileSync(join(app, f), 'utf8'), /__[A-Z]+__/, `${f} still has a placeholder`);
    assert.match(readFileSync(join(app, 'archetypes/zz-demo-game/README.md'), 'utf8'), /\| param \| type \|/);
    bad(() => scaffoldArchetype('zz-demo-game', { app }), /already exists/);
    bad(() => scaffoldArchetype('Bad_Id', { app }), /archetype id/);
    const r = spawnSync(process.execPath, ['--test', join(app, 'test/zz-demo-game.test.js')], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('the template folder is not an archetype, and the lab starts from example.json', async () => {
  assert.ok(existsSync(join(real, 'archetypes/_template/index.js.tpl')));
  assert.equal(Object.keys(await loadArchetypes()).some((p) => p.includes('_template')), false);
  const a = { id: 'zz-new', paramsSchema: {} };
  const ex = { items: [1] };
  assert.deepEqual(starterParams(a, { '../archetypes/zz-new/example.json': ex }), ex);
  assert.notEqual(starterParams(a, { '../archetypes/zz-new/example.json': ex }), ex, 'a copy, so the editor cannot change the example');
  assert.deepEqual(starterParams({ id: 'clue-detective', paramsSchema: {} }, { '../archetypes/clue-detective/example.json': ex }).cases.length, 1, 'STARTERS still wins');
  assert.match(nextSteps('zz-new'), /lab\/\?archetype=zz-new/);
  assert.match(nextSteps('zz-new'), /\/\* zz-new \*\//);
});

const courseApp = () => { const app = tmp(); cpSync(join(real, 'courses'), join(app, 'courses'), { recursive: true }); return app; };

test('new:course and new:unit scaffold a draft course whose unit validates', async () => {
  const app = courseApp();
  try {
    const files = scaffoldCourse('zz9', { level: 'A2', semester: 2, app });
    assert.deepEqual(files, ['courses/zz9/course.json', 'courses/zz9/CREDITS.md']);
    const course = JSON.parse(readFileSync(join(app, 'courses/zz9/course.json'), 'utf8'));
    assert.deepEqual(validateCourse(course, 'zz9'), []);
    assert.equal(course.status, 'draft');
    assert.equal(course.unitPrefix, 'zz9-');
    assert.ok(course.order > 10, 'next free order');
    assert.match(readFileSync(join(app, 'courses/zz9/CREDITS.md'), 'utf8'), /CC BY-NC-SA 4\.0/);
    bad(() => scaffoldCourse('zz9', { app }), /already exists/);
    bad(() => scaffoldCourse('a1', { app }), /overlaps/);
    bad(() => scaffoldCourse('X', { app }), /course id/);
    bad(() => scaffoldCourse('zz8', { level: 'C9', app }), /--level/);

    assert.deepEqual(scaffoldUnit('zz9', '2', '3', { app }), ['courses/zz9/units/zz9-u2-s3.json', 'courses/zz9/vocab/zz9-u2-s3.json']);
    scaffoldUnit('zz9', '2', undefined, { recap: true, app });
    const unit = JSON.parse(readFileSync(join(app, 'courses/zz9/units/zz9-u2-s3.json'), 'utf8'));
    assert.equal(unit.status, 'draft'); assert.equal(unit.order, 230); assert.equal(unit.rev, 1);
    assert.equal(unit.exercises.length, 5);
    bad(() => scaffoldUnit('zz9', '2', '3', { app }), /already exists/);
    bad(() => scaffoldUnit('nope', '1', '1', { app }), /not found/);
    bad(() => scaffoldUnit('zz9', 'x', '1', { app }), /usage/);

    const r = await runCheckContent({ app, git: false });
    assert.deepEqual(r.errors, []);
    assert.deepEqual((await runCheckContent({ app, git: false, course: 'zz9' })).errors, []);
  } finally { rmSync(app, { recursive: true, force: true }); }
});

test('check:content reports English text, bad ¿ ¡, personal data, stray files and denylist hits', async () => {
  const app = courseApp();
  try {
    scaffoldCourse('zz9', { app });
    scaffoldUnit('zz9', '1', '1', { app });
    const f = join(app, 'courses/zz9/units/zz9-u1-s1.json');
    const unit = JSON.parse(readFileSync(f, 'utf8'));
    unit.intro.es = 'What is this? Write to mama@example.org';
    unit.exercises[0].params.items[0].text = '¿Dónde ___ el gato';
    writeFileSync(f, JSON.stringify(unit));
    writeFileSync(join(app, 'courses/zz9/cover.png'), 'x');
    writeFileSync(join(app, 'deny.txt'), '# invented\nZorbaloo\n');
    writeFileSync(join(app, 'courses/zz9/CREDITS.md'), 'Thanks to Zorbaloo.');
    const r = await runCheckContent({ app, git: false, denylist: [join(app, 'deny.txt')] });
    const all = r.errors.join('\n');
    assert.match(all, /zz9-u1-s1\.json intro\.es: English word "what"/);
    assert.match(all, /email address: "mama@example\.org"/);
    assert.match(all, /cover\.png: only \.json and \.md/);
    assert.match(all, /matches denylist entry #1/);
    assert.doesNotMatch(all, /Zorbaloo/, 'the denylist entry is never echoed');
    assert.deepEqual((await runCheckContent({ app, git: false, course: 'a1s1' })).errors, [], 'the filter hides other courses');
  } finally { rmSync(app, { recursive: true, force: true }); }
});

test('lintSpanish: English words, letters, ¿ ¡ pairing, spaces before punctuation', () => {
  assert.deepEqual(lintSpanish('¿Dónde está el gato? ¡Qué bien!'), []);
  assert.deepEqual(lintSpanish('Me llamo Lola.'), []);
  assert.match(lintSpanish('Look at the cat')[0], /English word "the"/);
  assert.match(lintSpanish('Está à la mesa')[0], /letter "à"/);
  assert.match(lintSpanish('Dónde está el gato?')[0], /"\?" has no ¿/);
  assert.match(lintSpanish('¿Dónde está el gato')[0], /"¿" is never closed/);
  assert.match(lintSpanish('¡Hola amigo !')[0], /space before/);
  assert.deepEqual(lintSpanish('¡¿Qué dices?!'), []);
  assert.deepEqual(lintSpanish('Yo ___ una pelota?'), [], 'gap items are exempt from pairing');
  assert.deepEqual(lintSpanish('Ordena la frase con ¿ ? ¡ !.'), [], 'a prompt that names the marks');
  assert.deepEqual(lintSpanish('donde esta el gato?', { pairing: false }), [], 'deliberate mistakes');
});

test('unitStrings reads titles, prompts and string params but not emoji, en or ids', () => {
  const arch = { 'order-words': { paramsSchema: { items: { type: 'array', items: { es: { type: 'string' }, emoji: { type: 'string', optional: true } } }, n: { type: 'int' } } } };
  const unit = { title: { es: 'T', en: 'x' }, intro: { es: 'I' }, exercises: [{ archetype: 'order-words', prompt: { es: 'P', en: 'x' }, params: { items: [{ es: 'Hola amigo', emoji: '👋' }], n: 1 } }] };
  assert.deepEqual(unitStrings(unit, arch).map((s) => s.text), ['T', 'I', 'P', 'Hola amigo']);
});

test('privacyFindings: emails, phones, URLs, postcodes, ids, dates, schools, denylist', () => {
  assert.deepEqual(privacyFindings('Hola, soy Nora. Tengo 7 años. Ven el 12 de marzo.'), []);
  assert.deepEqual(privacyFindings('Ver https://keymon-labs.github.io/spanish-arcade/ y https://creativecommons.org/licenses/by-nc-sa/4.0/'), []);
  assert.equal(privacyFindings('x https://example.com/a y a@b.co 612 345 678 SW1A 1AA 12345678Z 12/03/2018 colegio Miramar').length, 7);
  assert.equal(privacyFindings('El colegio es grande.').length, 0);
  assert.deepEqual(privacyFindings('Hola Ñandú', [{ term: 'nandu', source: 'a file' }]).length, 1);
});

test('idChanges: ids that existed on main may not disappear', () => {
  const files = (units, words = ['a']) => ({
    'courses/c1/course.json': '{"unitPrefix":"c1-"}',
    ...Object.fromEntries(Object.entries(units).map(([id, u]) => [`courses/c1/units/${id}.json`, JSON.stringify(u)])),
    'courses/c1/vocab/c1-u1-s1.json': JSON.stringify({ words: words.map((id) => ({ id })) }),
  });
  const main = snapshot(files({ 'c1-u1-s1': { rev: 1, status: 'approved', exercises: [{ id: 'one' }, { id: 'two' }] }, 'c1-u1-s2': { status: 'draft', exercises: [] } }));
  const same = snapshot(files({ 'c1-u1-s1': { rev: 1, status: 'approved', exercises: [{ id: 'one' }, { id: 'two' }, { id: 'three' }] } }, ['a', 'b']));
  assert.deepEqual(idChanges(main, same), [], 'new ids and a removed draft unit are fine');
  const lost = snapshot(files({ 'c1-u1-s1': { rev: 1, status: 'approved', exercises: [{ id: 'one' }] } }, ['b']));
  const msgs = idChanges(main, lost).join('\n');
  assert.match(msgs, /exercise id "two" is gone/);
  assert.match(msgs, /word id "a" was removed/);
  const reworked = snapshot(files({ 'c1-u1-s1': { rev: 2, status: 'review', exercises: [{ id: 'one' }, { id: 'two-v2' }] } }));
  assert.deepEqual(idChanges(main, reworked), [], 'a rev bump allows a reworked exercise to get a new id');
  assert.match(idChanges(main, snapshot({})).join('\n'), /course "c1" was removed[\s\S]*unit "c1-u1-s1" was removed/);
  assert.match(idChanges(main, snapshot({ ...files({}), 'courses/c1/course.json': '{"unitPrefix":"z-"}' })).join('\n'), /unitPrefix changed/);
});
