// listen-pick-word rules: distractors, picture/word modes, similarity, judge and hints.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/rng.js';
import { resolveParams } from '../core/generate.js';
import arch from '../archetypes/listen-pick-word/index.js';
import { word } from './helpers.js';

const pool = [
  word('gato', { emoji: '🐱' }), word('pato', { emoji: '🦆' }), word('gata', { emoji: '🐈' }),
  word('perro', { emoji: '🐶' }), word('can', { emoji: '🐶' }), word('pez', { emoji: '🐟' }),
  word('mesa', { emoji: '🪑' }), word('luna', { emoji: '🌙' }), word('nube', { emoji: '☁️' }),
];
const run = (ex, seed = 1, targets = pool.slice(0, 4)) =>
  arch.make(resolveParams(arch, { difficulty: 1, ...ex }), { targets, pool }, createRng(seed)).rounds;

test('same seed gives the same rounds; one round per target', () => {
  assert.deepEqual(run({}, 7), run({}, 7));
  assert.equal(run({}).length, 4);
});

test('distractors never equal the answer, by id, spelling or picture', () => {
  for (let seed = 1; seed <= 30; seed++) {
    for (const ex of [{}, { params: { answerAs: 'picture', options: 6 } }, { difficulty: 3 }]) {
      for (const r of run(ex, seed)) {
        const a = r.options.find((o) => o.id === r.answer);
        assert.ok(a);
        const others = r.options.filter((o) => o !== a);
        assert.ok(others.every((o) => o.id !== a.id && o.es !== a.es && o.emoji !== a.emoji));
        assert.equal(new Set(r.options.map((o) => o.es)).size, r.options.length);
        assert.equal(new Set(r.options.map((o) => o.emoji)).size, r.options.length);
      }
    }
  }
});

test('options count follows params; wordIds and answerAs are set', () => {
  const [r] = run({ params: { options: 4, answerAs: 'picture' } });
  assert.equal(r.options.length, 4);
  assert.equal(r.answerAs, 'picture');
  assert.deepEqual(r.wordIds, [r.answer]);
});

test('picture mode falls back to word when the target has no emoji', () => {
  const bare = word('ola', { emoji: undefined });
  const [r] = run({ params: { answerAs: 'picture' } }, 1, [bare]);
  assert.equal(r.answerAs, 'word');
});

test('difficulty raises similarity: hard distractors are closer in spelling than easy ones', () => {
  const dist = (a, b) => { // plain edit distance, test-local
    let p = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) { const c = [i]; for (let j = 1; j <= b.length; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] !== b[j - 1])); p = c; }
    return p[b.length];
  };
  const total = (difficulty) => {
    let sum = 0;
    for (let seed = 1; seed <= 20; seed++) for (const r of run({ difficulty, params: { options: 3 } }, seed, [pool[0]])) {
      for (const o of r.options) if (o.id !== r.answer) sum += dist(o.es, 'gato');
    }
    return sum;
  };
  assert.ok(total(3) < total(1));
  assert.equal(arch.defaults(1).similar, false);
  assert.equal(arch.defaults(3).similar, true);
});

test('judge accepts only the answer id', () => {
  const [r] = run({});
  assert.equal(arch.judge(r, r.answer).correct, true);
  const wrong = r.options.find((o) => o.id !== r.answer).id;
  assert.equal(arch.judge(r, wrong).correct, false);
});

test('hint: level 1 greys a wrong option other than the one tapped; level 2 reveals', () => {
  const [r] = run({ params: { options: 4 } });
  const wrongs = r.options.filter((o) => o.id !== r.answer).map((o) => o.id);
  const h = arch.hint(r, 1, wrongs[0]);
  assert.ok(wrongs.includes(h.remove) && h.remove !== wrongs[0]);
  assert.equal(arch.hint({ ...r, options: r.options.slice(0, 2) }, 1, wrongs[0]).remove, null);
  assert.deepEqual(arch.hint(r, 2, wrongs[0]), { level: 2, answer: r.answer });
});

test('module metadata: listening skill, pictures, valid params', () => {
  assert.equal(arch.id, 'listen-pick-word');
  assert.equal(arch.skill, 'listening');
  assert.equal(arch.pictures, true);
  assert.equal(arch.paramsSchema.replay.default, true);
});
