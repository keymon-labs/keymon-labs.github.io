// __ID__ rules: one round per authored item, pick the answer among the options. Pure, no DOM; params in README.md.
import { shuffle } from '../../core/generate.js';

const blank = (s) => typeof s !== 'string' || s.trim() === '';
const fail = (i, msg) => { throw new Error(`items[${i}]: ${msg}`); };

// The schema checks types; these rules need the whole item, so make() throws a readable error (check:content shows it).
export function make(params, _ctx, rng) {
  const items = params.items.slice(0, params.n ?? params.items.length);
  const rounds = items.map((it, i) => {
    if (blank(it.prompt) || blank(it.answer) || it.wrong.some(blank)) fail(i, 'prompt, answer and wrong must not be blank');
    if (it.wrong.some((w) => w.trim() === it.answer.trim())) fail(i, 'a wrong option equals the answer');
    return { prompt: it.prompt.trim(), answer: it.answer.trim(), options: shuffle([it.answer.trim(), ...it.wrong.map((w) => w.trim())], rng), wordIds: [] };
  });
  return { rounds };
}

export function judge(round, answer) {
  const correct = answer === round.answer;
  return { correct, feedback: correct ? { es: '¡Muy bien!', en: 'Well done!' } : { es: 'Casi. Prueba otra vez.', en: 'Nearly. Try again.' } };
}

// level 1: remove one wrong option (never the one just tried); level 2: show the answer
export function hint(round, level, lastAnswer) {
  if (level >= 2) return { level, answer: round.answer };
  const wrong = round.options.filter((o) => o !== round.answer && o !== lastAnswer);
  return { level, remove: wrong[0] ?? null };
}
