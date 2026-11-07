// Test helpers: load the real units/vocab/archetypes from disk the way import.meta.glob does in the app.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildContent } from '../core/content.js';

const app = join(import.meta.dirname, '..');
const json = (dir) => Object.fromEntries(readdirSync(join(app, dir)).filter((f) => f.endsWith('.json'))
  .map((f) => [`../${dir}/${f}`, JSON.parse(readFileSync(join(app, dir, f), 'utf8'))]));

export async function loadRealContent() {
  const archetypes = {};
  for (const d of readdirSync(join(app, 'archetypes'), { withFileTypes: true })) {
    if (d.isDirectory()) archetypes[`../archetypes/${d.name}/index.js`] = (await import(`../archetypes/${d.name}/index.js`)).default;
  }
  return buildContent({ archetypes, units: json('units'), vocab: json('data/vocab') });
}

// Invented words for tests (no real content).
export const word = (id, extra = {}) => ({ id, es: id, en: `${id}-en`, emoji: '⭐', tags: ['things'], pos: 'noun',
  gender: 'm', number: 'sg', article: 'el', unit: 'u1', ...extra });

export function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), map: m };
}
