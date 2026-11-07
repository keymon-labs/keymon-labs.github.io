// Guard: the UI is Spanish only. Scans the rendering code for English UI words in string literals and for language branching.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const app = join(import.meta.dirname, '..');
const files = ['app.js', 'index.html', ...readdirSync(join(app, 'ui')).filter((f) => f.endsWith('.js')).map((f) => `ui/${f}`)];
for (const d of readdirSync(join(app, 'archetypes'), { withFileTypes: true })) if (d.isDirectory()) files.push(`archetypes/${d.name}/index.js`);

const BANNED = ['Back to', 'Listen', 'Well done', 'Try again', 'Settings', 'Start', 'Profile', 'Check', 'Joke', 'Name', 'Sound', 'Text size',
  'Hint', 'Next', 'Done', 'Hear', 'Delete', 'Continue', 'Leave', 'Backup', 'Copied', 'Exercise', 'Nearly', 'Slower', 'Large'];
const words = new RegExp(`(?<![\\p{L}])(${BANNED.join('|')})(?![\\p{L}])`, 'u');

// Comments and the `en:` metadata strings (kept in archetype title/help, never rendered) are not UI.
const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1')
  .replace(/\ben:\s*(['"`])(?:\\.|(?!\1)[^\\])*\1/g, 'en: 0');
const literals = (src) => [...src.matchAll(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/gs)].map((m) => m[2]);

test('no English UI words in string literals of the shell, ui and archetypes', () => {
  for (const f of files) {
    const src = strip(readFileSync(join(app, f), 'utf8'));
    for (const lit of f.endsWith('.html') ? [src.replace(/<script[\s\S]*?<\/script>/g, '')] : literals(src)) {
      const m = words.exec(lit);
      assert.equal(m, null, `${f}: English "${m?.[0]}" in "${lit.slice(0, 60)}"`);
    }
  }
});

test('the UI never branches on a language or renders English fields', () => {
  for (const f of files.filter((x) => x.endsWith('.js') && x !== 'ui/speech.js')) { // speech.js: voice.lang is the voice's language
    const src = strip(readFileSync(join(app, f), 'utf8'));
    assert.doesNotMatch(src, /\blang\b/, `${f}: uses a language setting`);
    assert.doesNotMatch(src, /\.en\b|\bgloss\b/, `${f}: renders an English field`);
  }
  assert.match(readFileSync(join(app, 'index.html'), 'utf8'), /<html lang="es">/);
});
