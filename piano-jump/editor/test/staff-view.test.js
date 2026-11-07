// Checks for tap hit-testing and layout: which beat, staff and pitch a tap means, and what a tap on an existing note does.
import test from "node:test";
import assert from "node:assert/strict";
import { layout, hit, yOf, render, BW } from "../staff-view.js";
import { newSong, place, stepToPitch } from "../song-model.js";

const view = { bass: true, stepH: 12 };
const song = (notes = []) => { let s = newSong(); for (const [start, pitch, beats = 1, staff = "treble"] of notes) s = place(s, { start, pitch, beats, staff }).song; return s; };
const at = (g, beat, staff, step) => [g.x0 + beat * BW + 10, yOf(g, staff, step)];

test("an empty tap gives the grid beat, staff and pitch line/space under the finger", () => {
  const s = song(), g = layout(s, view);
  for (const [beat, staff, step, pitch] of [[0, "treble", 2, "E4"], [2.5, "treble", 10, "F5"], [3, "treble", 0, "C4"], [1, "bass", -10, "G2"], [1.5, "bass", -2, "A3"]]) {
    const [x, y] = at(g, beat, staff, step), h = hit(g, s, x, y);
    assert.deepEqual([h.kind, h.beat, h.staff, h.step], ["empty", beat, staff, step]);
    assert.equal(stepToPitch(h.step), pitch);
  }
});

test("taps snap to the half-beat grid and ignore the margin and the gap between staves", () => {
  const g = layout(song(), view);
  assert.equal(hit(g, song(), g.x0 + BW * 1.49, yOf(g, "treble", 4)).beat, 1);
  assert.equal(hit(g, song(), g.x0 + BW * 1.5, yOf(g, "treble", 4)).beat, 1.5);
  assert.equal(hit(g, song(), 10, yOf(g, "treble", 4)).kind, "none");
  assert.equal(hit(g, song(), g.x0 + 20, (g.tBot + g.bTop) / 2).kind, "none");
  assert.equal(hit({ ...g, bass: false }, song(), g.x0 + 20, yOf(g, "bass", -4)).kind, "none");
});

test("tapping a note: head cycles, just above/below set the stem, far away does nothing", () => {
  const s = song([[0, "G4"]]), g = layout(s, view), [x, y] = at(g, 0, "treble", 4);
  assert.deepEqual(hit(g, s, x, y), { kind: "note", index: 0, zone: "head" });
  assert.equal(hit(g, s, x, y + 0.9 * g.stepH).zone, "head");
  assert.equal(hit(g, s, x, y - 2.5 * g.stepH).zone, "above");
  assert.equal(hit(g, s, x, y + 2.5 * g.stepH).zone, "below");
  assert.equal(hit(g, s, x, y + 6 * g.stepH).kind, "none");
  assert.equal(hit(g, s, x + BW * 0.4, y).kind, "note");                // the rest of its beat is still the note
  assert.equal(hit(g, s, x + BW * 1.1, y).kind, "empty");
});

test("a long note owns its whole column; a rest is tappable anywhere on its staff", () => {
  const s = song([[0, "C4", 2], [2, null]]), g = layout(s, view);
  assert.equal(hit(g, s, g.x0 + BW * 1.2, yOf(g, "treble", 0)).kind, "note");
  assert.deepEqual(hit(g, s, g.x0 + BW * 2.2, yOf(g, "treble", 11)), { kind: "note", index: 1, zone: "head" });
});

test("render draws every note, bar warning and the bass staff only when asked", () => {
  const s = song([[0, "C4"], [1, "D4", 2], [3, "E4"], [4, "F4", 0.5], [4.5, null, 0.5]]);
  const svg = render(layout(s, view), s);
  assert.equal((svg.match(/class="head /g) || []).length, 4);
  assert.match(svg, /✓ 4\/4/);
  assert.match(svg, /⚠ 1\/4 · needs 3 beats more/);
  assert.match(svg, /Bass/);
  assert.doesNotMatch(render(layout(s, { ...view, bass: false }), s), /Bass/);
});
