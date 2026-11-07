// Engine tests: matching, state, resets, turns, stars, coins. Uses the frog episode and a small generic fixture.
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalize, hasGroup, stateMatches, evaluate, between, applySet, takeTurn, starsFor, scoreWriting, addCoins, local } from "../game.js";
import { readJson } from "./helpers.js";

const frog = readJson("episodes/frog/episode.json");
const door = readJson("test/fixtures/door.json");
const play = (sentence, state = frog.state, lang = "en") => evaluate(frog, between(frog, state).state, sentence, lang)?.id ?? null;

test("normalize drops accents, punctuation and case", () => {
  assert.equal(normalize("¡Lánzala, a través!"), "lanzala a traves");
  assert.equal(normalize("Throw  it."), "throw it");
});

test("word groups match whole words and phrases, never parts of words", () => {
  assert.equal(hasGroup("Lánzala a través de la canasta", ["a traves"]), true);
  assert.equal(hasGroup("I threw it", ["throw"]), false);
  assert.equal(hasGroup("Pick up the key", ["pick up"]), true);
  assert.equal(hasGroup("frogger", ["frog"]), false);
});

test("state conditions: equal, not, any of", () => {
  const s = { ball: "hand", frog: "here" };
  assert.ok(stateMatches(s, { ball: "hand" }));
  assert.ok(stateMatches(s, { frog: "!away" }));
  assert.ok(stateMatches(s, { ball: ["far", "hand"] }));
  assert.ok(!stateMatches(s, { ball: "!hand" }));
});

test("frog: throwing without the ball does nothing", () => {
  assert.equal(play("Throw the ball."), "no_ball");
  assert.equal(play("Eat it."), "nothing_to_eat");
});

test("frog: the three tutorial examples", () => {
  assert.equal(play("Pick up the ball and eat it."), "ate_ball");
  assert.equal(play("Pick the ball and throw it through the basket. It bounces on the frog."), "win");
  assert.equal(play("Pick the ball and throw it to the hoop and it hits the frog."), "win");
});

test("frog: near misses", () => {
  assert.equal(play("Pick the ball and throw it into the basket."), "basket_only");
  assert.equal(play("Pick the ball and throw it at the frog."), "frog_dodges");
  assert.equal(play("Catch the frog!"), "frog_runs");
  assert.equal(play("Grab the ball."), "picked");
  assert.equal(play("Grab the ball.", { ...frog.state, ball: "hand" }), "already");
});

test("frog: a ball already in hand can be thrown", () => {
  assert.equal(play("Throw it through the basket and bounce on the frog.", { ...frog.state, ball: "hand" }), "win");
});

test("frog: Spanish works without accents", () => {
  assert.equal(play("Coge la pelota y lanzala a traves de la canasta. Rebota en la rana.", frog.state, "es"), "win");
  assert.equal(play("Lanza la pelota.", frog.state, "es"), "no_ball");
  assert.equal(play("Coge la pelota y cómela.", frog.state, "es"), "ate_ball");
});

test("frog: between turns, the frog comes back and an eaten ball is replaced", () => {
  const r = between(frog, { ball: "mouth", frog: "away" });
  assert.deepEqual(r.state, { ball: "ground", frog: "here" });
  assert.ok(r.beats.length >= 3);
  assert.deepEqual(between(frog, frog.state), { state: frog.state, beats: [] });
});

test("unplanned sentences return null, so Claude improvises", () => {
  assert.equal(play("The cat sings a song."), null);
});

test("the engine is generic: another episode with its own state and words", () => {
  let s = door.state;
  assert.equal(evaluate(door, s, "Open the door", "en").id, "locked");
  assert.equal(evaluate(door, s, "Kick it", "en").id, "stuck");
  s = applySet(s, door.outcomes.stuck.set);
  assert.equal(between(door, s).state.door, "locked");
  s = applySet(s, door.outcomes.got_key.set);
  assert.equal(evaluate(door, s, "Open the door", "en").id, "win");
});

test("takeTurn: planned outcome with state, beats and texts", async () => {
  const r = await takeTurn({ ep: frog, state: frog.state, sentence: "Coge la pelota.", lang: "es", improvise: () => assert.fail("no Claude") });
  assert.equal(r.source, "planned");
  assert.equal(r.state.ball, "hand");
  assert.equal(r.text, local(frog.outcomes.picked.text, "es"));
  assert.equal(r.say, "¡La tengo!");
  assert.equal(r.win, false);
});

test("takeTurn: unplanned sentence uses Claude's animation and never changes the state", async () => {
  let asked = null;
  const imp = { ok: true, say: "Woo!", text: "The kid dances like jelly.", beats: [{ pose: "dance" }] };
  const r = await takeTurn({ ep: frog, state: { ball: "mouth", frog: "here" }, sentence: "I dance", lang: "en", improvise: async (state, s) => { asked = { state, s }; return imp; } });
  assert.deepEqual(asked, { state: { ball: "ground", frog: "here" }, s: "I dance" });
  assert.equal(r.source, "improvised");
  assert.deepEqual(r.beats, imp.beats);
  assert.deepEqual(r.state, { ball: "ground", frog: "here" });
  assert.equal(r.pre.length, 2);
  assert.equal(r.win, false);
});

test("takeTurn: a loose rule lets Claude improvise instead, or keep the plan, and keeps the plan when Claude fails", async () => {
  const imp = { ok: true, say: "Boom!", text: "The ball explodes on the sun.", beats: [{ vanish: "ball" }] };
  const go = (improvise, demo = false) => takeTurn({ ep: frog, state: frog.state, sentence: "Throw the ball to the sun and it explodes.", lang: "en", improvise, demo });
  let plan = null;
  assert.equal((await go(async (st, s, p) => { plan = p; return imp; })).source, "improvised");
  assert.match(plan, /pure air/);
  assert.equal((await go(async () => null)).id, "no_ball");
  assert.equal((await go(async () => { throw new Error("offline"); })).id, "no_ball");
  assert.equal((await go(() => assert.fail("demos never ask Claude"), true)).id, "no_ball");
  const strict = await takeTurn({ ep: frog, state: frog.state, sentence: "Pick the ball and throw it through the basket. It bounces on the frog.", lang: "en", improvise: () => assert.fail("not loose") });
  assert.equal(strict.id, "win");
});

test("stars: 3 on the first photo, 2 on the second, 1 after; 2 at most without the bonus word", () => {
  assert.deepEqual([1, 2, 4].map((p) => starsFor(p, true)), [3, 2, 1]);
  assert.equal(starsFor(1, false), 2);
});

test("coins: +1 per word written right, −1 per mistake, never below zero", () => {
  assert.deepEqual(scoreWriting({ lines: [{ written: "Throw the ball." }], errors: [] }), { right: 3, mistakes: 0, delta: 3 });
  assert.deepEqual(scoreWriting({ lines: [{ written: "Throw the bal." }], errors: [{ written: "bal" }] }), { right: 2, mistakes: 1, delta: 1 });
  assert.deepEqual(scoreWriting({ lines: [{ written: "throw it throug" }], errors: [{ written: "throw" }, { written: "throug" }] }), { right: 1, mistakes: 2, delta: -1 });
  assert.equal(addCoins(1, -5), 0);
  assert.equal(addCoins(undefined, 3), 3);
});
