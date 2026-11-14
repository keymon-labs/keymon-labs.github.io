import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRng } from "../../shared/rng.js";
import { cardsFor, checkTheme, composeGroove, evolveBars, retheme, nextCard, clipRate, NEXT } from "../logic.js";

const themes = JSON.parse(readFileSync(new URL("../themes.json", import.meta.url)));

test("every theme has one word per sound count", () => {
  for (const [k, t] of Object.entries(themes)) assert.deepEqual(checkTheme(t), [], k);
  assert.ok(checkTheme({ name: "x", words: [{ id: "a", syl: ["a", "b"] }] }).length > 0);
});

test("grooves: right length, bar starts sounding, A repeats, few rests", () => {
  for (const t of Object.values(themes)) {
    const cards = cardsFor(t);
    for (let nb = 1; nb <= 4; nb++) for (let seed = 1; seed <= 200; seed++) {
      const bars = composeGroove(createRng(seed), cards, nb), flat = bars.flat();
      assert.equal(flat.length, nb * 4);
      assert.ok(flat.every((c) => c.n >= 0 && c.n <= 4 && (c.kind !== "word" || c.syl.length === c.n)));
      assert.ok(bars.every((b) => b.length === 4 && b[0].n > 0), "beat 1 sounds");
      if (nb >= 3) assert.deepEqual(bars[0], bars[1]);
      assert.ok(flat.filter((c) => c.n === 0).length <= Math.max(1, Math.floor((nb * 4) / 5)));
    }
  }
});

test("same seed gives the same groove", () => {
  const cards = cardsFor(themes.fruits);
  assert.deepEqual(composeGroove(createRng(7), cards, 4), composeGroove(createRng(7), cards, 4));
});

test("evolving keeps the length and the hook; now=true always changes the ending", () => {
  const cards = cardsFor(themes.fruits), rng = createRng(3);
  let bars = composeGroove(rng, cards, 4);
  for (let pass = 1; pass <= 12; pass++) {
    const next = evolveBars(bars, rng, cards, pass, false);
    assert.equal(next.flat().length, 16);
    bars = next;
  }
  const forced = evolveBars(bars, rng, cards, 1, true);
  assert.equal(forced[3][3].n >= 3, true, "fill on the last beat");
});

test("retheme keeps the rhythm; tapping walks 1,2,3,4,rest", () => {
  const f = cardsFor(themes.fruits), a = cardsFor(themes.animals), bars = composeGroove(createRng(5), f, 2), moved = retheme(bars, a);
  assert.deepEqual(moved.flat().map((c) => c.n), bars.flat().map((c) => c.n));
  assert.ok(moved.flat().every((c) => a.includes(c)));
  let c = f[1];
  assert.deepEqual(NEXT.map(() => (c = nextCard(c, f)).n), [2, 3, 4, 0, 1]);
});

test("recorded word speed: fit to the beat, never slower, capped", () => {
  assert.ok(Math.abs(clipRate(0.8, 0.75) - 1.123) < 0.01);
  assert.equal(clipRate(0.3, 0.75), 1);
  assert.equal(clipRate(5, 0.75), 3);
});
