// Drone Hide: pure rules on small camera buffers (foreground mask, rocks, drone sight, touching gems). Used by game.js.

/** Pixels that differ from the background snapshot, minus single specks. cur: RGBA, bg: RGBA-layout array. */
export function foreground(cur, bg, w, h, thr = 60) {
  const raw = new Uint8Array(w * h), out = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < w * h; i++, p += 4) {
    raw[i] = Math.abs(cur[p] - bg[p]) + Math.abs(cur[p + 1] - bg[p + 1]) + Math.abs(cur[p + 2] - bg[p + 2]) > thr ? 1 : 0;
  }
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    if (!raw[i]) continue;
    const n = raw[i - w - 1] + raw[i - w] + raw[i - w + 1] + raw[i - 1] + raw[i + 1] + raw[i + w - 1] + raw[i + w] + raw[i + w + 1];
    if (n >= 5) out[i] = 1;
  }
  return out;
}

/** Let the background follow slow light changes, only where nobody is standing. */
export function adapt(bg, cur, mask, w, h, rate = 1 / 32) {
  for (let i = 0, p = 0; i < w * h; i++, p += 4) {
    if (mask[i]) continue;
    bg[p] += (cur[p] - bg[p]) * rate; bg[p + 1] += (cur[p + 1] - bg[p + 1]) * rate; bg[p + 2] += (cur[p + 2] - bg[p + 2]) * rate;
  }
}

/** Count mask pixels inside a region {x0,x1} (columns) or {cx,cy,r} (circle). With `rock`, only pixels NOT behind a rock. */
export function countIn(mask, w, h, reg, rock) {
  const circle = reg.r != null;
  const xa = circle ? Math.max(0, Math.floor(reg.cx - reg.r)) : Math.max(0, reg.x0);
  const xb = circle ? Math.min(w - 1, Math.ceil(reg.cx + reg.r)) : Math.min(w - 1, reg.x1 - 1);
  const ya = circle ? Math.max(0, Math.floor(reg.cy - reg.r)) : 0;
  const yb = circle ? Math.min(h - 1, Math.ceil(reg.cy + reg.r)) : h - 1;
  let n = 0;
  for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
    const i = y * w + x;
    if (!mask[i] || (rock && rock[i])) continue;
    if (circle && (x - reg.cx) ** 2 + (y - reg.cy) ** 2 > reg.r * reg.r) continue;
    n++;
  }
  return n;
}

/** Share of a player's pixels that are behind rocks (1 = fully hidden, 1 when there is nobody). */
export function hiddenShare(mask, rock, w, h, half) {
  const total = countIn(mask, w, h, half), shown = countIn(mask, w, h, half, rock);
  return total ? 1 - shown / total : 1;
}

/** Does the drone's beam (circle) catch visible player pixels? */
export const seen = (mask, rock, w, h, beam, minPix = 25) => countIn(mask, w, h, beam, rock) >= minPix;

/** Is a body touching a gem (circle)? Rocks don't matter: gems sit in the open. */
export const touches = (mask, w, h, gem, minPix = 10) => countIn(mask, w, h, gem) >= minPix;

/** Rock footprint as a 0/1 buffer. rocks: [{x,y,rx,ry}] */
export function rockMask(rocks, w, h) {
  const m = new Uint8Array(w * h);
  for (const r of rocks) for (let y = Math.max(0, Math.floor(r.y - r.ry)); y <= Math.min(h - 1, Math.ceil(r.y + r.ry)); y++)
    for (let x = Math.max(0, Math.floor(r.x - r.rx)); x <= Math.min(w - 1, Math.ceil(r.x + r.rx)); x++)
      if (((x - r.x) / r.rx) ** 2 + ((y - r.y) / r.ry) ** 2 <= 1) m[y * w + x] = 1;
  return m;
}

/** `perHalf` rocks in each half of the picture, spread apart. rng: shared/rng.js createRng. */
export function makeRocks(rng, w, h, perHalf = 2) {
  const rocks = [];
  for (let side = 0; side < 2; side++) {
    const x0 = side * w / 2, mine = [];
    for (let tries = 0; mine.length < perHalf && tries < 400; tries++) {
      const rx = rng.int(17, 23), ry = rng.int(16, 22);
      const r = { x: rng.int(x0 + rx + 2, x0 + w / 2 - rx - 2), y: rng.int(Math.round(h * .4), Math.round(h - ry - 4)), rx, ry };
      if (mine.every(o => Math.hypot(o.x - r.x, o.y - r.y) > 30)) mine.push(r);
    }
    rocks.push(...mine);
  }
  return rocks;
}
