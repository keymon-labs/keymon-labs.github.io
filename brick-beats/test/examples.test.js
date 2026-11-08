// Every generated test photo (scripts/brick-beats-mat.mjs SCENARIOS) goes through the whole reading: corners, straightening, bricks.
import test from "node:test";
import assert from "node:assert/strict";
import { findCorners, warp } from "../correct.js";
import { detect, NAMES } from "../vision.js";
import { SCENARIOS, renderScenario } from "../../scripts/brick-beats-mat.mjs";

for (const sc of SCENARIOS) {
  test(`test photo "${sc.id}": corners found for sure and every brick read exactly`, () => {
    const p = renderScenario(sc), f = findCorners(p.data, p.width, p.height);
    assert.ok(f, "corners found");
    assert.ok(f.sure, `corners sure (rms ${f.rms.toFixed(3)}, outside ${f.outside.toFixed(3)}, excess ${f.excess.toFixed(2)})`);
    const v = warp(p.data, p.width, p.height, f.quad), r = detect(v.data, v.W, v.H);
    assert.equal(r.ok, true);
    assert.deepEqual(r.tracks.map((t) => t.bricks.map((b) => [NAMES[b.cls], b.start, b.len])), sc.lanes);
  });
}
