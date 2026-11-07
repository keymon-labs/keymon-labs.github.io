// Unit authoring checks (scripts/check-units.mjs): each rule against a broken fixture, and the real content.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildContent } from '../core/content.js';
import listen from '../archetypes/listen-pick-word/index.js';
import placeholder from '../archetypes/placeholder/index.js';
import { checkContent } from '../scripts/check-units.mjs';
import { loadRealContent, word } from './helpers.js';

const noop = () => {};
const stub = (id, skill) => ({ id, skill, title: { es: id, en: id }, help: { es: id, en: id }, make: (p, { targets }) => ({ rounds: targets.map((w) => ({ wordIds: [w.id] })) }), judge: noop, hint: noop, mount: noop,
  paramsSchema: { from: { type: 'selector' } } });
const archetypes = {
  '../archetypes/listen-pick-word/index.js': listen, '../archetypes/placeholder/index.js': placeholder,
  '../archetypes/spell-x/index.js': stub('spell-x', 'spelling'), '../archetypes/free-x/index.js': stub('free-x', undefined),
};
const vocab = { u1: { schema: 1, words: [
  ...['gato', 'perro', 'pez', 'mono'].map((id) => word(id, { tags: ['animals'], unit: 'u1' })),
  word('correr', { pos: 'verb', gender: undefined, number: undefined, article: undefined, emoji: undefined, tags: ['actions'], unit: 'u1' }),
] } };
const ex = (id, archetype, extra = {}) => ({ id, archetype, difficulty: 1, params: { from: { tag: 'animals', n: 2 } }, prompt: { es: 'Toca.', en: 'Tap.' }, ...extra });
const goodExercises = () => [ex('animals-listen', 'listen-pick-word'), ex('animals-spell', 'spell-x'), ex('animals-tap', 'placeholder'),
  ex('animals-tap-2', 'placeholder'), ex('animals-spell-2', 'spell-x')];
const unit = (extra = {}) => ({ schema: 1, id: 'u1', rev: 1, order: 1, title: { es: 'a', en: 'a' }, intro: { es: 'a', en: 'a' },
  badge: { name: { es: 'a', en: 'a' }, icon: '⭐' }, pass: { minCorrect: 4 }, exercises: goodExercises(), ...extra });
const check = (u, v = vocab) => checkContent(buildContent({ archetypes, units: { [`../units/${u.id}.json`]: u }, vocab: { '../data/vocab/u1.json': v.u1 } }));
const has = (list, re) => assert.ok(list.some((e) => re.test(e)), `expected ${re} in:\n${list.join('\n')}`);

test('a good unit passes', () => assert.deepEqual(check(unit()).errors, []));

test('too few archetypes, no listening, no spelling', () => {
  const { errors } = check(unit({ exercises: goodExercises().map((e) => ({ ...e, archetype: 'placeholder' })) }));
  has(errors, /^units\/u1\.json exercises: needs at least 3 different archetypes \(has 1: placeholder\)$/);
  has(errors, /^units\/u1\.json exercises: needs a listening exercise/);
  has(errors, /^units\/u1\.json exercises: needs a spelling exercise/);
});

test('an archetype without skill is a warning, not an error', () => {
  const r = check(unit({ exercises: [...goodExercises().slice(0, 4), ex('animals-free', 'free-x')] }));
  assert.deepEqual(r.errors, []);
  has(r.warnings, /free-x.*no "skill"/);
});

test('exercise ids must look stable', () => {
  const u = unit(); u.exercises[0].id = 'e1'; u.exercises[1].id = '2';
  const { errors } = check(u);
  has(errors, /^units\/u1\.json exercises\[0\]\.id: "e1" is not a meaningful id/);
  has(errors, /^units\/u1\.json exercises\[1\]\.id: "2" is not a meaningful id.*\[exercise "2"\]$/);
});

test('units 1-4 may not use difficulty 3', () => {
  const u = unit({ bookRef: { unit: 2, session: 1 } }); u.exercises[4].difficulty = 3;
  has(check(u).errors, /^units\/u1\.json exercises\[4\]\.difficulty: unit 2 may use difficulty 1 or 2 only \[exercise "animals-spell-2"\]$/);
  const late = unit({ bookRef: { unit: 5, session: 1 } }); late.exercises[4].difficulty = 3;
  assert.deepEqual(check(late).errors, []);
});

test('picture archetype: selector must not reach words without an emoji, errors name the exercise', () => {
  const u = unit(); u.exercises[0].params = { from: { tag: 'actions', n: 1 } };
  has(check(u).errors, /^units\/u1\.json exercises\[0\]\.params\.from: "correr" needs an emoji \(picture game\) \[exercise "animals-listen"\]$/);
  const noEmoji = { u1: { schema: 1, words: vocab.u1.words.map((w) => (w.id === 'gato' ? { ...w, emoji: undefined } : w)) } };
  has(check(unit(), noEmoji).errors, /"gato" needs an emoji \(picture game\) \[exercise "animals-listen"\]/);
});

test('core errors get the exercise id too', () => {
  const u = unit(); u.exercises[2].params = { from: { tag: 'animals', n: 2 }, bogus: 1 };
  has(check(u).errors, /exercises\[2\]\.params\.bogus: unknown param \[exercise "animals-tap"\]/);
});

test('a unit without an id does not crash the checker', () => {
  const u = unit(); delete u.id;
  const r = checkContent(buildContent({ archetypes, units: { '../units/broken.json': u }, vocab: { '../data/vocab/u1.json': vocab.u1 } }));
  has(r.errors, /^units\/broken\.json id: /);
});

test('an exercise that makes too few rounds is an error', () => {
  const u = unit(); u.exercises[0].params = { from: { tag: 'animals', n: 4 }, options: 3 };
  const few = { u1: { schema: 1, words: vocab.u1.words.map((w) => (w.id === 'pez' || w.id === 'mono' ? { ...w, emoji: undefined } : w)) } };
  const { errors } = check(u, few);
  has(errors, /^units\/u1\.json exercises\[0\]: makes 2 round\(s\), needs at least 3; words skipped: no emoji.*\[exercise "animals-listen"\]$/);
  assert.deepEqual(check(unit(), vocab).errors, []); // control: enough rounds
});

test('demo units skip the mix rules', () => {
  const u = unit({ id: 'u1-demo', exercises: goodExercises().map((e) => ({ ...e, archetype: 'placeholder' })) });
  assert.deepEqual(check(u).errors.filter((e) => /different archetypes|listening|spelling/.test(e)), []);
});

test('the real content passes', async () => {
  assert.deepEqual(checkContent(await loadRealContent()).errors, []);
});
