// Every episode folder must pass checkEpisode (the same check as "Try it" in Help); broken episodes get clear messages.
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkEpisode, tweenFrames, tweenProblems, artParts, cleanImprov, improvMenu } from "../episode.js";
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
    assert.deepEqual(tweenProblems(def), [], name);
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
  for (const want of ['rules[0].outcome: no outcome "nope"', "words.es.throw: missing word group", 'ball can\'t go to "moon"', 'unknown pose "moonwalk"', 'unknown sound "kazoo"', '"pocket" is not a spot of ball', 'unknown art "dragon"', "title.es: missing text"]) {
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

const frog = readJson("episodes/frog/episode.json");

test("improvised animation: the sun example plays as written", () => {
  const beats = [{ move: "ball", to: "hand", dur: 300 }, [{ pose: "throw" }, { move: "ball", to: "sun", dur: 900, arc: 200, spin: 720, delay: 450 }],
    [{ fx: "boom", at: "sun" }, { vanish: "ball" }, { sound: "splat" }, { shake: 400 }], { say: "Too hot!", actor: "sun" }];
  const r = cleanImprov({ ok: true, say: "To the sun!", text: "BOOM.", beats }, frog, CHECK, "x");
  assert.deepEqual(r, { ok: true, say: "To the sun!", text: "BOOM.", beats });
});

test("improvised animation: props can be created, then moved and used by name", () => {
  const beats = [{ prop: "🚀", name: "rocket", at: "kid" }, { move: "rocket", to: { x: 900, y: 40 }, dur: 800 }, { fx: "boom", at: "rocket" }];
  assert.equal(cleanImprov({ ok: true, text: "Zoom", beats }, frog, CHECK, "x").beats.length, 3);
});

test("improvised animation: bad beats are dropped, numbers kept in range, the mission can't be frozen", () => {
  const r = cleanImprov({ ok: true, text: "Hi", beats: [
    { move: "ball", to: "moon" }, { pose: "moonwalk" }, { pose: "dance", actor: "frog" }, { pose: "squash", actor: "frog" },
    { pose: "breathe", actor: "ball" }, { teleport: "kid" }, { move: "dragon", to: "sun" }, { sound: "kazoo" },
    { move: "ball", to: { x: 99999, y: -5000 }, dur: 99999, spin: "lots" }, { pose: "wave" },
    [{ say: "Hi!", actor: "frog" }, { fx: "nope" }],
  ] }, frog, CHECK, "x");
  assert.deepEqual(r.beats, [{ move: "ball", to: { x: 1200, y: -200 }, dur: 3000 }, { pose: "wave" }, [{ say: "Hi!", actor: "frog" }]]);
});

test("improvised animation: at most 16 beats and 3 props", () => {
  const props = Array.from({ length: 5 }, (_, i) => ({ prop: "⭐", name: `star${i}` }));
  assert.equal(cleanImprov({ ok: true, text: "x", beats: props }, frog, CHECK, "").beats.length, 3);
  assert.equal(cleanImprov({ ok: true, text: "x", beats: Array(30).fill({ pose: "wave" }) }, frog, CHECK, "").beats.length, 16);
});

test("improvised animation: refusals and unusable replies become a shrug", () => {
  assert.deepEqual(cleanImprov({ ok: false, say: "Nope!", text: "Try singing." }, frog, CHECK, "x"), { ok: false, say: "Nope!", text: "Try singing.", beats: [{ pose: "shrug" }, { sound: "bad" }] });
  assert.equal(cleanImprov(null, frog, CHECK, "fallback").text, "fallback");
  assert.deepEqual(cleanImprov({ ok: true, text: "Hi", beats: "dance" }, frog, CHECK, "x").beats, [{ pose: "dance" }]);
});

test("improvisation menu: each actor gets only the poses it can play, never ones that stay or loop", () => {
  const m = improvMenu(frog, CHECK);
  const kid = m.actors.find((a) => a.name === "kid"), fr = m.actors.find((a) => a.name === "frog");
  assert.ok(kid.hero && kid.poses.includes("throw") && kid.poses.includes("dance"));
  assert.ok(!fr.poses.includes("dance") && fr.poses.includes("croak") && fr.poses.includes("leap"));
  for (const a of m.actors) assert.ok(!a.poses.includes("squash") && !a.poses.includes("breathe"), a.name);
  assert.ok(m.fx.includes("boom") && m.sounds.includes("splat"));
});

test("improvised animation: {plan: true} keeps the plan only when there is one", () => {
  assert.equal(cleanImprov({ plan: true }, frog, CHECK, "x", true), null);
  assert.equal(cleanImprov({ plan: true }, frog, CHECK, "fallback", false).text, "fallback");
});
