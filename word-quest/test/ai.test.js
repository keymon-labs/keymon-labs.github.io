import { test } from "node:test";
import assert from "node:assert/strict";
import { parseOcr, parseJson, buildOcrPrompt, buildImprovPrompt } from "../ai.js";
import { readJson } from "./helpers.js";

test("parseOcr reads a clean reply, with or without extra text around it", () => {
  const r = parseOcr('Here: {"lines":[{"written":"throw it.","corrected":"Throw it."}],"errors":[{"written":"throw","correct":"Throw","kind":"capitals","note":"Start with a capital."}]}');
  assert.equal(r.lines[0].corrected, "Throw it.");
  assert.equal(r.errors.length, 1);
});

test("parseOcr rejects unusable replies", () => {
  assert.equal(parseOcr("sorry, I can't"), null);
  assert.equal(parseOcr('{"lines":[]}'), null);
  assert.equal(parseJson("{bad"), null);
});

test("OCR prompt changes with the level and the language", () => {
  assert.match(buildOcrPrompt("es", "basic"), /do NOT report missing accents/);
  assert.match(buildOcrPrompt("en", "basic"), /Do NOT report commas/);
  assert.match(buildOcrPrompt("en", "advanced"), /Check everything/);
});

test("improvisation prompt describes the scene, the actors with their poses and spots, and the beat format", () => {
  const ep = readJson("episodes/frog/episode.json");
  const menu = { actors: [{ name: "kid", about: "a kid", hero: true, x: 1, y: 2, w: 3, h: 4, spots: [], poses: ["dance", "throw"] }, { name: "ball", about: "a ball", x: 0, y: 0, w: 1, h: 1, spots: ["hand"], poses: ["spin"] }], fx: ["boom"], sounds: ["splat"] };
  const p = buildImprovPrompt(ep, "es", { ball: "hand", frog: "here" }, "Bailo", menu);
  assert.match(p, /State now: ball: hand, frog: here/);
  assert.match(p, /- kid: a kid \(the hero\).*poses: dance, throw/);
  assert.match(p, /- ball: a ball.*spots: hand/);
  assert.match(p, /Effects \(emoji bursts\): boom/);
  assert.match(p, /"Bailo"/);
  assert.match(p, /in Spanish/);
});

test("improvisation prompt offers the planned reaction for loose rules", () => {
  const ep = readJson("episodes/frog/episode.json");
  const menu = { actors: [], fx: [], sounds: [] };
  assert.match(buildImprovPrompt(ep, "en", {}, "Throw it to the sun", menu, "It flies far away."), /planned reaction.*"It flies far away\."[\s\S]*\{"plan":true\}/);
  assert.doesNotMatch(buildImprovPrompt(ep, "en", {}, "Sing", menu), /planned reaction|"plan"/);
});
