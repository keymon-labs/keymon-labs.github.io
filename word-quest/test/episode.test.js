// Every episode folder must pass checkEpisode (the same check as "Try it" in Help); broken episodes get clear messages.
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkEpisode, tweenFrames, poseProblems, artParts } from "../episode.js";
import { readJson, episodeIds, art, library, CHECK } from "./helpers.js";
import { SOUNDS } from "../sounds.js";

for (const id of episodeIds) {
  test(`episode ${id} is valid, and its tutorial examples do what they say`, () => {
    const ep = readJson(`episodes/${id}/episode.json`);
    assert.deepEqual(checkEpisode(ep, CHECK), []);
    assert.equal(ep.id, id, "id matches the folder name");
  });
}

test("the generic fixture is valid too", () => {
  assert.deepEqual(checkEpisode(readJson("test/fixtures/door.json"), CHECK), []);
});

test("library: every pose and fx is well formed, sounds exist", () => {
  for (const [name, def] of Object.entries(library.poses)) {
    assert.deepEqual(poseProblems(def), [], name);
    if (def.sound) assert.ok(SOUNDS.includes(def.sound), `${name}: sound ${def.sound}`);
    if (def.fx) assert.ok(library.fx[def.fx], `${name}: fx ${def.fx}`);
  }
});

test("art: the kid has the parts the library poses move", () => {
  const parts = artParts(art.kid);
  for (const p of ["head", "torso", "armL", "armR", "foreL", "foreR", "legL", "legR", "shinL", "shinR", "mouth"]) assert.ok(parts.has(p), p);
});

test("tween shorthand becomes keyframes", () => {
  assert.deepEqual(tweenFrames({ rotate: [0, 90], at: [0, 1] }), [{ transform: "rotate(0deg)", offset: 0 }, { transform: "rotate(90deg)", offset: 1 }]);
  assert.deepEqual(tweenFrames({ y: [0, -5], scale: [1, [2, 0.5]] }), [{ transform: "translate(0px, 0px) scale(1)" }, { transform: "translate(0px, -5px) scale(2, 0.5)" }]);
});

test("broken episodes get messages that say what to fix", () => {
  const ep = readJson("episodes/frog/episode.json");
  const broken = structuredClone(ep);
  broken.rules[0].outcome = "nope";
  broken.words.es.throw = [];
  broken.outcomes.picked.beats = [{ move: "ball", to: "moon" }, { pose: "moonwalk" }, { sound: "kazoo" }];
  broken.outcomes.picked.set = { ball: "pocket" };
  broken.scene.actors.frog.art = "dragon";
  delete broken.title.es;
  const errs = checkEpisode(broken, CHECK).join("\n");
  for (const want of ['rules[0].outcome: no outcome "nope"', "words.es.throw: missing word group", 'no spot "moon"', 'unknown pose "moonwalk"', 'unknown sound "kazoo"', '"pocket" is not a spot of ball', 'unknown art "dragon"', "title.es: missing text"]) {
    assert.ok(errs.includes(want), `expected: ${want}\n got:\n${errs}`);
  }
  assert.match(checkEpisode("[]", CHECK)[0], /one JSON object/);
  assert.match(checkEpisode({ ...ep, languages: [] }, CHECK)[0], /languages/);
});

test("a tutorial example that doesn't do what it claims is reported", () => {
  const ep = structuredClone(readJson("episodes/frog/episode.json"));
  ep.tutorial[3].demo.expect = "win";
  assert.match(checkEpisode(ep, CHECK).join("\n"), /tutorial\[3\]\.demo: in en, "Throw the ball\." gives "no_ball", not "win"/);
});

test("a pose that moves a part the actor doesn't have is reported", () => {
  const ep = structuredClone(readJson("episodes/frog/episode.json"));
  ep.outcomes.picked.beats = [{ pose: "wave", actor: "frog" }];
  assert.match(checkEpisode(ep, CHECK).join("\n"), /pose "wave" moves "armR", which frog doesn't have/);
});
