// Zoom Tunnel (prototype): pictures nested inside polygon "portals" of each other, zoomed forever. Styles: style.css. No data files.
// Camera = complex similarity (screen = A*z + B) on the current level; crossing a portal switches level without a visible jump.
// Storage: IndexedDB 'zoomtunnel' on this device only (photos never leave it). The five starter pictures are drawn in code (canvas).
// shortcut: no PWA/offline, no align/rotate UI for photos (centre-crop only), no repair of self-intersecting loops, one-step undo; add when promoting to Final.
const S = 1024, TAU = Math.PI * 2;
const shapes = {
  hex: () => Array.from({length: 6}, (_, i) => [Math.cos(i * TAU / 6), Math.sin(i * TAU / 6)]),
  star: () => Array.from({length: 10}, (_, i) => { const r = i % 2 ? .55 : 1, t = i * TAU / 10 - Math.PI / 2; return [r * Math.cos(t), r * Math.sin(t)]; }),
  blob: () => Array.from({length: 40}, (_, i) => { const t = i * TAU / 40, r = 1 + .1 * Math.sin(3 * t) + .07 * Math.sin(5 * t + 1); return [r * Math.cos(t), r * Math.sin(t)]; }),
  trefoil: () => Array.from({length: 48}, (_, i) => { const t = i * TAU / 48, r = .8 + .2 * Math.cos(3 * t); return [r * Math.cos(t), r * Math.sin(t)]; }),
  heart: () => Array.from({length: 48}, (_, i) => { const t = i * TAU / 48; return [16 * Math.sin(t) ** 3 / 17, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17]; }),
};
shapes.circle = () => Array.from({ length: 48 }, (_, i) => [Math.cos(i * TAU / 48), Math.sin(i * TAU / 48)]);
shapes.square = () => smooth([[-.8, -.8], [.8, -.8], [.8, .8], [-.8, .8]]);
shapes.triangle = () => smooth([[0, -1], [.9, .6], [-.9, .6]]);
shapes.flower = () => Array.from({ length: 60 }, (_, i) => { const t = i * TAU / 60, r = .75 + .25 * Math.cos(5 * t); return [r * Math.cos(t), r * Math.sin(t)]; });
let seed = 7; const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
const C = (g, x, y, r, f) => { g.fillStyle = f; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
const R = (g, x, y, w, h, f, rad = 0) => { g.fillStyle = f; g.beginPath(); g.roundRect(x, y, w, h, rad); g.fill(); };
const T = (g, a, b, c, d, e, f, fill) => { g.fillStyle = fill; g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.lineTo(e, f); g.fill(); };
const St = (g, x, y, r, f) => { g.fillStyle = f; g.beginPath(); for (let i = 0; i < 10; i++) { const t = i * TAU / 10 - Math.PI / 2, q = i % 2 ? r * .45 : r; g.lineTo(x + q * Math.cos(t), y + q * Math.sin(t)); } g.fill(); };
const dots = (g, n, cols, rmax) => { for (let i = 0; i < n; i++) C(g, 60 + rnd() * 904, 60 + rnd() * 904, 4 + rnd() * rmax, cols[i % cols.length]); };

const LIB = [
  { name: 'Village', bg: '#bfe6ff', shape: 'hex', c: [520, 560], R: 120, rot: .35, art(g) {
    dots(g, 18, ['#fff', '#ffe08a'], 6);
    C(g, 190, 190, 70, '#ffd23f'); for (let i = 0; i < 12; i++) { g.strokeStyle = '#ffd23f'; g.lineWidth = 10; g.beginPath(); g.moveTo(190 + 90 * Math.cos(i * TAU / 12), 190 + 90 * Math.sin(i * TAU / 12)); g.lineTo(190 + 120 * Math.cos(i * TAU / 12), 190 + 120 * Math.sin(i * TAU / 12)); g.stroke(); }
    [[760, 170], [840, 200], [700, 200]].forEach(p => C(g, p[0], p[1], 50, '#fff'));
    C(g, 250, 930, 210, '#7ccf6e'); C(g, 820, 940, 230, '#5fbf63');
    R(g, 270, 400, 500, 390, '#ff9f87', 24); T(g, 240, 410, 520, 220, 800, 410, '#c0392b'); R(g, 640, 250, 50, 110, '#8d5a3b');
    [[330, 850], [700, 870], [150, 780]].forEach(p => C(g, p[0], p[1], 14, '#ff6b9d')); } },
  { name: 'Room', bg: '#ffe3b3', shape: 'star', c: [500, 480], R: 150, rot: -.4, art(g) {
    dots(g, 14, ['#ffcf8a', '#fff1d6'], 8);
    R(g, 300, 280, 400, 400, '#8d5a3b', 26); R(g, 130, 330, 24, 330, '#555'); T(g, 80, 340, 142, 220, 204, 340, '#e76f51');
    C(g, 512, 860, 170, '#e9967a'); C(g, 512, 860, 110, '#f4c2a1'); R(g, 770, 700, 120, 130, '#c8553d', 10);
    [[800, 650, 50], [850, 620, 40], [760, 610, 40]].forEach(p => C(g, p[0], p[1], p[2], '#4caf50')); } },
  { name: 'Space', bg: '#d5c8ff', shape: 'blob', c: [520, 520], R: 170, rot: .3, art(g) {
    for (let i = 0; i < 12; i++) St(g, 70 + rnd() * 880, 70 + rnd() * 880, 14 + rnd() * 16, i % 2 ? '#fff' : '#ffe08a');
    C(g, 520, 520, 215, '#ffb703'); g.strokeStyle = '#fb5607'; g.lineWidth = 22; g.beginPath(); g.ellipse(520, 520, 330, 70, -.35, 0, TAU); g.stroke();
    C(g, 190, 800, 70, '#8ecae6'); C(g, 830, 190, 45, '#fff'); C(g, 850, 800, 28, '#ff6b9d'); } },
  { name: 'Ocean', bg: '#b5ecd5', shape: 'trefoil', c: [500, 540], R: 150, rot: -.3, art(g) {
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 5; for (let i = 0; i < 16; i++) { g.beginPath(); g.arc(60 + rnd() * 900, 60 + rnd() * 900, 8 + rnd() * 22, 0, TAU); g.stroke(); }
    C(g, 500, 540, 220, 'rgba(255,255,255,.65)');
    [[170, 250, '#ff7b54'], [800, 300, '#ffb703'], [220, 820, '#e76f9a'], [790, 790, '#4d96ff']].forEach(([x, y, c]) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, 60, 34, 0, 0, TAU); g.fill(); T(g, x + 50, y, x + 100, y - 36, x + 100, y + 36, c); C(g, x - 28, y - 6, 6, '#222'); });
    g.strokeStyle = '#2e9e6b'; g.lineWidth = 16; [120, 160, 880].forEach(x => { g.beginPath(); g.moveTo(x, 980); g.bezierCurveTo(x - 40, 900, x + 40, 840, x, 760); g.stroke(); }); } },
  { name: 'Candy', bg: '#ffc7da', shape: 'heart', c: [520, 520], R: 150, rot: .4, art(g) {
    dots(g, 40, ['#fff', '#ffd23f', '#6ec6ff', '#a0e8af'], 7);
    C(g, 520, 520, 235, '#fff'); g.strokeStyle = '#ff6b9d'; g.lineWidth = 16; g.beginPath(); g.arc(520, 520, 235, 0, TAU); g.stroke();
    [[170, 300], [850, 760]].forEach(([x, y]) => { R(g, x - 6, y, 12, 170, '#fff'); C(g, x, y, 60, '#ff6b9d'); C(g, x, y, 34, '#ffd23f'); C(g, x, y, 12, '#ff6b9d'); });
    R(g, 760, 200, 110, 90, '#c68642', 14); C(g, 815, 190, 62, '#fff'); C(g, 815, 135, 14, '#e63946'); } },
];
LIB.forEach((l, i) => { l.id = 'g' + i; l.on = true; l.kind = 'gen'; });
let LV = LIB.slice(), N = LV.length;   // LIB = catalog (ordered), LV = frames currently in the sequence
const mod = i => ((i % N) + N) % N, lv = i => LV[mod(i)];
const mul = (a, b) => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
const div = (a, b) => { const d = b.re * b.re + b.im * b.im; return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d }; };
const add = (a, b) => ({ re: a.re + b.re, im: a.im + b.im }), sub = (a, b) => ({ re: a.re - b.re, im: a.im - b.im }), abs = a => Math.hypot(a.re, a.im);

