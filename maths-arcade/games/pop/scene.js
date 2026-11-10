// Funnel canvas: glass funnel, glossy numbered balls, selection glow, pop bursts and, in Match mode,
// the tray where result balls roll in. It also runs the animation loop and steps the physics.
// createScene(stage, world, { tray, onTap(ball) }) ->
//   { mark(balls), shake(balls), hint(balls), burst(ball, text), syncTargets(values), popTarget(value, text), destroy() }
// Purely visual: positions come from world.js, rules from the game modules.

import { W, H, FLOOR, BOTTOM, step, ballAt, pos } from './world.js';

const BAR = 56;        // screen px kept free for the level bar
const TRAY_H = 110;    // world units for the results tray below the funnel
const SLOTS = 3;
const TRAY_R = 34;
const TRAY_Y = BOTTOM + 24 + TRAY_H / 2;
const GOLD = 45;
const hue = (n) => n * 30;

export function createScene(stage, world, { tray = false, onTap }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'scene';
  stage.prepend(canvas);
  const ctx = canvas.getContext('2d');

  const viewX0 = -24, viewW = W + 48, viewY0 = -30;
  const viewH = BOTTOM + 30 + (tray ? 24 + TRAY_H + 12 : 24);
  let cw = 0, ch = 0, dpr = 1, k = 1, ox = 0, oy = 0;
  let alive = true, raf = 0, last = performance.now(), acc = 0;

  const selected = new Set();
  const shakes = new Map();            // ball id -> start time
  let hinted = [], hintUntil = 0;
  const parts = [], rings = [], floats = [];
  const targets = [];                  // { value, slot, x }
  const bokeh = Array.from({ length: 14 }, (_, i) => ({ x: (i * 0.37) % 1, y: (i * 0.61) % 1, r: 10 + ((i * 7) % 22), s: 0.004 + (i % 5) * 0.002 }));

  function fit() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = stage.clientWidth; ch = stage.clientHeight;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    const availH = ch - BAR - 8;
    k = Math.max(0.1, Math.min(cw / viewW, availH / viewH));
    ox = (cw - k * viewW) / 2 - viewX0 * k;
    oy = BAR + (availH - k * viewH) / 2 - viewY0 * k;
  }
  const ro = new ResizeObserver(fit);
  ro.observe(stage);
  fit();

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const ball = ballAt(world, (e.clientX - rect.left - ox) / k, (e.clientY - rect.top - oy) / k, 10 / k); // 10px of finger slack
    if (ball) onTap(ball);
  });

  // ---------- loop ----------
  function frame(now) {
    if (!alive) return;
    const dt = Math.min(now - last, 50); last = now; acc += dt;
    while (acc >= 1000 / 60) { step(world); acc -= 1000 / 60; }
    update(dt);
    draw(now);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  function update(dt) {
    for (const p of parts) { p.x += p.vx * dt / 16; p.y += p.vy * dt / 16; p.vy += 0.08 * dt / 16; p.life -= dt; }
    for (const f of floats) { f.y -= 0.05 * dt; f.life -= dt; }
    for (const r of rings) r.life -= dt;
    for (const arr of [parts, floats, rings]) for (let i = arr.length - 1; i >= 0; i--) if (arr[i].life <= 0) arr.splice(i, 1);
    for (const t of targets) t.x += (slotX(t.slot) - t.x) * (1 - Math.exp(-dt / 220)); // rolls in and eases to its slot
  }
  const slotX = (slot) => (W * (slot + 1)) / (SLOTS + 1);

  // ---------- drawing ----------
  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = ctx.createLinearGradient(0, 0, 0, ch);
    bg.addColorStop(0, '#262a6e'); bg.addColorStop(1, '#5a3a99');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = 'rgba(255,255,255,.06)';
    for (const b of bokeh) { // slow drifting background bubbles
      const y = ((b.y - now * b.s * 0.02) % 1 + 1) % 1;
      ctx.beginPath(); ctx.arc(b.x * cw, y * ch, b.r, 0, Math.PI * 2); ctx.fill();
    }

    ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * ox, dpr * oy);
    drawFunnel();
    if (tray) drawTray(now);
    const pulse = 1 + 0.05 * Math.sin(now / 160);
    for (const b of world.balls) {
      const p = pos(b);
      let x = p.x;
      const s0 = shakes.get(b.id);
      if (s0 !== undefined) { const t = now - s0; if (t > 350) shakes.delete(b.id); else x += Math.sin(t / 25) * 6 * (1 - t / 350); }
      const glow = selected.has(b.id) ? 'sel' : now < hintUntil && hinted.includes(b.id) ? 'hint' : '';
      drawBall(x, p.y, b.r * (glow ? pulse : 1), b.n, hue(b.n), 0, glow);
    }
    drawEffects();
  }

  function drawFunnel() {
    const cx = W / 2, bx = FLOOR / 2;
    ctx.beginPath();
    ctx.moveTo(0, -30); ctx.lineTo(0, 0); ctx.lineTo(cx - bx, H); ctx.lineTo(cx, BOTTOM); ctx.lineTo(cx + bx, H); ctx.lineTo(W, 0); ctx.lineTo(W, -30);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(255,255,255,.07)'); g.addColorStop(1, 'rgba(255,255,255,.24)');
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.stroke();
  }

  function drawBall(x, y, r, n, h, rot, glow) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    if (glow) { ctx.shadowColor = glow === 'sel' ? '#ffd54a' : '#7dffb2'; ctx.shadowBlur = 22; }
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
    g.addColorStop(0, `hsl(${h} 95% 84%)`); g.addColorStop(0.55, `hsl(${h} 78% 56%)`); g.addColorStop(1, `hsl(${h} 72% 38%)`);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = glow ? 4 : 1.5; ctx.strokeStyle = glow === 'sel' ? '#fff' : glow === 'hint' ? '#bfffd9' : 'rgba(0,0,0,.25)'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-r * 0.32, -r * 0.4, r * 0.28, r * 0.16, -0.7, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fill();
    ctx.rotate(-rot * 0.85); // the number turns a little less than the ball: it rolls, but stays readable
    ctx.font = `800 ${Math.round(String(n).length > 2 ? r * 0.75 : r * 1.0)}px system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(2, r * 0.12); ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.strokeText(n, 0, r * 0.04);
    ctx.fillStyle = '#fff'; ctx.fillText(n, 0, r * 0.04);
    ctx.restore();
  }

  function drawTray(now) {
    const top = BOTTOM + 24, left = 10, width = W - 20;
    ctx.beginPath(); ctx.roundRect(left, top, width, TRAY_H, 22);
    ctx.fillStyle = 'rgba(10,12,40,.45)'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,213,74,.7)'; ctx.stroke();
    ctx.font = '700 15px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.fillText('RESULTS: pick two balls that make one', W / 2, top + 16);
    for (const t of targets) {
      const bob = Math.sin(now / 300 + t.slot) * 2;
      const rolling = slotX(t.slot) - t.x;
      drawBall(t.x, TRAY_Y + 8 + bob, TRAY_R, t.value, GOLD, -rolling / TRAY_R, Math.abs(rolling) < 2 ? 'hint' : '');
    }
  }

  function drawEffects() {
    for (const r of rings) {
      const t = 1 - r.life / 420;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r * (1 + t * 1.2), 0, Math.PI * 2);
      ctx.lineWidth = 5 * (1 - t); ctx.strokeStyle = `hsla(${r.h} 95% 75% / ${1 - t})`; ctx.stroke();
    }
    for (const p of parts) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = `hsl(${p.h} 95% 68%)`; ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.font = '800 26px system-ui, sans-serif'; ctx.textAlign = 'center';
    for (const f of floats) {
      ctx.globalAlpha = Math.min(1, f.life / 400);
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = '#ffe066'; ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function burstAt(x, y, r, h, text) {
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 4;
      parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, r: 2 + Math.random() * 4, h, life: 600, max: 600 });
    }
    rings.push({ x, y, r, h, life: 420 });
    if (text) floats.push({ x, y: y - r, text, life: 1100 });
  }

  return {
    mark(list) { selected.clear(); list.forEach((b) => selected.add(b.id)); },
    shake(list) { const t = performance.now(); list.forEach((b) => shakes.set(b.id, t)); },
    hint(list) { hinted = list.map((b) => b.id); hintUntil = performance.now() + 3000; },
    burst(ball, text) { const p = pos(ball); burstAt(p.x, p.y, ball.r, hue(ball.n), text); },

    /** Make the tray show exactly these result values (new ones roll in from the right). */
    syncTargets(values) {
      for (let i = targets.length - 1; i >= 0; i--) if (!values.includes(targets[i].value)) targets.splice(i, 1);
      for (const value of values) {
        if (targets.some((t) => t.value === value)) continue;
        const slot = [...Array(SLOTS).keys()].find((s) => !targets.some((t) => t.slot === s));
        if (slot !== undefined) targets.push({ value, slot, x: W + 70 });
      }
    },
    popTarget(value, text) {
      const i = targets.findIndex((t) => t.value === value);
      if (i < 0) return;
      burstAt(targets[i].x, TRAY_Y + 8, TRAY_R, GOLD, text);
      targets.splice(i, 1);
    },
    destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); },
  };
}
