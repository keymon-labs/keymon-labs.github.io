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
};
const spans = (t, re) => [...t.matchAll(re)].map((m) => [m.index, m[0].length]);
export const FOCUSES = Object.keys(FOCI);
const AUTO_ORDER = ['ñ', 'rr', 'ü', 'accent', 'h', 'x', '¿¡'];

export const RULES = {
  'ñ': { es: 'La ñ es otra letra: no es una n.', en: 'ñ is its own letter: it is not a plain n.' },
  rr: { es: 'Entre vocales, el sonido fuerte de la r se escribe rr.', en: 'Between vowels, the strong r sound is written rr.' },
  r: { es: 'Entre vocales, una sola r suena suave.', en: 'Between vowels, a single r sounds soft.' },
  x: { es: 'La x suena como "ks", como en taxi.', en: 'x sounds like "ks", as in taxi.' },
  s: { es: 'Escucha bien: aquí va una s, no una x.', en: 'Listen closely: this is an s, not an x.' },
  h: { es: 'La h no suena, pero se escribe.', en: 'The h is silent, but you still write it.' },
  'ü': { es: 'En güe y güi, la u suena y lleva dos puntitos.', en: 'In güe and güi the u is sounded and gets two dots.' },
  accent: { es: 'La tilde marca la sílaba que suena más fuerte.', en: 'The accent mark shows the syllable you say loudest.' },
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

/** One round for one text, or null when the focus has no blank (or no safe alternative) in it. */
function roundFor(text, source, params, poolKeys, rng) {
  const focus = pickFocus(text, params.focus, source.spell);
  if (!focus) return null;
  const found = shuffle(FOCI[focus].find(text), rng);
  const gaps = [];
  for (const [start, len] of found) {
    if (gaps.length >= params.gaps) break;
    const answer = text.slice(start, start + len);
    const wrong = FOCI[focus].alt(answer.toLowerCase()).map((o) => cased(o, answer))
      // a wrong option must not spell another taught word (perro/pero)
      .filter((o) => !poolKeys.has(key(text.slice(0, start) + o + text.slice(start + len))));
    if (wrong.length) gaps.push({ start, len, answer, options: shuffle([answer, ...wrong], rng) });
  }
  if (!gaps.length) return null;
  gaps.sort((a, b) => a.start - b.start);
  const cells = [];
  let at = 0;
  for (const g of gaps) {
    for (const ch of text.slice(at, g.start)) cells.push({ ch });
    cells.push({ gap: true, answer: g.answer, options: g.options });
    at = g.start + g.len;
  }
  for (const ch of text.slice(at)) cells.push({ ch });
  const emoji = source.emoji ?? '';
  return {
    word: text, answer: text, cells, focus, accents: STRICT_FOCI.includes(focus) ? 'strict' : params.accents, mode: params.mode, rule: RULES[focus],
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

export function judge(round, answer) {
  const correct = sameWord(answer, round.word, round.accents);
  return correct
    ? { correct, feedback: { es: `¡Muy bien! ${round.rule.es}`, en: `Well done! ${round.rule.en}` } }
    : { correct, feedback: { es: `Casi. ${round.rule.es}`, en: `Nearly. ${round.rule.en}` } };
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

/** Level 1 is only a nudge: which gap to look at, and (choice mode, 3+ options) one wrong option to grey out; a first letter only when the gap has two. Level 2: the whole word. */
export function hint(round, level, lastAnswer) {
  if (level >= 2) return { level: 2, answer: round.word };
  const gap = firstWrongGap(round, lastAnswer);
  const cell = round.cells.filter((c) => c.gap)[gap];
  return {
    level: 1, gap, rule: round.rule,
    first: cell.answer.length > 1 ? cell.answer[0] : null,
    remove: cell.options.length > 2 ? cell.options.find((o) => o !== cell.answer) : null,
  };
}
