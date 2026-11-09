// Pop rules, no DOM. The board is columns (stacks) of bubbles, bottom first.
// Type the product of two touching bubbles and both vanish; the rest fall and empty
// columns close up. Closing up keeps the bottom row unbroken, so all bubbles stay
// connected: with an even count there is always a move and the board can always be cleared.

let nextId = 0;

/** cols × rows bubbles numbered 1..max. About 60% come from `tables` so those tables get practised. */
export function makeBoard({ cols, rows, tables = [], max = 12 }, rng) {
  if ((cols * rows) % 2) throw new Error('pop: cols × rows must be even');
  const pool = tables.length ? tables : Array.from({ length: max }, (_, i) => i + 1);
  const bubble = () => ({
    id: nextId++,
    n: rng.next() < 0.6 ? rng.pick(pool) : rng.int(1, max),
    size: 0.72 + rng.next() * 0.26, // bubbles differ in size; purely cosmetic
    c: 0, r: 0,
  });
  const board = { stacks: Array.from({ length: cols }, () => Array.from({ length: rows }, bubble)) };
  settle(board);
  return board;
}

/** Close empty columns and refresh each bubble's column (c) and height (r). */
export function settle(board) {
  board.stacks = board.stacks.filter((s) => s.length);
  board.stacks.forEach((s, c) => s.forEach((b, r) => { b.c = c; b.r = r; }));
}

export const bubbles = (board) => board.stacks.flat();
export const remaining = (board) => bubbles(board).length;

/** Next to each other, diagonals included. */
export const touching = (a, b) => a !== b && Math.max(Math.abs(a.c - b.c), Math.abs(a.r - b.r)) === 1;

export const isCorrect = (a, b, value) => value === a.n * b.n;

export function removePair(board, a, b) {
  for (const s of board.stacks) for (const x of [a, b]) { const i = s.indexOf(x); if (i >= 0) s.splice(i, 1); }
  settle(board);
}

/** Any touching pair, or null. */
export function findMove(board) {
  const all = bubbles(board);
  for (const a of all) for (const b of all) if (touching(a, b)) return [a, b];
  return null;
}

export function hint(a, b) {
  const steps = Array.from({ length: Math.min(b.n, 4) }, (_, i) => a.n * (i + 1)).join(', ');
  return `Count in ${a.n}s: ${steps}…`;
}