// ---- polygon geometry (points are [x,y] in level coords)
const segDist = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy, t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)) : 0; return Math.hypot(a[0] + t * dx - p[0], a[1] + t * dy - p[1]); };
const edgeDist = (P, x, y) => P.reduce((m, a, i) => Math.min(m, segDist([x, y], a, P[(i + 1) % P.length])), 1e9);
const inPoly = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
const area = P => Math.abs(P.reduce((s, p, i) => { const q = P[(i + 1) % P.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
function pole(P) {   // widest inscribed circle by grid refinement
  let x0 = Math.min(...P.map(p => p[0])), x1 = Math.max(...P.map(p => p[0])), y0 = Math.min(...P.map(p => p[1])), y1 = Math.max(...P.map(p => p[1]));
  let step = (Math.max(x1 - x0, y1 - y0) / 20) || 1, best = { d: -1, x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
  for (let it = 0; it < 4; it++) {
    for (let x = x0; x <= x1; x += step) for (let y = y0; y <= y1; y += step) if (inPoly(P, x, y)) { const d = edgeDist(P, x, y); if (d > best.d) best = { d, x, y }; }
    x0 = best.x - step; x1 = best.x + step; y0 = best.y - step; y1 = best.y + step; step /= 5;
  }
  return best;
}
function rdp(P, e) {
  if (P.length < 3) return P;
  let m = 0, k = 0; for (let i = 1; i < P.length - 1; i++) { const d = segDist(P[i], P[0], P[P.length - 1]); if (d > m) { m = d; k = i; } }
  return m > e ? rdp(P.slice(0, k + 1), e).slice(0, -1).concat(rdp(P.slice(k), e)) : [P[0], P[P.length - 1]];
}
const chaikin = P => P.flatMap((p, i) => { const q = P[(i + 1) % P.length]; return [[.75 * p[0] + .25 * q[0], .75 * p[1] + .25 * q[1]], [.25 * p[0] + .75 * q[0], .25 * p[1] + .75 * q[1]]]; });
const smooth = P => chaikin(chaikin(P));   // corner cutting: smooth closed outline
function trace(mask, G) {   // Moore-neighbour outer contour of a pixel mask
  const at = (x, y) => x >= 0 && y >= 0 && x < G && y < G && mask[y * G + x], D = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const s0 = mask.indexOf(1); let x = s0 % G, y = (s0 / G) | 0, bd = 4; const sx = x, sy = y, out = [[x, y]];
  for (let guard = 0; guard < 60000; guard++) {
    let found = false;
    for (let i = 1; i <= 8; i++) {
      const d = (bd + i) % 8, nx = x + D[d][0], ny = y + D[d][1];
      if (at(nx, ny)) { const pd = (d + 7) % 8, dx = x + D[pd][0] - nx, dy = y + D[pd][1] - ny; bd = D.findIndex(v => v[0] === dx && v[1] === dy); x = nx; y = ny; out.push([x, y]); found = true; break; }
    }
    if (!found || (x === sx && y === sy)) break;
  }
  return out;
}

// ---- levels: bitmap + portal polygon + placement of the next level inside it
function refresh(l) { l.s = abs(l.a); l.rot = Math.atan2(l.a.im, l.a.re); l.p = div(l.b, sub({ re: 1, im: 0 }, l.a)); }   // after a or b changed
function place(l, P) {   // default fit: the next picture's square sits inside the widest inner circle of the hole
  const q = pole(P), s = 2 * (.8 * q.d / Math.SQRT2) / S, rot = .2 * Math.log(1 / s);   // constant turn rate per unit of log-zoom
  l.pts = P; l.rin = q.d; l.edge = l.edge || 'line';
  l.a = { re: s * Math.cos(rot), im: s * Math.sin(rot) };
  const am = mul(l.a, { re: S / 2, im: S / 2 });
  l.b = { re: q.x - am.re, im: q.y - am.im };                // child z -> parent: a*z + b
  refresh(l);
}
const SOFT = 'filter' in CanvasRenderingContext2D.prototype, eff = l => (l.edge === 'soft' && !SOFT ? 'prop' : l.edge);   // shortcut: soft edge needs canvas filter (not older Safari), falls back to proportional
const edgeW = l => ({ none: 0, line: 6, prop: .07 * l.rin, soft: .15 * l.rin })[eff(l)];   // how far the border reaches into the hole: level switches wait until the screen is clear of it
LIB.forEach(l => {
  seed = 12; const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
  g.fillStyle = l.bg; g.fillRect(0, 0, S, S); g.save(); g.beginPath(); g.arc(S / 2, S / 2, S / 2, 0, TAU); g.clip(); g.translate(S / 2 - l.c[0], S / 2 - l.c[1]); l.art(g); g.restore();
  l.img = c;
  const raw = shapes[l.shape](), mx = raw.reduce((s, p) => s + p[0], 0) / raw.length, my = raw.reduce((s, p) => s + p[1], 0) / raw.length;
  place(l, raw.map(p => [S / 2 + (p[0] - mx) * l.R, S / 2 + (p[1] - my) * l.R]));
});

// ---- app state
const cv = document.getElementById('c'), ctx = cv.getContext('2d'), loopEl = document.getElementById('loop'), info = document.getElementById('info'), ctl = document.getElementById('ctl'), catEl = document.getElementById('cat');
const loop = () => loopEl.checked;
let V = 0, W = 0, H = 0, full = false, dpr = 1, mode = 'auto', tool = 'draw', K = 0, A = { re: 1, im: 0 }, B = { re: 0, im: 0 }, u = 0, playing = true, penSeen = false, stroke = null, multi = false, msgText = '', msgUntil = 0;
const ptrs = new Map(), SPEED = .6;   // SPEED: log-zoom per second in auto mode
const qs = () => Math.max(W, H) / S;   // 'cover' scale: the level square always covers the screen, so no seams in full screen
const home = () => { const q = qs(); A = { re: q, im: 0 }; B = { re: (W - q * S) / 2, im: (H - q * S) / 2 }; };
const toLevel = p => div(sub({ re: p.x, im: p.y }, B), A), toScr = z => add(mul(A, z), B);
const msg = t => { msgText = t; msgUntil = performance.now() + 2200; };
function resize() { dpr = devicePixelRatio || 1; V = Math.max(220, Math.floor(Math.min(innerWidth - 16, innerHeight - 350, 720))); W = full ? innerWidth : V; H = full ? innerHeight : V; cv.style.width = W + 'px'; cv.style.height = H + 'px'; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); catEl.style.maxWidth = V + 'px'; if (mode !== 'auto') home(); }
addEventListener('resize', resize); resize();

// ---- drawing the nested levels
const offs = {};
function getOff(d) { let o = offs[d]; if (!o || o.c.width !== cv.width || o.c.height !== cv.height) { const mk = () => { const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; return c; }; o = offs[d] = { c: mk(), m: mk() }; o.m.width += 2 * PAD; o.m.height += 2 * PAD; } return o; }   // mask canvas is padded so the blur has no transparent edge at the screen border
const PAD = 100;
function drawSoft(g, l, nl, n, depth, path) {   // next picture fades out towards the edge of the hole (mask = eroded hole, blurred)
  const o = getOff(depth), og = o.c.getContext('2d'), mg = o.m.getContext('2d'), M = g.getTransform();
  og.setTransform(1, 0, 0, 1, 0, 0); og.clearRect(0, 0, o.c.width, o.c.height); og.setTransform(M);
  mg.setTransform(1, 0, 0, 1, 0, 0); mg.clearRect(0, 0, o.m.width, o.m.height); mg.setTransform(new DOMMatrix().translate(PAD, PAD).multiply(M));
  path(og); og.fillStyle = nl.bg; og.fill(); og.save(); path(og); og.clip(); og.transform(l.a.re, l.a.im, -l.a.im, l.a.re, l.b.re, l.b.im); drawLevel(og, n, depth - 1); og.restore();
  const fw = .15 * l.rin; path(mg); mg.fillStyle = '#000'; mg.fill(); mg.globalCompositeOperation = 'destination-out'; mg.lineWidth = fw; mg.lineJoin = 'round'; mg.stroke(); mg.globalCompositeOperation = 'source-over';
  og.setTransform(1, 0, 0, 1, 0, 0); og.globalCompositeOperation = 'destination-in'; og.filter = `blur(${Math.min(PAD / 3, Math.max(.5, fw * Math.hypot(M.a, M.b) / 4))}px)`; og.drawImage(o.m, -PAD, -PAD); og.filter = 'none'; og.globalCompositeOperation = 'source-over';
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(o.c, 0, 0); g.restore();
}
function drawLevel(g, i, depth) {
  const l = lv(i); g.drawImage(l.img, 0, 0);
  const n = i + 1; if (depth === 0 || (!loop() && n >= N)) return;
  const nl = lv(n), e = eff(l), path = c => { c.beginPath(); l.pts.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); };
  if (e === 'soft') drawSoft(g, l, nl, n, depth, path);
  else { path(g); g.fillStyle = nl.bg; g.fill(); g.save(); path(g); g.clip(); g.transform(l.a.re, l.a.im, -l.a.im, l.a.re, l.b.re, l.b.im); drawLevel(g, n, depth - 1); g.restore(); }
  if (e === 'line' || e === 'prop') { const w = e === 'line' ? 12 : .14 * l.rin; path(g); g.lineJoin = 'round'; g.strokeStyle = '#fff'; g.lineWidth = w; g.stroke(); g.strokeStyle = '#2b2540'; g.lineWidth = w / 2; g.stroke(); }   // border: fixed, or proportional to the hole
}
function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = lv(K).bg; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(dpr * A.re, dpr * A.im, -dpr * A.im, dpr * A.re, dpr * B.re, dpr * B.im);
  drawLevel(ctx, K, mode === 'edit' ? 3 : 5);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (mode === 'edit') {   // always show where the hole is, even with no border
    ctx.strokeStyle = '#ff5a1f'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]); ctx.beginPath(); lv(K).pts.forEach((p, k) => { const s = toScr({ re: p[0], im: p[1] }); k ? ctx.lineTo(s.re, s.im) : ctx.moveTo(s.re, s.im); }); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
  }
  if (stroke && stroke.length > 1) {
    const s = stroke.map(toScr); ctx.lineWidth = 4; ctx.lineCap = ctx.lineJoin = 'round'; ctx.strokeStyle = '#ff5a1f';
    ctx.beginPath(); s.forEach((p, k) => k ? ctx.lineTo(p.re, p.im) : ctx.moveTo(p.re, p.im)); ctx.stroke();
    ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(s[s.length - 1].re, s[s.length - 1].im); ctx.lineTo(s[0].re, s[0].im); ctx.stroke(); ctx.setLineDash([]);
  }
}

