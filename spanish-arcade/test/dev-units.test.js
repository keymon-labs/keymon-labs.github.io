// Units marked "dev" are loaded in tests but left out of production content.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRealContent } from './helpers.js';

test('production content excludes dev units, default includes them', async () => {
  const all = await loadRealContent();
  const prod = await loadRealContent({ includeDev: false });
  assert.ok(all.units.some((u) => u.dev), 'demo unit is a dev unit');
  assert.equal(prod.units.some((u) => u.dev), false);
  assert.equal(prod.errors.length, 0);
});

test('dev vocab stays out of production content.words, so upToUnit:false cannot pick it', async () => {
  const all = await loadRealContent();
  const prod = await loadRealContent({ includeDev: false });
  assert.ok(all.words.some((w) => w.id.startsWith('demo-')));
  assert.deepEqual(prod.words.filter((w) => w.id.startsWith('demo-')), []);
  assert.equal(prod.words.length, prod.words.filter((w) => prod.unitById[w.unit]).length);
});
