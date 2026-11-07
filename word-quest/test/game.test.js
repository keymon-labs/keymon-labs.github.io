import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalize, initialState, refresh, applyEffects, evaluate, starsFor, usesWord, validImprov } from "../game.js";

const story = JSON.parse(readFileSync(new URL("../stories/frog/story.json", import.meta.url)));
const play = (sentence, state = initialState(), lang = "en") => {
  const r = evaluate(sentence, refresh(state).state, story, lang);
  return r && r.id;
};

test("normalize drops accents, punctuation and case", () => {
  assert.equal(normalize("¡Lánzala, a través!"), "lanzala a traves");
  assert.equal(normalize("Throw  it."), "throw it");
});

test("throwing without picking up the ball does not work", () => {
  assert.equal(play("Throw the ball."), "no_pick");
});

test("pick and eat: ball eaten, frog still there", () => {
  const r = evaluate("Pick the ball and eat it.", initialState(), story, "en");
  assert.equal(r.id, "ate_ball");
  assert.equal(r.outcome.effects.ballGone, true);
  assert.equal(r.outcome.effects.frog, undefined);
});

test("pick, throw through the basket, bounce into the frog wins", () => {
  assert.equal(play("Pick the ball and throw it through the basket. It bounces into the frog."), "win");
  assert.equal(play("Pick the ball and throw to the basket and bounces into the frog."), "win");
});

test("throw to the basket without the frog is close but not the win", () => {
  assert.equal(play("Pick the ball and throw it into the basket."), "basket_only");
});

test("throwing straight at the frog makes it run away", () => {
  assert.equal(play("Pick the ball and throw it at the frog."), "frog_runs");
  assert.equal(play("Catch the frog!"), "frog_runs");
});

test("a held ball from an earlier sentence can be thrown", () => {
  const held = applyEffects(initialState(), { ballHeld: true, ballAt: "hand" });
  assert.equal(play("Throw it through the basket and bounce on the frog", held), "win");
});

test("Spanish rules work without accents", () => {
  assert.equal(play("Coge la pelota y lanzala a traves de la canasta. Rebota en la rana.", initialState(), "es"), "win");
  assert.equal(play("Lanza la pelota.", initialState(), "es"), "no_pick");
  assert.equal(play("Coge la pelota y comela.", initialState(), "es"), "ate_ball");
});

test("refresh brings a hopped frog back and replaces an eaten ball, with beats to show it", () => {
  const r = refresh(applyEffects(initialState(), { frog: "away", ballGone: true, ballAt: "gone" }));
  assert.equal(r.state.frog, "alive");
  assert.equal(r.state.ballGone, false);
  assert.equal(r.state.ballAt, "idle");
  assert.equal(r.beats.length, 2);
});

test("unplanned sentence returns null (Claude improvises)", () => {
  assert.equal(evaluate("The cat sings a song.", initialState(), story, "en"), null);
});

test("stars: 3 on the first photo with 'through', capped at 2 without it", () => {
  assert.equal(starsFor(1, true), 3);
  assert.equal(starsFor(2, true), 2);
  assert.equal(starsFor(4, true), 1);
  assert.equal(starsFor(1, false), 2);
});

test("usesWord finds the target word", () => {
  assert.equal(usesWord("Throw it through the hoop", story, "en", "through"), true);
  assert.equal(usesWord("Throw it into the hoop", story, "en", "through"), false);
});

test("validImprov keeps only known poses and sensible text", () => {
  const poses = story.kidPoses;
  assert.deepEqual(validImprov({ ok: true, pose: "sing", text: "La la la!" }, "x", poses), { ok: true, pose: "sing", text: "La la la!" });
  assert.equal(validImprov({ ok: true, pose: "fly", text: "Wow" }, "x", poses).pose, "idle");
  assert.equal(validImprov({ ok: false, text: "no" }, "can't", poses).text, "can't");
  assert.equal(validImprov({ ok: true, text: "   " }, "can't", poses).ok, false);
});

import { scoreWriting, addCoins } from "../game.js";

test("coins: +1 per word written right, −1 per mistake", () => {
  const clean = { lines: [{ written: "Throw the ball.", corrected: "Throw the ball." }], errors: [] };
  assert.deepEqual(scoreWriting(clean), { right: 3, mistakes: 0, delta: 3 });
  const oneWrong = { lines: [{ written: "Throw the bal.", corrected: "Throw the ball." }], errors: [{ written: "bal", correct: "ball", kind: "spelling" }] };
  assert.deepEqual(scoreWriting(oneWrong), { right: 2, mistakes: 1, delta: 1 });
  const two = { lines: [{ written: "throw it throug", corrected: "Throw it through." }], errors: [{ written: "throw", correct: "Throw", kind: "capitals" }, { written: "throug", correct: "through", kind: "spelling" }] };
  assert.deepEqual(scoreWriting(two), { right: 1, mistakes: 2, delta: -1 });
});

test("coins never go below zero", () => {
  assert.equal(addCoins(1, -5), 0);
  assert.equal(addCoins(undefined, 3), 3);
});
