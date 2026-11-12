// spell-fill-letters rules: blank the letters of a focus (ñ, rr, r, x, s, h, accent, ü, ¿¡), judge the word. Pure, no DOM.
import { shuffle } from '../../core/generate.js';
import { key, sameWord, FOCI, FOCUSES, FOCUS_CHOICES, ANY_FOCI, PLAIN_ALT, RULES, pickFocus, cased } from '../../core/spelling.js';

export { FOCUS_CHOICES };

// lenient accents would make both options right for these, so they are always strict
const STRICT_FOCI = ['accent', 'ü'];

const DIGRAPH = /rr|ll|ch|qu|gu/gi;

/** One round for one text, or null when the focus has no blank (or no safe alternative) in it. */
function roundFor(text, source, params, poolKeys, rng) {
  const any = params.focus === 'any';
  const focus = any ? 'any' : pickFocus(text, params.focus, source.spell);
  if (!focus) return null;
  const safe = (start, len, o) => !poolKeys.has(key(text.slice(0, start) + o + text.slice(start + len))); // a wrong option must not spell another taught word (perro/pero)
  const cands = (any ? ANY_FOCI : [focus]).flatMap((f) => FOCI[f].find(text).map(([start, len]) => ({ start, len, focus: f })));
  const gaps = [];
  const free = (start, len) => gaps.every((g) => start >= g.start + g.len || start + len <= g.start);
  for (const c of shuffle(cands, rng)) {
    if (gaps.length >= params.gaps) break;
    const answer = text.slice(c.start, c.start + c.len);
    const wrong = FOCI[c.focus].alt(answer.toLowerCase()).map((o) => cased(o, answer)).filter((o) => safe(c.start, c.len, o));
    if (wrong.length && free(c.start, c.len)) gaps.push({ ...c, answer, options: shuffle([answer, ...wrong], rng) });
  }
  if (params.plain && gaps.length < params.gaps) {
    const taken = [...cands, ...[...text.matchAll(DIGRAPH)].map((m) => ({ start: m.index, len: 2 })), ...FOCUSES.flatMap((f) => FOCI[f].find(text).map(([start, len]) => ({ start, len })))];
    const plain = [...text].map((ch, start) => ({ start, len: 1, focus: 'plain', ch })).filter(({ start, ch }) =>
      start > 0 && PLAIN_ALT[ch.toLowerCase()] && taken.every((t) => start < t.start || start >= t.start + t.len));
    for (const c of shuffle(plain, rng)) {
      if (gaps.length >= params.gaps) break;
      const answer = text[c.start];
      const o = cased(PLAIN_ALT[answer.toLowerCase()], answer);
      if (free(c.start, 1) && safe(c.start, 1, o)) gaps.push({ ...c, answer, options: shuffle([answer, o], rng) });
    }
  }
  if (!gaps.length) return null;
  gaps.sort((a, b) => a.start - b.start);
  const cells = [];
  let at = 0;
  for (const g of gaps) {
    for (const ch of text.slice(at, g.start)) cells.push({ ch });
    cells.push({ gap: true, answer: g.answer, options: g.options, focus: g.focus, rule: RULES[g.focus] });
    at = g.start + g.len;
  }
  for (const ch of text.slice(at)) cells.push({ ch });
  const emoji = source.emoji ?? '';
  return {
    word: text, answer: text, cells, focus: gaps[0].focus, accents: gaps.some((g) => STRICT_FOCI.includes(g.focus)) ? 'strict' : params.accents, mode: params.mode, rule: RULES[gaps[0].focus],
    prompt: { es: emoji || '', en: source.en ?? emoji }, emoji, wordIds: source.id ? [source.id] : [],
  };
}

export function make(params, { targets, pool }, rng) {
  const poolKeys = new Set(pool.map((w) => key(w.es)));
  const sources = targets.length ? targets : (params.items ?? []);
  const rounds = sources.map((s) => {
    poolKeys.delete(key(s.es)); // the target itself is of course allowed
    const r = roundFor(s.es, s, params, poolKeys, rng);
    poolKeys.add(key(s.es));
    return r;
  }).filter(Boolean);
  return { rounds };
}


/** Index (among the gaps) of the first gap lastAnswer got wrong; 0 when it cannot tell. */
function firstWrongGap(round, lastAnswer) {
  const last = String(lastAnswer ?? '');
  let i = 0;
  let g = 0;
  for (const c of round.cells) {
    const len = c.gap ? c.answer.length : 1;
    if (c.gap && key(last.slice(i, i + len), round.accents) !== key(c.answer, round.accents)) return g;
    if (c.gap) g++;
    i += len;
  }
  return 0;
}

const ruleOf = (round, gap) => round.cells.filter((c) => c.gap)[gap]?.rule ?? round.rule;

export function judge(round, answer) {
  const correct = sameWord(answer, round.word, round.accents);
  const rule = correct ? round.rule : ruleOf(round, firstWrongGap(round, answer));
  return correct
    ? { correct, feedback: { es: `¡Muy bien! ${rule.es}`, en: `Well done! ${rule.en}` } }
    : { correct, feedback: { es: `Casi. ${rule.es}`, en: `Nearly. ${rule.en}` } };
}

/** Level 1 is only a nudge: which gap to look at, and (choice mode, 3+ options) one wrong option to grey out; a first letter only when the gap has two. Level 2: the whole word. */
export function hint(round, level, lastAnswer) {
  if (level >= 2) return { level: 2, answer: round.word };
  const gap = firstWrongGap(round, lastAnswer);
  const cell = round.cells.filter((c) => c.gap)[gap];
  return {
    level: 1, gap, rule: cell.rule ?? round.rule,
    first: cell.answer.length > 1 ? cell.answer[0] : null,
    remove: cell.options.length > 2 ? cell.options.find((o) => o !== cell.answer) : null,
  };
}
