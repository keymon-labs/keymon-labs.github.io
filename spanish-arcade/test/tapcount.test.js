// Hidden debug toggle: tap counting (injected clock) and the `debug` setting default/migration.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTapCounter } from '../ui/tapcount.js';
import { createStore } from '../core/profiles.js';
import { memoryStorage } from './helpers.js';

const make = () => { let t = 0; const tap = createTapCounter({ now: () => t }); return { at: (ms) => { t = ms; return tap(); } }; };

test('ten quick taps complete a run, nine do not', () => {
  const c = make();
  for (let i = 0; i < 9; i++) assert.equal(c.at(i * 500), false);
  assert.equal(c.at(9 * 500), true);
});

test('a slow tap restarts the count', () => {
  const c = make();
  for (let i = 0; i < 9; i++) c.at(i * 100);
  assert.equal(c.at(900 + 2500), false); // gap over 2 s: this is tap 1 again
  for (let i = 1; i < 9; i++) assert.equal(c.at(3400 + i * 100), false);
  assert.equal(c.at(3400 + 900), true);
});

test('the counter restarts after a completed run', () => {
  const c = make();
  for (let i = 0; i < 10; i++) c.at(i);
  for (let i = 10; i < 19; i++) assert.equal(c.at(i), false);
  assert.equal(c.at(19), true);
});

test('debug setting defaults to false, persists, and old stores without it load', () => {
  const storage = memoryStorage();
  storage.setItem('spanish-arcade:v1', JSON.stringify({ schema: 1, profiles: [], settings: { lang: 'es', sound: false, textSize: 1.25, lastBackupAt: null } }));
  const st = createStore({ storage });
  assert.equal(st.loadError, null);
  assert.equal(st.data.settings.debug, false);
  st.setSettings({ debug: true });
  assert.equal(createStore({ storage }).data.settings.debug, true);
});

test('a non-boolean stored debug value is treated as off', () => {
  const storage = memoryStorage();
  storage.setItem('spanish-arcade:v1', JSON.stringify({ schema: 1, profiles: [], settings: { debug: 'yes' } }));
  assert.equal(createStore({ storage }).data.settings.debug, false);
});
