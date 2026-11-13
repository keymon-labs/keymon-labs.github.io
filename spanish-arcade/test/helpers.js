// Test helpers: load the real courses (courses/<id>/{course.json,units,vocab}) and archetypes from disk the way import.meta.glob does in the app.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { buildContent } from '../core/content.js';

const app = join(import.meta.dirname, '..');

/** Course files from disk as import.meta.glob would give them: { "../courses/<id>/<sub>/<file>.json": parsed }. coursesDir lets a test point at a temp copy. */
export function readCourses(coursesDir = join(app, 'courses')) {
  const out = { courses: {}, units: {}, vocab: {} };
  for (const d of readdirSync(coursesDir, { withFileTypes: true }).filter((x) => x.isDirectory())) {
    const read = (rel) => JSON.parse(readFileSync(join(coursesDir, d.name, rel), 'utf8'));
    if (existsSync(join(coursesDir, d.name, 'course.json'))) out.courses[`../courses/${d.name}/course.json`] = read('course.json');
    for (const [sub, into] of [['units', out.units], ['vocab', out.vocab]]) {
      const dir = join(coursesDir, d.name, sub);
      if (existsSync(dir)) for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) into[`../courses/${d.name}/${sub}/${f}`] = read(`${sub}/${f}`);
    }
  }
  return out;
}

export async function loadArchetypes() {
  const archetypes = {};
  for (const d of readdirSync(join(app, 'archetypes'), { withFileTypes: true })) {
    if (d.isDirectory()) archetypes[`../archetypes/${d.name}/index.js`] = (await import(`../archetypes/${d.name}/index.js`)).default;
  }
  return archetypes;
}

export async function loadRealContent(opts, coursesDir) {
  return buildContent({ archetypes: await loadArchetypes(), ...readCourses(coursesDir) }, opts);
}

// Invented words for tests (no real content).
export const word = (id, extra = {}) => ({ id, es: id, en: `${id}-en`, emoji: '⭐', tags: ['things'], pos: 'noun',
  gender: 'm', number: 'sg', article: 'el', unit: 'u1', ...extra });

export function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), map: m };
}
