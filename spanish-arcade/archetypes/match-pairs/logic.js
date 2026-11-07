// match-pairs rules: a board of pairs joined by the child; the whole pairing is one composite answer. Pure, no DOM.
// answer = [[leftId, rightId], ...]; every pair has an id ("p0"...) used for its left item and its right item.
import { shuffle } from '../../core/generate.js';

const MODES = {
  // [usable word, left text, right text]
  'word-picture': (w) => w.emoji && [w.es, w.emoji],
  'article-noun': (w) => w.pos === 'noun' && w.article && [w.es, w.article],
};

export const MAX_PAIRS = 6;

/** Rows { p: [left, right], ... } with trimmed texts; unique lefts (and rights, unless dupRight: several nouns share "el"), compared lowercase; blanks dropped. */
function clean(rows, dupRight) {
  const a = new Set();
  const b = new Set();
  const key = (s) => s.toLowerCase();
  return rows.filter((r) => r.p[0]?.trim() && r.p[1]?.trim()).map((r) => ({ ...r, p: [r.p[0].trim(), r.p[1].trim()] }))
    .filter(({ p: [x, y] }) => !a.has(key(x)) && (dupRight || !b.has(key(y))) && a.add(key(x)) && b.add(key(y)));
}

/** Balanced boards of at most `size` (never above 6): item i goes to board i % k, so no board is a lone leftover or over-full. */
function deal(rows, size) {
  if (rows.length < 2) return [];
  const k = Math.min(Math.ceil(rows.length / Math.min(size, MAX_PAIRS)), Math.floor(rows.length / 2));
  const boards = Array.from({ length: k }, () => []);
  rows.forEach((r, i) => boards[i % k].push(r));
  return boards;
}

function board(pairs, wordIds, rng, mode) {
  const ps = pairs.map(([a, b], i) => ({ id: `p${i}`, a, b }));
  const left = shuffle(ps.map((p) => p.id), rng);
  let right = shuffle(ps.map((p) => p.id), rng);
  if (right.every((id, i) => id === left[i])) right = [...right.slice(1), right[0]]; // never an already-solved board
  return { mode, pairs: ps, left, right, wordIds };
}

export function make(params, { targets }, rng) {
  if (params.pairs) {
    if (params.pairs.length > MAX_PAIRS) throw new Error(`match-pairs: at most ${MAX_PAIRS} pairs per board (got ${params.pairs.length})`);
    const pairs = clean(params.pairs.map((p) => ({ p: [p.a, p.b] })), false).map((r) => r.p);
    return { rounds: pairs.length >= 2 ? [board(pairs, [], rng, null)] : [] };
  }
  const article = params.mode === 'article-noun';
  const use = MODES[params.mode];
  let kept = clean(targets.map((w) => ({ w, p: use(w) || [] })), article);
  if (article) kept = kept.sort((x, y) => x.p[1].localeCompare(y.p[1])); // same articles are dealt to different boards
  const boards = deal(kept, params.size).filter((c) => !article || new Set(c.map((r) => r.p[1])).size >= 2); // an article board needs 2 different articles
  return { rounds: boards.map((c) => board(c.map((r) => r.p), c.map((r) => r.w.id), rng, params.mode)) };
}

const rightOf = (round, id) => round.pairs.find((p) => p.id === id);

/** Left ids in `answer` joined to a right item with different text (equal texts are interchangeable). */
export function wrongLefts(round, answer) {
  if (!Array.isArray(answer)) return [];
  return answer.filter(([l, r]) => rightOf(round, l)?.b !== rightOf(round, r)?.b).map(([l]) => l);
}

export function judge(round, answer) {
  const ok = Array.isArray(answer);
  const lefts = ok ? answer.map(([l]) => l) : [];
  const rights = ok ? answer.map(([, r]) => r) : [];
  const correct = ok && lefts.length === round.pairs.length && new Set(lefts).size === lefts.length && new Set(rights).size === rights.length
    && round.pairs.every((p) => lefts.includes(p.id) && rights.includes(p.id)) && wrongLefts(round, answer).length === 0;
  return { correct, feedback: correct ? { es: '¡Muy bien!', en: 'Well done!' } : { es: 'Casi. Hay pares mal unidos.', en: 'Nearly. Some pairs are wrong.' } };
}

/** Level 1 (a nudge): only how many pairs were wrong (mount unjoins everything). Level 2: also one correct pair to lock. */
export function hint(round, level, lastAnswer) {
  const wrong = wrongLefts(round, lastAnswer);
  if (level < 2) return { level: 1, wrongCount: wrong.length };
  const l = wrong[0] ?? round.pairs.find((p) => !(Array.isArray(lastAnswer) && lastAnswer.some(([x]) => x === p.id)))?.id ?? round.pairs[0].id;
  return { level: 2, wrongCount: wrong.length, pair: [l, l] };
}
