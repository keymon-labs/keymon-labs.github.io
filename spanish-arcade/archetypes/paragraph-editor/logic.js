// paragraph-editor rules: a short paragraph with 2-6 mistakes; each fix is one judged round on the same board. Pure, no DOM. Params in README.md.
import { shuffle } from '../../core/generate.js';
import { key } from '../../core/spelling.js';

export const KINDS = ['accent', 'agreement', 'verb', 'punctuation', 'spelling'];
export const MAX_ERRORS = 6;

const NAME = { // [singular, plural] as shown in the "kinds" line
  accent: ['tilde', 'tildes'], agreement: ['concordancia', 'concordancias'], verb: ['verbo', 'verbos'],
  punctuation: ['puntuación', 'puntuaciones'], spelling: ['ortografía', 'ortografías'],
};
const RULE = {
  accent: { es: 'Bien: la tilde marca la sílaba que suena más fuerte.', en: 'Well done: the accent marks the stressed syllable.' },
  agreement: { es: 'Bien: el adjetivo y el nombre concuerdan.', en: 'Well done: noun and adjective agree.' },
  verb: { es: 'Bien: el verbo va con quien lo hace.', en: 'Well done: the verb matches who does it.' },
  punctuation: { es: 'Bien: ¿ ¡ y las mayúsculas ayudan a leer.', en: 'Well done: ¿ ¡ and capitals help the reader.' },
  spelling: { es: 'Bien: así se escribe.', en: 'Well done: that is how it is spelled.' },
};
const LINE = {
  accent: { es: 'Busca una palabra a la que le falta (o le sobra) la tilde.', en: 'Look for a word missing (or with too many) accent marks.' },
  agreement: { es: 'Busca dos palabras que no concuerdan.', en: 'Look for two words that do not agree.' },
  verb: { es: 'Busca un verbo que no va con quien lo hace.', en: 'Look for a verb that does not match its subject.' },
  punctuation: { es: 'Busca un signo o una mayúscula que falta.', en: 'Look for a missing mark or capital.' },
  spelling: { es: 'Busca una palabra mal escrita.', en: 'Look for a misspelled word.' },
};

const norm = (s) => String(s ?? '').normalize('NFC').trim();
const END = /[.!?…]["»”)]*$/;
const wordsOf = (text) => String(text ?? '').split(' ').filter(Boolean);

/** Error text of an authored text, or null when it is fine. */
export function checkText(t) {
  const words = wordsOf(t?.text);
  if (!words.length) return 'text is empty';
  const errs = t.errors;
  if (!Array.isArray(errs) || !errs.length) return 'needs at least 1 error';
  if (errs.length > MAX_ERRORS) return `at most ${MAX_ERRORS} errors`;
  const seen = new Set();
  for (const e of errs) {
    if (!Number.isInteger(e?.at) || e.at < 0 || e.at >= words.length) return `at must be 0..${words.length - 1}`;
    if (seen.has(e.at)) return `word ${e.at} has two errors`;
    seen.add(e.at);
    if (typeof e.as !== 'string' || !norm(e.as) || norm(e.as).includes(' ')) return 'as must be one word';
    if (norm(e.as) === norm(words[e.at])) return `as is the same as the text at ${e.at}`;
    if (e.kind !== undefined && !KINDS.includes(e.kind)) return `kind must be one of ${KINDS.join(', ')}`;
    if (e.alts?.some((a) => norm(a) === norm(words[e.at]) || /\s/.test(norm(a)))) return 'alts must be other single words';
  }
  return null;
}

const plain = (s) => s.normalize('NFD').replace(/\p{M}/gu, '');
const ACC = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };
const SWAPS = [['os', 'as'], ['as', 'os'], ['es', 'e'], ['o', 'a'], ['a', 'o'], ['e', 'es'], ['o', 'os'], ['a', 'as'], ['s', '']];

/** Plausible wrong forms of `right` (a token): dropped/added tilde, flipped ending, flipped first-letter case, lost ¿ ¡. Never `right`. */
export function variants(right) {
  const out = new Set();
  const m = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u.exec(right);
  const [pre, w, post] = [m[1], m[2], m[3]];
  if (!w) return [];
  const add = (x) => { if (x && norm(x) !== norm(right)) out.add(x); };
  if (plain(w) !== w) add(pre + plain(w) + post);
  else [...w].forEach((c, i) => { if (ACC[c]) add(pre + w.slice(0, i) + ACC[c] + w.slice(i + 1) + post); });
  for (const [a, b] of SWAPS) if (w.endsWith(a) && w.length > a.length) add(pre + w.slice(0, w.length - a.length) + b + post);
  add(pre + (w[0] === w[0].toUpperCase() ? w[0].toLowerCase() : w[0].toUpperCase()) + w.slice(1) + post);
  if (pre) add(w + post);
  return [...out];
}

/** Choices for one error: the right token plus other plausible forms (authored `alts` first); the shown slip only as a last resort. */
function choicesFor(err, right, options, rng) {
  const shown = norm(err.as);
  const alts = [...(err.alts ?? []), ...shuffle(variants(right).filter((v) => norm(v) !== shown), rng)];
  const more = [...new Set(alts.map(norm))].filter((a) => a !== norm(right));
  return shuffle([right, ...[...more, shown].slice(0, options - 1)], rng);
}

