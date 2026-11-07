// listen-pick-word rules: distractors, picture/word modes, similarity, judge and hints.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/rng.js';
import { resolveParams, makeExercise } from '../core/generate.js';
import { checkParams } from '../core/schema.js';
import arch from '../archetypes/listen-pick-word/index.js';
import { sound } from '../archetypes/listen-pick-word/logic.js';
import { word, loadRealContent } from './helpers.js';

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

test('distractors never equal the answer by id or spelling (and by picture in picture mode)', () => {
  for (let seed = 1; seed <= 30; seed++) {
    for (const ex of [{}, { params: { answerAs: 'picture', options: 6 } }, { difficulty: 3 }]) {
      for (const r of run(ex, seed)) {
        const a = r.options.find((o) => o.id === r.answer);
        assert.ok(a);
        const others = r.options.filter((o) => o !== a);
        assert.ok(others.every((o) => o.id !== a.id && o.es !== a.es));
        assert.equal(new Set(r.options.map((o) => o.es)).size, r.options.length);
        if (r.answerAs === 'picture') assert.equal(new Set(r.options.map((o) => o.emoji)).size, r.options.length);
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

test('targets without an emoji get no round (every round can fall back to a picture prompt)', () => {
  const bare = word('ola', { emoji: undefined });
  assert.deepEqual(run({ params: { answerAs: 'picture' } }, 1, [bare]), []);
  assert.equal(run({}, 1, [bare, pool[0]]).length, 1);
});

test('word mode keeps `options` options even with emoji-less or duplicate-emoji distractors', () => {
  const small = [pool[0], word('correr', { pos: 'verb', emoji: undefined }), word('saltar', { pos: 'verb', emoji: undefined }),
    word('a', { emoji: '🐶' }), word('b', { emoji: '🐶' })];
  for (let seed = 1; seed <= 20; seed++) {
    const [r] = arch.make(resolveParams(arch, { difficulty: 1, params: { options: 5 } }), { targets: [pool[0]], pool: small }, createRng(seed)).rounds;
    assert.equal(r.options.length, 5);
  }
});

test('a pool too small for `options` returns what exists', () => {
  const tiny = [pool[0], pool[1]];
  const { rounds } = arch.make(resolveParams(arch, { difficulty: 1, params: { options: 6 } }), { targets: [pool[0]], pool: tiny }, createRng(1));
  assert.equal(rounds[0].options.length, 2);
});

test('sound: same-sounding spellings are equal, look-alikes are not', () => {
  for (const [x, y] of [['hola', 'ola'], ['vaca', 'baca'], ['cena', 'zena'], ['pollo', 'poyo']]) assert.equal(sound(x), sound(y));
  for (const [x, y] of [['año', 'ano'], ['ñu', 'nu'], ['chala', 'cala'], ['echo', 'eco'], ['hecho', 'eco'], ['mucho', 'muco'], ['pero', 'perro']]) assert.notEqual(sound(x), sound(y));
});

test('no distractor shares the answer\'s emoji in any mode (it can be the no-voice prompt)', () => {
  const dup = [word('perro', { emoji: '🐶' }), word('can', { emoji: '🐶' }), word('gato', { emoji: '🐱' }), word('pez', { emoji: '🐟' })];
  for (let seed = 1; seed <= 20; seed++) for (const answerAs of ['word', 'picture']) {
    const [r] = arch.make(resolveParams(arch, { difficulty: 1, params: { options: 3, answerAs } }), { targets: [dup[0]], pool: dup }, createRng(seed)).rounds;
    assert.ok(!r.options.some((o) => o.id === 'can'));
  }
});

test('difficulty 3 never offers a homophone of the answer', () => {
  const ph = [word('hola', { emoji: '👋' }), word('ola', { emoji: '🌊' }), word('vaca', { emoji: '🐄' }), word('baca', { emoji: '🧳' }),
    word('casa', { emoji: '🏠' }), word('kasa', { emoji: '🏡' }), word('cera', { emoji: '🕯️' }), word('sera', { emoji: '🌱' }), word('pan', { emoji: '🍞' })];
  for (let seed = 1; seed <= 40; seed++) for (const t of ph) {
    const { rounds } = arch.make(resolveParams(arch, { difficulty: 3, params: { options: 4 } }), { targets: [t], pool: ph }, createRng(seed));
    for (const o of rounds[0].options) if (o.id !== t.id) assert.notEqual(sound(o.es), sound(t.es));
  }
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
  assert.equal(arch.hint({ ...r, options: r.options.slice(0, 3) }, 1, wrongs[0]).remove, null);
  assert.deepEqual(arch.hint(r, 2, wrongs[0]), { level: 2, answer: r.answer });
});

test('hint: with 2, 3 or 4 options at least 2 stay enabled (shell disables the tapped option, then remove, only while >2 are enabled)', () => {
  for (const n of [2, 3, 4]) {
    const [r] = run({ params: { options: n } });
    for (const last of r.options.filter((o) => o.id !== r.answer).map((o) => o.id)) {
      const h = arch.hint(r, 1, last);
      assert.equal(h.remove === null, n < 4);
      let enabled = n;
      if (enabled > 2) enabled--;
      if (h.remove && enabled > 2) enabled--;
      assert.ok(enabled >= 2, `${n} options`);
    }
  }
});

test('module metadata: listening skill, pictures, valid params', () => {
  assert.equal(arch.id, 'listen-pick-word');
  assert.equal(arch.skill, 'listening');
  assert.equal(arch.pictures, true);
  assert.equal(arch.paramsSchema.replay.default, true);
  for (const difficulty of [1, 2, 3]) assert.deepEqual(checkParams(arch.paramsSchema, resolveParams(arch, { difficulty, params: { from: { n: 2 } } })), []);
});

// distractorFrom: distractors come from a second selector pool (makeExercise passes it as ctx.pools).
const nums = ['uno', 'dos', 'tres', 'cuatro', 'cinco'].map((id, i) => word(id, { emoji: `${i}️⃣`, tags: ['numbers'], pos: 'adj' }));
const mixed = [...nums, pool[0], pool[1], pool[3], pool[6], pool[7], pool[8]];
const dfContent = (distractorFrom, options = 3) => ({
  words: mixed, unitById: { u1: { id: 'u1', order: 1 } }, archetypeById: { 'listen-pick-word': arch },
  unit: { id: 'u1', exercises: [{ id: 'x-listen', archetype: 'listen-pick-word', difficulty: 1,
    params: { from: { tag: 'numbers', n: 3 }, options, ...(distractorFrom && { distractorFrom }) } }] },
});
const roundsFor = (c, seed) => makeExercise(c, c.unit, 0, createRng(seed)).rounds;

test('distractorFrom: every option over 200 seeds comes from that pool', () => {
  const c = dfContent({ tag: 'numbers', n: 1 }, 4);
  for (let seed = 1; seed <= 200; seed++) for (const r of roundsFor(c, seed)) {
    assert.equal(r.options.length, 4);
    for (const o of r.options) assert.ok(nums.some((n) => n.id === o.id), `${o.id} is not a number`);
  }
});

test('without distractorFrom, distractors still come from the full pool', () => {
  const seen = new Set();
  for (let seed = 1; seed <= 200; seed++) for (const r of roundsFor(dfContent(null, 4), seed)) for (const o of r.options) seen.add(o.id);
  assert.ok([...seen].some((id) => !nums.some((n) => n.id === id)));
  const p = resolveParams(arch, { difficulty: 1, params: { options: 4 } });
  const ctx = { targets: nums.slice(0, 3), pool: mixed };
  assert.deepEqual(arch.make(p, ctx, createRng(3)), arch.make(p, { ...ctx, pools: {} }, createRng(3)));
});

test('distractorFrom: a pool too small for `options` falls back to the full pool', () => {
  const c = dfContent({ tag: 'numbers', ids: ['uno', 'dos'], n: 1 }, 4);
  for (let seed = 1; seed <= 50; seed++) for (const r of roundsFor(c, seed)) assert.equal(r.options.length, 4);
});

test('distractorFrom: schema takes a selector and rejects a missing n', () => {
  assert.deepEqual(checkParams(arch.paramsSchema, resolveParams(arch, { difficulty: 1, params: { from: { n: 2 }, distractorFrom: { tag: 'numbers', n: 1 } } })), []);
  assert.ok(checkParams(arch.paramsSchema, { from: { n: 2 }, distractorFrom: { tag: 'numbers' } }).length > 0);
});

test('real unit a1-u1-s1 numbers-listen: every option is a number over 200 seeds', async () => {
  const content = await loadRealContent();
  const unit = content.unitById['a1-u1-s1'];
  const i = unit.exercises.findIndex((e) => e.id === 'numbers-listen');
  for (let seed = 1; seed <= 200; seed++) {
    const { rounds } = makeExercise(content, unit, i, createRng(seed));
    assert.ok(rounds.length > 0);
    for (const r of rounds) for (const o of r.options) assert.ok(content.words.find((w) => w.id === o.id).tags.includes('numbers'), o.id);
  }
});
