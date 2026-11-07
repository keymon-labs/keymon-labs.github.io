// fill-gap-choice rules: a sentence with one gap, 2-4 options. Authored items or generated from vocab metadata. Pure, no DOM.
import { distractors, shuffle } from '../../core/generate.js';
import { key, sameWord } from '../../core/spelling.js';

export const FOCUSES = ['article', 'feeling'];
export const GAP = '___';
const GROUPS = [['el', 'la'], ['los', 'las']];
const FRAMES = {
  article: ['Mira ___ #.', '¿Ves ___ #?', 'Dibujo ___ #.'],
  feeling: ['Hoy estoy ___.', 'Ahora estoy ___.', '¡Estoy ___!'],
};

const roundOf = (text, options, answer, extra, rng) => {
  const [before, after] = text.split(GAP);
  // `heard` is what the speaker says before the answer (never the answer itself); `full` only after a correct pick
  return { parts: [before, after], heard: `${before} hueco ${after}`, full: `${before}${answer}${after}`, options: shuffle(options, rng), answer, ...extra };
};

/** Checks an authored item and returns { text, options, answer }; throws "items[i]: ..." so check:units shows it. */
function checkItem(it, i) {
  const fail = (msg) => { throw new Error(`items[${i}]: ${msg}`); };
  if (typeof it?.text !== 'string' || it.text.split(GAP).length !== 2) fail(`text needs exactly one ${GAP}`);
  if (!Array.isArray(it.options) || it.options.length < 2 || it.options.length > 4) fail('needs 2-4 options');
  const options = it.options.map((o) => (typeof o === 'string' ? o.trim() : ''));
  if (options.some((o) => !o)) fail('has a blank option');
  if (new Set(options.map((o) => key(o))).size !== options.length) fail('has duplicate options');
  const answer = options.find((o) => sameWord(o, String(it.answer)));
  if (answer === undefined) fail('answer is not one of the options');
  return { text: it.text, options, answer, en: it.en };
}

function article(w, params, rng) {
  if (w.pos !== 'noun' || !GROUPS.flat().includes(w.article)) return null;
  const group = GROUPS.find((g) => g.includes(w.article));
  // other article of the same number first, then the other number; the answer is never repeated ("el agua" keeps el)
  const wrong = [...shuffle(group.filter((a) => a !== w.article), rng), ...shuffle(GROUPS.flat().filter((a) => !group.includes(a)), rng)];
  const text = rng.pick(FRAMES.article).replace('#', w.es);
  return roundOf(text, [w.article, ...wrong.slice(0, params.options - 1)], w.article, { gloss: w.en, emoji: w.emoji ?? '', wordIds: [w.id] }, rng);
}

function feeling(w, params, pool, rng) {
  // the picture is what makes one feeling right, so a feeling without an emoji gets no round
  if (w.pos !== 'adj' || !w.tags?.includes('feelings') || !w.emoji) return null;
  const filter = (o) => o.pos === 'adj' && o.tags?.includes('feelings') && o.emoji !== w.emoji;
  const options = [w.es, ...distractors(w, pool, params.options - 1, rng, { filter }).map((o) => o.es)];
  return roundOf(rng.pick(FRAMES.feeling), options, w.es, { gloss: w.en, emoji: w.emoji, wordIds: [w.id] }, rng);
}

export function make(params, { targets, pool }, rng) {
  const rounds = [];
  if (params.items) {
    const ok = params.items.map(checkItem); // validate all first, so a bad item fails whatever the seed
    const list = params.n ? shuffle(ok, rng).slice(0, params.n) : ok;
    rounds.push(...list.map((it) => roundOf(it.text, it.options, it.answer, { gloss: it.en ?? '', emoji: '', wordIds: [] }, rng)));
  }
  for (const w of targets) {
    const r = params.focus === 'feeling' ? feeling(w, params, pool, rng) : article(w, params, rng);
    if (r) rounds.push(r);
  }
  return { rounds };
}

export function judge(round, answer) {
  const correct = sameWord(String(answer), round.answer);
  return { correct, feedback: correct ? { es: '¡Muy bien!', en: 'Well done!' } : { es: 'Casi. Prueba otra vez.', en: 'Nearly. Try again.' } };
}

/**
 * Level 1 only points at the gap (`mark`). `remove` (a wrong option other than the last) comes only with 4 options: the shell also
 * disables the tapped option while more than 2 are enabled, so 2 choices always stay. Level 2 gives the answer.
 */
export function hint(round, level, lastAnswer) {
  if (level >= 2) return { level: 2, answer: round.answer };
  const remove = round.options.length >= 4 ? round.options.find((o) => o !== round.answer && o !== lastAnswer) ?? null : null;
  return { level: 1, mark: true, remove };
}
