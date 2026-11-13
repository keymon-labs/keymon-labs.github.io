// Clip ids, spoken-text collection and the committed audio/ folder (scripts/audio-lib.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { VOICE, checkManifest, clipId, readManifest, speakableTexts } from '../scripts/audio-lib.mjs';
import { loadRealContent } from './helpers.js';

const audioDir = join(import.meta.dirname, '..', 'audio');

test('clipId is stable, 12 hex, ignores spacing/Unicode form, but not case, punctuation or voice', () => {
  assert.equal(clipId('cinco'), clipId('  cinco '));
  assert.equal(clipId('canción'), clipId('canción'));
  assert.match(clipId('cinco'), /^[0-9a-f]{12}$/);
  assert.notEqual(clipId('Hola.'), clipId('¿Hola?'));
  assert.notEqual(clipId('hola'), clipId('Hola'));
  assert.notEqual(clipId('hola'), clipId('hola', 'piper:other;length_scale=1.0'));
});

test('clipId does not change between releases (file names are cached by URL)', () => {
  assert.equal(clipId('cinco'), 'e9ca51bf00f8');
});

test('speakableTexts: vocab es + forms, intros, filled gaps, order sentences, reading text and questions', () => {
  const content = {
    words: [{ es: 'gato', forms: { f: 'gata', pl: 'gatos' } }],
    unitByFile: { u: { intro: { es: '¡Hola!  ¿Qué tal?' }, exercises: [
      { params: { items: [{ text: 'Mi hermana ___ Nora.', answer: 'se llama', options: [] }, { es: 'Tengo un perro.' }] } },
      { params: { text: ['Uno.', 'Dos.'], questions: [{ q: '¿Cuántos?' }] } },
      { params: { from: { tag: 'x' } } },
    ] } },
  };
  assert.deepEqual(speakableTexts(content), ['gata', 'gato', 'gatos', 'Mi hermana se llama Nora.', 'Tengo un perro.', 'Uno. Dos.', '¡Hola! ¿Qué tal?', '¿Cuántos?'].sort());
});

test('real units list spoken texts', async () => {
  const texts = speakableTexts(await loadRealContent({ includeDev: false }));
  assert.ok(texts.length > 100);
  assert.ok(texts.includes('cinco'));
  assert.ok(texts.every((t) => t === t.trim() && !t.includes('___')));
});

test('committed audio/ is consistent: allowed voice, ids match texts, no missing or unused mp3, no fake clips', () => {
  const m = readManifest(audioDir);
  assert.deepEqual(checkManifest(audioDir, m), []);
  assert.ok(m.voice === VOICE);
  if (Object.keys(m.clips).length) assert.match(m.voiceRev, /^[0-9a-f]{40}$/, 'pin the piper-voices commit in voiceRev');
});

test('checkManifest flags the wrong voice, bad ids and missing files', () => {
  const bad = checkManifest(audioDir, { schema: 1, voice: 'piper:es_ES-sharvard-medium', clips: { hola: 'deadbeef0000' } });
  assert.equal(bad.length, 3);
});
