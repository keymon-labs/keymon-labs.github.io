// Skill generators: pure functions that make one maths problem.
// Game-agnostic: a mini game decides how a problem looks and what the answer does.
// Every generator returns plain data with an integer `answer`.

const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

/** a × b where a comes from `tables` and b is 1..maxFactor (b >= minFactor). */
export function multiplication(rng, { tables = range(2, 12), minFactor = 1, maxFactor = 12 } = {}) {
  const a = rng.pick(tables);
  const b = rng.int(minFactor, maxFactor);
  return { a, b, answer: a * b };
}

/** a + b with a >= minA, minB <= b <= maxB and a + b <= max. */
export function addition(rng, { max = 100, minA = 1, minB = 1, maxB = max } = {}) {
  const b = rng.int(minB, Math.min(maxB, max - minA));
  const a = rng.int(minA, max - b);
  return { a, b, answer: a + b };
}

/** a − b with minB <= b and b + minGap <= a <= max. */
export function subtraction(rng, { max = 100, minB = 1, minGap = 1 } = {}) {
  const a = rng.int(minB + minGap, max);
  const b = rng.int(minB, a - minGap);
  return { a, b, answer: a - b };
}

/** numerator/denominator of `whole`, with whole a multiple of the denominator. */
export function fractionOf(rng, { denominators = [2, 4], minWhole = 4, maxWhole = 12, unitOnly = false } = {}) {
  const valid = denominators.filter((d) => wholesFor(d, minWhole, maxWhole).length);
  if (!valid.length) throw new Error('fractionOf: no whole fits the denominators');
  const denominator = rng.pick(valid);
  const whole = rng.pick(wholesFor(denominator, minWhole, maxWhole));
  const numerator = unitOnly ? 1 : rng.int(1, denominator - 1);
  return { numerator, denominator, whole, answer: (whole / denominator) * numerator };
}

function wholesFor(d, lo, hi) {
  return range(Math.max(lo, d), hi).filter((w) => w % d === 0);
}

/** Pretty fraction like "¾" when a Unicode glyph exists, else "3/4". */
export function fractionText(n, d) {
  const glyphs = { '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾', '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘', '1/6': '⅙', '5/6': '⅚', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞', '1/10': '⅒' };
  return glyphs[`${n}/${d}`] ?? `${n}/${d}`;
}
