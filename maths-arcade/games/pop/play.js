// Shared by Pop and Match: layout, physics world, funnel scene, ball selection, score + streak, stars.
// createPlay(host, level, { tray, onExit, onSelect(sel), onReady(), onFinish({ stars, heading, detail }) }) ->
//   { layout, world, scene, sel, ready, left, tap(ball), clearSel(), hit(a, b, firstTry) -> points, miss(balls),
//     finishIfDone() -> bool, destroy() }
// The game module decides what a selected pair means; this decides how balls are picked and scored.

import { createWorld, pour, removeBall, settled, touching, touchingPairs, nudge } from './world.js';
import { makeNumbers, radiusFor, points } from './logic.js';
import { createScene } from './scene.js';
import { createRng } from '../../../shared/rng.js';
import { starsFor } from '../../core/session.js';
import { createPlayLayout } from '../../ui/play-layout.js';

export function createPlay(host, level, { tray = false, onExit, onSelect, onReady, onFinish }) {
  const rng = createRng();
  const layout = createPlayLayout(host, { title: level.title, onExit });
  const world = createWorld();
  const scene = createScene(layout.stage, world, { tray, onTap: tap });
  pour(world, makeNumbers(level, rng).map((n) => ({ n, r: radiusFor(n, level.max) })), rng);
  const totalPairs = level.balls / 2;
  const hudEl = host.querySelector('.rounds');
  let sel = [], score = 0, streak = 0, firstTryHits = 0, ready = false;

  // Wait until the pour has settled, then keep an eye out for a pile with no touching pair.
  let calm = 0;
  const t0 = Date.now();
  const timer = setInterval(() => {
    if (!ready) {
      calm = settled(world) ? calm + 1 : 0;
      if (calm >= 3 || Date.now() - t0 > 4000) { ready = true; onReady?.(); }
    } else if (world.balls.length >= 2 && settled(world, 0.05) && touchingPairs(world).length === 0) nudge(world); // truly at rest, yet nothing touches
  }, 400);

  function hud() {
    hudEl.innerHTML = `<b class="hud">★ ${score}${streak >= 2 ? ` · 🔥 ${streak}` : ''}</b>`;
  }
  hud();

  function tap(ball) {
    if (!ready || !world.balls.includes(ball)) return;
    const i = sel.indexOf(ball);
    if (i >= 0) sel.splice(i, 1);
    else if (sel.length === 1 && touching(sel[0], ball)) sel.push(ball);
    else sel = [ball];
    scene.mark(sel);
    onSelect?.(sel);
  }

  return {
    layout, world, scene, tap,
    get sel() { return sel; },
    get ready() { return ready; },
    get left() { return world.balls.length; },
    clearSel() { sel = []; scene.mark(sel); },

    /** The pair is right: pop it, score it. firstTry keeps the streak alive. */
    hit(a, b, firstTry) {
      const pts = points(a, b, firstTry ? streak : 0);
      score += pts;
      streak = firstTry ? streak + 1 : 0;
      if (firstTry) firstTryHits++;
      scene.burst(a); scene.burst(b, `+${pts}`);
      removeBall(world, a); removeBall(world, b);
      this.clearSel();
      hud();
      return pts;
    },
    miss(balls) { streak = 0; scene.shake(balls); hud(); },

    finishIfDone() {
      if (world.balls.length) return false;
      const stars = starsFor(firstTryHits, totalPairs);
      onFinish({ stars, heading: stars === 3 ? 'Perfect!' : stars === 2 ? 'Great popping!' : 'All popped!', detail: `Score ${score}` });
      return true;
    },
    destroy() { clearInterval(timer); scene.destroy(); host.innerHTML = ''; },
  };
}
