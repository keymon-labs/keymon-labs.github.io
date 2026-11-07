// Profile store and progress rules (core/profiles.js, core/progress.js). Invented profiles only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, STORE_KEY, MAX_PROFILES } from '../core/profiles.js';
import { recordUnit, applyRev, saveInProgress, isUnlocked, attemptSeed, HISTORY_MAX } from '../core/progress.js';
import { createUnitSession } from '../core/session.js';
import { loadRealContent, memoryStorage } from './helpers.js';

let n = 0;
const deps = (storage = memoryStorage()) => ({ storage, clock: () => new Date('2026-01-01T00:00:00Z'), uuid: () => `id-${++n}` });
const child = { firstName: 'Test', fullName: 'Test Child', class: 'Class X', avatar: 'toni' };
const content = await loadRealContent();
const unit = content.units[0];

function playUnit(seed, missFirst = false) {
  const s = createUnitSession({ unit, content, seed });
  if (missFirst) { const r = s.current.round; s.submit(r.options.find((o) => o.id !== r.answer).id); s.submit(r.options.find((o) => o.id !== r.answer).id); }
  while (!s.done) s.submit(s.current.round.answer);
  return s.result();
}

test('empty storage gives a default store', () => {
  const st = createStore(deps());
  assert.deepEqual(st.data.profiles, []);
  assert.equal(st.data.schema, 1);
  assert.equal(st.data.settings.lang, 'en');
});

test('profiles: uuid ids, max 4, round-trip through storage', () => {
  const d = deps();
  const st = createStore(d);
  const ids = Array.from({ length: MAX_PROFILES }, (_, i) => st.addProfile({ ...child, firstName: `Test${i}` }).id);
  assert.equal(new Set(ids).size, 4);
  assert.throws(() => st.addProfile(child), /4 profiles/);
  assert.throws(() => createStore(deps()).addProfile({ ...child, firstName: ' ' }), /first name/);
  st.removeProfile(ids[0]);
  const again = createStore({ ...d });
  assert.deepEqual(again.data, st.data);
  assert.equal(again.data.profiles.length, 3);
  assert.equal(again.profile(ids[1]).created, '2026-01-01T00:00:00.000Z');
  assert.ok(d.storage.getItem(STORE_KEY).includes('"schema":1'));
});

test('corrupt storage is kept aside, not lost', () => {
  const s = memoryStorage();
  s.setItem(STORE_KEY, '{not json');
  const st = createStore(deps(s));
  assert.deepEqual(st.data.profiles, []);
  assert.equal(st.loadError !== null, true);
  assert.equal(s.getItem(`${STORE_KEY}:corrupt`), '{not json');
});

test('two profiles never mix data', () => {
  const st = createStore(deps());
  const a = st.addProfile({ ...child, firstName: 'TestA' }), b = st.addProfile({ ...child, firstName: 'TestB' });
  st.update(a.id, (p) => recordUnit(p, unit, playUnit(1), '2026-01-02T00:00:00Z'));
  assert.equal(st.profile(a.id).units[unit.id].stars, 3);
  assert.deepEqual(st.profile(b.id).units, {});
  assert.deepEqual(st.profile(b.id).words, {});
  assert.deepEqual(st.profile(b.id).history, []);
  assert.notEqual(attemptSeed(st.profile(a.id), unit.id), attemptSeed(st.profile(b.id), unit.id));
});

test('recordUnit keeps the best stars, counts attempts, merges words, caps history', () => {
  let p = { id: 'x', units: {}, words: {}, history: [], badges: [], inProgress: { unitId: unit.id } };
  p = recordUnit(p, unit, playUnit(1, true), 't1');
  const first = p.units[unit.id];
  assert.equal(first.attempts, 1);
  assert.equal(first.completedAt, 't1');
  assert.equal(p.inProgress, null);
  assert.deepEqual(p.badges, [{ unitId: unit.id, earnedAt: 't1' }]);
  const seen = Object.values(p.words).reduce((s, w) => s + w.seen, 0);
  p = recordUnit(p, unit, playUnit(2), 't2');
  assert.equal(p.units[unit.id].attempts, 2);
  assert.equal(p.units[unit.id].stars, 3);
  assert.equal(p.units[unit.id].completedAt, 't1');
  assert.equal(p.badges.length, 1);
  assert.ok(Object.values(p.words).reduce((s, w) => s + w.seen, 0) > seen);
  assert.equal(p.history.length, 2);
  for (let i = 0; i < HISTORY_MAX + 5; i++) p = recordUnit(p, unit, playUnit(3), `t${i}`);
  assert.equal(p.history.length, HISTORY_MAX);
});

test('recordUnit ignores an unfinished result', () => {
  const p = { id: 'x', units: {}, words: {}, history: [], badges: [], inProgress: null };
  assert.equal(recordUnit(p, unit, { ...playUnit(1), finished: false }, 't1'), p);
});

test('a unit rev change keeps stars and badge, drops stale exercise stats', () => {
  let p = { id: 'x', units: {}, words: {}, history: [], badges: [], inProgress: null };
  p = recordUnit(p, unit, playUnit(1), 't1');
  p.units[unit.id].exercises['old-gone'] = { correct: 1, total: 1, tries: 1, hints: 0, reveals: 0 };
  p.units[unit.id].bestCorrect = 99;
  p.inProgress = { unitId: unit.id, rev: unit.rev };
  const changed = { ...unit, rev: unit.rev + 1 };
  const q = applyRev(p, [changed]);
  assert.equal(q.units[unit.id].rev, unit.rev + 1);
  assert.equal(q.units[unit.id].stars, 3);
  assert.equal(q.badges.length, 1);
  assert.equal(q.units[unit.id].exercises['old-gone'], undefined);
  assert.equal(q.units[unit.id].bestCorrect, unit.exercises.length);
  assert.ok(q.units[unit.id].exercises[unit.exercises[0].id]);
  assert.equal(q.inProgress, null);
  assert.equal(applyRev(q, [changed]), q); // nothing to do: same object
});

test('saveInProgress and unlocking', () => {
  const units = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  let p = { units: {}, inProgress: null };
  assert.deepEqual(units.map((u) => isUnlocked(p, units, u.id)), [true, false, false]);
  p = { units: { a: { stars: 1 } }, inProgress: null };
  assert.deepEqual(units.map((u) => isUnlocked(p, units, u.id)), [true, true, false]);
  p = saveInProgress(p, { unitId: 'b', exerciseIndex: 1 });
  assert.equal(p.inProgress.unitId, 'b');
});

test('settings update and persist', () => {
  const d = deps();
  createStore(d).setSettings({ lang: 'es' });
  assert.equal(createStore({ ...d }).data.settings.lang, 'es');
  assert.equal(createStore({ ...d }).data.settings.sound, true);
});
