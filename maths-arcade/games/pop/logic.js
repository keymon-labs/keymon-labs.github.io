// Pop and Match rules that are not physics, no DOM: ball sizes and numbers, scoring, hints.
// Physics lives in world.js, drawing in scene.js.

export const R_MIN = 30, R_MAX = 46;

/** Ball radius: the smallest number is the smallest ball, `max` the biggest. A soft curve, not proportional. */
export const radiusFor = (n, max) => R_MIN + (R_MAX - R_MIN) * Math.pow((n - 1) / Math.max(1, max - 1), 0.75);

/** `balls` numbers 1..max. About 60% come from `tables` so those tables get practised. */
export function makeNumbers({ balls, tables = [], max = 12 }, rng) {
  if (balls % 2) throw new Error('pop: ball count must be even');
  const pool = tables.length ? tables : Array.from({ length: max }, (_, i) => i + 1);
  return Array.from({ length: balls }, () => (rng.next() < 0.6 ? rng.pick(pool) : rng.int(1, max)));
}

export const isCorrect = (a, b, value) => value === a.n * b.n;

/** Points for popping a pair: harder products are worth more; a streak of first-try pops adds up to +100%. */
export const points = (a, b, streak) => Math.round((10 + a.n * b.n) * (1 + 0.2 * Math.min(streak, 5)));

export function hint(a, b) {
  const steps = Array.from({ length: Math.min(b.n, 4) }, (_, i) => a.n * (i + 1)).join(', ');
  return `Count in ${a.n}s: ${steps}…`;
}
