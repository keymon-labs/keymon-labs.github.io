import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRng } from "../../shared/rng.js";
import { HAND, fingerOf, parsePattern, checkPattern, pickItems, timingWindow, judgeEcho, timingWord, paceFromTaps,
  nextTempo, velocityBase, evenness, islandFound, newProgress, nextProgress } from "../logic.js";

const levels = JSON.parse(readFileSync(new URL("../levels.json", import.meta.url)));

test("right hand in C position, one finger per key", () => {
  assert.deepEqual(HAND.map(fingerOf), [1, 2, 3, 4, 5]);
  assert.equal(fingerOf(61), 0);
});

test("patterns: beats and rest beats", () => {
  assert.deepEqual(parsePattern("C4 - E4 -"), { beats: 4, notes: [{ beat: 0, midi: 60 }, { beat: 2, midi: 64 }] });
  assert.deepEqual(checkPattern("C4 D4 E4 -"), []);
  assert.ok(checkPattern("C4 D4 E4 F4 -").some((e) => /without a rest/.test(e)));
  assert.ok(checkPattern("C4 D4").some((e) => /end with a rest/.test(e)));
  assert.ok(checkPattern("A4 -").some((e) => /not under/.test(e)));
  assert.ok(checkPattern("C4 C4 C4 - C4 -").some((e) => /same note/.test(e)));
});

test("every level is valid: patterns fit the hand, rest beats, no fast repeats", () => {
  const ids = new Set();
  for (const l of levels) {
    assert.ok(!ids.has(l.id), `duplicate id ${l.id}`); ids.add(l.id);
    assert.ok(["islands", "home", "echo"].includes(l.kind), l.id);
    assert.ok(l.intro && l.hint && l.icon && l.title, l.id);
    for (const p of l.pool || []) assert.deepEqual(checkPattern(p), [], `${l.id}: ${p}`);
  }
});

test("pickItems never repeats an item back to back", () => {
  const out = pickItems(["a", "b"], 50, createRng(3));
  for (let i = 1; i < out.length; i++) assert.notEqual(out[i], out[i - 1]);
});

test("timing window: wide until there is data, then centred on the child and clamped", () => {
  assert.deepEqual(timingWindow([10, 20]), { centre: 0, ok: 200, great: 120 });
  const late = timingWindow([80, 90, 100, 110, 120, 100]);          // steady but late child
  assert.equal(late.centre, 100); assert.equal(late.ok, 100); assert.equal(late.great, 50);
  const wild = timingWindow([-300, 300, -250, 250, -300, 300]);      // very spread
  assert.equal(wild.ok, 200); assert.equal(wild.centre, 0);
});

const exp = [{ t: 1000, midi: 60 }, { t: 2000, midi: 64 }];
const win = { centre: 50, ok: 150, great: 80 };
const n = (t, midi, vel = 64) => ({ t, midi, vel });

test("judgeEcho: clean, right notes off time, miss, mashing", () => {
  assert.equal(judgeEcho(exp, [n(1060, 60), n(2040, 64)], win).kind, "clean");     // late but on the child's own centre
  const r = judgeEcho(exp, [n(1300, 60), n(2040, 64)], win);
  assert.equal(r.kind, "notes"); assert.equal(r.inTime, 1); assert.deepEqual(r.offsets, [300, 40]);
  assert.equal(judgeEcho(exp, [n(1000, 60)], win).kind, "miss");
  assert.equal(judgeEcho(exp, [n(1000, 62), n(2000, 64)], win).kind, "miss");
  const mash = [60, 62, 64, 65, 67, 60, 64].map((m, i) => n(900 + i * 150, m));
  assert.equal(judgeEcho(exp, mash, win).kind, "miss");                           // random input never passes
  const stray = judgeEcho(exp, [n(1000, 60), n(1500, 61), n(2000, 64)], win);
  assert.equal(stray.kind, "notes"); assert.equal(stray.stray, 1);
});

test("timingWord is about the child's own centre", () => {
  assert.equal(timingWord([0, 10, -10], { centre: 0 }), "ontick");
  assert.equal(timingWord([-100, -90, -80], { centre: 0 }), "early");
  assert.equal(timingWord([150, 160, 170], { centre: 50 }), "late");
  assert.equal(timingWord([5], { centre: 0 }), "none");
});

test("pace from the child's taps, clamped to a piano pulse", () => {
  assert.equal(paceFromTaps([0, 500, 1000, 1500, 2000]), 120);
  assert.equal(paceFromTaps([0, 300, 600, 900, 1200]), 125);       // a fast 4-year-old: capped
  assert.equal(paceFromTaps([0, 900, 1800, 2700, 3600]), 100);     // never crawls below 100
  assert.equal(paceFromTaps([0, 500]), 108);
});

test("tempo moves in small steps and never past the child's own pace", () => {
  assert.equal(nextTempo(110, 110, 2, 0, 8), 105);
  assert.equal(nextTempo(91, 110, 3, 0, 8), 90);
  assert.equal(nextTempo(100, 110, 0, 6, 8), 105);
  assert.equal(nextTempo(110, 110, 0, 8, 8), 110);
});

test("evenness against the keyboard's own baseline", () => {
  const base = velocityBase([60, 64, 58, 62, 66, 60, 62, 64]);
  assert.equal(base.mean, 62); assert.equal(base.sd, 4);
  const even = evenness(HAND.map((m) => ({ midi: m, vel: 62 })), base);
  assert.ok(even.even); assert.equal(even.loud, 0);
  const thumb = evenness(HAND.map((m, i) => ({ midi: m, vel: i ? 50 : 110 })), base);
  assert.ok(!thumb.even); assert.equal(thumb.loud, 1); assert.equal(thumb.loudest, 1);
});

test("islands: all keys of a group in one octave", () => {
  assert.equal(islandFound([{ midi: 61 }, { midi: 63 }], [1, 3]), 5);
  assert.equal(islandFound([{ midi: 61 }, { midi: 75 }], [1, 3]), null);
  assert.equal(islandFound([{ midi: 78 }, { midi: 80 }, { midi: 82 }], [6, 8, 10]), 6);
});

test("cues fade after 3 clean, come back after 3 misses; bloom only with cues off", () => {
  let p = newProgress();
  for (let i = 0; i < 3; i++) p = nextProgress(p, "clean");
  assert.equal(p.cue, 1); assert.ok(p.open); assert.ok(!p.bloom);
  for (let i = 0; i < 3; i++) p = nextProgress(p, "clean");
  assert.equal(p.cue, 2); assert.ok(!p.bloom);
  for (let i = 0; i < 3; i++) p = nextProgress(p, "miss");
  assert.equal(p.cue, 1); assert.ok(p.open);                        // progress never closes again
  p = nextProgress(nextProgress(p, "miss"), "notes");
  assert.equal(p.missRun, 0);
  p = newProgress(2);
  for (let i = 0; i < 3; i++) p = nextProgress(p, "clean");
  assert.ok(p.bloom);
});
