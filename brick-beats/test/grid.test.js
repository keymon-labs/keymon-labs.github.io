// Lanes × columns matrix helpers (grid.js).
import test from "node:test";
import assert from "node:assert/strict";
import { SQ, edgesFrom, gridOf, laneIdx, colOf, splitTallest, removeEdge, reviveMapping } from "../grid.js";

test("lane lines sit between lane centres and half a lane beyond the ends", () => {
  assert.deepEqual(edgesFrom([100, 200, 300]), [50, 150, 250, 350]);
  assert.deepEqual(edgesFrom([500]), [480, 520]);
});

test("the column grid starts at the first stud boundary inside the square and fills it", () => {
  const g = gridOf(74.8, 27.85);
  assert.ok(Math.abs(g.x0 - 74.8) < 1e-9);
  assert.equal(g.cols, 22);
  const g2 = gridOf(74.8 + 3 * 27.85, 27.85); // phase found three studs in: same grid
  assert.ok(Math.abs(g2.x0 - 74.8) < 1e-6 && g2.cols === 22);
  assert.ok(g.x0 + g.pitch * g.cols <= SQ.x1 + 0.2 * g.pitch);
});

test("a point belongs to the lane it is in, and to the end lanes when outside", () => {
  const e = [50, 150, 250, 350];
  assert.equal(laneIdx(e, 0, 10, 120), 0);
  assert.equal(laneIdx(e, 0, 10, 160), 1);
  assert.equal(laneIdx(e, 0, 10, 20), 0);
  assert.equal(laneIdx(e, 0, 10, 900), 2);
  assert.equal(laneIdx(e, 0.1, 100, 155), 0); // slanted lines: line 1 is at y = 150 + 10 here
  assert.equal(colOf({ x0: 60, pitch: 20 }, 101), 2);
});

test("lines can be added into the tallest lane and removed (inner ones only)", () => {
  const s = splitTallest([0, 100, 300]);
  assert.deepEqual(s.edges, [0, 100, 200, 300]);
  assert.equal(s.at, 2);
  assert.deepEqual(removeEdge([0, 100, 200, 300], 2), [0, 100, 300]);
  assert.equal(removeEdge([0, 100, 300], 0), null);
  assert.equal(removeEdge([0, 100], 1), null);
});

test("a saved mapping comes back, and a broken one is dropped", () => {
  const m = { gap: 25, rect: true, edges: [1, 2, 3], tilt: 0, x0: 70, pitch: 28, cols: 22, edited: true, quad: [[0.1, 0.1], [0.9, 0.1], [0.9, 0.9], [0.1, 0.9]], ar: 0.75 };
  assert.deepEqual(reviveMapping(JSON.stringify(m)), m);
  assert.equal(reviveMapping("nope"), null);
  assert.equal(reviveMapping(JSON.stringify({ ...m, edges: ["a"] })), null);
  assert.equal(reviveMapping(JSON.stringify({ ...m, quad: [1] })).quad, null);
});

test("fitUniform finds the spacing of evenly spaced lines", async () => {
  const { fitUniform, uniformEdges, colsFill } = await import("../grid.js");
  const f = fitUniform([100.4, 180, 259.7, 340.2, 419.9]);
  assert.ok(Math.abs(f.step - 79.9) < 0.5 && Math.abs(f.y0 - 100.2) < 0.7 && f.dev < 1);
  assert.deepEqual(uniformEdges(10, 5, 3), [10, 15, 20, 25]);
  assert.equal(fitUniform([5]), null);
  assert.equal(colsFill(60, 40), 16);
});