// ---- auto camera: zoom toward the fixed point of the current portal, constant log speed
function camAuto(u) {
  const k = Math.floor(u), f = u - k, l = lv(k), g = Math.pow(l.s, -f), ph = -l.rot * f, gr = { re: g * Math.cos(ph), im: g * Math.sin(ph) }, q = qs();
  A = { re: q * gr.re, im: q * gr.im }; B = add(mul({ re: q, im: 0 }, sub(l.p, mul(gr, l.p))), { re: (W - q * S) / 2, im: (H - q * S) / 2 }); K = k;
}

// ---- manual camera: change level when the screen crosses a portal (hysteresis 8/14 units avoids flip-flop and hides the border)
function screenPts() { const o = []; for (let t = 0; t <= 4; t++) { const x = t / 4 * W, y = t / 4 * H; o.push({ x, y: 0 }, { x, y: H }, { x: 0, y }, { x: W, y }); } return o.map(toLevel); }   // shortcut: samples the screen edge only, fine for convex-ish portals
function settle() {
  for (let n = 0; n < 8; n++) {
    const l = lv(K), zs = screenPts();
    if ((loop() || K + 1 < N) && zs.every(z => inPoly(l.pts, z.re, z.im) && edgeDist(l.pts, z.re, z.im) >= edgeW(l) + 8)) { const nA = mul(A, l.a), nB = add(mul(A, l.b), B); A = nA; B = nB; K++; continue; }
    if (loop() || K > 0) {
      const pl = lv(K - 1);
      if (!zs.map(z => add(mul(pl.a, z), pl.b)).every(w => inPoly(pl.pts, w.re, w.im) && edgeDist(pl.pts, w.re, w.im) >= edgeW(pl) + 2)) { const nA = div(A, pl.a), nB = sub(B, div(mul(A, pl.b), pl.a)); A = nA; B = nB; K--; continue; }
    }
    break;
  }
}
function scaleAbout(P, k) { A = { re: A.re * k, im: A.im * k }; B = add({ re: B.re * k, im: B.im * k }, { re: P.re * (1 - k), im: P.im * (1 - k) }); }
function clampCentre(lo, hi) {   // keep the screen centre inside the layer square
  const c = { re: W / 2, im: H / 2 }, z = toLevel({ x: c.re, y: c.im }), zc = { re: Math.max(lo, Math.min(hi, z.re)), im: Math.max(lo, Math.min(hi, z.im)) };
  if (zc.re !== z.re || zc.im !== z.im) B = sub(c, mul(A, zc));
}
function finish() {
  const q = qs(), c = { re: W / 2, im: H / 2 };
  if (mode === 'manual') {
    settle();
    if (!loop() && K === 0 && abs(A) < q) scaleAbout(c, q / abs(A));
    if (!loop() && K === N - 1 && abs(A) > 8 * q) scaleAbout(c, 8 * q / abs(A));
    clampCentre(-.25 * S, 1.25 * S);
  } else if (mode === 'edit') {
    if (abs(A) < q) scaleAbout(c, q / abs(A)); if (abs(A) > 10 * q) scaleAbout(c, 10 * q / abs(A));
    clampCentre(0, S);
  }
}

