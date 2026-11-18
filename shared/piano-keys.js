// On-screen piano keyboard geometry: which key is under a point. Drawing stays in each app; this keeps taps and drawing in step.
// Layout: white keys side by side, black keys 0.6 of a white key wide and 0.6 tall, centred on the line between two whites.
import { isSharp } from "./music.js";

/** White keys from lo to hi (MIDI), left to right. */
export const whiteKeys = (lo, hi) => { const w = []; for (let m = lo; m <= hi; m++) if (!isSharp(m)) w.push(m); return w; };

/** kb = { x, y, w (one white key), h, lo, hi } in the same units as (px, py). Returns the MIDI note under the point, or null. */
export function keyAt(kb, px, py) {
  if (py < kb.y || py > kb.y + kb.h) return null;
  const whites = whiteKeys(kb.lo, kb.hi), u = (px - kb.x) / kb.w, i = Math.floor(u);
  if (i < 0 || i >= whites.length) return null;
  if (py < kb.y + kb.h * 0.6) {
    const f = u - i, up = whites[i] + 1, down = whites[i] - 1;
    if (f > 0.7 && isSharp(up) && up <= kb.hi) return up;
    if (f < 0.3 && isSharp(down) && down >= kb.lo) return down;
  }
  return whites[i];
}
