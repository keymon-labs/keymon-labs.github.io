// Saved mats (library.js): validation, ordering, limit, export/import.
import test from "node:test";
import assert from "node:assert/strict";
import { cleanEntry, reviveLibrary, sorted, addEntry, toggleStar, removeEntry, exportEntry, importEntry, MAX_ENTRIES } from "../library.js";

const entry = (id, o = {}) => ({ id, name: "Tune " + id, star: false, date: +id, img: "data:image/jpeg;base64,AAAA", grid: { x0: 60, pitch: 28, cols: 22, tilt: 0, edges: [60, 200, 340], gap: 10 }, tracks: [{ instrument: "pluck", bricks: [{ cls: 3, start: 0, len: 2 }] }, { instrument: "bell", bricks: [] }], settings: { bpm: 100, key: 2, scale: "pent", studTime: 1 }, ...o });

test("a good entry survives, bad ones are dropped", () => {
  assert.equal(cleanEntry(entry("1")).name, "Tune 1");
  assert.equal(cleanEntry({ ...entry("1"), img: "http://x/y.png" }), null);
  assert.equal(cleanEntry({ ...entry("1"), tracks: [] }), null); // lanes must match the grid lines
  assert.equal(cleanEntry({ ...entry("1"), grid: { ...entry("1").grid, pitch: 1 } }), null);
  assert.equal(cleanEntry(null), null);
  assert.deepEqual(cleanEntry(entry("1", { tracks: [{ bricks: [{ cls: 1, start: -1, len: 2 }, { cls: 2, start: 0, len: 2 }] }, { bricks: [] }] })).tracks[0].bricks, [{ cls: 2, start: 0, len: 2 }]);
});
test("reading back: junk gives an empty list, entries are cleaned", () => {
  assert.deepEqual(reviveLibrary("nope"), []);
  assert.equal(reviveLibrary(JSON.stringify([entry("1"), { bad: 1 }])).length, 1);
});
test("starred first, then newest; the limit drops the oldest unstarred", () => {
  let l = [];
  for (let i = 1; i <= MAX_ENTRIES + 3; i++) l = addEntry(l, entry(String(i), { star: i === 1 }));
  assert.equal(l.length, MAX_ENTRIES);
  assert.equal(l[0].id, "1"); // the starred one is kept although it is the oldest
  assert.ok(!l.some((e) => e.id === "2"));
  assert.deepEqual(sorted([entry("5"), entry("9"), entry("7", { star: true })]).map((e) => e.id), ["7", "9", "5"]);
});
test("star, remove and export/import round trip", () => {
  let l = addEntry([], entry("1"));
  assert.equal(toggleStar(l, "1")[0].star, true);
  assert.deepEqual(removeEntry(l, "1"), []);
  assert.deepEqual(importEntry(exportEntry(l[0])), cleanEntry(l[0]));
  assert.equal(importEntry("{}"), null);
});
