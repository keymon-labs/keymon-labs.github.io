// Beat Tiles rules. A card is ONE beat holding n sounds (0 = rest "shh", 1 = ta, 2 = ti-ti, 3 = tri-o-la, 4 = ti-ka-ti-ka).
// Pure, no DOM; tests in test/logic.test.js. Themes (one word per sound count) live in themes.json.

export const NAMES = { 0: "shh (rest)", 1: "ta", 2: "ti-ti", 3: "tri-o-la", 4: "ti-ka-ti-ka" };
export const NEXT = [1, 2, 3, 4, 0]; // tapping a card walks this order

/** A theme's four words become cards indexed by sound count: [rest, 1, 2, 3, 4]. */
export function cardsFor(theme) {
  return [{ id: "rest", kind: "rest", n: 0, syl: [] }, ...theme.words.map((w) => ({ id: w.id, kind: "word", n: w.syl.length, syl: w.syl }))];
}
/** Problems with a theme (empty list = fine): exactly four words, word k has k syllables. */
export function checkTheme(theme) {
  const bad = [];
  if (!theme.name) bad.push("no name");
  if (theme.words.length !== 4) bad.push("needs 4 words");
  theme.words.forEach((w, k) => { if (w.syl.length !== k + 1) bad.push(`${w.id}: ${w.syl.length} syllables, expected ${k + 1}`); });
  return bad;
}
export const label = (c) => (c.kind === "rest" ? "shh" : c.syl.join("·"));

// Bar shapes: sounds per beat, 4 beats per bar (shortcut: 3/4 and other bar lengths, add when asked). Beat 1 is never a rest.
const VERSE = [[1, 1, 2, 1], [1, 2, 1, 2], [2, 1, 1, 2], [1, 1, 1, 1], [1, 2, 1, 1], [2, 1, 2, 1], [1, 0, 2, 1], [1, 1, 2, 0]];
const TAILS = [[1, 2], [2, 1], [1, 1], [2, 0], [1, 3]];

export const composeBar = (rng, cards) => VERSE[Math.floor(rng.next() * VERSE.length)].map((n) => cards[n]);
/** Keep the hook (first two beats), change the ending. */
export function varyBar(A, rng, cards) {
  const old = A.slice(2).map((c) => c.n).join();
  const t = TAILS.filter((x) => x.join() !== old);
  return [A[0], A[1], ...t[Math.floor(rng.next() * t.length)].map((n) => cards[n])];
}
/** Same bar with a busy last beat (3 or 4 sounds) that leads back to the start. */
export const fillBar = (A, rng, cards) => [...A.slice(0, 3), cards[rng.next() < 0.5 ? 3 : 4]];

/** 1-4 bars: A / A A' / A A A' / A A B A'. Retries when there are too many rests. */
export function composeGroove(rng, cards, bars = 2) {
  for (;;) {
    const A = composeBar(rng, cards), f = fillBar(A, rng, cards);
    const g = bars === 1 ? [A] : bars === 2 ? [A, f] : bars === 3 ? [A, A, f] : [A, A, varyBar(A, rng, cards), f];
    if (g.flat().filter((c) => c.n === 0).length <= Math.max(1, Math.floor((bars * 4) / 5))) return g;
  }
}
/** The next pass of the loop: sometimes a changed ending, every 4th pass a fresh groove. `now` forces a change. */
export function evolveBars(bars, rng, cards, pass, now = false) {
  const nb = bars.length;
  if (nb === 1 || (!now && pass % 4 === 0)) return composeGroove(rng, cards, nb);
  if (!now && rng.next() >= 0.5) return bars;
  const A = bars[0], out = [...bars];
  if (nb === 4) out[2] = varyBar(A, rng, cards);
  out[nb - 1] = fillBar(A, rng, cards);
  return out;
}
/** Same rhythm, other theme. */
export const retheme = (bars, cards) => bars.map((b) => b.map((c) => cards[c.n]));
/** The card a tap turns this one into: same theme, next sound count (1, 2, 3, 4, rest). */
export const nextCard = (c, cards) => cards[NEXT[(NEXT.indexOf(c.n) + 1) % NEXT.length]];
/** Funny voice effects, applied when a recorded word plays (the saved recording stays clean). factor = pitch/speed change. */
export const EFFECTS = {
  none: { label: "Normal" }, chipmunk: { label: "Chipmunk", factor: 1.7 }, monster: { label: "Monster", factor: 0.6 },
  robot: { label: "Robot" }, wobble: { label: "Wobbly" }, echo: { label: "Echo" }, backwards: { label: "Backwards" }, crunchy: { label: "Crunchy" },
};
/** Playback speed of a recorded word in one beat: at least `factor` (1 = normal), and fast enough to fit the beat (max 3x). */
export const clipRate = (dur, beat, factor = 1) => Math.min(3, Math.max(factor, dur / (beat * 0.95)));
export const clipKey = (theme, id) => `${theme}:${id}`;
