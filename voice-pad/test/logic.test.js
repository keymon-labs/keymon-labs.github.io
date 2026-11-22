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

import { parseTune, planSong, eventAt, sampleAt, consonantClass, vowelById } from "../logic.js";
const syls = (n, ends = []) => Array.from({ length: n }, (_, i) => ({ text: "la", onset: "l", vowels: ["ah"], wordEnd: true, phraseEnd: ends.includes(i) }));

test("parseTune reads notes and beats", () => {
  assert.deepEqual(parseTune("C4 G4:2"), [{ midi: 60, beats: 1 }, { midi: 67, beats: 2 }]);
});

test("a tune is moved by octaves into the voice and repeats over long text", () => {
  const tune = parseTune("C4 C4 G4 G4 A4 A4 G4:2"), ev = planSong(syls(20), tune, { voice: "bass", bpm: 120 });
  assert.equal(ev.length, 20);
  assert.ok(ev[0].midi >= 36 && ev[0].midi <= 60 && ev[0].midi % 12 === 0, "twinkle sits in the bass range");
  assert.equal(ev[0].midi, ev[tune.length].midi);
  assert.equal(planSong(syls(1), tune, { voice: "soprano", bpm: 120 })[0].midi, 72);
});

test("tempo sets the timing: 120 bpm is half a second per beat; a tune keeps its own rests", () => {
  const ev = planSong(syls(3, [0]), parseTune("C4 D4:2 E4"), { voice: "tenor", bpm: 120 });
  assert.deepEqual(ev.map((e) => [e.start, e.dur]), [[0, 0.5], [0.5, 1], [1.5, 0.5]]);
});

test("plain text has no guide notes, one beat per syllable and half a beat of rest at a phrase end", () => {
  const ev = planSong(syls(3, [1]), null, { voice: "tenor", bpm: 60 });
  assert.deepEqual(ev.map((e) => [e.midi, e.start]), [[null, 0], [null, 1], [null, 2.5]]);
});

test("eventAt finds the sounding syllable, rests give -1", () => {
  const ev = planSong(syls(3, [1]), null, { voice: "tenor", bpm: 60 });
  assert.deepEqual([-0.1, 0, 0.99, 1.2, 2.2, 2.5, 3.4, 3.5].map((t) => eventAt(ev, t)), [-1, 0, 0, 1, -1, 2, 2, -1]);
});

test("sampleAt returns the latest sample at or before t", () => {
  const s = [{ t: 0, d: 1 }, { t: 1, d: 0 }, { t: 2, d: 1 }];
  assert.equal(sampleAt(s, -1), null);
  assert.equal(sampleAt(s, 0.5).t, 0);
  assert.equal(sampleAt(s, 1).t, 1);
  assert.equal(sampleAt(s, 9).t, 2);
  assert.equal(sampleAt([], 1), null);
});

test("consonant classes and vowel lookup", () => {
  assert.equal(consonantClass("str"), "sibilant");
  assert.equal(consonantClass("hm"), "breath");
  assert.equal(consonantClass("k"), "plosive");
  assert.equal(consonantClass("m"), null);
  assert.equal(consonantClass(""), null);
  assert.deepEqual(vowelById("ah").f, [800, 1150, 2900]);
});
