// Counts quick consecutive taps (hidden debug toggle). Clock is injected; no DOM.
export function createTapCounter({ now = Date.now, taps = 10, gapMs = 2000 } = {}) {
  let n = 0;
  let last = -Infinity;
  /** Call on each tap; returns true on the tap that completes the run (then restarts). */
  return function tap() {
    const t = now();
    n = t - last <= gapMs ? n + 1 : 1;
    last = t;
    if (n < taps) return false;
    n = 0;
    return true;
  };
}
