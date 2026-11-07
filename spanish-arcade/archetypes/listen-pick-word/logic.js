// listen-pick-word rules: hear a word, pick the word or picture. Pure, no DOM.
import { distractors, shuffle } from '../../core/generate.js';

export function make(params, { targets, pool }, rng) {
  const rounds = targets.map((w) => {
    // A picture option must identify one word: no distractor shares the answer's emoji or another option's.
    const seen = new Set([w.emoji]);
    const usable = pool.filter((o) => o.id === w.id || (!w.emoji ? true : o.emoji && !seen.has(o.emoji) && seen.add(o.emoji)));
    const options = shuffle([w, ...distractors(w, usable, params.options - 1, rng, { similar: params.similar })], rng)
      .map((o) => ({ id: o.id, es: o.es, emoji: o.emoji ?? '' }));
    return {
      answerAs: params.answerAs === 'picture' && w.emoji ? 'picture' : 'word',
      prompt: { es: w.es, en: w.en }, emoji: w.emoji ?? '', options, answer: w.id, replay: params.replay, wordIds: [w.id],
    };
  });
  return { rounds };
}

export function judge(round, answer) {
  const correct = answer === round.answer;
  return { correct, feedback: correct ? { es: '¡Muy bien!', en: 'Well done!' } : { es: 'Casi. Prueba otra vez.', en: 'Nearly. Try again.' } };
}

/** Level 1 greys out one wrong option other than the one just tapped (null if none left); level 2 shows the answer. */
export function hint(round, level, lastAnswer) {
  if (level >= 2) return { level: 2, answer: round.answer };
  return { level: 1, remove: round.options.find((o) => o.id !== round.answer && o.id !== lastAnswer)?.id ?? null };
}
