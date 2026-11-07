// listen-pick-word rules: hear a word, pick the word or picture. Pure, no DOM.
import { distractors, shuffle } from '../../core/generate.js';

/** Spoken form of a Spanish word, so look-alike spellings that sound the same (hola/ola) are never offered together. */
export const sound = (s) => s.toLowerCase().replace(/ñ/g, '1').replace(/ch/g, '2').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/h/g, '').replace(/v/g, 'b').replace(/ll/g, 'y').replace(/z|c(?=[ei])/g, 's').replace(/qu/g, 'k').replace(/c(?=[aou])/g, 'k');

// Targets need an emoji so a round can always fall back to a picture prompt when the device has no Spanish voice.
export function make(params, { targets, pool }, rng) {
  const rounds = targets.filter((w) => w.emoji).map((w) => {
    const picture = params.answerAs === 'picture';
    const emojis = new Set([w.emoji]);
    // The answer's emoji can show as the prompt (no voice), so no mode offers a word sharing it; picture mode also needs unique options.
    // shortcut: pictureOk records emojis as it accepts them (distractors() calls it once per candidate); pure form needs a rewrite of distractors().
    const pictureOk = (o) => o.emoji !== w.emoji && (!picture || (o.emoji && !emojis.has(o.emoji) && emojis.add(o.emoji)));
    const filter = (o) => sound(o.es) !== sound(w.es) && pictureOk(o);
    const options = shuffle([w, ...distractors(w, pool, params.options - 1, rng, { similar: params.similar, filter })], rng)
      .map((o) => ({ id: o.id, es: o.es, emoji: o.emoji ?? '' }));
    return { answerAs: picture ? 'picture' : 'word', prompt: { es: w.es, en: w.en }, emoji: w.emoji, options, answer: w.id, replay: params.replay, wordIds: [w.id] };
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
