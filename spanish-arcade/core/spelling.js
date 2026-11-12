// Spanish spelling comparison shared by the spelling archetypes: case, spaces, accents (strict|lenient), ñ is never n. Pure.

/** Compare form of a word: lower case, one space, NFC. "lenient" also drops accents and ü's dots, but ñ stays ñ. */
export function key(s, accents = 'strict') {
  let t = String(s).normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ');
  if (accents === 'lenient') t = t.replace(/ñ/g, '\u0001').normalize('NFD').replace(/\p{M}/gu, '').replace(/\u0001/g, 'ñ');
  return t;
}

export const sameWord = (a, b, accents = 'strict') => key(a, accents) === key(b, accents);

// Spelling traps shared by spell-fill-letters and fix-the-mistake (moved from the first; one table, one rule text per focus).
const VOWEL = /[aeiouáéíóúü]/;
const isV = (c) => c !== undefined && VOWEL.test(c.toLowerCase());
const plain = (c) => c.normalize('NFD').replace(/[̀-ͯ]/g, '');

// focus -> { find(text) -> [start, len] spans, alt(answer) -> the other spellings a child may confuse it with }
export const FOCI = {
  'ñ': { find: (t) => spans(t, /ñ/gi), alt: () => ['n'] },
  rr: { find: (t) => spans(t, /rr/gi).filter(([i]) => isV(t[i - 1]) && isV(t[i + 2])), alt: () => ['r'] },
  r: { find: (t) => spans(t, /r/gi).filter(([i]) => t[i - 1]?.toLowerCase() !== 'r' && t[i + 1]?.toLowerCase() !== 'r' && isV(t[i - 1]) && isV(t[i + 1])), alt: () => ['rr'] },
  x: { find: (t) => spans(t, /x/gi), alt: () => ['s'] },
  s: { find: (t) => spans(t, /s/gi), alt: () => ['x'] },
  h: { find: (t) => spans(t, /h/gi).filter(([i]) => t[i - 1]?.toLowerCase() !== 'c'), alt: () => [''] },
  'ü': { find: (t) => spans(t, /ü/gi), alt: () => ['u'] },
  accent: { find: (t) => spans(t, /[áéíóú]/gi), alt: (a) => [plain(a)] },
  '¿¡': { find: (t) => spans(t, /[¿¡]/g), alt: (a) => [a === '¿' ? '¡' : '¿'] },
  ll: { find: (t) => spans(t, /ll|y(?=[aeiouáéíóú])/gi), alt: (a) => [a === 'y' ? 'll' : 'y'] },
  bv: { find: (t) => spans(t, /[bv]/gi), alt: (a) => [a === 'b' ? 'v' : 'b'] },
  gj: { find: (t) => spans(t, /g(?=[eiéí])|j/gi), alt: (a) => [a === 'j' ? 'g' : 'j'] },
};
const spans = (t, re) => [...t.matchAll(re)].map((m) => [m.index, m[0].length]);
export const FOCUSES = Object.keys(FOCI);
export const FOCUS_CHOICES = ['auto', ...FOCUSES, 'any'];
const AUTO_ORDER = ['ñ', 'rr', 'ü', 'accent', 'h', 'x', '¿¡'];
// focus "any": every trap of the word is a candidate gap (a word mixes several traps)
export const ANY_FOCI = ['ñ', 'rr', 'll', 'bv', 'gj', 'h', 'ü', 'accent', 'x'];
// plain: a gap on an ordinary letter (never the first, never inside rr ll ch qu gu); the other option is a letter children mix up
export const PLAIN_ALT = { a: 'e', e: 'a', i: 'y', o: 'u', u: 'o', b: 'p', c: 'z', d: 't', f: 'p', g: 'j', j: 'g', k: 'c', l: 'r', m: 'n', n: 'm', p: 'b', q: 'c', r: 'l', t: 'd', v: 'b', y: 'i', z: 'c' };

export const RULES = {
  'ñ': { es: 'La ñ es otra letra: no es una n.', en: 'ñ is its own letter: it is not a plain n.' },
  rr: { es: 'Entre vocales, el sonido fuerte de la r se escribe rr.', en: 'Between vowels, the strong r sound is written rr.' },
  r: { es: 'Entre vocales, una sola r suena suave.', en: 'Between vowels, a single r sounds soft.' },
  x: { es: 'La x suena como "ks", como en taxi.', en: 'x sounds like "ks", as in taxi.' },
  s: { es: 'Escucha bien: aquí va una s, no una x.', en: 'Listen closely: this is an s, not an x.' },
  h: { es: 'La h no suena, pero se escribe.', en: 'The h is silent, but you still write it.' },
  'ü': { es: 'En güe y güi, la u suena y lleva dos puntitos.', en: 'In güe and güi the u is sounded and gets two dots.' },
  accent: { es: 'La tilde marca la sílaba que suena más fuerte.', en: 'The accent mark shows the syllable you say loudest.' },
  ll: { es: 'El sonido de ll se escribe ll o y: hay que aprender cuál.', en: 'The ll sound is written ll or y: you have to learn which.' },
  bv: { es: 'La b y la v suenan igual: hay que aprender cuál lleva cada palabra.', en: 'b and v sound the same: learn which one each word has.' },
  gj: { es: 'Ge y gi suenan como je y ji: fíjate en la palabra.', en: 'ge and gi sound like je and ji: look at the word.' },
  plain: { es: 'Fíjate bien en cada letra.', en: 'Look closely at every letter.' },
  '¿¡': { es: 'Las preguntas empiezan con ¿ y las exclamaciones con ¡.', en: 'Questions start with ¿ and exclamations with ¡.' },
};

/** The focus to use for a text: the requested one, or (auto) the word's spell tag, else the first that applies. */
export function pickFocus(text, focus, spellTags = []) {
  if (focus !== 'auto') return focus;
  const tagged = spellTags.filter((s) => FOCI[s]).concat(AUTO_ORDER);
  return tagged.find((f) => FOCI[f].find(text).length) ?? null;
}


export const cased = (opt, answer) => (answer !== answer.toLowerCase() ? opt.toUpperCase() : opt);

/**
 * Every way a child may misspell `word` for the focus ('any' = all word traps): [{ as, focus, rule }], without duplicates.
 * `taken` = keys of taught words: a misspelling that spells one of them (perro/pero) is left out.
 */
export function misspellings(word, focus, taken = new Set()) {
  const seen = new Set([key(word)]);
  const out = [];
  for (const f of focus === 'any' ? ANY_FOCI : [focus]) {
    if (!FOCI[f]) continue;
    for (const [start, len] of FOCI[f].find(word)) {
      const answer = word.slice(start, start + len);
      for (const o of FOCI[f].alt(answer.toLowerCase())) {
        const as = word.slice(0, start) + cased(o, answer) + word.slice(start + len);
        if (seen.has(key(as)) || taken.has(key(as))) continue;
        seen.add(key(as));
        out.push({ as, focus: f, rule: RULES[f] });
      }
    }
  }
  return out;
}

/** One misspelling of `word` ({ as, focus, rule }) or null when the focus has none that is safe. Randomness only from rng. */
export function misspell(word, focus, rng, taken) {
  const all = misspellings(word, focus, taken);
  return all.length ? rng.pick(all) : null;
}
