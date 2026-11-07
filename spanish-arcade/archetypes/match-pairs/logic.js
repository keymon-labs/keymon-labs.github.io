// match-pairs rules: a board of pairs joined by the child; the whole pairing is one composite answer. Pure, no DOM.
// answer = [[leftId, rightId], ...]; every pair has an id ("p0"...) used for its left item and its right item.
import { shuffle } from '../../core/generate.js';

const MODES = {
  // [usable word, left text, right text]
  'word-picture': (w) => w.emoji && [w.es, w.emoji],
  'article-noun': (w) => w.pos === 'noun' && w.article && [w.es, w.article],
};

/** Unique lefts (and rights, unless dupRight: several nouns share "el"), blanks dropped. */
function clean(list, dupRight) {
  const a = new Set();
  const b = new Set();
  return list.filter(([x, y]) => x?.trim() && y?.trim() && !a.has(x) && (dupRight || !b.has(y)) && a.add(x) && b.add(y));
}

/** Boards of `size`; a lone leftover joins the last board, and fewer than 2 pairs makes no board. */
function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  if (out.length > 1 && out.at(-1).length < 2) { const last = out.pop(); out.at(-1).push(...last); }
  return out.filter((c) => c.length >= 2);
}

function board(pairs, wordIds, rng) {
  const ps = pairs.map(([a, b], i) => ({ id: `p${i}`, a, b }));
  const left = shuffle(ps.map((p) => p.id), rng);
  let right = shuffle(ps.map((p) => p.id), rng);
  if (right.every((id, i) => id === left[i])) right = [...right.slice(1), right[0]]; // never an already-solved board
  return { pairs: ps, left, right, wordIds };
}

export function make(params, { targets }, rng) {
  if (params.pairs) {
    const pairs = clean(params.pairs.map((p) => [p.a, p.b]), false);
    return { rounds: pairs.length >= 2 ? [board(pairs, [], rng)] : [] };
  }
  const use = MODES[params.mode];
  const dupRight = params.mode === 'article-noun';
  const rows = targets.map((w) => ({ w, p: use(w) })).filter((r) => r.p);
  const ok = clean(rows.map((r) => r.p), dupRight);
  const kept = rows.filter((r) => ok.includes(r.p));
  return { rounds: chunk(kept, params.size).map((c) => board(c.map((r) => r.p), c.map((r) => r.w.id), rng)) };
}

const rightOf = (round, id) => round.pairs.find((p) => p.id === id);

/** Left ids in `answer` joined to a right item with different text (equal texts are interchangeable). */
export function wrongLefts(round, answer) {
  if (!Array.isArray(answer)) return [];
  return answer.filter(([l, r]) => rightOf(round, l)?.b !== rightOf(round, r)?.b).map(([l]) => l);
}

export function judge(round, answer) {
  const lefts = Array.isArray(answer) ? answer.map(([l]) => l) : [];
  const correct = lefts.length === round.pairs.length && new Set(lefts).size === lefts.length
    && round.pairs.every((p) => lefts.includes(p.id)) && wrongLefts(round, answer).length === 0;
  return { correct, feedback: correct ? { es: '¡Muy bien!', en: 'Well done!' } : { es: 'Casi. Hay pares mal unidos.', en: 'Nearly. Some pairs are wrong.' } };
}

/** Level 1 (a nudge): which left items are joined wrongly, so they can be unjoined. Level 2: also one correct pair to lock. */
export function hint(round, level, lastAnswer) {
  const wrong = wrongLefts(round, lastAnswer);
  if (level < 2) return { level: 1, wrong };
  const l = wrong[0] ?? round.pairs.find((p) => !(Array.isArray(lastAnswer) && lastAnswer.some(([x]) => x === p.id)))?.id ?? round.pairs[0].id;
  return { level: 2, pair: [l, l] };
}
