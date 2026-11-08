// What Brick Beats remembers between photos (profile.js): colours the player taught it.
import test from "node:test";
import assert from "node:assert/strict";
import { emptyProfile, learnColour, learnedClass, reviveProfile } from "../profile.js";

test("a taught colour is recognised again, an unlike one is left to the rules", () => {
  const p = emptyProfile();
  assert.equal(learnedClass(p, [150, 40, 50]), -1);
  learnColour(p, 0, [150, 40, 50]);
  assert.equal(learnedClass(p, [155, 45, 52]), 0);
  assert.equal(learnedClass(p, [60, 160, 200]), -1);
});

test("the newest correction wins over an older one that looks the same", () => {
  const p = emptyProfile();
  learnColour(p, 2, [200, 120, 130]);
  learnColour(p, 0, [203, 122, 131]); // the player says: that was red
  assert.equal(learnedClass(p, [201, 121, 130]), 0);
  assert.equal(p.colours.length, 1);
});

test("looks of the same colour are averaged, not piled up", () => {
  const p = emptyProfile();
  learnColour(p, 7, [10, 160, 210]); learnColour(p, 7, [14, 164, 214]);
  assert.equal(p.colours.length, 1);
  assert.equal(p.colours[0].n, 2);
});

test("saved and loaded again, and bad saved data is dropped instead of breaking the app", () => {
  const p = emptyProfile();
  learnColour(p, 3, [230, 190, 57]);
  const back = reviveProfile(JSON.stringify(p));
  assert.deepEqual(back, p);
  assert.deepEqual(reviveProfile("not json"), emptyProfile());
  assert.deepEqual(reviveProfile(JSON.stringify({ colours: [{ c: "x", rgb: [1, 2] }, { c: 1, rgb: [1, 2, 3], n: 1 }] })).colours.length, 1);
});
