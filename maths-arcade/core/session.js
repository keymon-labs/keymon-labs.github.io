// One play-through of a level: a fixed number of rounds, retries allowed.
// Game-agnostic. The game asks for the current round, reports hit/miss, and
// the session decides when to show a hint, reveal the answer, move on and score.

export const HINT_AFTER = 1;   // misses before the hint shows
export const REVEAL_AFTER = 2; // misses before the answer is shown

export function createSession({ rounds, makeRound }) {
  let index = 0;
  let misses = 0;
  let firstTryHits = 0;
  let round = makeRound(0);

  return {
    get index() { return index; },
    get total() { return rounds; },
    get round() { return round; },
    get misses() { return misses; },
    get showHint() { return misses >= HINT_AFTER; },
    get revealAnswer() { return misses >= REVEAL_AFTER; },
    get done() { return index >= rounds; },

    /** Record a shot. Returns { done } after a hit moves to the next round. */
    submit(hit) {
      if (this.done) throw new Error('session already finished');
      if (!hit) { misses++; return { advanced: false, done: false }; }
      if (misses === 0) firstTryHits++;
      index++;
      misses = 0;
      if (index < rounds) round = makeRound(index);
      return { advanced: true, done: index >= rounds };
    },

    get firstTryHits() { return firstTryHits; },
    get stars() { return starsFor(firstTryHits, rounds); },
  };
}

/** 3 stars: all first try. 2 stars: at least 60%. 1 star: finished. */
export function starsFor(firstTryHits, rounds) {
  if (firstTryHits >= rounds) return 3;
  if (firstTryHits >= Math.ceil(rounds * 0.6)) return 2;
  return 1;
}
