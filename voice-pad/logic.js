// Voice Pad rules: pitch from x, vowel from y, voice types, register, song planning. Pure functions, no DOM.
import { createRng } from "../shared/rng.js";
import { toMidi } from "../shared/music.js";

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

export const vowelById = (id) => VOWELS.find((v) => v.id === id);

/** Noise colour of a consonant's first letter: sibilant (s z x c j), breath (f v h), plosive (t k p d g b q), or null (m n l r w y, vowels). */
export function consonantClass(onset) {
  const c = (onset || "")[0];
  if (!c) return null;
  if ("szxcj".includes(c)) return "sibilant";
  if ("fvh".includes(c)) return "breath";
  if ("tkpdgbq".includes(c)) return "plosive";
  return null;
}

/** "C4 C4 G4:2" to [{ midi, beats }]. Token = note, optional :beats (default 1). */
export function parseTune(str) {
  return str.trim().split(/\s+/).map((tok) => { const [n, b] = tok.split(":"); return { midi: toMidi(n), beats: b ? +b : 1 }; });
}

/**
 * Time every syllable of a song, one note each. tune = parseTune() result, or null for plain text
 * (one beat per syllable, no guide note, half a beat of rest at a phrase end). A tune is moved by octaves
 * into the voice and repeats when the text is longer. Returns [{ i, midi|null, hz|null, start, dur, syl }] in seconds.
 */
export function planSong(syls, tune, { voice, bpm }) {
  const { lo, hi } = VOICES[voice], spb = 60 / bpm;
  const shift = tune ? Math.round(((lo + hi) / 2 - tune.reduce((a, n) => a + n.midi, 0) / tune.length) / 12) * 12 : 0;
  let beat = 0;
  return syls.map((syl, i) => {
    const n = tune ? tune[i % tune.length] : null, beats = n ? n.beats : 1, midi = n ? n.midi + shift : null;
    const ev = { i, midi, hz: n ? midiToHz(midi) : null, start: beat * spb, dur: beats * spb, syl };
    beat += beats + (!tune && syl.phraseEnd ? 0.5 : 0);
    return ev;
  });
}

/** Index of the event sounding at time t (seconds), or -1 in a rest, before the start or after the end. */
export const eventAt = (events, t) => events.findIndex((e) => t >= e.start && t < e.start + e.dur);

/** Last recorded finger sample at or before t. Samples are sorted by t. Null before the first. */
export function sampleAt(samples, t) {
  let lo = 0, hi = samples.length - 1, r = null;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (samples[m].t <= t) { r = samples[m]; lo = m + 1; } else hi = m - 1; }
  return r;
}
