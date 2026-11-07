// Checks for the recogniser on synthetic staves: pitch from position, length from head/stem/flag/dot, bars from barlines, doubt, and "nothing found".
import test from "node:test";
import assert from "node:assert/strict";
import { recognize } from "../omr/engine.js";
import { drawStaff } from "./synth.js";

const sum = (r) => r.map((n) => `${n.pitch}:${n.beats}:${n.bar}`).join(" ");
const q = (x, s, stem = s >= 4 ? "down" : "up", extra = {}) => ({ x, s, kind: "filled", stem, ...extra });

test("quarter notes: pitch from the line or space, stem up or down", async () => {
  const img = drawStaff({ notes: [q(80, 0), q(150, 2), q(220, 4), q(290, 6), q(360, 8), q(430, 3)] });
  assert.equal(sum(await recognize(img)), "E4:1:0 G4:1:0 B4:1:0 D5:1:0 F5:1:0 A4:1:0");
});

test("ledger lines: middle C below and A5 above", async () => {
  const img = drawStaff({ notes: [q(100, -2), q(200, 10, "down"), q(300, -3, "up")] });
  assert.equal(sum(await recognize(img)), "C4:1:0 A5:1:0 B3:1:0");
});

test("bass clef shifts every pitch", async () => {
  const img = drawStaff({ notes: [q(100, 0), q(200, 4, "down"), q(300, 8, "down")] });
  assert.equal(sum(await recognize(img, { clef: "bass" })), "G2:1:0 D3:1:0 A3:1:0");
});

test("lengths: half, whole, eighth with flag, dotted quarter, dotted half", async () => {
  const img = drawStaff({ w: 700, notes: [
    { x: 80, s: 2, kind: "hollow", stem: "up" }, { x: 170, s: 4, kind: "whole" },
    q(260, 6, "down", { flag: true }), q(350, 2, "up", { dot: true }),
    { x: 450, s: 3, kind: "hollow", stem: "up", dot: true }, q(560, 5, "down")] });
  assert.equal(sum(await recognize(img)), "G4:2:0 B4:4:0 D5:0.5:0 G4:1.5:0 A4:3:0 C5:1:0");
});

test("beamed eighths count as eighths", async () => {
  const sp = 16, top = 50, yTip = (s) => top + 4 * sp - (s * sp) / 2 - 3.5 * sp;
  const img = drawStaff({ notes: [q(100, 2, "up"), q(170, 4, "up")], beams: [{ x1: 100 + 0.65 * sp - 2, x2: 170 + 0.65 * sp, y: yTip(2) }] });
  assert.equal(sum(await recognize(img)), "G4:0.5:0 B4:0.5:0");
});

test("barlines number the bars from the first note", async () => {
  const img = drawStaff({ notes: [q(60, 0), q(130, 2), q(260, 4), q(330, 6), q(460, 8)], bars: [20, 200, 400, 540] });
  assert.equal(sum(await recognize(img)), "E4:1:0 G4:1:0 B4:1:1 D5:1:1 F5:1:2");
});

test("a head between a line and a space gets low confidence; clean ones do not", async () => {
  const img = drawStaff({ notes: [q(100, 2), q(200, 4.5, "down"), q(300, 6, "down")] });
  const r = await recognize(img);
  assert.ok(r[0].confidence > 0.8 && r[2].confidence > 0.8, JSON.stringify(r));
  assert.ok(r[1].confidence < 0.6, JSON.stringify(r));
});

test("soft, noisy, smaller print still reads", async () => {
  const img = drawStaff({ w: 480, h: 130, sp: 12, top: 40, blur: true, noise: 0.01, notes: [q(60, 0), { x: 130, s: 3, kind: "hollow", stem: "up" }, q(200, 5, "down"), q(270, 8, "down")] });
  const r = await recognize(img);
  assert.equal(sum(r), "E4:1:0 A4:2:0 C5:1:0 F5:1:0");
});

test("nothing found: blank page, text-only page", async () => {
  const blank = { width: 200, height: 100, data: new Uint8ClampedArray(200 * 100 * 4).fill(255) };
  assert.deepEqual(await recognize(blank), []);
  const staffOnly = drawStaff({ notes: [] });
  assert.deepEqual(await recognize(staffOnly), []);
});
