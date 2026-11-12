// fix-the-mistake rules: a text with one spelling mistake; find the wrong word, then fix it. Pure, no DOM. Traps come from core/spelling.js.
import { shuffle } from '../../core/generate.js';
import { key, sameWord, pickFocus, misspell, misspellings, RULES } from '../../core/spelling.js';

export const FOCUS_CHOICES = ['auto', 'ñ', 'rr', 'r', 'x', 's', 'h', 'accent', 'ü', 'll', 'bv', 'gj', 'any'];

const NO_WORD = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u;
/** "¿Cómo?" -> ['¿', 'Cómo', '?']: punctuation stays glued to the word on screen but is not part of the fix. */
export const parts = (token) => NO_WORD.exec(token).slice(1);
const bare = (s) => parts(String(s))[1];

const HINT_LINE = {
  'ñ': { es: 'Busca una n que debería ser ñ.', en: 'Look for an n that should be ñ.' },
  rr: { es: 'Busca una r que debería ser rr (o al revés).', en: 'Look for an r that should be rr (or the other way round).' },
  r: { es: 'Busca una r que debería ser rr (o al revés).', en: 'Look for an r that should be rr (or the other way round).' },
  x: { es: 'Busca una x o una s que no está bien.', en: 'Look for an x or an s that is not right.' },
  s: { es: 'Busca una x o una s que no está bien.', en: 'Look for an x or an s that is not right.' },
  h: { es: 'Busca una h que falta.', en: 'Look for a missing h.' },
  'ü': { es: 'Busca unos puntitos que faltan.', en: 'Look for missing dots.' },
  accent: { es: 'Busca una tilde que falta.', en: 'Look for a missing accent mark.' },
  ll: { es: 'Busca una ll o una y que no está bien.', en: 'Look for an ll or a y that is not right.' },
  bv: { es: 'Busca una b o una v que no está bien.', en: 'Look for a b or a v that is not right.' },
  gj: { es: 'Busca una g o una j que no está bien.', en: 'Look for a g or a j that is not right.' },
  plain: { es: 'Busca una letra que no está bien.', en: 'Look for a letter that is not right.' },
  perfect: { es: 'Lee cada palabra despacio.', en: 'Read every word slowly.' },
};

/** Why `as` is wrong for `word`: the matching trap's focus, "accent" for a lost tilde, else "plain". */
function focusOf(word, as) {
  const hit = misspellings(word, 'any').find((m) => key(m.as) === key(as));
  return hit?.focus ?? (sameWord(word, as, 'lenient') ? 'accent' : 'plain');
}

/** Error text of an authored item, or null when it is fine (one error per item, `at` inside the text). */
export function checkItem(item) {
  const words = String(item?.text ?? '').split(' ').filter(Boolean);
  if (!words.length) return 'text is empty';
  if (item.perfect) return item.at !== undefined || item.as !== undefined ? 'a perfect item has no at/as' : null;
  if (!Number.isInteger(item.at) || item.at < 0 || item.at >= words.length) return `at must be 0..${words.length - 1}`;
  if (typeof item.as !== 'string' || !bare(item.as)) return 'as is missing';
  if (sameWord(bare(item.as), bare(words[item.at]), 'strict')) return 'as is the same word as the text';
  return null;
}

/** One round from a correct word list; `at` = index of the word to spoil as `as` (null for a perfect text). */
function buildRound({ words, at, as, focus, wordIds = [], en }, params, taken, rng) {
  const perfect = at === null;
  const [pre, right, post] = perfect ? ['', '', ''] : parts(words[at]);
  const wrongBare = perfect ? '' : bare(as);
  const shown = words.map((w, i) => (i === at ? pre + wrongBare + post : w));
  let choices = [];
  if (params.fix === 'choice' && !perfect) { // the right form plus other plausible slips (never a taught word); the shown slip is the last resort
    const alts = shuffle(misspellings(right, 'any', taken).map((m) => m.as).filter((o) => key(o) !== key(wrongBare)), rng);
    choices = shuffle([right, ...[...alts, wrongBare].slice(0, params.options - 1)], rng);
  }
  const f = perfect ? 'perfect' : focus ?? focusOf(right, wrongBare);
  return {
    words: shown, text: words.join(' '), at: perfect ? -1 : at, answer: right, wrongAs: wrongBare, perfect, focus: f,
    rule: RULES[f] ?? RULES.plain, choices, fix: params.fix, spot: params.spot, allowPerfect: params.allowPerfect && params.spot,
    wordIds, en: en ?? null,
  };
}

