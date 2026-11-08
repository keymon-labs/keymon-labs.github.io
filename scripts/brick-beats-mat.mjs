// Draws a synthetic brick mat (green plate, optional blue tape lanes, bricks) for Brick Beats tests and its taped example image.
// `node scripts/brick-beats-mat.mjs` rewrites brick-beats/example-taped.png. Tests only use generated mats, never photos.
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { fileURLToPath, pathToFileURL } from "node:url";

// Colours as the camera sees them (what vision.js is tuned on), not the app's swatch colours.
export const BRICK_RGB = {
  red: [184, 68, 88], brown: [123, 77, 61], coral: [252, 129, 140], yellow: [230, 190, 57], pale_yellow: [226, 214, 149],
  lime: [180, 216, 60], clear_lime: [135, 163, 119], cyan: [6, 164, 210], blue: [5, 91, 161], pink: [205, 105, 190], white: [192, 210, 216],
};
const PLATE = [5, 122, 95], PLATE_STUD = [24, 142, 110], FLOOR = [159, 133, 110], TAPE = [63, 148, 221];

/** One entry per lane, each [colour, startStud, lengthStuds]. Uses every fruit rhythm. */
export const EXAMPLE = [
  [["yellow", 0, 2], ["coral", 3, 2], ["pink", 6, 4], ["cyan", 11, 2], ["blue", 14, 4], ["red", 19, 2]],
  [["lime", 0, 4], ["pink", 4, 2], ["white", 8, 6], ["red", 15, 2], ["blue", 17, 4]],
  [["brown", 0, 8], ["cyan", 9, 4], ["brown", 14, 8]],
  [["clear_lime", 1, 2], ["coral", 5, 2], ["yellow", 9, 2], ["pale_yellow", 13, 6], ["pink", 20, 2]],
];

/**
 * Render lanes (max 4) on a 24-stud plate. scale 1 gives 640x640, the size the app analyses.
 * Bricks sit on a grid 4.4% bigger than the plate's, like real bricks seen from above.
 */
export function renderMat(lanes, { scale = 1, tape = true, wood = false, overhang = 0 } = {}) {
  if (lanes.length > 4) throw new Error("renderMat draws at most 4 lanes");
  const p = 24 * scale, m = 32 * scale, W = 24 * p + 2 * m, pb = 1.044 * p;
  const data = new Uint8ClampedArray(W * W * 4);
  const rect = (x, y, w, h, c) => {
    for (let j = Math.max(0, Math.round(y)); j < Math.min(W, Math.round(y + h)); j++)
      for (let i = Math.max(0, Math.round(x)); i < Math.min(W, Math.round(x + w)); i++) data.set([c[0], c[1], c[2], 255], (j * W + i) * 4);
  };
  const disc = (cx, cy, r, c) => {
    for (let j = Math.floor(cy - r); j <= cy + r; j++)
      for (let i = Math.floor(cx - r); i <= cx + r; i++) if ((i - cx) ** 2 + (j - cy) ** 2 <= r * r) data.set([c[0], c[1], c[2], 255], (j * W + i) * 4);
  };
  if (wood) { // planks with a faint grain: the floor is not one flat colour, and tape ends can lie on it
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const plank = Math.floor((y + 0.25 * x) / (5 * p)), tone = 1 + (((plank * 7919) % 13) - 6) * 0.012 + Math.sin(x * 0.045 + plank * 2) * 0.025;
      const seam = Math.abs(((y + 0.25 * x) / (5 * p)) % 1) < 0.01;
      data.set([FLOOR[0] * tone * (seam ? 0.7 : 1), FLOOR[1] * tone * (seam ? 0.7 : 1), FLOOR[2] * tone * (seam ? 0.7 : 1), 255], (y * W + x) * 4);
    }
  } else rect(0, 0, W, W, FLOOR);
  rect(m, m, 24 * p, 24 * p, PLATE);
  for (let r = 0; r < 24; r++) for (let c = 0; c < 24; c++) disc(m + (c + 0.5) * p, m + (r + 0.5) * p, 0.3 * p, PLATE_STUD);
  if (tape) for (let j = 0; j <= lanes.length; j++) rect(m - overhang * p, m + (1.5 + 5 * j) * p - 0.45 * p, (24 + 2 * overhang) * p, 0.9 * p, TAPE); // overhang: tape ends past the plate, on the floor
  lanes.forEach((bricks, k) => {
    const top = m + (4 + 5 * k) * p - pb;
    for (const [name, start, len] of bricks) {
      const c = BRICK_RGB[name], x = m + 0.5 * p + start * pb;
      rect(x, top, len * pb, 2 * pb, c.map((v) => v * 0.7));
      rect(x + 2, top + 2, len * pb - 4, 2 * pb - 4, c);
      for (let i = 0; i < len; i++) for (let r = 0; r < 2; r++) disc(x + (i + 0.5) * pb, top + (r + 0.5) * pb, 0.3 * pb, c.map((v) => Math.min(255, v * 1.12 + 10)));
    }
  });
  return { data, width: W, height: W };
}

