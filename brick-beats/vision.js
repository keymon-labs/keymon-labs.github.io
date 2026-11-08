// Reads a photo of a brick mat: finds the green baseplate, optional blue tape lanes and the bricks, as lanes of {colour, start, length}. Pure, no DOM; tests in test/vision.test.js.
export const NAMES = ['red', 'brown', 'coral', 'yellow', 'pale_yellow', 'lime', 'clear_lime', 'cyan', 'blue', 'pink', 'white'];

export function classifyHSV(h, s, v) {
  if ((v > 0.5 && s < 0.26 && h >= 170 && h < 225) || (v > 0.8 && s < 0.09)) return 10; // white
  if (h >= 200 && h < 235 && s > 0.5) return 8; // blue
  if (h >= 183 && h < 200 && s > 0.4) return 7; // cyan
  if (h >= 70 && h < 135 && s > 0.12) return v > 0.75 ? 5 : 6; // lime, clear lime
  if (h >= 35 && h < 70 && s > 0.5) return 3; // yellow
  if (h >= 35 && h < 70 && s > 0.2) return 4; // pale yellow
  if (h >= 280 && h < 335 && s > 0.25) return 9; // pink
  if (h < 32 && v < 0.62 && s > 0.3) return 1; // brown
  if ((h >= 335 || h < 14) && v > 0.82 && s > 0.3) return 2; // coral
  if ((h >= 325 || h < 10) && s > 0.35) return 0; // red
  return -1;
}

const HSV = [0, 0, 0]; // reused to avoid one allocation per pixel
export function rgbToHsv(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d > 0) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  HSV[0] = h; HSV[1] = mx ? d / mx : 0; HSV[2] = mx / 255;
  return HSV;
}

function morph(src, W, H, grow) {
  // 3x3 box dilate (grow) or erode, separable; outside the image counts as empty
  const tmp = new Uint8Array(W * H), out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    const o = y * W;
    for (let x = 0; x < W; x++) {
      const a = x > 0 ? src[o + x - 1] : 0, b = src[o + x], c = x < W - 1 ? src[o + x + 1] : 0;
      tmp[o + x] = grow ? (a | b | c) : (a & b & c);
    }
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const a = y > 0 ? tmp[(y - 1) * W + x] : 0, b = tmp[y * W + x], c = y < H - 1 ? tmp[(y + 1) * W + x] : 0;
      out[y * W + x] = grow ? (a | b | c) : (a & b & c);
    }
  }
  return out;
}

function fillHoles(fg, W, H) {
  const seen = new Uint8Array(W * H), st = new Int32Array(W * H);
  let sp = 0;
  const push = (i) => { if (!fg[i] && !seen[i]) { seen[i] = 1; st[sp++] = i; } };
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  while (sp) {
    const i = st[--sp], x = i % W, y = (i / W) | 0;
    if (x > 0) push(i - 1);
    if (x < W - 1) push(i + 1);
    if (y > 0) push(i - W);
    if (y < H - 1) push(i + W);
  }
  const out = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) out[i] = fg[i] || !seen[i] ? 1 : 0;
  return out;
}

function median(arr) {
  const a = Uint8Array.from(arr).sort();
  return a[a.length >> 1];
}

