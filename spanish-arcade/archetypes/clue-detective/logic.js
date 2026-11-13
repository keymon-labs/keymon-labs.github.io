// clue-detective rules: suspect cards + clue sentences, find the one the clues describe. Pure, no DOM.
import { shuffle } from '../../core/generate.js';

const blank = (s) => typeof s !== 'string' || s.trim() === '';
const fail = (i, msg) => { throw new Error(`cases[${i}]: ${msg}`); };

// The schema checks types; these rules need the whole case, so make() throws a readable error (check:units shows it).
export function make(params, _ctx, rng) {
  const cases = params.cases.slice(0, params.n ?? params.cases.length);
  const rounds = cases.map((c, i) => {
    if (c.suspects.length < 4 || c.suspects.length > 6) fail(i, 'needs 4-6 suspects');
    if (c.clues.length < 1 || c.clues.length > 5) fail(i, 'needs 1-5 clues');
    if (c.clues.some(blank)) fail(i, 'a clue is blank');
    if (c.suspects.some((s) => blank(s.name))) fail(i, 'a suspect has no name');
    if (new Set(c.suspects.map((s) => s.name.trim().toLowerCase())).size !== c.suspects.length) fail(i, 'two suspects have the same name');
    if (c.answer < 0 || c.answer >= c.suspects.length) fail(i, 'answer must be the index of one suspect');
    if (c.rules) {
      if (c.rules.length !== c.clues.length) fail(i, 'rules needs one list per clue');
      if (c.rules.some((r) => r.some((k) => k < 0 || k >= c.suspects.length || k === c.answer))) fail(i, 'rules lists suspect indexes, never the answer');
    }
    const suspects = shuffle(c.suspects.map((s, k) => ({ id: String(k), name: s.name.trim(), emoji: s.emoji ?? '', ...(s.place ? { place: s.place } : {}) })), rng);
    return { suspects, clues: c.clues.map((t) => t.trim()), answer: String(c.answer), reveal: params.reveal, crossOut: params.crossOut,
      rules: c.rules?.map((r) => r.map(String)) ?? null, wordIds: [] };
  });
  return { rounds };
}

export function judge(round, answer) {
  const correct = answer === round.answer;
  return { correct, feedback: correct ? { es: '¡Caso cerrado!', en: 'Case closed!' } : { es: 'Casi. Lee las pistas otra vez.', en: 'Nearly. Read the clues again.' } };
}

/**
 * Level 1: with authored `rules`, the first clue that rules out somebody (out = who it rules out); otherwise just cross out the wrong
 * pick (out = [lastAnswer]) and show one more clue. Level 2 marks the answer.
 */
export function hint(round, level, lastAnswer) {
  if (level >= 2) return { level: 2, answer: round.answer };
  const at = round.rules ? round.rules.findIndex((r) => r.length) : -1;
  if (at >= 0) return { level: 1, clue: at, out: round.rules[at] };
  return { level: 1, clue: null, out: round.suspects.some((s) => s.id === lastAnswer) && lastAnswer !== round.answer ? [lastAnswer] : [] };
}
