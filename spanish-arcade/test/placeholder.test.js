// Placeholder archetype logic: the template real archetypes copy.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import placeholder from '../archetypes/placeholder/index.js';

const round = (ids, answer) => ({ options: ids.map((id) => ({ id, es: id })), answer });

test('level-1 hint never greys the option just tapped, nor the answer', () => {
  const r = round(['a', 'b', 'c', 'd'], 'a');
  assert.equal(placeholder.hint(r, 1, 'b').remove, 'c');
  assert.equal(placeholder.hint(r, 1, 'c').remove, 'b');
});

test('level-1 hint gives remove: null when nothing else can be greyed', () => {
  assert.equal(placeholder.hint(round(['a', 'b'], 'a'), 1, 'b').remove, null);
});

test('level-2 hint reveals the answer', () => {
  assert.deepEqual(placeholder.hint(round(['a', 'b'], 'a'), 2, 'b'), { level: 2, answer: 'a' });
});

test('level-1 hint: with 2, 3 or 4 options at least 2 stay enabled (shell disables the tapped option, then remove, only while >2 are enabled)', () => {
  for (const n of [2, 3, 4]) {
    const r = round(['a', 'b', 'c', 'd'].slice(0, n), 'a');
    for (const last of r.options.map((o) => o.id).filter((id) => id !== 'a')) {
      const h = placeholder.hint(r, 1, last);
      assert.equal(h.remove === null, n < 4);
      let enabled = n;
      if (enabled > 2) enabled--;
      if (h.remove && enabled > 2) enabled--;
      assert.ok(enabled >= 2, `${n} options`);
    }
  }
});