export function detect(data, W, H) {
  const N = W * H;
  const plate = new Uint8Array(N), tape = new Uint8Array(N), cls = new Int8Array(N).fill(-1);
  let plateCount = 0;
  for (let i = 0; i < N; i++) {
    const [h, s, v] = rgbToHsv(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
    if (h >= 135 && h < 183 && s > 0.3 && v > 0.15) { plate[i] = 1; plateCount++; continue; }
    if (v < 0.22) continue;
    if (h >= 12 && h < 48 && s < 0.36 && v > 0.3 && v < 0.8) continue; // wood floor
    if (h >= 196 && h < 224 && s >= 0.52 && s < 0.84 && v >= 0.5 && v < 0.97) tape[i] = 1; // candidate blue masking tape, only removed if lanes are found
    cls[i] = classifyHSV(h, s, v);
  }
  if (plateCount < N * 0.04) return { ok: false, msg: 'No green baseplate found. Shoot from above with the whole plate in view.' };

  const rows = new Int32Array(H), cols = new Int32Array(W);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (plate[y * W + x]) { rows[y]++; cols[x]++; }
  const rmax = Math.max(...rows), cmax = Math.max(...cols);
  let y0 = 0, y1 = H - 1, x0 = 0, x1 = W - 1;
  while (rows[y0] <= rmax * 0.25) y0++;
  while (rows[y1] <= rmax * 0.25) y1--;
  while (cols[x0] <= cmax * 0.25) x0++;
  while (cols[x1] <= cmax * 0.25) x1--;
  const pw = x1 - x0, sc = pw / 603;

  // lanes: long blue tape strips across the plate. Find their tilt, then the strips as peaks of the tilt-corrected histogram.
  let laneLines = null, cs = 1, sn = 0;
  {
    const px = [], py = [];
    for (let y = 0; y < H; y++) for (let x = x0; x <= x1; x++) if (tape[y * W + x]) { px.push(x); py.push(y); }
    if (px.length > pw * 8) {
      let bestScore = -1, bestA = 0;
      for (let a = -4; a <= 4.001; a += 0.25) {
        const t = (a * Math.PI) / 180, c = Math.cos(t), sx = Math.sin(t), hist = new Int32Array(H + W + 4);
        for (let k = 0; k < px.length; k++) hist[Math.round(py[k] * c - px[k] * sx) + W]++;
        let sc2 = 0;
        for (let k = 0; k < hist.length; k++) sc2 += hist[k] * hist[k];
        if (sc2 > bestScore) { bestScore = sc2; bestA = a; }
      }
      const t = (bestA * Math.PI) / 180;
      cs = Math.cos(t); sn = Math.sin(t);
      const hist = new Int32Array(H + W + 4);
      for (let k = 0; k < px.length; k++) hist[Math.round(py[k] * cs - px[k] * sn) + W]++;
      const thr = 0.25 * pw, lines = [];
      let cur = null;
      for (let k = 0; k < hist.length; k++) {
        if (hist[k] >= thr) {
          if (cur && k - cur.hi <= 3) { cur.hi = k; cur.sum += hist[k] * k; cur.w += hist[k]; }
          else { cur = { lo: k, hi: k, sum: hist[k] * k, w: hist[k] }; lines.push(cur); }
        }
      }
      const good = lines.filter((l) => l.hi - l.lo >= 3).map((l) => ({ c: l.sum / l.w - W, lo: l.lo - W, hi: l.hi - W }));
      if (good.length >= 2 && good.length <= 14) laneLines = good;
    }
    if (laneLines) for (let i = 0; i < N; i++) if (tape[i]) cls[i] = -1;
  }

  let fg = new Uint8Array(N);
  const ya = Math.max(0, Math.round(y0 - 40 * sc)), yb = Math.min(H, y1 + 5), xa = Math.max(0, x0 - 5), xb = Math.min(W, x1 + 5);
  for (let y = ya; y < yb; y++) for (let x = xa; x < xb; x++) if (cls[y * W + x] >= 0) fg[y * W + x] = 1;
  fg = morph(morph(fg, W, H, false), W, H, false);
  fg = morph(morph(fg, W, H, true), W, H, true);
  fg = morph(morph(fg, W, H, true), W, H, true);
  fg = morph(morph(fg, W, H, false), W, H, false);
  fg = fillHoles(fg, W, H);

  // connected components (4-neighbour)
  const lab = new Int32Array(N), st = new Int32Array(N);
  const blobs = [];
  let id = 0;
  for (let i0 = 0; i0 < N; i0++) {
    if (!fg[i0] || lab[i0]) continue;
    id++;
    let sp = 0, area = 0, bx0 = W, by0 = H, bx1 = 0, by1 = 0;
    st[sp++] = i0; lab[i0] = id;
    while (sp) {
      const i = st[--sp], x = i % W, y = (i / W) | 0;
      area++;
      if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y;
      if (x > 0 && fg[i - 1] && !lab[i - 1]) { lab[i - 1] = id; st[sp++] = i - 1; }
      if (x < W - 1 && fg[i + 1] && !lab[i + 1]) { lab[i + 1] = id; st[sp++] = i + 1; }
      if (y > 0 && fg[i - W] && !lab[i - W]) { lab[i - W] = id; st[sp++] = i - W; }
      if (y < H - 1 && fg[i + W] && !lab[i + W]) { lab[i + W] = id; st[sp++] = i + W; }
    }
    const w = bx1 - bx0 + 1, h = by1 - by0 + 1;
    if (area >= 900 * sc * sc && Math.min(w, h) >= 24 * sc && w < pw * 0.7 && area / (w * h) >= 0.62) blobs.push({ id, x: bx0, y: by0, w, h });
  }
  if (!blobs.length) return { ok: false, msg: 'The plate was found but no bricks were seen on it.' };

  // stud pitch: a standard 24-stud baseplate gives a strong prior (brick tops sit a little closer to the camera, so ~4% larger);
  // otherwise fall back to the brick width. Then a narrow search makes brick edges land on whole studs.
  const shorts = blobs.map((b) => Math.min(b.w, b.h)).sort((a, b) => a - b);
  const p0 = shorts[shorts.length >> 1] / 2;
  const pPlate = (pw / 24) * 1.044;
  const usePrior = Math.abs(pPlate / p0 - 1) < 0.15;
  const centre = usePrior ? pPlate : p0 * 0.97;
  const span = usePrior ? 5 : 16;
  let bestErr = Infinity, p = centre;
  for (let k = -span; k <= span; k++) {
    const pp = centre * (1 + k * 0.0025);
    let err = 0;
    for (const b of blobs) for (const t of [b.x / pp, (b.x + b.w) / pp]) err += Math.abs(t - Math.round(t));
    if (err < bestErr) { bestErr = err; p = pp; }
  }

  // split each blob into 2-stud cells, colour each by median RGB, merge equal neighbours
  const bricks = [];
  for (const b of blobs) {
    const L = Math.max(1, Math.round(b.w / p)), n = Math.max(1, L >> 1), cw = b.w / n;
    const seq = [];
    for (let k = 0; k < n; k++) {
      const cxa = Math.floor(b.x + k * cw + cw * 0.2), cxb = Math.floor(b.x + (k + 1) * cw - cw * 0.2);
      const cya = b.y + Math.floor(b.h * 0.2), cyb = b.y + Math.floor(b.h * 0.8);
      const R = [], G = [], B = [], votes = new Array(11).fill(0);
      for (let y = cya; y < cyb; y++) for (let x = cxa; x < cxb; x++) {
        const i = y * W + x;
        if (lab[i] !== b.id) continue;
        R.push(data[i * 4]); G.push(data[i * 4 + 1]); B.push(data[i * 4 + 2]);
        if (cls[i] >= 0) votes[cls[i]]++;
      }
      let c = -1, sure = true;
      if (R.length) {
        const [h, s, v] = rgbToHsv(median(R), median(G), median(B));
        c = classifyHSV(h, s, v);
      }
      if (c < 0) { sure = false; let m = 0; c = 10; votes.forEach((vv, j) => { if (vv > m) { m = vv; c = j; } }); }
      seq.push({ c, sure });
    }
    const runs = [];
    seq.forEach((e, k) => {
      const r = runs[runs.length - 1];
      if (r && r.c === e.c) r.n++;
      else runs.push({ c: e.c, k, n: 1, sure: e.sure });
    });
    for (const r of runs) {
      bricks.push({ cls: r.c, sure: r.sure, x: b.x + r.k * cw, y: b.y, w: r.n * cw, h: b.h, len: (L / n) * r.n, cy: b.y + b.h / 2 });
    }
  }

  // group into tracks
  let rowsOut = [];
  if (laneLines) {
    rowsOut = laneLines.slice(0, -1).map((l, j) => ({ mid: (l.c + laneLines[j + 1].c) / 2, bricks: [] }));
    for (const br of bricks) {
      const yp = br.cy * cs - (br.x + br.w / 2) * sn;
      for (let j = 0; j < laneLines.length - 1; j++) if (yp > laneLines[j].c && yp < laneLines[j + 1].c) { rowsOut[j].bricks.push(br); break; }
    }
  } else {
    bricks.sort((a, b) => a.cy - b.cy);
    for (const br of bricks) {
      const last = rowsOut[rowsOut.length - 1];
      if (last && br.cy - last.cy < p * 1.5) { last.bricks.push(br); last.cy = (last.cy * (last.bricks.length - 1) + br.cy) / last.bricks.length; }
      else rowsOut.push({ cy: br.cy, bricks: [br] });
    }
  }
  const kept = rowsOut.flatMap((r) => r.bricks);
  if (!kept.length) return { ok: false, msg: 'No bricks were found between the tape lines.' };
  const xmin = Math.min(...kept.map((b) => b.x));
  let loopLen = 1;
  const tracks = rowsOut.map((r, i) => {
    r.bricks.sort((a, b) => a.x - b.x);
    return {
      row: i + 1,
      mid: r.mid,
      bricks: r.bricks.map((b) => {
        const start = Math.max(0, Math.round((b.x - xmin) / p)), len = Math.max(1, Math.round(b.len));
        loopLen = Math.max(loopLen, start + len);
        return { cls: b.cls, sure: b.sure, start, len, x: b.x, y: b.y, w: b.w, h: b.h };
      }),
    };
  });

  // least-squares fit px = a + b * studs, used to draw the playhead over the photo
  let sx = 0, sy = 0, sxx = 0, sxy = 0, cnt = 0;
  for (const t of tracks) for (const b of t.bricks) { sx += b.start; sy += b.x; sxx += b.start * b.start; sxy += b.start * b.x; cnt++; }
  const den = cnt * sxx - sx * sx;
  const slope = den ? (cnt * sxy - sx * sy) / den : p;
  const icpt = (sy - slope * sx) / cnt;
  return { ok: true, W, H, plate: { x0, y0, x1, y1 }, lanes: laneLines ? { sn, cs } : null, pitch: p, fit: { a: icpt, b: slope }, loopLen, tracks, brickCount: cnt };
}

