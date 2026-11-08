// Brick Beats music rules: colour → note, fruit rhythms from brick lengths.
import test from "node:test";
import assert from "node:assert/strict";
import { COLOURS, FRUITS, BEATS_PER_STUD, semitone, midiOf, pitchLabel, hz, annotateFruits, fruitCounts } from "../rhythm.js";
import { NAMES } from "../vision.js";

const lane = (...bricks) => ({ bricks: bricks.map(([len, start]) => ({ len, start })) });
const fruitsOf = (tr) => tr.bricks.map((b) => (b.fruit ? `${b.fruit}${b.fruitLead ? "" : "(2nd)"}` : null));

test("colour list matches the colours the photo reader returns", () => {
  assert.deepEqual(COLOURS.map((c) => c.id), NAMES);
});

test("colours walk up the scale and wrap round it", () => {
  assert.equal(semitone(0, "pent"), 0);
  assert.equal(semitone(4, "pent"), 9);
  assert.equal(semitone(5, "pent"), 0, "sixth colour wraps to the key note");
  assert.equal(midiOf("pluck", 0, "pent", 0), 60);
  assert.equal(midiOf("pluck", 2, "major", 2), 66, "key D, third colour of the major scale");
});

test("note names and frequencies", () => {
  assert.equal(pitchLabel(60), "C4");
  assert.equal(pitchLabel(61), "C♯4");
  assert.equal(hz(69), 440);
});

test("two studs are one beat", () => {
  assert.equal(2 * BEATS_PER_STUD, 1);
});

test("single bricks: plum, apple, banana, watermelon; odd lengths are not a fruit", () => {
  const tr = lane([2, 0], [4, 3], [6, 8], [8, 15], [3, 24]);
  annotateFruits([tr]);
  assert.deepEqual(fruitsOf(tr), ["plum", "apple", "banana", "watermelon", null]);
});

test("coconut is 2 beats then 1 touching; blueberry is 1 then 2 touching", () => {
  const a = lane([4, 0], [2, 4]), b = lane([2, 0], [4, 2]);
  annotateFruits([a, b]);
  assert.deepEqual(fruitsOf(a), ["coconut", "coconut(2nd)"]);
  assert.deepEqual(fruitsOf(b), ["blueberry", "blueberry(2nd)"]);
});

test("the same bricks with a gap between are two separate fruits", () => {
  const tr = lane([4, 0], [2, 5]);
  annotateFruits([tr]);
  assert.deepEqual(fruitsOf(tr), ["apple", "plum"]);
});

test("fruit counts count a pattern once, however many bricks it uses", () => {
  const tr = lane([4, 0], [2, 4], [2, 8], [2, 11]);
  annotateFruits([tr]);
  assert.deepEqual(fruitCounts([tr]), { coconut: 1, plum: 2 });
});

test("every fruit pattern is made of whole beats", () => {
  for (const f of FRUITS) assert.ok(f.beats.every((d) => Number.isInteger(d) && d > 0), f.id);
});
