import { test } from "node:test";
import assert from "node:assert/strict";
import { parseOcr, parseJson, buildOcrPrompt } from "../ai.js";

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
