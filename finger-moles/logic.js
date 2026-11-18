// Finger Moles rules: hand positions, what a played key means, and round sequences. Pure, no DOM.
// Data: tunes.json · Used by game.js · Tested in test/logic.test.js
import { toMidi } from "../shared/music.js";

// Five-finger C position. Keys low → high; fingers are the numbers a piano teacher uses.
export const HANDS = {
  R: { base: 60, fingers: [1, 2, 3, 4, 5] },   // thumb on middle C (C4)
  L: { base: 48, fingers: [5, 4, 3, 2, 1] },   // pinky on C3, thumb on G3
};
const WHITE = [0, 2, 4, 5, 7];                 // C D E F G above the hand's C

/** The five keys under the hand, low → high: [{ midi, finger, col }]. */
export const handKeys = (hand) =>
  WHITE.map((s, col) => ({ midi: HANDS[hand].base + s, finger: HANDS[hand].fingers[col], col }));

/**
 * What a played note means while `target` (MIDI) is wanted.
 * hit · wrong (another key under the hand: col says which) · away (outside the hand: it moved)
 */
export function judge(midi, target, hand) {
  if (midi === target) return { kind: "hit" };
  const k = handKeys(hand).find((k) => k.midi === midi);
  return k ? { kind: "wrong", col: k.col } : { kind: "away", sameNote: midi % 12 === target % 12 };
}

/** Moles for a round: `n` random keys, never the same hole twice in a row. */
export function randomRound(rng, hand, n) {
  const keys = handKeys(hand), out = [];
  while (out.length < n) {
    const k = rng.pick(keys);
    if (k.midi !== out.at(-1)) out.push(k.midi);
  }
  return out;
}

// Tune tokens are "E4" (one beat) or "E4:1.5" (beats).
const tokens = (tune) => tune.notes.trim().split(/\s+/).map((t) => t.split(":"));

/** A tune's notes for this hand (tunes are written for the right hand; the left plays an octave lower). */
export const tuneRound = (tune, hand) => tokens(tune).map(([n]) => toMidi(n) - (hand === "L" ? 12 : 0));

/** Beats of each note, for the sing-back at the end. */
export const tuneBeats = (tune) => tokens(tune).map(([, b]) => (b === undefined ? 1 : +b));

/** Bad tokens: notes outside the hand (no finger is on them) or lengths that aren't positive numbers. */
export const checkTune = (tune) =>
  tokens(tune).filter(([n, b]) => !/^[A-G]4$/.test(n) || !handKeys("R").some((k) => k.midi === toMidi(n)) || (b !== undefined && !(+b > 0)))
    .map((t) => t.join(":"));

/** Stars at the end: share of moles hit on the first try. */
export const starsFor = (firstTry, total) => (total ? (firstTry / total >= .9 ? 3 : firstTry / total >= .6 ? 2 : 1) : 0);

/** Speedy mode: how long a mole stays up after `hits` hits (seconds). */
export const upTime = (hits) => Math.max(1.1, 3.2 * Math.pow(.93, hits));
