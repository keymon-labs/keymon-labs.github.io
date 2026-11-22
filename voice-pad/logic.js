// Voice Pad rules: pitch from x, vowel from y, voice types, register. Pure functions, no DOM.

/** Vowels top to bottom on the pad. f = first three formants in Hz, mouth = [width, height] 0..1 for the face. */
export const VOWELS = [
  { id: "oo", f: [300, 870, 2240], mouth: [0.25, 0.3] },
  { id: "oh", f: [570, 840, 2410], mouth: [0.4, 0.6] },
  { id: "ah", f: [800, 1150, 2900], mouth: [0.6, 1] },
  { id: "eh", f: [530, 1840, 2480], mouth: [0.8, 0.55] },
  { id: "ee", f: [270, 2290, 3010], mouth: [1, 0.25] },
];

/** Teaching ranges as MIDI numbers (60 = middle C). shortcut: textbook ranges, real voices vary, label as a guide. */
export const VOICES = {
  bass: { lo: 40, hi: 64, label: "Bass", about: "Lowest adult male voice, E2 to E4." },
  tenor: { lo: 48, hi: 72, label: "Tenor", about: "High adult male voice, C3 to C5." },
  alto: { lo: 53, hi: 77, label: "Alto", about: "Low female or child voice, F3 to F5." },
  soprano: { lo: 60, hi: 84, label: "Soprano", about: "Highest voice, C4 to C6." },
};

/** Scale steps in semitones from the root. null = free glide. */
export const SCALES = {
  pentatonic: { label: "Pentatonic (easy)", steps: [0, 2, 4, 7, 9] },
  major: { label: "Major", steps: [0, 2, 4, 5, 7, 9, 11] },
  minor: { label: "Minor", steps: [0, 2, 3, 5, 7, 8, 10] },
  chromatic: { label: "Every note", steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  free: { label: "Free glide", steps: null },
};

const clamp01 = (v) => Math.min(1, Math.max(0, v));

export const midiToHz = (m) => 440 * 2 ** ((m - 69) / 12);

/** Notes of a scale (root C) between lo and hi, inclusive. */
export function scaleNotes(scaleId, lo, hi) {
  const steps = SCALES[scaleId].steps;
  if (!steps) return [];
  const out = [];
  for (let m = lo; m <= hi; m++) if (steps.includes(((m % 12) + 12) % 12)) out.push(m);
  return out;
}

/** Pad x (0..1) to a MIDI pitch. Snapped scales return a whole number, free glide a fraction. */
export function xToMidi(x, voice, scaleId) {
  const { lo, hi } = VOICES[voice], raw = lo + clamp01(x) * (hi - lo);
  const notes = scaleNotes(scaleId, lo, hi);
  if (!notes.length) return raw;
  return notes.reduce((best, n) => (Math.abs(n - raw) < Math.abs(best - raw) ? n : best), notes[0]);
}

/** Pad y (0..1, top to bottom) to blended formants and mouth shape. */
export function yToVowel(y) {
  const p = clamp01(y) * (VOWELS.length - 1), i = Math.min(VOWELS.length - 2, Math.floor(p)), t = p - i;
  const a = VOWELS[i], b = VOWELS[i + 1], mix = (u, v) => u + (v - u) * t;
  return {
    id: (t < 0.5 ? a : b).id,
    f: a.f.map((v, k) => mix(v, b.f[k])),
    mouth: a.mouth.map((v, k) => mix(v, b.mouth[k])),
  };
}

/** Which register a pitch sits in for this voice: lowest third chest, middle mixed, top third head. shortcut: simplified model. */
export function register(midi, voice) {
  const { lo, hi } = VOICES[voice], t = (midi - lo) / (hi - lo);
  return t < 1 / 3 ? "chest" : t < 2 / 3 ? "mixed" : "head";
}

/** Vibrato depth in cents from finger speed (pad widths per second): still finger = a little, fast swipe = none. */
export function vibratoCents(speed) {
  return speed < 0.15 ? 25 : Math.max(0, 25 * (1 - (speed - 0.15) / 0.6));
}

export const REGISTERS = {
  chest: "Chest voice: low notes, buzzy and strong. It feels like it sits in the chest.",
  mixed: "Mixed voice: the middle, where chest and head blend smoothly.",
  head: "Head voice: high notes, lighter and thinner. It feels like it sits in the head.",
};
