// Checks for the editor model: placing, duration cycling, bar sums, rests on export, naming errors, scan layout, undo.
import test from "node:test";
import assert from "node:assert/strict";
import { newSong, place, cycle, nextBeats, bars, barCount, barMessage, setMeta, setLyric, setStem, toLibrarySong, fromLibrarySong, layoutScanned, snapBeats, snapPitch, stepToPitch, pitchToStep, slugify, uniqueId, createHistory, noteIndexAt } from "../song-model.js";
import { validateLibrary } from "../../library.js";
import { mergeSong, libraryObject, libraryJson } from "../../library.js";

const add = (s, start, pitch, beats = 1, staff) => place(s, { start, pitch, beats, staff }).song;
const song4 = () => { let s = newSong(); [["C4", 0], ["D4", 1], ["E4", 2], ["F4", 3]].forEach(([p, b]) => { s = add(s, b, p); }); return s; };

test("steps and pitches line up with the staff", () => {
  assert.equal(stepToPitch(0), "C4"); assert.equal(stepToPitch(2), "E4"); assert.equal(stepToPitch(10), "F5");
  assert.equal(stepToPitch(-1), "B3"); assert.equal(stepToPitch(-10), "G2"); assert.equal(stepToPitch(14), "C6");
  for (let st = -14; st <= 14; st++) assert.equal(pitchToStep(stepToPitch(st)), st);
});

test("place: quarter at a beat, taken beat refused, length shrinks to fit", () => {
  let s = add(newSong(), 0, "C4");
  assert.equal(place(s, { start: 0, pitch: "D4", beats: 1 }).error, "That beat is already used");
  s = add(s, 3, "E4");                                              // gap of 2 beats between
  const r = place(s, { start: 1, pitch: "D4", beats: 4 });          // wants a whole note, only 2 fit
  assert.equal(r.song.notes[r.index].beats, 2);
  s = add(s, 1.5, "G4", 1, "treble");                               // 1.5 free until beat 3 → fits
  assert.equal(place(s, { start: 2.5, pitch: "A4", beats: 1 }).song.notes.find((n) => n.start === 2.5).beats, 0.5);
  assert.equal(place(add(add(newSong(), 0, "C4"), 1, "D4"), { start: 0.5, pitch: "E4", beats: 1 }).error, "That beat is already used");
  assert.equal(place(newSong(), { start: -1, pitch: "C4", beats: 1 }).error, "Tap inside the staff");
});

test("cycle: quarter → half → whole → deleted; other lengths join the cycle", () => {
  let s = add(newSong(), 0, "C4");
  s = cycle(s, 0); assert.equal(s.notes[0].beats, 2);
  s = cycle(s, 0); assert.equal(s.notes[0].beats, 4);
  s = cycle(s, 0); assert.equal(s.notes.length, 0);
  assert.deepEqual([0.5, 1, 1.5, 2, 3, 4].map(nextBeats), [1, 2, 2, 4, 4, null]);
});

test("cycle: a longer note pushes the next ones along; nothing overlaps", () => {
  const s = cycle(song4(), 0);                                      // C4 now 2 beats, D4 E4 F4 shift
  assert.deepEqual(s.notes.map((n) => n.start), [0, 2, 3, 4]);
});

test("bar sums and messages", () => {
  const ok = song4();
  assert.deepEqual(bars(ok).map((b) => b.ok), [true]);
  assert.equal(barMessage(bars(ok)[0], 4), "4/4");
  const short = add(newSong(), 0, "C4");
  assert.equal(barMessage(bars(short)[0], 4), "1/4 · needs 3 beats more");
  const long = setMeta(song4(), { bar: 3 });                        // barlines re-flow: 3 + 1
  assert.deepEqual(bars(long).map((b) => b.total), [3, 1]);
  assert.equal(barMessage(bars(add(song4(), 4, "G4", 4).song ? song4() : song4())[0], 4), "4/4");
  let over = newSong(); over = add(over, 0, "C4", 4); over = add(over, 4, "D4", 1);
  over = setMeta(over, { bar: 3 });
  assert.equal(bars(over)[0].crossing, true);
  assert.match(barMessage(bars(over)[0], 3), /crosses the barline/);
  assert.equal(bars(newSong()).length, 0);
  assert.equal(barCount(newSong()), 2);
  assert.equal(barCount(song4()), 2);                                // one full bar + one empty to add into
});

test("export: rests are added to the note before; library validator accepts the result", () => {
  let s = setMeta(newSong(), { title: "Rest Test" });
  s = add(s, 0, "C4"); s = add(s, 1, null);                         // rest 1 beat → C4 held 2
  s = add(s, 2, "D4", 2);
  const { song, errors } = toLibrarySong(s);
  assert.equal(errors, undefined);
  assert.deepEqual(song.notes, [["C4", 2], ["D4", 2]]);
  assert.equal(validateLibrary([song]).length, 1);
});