export function make(params, { targets, pool }, rng) {
  const mode = params.mode ?? (params.items?.length ? 'sentence' : 'list');
  const perfectOk = params.allowPerfect && params.spot; // without spotting there is no "perfect" answer
  const rounds = [];
  if (mode === 'sentence') {
    for (const item of shuffle(params.items ?? [], rng)) {
      const bad = checkItem(item);
      if (bad) throw new Error(`fix-the-mistake item "${item?.text}": ${bad}`);
      if (item.perfect && !perfectOk) continue;
      const words = item.text.split(' ').filter(Boolean);
      const taken = new Set(pool.map((w) => key(w.es)));
      rounds.push(buildRound({ words, at: item.perfect ? null : item.at, as: item.as, en: item.en }, params, taken, rng));
    }
    return { rounds };
  }
  const single = pool.filter((w) => !/\s/.test(w.es.trim()));
  const used = new Set();
  // a target with no safe slip is replaced by another taught word that has one, so n targets still give n rounds
  for (const t of [...targets, ...shuffle(pool, rng)]) {
    if (rounds.length >= targets.length) break;
    if (/\s/.test(t.es.trim()) || used.has(key(t.es))) continue;
    const taken = new Set(pool.filter((w) => key(w.es) !== key(t.es)).map((w) => key(w.es)));
    const focus = params.focus === 'any' ? 'any' : pickFocus(t.es, params.focus, t.spell) ?? (params.focus === 'auto' ? 'any' : null); // auto: the word's own trap, else any trap it has
    const slip = focus && focus !== '¿¡' ? misspell(t.es, focus, rng, taken) : null;
    if (!slip) continue;
    used.add(key(t.es));
    const seen = new Set([key(t.es)]);
    const mates = shuffle(single, rng).filter((w) => !seen.has(key(w.es)) && seen.add(key(w.es))).slice(0, params.size - 1);
    const words = shuffle([t.es, ...mates.map((w) => w.es)], rng);
    const perfect = perfectOk && rng.next() < 0.25;
    rounds.push(buildRound({ words, at: perfect ? null : words.indexOf(t.es), as: slip.as, focus: slip.focus, wordIds: t.id ? [t.id] : [] }, params, taken, rng));
  }
  return { rounds };
}

export function judge(round, answer) {
  const at = Number.isInteger(answer?.at) ? answer.at : null;
  const fix = String(answer?.fix ?? '');
  const say = (correct, es, en) => ({ correct, feedback: { es, en } });
  if (round.perfect) {
    return at === -1 ? say(true, '¡Muy bien! Este texto estaba perfecto.', 'Well done! This text was perfect.')
      : say(false, 'Esa palabra está bien escrita. Mira otra vez: ¿todo está bien?', 'That word is spelled right. Look again: is everything fine?');
  }
  if (at === -1) return say(false, 'Mira otra vez: hay una palabra mal.', 'Look again: one word is wrong.');
  if (at !== round.at) return say(false, 'Esa palabra está bien escrita.', 'That word is spelled right.');
  if (sameWord(bare(fix), round.answer, 'strict')) return say(true, `¡Muy bien! ${round.rule.es}`, `Well done! ${round.rule.en}`);
  return sameWord(bare(fix), round.answer, 'lenient')
    ? say(false, 'Casi: fíjate en la tilde.', 'Nearly: look at the accent mark.')
    : say(false, `Casi. ${round.rule.es}`, `Nearly. ${round.rule.en}`);
}

/** Level 1: the kind of slip to look for, and (when spotting) at most 3 words left undimmed: the wrong one plus two others. Level 2: the wrong word and its right form. */
export function hint(round, level, lastAnswer) {
  if (level >= 2) return { level: 2, at: round.at, answer: round.perfect ? '' : round.answer, perfect: round.perfect };
  const line = HINT_LINE[round.focus] ?? HINT_LINE.plain;
  if (round.perfect || !round.spot) return { level: 1, line, keep: null };
  const tried = Number.isInteger(lastAnswer?.at) ? lastAnswer.at : -2; // the word just tapped was fine: dim it
  const others = round.words.map((_, i) => i).filter((i) => i !== round.at && i !== tried);
  return { level: 1, line, keep: [round.at, ...others.slice(0, 2)].sort((a, b) => a - b) };
}
