// Catapult canvas: ground ruler, catapult, castle or tower, the shot and debris.
// createScene(stage) -> { setRound(round), shoot(judgement) -> Promise, destroy() }
// Purely visual: all maths and hit/miss decisions come from logic.js.

const SKY_TOP = '#7cc8f7', SKY_BOTTOM = '#d9f1ff', GRASS = '#7bc95a', GRASS_EDGE = '#4e9a35', INK = '#1e3a14';
const STONE = '#9aa3ad', STONE_DARK = '#6f7883', WOOD = '#8a5a2b', WOOD_DARK = '#5e3b19', FLAG = '#e8452c', ROCK = '#4b4f55';

export function createScene(stage) {
  const canvas = document.createElement('canvas');
  canvas.className = 'scene';
  stage.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0;
  let round = null;
  let markers = [];   // where earlier shots this round landed
  let shot = null;    // { x0, y0, x1, y1, peak, t0, dur, resolve }
  let particles = [];
  let wreck = null;   // { t0, block } after a hit
  let armT = 0;       // 0 cocked .. 1 thrown
  let raf = 0;

  const L = () => ({ padL: 34, padR: 26, groundY: H - 44 });
  const toPx = (x) => { const { padL, padR } = L(); return padL + (x / round.axisMax) * (W - padL - padR); };
  const blockH = () => Math.min(26, (L().groundY - 70) / round.tower.blocks);

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = stage.clientWidth; H = stage.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(performance.now());
  }
  const ro = new ResizeObserver(resize);
  ro.observe(stage);

  // ---------- drawing ----------
  function draw(now) {
    if (!W || !H) return;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, SKY_TOP); g.addColorStop(1, SKY_BOTTOM);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    drawCloud(W * 0.25, H * 0.28, 1); drawCloud(W * 0.7, H * 0.2, 0.8);
    if (!round) return;
    drawGround();
    if (round.wind) drawWind(now);
    if (round.tower) drawTower(now); else drawCastle(now);
    drawCatapult();
    for (const m of markers) drawMarker(m);
    drawParticles();
    if (shot) drawRock(shotPos(now));
  }

  function drawCloud(x, y, s) {
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    for (const [dx, dy, r] of [[0, 0, 18], [20, -8, 22], [42, 0, 17], [20, 6, 18]]) {
      ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawGround() {
    const { groundY } = L();
    ctx.fillStyle = GRASS; ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = GRASS_EDGE; ctx.fillRect(0, groundY, W, 4);
    if (round.tower) return;
    const max = round.axisMax, unit = toPx(1) - toPx(0);
    const minor = round.ruler === 'full' ? (unit >= 5 ? 1 : unit * 5 >= 6 ? 5 : 0) : 0;
    const labelStep = round.ruler === 'full' && unit * 5 >= 30 ? 5 : 10;
    ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineWidth = 1;
    ctx.font = '600 12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const y = groundY + 8;
    ctx.beginPath(); ctx.moveTo(toPx(0), y); ctx.lineTo(toPx(max), y); ctx.stroke();
    for (let x = 0; x <= max; x++) {
      const major = x % 10 === 0, label = x % labelStep === 0;
      if (!major && !label && !(minor && x % minor === 0)) continue;
      const len = major ? 10 : label ? 7 : 4;
      ctx.beginPath(); ctx.moveTo(toPx(x), y); ctx.lineTo(toPx(x), y + len); ctx.stroke();
      if (label) ctx.fillText(String(x), toPx(x), y + 13);
    }
  }

  function drawWind(now) {
    const x = W - 120, y = 60;
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    roundRect(x, y, 96, 34, 17); ctx.fill();
    ctx.fillStyle = '#1b5fa8'; ctx.font = '700 18px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`← ${round.wind}`, x + 48, y + 18);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const sx = W - ((now / 6 + i * (W / 4)) % W), sy = 110 + i * 26;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 28, sy); ctx.stroke();
    }
  }

  function drawCatapult() {
    const { groundY } = L(), x = toPx(round.catapultX);
    ctx.fillStyle = WOOD; ctx.fillRect(x - 18, groundY - 12, 36, 8);
    ctx.fillStyle = WOOD_DARK;
    for (const dx of [-12, 12]) { ctx.beginPath(); ctx.arc(x + dx, groundY - 4, 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillRect(x - 3, groundY - 24, 6, 14);
    // throwing arm swings from back-down to up-forward
    const a = -Math.PI * 0.85 + armT * Math.PI * 0.6;
    const px = x, py = groundY - 22, len = 30;
    ctx.strokeStyle = WOOD; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len); ctx.stroke();
    if (!shot && armT === 0) drawRock({ x: px + Math.cos(a) * len, y: py + Math.sin(a) * len - 3 });
  }

  function drawCastle(now) {
    const { groundY } = L(), cx = toPx(round.castleX), w = 30, h = 44;
    const k = wreck ? Math.min(1, (now - wreck.t0) / 500) : 0;
    const top = groundY - h * (1 - k * 0.75);
    ctx.fillStyle = STONE; ctx.fillRect(cx - w / 2, top, w, groundY - top);
    if (k < 1) {
      for (let i = 0; i < 3; i++) ctx.fillRect(cx - w / 2 + i * 11, top - 7, 8, 7);
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, top - 7); ctx.lineTo(cx, top - 28); ctx.stroke();
      ctx.fillStyle = FLAG; ctx.beginPath(); ctx.moveTo(cx, top - 28); ctx.lineTo(cx + 14, top - 23); ctx.lineTo(cx, top - 18); ctx.fill();
    }
    ctx.fillStyle = STONE_DARK; ctx.fillRect(cx - 5, groundY - 12, 10, 12);
  }

  function drawTower(now) {
    const { groundY } = L(), cx = toPx(round.castleX), bh = blockH(), w = 42, n = round.tower.blocks;
    const fall = wreck ? Math.min(1, (now - wreck.t0) / 450) : 0;
    ctx.font = `600 ${Math.min(13, bh - 3)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 1; i <= n; i++) {
      if (wreck && i === wreck.block) continue;
      const drop = wreck && i > wreck.block ? fall * bh : 0;
      const y = groundY - i * bh + drop;
      ctx.fillStyle = i % 2 ? STONE : '#aeb6bf'; ctx.fillRect(cx - w / 2, y, w, bh);
      ctx.strokeStyle = STONE_DARK; ctx.lineWidth = 1; ctx.strokeRect(cx - w / 2 + 0.5, y + 0.5, w - 1, bh - 1);
      if (bh >= 12) { ctx.fillStyle = INK; ctx.fillText(String(i), cx, y + bh / 2 + 1); }
    }
    const topY = groundY - n * bh + (wreck ? fall * bh : 0);
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, topY); ctx.lineTo(cx, topY - 22); ctx.stroke();
    ctx.fillStyle = FLAG; ctx.beginPath(); ctx.moveTo(cx, topY - 22); ctx.lineTo(cx + 14, topY - 17); ctx.lineTo(cx, topY - 12); ctx.fill();
  }

  function drawMarker(m) {
    drawRock({ x: m.x, y: m.y }, 0.45);
    ctx.font = '700 13px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    const label = String(m.label), tw = ctx.measureText(label).width + 10;
    const lx = Math.min(Math.max(m.x, tw / 2 + 2), W - tw / 2 - 2), ly = m.y - 10;
    ctx.fillStyle = 'rgba(255,255,255,.9)'; roundRect(lx - tw / 2, ly - 18, tw, 18, 9); ctx.fill();
    ctx.fillStyle = '#b3261e'; ctx.fillText(label, lx, ly - 2);
  }

  function drawRock(p, alpha = 1) {
    ctx.globalAlpha = alpha; ctx.fillStyle = ROCK;
    ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawParticles() {
    for (const p of particles) { ctx.fillStyle = p.color; ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // ---------- animation ----------
  function shotPos(now) {
    const t = Math.min(1, (now - shot.t0) / shot.dur);
    return { x: shot.x0 + (shot.x1 - shot.x0) * t, y: shot.y0 + (shot.y1 - shot.y0) * t - shot.peak * 4 * t * (1 - t), t };
  }

  function burst(x, y, colors, n = 26) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * Math.random(), v = 2 + Math.random() * 4;
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 60 + Math.random() * 30, s: 3 + Math.random() * 4, color: colors[i % colors.length] });
    }
  }

  function tick(now) {
    raf = 0;
    if (armT > 0 && armT < 1) armT = Math.min(1, armT + 0.12);
    if (shot) {
      const p = shotPos(now);
      if (p.t >= 1) { const done = shot.resolve; shot = null; done(); }
    }
    const { groundY } = L();
    particles = particles.filter((p) => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.25;
      if (p.y > groundY) { p.y = groundY; p.vx *= 0.6; p.vy *= -0.3; }
      return --p.life > 0;
    });
    draw(now);
    if (shot || particles.length || (armT > 0 && armT < 1) || (wreck && now - wreck.t0 < 600) || round?.wind) raf = requestAnimationFrame(tick);
  }
  const start = () => { if (!raf) raf = requestAnimationFrame(tick); };

  return {
    setRound(r) {
      round = r; markers = []; wreck = null; particles = []; armT = 0; shot = null;
      draw(performance.now()); start();
    },

    /** Animate the shot described by judge(); resolves when the effect is over. */
    shoot(result) {
      const { groundY } = L();
      const x0 = toPx(round.catapultX), y0 = groundY - 48;
      let x1, y1;
      if (round.tower) {
        const h = Math.max(0, result.landing.height), bh = blockH();
        x1 = toPx(round.castleX) - 21;
        y1 = h > round.tower.blocks ? groundY - (round.tower.blocks + 2) * bh : groundY - (h - 0.5) * bh;
        if (h > round.tower.blocks) x1 += 60;
      } else {
        x1 = toPx(Math.max(0, result.landing.x)); y1 = groundY - 6;
      }
      const peak = Math.min(groundY - 80, Math.max(70, Math.abs(x1 - x0) * 0.45));
      armT = 0.01;
      return new Promise((resolve) => {
        shot = { x0, y0, x1, y1, peak, t0: performance.now(), dur: 750 + Math.min(600, Math.abs(x1 - x0) * 1.2), resolve: () => {
          if (result.hit) {
            wreck = { t0: performance.now(), block: round.tower ? round.answer : 0 };
            burst(x1 + (round.tower ? 21 : 0), y1, [STONE, STONE_DARK, FLAG, '#ffd34d'], 40);
            navigator.vibrate?.([20, 40, 60]);
            setTimeout(resolve, 900);
          } else {
            burst(x1, y1, [GRASS_EDGE, '#8b6b3e', ROCK], 12);
            const label = round.tower ? `${result.landing.height}` : `${result.landing.x}`;
            markers.push({ x: Math.min(x1, W - 8), y: y1, label });
            setTimeout(resolve, 350);
          }
          start();
        } };
        start();
      }).then(() => { armT = 0; draw(performance.now()); });
    },

    destroy() { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); },
  };
}
