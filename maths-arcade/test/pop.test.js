// Pop rules and level data. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/rng.js';
import { makeBoard, bubbles, remaining, touching, removePair, findMove, isCorrect, hint } from '../games/pop/logic.js';
import levels from '../games/pop/levels.json' with { type: 'json' };

test('every level is well formed', () => {
  const ids = new Set();
  for (const l of levels) {
    assert.ok(l.id && l.title, 'id and title');
    assert.ok(!ids.has(l.id), `duplicate id ${l.id}`);
    ids.add(l.id);
    assert.ok(l.cols >= 2 && l.rows >= 2 && (l.cols * l.rows) % 2 === 0, `${l.id}: even board`);
    assert.ok(l.max >= 2 && l.max <= 12, `${l.id}: max`);
    assert.ok(l.tables.every((t) => t >= 1 && t <= l.max), `${l.id}: tables within 1..max`);
    const board = makeBoard(l, createRng(3));
    assert.equal(remaining(board), l.cols * l.rows);
    assert.ok(bubbles(board).every((b) => b.n >= 1 && b.n <= l.max && b.n * b.n <= 999), `${l.id}: numbers`);
  }
});

test('focus tables show up often', () => {
  const board = makeBoard({ cols: 8, rows: 6, tables: [7], max: 12 }, createRng(1));
  const sevens = bubbles(board).filter((b) => b.n === 7).length;
  assert.ok(sevens >= 24, `only ${sevens} sevens out of 48`);
});

test('odd boards are refused', () => {
  assert.throws(() => makeBoard({ cols: 3, rows: 3 }, createRng(1)), /even/);
});

test('popping drops bubbles and closes empty columns', () => {
  const mk = (n) => ({ id: n, n, size: 1, c: 0, r: 0 });
  const [a, b, c, d, e] = [1, 2, 3, 4, 5].map(mk);
  const board = { stacks: [[a, b], [c], [d, e]] };
  removePair(board, a, c);              // column 2 empties and closes; b falls to the bottom
  assert.deepEqual(board.stacks.map((s) => s.map((x) => x.n)), [[2], [4, 5]]);
  assert.deepEqual([b.c, b.r, d.c, d.r, e.c, e.r], [0, 0, 1, 0, 1, 1]);
  assert.ok(touching(b, d) && touching(b, e), 'diagonals count');
  assert.ok(!touching(d, d));
});

test('the typed product decides', () => {
  const a = { n: 7 }, b = { n: 8 };
  assert.ok(isCorrect(a, b, 56));
  assert.ok(!isCorrect(a, b, 54));
  assert.equal(hint({ n: 7 }, { n: 8 }), 'Count in 7s: 7, 14, 21, 28…');
});

test('a board can never get stuck: random play always clears it', () => {
  for (const level of levels) {
    for (let seed = 1; seed <= 40; seed++) {
      const rng = createRng(seed);
      const board = makeBoard(level, rng);
      while (remaining(board) > 0) {
        assert.equal(remaining(board) % 2, 0, 'count stays even');
        const pairs = [];
        const all = bubbles(board);
        for (const a of all) for (const b of all) if (a.id < b.id && touching(a, b)) pairs.push([a, b]);
        assert.ok(pairs.length > 0 && findMove(board), `${level.id}/${seed}: no move with ${remaining(board)} left`);
        removePair(board, ...rng.pick(pairs));
      }
    }
  }
});