/**
 * Photograph a rendered mat from an angle: rotates it by `rot` degrees, squeezes the far side by `tilt` (perspective, 0.001 per px at the
 * edge of a 1000 px picture) and shrinks it by `scale`, into an outW x outH floor-coloured picture. For testing the straightening step.
 */
export function distort({ data, width, height }, { outW = 1000, outH = 1300, rot = 0, tilt = 0, scale = 0.8 } = {}) {
  const out = new Uint8ClampedArray(outW * outH * 4), t = (rot * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
  for (let v = 0; v < outH; v++) for (let u = 0; u < outW; u++) {
    const uu = u - outW / 2, vv = v - outH / 2, w = 1 - tilt * vv, x0 = uu / w, y0 = vv / w; // undo perspective
    const sx = (c * x0 + s * y0) / scale + width / 2, sy = (-s * x0 + c * y0) / scale + height / 2, o = (v * outW + u) * 4;
    if (sx < 0 || sy < 0 || sx >= width - 1 || sy >= height - 1) { out.set([FLOOR[0], FLOOR[1], FLOOR[2], 255], o); continue; }
    const ix = sx | 0, iy = sy | 0, fx = sx - ix, fy = sy - iy, p = (iy * width + ix) * 4;
    for (let k = 0; k < 3; k++) out[o + k] = data[p + k] * (1 - fx) * (1 - fy) + data[p + 4 + k] * fx * (1 - fy) + data[p + width * 4 + k] * (1 - fx) * fy + data[p + width * 4 + 4 + k] * fx * fy;
    out[o + 3] = 255;
  }
  return { data: out, width: outW, height: outH };
}

/** A set of generated test photos (each exactly readable): the example list in the app and in test/examples.test.js. */
const SPARSE = [[["red", 2, 2], ["cyan", 8, 4]], [["pink", 0, 2]], [["lime", 6, 6]], [["blue", 12, 2], ["yellow", 17, 4]]];
export const SCENARIOS = [
  { id: "straight", title: "Straight on", note: "Camera straight above, tape lanes.", lanes: EXAMPLE, mat: {}, photo: {} },
  { id: "rotated", title: "Turned 25°", note: "The mat is turned in the picture.", lanes: EXAMPLE, mat: {}, photo: { rot: 25 } },
  { id: "slanted", title: "Slanted", note: "Seen from a low angle: the far side looks shorter.", lanes: EXAMPLE, mat: {}, photo: { rot: 6, tilt: 0.0004 } },
  { id: "floor-tape", title: "Wood floor, tape ends", note: "Planks on the floor and the blue tape sticking out past the plate.", lanes: EXAMPLE, mat: { wood: true, overhang: 0.9 }, photo: { rot: -8, tilt: 0.0002 } },
  { id: "far", title: "Small in the frame", note: "Turned, slanted and far away.", lanes: EXAMPLE, mat: { wood: true }, photo: { rot: -15, tilt: 0.0003, scale: 0.6 } },
  { id: "plain", title: "No tape, few bricks", note: "Plain plate: lanes come from the gaps between rows.", lanes: SPARSE, mat: { tape: false }, photo: { rot: 4 } },
];
/** The photo for a scenario: { data, width, height } (800 x 1040, the app reads it like a phone photo). */
export const renderScenario = (sc) => distort(renderMat(sc.lanes, { scale: 1, ...sc.mat }), { outW: 800, outH: 1040, scale: 0.9, ...sc.photo });

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

/** RGBA pixels to PNG bytes. */
export function encodePng({ data, width, height }) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) Buffer.from(data.buffer, y * width * 4, width * 4).copy(raw, y * (width * 4 + 1) + 1);
  const chunk = (type, body) => {
    const head = Buffer.alloc(8), tail = Buffer.alloc(4), t = Buffer.from(type);
    head.writeUInt32BE(body.length, 0); t.copy(head, 4);
    tail.writeUInt32BE(crc32(Buffer.concat([t, body])), 0);
    return Buffer.concat([head, body, tail]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const out = fileURLToPath(new URL("../brick-beats/example-taped.png", import.meta.url));
  writeFileSync(out, encodePng(renderMat(EXAMPLE, { scale: 1.5 })));
  console.log("wrote", out);
  // the test set: brick-beats/examples/<id>.png + index.json (listed in the app under "More test photos")
  const dir = fileURLToPath(new URL("../brick-beats/examples/", import.meta.url));
  mkdirSync(dir, { recursive: true });
  for (const sc of SCENARIOS) writeFileSync(`${dir}${sc.id}.png`, encodePng(renderScenario(sc)));
  writeFileSync(`${dir}index.json`, JSON.stringify(SCENARIOS.map(({ id, title, note }) => ({ id, title, note })), null, 1) + "\n");
  console.log("wrote", SCENARIOS.length, "test photos to", dir);
}
