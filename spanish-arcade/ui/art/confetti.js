// Canvas confetti (own code, no dependency). Colours come from the theme tokens, so palettes work. Does nothing under prefers-reduced-motion.
const TOKENS = ['--art-1', '--art-2', '--art-3', '--accent'];

export function confettiColors(el = document.documentElement) {
  const cs = getComputedStyle(el);
  const list = TOKENS.map((t) => cs.getPropertyValue(t).trim()).filter(Boolean);
  return list.length ? list : ['#f9a11b', '#ff7a8a', '#4aa3d9'];
}

export function confetti({ count = 70, ms = 1800 } = {}) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const cv = document.createElement('canvas');
  cv.className = 'art-confetti';
  const dpr = Math.min(devicePixelRatio || 1, 2), w = innerWidth, h = innerHeight;
  cv.width = w * dpr; cv.height = h * dpr;
  document.body.append(cv);
  const g = cv.getContext('2d'); g.scale(dpr, dpr);
  const cols = confettiColors();
  const bits = Array.from({ length: count }, (_, i) => ({ x: w / 2, y: h * 0.4, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 12 - 4, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4, s: 6 + Math.random() * 6, c: cols[i % cols.length], round: i % 3 === 0 }));
  const t0 = performance.now();
  (function frame(now) {
    const t = now - t0;
    g.clearRect(0, 0, w, h);
    g.globalAlpha = Math.max(0, 1 - Math.max(0, t - ms * 0.6) / (ms * 0.4));
    for (const b of bits) {
      b.vy += 0.35; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.r += b.vr;
      g.save(); g.translate(b.x, b.y); g.rotate(b.r); g.fillStyle = b.c;
      if (b.round) { g.beginPath(); g.arc(0, 0, b.s / 2, 0, 6.28); g.fill(); } else g.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2);
      g.restore();
    }
    if (t < ms) requestAnimationFrame(frame); else cv.remove();
  })(t0);
  return true;
}
