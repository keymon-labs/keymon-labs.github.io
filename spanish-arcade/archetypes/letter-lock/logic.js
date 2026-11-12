// letter-lock rules: Wordle-style marking of a guess, make/judge/hint. Pure, no DOM. Contract in ../README.md.
import { key, sameWord } from '../../core/spelling.js';

export const STATES = ['ok', 'near', 'tilde', 'no'];
export const SYMBOL = { ok: '✔', near: '↔', tilde: '´', no: '·' };
const chars = (s) => [...String(s).normalize('NFC').toLowerCase()];
const base = (c) => key(c, 'lenient'); // drops accents and ü's dots; ñ stays ñ

/**
 * Mark each letter of `guess` against `answer`. One of ok (right place), tilde (right place and base letter, wrong accent; never n/ñ),
 * near (in the word elsewhere), no. Wordle counting: a letter gets no more near marks than the answer has copies left. -> string[answer length]
 */
export function score(guess, answer) {
  const g = chars(guess);
  const a = chars(answer);
  const out = a.map(() => 'no');
  const left = new Map(); // answer letters not yet matched
  for (let i = 0; i < a.length; i++) {
    if (g[i] === a[i]) out[i] = 'ok';
    else left.set(a[i], (left.get(a[i]) ?? 0) + 1);
  }
  for (let i = 0; i < a.length; i++) {
    if (out[i] === 'ok' || !g[i] || base(g[i]) !== base(a[i])) continue;
    out[i] = 'tilde';
    left.set(a[i], left.get(a[i]) - 1); // the answer letter here is used up
  }
  for (let i = 0; i < a.length; i++) {
    if (out[i] !== 'no' || !left.get(g[i])) continue;
    out[i] = 'near';
    left.set(g[i], left.get(g[i]) - 1);
  }
  return out;
}

/** Best state seen per letter: ok > tilde > near > no. -> { letter: state } */
export function keyStates(guesses, answer) {
  const rank = (s) => STATES.length - STATES.indexOf(s);
  const best = {};
  for (const guess of guesses) {
    const marks = score(guess, answer);
    chars(guess).slice(0, marks.length).forEach((c, i) => { if (!best[c] || rank(marks[i]) > rank(best[c])) best[c] = marks[i]; });
  }
  return best;
}

export function make(params, { targets }, rng) {
  void rng; // no randomness: the order of targets is already shuffled
  const rounds = targets.filter((w) => /^\p{L}+$/u.test(w.es) && chars(w.es).length >= 3 && chars(w.es).length <= 8).map((w) => ({
    word: w.es, answer: chars(w.es).join(''), tries: params.tries, clue: params.clue, firstLetter: params.firstLetter,
    prompt: { es: w.emoji || '', en: w.en }, emoji: w.emoji ?? '', wordIds: [w.id],
  }));
  return { rounds };
}

export function judge(round, answer) {
  if (sameWord(answer, round.answer)) return { correct: true, feedback: { es: '¡Muy bien!', en: 'Well done!' } };
  return { correct: false, feedback: { es: 'Casi. Mira las pistas otra vez.', en: 'Nearly. Look at the clues again.' } };
}

/** Level 1: the first letter and every tilde position (the right letter with its accent) to pre-fill. Level 2: the word. */
export function hint(round, level, lastAnswer) {
  if (level >= 2) return { level: 2, answer: round.answer };
  const a = chars(round.answer);
  const marks = score(lastAnswer ?? '', round.answer);
  const fixed = [0, ...marks.flatMap((m, i) => (m === 'tilde' ? [i] : []))];
  return { level: 1, fixed: [...new Set(fixed)].map((i) => ({ index: i, ch: a[i] })) };
}

/** Mascot line by number of tries used (1-based). */
export const triesLine = (n, tries) => (n === 1 ? '¡A la primera!' : n >= tries ? '¡Por los pelos!' : n <= 3 ? '¡Qué bien!' : '¡Lo conseguiste!');
