import { test } from "node:test";
import assert from "node:assert/strict";
import { VOICES, SCALES, VOWELS, xToMidi, yToVowel, scaleNotes, register, midiToHz, vibratoCents } from "../logic.js";

test("A4 is 440 Hz and an octave doubles", () => {
  assert.equal(midiToHz(69), 440);
  assert.ok(Math.abs(midiToHz(81) - 880) < 1e-9);
});

test("x spans the voice range, snapped to the scale", () => {
  for (const voice of Object.keys(VOICES)) for (const scale of Object.keys(SCALES)) {
    const { lo, hi } = VOICES[voice], notes = scaleNotes(scale, lo, hi);
    for (let x = -0.2; x <= 1.2; x += 0.01) {
      const m = xToMidi(x, voice, scale);
      assert.ok(m >= lo && m <= hi, `${voice} ${scale} x=${x} gave ${m}`);
      if (notes.length) assert.ok(notes.includes(m));
    }
  }
  assert.equal(xToMidi(0, "soprano", "free"), 60);
  assert.equal(xToMidi(1, "soprano", "free"), 84);
});

test("pentatonic notes are C D E G A only", () => {
  const names = new Set(scaleNotes("pentatonic", 60, 83).map((m) => m % 12));
  assert.deepEqual([...names].sort((a, b) => a - b), [0, 2, 4, 7, 9]);
});

test("y runs oo to ee and blends in between", () => {
  assert.equal(yToVowel(0).id, "oo");
  assert.equal(yToVowel(0.5).id, "ah");
  assert.equal(yToVowel(1).id, "ee");
  assert.deepEqual(yToVowel(2).f, VOWELS[4].f);
  const mid = yToVowel(0.125).f;
  assert.ok(mid[0] > 300 && mid[0] < 570);
});

test("register thirds", () => {
  assert.equal(register(40, "bass"), "chest");
  assert.equal(register(52, "bass"), "mixed");
  assert.equal(register(64, "bass"), "head");
});

test("vibrato fades with finger speed", () => {
  assert.equal(vibratoCents(0), 25);
  assert.equal(vibratoCents(5), 0);
  assert.ok(vibratoCents(0.4) < 25);
});
