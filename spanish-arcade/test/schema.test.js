// Schema checker and validators (core/schema.js). Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkParams, validateVocab, validateUnit, validateStore, validateContent, validateArchetype } from '../core/schema.js';
import placeholder from '../archetypes/placeholder/index.js';
import { word } from './helpers.js';

const has = (errs, re) => assert.ok(errs.some((e) => re.test(e)), `expected ${re} in:\n${errs.join('\n')}`);

test('checkParams accepts valid params and reports readable paths', () => {
  const schema = {
    options: { type: 'int', min: 2, max: 6, default: 3 },
    slow: { type: 'bool', default: false },
    accents: { type: 'enum', values: ['strict', 'lenient'], default: 'strict' },
    from: { type: 'selector' },
    items: { type: 'array', items: { text: { type: 'string' }, ok: { type: 'bool' } } },
    tags: { type: 'array', items: { type: 'string' }, default: [] },
  };
  assert.deepEqual(checkParams(schema, { options: 3, slow: true, accents: 'strict', from: { tag: 'x', n: 2 }, items: [{ text: 'a', ok: true }], tags: [] }), []);
  const errs = checkParams(schema, { options: 9, slow: 'yes', accents: 'loose', from: { n: 0, spell: 'zz', colour: 1 }, items: [{ text: 3 }], tags: [1], extra: 1 });
  has(errs, /^params\.options: must be at most 6$/);
  has(errs, /^params\.slow: must be true or false$/);
  has(errs, /^params\.accents: must be one of strict, lenient$/);
  has(errs, /^params\.from\.n: must be at least 1$/);
  has(errs, /^params\.from\.spell: must be one of /);
  has(errs, /^params\.from\.colour: unknown field$/);
  has(errs, /^params\.items\[0\]\.text: must be text$/);
  has(errs, /^params\.items\[0\]\.ok: missing$/);
  has(errs, /^params\.tags\[0\]: must be text$/);
  has(errs, /^params\.extra: unknown param$/);
  has(checkParams(schema, {}), /^params\.from: missing$/);
});

test('validateArchetype: module fields and optional skill', () => {
  assert.deepEqual(validateArchetype(placeholder), []);
  assert.equal(placeholder.skill, 'puzzle');
  const { skill, ...noSkill } = placeholder;
  assert.deepEqual(validateArchetype(noSkill), []);
  has(validateArchetype({ ...placeholder, skill: 'singing' }), /^skill: must be one of listening, spelling, reading, grammar, puzzle$/);
  has(validateArchetype({ ...placeholder, judge: undefined }), /^judge: must be a function$/);
});

test('validateVocab: fields, article/gender, spell list, file unit', () => {
  assert.deepEqual(validateVocab({ schema: 1, words: [word('gato'), word('casa', { gender: 'f', article: 'la' })] }, 'u1'), []);
  assert.deepEqual(validateVocab({ schema: 1, words: [word('agua', { gender: 'f', article: 'el', elException: true })] }, 'u1'), []);
  has(validateVocab({ schema: 1, words: [word('alma', { gender: 'f', article: 'el' })] }, 'u1'), /^words\[0\]\.article: "el" does not match gender "f"$/);
  has(validateVocab({ schema: 1, words: [word('agua', { gender: 'f', article: 'la', elException: true })] }, 'u1'), /^words\[0\]\.elException: only for a feminine noun with "el"$/);
  const errs = validateVocab({ schema: 1, words: [
    word('Gato X'), word('mesa', { gender: 'f', article: 'el' }), word('sol', { spell: ['zz'] }),
    word('pan', { unit: 'u2' }), word('rojo', { pos: 'colour' }), word('dos', { en: '' }),
  ] }, 'u1');
  has(errs, /^words\[0\]\.id: /);
  has(errs, /^words\[1\]\.article: "el" does not match gender "f"$/);
  has(errs, /^words\[2\]\.spell\[0\]: must be one of /);
  has(errs, /^words\[3\]\.unit: must be "u1" \(the file name\)$/);
  has(errs, /^words\[4\]\.pos: must be one of /);
  has(errs, /^words\[5\]\.en: must be text$/);
  has(validateVocab({ words: [] }, 'u1'), /^schema: must be 1$/);
});

