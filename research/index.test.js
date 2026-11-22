// Checks the research notebook: entries are valid, licence and reuse agree, INDEX.md is up to date.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load, check, build } from './index.mjs';

const entry = (o) => ({ path: 'projects/x.md', type: 'project', summary: 's', status: 'captured', captured: '2026-11-22', licence: 'MIT', licence_checked: 'repo', reuse: 'ok', title: 'X', ...o });

test('every entry is valid', () => assert.deepEqual(check(load()), []));

test('INDEX.md is up to date (run `npm run research`)', () => {
  assert.equal(readFileSync(join(import.meta.dirname, 'INDEX.md'), 'utf8'), build(load()));
});

test('reuse ok is rejected for risky licences or unverified sources', () => {
  assert.deepEqual(check([entry({})]), []);
  for (const licence of ['none', 'proprietary', 'GPL-3.0', 'LGPL-2.1', 'CC-BY-NC-3.0', 'CC-BY-ND-4.0']) assert.equal(check([entry({ licence })]).length, 1, licence);
  assert.equal(check([entry({ licence_checked: 'snippet' })]).length, 1);
});

test('missing fields, bad enums and a wrong folder are reported', () => {
  assert.equal(check([entry({ licence: '' })]).length, 1);
  assert.equal(check([entry({ status: 'maybe' })]).length, 1);
  assert.equal(check([entry({ type: 'idea' })]).length, 1);
});