// ---- input: one pointer pans (or draws), two pointers pan + zoom + rotate
const pt = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
cv.addEventListener('pointerdown', e => {
  if (mode === 'auto') return;
  cv.setPointerCapture(e.pointerId); if (e.pointerType === 'pen') penSeen = true;
  const p = pt(e); ptrs.set(e.pointerId, { x: p.x, y: p.y, px: p.x, py: p.y, sx: p.x, sy: p.y, t: performance.now(), moved: 0 });
  if (ptrs.size > 1) { stroke = null; multi = true; }
  else if (mode === 'edit' && tool === 'draw' && (e.pointerType !== 'touch' || !penSeen)) stroke = [toLevel(p)];   // once a pen is seen, fingers never draw (palm rejection)
});
cv.addEventListener('pointermove', e => {
  const q = ptrs.get(e.pointerId); if (!q) return;
  const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
  for (const ev of (evs.length ? evs : [e])) { const p = pt(ev); q.x = p.x; q.y = p.y; if (stroke) stroke.push(toLevel(p)); }
  q.moved = Math.max(q.moved, Math.hypot(q.x - q.sx, q.y - q.sy));
  if (!stroke) gesture();
});
function gesture() {
  const L = [...ptrs.values()]; if (!L.length) return;
  let lam = { re: 1, im: 0 }, mu = { re: 0, im: 0 };   // screen similarity: w -> lam*w + mu
  if (L.length === 1) mu = { re: L[0].x - L[0].px, im: L[0].y - L[0].py };
  else { const [a, b] = L, d0 = { re: b.px - a.px, im: b.py - a.py }, d1 = { re: b.x - a.x, im: b.y - a.y }; if (abs(d0) > 8 && abs(d1) > 8) { lam = div(d1, d0); mu = sub({ re: a.x, im: a.y }, mul(lam, { re: a.px, im: a.py })); } }
  if (mode === 'edit' && (tool === 'hole' || tool === 'fit')) objGesture(lam, mu); else { A = mul(lam, A); B = add(mul(lam, B), mu); finish(); }
  L.forEach(q => { q.px = q.x; q.py = q.y; });
}
const dirty = l => { clearTimeout(l.sv); l.sv = setTimeout(() => saveFrame(l), 400); };
function cornerMargin(l, a, b) {   // distance from the next picture's corners to the hole's edge (negative = outside)
  return Math.min(...[[0, 0], [S, 0], [S, S], [0, S]].map(([x, y]) => { const w = add(mul(a, { re: x, im: y }), b); return inPoly(l.pts, w.re, w.im) ? edgeDist(l.pts, w.re, w.im) : -1; }));
}
const needMargin = l => .15 * l.rin + 2;   // enough for every border style (soft feather is the widest)
const fitOk = (l, a, b) => { const m = cornerMargin(l, a, b); return m >= needMargin(l) || m >= cornerMargin(l, l.a, l.b); };   // valid, or at least not worse (so it can always shrink back)
function objGesture(lam, mu) {   // same gesture, applied to the level's contents: G(z) = lam*z + tau in level coordinates
  const l = lv(K), tau = div(sub(add(mul(lam, B), mu), B), A), a = mul(lam, l.a), b = add(mul(lam, l.b), tau);
  if (tool === 'fit') { if (abs(a) < .02 || !fitOk(l, a, b)) return; }   // move / zoom / turn the picture inside the hole
  else {   // move / resize / turn the hole, the picture inside it comes along
    const P = l.pts.map(p => { const z = add(mul(lam, { re: p[0], im: p[1] }), tau); return [z.re, z.im]; });
    if (abs(lam) * l.rin < 12 || P.some(p => p[0] < -.3 * S || p[0] > 1.3 * S || p[1] < -.3 * S || p[1] > 1.3 * S)) return;
    l.pts = P; l.rin *= abs(lam);
  }
  l.a = a; l.b = b; refresh(l); thumb(l); dirty(l);
}
const up = e => {
  const q = ptrs.get(e.pointerId); if (!q) return; ptrs.delete(e.pointerId);
  if (ptrs.size === 0) {
    if (mode === 'edit' && !multi && e.type === 'pointerup') {
      if (stroke) doDraw(stroke); else if (tool === 'fill' && q.moved < 8 && performance.now() - q.t < 500) doFill(toLevel({ x: q.x, y: q.y }));
    }
    multi = false;
  }
  stroke = null; ptrs.forEach(r => { r.px = r.x; r.py = r.y; });
};
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('wheel', e => {   // desktop testing: wheel = zoom, shift+wheel = rotate
  e.preventDefault(); if (mode === 'auto') return;
  const p = pt(e), P = { re: p.x, im: p.y }, d = -e.deltaY * .0015, lam = e.shiftKey ? { re: Math.cos(d), im: Math.sin(d) } : { re: Math.exp(d), im: 0 };
  B = add(mul(lam, sub(B, P)), P); A = mul(lam, A); finish();
}, { passive: false });

