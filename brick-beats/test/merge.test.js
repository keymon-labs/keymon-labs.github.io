// Same-mat retake merging and one-brick-per-lane rules (merge.js).
import test from "node:test";
import assert from "node:assert/strict";
import { clearFor, tidy, mergeTracks } from "../merge.js";

const B = (start, len, cls = 0, extra = {}) => ({ start, len, cls, sure: true, box: { x: 0, y: 0, w: 1, h: 1 }, ...extra });

test("a brick moved onto others trims or removes them", () => {
  const a = B(0, 4), c = B(6, 2), k = B(3, 4, 1);
  const out = clearFor([a, c, k], k);
  assert.deepEqual(out.map((b) => [b.start, b.len]), [[0, 3], [3, 4], [7, 1]]);
});

test("tidy stops each brick where the next starts", () => {
  const out = tidy([B(0, 6), B(4, 2), B(4, 4, 1, { user: true })]);
  assert.deepEqual(out.map((b) => [b.start, b.len, b.cls]), [[0, 4, 0], [4, 4, 1]]);
});

test("the same mat again keeps ids, edits and gains confidence; a shifted first brick is allowed", () => {
  const edited = B(2, 2, 3, { id: 7, user: true, sure: true });
  const old = [{ bricks: [B(0, 2, 0, { id: 1, sure: false }), edited, B(6, 2, 1, { id: 2 })] }, { bricks: [B(0, 4, 5, { id: 3 })] }];
  // new photo: first lane's first brick not seen, everything shifts by 2 studs; second lane fine
  const fresh = [{ bricks: [B(0, 2, 3), B(4, 2, 1)] }, { bricks: [B(0, 4, 5)] }];
  const m = mergeTracks(old, fresh);
  assert.ok(m);
  const l0 = m[0].bricks;
  assert.equal(l0.find((b) => b.id === 7).cls, 3);
  assert.equal(l0.find((b) => b.id === 2).start, 4);
  assert.equal(l0.find((b) => b.id === 2).seen, 2);
  assert.equal(l0.find((b) => b.id === 1).sure, false); // not shown this time: stays, unsure
  assert.equal(l0.find((b) => b.id === 1).start, -2 + 0); // old start 0 - d(2) → left of the new origin
  assert.equal(m[1].bricks[0].id, 3);
});

test("a different mat replaces instead of merging", () => {
  const old = [{ bricks: [B(0, 2, 0), B(2, 2, 1)] }];
  assert.equal(mergeTracks(old, [{ bricks: [B(0, 2, 5), B(2, 2, 6)] }]), null);
  assert.equal(mergeTracks(old, [{ bricks: [] }, { bricks: [] }]), null);
});
