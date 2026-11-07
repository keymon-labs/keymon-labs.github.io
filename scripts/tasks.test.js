// Tests for scripts/tasks.mjs (task boards), plus a check that every board in the repo is valid.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { globSync } from 'node:fs';
import { dirname } from 'node:path';
import { parse, check, ready, clash, load } from './tasks.mjs';

const t = (id, status, depends_on = [], touches = [`app/${id}/**`], extra = {}) =>
  ({ id, title: id, model: 'Sonnet 5.5', status, depends_on, touches, file: `${id}.md`, ...extra });

test('parse reads quoted values, arrays and strips comments', () => {
  const { fm, body } = parse('---\nid: "001b"\nstatus: todo   # note\ndepends_on: ["001", "002"]\ntouches: [a/**, b.js]\n---\n## Prompt\n');
  assert.deepEqual(fm, { id: '001b', status: 'todo', depends_on: ['001', '002'], touches: ['a/**', 'b.js'] });
  assert.equal(body, '## Prompt\n');
});

test('check finds unknown deps, cycles, bad status and duplicates', () => {
  const { errors } = check([t('1', 'todo', ['2']), t('2', 'todo', ['1']), t('3', 'nope', ['9']), t('3', 'done')]);
  assert.ok(errors.some((e) => e.includes('cycle')));
  assert.ok(errors.some((e) => e.includes('unknown task 9')));
  assert.ok(errors.some((e) => e.includes('"nope"')));
  assert.ok(errors.some((e) => e.includes('duplicate id 3')));
});

test('check warns on stale claims and clashing work in progress', () => {
  const { errors, warnings } = check([
    t('1', 'in-progress', [], ['app/x/**'], { claimed: '2026-01-01' }),
    t('2', 'in-progress', [], ['app/x/y.js'], { claimed: '2026-01-09' }),
  ], new Date('2026-01-10'));
  assert.deepEqual(errors, []);
  assert.equal(warnings.length, 2);
});

test('ready needs every dependency done (review is not done) and batches by touches', () => {
  const { list, batches } = ready([
    t('1', 'done'), t('2', 'review'),
    t('3', 'todo', ['1']), t('4', 'todo', ['1'], ['app/3/x.js']), t('5', 'todo', ['1']), t('6', 'todo', ['2']),
  ]);
  assert.deepEqual(list.map((x) => x.id), ['3', '4', '5']);
  assert.deepEqual(batches.map((b) => b.map((x) => x.id)), [['3', '5'], ['4']]);
});

test('clash compares the fixed part of touch patterns', () => {
  assert.ok(clash(t('a', 'todo', [], ['units/**']), t('b', 'todo', [], ['units/a1.json'])));
  assert.ok(!clash(t('a', 'todo', [], ['units/**']), t('b', 'todo', [], ['vocab/<id>.json'])));
});

test('every task board in the repo is valid', () => {
  for (const dir of globSync('**/tasks/README.md', { exclude: (p) => /^(node_modules|dist)\b/.test(p) }).map(dirname)) {
    assert.deepEqual(check(load(dir)).errors, [], dir);
  }
});
