// Music rules for Brick Beats: brick colour → note, instruments, scales, fruit rhythms. Pure, no DOM; tests in test/rhythm.test.js.
import { NOTE_NAMES } from "../shared/music.js";

// Same order as NAMES in vision.js (index = colour class).
export const COLOURS = [
  { id: "red", label: "Red", hex: "#C23B4E" },
  { id: "brown", label: "Brown", hex: "#7B4D3D" },
  { id: "coral", label: "Coral", hex: "#F4707A" },
  { id: "yellow", label: "Yellow", hex: "#E8B923" },
  { id: "pale_yellow", label: "Pale yellow", hex: "#E6DA9A" },
  { id: "lime", label: "Lime", hex: "#B4D63B" },
  { id: "clear_lime", label: "Clear lime", hex: "#A3BC6A" },
  { id: "cyan", label: "Cyan", hex: "#08A4D3" },
  { id: "blue", label: "Blue", hex: "#0A5CA3" },
  { id: "pink", label: "Pink", hex: "#CC62BE" },
  { id: "white", label: "White", hex: "#E9EEF0" },
];

// base = lowest MIDI note of the instrument's octave (middle C = 60).
export const INSTRUMENTS = {
  pad: { label: "Pad", base: 48 }, lead: { label: "Lead", base: 72 }, bass: { label: "Bass", base: 36 },
  pluck: { label: "Pluck", base: 60 }, string: { label: "Strings", base: 48 }, bell: { label: "Bell", base: 72 },
};
export const DEFAULT_INSTRUMENTS = ["pad", "lead", "bass", "pluck", "string", "bell"];

export const SCALES = {
  pent: { label: "Always sounds good (pentatonic)", steps: [0, 2, 4, 7, 9] },
  major: { label: "Happy (major)", steps: [0, 2, 4, 5, 7, 9, 11] },
  minor: { label: "Moody (minor)", steps: [0, 2, 3, 5, 7, 8, 10] },
  blues: { label: "Bluesy", steps: [0, 3, 5, 6, 7, 10] },
};

/** Semitones above the key for a colour: colours walk up the scale and wrap round it. */
export const semitone = (colour, scale) => { const s = SCALES[scale].steps; return s[colour % s.length]; };
/** MIDI note for a colour on an instrument. key = 0..11 semitones above C. */
export const midiOf = (instrument, key, scale, colour) => INSTRUMENTS[instrument].base + key + semitone(colour, scale);
/** "C♯4" */
export const pitchLabel = (midi) => NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
export const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

/** One stud is an eighth note, so 2 studs = 1 beat. */
export const BEATS_PER_STUD = 0.5;

// beats = lengths in beats of the notes in the pattern. Coconut and blueberry are two touching bricks.
export const FRUITS = [
  { id: "plum", name: "Plum", beats: [1], hex: "#7A3E8E", recipe: "One 2×2 brick" },
  { id: "apple", name: "Apple", beats: [2], hex: "#4E9A2E", recipe: "One 2×4 brick" },
  { id: "watermelon", name: "Watermelon", beats: [4], hex: "#D93F5A", recipe: "One 2×8 brick" },
  { id: "coconut", name: "Coconut", beats: [2, 1], hex: "#8B6240", recipe: "2×4 then 2×2, touching" },
  { id: "blueberry", name: "Blueberry", beats: [1, 2], hex: "#3E5BB5", recipe: "2×2 then 2×4, touching" },
  { id: "banana", name: "Banana", beats: [3], hex: "#D9B520", recipe: "One 2×6 brick" },
];
export const fruitById = (id) => FRUITS.find((f) => f.id === id);
const SINGLE = { 2: "plum", 4: "apple", 6: "banana", 8: "watermelon" }; // brick length in studs → fruit

/**
 * Label bricks with their fruit: sets brick.fruit (id or null) and brick.fruitLead (true on the first brick of a pattern).
 * tracks: [{ bricks: [{ start, len }] }]
 */
export function annotateFruits(tracks) {
  for (const tr of tracks) {
    const bs = [...tr.bricks].sort((a, b) => a.start - b.start);
    for (const b of bs) { b.fruit = null; b.fruitLead = false; }
    for (let i = 0; i < bs.length; i++) {
      const a = bs[i], n = bs[i + 1];
      if (n && a.start + a.len === n.start) {
        const pair = a.len === 4 && n.len === 2 ? "coconut" : a.len === 2 && n.len === 4 ? "blueberry" : null;
        if (pair) { a.fruit = n.fruit = pair; a.fruitLead = true; i++; continue; }
      }
      if (SINGLE[a.len]) { a.fruit = SINGLE[a.len]; a.fruitLead = true; }
    }
  }
}

/** { plum: 3, apple: 2 }: how many of each fruit pattern the mat holds. */
export function fruitCounts(tracks) {
  const c = {};
  for (const tr of tracks) for (const b of tr.bricks) if (b.fruit && b.fruitLead) c[b.fruit] = (c[b.fruit] || 0) + 1;
  return c;
}