const unit = (over = {}) => ({
  schema: 1, id: 'u1', rev: 1, order: 1, title: { es: 'Uno', en: 'One' }, intro: { es: 'Hola', en: 'Hi' },
  badge: { name: { es: 'Estrella', en: 'Star' }, icon: '⭐' }, pass: { minCorrect: 4 },
  exercises: ['a', 'b', 'c', 'd', 'e'].map((id, i) => ({ id: `ex-${id}`, archetype: 'placeholder', difficulty: i < 3 ? 1 : 2,
    params: { from: { tag: 'things', n: 2 } }, prompt: { es: 'Toca', en: 'Tap' } })),
  ...over,
});
const archetypes = { placeholder };

test('validateUnit: shape, exercise ids, difficulty order, params by archetype', () => {
  assert.deepEqual(validateUnit(unit(), archetypes), []);
  const u = unit();
  u.exercises[1].id = 'ex-a';
  u.exercises[2].archetype = 'nope';
  u.exercises[4].difficulty = 1;
  u.exercises[4].params = { from: { tag: 'things', n: 2 }, options: 1 };
  u.title = { es: 'Uno' };
  const errs = validateUnit(u, archetypes);
  has(errs, /^exercises\[1\]\.id: "ex-a" is used twice$/);
  has(errs, /^exercises\[2\]\.archetype: unknown archetype "nope"/);
  has(errs, /^exercises\[4\]\.difficulty: must not go down \(previous was 2\)$/);
  has(errs, /^exercises\[4\]\.params\.options: must be at least 2$/);
  has(errs, /^title\.en: must be text$/);
  has(validateUnit(unit({ exercises: unit().exercises.slice(0, 4) }), archetypes), /^exercises: needs 5 or 6 exercises$/);
  has(validateUnit(unit({ pass: { minCorrect: 7 } }), archetypes), /^pass\.minCorrect: must be at most 5$/);
});

test('validateContent: cross-file ids, selectors, picture emoji', () => {
  const words = [word('gato'), word('perro'), word('casa', { gender: 'f', article: 'la' })];
  const ok = validateContent({ archetypes, units: { u1: unit() }, vocab: { u1: { schema: 1, words } } });
  assert.deepEqual(ok, []);
  const bad = unit();
  bad.exercises[0].params.from = { ids: ['gato', 'ghost'], n: 2 };
  bad.exercises[1].params.from = { tag: 'animals', n: 2 };
  const errs = validateContent({ archetypes, units: { u1: bad },
    vocab: { u1: { schema: 1, words: [...words, word('sol', { emoji: undefined })] }, u2: { schema: 1, words: [word('gato', { unit: 'u2' })] } } });
  has(errs, /^data\/vocab\/u2\.json words\[0\]\.id: "gato" is also in u1$/);
  has(errs, /^units\/u1\.json exercises\[0\]\.params\.from\.ids: unknown word "ghost"$/);
  has(errs, /^units\/u1\.json exercises\[1\]\.params\.from: only 0 words match, needs 2$/);
  has(errs, /^units\/u1\.json exercises\[2\]\.params\.from: "sol" needs an emoji \(picture game\)$/);
});

test('validateStore: shape and limits', () => {
  const p = (id) => ({ id, firstName: 'Test', fullName: 'Test Child', class: 'Class X', avatar: 'a', created: 'x', units: {}, words: {}, history: [], inProgress: null, badges: [] });
  assert.deepEqual(validateStore({ schema: 1, profiles: [p('a')], settings: {} }), []);
  has(validateStore({ schema: 1, profiles: [p('a'), p('a')], settings: {} }), /^profiles\[1\]\.id: "a" is used twice$/);
  has(validateStore({ schema: 1, profiles: ['a', 'b', 'c', 'd', 'e'].map(p), settings: {} }), /^profiles: at most 4$/);
  has(validateStore({ schema: 1, profiles: [{ ...p('a'), history: {} }], settings: {} }), /^profiles\[0\]\.history: must be a list$/);
});
