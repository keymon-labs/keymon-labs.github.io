// odd-one-out rules: a cloud of words from one category plus one intruder; tap the intruder. Pure, no DOM.
import { shuffle } from '../../core/generate.js';

const key = (s) => s.trim().toLowerCase();
const round = (members, odd, rng, { theme = null, wordIds = [] } = {}) => ({
  options: shuffle([...members, odd], rng), answer: odd.id, theme, wordIds,
});

/** Authored groups: { words: [es...], odd: es, theme?: es }. A group with fewer than 2 distinct members, or whose intruder repeats a member, is skipped. */
function fromGroups(groups, size, rng) {
  const out = [];
  for (const g of groups) {
    const words = [...new Set(g.words.map(key))];
    if (words.length < 2 || words.includes(key(g.odd))) continue;
    const members = shuffle(words, rng).slice(0, size - 1).map((es) => ({ id: es, es }));
    out.push(round(members, { id: key(g.odd), es: g.odd.trim() }, rng, { theme: g.theme ?? null }));
  }
  return out;
}

/** Vocab mode: each target is the intruder among words of a topic it does not share. Targets with no such topic are skipped. */
function fromTargets(targets, pool, size, rng) {
  const out = [];
  const o = (p) => ({ id: p.id, es: p.es, emoji: p.emoji ?? '' });
  for (const w of targets) {
    const byTag = new Map();
    for (const p of pool) {
      if (p.id === w.id || p.es === w.es || p.tags?.some((t) => w.tags?.includes(t))) continue;
      for (const t of p.tags ?? []) byTag.set(t, [...(byTag.get(t) ?? []), p]);
    }
    const ok = [...byTag.keys()].sort().filter((t) => new Set(byTag.get(t).map((p) => p.es)).size >= size - 1);
    if (!ok.length) continue;
    const seen = new Set();
    const members = shuffle(byTag.get(rng.pick(ok)), rng).filter((p) => !seen.has(p.es) && seen.add(p.es)).slice(0, size - 1);
    out.push(round(members.map(o), o(w), rng, { wordIds: [w.id, ...members.map((m) => m.id)] }));
  }
  return out;
}

export function make(params, { targets, pool }, rng) {
  return { rounds: params.groups ? fromGroups(params.groups, params.size, rng) : fromTargets(targets, pool, params.size, rng) };
}

export function judge(round, answer) {
  const correct = answer === round.answer;
  return { correct, feedback: correct ? { es: '¡Muy bien!', en: 'Well done!' } : { es: 'Casi. Prueba otra vez.', en: 'Nearly. Try again.' } };
}

/** Level 1 (a nudge): grey out a wrong word when 4+ are shown, else show the group's theme if it has one; level 2 shows the answer. */
export function hint(round, level, lastAnswer) {
  if (level >= 2) return { level: 2, answer: round.answer };
  const remove = round.options.length >= 4 ? (round.options.find((o) => o.id !== round.answer && o.id !== lastAnswer)?.id ?? null) : null;
  return { level: 1, remove, theme: remove ? null : round.theme };
}
