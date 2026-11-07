// Placeholder archetype rules: see the English word and picture, tap the Spanish word. Pure, no DOM.
import { distractors, shuffle } from '../../core/generate.js';

export function make(params, { targets, pool }, rng) {
  const rounds = targets.map((w) => {
    const options = shuffle([w, ...distractors(w, pool, params.options - 1, rng)], rng)
      .map((o) => ({ id: o.id, es: o.es, emoji: o.emoji ?? '' }));
    return { prompt: { es: w.emoji ?? w.en, en: w.en }, emoji: w.emoji ?? '', options, answer: w.id, wordIds: [w.id] };
  });
  return { rounds };
}

export function judge(round, answer) {
  const correct = answer === round.answer;
  return { correct, feedback: correct ? { es: '¡Muy bien!', en: 'Well done!' } : { es: 'Casi. Prueba otra vez.', en: 'Nearly. Try again.' } };
}

/**
 * Level 1 greys out one wrong option other than the one just tapped, only with 4+ options (null otherwise); level 2 shows the answer.
 * The shell also disables the tapped option only while more than 2 are enabled, so 2 choices always stay.
 */
export function hint(round, level, lastAnswer) {
  if (level >= 2) return { level: 2, answer: round.answer };
  const remove = round.options.length >= 4 ? round.options.find((o) => o.id !== round.answer && o.id !== lastAnswer)?.id ?? null : null;
  return { level: 1, remove };
}
