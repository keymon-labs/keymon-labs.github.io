import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { syllabify } from "../lyrics.js";
import { parseTune } from "../logic.js";

const texts = (s, o) => syllabify(s, o).map((x) => x.text);

test("English words split on vowel runs", () => {
  assert.deepEqual(texts("twinkle twinkle little star"), ["twin", "kle", "twin", "kle", "lit", "tle", "star"]);
  const s = syllabify("twinkle twinkle little star");
  assert.deepEqual(s.map((x) => x.wordEnd), [false, true, false, true, false, true, true]);
  assert.deepEqual(s[0].vowels, ["ee"]);
  assert.equal(s[0].onset, "tw");
});

test("Spanish: hola mundo", () => {
  const s = syllabify("hola mundo");
  assert.deepEqual(s.map((x) => x.text), ["ho", "la", "mun", "do"]);
  assert.deepEqual(s.map((x) => x.vowels[0]), ["oh", "ah", "oo", "oh"]);
});

test("punctuation sets phraseEnd; accents and diphthongs", () => {
  const s = syllabify("Hello, world!");
  assert.deepEqual(s.map((x) => x.text), ["Hel", "lo", "world"]);
  assert.deepEqual(s.map((x) => x.phraseEnd), [false, true, true]);
  const c = syllabify("canción");
  assert.equal(c.length, 2);
  assert.deepEqual(c[1].vowels, ["ee", "oh"]);
});

test("clusters stay with the next syllable", () => {
  assert.deepEqual(texts("a-pple"), ["a", "pple"]);
  assert.deepEqual(texts("ladron"), ["la", "dron"]);
  assert.deepEqual(texts("mother"), ["mo", "ther"]);
  assert.deepEqual(texts("window"), ["win", "dow"]);
});

test("hyphen forces a boundary; explicit makes every token one syllable", () => {
  assert.deepEqual(texts("sing-ing"), ["sing", "ing"]);
  assert.deepEqual(texts("a-bove", { explicit: true }), ["a", "bove"]);
  assert.deepEqual(syllabify("a-bove", { explicit: true })[1].vowels, ["oh"]);
  const r = syllabify("Row, row", { explicit: true });
  assert.equal(r.length, 2);
  assert.equal(r[0].phraseEnd, true);
  assert.equal(syllabify("Twin-kle twin-kle lit-tle star, ai won-der.", { explicit: true }).length, 10);
  assert.equal(syllabify("dia", { explicit: true }).length, 1);
});

test("lone I, words without vowels, other scripts, empty text", () => {
  assert.deepEqual(syllabify("I")[0].vowels, ["ah", "ee"]);
  assert.deepEqual(syllabify("hmm"), [{ text: "hmm", onset: "hmm", vowels: ["ah"], wordEnd: true, phraseEnd: true }]);
  assert.equal(syllabify("你好").length, 2);
  assert.deepEqual(syllabify("привет")[0].vowels, ["ee"]);
  assert.deepEqual(syllabify("γεια")[0].vowels.length > 0, true);
  assert.deepEqual(syllabify(""), []);
  assert.deepEqual(syllabify("  \n "), []);
});

test("never throws on odd input", () => {
  for (const t of ["😀🎵", "a1b2 --- ...", "x".repeat(5000), "مرحبا שלום", "-", "- -", "ééé ÿ", null, undefined]) assert.doesNotThrow(() => syllabify(t));
  assert.ok(syllabify("la ".repeat(9000)).length <= 5000);
});

test("every built-in song: lyrics, sung spelling and notes have the same number of syllables", () => {
  const songs = JSON.parse(readFileSync(new URL("../songs.json", import.meta.url)));
  assert.ok(songs.length >= 5);
  for (const s of songs) {
    const n = parseTune(s.notes).length;
    assert.equal(syllabify(s.lyrics, { explicit: true }).length, n, `${s.id} lyrics`);
    assert.equal(syllabify(s.sing, { explicit: true }).length, n, `${s.id} sing`);
  }
});
