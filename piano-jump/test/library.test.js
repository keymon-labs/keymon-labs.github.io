// Checks for the song library: validation rules, encryption round trip, and that the built-in songs follow the same format.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateLibrary, encryptLibrary, parseLibraryText, LibraryError } from "../library.js";

const song = (over = {}) => ({ id: "demo", title: "Demo", bpm: 90, bar: 4, notes: [["C4", 1, "la"], ["D4", 2], ["E4", 1, "", 3]], ...over });

test("accepts {songs} and bare arrays, prefixes ids, fills info", () => {
  const [a] = validateLibrary({ songs: [song()] });
  assert.equal(a.id, "lib-demo");
  assert.equal(a.info, "Library");
  assert.equal(validateLibrary([song()]).length, 1);
});

test("built-in songs pass the same validator", () => {
  const builtin = JSON.parse(readFileSync(new URL("../songs.json", import.meta.url), "utf8"));
  assert.equal(validateLibrary(builtin).length, builtin.length);
});

test("rejects bad ids, pitches, beats, fingers and duplicates", () => {
  const bad = (s, re) => assert.throws(() => validateLibrary([s]), (e) => e instanceof LibraryError && re.test(e.message));
  bad(song({ id: "a b" }), /id must/);
  bad(song({ notes: [["H4", 1]] }), /pitch/);
  bad(song({ notes: [["C9", 1]] }), /pitch/);
  bad(song({ notes: [["C4", 0.3]] }), /beats/);
  bad(song({ notes: [["C4", 1, "x", 7]] }), /finger/);
  bad(song({ bpm: 5 }), /bpm/);
  bad(song({ notes: [] }), /notes/);
  assert.throws(() => validateLibrary([song(), song()]), /duplicate/);
  assert.throws(() => validateLibrary({}), /No songs/);
});

test("encrypted library: round trip, wrong password, missing password, tampering", async () => {
  const text = await encryptLibrary({ songs: [song()] }, "test-password");
  assert.ok(!text.includes("Demo"), "plaintext must not appear");
  const [s] = await parseLibraryText(text, "test-password");
  assert.equal(s.title, "Demo");
  await assert.rejects(parseLibraryText(text, "nope"), { code: "password" });
  await assert.rejects(parseLibraryText(text, ""), { code: "password" });
  const env = JSON.parse(text);
  env.data = env.data.slice(0, -4) + (env.data.endsWith("AAAA") ? "BBBB" : "AAAA");
  await assert.rejects(parseLibraryText(JSON.stringify(env), "test-password"), { code: "password" });
});

test("plain file parses and junk is rejected", async () => {
  assert.equal((await parseLibraryText(JSON.stringify({ songs: [song()] }))).length, 1);
  await assert.rejects(parseLibraryText("not json"), /Not a valid/);
});
