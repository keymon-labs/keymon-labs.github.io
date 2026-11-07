// spell-fill-letters rules: blank the letters of a focus (ñ, rr, r, x, s, h, accent, ü, ¿¡), judge the word. Pure, no DOM.
import { shuffle } from '../../core/generate.js';
import { key, sameWord } from '../../core/spelling.js';

const VOWEL = /[aeiouáéíóúü]/;
const isV = (c) => c !== undefined && VOWEL.test(c.toLowerCase());
const plain = (c) => c.normalize('NFD').replace(/[̀-ͯ]/g, '');

// focus -> { find(text) -> [start, len] spans, alt(answer) -> the other spellings a child may confuse it with }
const FOCI = {
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
const ANY_FOCI = ['ñ', 'rr', 'll', 'bv', 'gj', 'h', 'ü', 'accent', 'x'];
// plain: a gap on an ordinary letter (never the first, never inside rr ll ch qu gu); the other option is a letter children mix up
const PLAIN_ALT = { a: 'e', e: 'a', i: 'y', o: 'u', u: 'o', b: 'p', c: 'z', d: 't', f: 'p', g: 'j', j: 'g', k: 'c', l: 'r', m: 'n', n: 'm', p: 'b', q: 'c', r: 'l', t: 'd', v: 'b', y: 'i', z: 'c' };

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

// lenient accents would make both options right for these, so they are always strict
const STRICT_FOCI = ['accent', 'ü'];
const cased = (opt, answer) => (answer !== answer.toLowerCase() ? opt.toUpperCase() : opt);

const DIGRAPH = /rr|ll|ch|qu|gu/gi;

/** One round for one text, or null when the focus has no blank (or no safe alternative) in it. */
function roundFor(text, source, params, poolKeys, rng) {
  const any = params.focus === 'any';
  const focus = any ? 'any' : pickFocus(text, params.focus, source.spell);
  if (!focus) return null;
  const safe = (start, len, o) => !poolKeys.has(key(text.slice(0, start) + o + text.slice(start + len))); // a wrong option must not spell another taught word (perro/pero)
  const cands = (any ? ANY_FOCI : [focus]).flatMap((f) => FOCI[f].find(text).map(([start, len]) => ({ start, len, focus: f })));
  const gaps = [];
  const free = (start, len) => gaps.every((g) => start >= g.start + g.len || start + len <= g.start);
  for (const c of shuffle(cands, rng)) {
    if (gaps.length >= params.gaps) break;
    const answer = text.slice(c.start, c.start + c.len);
    const wrong = FOCI[c.focus].alt(answer.toLowerCase()).map((o) => cased(o, answer)).filter((o) => safe(c.start, c.len, o));
    if (wrong.length && free(c.start, c.len)) gaps.push({ ...c, answer, options: shuffle([answer, ...wrong], rng) });
  }
  if (params.plain && gaps.length < params.gaps) {
    const taken = [...cands, ...[...text.matchAll(DIGRAPH)].map((m) => ({ start: m.index, len: 2 })), ...FOCUSES.flatMap((f) => FOCI[f].find(text).map(([start, len]) => ({ start, len })))];
    const plain = [...text].map((ch, start) => ({ start, len: 1, focus: 'plain', ch })).filter(({ start, ch }) =>
      start > 0 && PLAIN_ALT[ch.toLowerCase()] && taken.every((t) => start < t.start || start >= t.start + t.len));
    for (const c of shuffle(plain, rng)) {
      if (gaps.length >= params.gaps) break;
      const answer = text[c.start];
      const o = cased(PLAIN_ALT[answer.toLowerCase()], answer);
      if (free(c.start, 1) && safe(c.start, 1, o)) gaps.push({ ...c, answer, options: shuffle([answer, o], rng) });
    }
  }
  if (!gaps.length) return null;
  gaps.sort((a, b) => a.start - b.start);
  const cells = [];
  let at = 0;
  for (const g of gaps) {
    for (const ch of text.slice(at, g.start)) cells.push({ ch });
    cells.push({ gap: true, answer: g.answer, options: g.options, focus: g.focus, rule: RULES[g.focus] });
    at = g.start + g.len;
  }
  for (const ch of text.slice(at)) cells.push({ ch });
  const emoji = source.emoji ?? '';
  return {
    word: text, answer: text, cells, focus: gaps[0].focus, accents: gaps.some((g) => STRICT_FOCI.includes(g.focus)) ? 'strict' : params.accents, mode: params.mode, rule: RULES[gaps[0].focus],
    prompt: { es: emoji || '', en: source.en ?? emoji }, emoji, wordIds: source.id ? [source.id] : [],
  };
}

export function make(params, { targets, pool }, rng) {
  const poolKeys = new Set(pool.map((w) => key(w.es)));
  const sources = targets.length ? targets : (params.items ?? []);
  const rounds = sources.map((s) => {
    poolKeys.delete(key(s.es)); // the target itself is of course allowed
    const r = roundFor(s.es, s, params, poolKeys, rng);
    poolKeys.add(key(s.es));
    return r;
  }).filter(Boolean);
  return { rounds };
}


/** Index (among the gaps) of the first gap lastAnswer got wrong; 0 when it cannot tell. */
function firstWrongGap(round, lastAnswer) {
  const last = String(lastAnswer ?? '');
  let i = 0;
  let g = 0;
  for (const c of round.cells) {
    const len = c.gap ? c.answer.length : 1;
    if (c.gap && key(last.slice(i, i + len), round.accents) !== key(c.answer, round.accents)) return g;
    if (c.gap) g++;
    i += len;
  }
  return 0;
}

const ruleOf = (round, gap) => round.cells.filter((c) => c.gap)[gap]?.rule ?? round.rule;

export function judge(round, answer) {
  const correct = sameWord(answer, round.word, round.accents);
  const rule = correct ? round.rule : ruleOf(round, firstWrongGap(round, answer));
  return correct
    ? { correct, feedback: { es: `¡Muy bien! ${rule.es}`, en: `Well done! ${rule.en}` } }
    : { correct, feedback: { es: `Casi. ${rule.es}`, en: `Nearly. ${rule.en}` } };
}

/** Level 1 is only a nudge: which gap to look at, and (choice mode, 3+ options) one wrong option to grey out; a first letter only when the gap has two. Level 2: the whole word. */
export function hint(round, level, lastAnswer) {
  if (level >= 2) return { level: 2, answer: round.word };
  const gap = firstWrongGap(round, lastAnswer);
  const cell = round.cells.filter((c) => c.gap)[gap];
  return {
    level: 1, gap, rule: cell.rule ?? round.rule,
    first: cell.answer.length > 1 ? cell.answer[0] : null,
    remove: cell.options.length > 2 ? cell.options.find((o) => o !== cell.answer) : null,
  };
}
