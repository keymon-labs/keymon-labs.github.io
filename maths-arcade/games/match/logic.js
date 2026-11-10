// Match rules, no DOM. Result balls come from products of pairs that really touch right now,
// so there is always at least one right answer in the funnel.

/** Is there a touching pair ({ a, b }, balls with .n) that multiplies to `value`? */
export const pairFor = (pairs, value) => pairs.find(({ a, b }) => a.n * b.n === value) ?? null;

/**
 * Keep the current result values that still have a pair (or that `keep` says to hold on to),
 * then top up to `count` distinct values taken from random touching pairs.
 */
export function refillTargets(current, pairs, count, rng, keep = () => false) {
  const have = current.filter((v) => pairFor(pairs, v) || keep(v));
  const pool = [...new Set(pairs.map(({ a, b }) => a.n * b.n))].filter((v) => !have.includes(v));
  while (have.length < count && pool.length) have.push(...pool.splice(rng.int(0, pool.length - 1), 1));
  return have;
}
