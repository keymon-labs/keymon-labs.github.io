// letter-lock rules: Wordle-style marking of a guess, the riddle clue ladder, make/judge/hint. Pure, no DOM. Contract in ../README.md.
import { key, sameWord } from '../../core/spelling.js';

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

/** Auto-generated hints, in order: first letter, length, and the special letter if the word has one. -> string[] (Spanish) */
export function autoHints(answer) {
  const a = chars(answer);
  const out = [`Empieza por ${a[0].toUpperCase()}`, `Tiene ${a.length} letras`];
  if (a.includes('ñ')) out.push('Lleva ñ');
  else if (a.some((c) => 'áéíóú'.includes(c))) out.push('Lleva tilde');
  else if (a.includes('ü')) out.push('Lleva ü');
  return out;
}

/**
 * Clues in the order they appear: authored riddle lines, then auto hints. With firstLetter, "Empieza por" is the second line from the
 * start. `riddle` false (audio-only) leaves out the authored lines. -> { lines: string[], start: how many show before any wrong try }
 */
export function clueLadder(round, riddle = true) {
  const [first, count, ...more] = autoHints(round.answer);
  const own = riddle ? round.clues ?? [] : [];
  if (round.firstLetter) return { lines: [own[0], first, ...own.slice(1), count, ...more].filter(Boolean), start: own.length ? 2 : 1 };
  return { lines: own.length ? [...own, first, count, ...more] : [count, first, ...more], start: riddle ? 1 : 0 };
}

/** The clue lines to show after `wrong` wrong guesses (never more than exist). */
export function cluesShown(round, wrong, riddle = true) {
  const { lines, start } = clueLadder(round, riddle);
  return lines.slice(0, Math.min(lines.length, start + wrong));
}

export function make(params, { targets }, rng) {
  void rng; // no randomness: the order of targets is already shuffled
  const rounds = targets.filter((w) => /^\p{L}+$/u.test(w.es) && chars(w.es).length >= 3 && chars(w.es).length <= 8).map((w) => ({
    word: w.es, answer: chars(w.es).join(''), tries: params.tries, clue: params.clue, firstLetter: params.firstLetter,
    clues: w.clues ?? [], prompt: { es: w.emoji || '', en: w.en }, emoji: w.emoji ?? '', wordIds: [w.id],
  }));
  return { rounds };
}

export function judge(round, answer) {
  if (sameWord(answer, round.answer)) return { correct: true, feedback: { es: '¡Muy bien!', en: 'Well done!' } };
  return { correct: false, feedback: { es: 'Casi. Mira las pistas otra vez.', en: 'Nearly. Look at the clues again.' } };
}

/** Level 1: the first letter and every tilde position (the right letter with its accent) to show in the word pattern. Level 2: the word. */
export function hint(round, level, lastAnswer) {
  if (level >= 2) return { level: 2, answer: round.answer };
  const a = chars(round.answer);
  const marks = score(lastAnswer ?? '', round.answer);
  const fixed = [0, ...marks.flatMap((m, i) => (m === 'tilde' ? [i] : []))];
  return { level: 1, fixed: [...new Set(fixed)].map((i) => ({ index: i, ch: a[i] })) };
}

/** Mascot line by number of tries used (1-based). */
export const triesLine = (n, tries) => (n === 1 ? '¡A la primera!' : n >= tries ? '¡Por los pelos!' : n <= 3 ? '¡Qué bien!' : '¡Lo conseguiste!');
