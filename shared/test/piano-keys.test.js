// Checks the on-screen keyboard hit test: white keys, black keys on the top part, edges of the range.
import { test } from "node:test";
import assert from "node:assert/strict";
import { keyAt, whiteKeys } from "../piano-keys.js";

const kb = { x: 0, y: 0, w: 10, h: 40, lo: 60, hi: 72 };   // C4..C5, 8 white keys

test("white keys", () => {
  assert.deepEqual(whiteKeys(60, 72), [60, 62, 64, 65, 67, 69, 71, 72]);
  assert.equal(keyAt(kb, 5, 35), 60);
  assert.equal(keyAt(kb, 75, 35), 72);
});
test("black keys only on the top part, between the right whites", () => {
  assert.equal(keyAt(kb, 9, 10), 61);    // right edge of C → C#
  assert.equal(keyAt(kb, 11, 10), 61);   // left edge of D → C#
  assert.equal(keyAt(kb, 9, 30), 60);    // lower part is still C
  assert.equal(keyAt(kb, 29, 10), 64);   // E has no black key above it
  assert.equal(keyAt(kb, 31, 10), 65);   // nor F on its left
});
test("outside the keyboard", () => {
  assert.equal(keyAt(kb, -1, 10), null);
  assert.equal(keyAt(kb, 81, 10), null);
  assert.equal(keyAt(kb, 5, 41), null);
  assert.equal(keyAt({ ...kb, hi: 71 }, 69, 10), 71);   // right edge of B: no black key there
  assert.equal(keyAt({ ...kb, lo: 59, hi: 69 }, 69, 10), 69); // A with hi = A: no A#
});