// ---- edit: freehand loop -> smooth polygon, or tap -> flood-fill region -> smooth polygon
function setPortal(P) {
  const l = lv(K);
  if (area(P) < 900 || pole(P).d < 12) return msg('Too small: pick a bigger shape');
  l.prev = l.pts; place(l, P); thumb(l); saveFrame(l); msg('Next layer area set');
}
function doDraw(s) {
  if (s.length < 8) return msg('Draw a bigger loop');
  const P = rdp(s.map(z => [z.re, z.im]), 4 / abs(A));
  if (P.length < 3) return msg('Draw a closed loop');
  setPortal(smooth(P));
}
function doFill(z) {
  const G = 256, k = S / G, gx = Math.floor(z.re / k), gy = Math.floor(z.im / k);
  if (gx < 0 || gy < 0 || gx >= G || gy >= G) return msg('Tap inside the picture');
  const c = document.createElement('canvas'); c.width = c.height = G; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(lv(K).img, 0, 0, G, G);
  const d = g.getImageData(0, 0, G, G).data, o = (gy * G + gx) * 4, r0 = d[o], g0 = d[o + 1], b0 = d[o + 2];
  const mask = new Uint8Array(G * G), st = [gy * G + gx]; mask[st[0]] = 1; let n = 0, edge = false;
  while (st.length) {
    const i = st.pop(), x = i % G, y = (i / G) | 0; n++; if (!x || !y || x === G - 1 || y === G - 1) edge = true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= G || ny >= G || mask[ny * G + nx]) continue;
      const p = (ny * G + nx) * 4, e = (d[p] - r0) ** 2 + (d[p + 1] - g0) ** 2 + (d[p + 2] - b0) ** 2;
      if (e < 2025) { mask[ny * G + nx] = 1; st.push(ny * G + nx); }   // colour tolerance 45
    }
  }
  if (edge || n > G * G * .5) return msg('Area is not enclosed: try a smaller shape');
  if (n < 40) return msg('Area too small');
  let P = trace(mask, G).map(p => [(p[0] + .5) * k, (p[1] + .5) * k]);
  if (P.length > 1 && P[0][0] === P[P.length - 1][0] && P[0][1] === P[P.length - 1][1]) P.pop();
  P = rdp(P.concat([P[0]]), 5); P.pop();
  if (P.length < 3) return msg('Area too small');
  setPortal(smooth(P));
}
function applyShape(key) {   // a ready-made hole in the middle of the view, then adjust it with the Hole tool
  const raw = shapes[key](), mx = raw.reduce((s, p) => s + p[0], 0) / raw.length, my = raw.reduce((s, p) => s + p[1], 0) / raw.length, Pn = raw.map(p => [p[0] - mx, p[1] - my]);
  const c = toLevel({ x: W / 2, y: H / 2 }), R = .22 * Math.min(W, H) / abs(A) / edgeDist(Pn, 0, 0);
  setPortal(Pn.map(p => [c.re + p[0] * R, c.im + p[1] * R])); tool = 'hole'; ui();
}
function cycleEdge() { const l = lv(K), o = ['line', 'prop', 'soft', 'none']; l.edge = o[(o.indexOf(l.edge) + 1) % 4]; if (l.edge === 'soft' && !SOFT) msg('Soft edge needs a newer browser: showing proportional'); if (cornerMargin(l, l.a, l.b) < edgeW(l) + 2) { place(l, l.pts); msg('Picture re-fitted for this border'); } thumb(l); saveFrame(l); ui(); }
function resetFit() { const l = lv(K); place(l, l.pts); thumb(l); saveFrame(l); msg('Picture fitted to the hole'); }
function undo() { const l = lv(K); if (l.prev) { place(l, l.prev); l.prev = null; thumb(l); saveFrame(l); msg('Undone'); } else msg('Nothing to undo'); }

