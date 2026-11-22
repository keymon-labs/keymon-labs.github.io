import test from "node:test";
import assert from "node:assert/strict";
import { midiToFreq, voiceParams } from "../voice.js";

test("A4 is 440 Hz and middle C is 261.63 Hz", () => {
  assert.equal(midiToFreq(69), 440);
  assert.ok(Math.abs(midiToFreq(60) - 261.626) < 0.01);
});

test("harder keys are louder and brighter", () => {
  const soft = voiceParams(60, 30), hard = voiceParams(60, 120);
  assert.ok(hard.peak > soft.peak && hard.cutoff > soft.cutoff);
});

test("high notes die away sooner, within limits", () => {
  assert.ok(voiceParams(84).decay < voiceParams(48).decay);
  for (const m of [21, 60, 108]) { const d = voiceParams(m).decay; assert.ok(d >= 0.5 && d <= 3.5); }
});

test("out-of-range velocity is clamped", () => {
  assert.deepEqual(voiceParams(60, 999), voiceParams(60, 127));
  assert.deepEqual(voiceParams(60, -5), voiceParams(60, 1));
});
