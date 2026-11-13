// Pure checks of the layout audit helpers; the live browser audit runs only with LAYOUT_AUDIT_BASE set (needs Playwright and a served dist/).
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { overflowOf, worstCase, paramsFor } from '../scripts/layout-audit.mjs';

test('overflowOf: 0 when everything fits, else the biggest overshoot', () => {
  const fit = { docH: 640, viewH: 640, docW: 360, viewW: 360, stageScroll: 400, stageClient: 400, skipBottom: 630 };
  assert.equal(overflowOf(fit), 0);
  assert.equal(overflowOf({ ...fit, stageScroll: 511, stageClient: 400 }), 111);
  assert.equal(overflowOf({ ...fit, skipBottom: 700 }), 60);
  assert.equal(overflowOf({ ...fit, docH: 650 }), 10);
});

test('worstCase keeps the largest overflow per archetype, difficulty and viewport', () => {
  const r = (seed, overflow) => ({ archetype: 'a', difficulty: 1, viewport: 'v', seed, overflow });
  assert.deepEqual(worstCase([r(0, 5), r(1, 30), r(2, 10)]).map((x) => x.seed), [1]);
});

test('paramsFor: first real exercise of the archetype, else a generic selector, and never shares the object', () => {
  const units = [{ exercises: [{ archetype: 'x', params: { n: 1 } }] }];
  const p = paramsFor('x', units);
  p.n = 2;
  assert.equal(units[0].exercises[0].params.n, 1);
  assert.deepEqual(paramsFor('none', units), { from: { n: 6 } });
});

test('live audit: no archetype overflows a phone screen', { skip: !process.env.LAYOUT_AUDIT_BASE }, () => {
  const r = spawnSync('node', [fileURLToPath(new URL('../scripts/layout-audit.mjs', import.meta.url)), '--base', process.env.LAYOUT_AUDIT_BASE, '--seeds', '2'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});