// ---- UI: modes, controls, frames catalog
function thumb(l) {
  const g = l.th.getContext('2d'), k = 72 / S; g.clearRect(0, 0, 72, 72); g.drawImage(l.img, 0, 0, 72, 72);
  g.beginPath(); l.pts.forEach((p, i) => i ? g.lineTo(p[0] * k, p[1] * k) : g.moveTo(p[0] * k, p[1] * k)); g.closePath();
  g.lineJoin = 'round'; g.strokeStyle = '#fff'; g.lineWidth = 3.5; g.stroke(); g.strokeStyle = '#2b2540'; g.lineWidth = 1.8; g.stroke();
}
// ---- catalog: every frame in order; hidden frames stay in the catalog but leave the sequence
const mkTh = l => { l.th = document.createElement('canvas'); l.th.width = l.th.height = 72; thumb(l); };
LIB.forEach(mkTh);
function rebuildKeep() {   // recompute the sequence, stay on the same frame when it is still in it
  const cur = lv(K); LV = LIB.filter(l => l.on); if (!LV.length) { LIB[0].on = true; LV = [LIB[0]]; }
  N = LV.length; const i = LV.indexOf(cur);
  if (i >= 0) { K = i; if (mode === 'auto') u = K; } else { K = 0; u = 0; home(); }
  renderCat();
}
function pick(i) { K = mod(i); home(); if (mode === 'auto') { u = K; playing = true; } ui(); }
function pickFrame(l) { const i = LV.indexOf(l); if (i < 0) return msg('Hidden: tap 👁 to put it back in the sequence'); pick(i); }
function toggle(l) { if (l.on && LV.length === 1) return msg('Keep at least one frame'); l.on = !l.on; rebuildKeep(); saveMeta(); }
function removeFrame(l) {
  if (LIB.length === 1) return msg('Keep at least one frame');
  if (!(l.armed > performance.now())) { l.armed = performance.now() + 3000; return msg('Tap 🗑 again to delete this frame'); }
  LIB.splice(LIB.indexOf(l), 1); if (l.kind === 'gen') gone.add(l.id); kvDel('f:' + l.id); rebuildKeep(); saveMeta();
}
function renderCat() {
  catEl.innerHTML = '';
  LIB.forEach((l, idx) => {
    const d = document.createElement('div'); d.className = 'th' + (l.on ? '' : ' off'); l.thd = d; d.append(l.th);
    const n = document.createElement('span'); n.textContent = l.on ? LV.indexOf(l) + 1 : '–'; d.append(n);
    const mk = (txt, top, f) => { const b = document.createElement('button'); b.className = 'ov'; b.style.top = top + 'px'; b.textContent = txt; b.onclick = e => { e.stopPropagation(); f(); }; d.append(b); };
    mk(l.on ? '👁' : '🚫', 3, () => toggle(l)); mk('🗑', 43, () => removeFrame(l));
    const gr = document.createElement('b'); gr.className = 'grip'; gr.textContent = '⠿ drag'; d.append(gr);
    gr.onpointerdown = e => { e.preventDefault(); gr.setPointerCapture(e.pointerId); drag = { from: idx, gap: idx }; d.classList.add('drag'); };
    gr.onpointermove = e => {
      if (!drag || drag.from !== idx) return;
      const r = catEl.getBoundingClientRect(); if (e.clientX < r.left + 40) catEl.scrollLeft -= 14; else if (e.clientX > r.right - 40) catEl.scrollLeft += 14;
      const kids = [...catEl.querySelectorAll('.th')]; drag.gap = kids.filter(k => { const q = k.getBoundingClientRect(); return e.clientX > q.left + q.width / 2; }).length;
      kids.forEach((k, i) => { k.classList.toggle('over', i === drag.gap); k.classList.toggle('overEnd', drag.gap === kids.length && i === kids.length - 1); });
    };
    gr.onpointerup = gr.onpointercancel = () => {
      if (!drag) return; const { from, gap } = drag, to = gap > from ? gap - 1 : gap; drag = null;
      if (to !== from) { LIB.splice(to, 0, LIB.splice(from, 1)[0]); rebuildKeep(); saveMeta(); } else renderCat();
    };
    l.th.onclick = () => pickFrame(l); catEl.append(d);
  });
  const pl = document.createElement('div'); pl.className = 'plus'; pl.textContent = '+'; pl.onclick = () => { addMenu.hidden = !addMenu.hidden; storInfo(); }; catEl.append(pl);
}
let drag = null;
const gone = new Set();   // starter frames the user deleted
const addMenu = document.getElementById('addmenu'), fileCam = document.getElementById('fcam'), fileGal = document.getElementById('fgal');
document.getElementById('cam').onclick = () => fileCam.click(); document.getElementById('gal').onclick = () => fileGal.click();
[fileCam, fileGal].forEach(f => f.onchange = async () => { const file = f.files[0]; f.value = ''; if (!file) return; try { await addPhoto(file); } catch (e) { msg('Could not read that image'); } addMenu.hidden = true; });
function storInfo() { const s = document.getElementById('stor'); s.textContent = ''; try { navigator.storage.estimate().then(e => { s.textContent = `Stored: ${(e.usage / 1e6).toFixed(1)} MB of ${(e.quota / 1e9).toFixed(1)} GB`; }); } catch (e) {} }