/** Sentence of the CORRECT text that holds word `at` (read aloud as a hint: the wrong version is never spoken). */
export function sentenceOf(words, at) {
  let a = at;
  while (a > 0 && !END.test(words[a - 1])) a--;
  let b = at;
  while (b < words.length - 1 && !END.test(words[b])) b++;
  return words.slice(a, b + 1).join(' ');
}

/** Errors still to fix. `fixed` = word indexes already fixed; without it, the first k in text order (resume). */
export const defaultFixed = (round) => round.errors.slice(0, round.k).map((e) => e.at);
export const remaining = (round, fixed = defaultFixed(round)) => round.errors.filter((e) => !fixed.includes(e.at));

export const countLabel = (n) => (n === 1 ? 'Queda 1' : `Quedan ${n}`);
/** "1 tilde, 2 concordancias" for the errors left. */
export function kindsLabel(errs) {
  const n = {};
  for (const e of errs) n[e.kind] = (n[e.kind] ?? 0) + 1;
  return KINDS.filter((k) => n[k]).map((k) => `${n[k]} ${NAME[k][n[k] > 1 ? 1 : 0]}`).join(', ');
}

function kindOf(err, right) {
  if (err.kind) return err.kind;
  return plain(norm(err.as)).toLowerCase() === plain(right).toLowerCase() ? 'accent' : 'spelling';
}

/** One round per error (plus a closing "perfect" round when allowPerfect), all on the same board. */
export function make(params, _ctx, rng) {
  const rounds = [];
  shuffle(params.texts ?? [], rng).forEach((t, ti) => {
    const bad = checkText(t);
    if (bad) throw new Error(`paragraph-editor text "${String(t?.text).slice(0, 30)}": ${bad}`);
    const clean = wordsOf(t.text);
    const errors = [...t.errors].sort((a, b) => a.at - b.at).map((e) => {
      const kind = kindOf(e, clean[e.at]);
      return { at: e.at, as: norm(e.as), right: clean[e.at], kind, choices: params.fix === 'choice' ? choicesFor(e, clean[e.at], params.options, rng) : [] };
    });
    const words = clean.map((w, i) => errors.find((e) => e.at === i)?.as ?? w);
    const base = {
      textKey: `t${ti}`, total: errors.length, words, clean, errors, fix: params.fix, showCount: params.showCount,
      showKind: params.showKind, allowPerfect: params.allowPerfect, wordIds: [],
    };
    for (let k = 0; k < errors.length; k++) rounds.push({ ...base, k, finish: false });
    if (params.allowPerfect) rounds.push({ ...base, k: errors.length, finish: true });
  });
  return { rounds };
}

/** answer = { at, fix, fixed? } to fix a word, or { perfect: true } for «Ya está perfecto». `fixed` = indexes fixed so far (the board's state). */
export function judge(round, answer) {
  const a = answer !== null && typeof answer === 'object' ? answer : {};
  const say = (correct, es, en) => ({ correct, feedback: { es, en } });
  const left = remaining(round, Array.isArray(a.fixed) ? a.fixed : undefined);
  if (round.finish) {
    return a.perfect ? say(true, '¡Muy bien! El párrafo ya está perfecto.', 'Well done! The paragraph is perfect.')
      : say(false, 'Ya has corregido todo. Pulsa «Ya está perfecto».', 'Everything is fixed. Press the perfect button.');
  }
  if (a.perfect) return say(false, 'Todavía queda algún error. Lee otra vez.', 'There is still a mistake. Read again.');
  const e = left.find((x) => x.at === a.at);
  if (!e) return say(false, 'Esa palabra está bien.', 'That word is fine.');
  const fix = norm(a.fix);
  if (fix === norm(e.right)) return { correct: true, feedback: RULE[e.kind] };
  if (key(fix) === key(e.right)) return say(false, 'Casi: fíjate en las mayúsculas.', 'Nearly: look at the capitals.');
  if (key(fix, 'lenient') === key(e.right, 'lenient')) return say(false, 'Casi: fíjate en la tilde.', 'Nearly: look at the accent mark.');
  return say(false, 'Casi. Prueba otra vez.', 'Nearly. Try again.');
}

/** Level 1: what kind of mistake to look for, and the correct sentence to read aloud. Level 2: the right form of one mistake (the one just tried, else the first). */
export function hint(round, level, lastAnswer) {
  const fixed = Array.isArray(lastAnswer?.fixed) ? lastAnswer.fixed : undefined;
  const left = remaining(round, fixed);
  const target = left.find((e) => e.at === lastAnswer?.at) ?? left[0];
  if (!target) return { level: level >= 2 ? 2 : 1, at: -1, kind: null, answer: '', line: { es: 'Lee todo el párrafo otra vez.', en: 'Read the whole paragraph again.' }, say: null };
  if (level >= 2) return { level: 2, at: target.at, kind: target.kind, answer: target.right, line: LINE[target.kind], say: null };
  return { level: 1, at: -1, kind: target.kind, answer: '', line: LINE[target.kind], say: sentenceOf(round.clean, target.at) };
}