test("export errors name the song and the note", () => {
  let s = setMeta(newSong(), { title: "Odd" });
  s = add(s, 0, "C4", 2); s = add(s, 2, null, 0.5);                 // 2.5 beats is not allowed
  assert.match(toLibrarySong(s).errors[0], /^Song "Odd": note 1 \(C4, bar 1, beat 1\) lasts 2.5 beats/);
  let t = setMeta(newSong(), { title: "Start" }); t = add(t, 0, null); t = add(t, 1, "C4");
  assert.match(toLibrarySong(t).errors[0], /starts with a rest/);
  let u = setMeta(newSong(), { title: "Low", bpm: 20 }); u = add(u, 0, "C4");
  assert.match(toLibrarySong(u).errors[0], /^Song "Low": bpm must be 30-300/);
  let v = setMeta(newSong(), { title: "Far" }); v = add(v, 0, "C4"); v = add(v, 1, "C8");   // pitch outside the game's range
  assert.match(toLibrarySong(v).errors[0], /^Song "Far": note 2 \(C8, bar 1, beat 2\): pitch "C8"/);
  assert.match(toLibrarySong(setMeta(newSong(), { title: "  " })).errors[0], /^Song \(no title\): title must/);
});

test("export round trip keeps lyrics and drops the stem (visual only)", () => {
  let s = setMeta(newSong(), { title: "Round Trip", info: "4/4 · C D E" });
  s = add(s, 0, "C4"); s = setLyric(s, 0, "Twin"); s = setStem(s, 0, "down");
  s = add(s, 1, "G3", 2); s = add(s, 3, "A3");
  const { song } = toLibrarySong(s, "round-trip");
  assert.deepEqual(song, { id: "round-trip", title: "Round Trip", bpm: 90, bar: 4, notes: [["C4", 1, "Twin"], ["G3", 2], ["A3", 1]], info: "4/4 · C D E" });
  const back = fromLibrarySong(song);
  assert.deepEqual(back.notes.map((n) => [n.start, n.beats, n.pitch, n.staff]), [[0, 1, "C4", "treble"], [1, 2, "G3", "bass"], [3, 1, "A3", "bass"]]);
  assert.equal(back.id, "round-trip");
});

test("built-in style songs open in the editor and export unchanged", () => {
  const ls = { id: "lib-mary", title: "Mary", info: "Library", bpm: 100, bar: 4, notes: [["E4", 1, "Ma"], ["D4", 1], ["C4", 2]] };
  const s = fromLibrarySong(ls);
  assert.equal(s.id, "mary"); assert.equal(s.info, "");
  assert.deepEqual(toLibrarySong(s).song.notes, ls.notes);
});

test("scan layout snaps pitches and lengths and keeps printed bars", () => {
  const notes = layoutScanned([
    { pitch: "C4", beats: 1.1, bar: 0, confidence: 0.9 },
    { pitch: "A1", beats: 2.4, bar: 0, confidence: 0.3 },
    { pitch: "nope", beats: 1, bar: 0 },
    { pitch: "E4", beats: 1, bar: 2 },                              // bar 1 came up short → gap, note stays in its bar
  ], 4);
  assert.deepEqual(notes.map((n) => [n.start, n.beats, n.pitch, n.low]), [[0, 1, "C4", false], [1, 2, "C2", true], [8, 1, "E4", false]]);
  assert.equal(layoutScanned([{ pitch: "C4", beats: 1, bar: 0 }], 4, 8)[0].start, 8);
  assert.deepEqual([snapBeats(0.2), snapBeats(1.2), snapBeats(2.6), snapBeats(9)], [0.5, 1, 3, 4]);
  assert.equal(snapPitch("C7"), "C6"); assert.equal(snapPitch("F#3"), "F#3"); assert.equal(snapPitch("x"), null);
});

test("ids: slugs and uniqueness", () => {
  assert.equal(slugify("¡Mi canción número 1!"), "mi-cancion-numero-1");
  assert.equal(slugify("???"), "song");
  assert.equal(uniqueId("a", new Set(["a", "a-2"])), "a-3");
  assert.equal(uniqueId("b", new Set(["a"])), "b");
});

test("history: undo, redo, replace and limit", () => {
  const h = createHistory(1, 3);
  h.push(2); h.push(3); h.push(4); h.push(5);
  assert.equal(h.undo(), 4); assert.equal(h.undo(), 3); assert.equal(h.undo(), 2); assert.equal(h.canUndo(), false);
  assert.equal(h.redo(), 3); h.replace(9); assert.equal(h.get(), 9); assert.equal(h.undo(), 2);
  h.push(7); assert.equal(h.canRedo(), false);
  assert.equal(noteIndexAt(song4(), 2.5), 2);
});

test("library helpers: merge replaces by id, export parses back", () => {
  const a = validateLibrary([{ id: "x", title: "X", bpm: 90, bar: 4, notes: [["C4", 1]] }])[0];
  const b = { ...a, title: "X2" };
  assert.deepEqual(mergeSong([a], b).map((s) => s.title), ["X2"]);
  assert.equal(mergeSong([a], { ...a, id: "lib-y" }).length, 2);
  const obj = libraryObject([a, { ...a, id: "lib-y", notes: [["C4", 1, "la"], ["D4", 2]] }]);
  assert.deepEqual(obj.songs.map((s) => s.id), ["x", "y"]);
  assert.deepEqual(JSON.parse(libraryJson(obj)), obj);
  assert.equal(validateLibrary(JSON.parse(libraryJson(obj))).length, 2);
});
