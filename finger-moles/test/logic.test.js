import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRng } from "../../shared/rng.js";
import { handKeys, judge, randomRound, tuneRound, checkTune, starsFor, upTime } from "../logic.js";

const tunes = JSON.parse(readFileSync(new URL("../tunes.json", import.meta.url)));

test("C position: right thumb on C4, left pinky on C3", () => {
  assert.deepEqual(handKeys("R").map((k) => [k.midi, k.finger]), [[60, 1], [62, 2], [64, 3], [65, 4], [67, 5]]);
  assert.deepEqual(handKeys("L").map((k) => [k.midi, k.finger]), [[48, 5], [50, 4], [52, 3], [53, 2], [55, 1]]);
});

test("judge: hit, wrong finger, hand moved", () => {
  assert.equal(judge(64, 64, "R").kind, "hit");
  assert.deepEqual(judge(62, 64, "R"), { kind: "wrong", col: 1 });
  assert.deepEqual(judge(61, 64, "R"), { kind: "away", sameNote: false });   // black key
  assert.deepEqual(judge(76, 64, "R"), { kind: "away", sameNote: true });    // E one octave up
  assert.equal(judge(60, 64, "L").kind, "away");
});

test("random rounds stay under the hand and never repeat a hole", () => {
  for (const hand of ["R", "L"]) for (let seed = 1; seed < 100; seed++) {
    const r = randomRound(createRng(seed), hand, 12), ok = handKeys(hand).map((k) => k.midi);
    assert.equal(r.length, 12);
    r.forEach((m, i) => { assert.ok(ok.includes(m)); if (i) assert.notEqual(m, r[i - 1]); });
  }
});

test("every tune fits the five-finger position, in both hands", () => {
  for (const t of tunes) {
    assert.deepEqual(checkTune(t), [], t.id);
    const lows = handKeys("L").map((k) => k.midi);
    assert.ok(tuneRound(t, "L").every((m) => lows.includes(m)), t.id);
  }
  assert.deepEqual(checkTune({ notes: "C4 A4" }), ["A4"]);
});

test("stars and speed", () => {
  assert.equal(starsFor(10, 10), 3); assert.equal(starsFor(7, 10), 2); assert.equal(starsFor(2, 10), 1);
  assert.ok(upTime(0) > upTime(10) && upTime(200) === 1.1);
});
