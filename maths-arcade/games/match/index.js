// Match mini game: result balls roll in at the bottom (2 or 3 at a time), each one the product of
// some pair of touching balls in the funnel. Pick a pair that makes one of them and both pop,
// result ball included. No typing. Funnel, scoring and selection are shared with Pop (../pop/play.js).
// Test hook: window.__mathsArcade.

import levels from './levels.json' with { type: 'json' };
import { pairFor, refillTargets } from './logic.js';
import { touchingPairs } from '../pop/world.js';
import { createPlay } from '../pop/play.js';
import { createRng } from '../../../shared/rng.js';

export default {
  id: 'match',
  title: 'Match',
  emoji: '🎯',
  blurb: 'Result balls roll in. Find the two touching balls that make one!',
  levels,
  mount,
};

const STALE_AFTER = 3; // checks (about 2 s) without a pair before a result ball is swapped

function mount(host, level, { onFinish, onExit }) {
  const rng = createRng();
  let targets = [], misses = 0, wrongInARow = 0;
  const stale = new Map();
  const play = createPlay(host, level, { tray: true, onExit, onFinish, onSelect, onReady });
  const { layout, scene, world } = play;
  layout.keypadHost.hidden = true; // nothing to type here

  function onReady() { refill(); ask(); }

  // Results follow the pile: a result whose pair has been popped or has rolled apart is replaced.
  function refill() {
    const pairs = touchingPairs(world);
    for (const v of targets) stale.set(v, pairFor(pairs, v) ? 0 : (stale.get(v) ?? 0) + 1);
    targets = refillTargets(targets, pairs, level.targets, rng, (v) => stale.get(v) < STALE_AFTER);
    scene.syncTargets(targets);
  }
  const timer = setInterval(() => play.ready && refill(), 700);

  function ask() {
    const s = play.sel;
    layout.setQuestion({
      title: 'Match', text: `${play.left} balls left`,
      expr: !play.ready ? 'Here they come…' : s.length ? `${s[0].n} × ?` : 'Make a result ball',
    });
  }

  function onSelect(s) {
    layout.setFeedback('');
    if (s.length < 2) return ask();
    const [a, b] = s, p = a.n * b.n;
    if (!targets.includes(p)) {
      misses++; wrongInARow++;
      play.miss(s);
      layout.setFeedback(`${a.n} × ${b.n} = ${p}. Not one of the results.`, 'bad');
      if (wrongInARow >= 2) { // show a way out: a glowing pair that makes one of the results
        const pair = pairFor(touchingPairs(world), rng.pick(targets));
        if (pair) { scene.hint([pair.a, pair.b]); layout.setFeedback('Try the glowing balls.', 'hint'); }
      }
      play.clearSel();
      return ask();
    }
    const pts = play.hit(a, b, misses === 0);
    scene.popTarget(p);
    targets = targets.filter((v) => v !== p);
    misses = 0; wrongInARow = 0;
    layout.setFeedback(`${a.n} × ${b.n} = ${p}  +${pts}`, 'good');
    refill();
    if (!play.finishIfDone()) ask();
  }

  window.__mathsArcade = {
    world, ready: () => play.ready, pairs: () => touchingPairs(world), targets: () => [...targets],
    tap: play.tap,
  };
  ask();
  return {
    destroy() { clearInterval(timer); delete window.__mathsArcade; play.destroy(); },
  };
}
