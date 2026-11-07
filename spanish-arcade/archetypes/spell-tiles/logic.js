// spell-tiles rules: letter tiles (plus decoys) for a word, judge the built word, hint with the right leading letters. Pure, no DOM.
import { shuffle } from '../../core/generate.js';
import { key, sameWord } from '../spell-fill-letters/logic.js';

const ALPHABET = [...'abcdefghijklmnñopqrstuvxyz'];
const LOOKALIKES = { a: ['á'], á: ['a'], e: ['é'], é: ['e'], i: ['í'], í: ['i'], o: ['ó'], ó: ['o'], u: ['ú', 'ü'], ú: ['u'], ü: ['u'], n: ['ñ'], ñ: ['n'] };

/** True when every letter of `word` is available in `chars` (each tile used once). */
export function formable(word, chars) {
  const left = new Map();
  for (const c of chars) left.set(c, (left.get(c) ?? 0) + 1);
  for (const c of [...word.toLowerCase()]) {
    if (!left.get(c)) return false;
    left.set(c, left.get(c) - 1);
  }
  return true;
}

/** k extra letters that keep every taught word formable from the tiles no more than it was before (no second valid word). */
function decoys(chars, k, word, pool, accents, rng) {
  const others = pool.map((w) => w.es).filter((es) => !sameWord(es, word, accents));
  const before = new Set(others.filter((es) => formable(es, chars)));
  const likes = chars.flatMap((c) => LOOKALIKES[c] ?? []);
  const out = [];
  for (const c of shuffle([...likes, ...likes, ...ALPHABET], rng)) {
    if (out.length >= k) break;
    const trial = [...chars, ...out, c];
    if (others.every((es) => before.has(es) || !formable(es, trial))) out.push(c);
  }
  return out;
}

export function make(params, { targets, pool }, rng) {
  const rounds = targets.filter((w) => /^\p{L}+$/u.test(w.es)).map((w) => {
    const letters = [...w.es.normalize('NFC').toLowerCase()];
    let chars = shuffle([...letters, ...decoys(letters, params.extraLetters, w.es, pool, params.accents, rng)], rng);
    for (let i = 0; i < chars.length && chars.length > 1 && chars.join('') === letters.join(''); i++) chars = [...chars.slice(1), chars[0]];
    const emoji = w.emoji ?? '';
    return {
      word: w.es, answer: w.es, tiles: chars.map((ch, id) => ({ id, ch })), accents: params.accents, hintLetters: params.hintLetters,
      prompt: { es: emoji || w.en, en: w.en }, emoji, wordIds: [w.id],
    };
  });
  return { rounds };
}

export function judge(round, answer) {
  if (sameWord(answer, round.answer, round.accents)) return { correct: true, feedback: { es: '¡Muy bien!', en: 'Well done!' } };
  if (sameWord(answer, round.answer, 'lenient')) return { correct: false, feedback: { es: 'Casi: fíjate en la tilde.', en: 'Nearly: check the accent mark.' } };
  return { correct: false, feedback: { es: 'Casi. Mira las letras otra vez.', en: 'Nearly. Look at the letters again.' } };
}

/** Level 1: how many leading letters are right (at least the first, never the whole word); level 2: the word. */
export function hint(round, level, lastAnswer) {
  if (level >= 2) return { level: 2, answer: round.answer };
  const want = [...key(round.answer, round.accents)];
  const got = [...key(lastAnswer ?? '', round.accents)];
  let n = 0;
  while (n < want.length && got[n] === want[n]) n++;
  return { level: 1, keep: Math.min(Math.max(n, 1), want.length - 1) };
}
