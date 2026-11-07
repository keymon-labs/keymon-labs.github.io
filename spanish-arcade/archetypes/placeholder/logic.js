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

/** Level 1 grays out one wrong option; level 2 shows the answer. */
export function hint(round, level) {
  if (level >= 2) return { level: 2, answer: round.answer };
  return { level: 1, remove: round.options.find((o) => o.id !== round.answer)?.id ?? null };
}
