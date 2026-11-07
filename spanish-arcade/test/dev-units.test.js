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
