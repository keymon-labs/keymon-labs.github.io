// Checks the five-finger-position fingering and the built-in songs' hand moves.
import { test } from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { assignFingers } from "../fingering.js";
import { toMidi, stepOf } from "../../shared/music.js";
const SONGS = JSON.parse(readFileSync(new URL("../songs.json", import.meta.url)));

const run = (notes) => assignFingers(notes.map(([n, , , f]) => { const midi = toMidi(n); return { midi, step: stepOf(midi), finger: f }; }));

test("C position: RH thumb on C4, LH pinky on C3", () => {
  assert.deepEqual(run([["C4"], ["G4"], ["C3"], ["G3"]]).map(x => x.hand + x.finger), ["R1", "R5", "L5", "L1"]);
});

test("a note past the pinky moves the hand once, then stays", () => {
  const r = run([["C4"], ["G4"], ["A4"], ["G4"], ["D4"], ["C4"]]);
  assert.deepEqual(r.map(x => x.finger), [1, 5, 5, 4, 1, 1]);
  assert.deepEqual(r.map(x => x.move), [0, 0, 1, 0, 0, -1]);
});

test("built-in songs: no finger outside 1-5, and the same finger never plays two different keys in a row without a move", () => {
  for (const s of SONGS) {
    const r = run(s.notes);
    r.forEach((x, i) => {
      assert.ok(x.finger >= 1 && x.finger <= 5, s.id);
      const p = r[i - 1], a = s.notes[i - 1], b = s.notes[i];
      if (p && p.hand === x.hand && p.finger === x.finger && a[0] !== b[0]) assert.ok(x.move, `${s.id} note ${i}`);
    });
  }
});

test("Twinkle moves the hand only at the C-G leap and at the phrase break", () => {
  const r = run(SONGS.find(s => s.id === "twinkle").notes);
  assert.deepEqual(r.map(x => x.finger), [1, 1, 4, 4, 5, 5, 4, 4, 4, 3, 3, 2, 2, 1]);
  assert.deepEqual(r.flatMap((x, i) => x.move ? [i] : []), [2, 7]);
});