// ---- photos: centre-crop to a square, downscale to 1024px, save as JPEG (~100-250 KB)
const edgeColour = c => { const t = document.createElement('canvas'); t.width = t.height = 16; const g = t.getContext('2d'); g.drawImage(c, 0, 0, 16, 16); const d = g.getImageData(0, 0, 16, 16).data; let r = 0, gg = 0, b = 0, n = 0; for (let i = 0; i < 256; i++) { const x = i % 16, y = i >> 4; if (x && y && x < 15 && y < 15) continue; r += d[i * 4]; gg += d[i * 4 + 1]; b += d[i * 4 + 2]; n++; } return `rgb(${r / n | 0},${gg / n | 0},${b / n | 0})`; };
const defaultPortal = () => shapes.blob().map(p => [S / 2 + p[0] * 170, S / 2 + p[1] * 170]);
function restore(l, r) { l.edge = r.edge || 'line'; place(l, r.pts || defaultPortal()); if (r.a && r.b) { l.a = r.a; l.b = r.b; refresh(l); } }   // saved before edge/fit existed: defaults
function photoFrame(rec, img) { const l = { id: rec.id, name: rec.name, bg: rec.bg, img, blob: rec.blob, kind: 'photo', on: true }; restore(l, rec); mkTh(l); return l; }
async function addPhoto(file) {
  let bm; try { bm = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { bm = await createImageBitmap(file); }
  const c = document.createElement('canvas'); c.width = c.height = S; const m = Math.min(bm.width, bm.height);
  c.getContext('2d').drawImage(bm, (bm.width - m) / 2, (bm.height - m) / 2, m, m, 0, 0, S, S); bm.close && bm.close();
  const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', .85));
  const l = photoFrame({ id: 'p' + Date.now().toString(36), name: 'Photo ' + (LIB.filter(x => x.kind === 'photo').length + 1), bg: edgeColour(c), blob }, c);
  LIB.push(l); rebuildKeep(); pick(LV.indexOf(l));
  const ok = await saveFrame(l); await saveMeta();
  msg(db ? (ok ? `Saved on this device (${Math.round(blob.size / 1024)} KB)` : 'Could not save: storage full?') : 'Not saved: storage unavailable here');
  try { navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
}

// ---- storage (IndexedDB, one 'kv' store): 'meta' = order + hidden ids, 'f:<id>' = portal polygon (+ photo blob)
let db = null;
const openDB = () => new Promise((res, rej) => { const r = indexedDB.open('zoomtunnel', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const kvPut = (k, v) => new Promise(res => { if (!db) return res(false); try { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = () => res(true); tx.onerror = tx.onabort = () => res(false); } catch (e) { res(false); } });
const kvDel = k => new Promise(res => { if (!db) return res(); try { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').delete(k); tx.oncomplete = tx.onerror = tx.onabort = () => res(); } catch (e) { res(); } });
const kvAll = () => new Promise((res, rej) => { const st = db.transaction('kv').objectStore('kv'), ks = st.getAllKeys(), vs = st.getAll(); vs.onsuccess = () => { const o = {}; ks.result.forEach((k, i) => o[k] = vs.result[i]); res(o); }; vs.onerror = () => rej(vs.error); });
const saveFrame = l => kvPut('f:' + l.id, { id: l.id, pts: l.pts, edge: l.edge, a: l.a, b: l.b, ...(l.kind === 'photo' ? { name: l.name, bg: l.bg, blob: l.blob } : {}) });
const saveMeta = () => kvPut('meta', { order: LIB.map(l => l.id), off: LIB.filter(l => !l.on).map(l => l.id), gone: [...gone] });
(async () => {
  try { db = await openDB(); } catch (e) { db = null; msg('Storage unavailable here: changes last until you close the page'); return; }
  try {
    const all = await kvAll();
    for (const k of Object.keys(all)) if (k.startsWith('f:')) {
      const r = all[k], g = LIB.find(l => l.id === r.id);
      if (g) { if (r.pts) { restore(g, r); thumb(g); } } else if (r.blob) { const bm = await createImageBitmap(r.blob), c = document.createElement('canvas'); c.width = c.height = S; c.getContext('2d').drawImage(bm, 0, 0, S, S); LIB.push(photoFrame(r, c)); }
    }
    const meta = all.meta;
    if (meta) { (meta.gone || []).forEach(id => gone.add(id)); for (let i = LIB.length - 1; i > 0; i--) if (gone.has(LIB[i].id)) LIB.splice(i, 1);
      const ix = l => { const i = meta.order.indexOf(l.id); return i < 0 ? 1e9 : i; }; LIB.sort((a, b) => ix(a) - ix(b)); LIB.forEach(l => { l.on = !meta.off.includes(l.id); }); }
    rebuildKeep(); window.__ztLoaded = true;
  } catch (e) { msg('Could not load saved frames'); }
})();
document.getElementById('fr').onclick = () => { catEl.hidden = !catEl.hidden; };
function enterFull() {
  full = true; document.body.classList.add('full');
  try { document.documentElement.requestFullscreen?.().catch(() => {}); } catch (e) {}   // real fullscreen if the viewer allows it, otherwise fill the frame
  resize(); ui();
}
function exitFull() {
  full = false; document.body.classList.remove('full');
  try { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); } catch (e) {}
  resize(); ui();
}
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && full) exitFull(); });
const togglePlay = () => { if (!playing && !loop() && u >= N - 1) u = 0; playing = !playing; ui(); };
function setMode(m) {
  if (m === 'edit' && full) exitFull();
  if (m === 'auto') { K = mod(K); u = K; playing = true; }
  if (m === 'edit') { stroke = null; mode = m; home(); }
  mode = m; ptrs.clear(); stroke = null; ui();
}
document.querySelectorAll('[data-m]').forEach(b => b.onclick = () => setMode(b.dataset.m));
loopEl.onchange = () => { if (!loop()) { K = mod(K); u = mod(u); } };
function ui() {
  document.querySelectorAll('[data-m]').forEach(b => b.classList.toggle('on', b.dataset.m === mode));
  ctl.innerHTML = '';
  const btn = (t, f, on) => { const b = document.createElement('button'); b.textContent = t; b.onclick = f; if (on) b.classList.add('on'); ctl.append(b); };
  if (mode === 'auto') btn(playing ? 'Pause' : 'Play', togglePlay);
  else btn('Reset view', () => { home(); finish(); });
  if (mode !== 'edit') btn('⛶ Full', enterFull);
  const bar = document.getElementById('fsbar'); bar.hidden = !full; bar.innerHTML = '';
  if (full) {
    const fb = (t, f) => { const b = document.createElement('button'); b.textContent = t; b.onclick = f; bar.append(b); };
    fb(mode === 'auto' ? 'Manual' : 'Auto', () => setMode(mode === 'auto' ? 'manual' : 'auto')); if (mode === 'auto') fb(playing ? '⏸' : '▶', togglePlay); fb('✕', exitFull);
  }
  const row2 = document.getElementById('row2'); row2.hidden = !(mode === 'edit' && tool === 'shape'); row2.innerHTML = '';
  if (mode === 'edit') {
    [['✏️ Draw', 'draw'], ['🪣 Fill', 'fill'], ['⬟ Shape', 'shape'], ['✥ Hole', 'hole'], ['🖼 Fit', 'fit']].forEach(([t, k]) => btn(t, () => { tool = k; ui(); }, tool === k));
    btn('Border: ' + lv(K).edge, cycleEdge); btn('↶ Undo', undo); if (tool === 'fit') btn('Reset fit', resetFit);
    if (tool === 'shape') ['circle', 'square', 'triangle', 'hex', 'star', 'heart', 'flower'].forEach((k, i) => { const b = document.createElement('button'); b.className = 'shp'; b.textContent = '●■▲⬢★♥✿'[i]; b.onclick = () => applyShape(k); row2.append(b); });
  }
}
const hint = () => mode === 'auto' ? 'automatic zoom' : mode === 'manual' ? 'pinch = zoom · twist = rotate · drag = move' : ({ draw: 'draw a loop for the hole · 2 fingers move the view', fill: 'tap an enclosed area · 2 fingers move the view', shape: 'pick a shape: it appears in the middle of the view', hole: 'drag = move the hole · pinch = resize · twist = turn', fit: 'drag = move the picture in the hole · pinch = zoom (padding) · twist = turn' })[tool];

let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (mode === 'auto') {
    if (playing) { u += dt * SPEED / Math.log(1 / lv(Math.floor(u)).s); if (!loop() && u >= N - 1) { u = N - 1; playing = false; ui(); } }
    camAuto(u);
  }
  render();
  const txt = now < msgUntil ? msgText : `Level ${mod(K) + 1}/${N} · ${lv(K).name} — ${hint()}`;
  if (info.textContent !== txt) info.textContent = txt;
  LIB.forEach(l => l.thd && l.thd.classList.toggle('sel', l === lv(K)));
  requestAnimationFrame(frame);
}
window.__zt = { LIB, setTool: k => { tool = k; ui(); }, applyShape, objGesture, edgeW, cycleEdge, cornerMargin, get LV() { return LV; }, setMode, pick, enterFull, exitFull, setU: v => { u = v; playing = false; }, state: () => ({ mode, K, A, B, N, V, W, H, full }) };
renderCat(); ui(); requestAnimationFrame(frame);
