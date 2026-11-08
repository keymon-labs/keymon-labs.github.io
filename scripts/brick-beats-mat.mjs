// Draws a synthetic brick mat (green plate, optional blue tape lanes, bricks) for Brick Beats tests and its taped example image.
// `node scripts/brick-beats-mat.mjs` rewrites brick-beats/example-taped.png. Tests only use generated mats, never photos.
import { writeFileSync } from "node:fs";
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
export function renderMat(lanes, { scale = 1, tape = true } = {}) {
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
  rect(0, 0, W, W, FLOOR);
  rect(m, m, 24 * p, 24 * p, PLATE);
  for (let r = 0; r < 24; r++) for (let c = 0; c < 24; c++) disc(m + (c + 0.5) * p, m + (r + 0.5) * p, 0.3 * p, PLATE_STUD);
  if (tape) for (let j = 0; j <= lanes.length; j++) rect(m, m + (1.5 + 5 * j) * p - 0.45 * p, 24 * p, 0.9 * p, TAPE);
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
}
