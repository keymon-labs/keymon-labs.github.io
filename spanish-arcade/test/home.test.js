// Home helpers: stars chip, done-today ring, which unit to continue, settings validation.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { totalStars, doneToday, nextUnit, mascotLine, stoneEmoji } from '../core/home.js';
import { createStore } from '../core/profiles.js';
import { memoryStorage } from './helpers.js';

const units = ['a', 'b', 'c'].map((id) => ({ id, rev: 1, exercises: [{ id: 'e1' }, { id: 'e2' }] }));
const prof = (u = {}, inProgress = null) => ({ id: 'p', units: u, inProgress });

test('totalStars sums the stars of every unit', () => {
  assert.equal(totalStars(prof({ a: { stars: 3 }, b: { stars: 1 } }), units), 4);
  assert.equal(totalStars(prof(), units), 0);
});

test('doneToday counts exercises finished on the local day only', () => {
  const now = new Date(2026, 10, 8, 15, 0);
  const at = (d) => new Date(2026, 10, d, 9, 0).toISOString();
  const p = prof({ a: { exercises: { e1: { at: at(8) }, e2: { at: at(7) } } }, b: { exercises: { e1: { at: at(8) } } } });
  assert.equal(doneToday(p, now), 2);
  assert.equal(doneToday(prof(), now), 0);
});

test('nextUnit: resume first, then the first unlocked unit without 3 stars', () => {
  assert.equal(nextUnit(prof(), units).id, 'a');
  assert.equal(nextUnit(prof({ a: { stars: 3 } }), units).id, 'b');
  assert.equal(nextUnit(prof({ a: { stars: 3 }, b: { stars: 3 }, c: { stars: 3 } }), units).id, 'a');
  const ip = { unitId: 'a', rev: 1, exerciseIndex: 1, results: {} };
  assert.equal(nextUnit(prof({ a: { stars: 1 }, b: { stars: 0 } }, ip), units).id, 'a');
});

test('mascot line and stone emoji', () => {
  assert.match(mascotLine(0), /jugar/);
  assert.match(mascotLine(2), /2/);
  assert.match(mascotLine(5), /Meta/);
  assert.equal(stoneEmoji(0), stoneEmoji(8));
});

test('theme and palette settings: defaults, saved values, junk falls back', () => {
  const s = memoryStorage();
  assert.deepEqual([createStore({ storage: s }).data.settings.theme, createStore({ storage: s }).data.settings.palette], ['auto', 'caramel']);
  const a = createStore({ storage: s });
  a.setSettings({ theme: 'dark', palette: 'ocean' });
  const b = createStore({ storage: s });
  assert.deepEqual([b.data.settings.theme, b.data.settings.palette], ['dark', 'ocean']);
  b.setSettings({ theme: 'pink', palette: 7 });
  const c = createStore({ storage: s });
  assert.deepEqual([c.data.settings.theme, c.data.settings.palette], ['auto', 'caramel']);
});
