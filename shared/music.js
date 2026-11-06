// Note names and staff maths. MIDI numbers throughout: middle C (C4) = 60.

export const NOTE_NAMES = ["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"];
export const SOLFEGE = ["Do","Do♯","Re","Re♯","Mi","Fa","Fa♯","Sol","Sol♯","La","La♯","Si"];

const LETTER_IDX = [0,0,1,1,2,3,3,4,4,5,5,6];
const SEMI = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };

/** "C4", "F#3" → MIDI number. */
export const toMidi = (s) => {
  const m = /^([A-G])(#?)(-?\d)$/.exec(s);
  return 12 * (+m[3] + 1) + SEMI[m[1]] + (m[2] ? 1 : 0);
};

/** Staff position: middle C = 0, +1 per line/space upwards. Sharps share their natural's step. */
export const stepOf = (m) => (Math.floor(m / 12) - 5) * 7 + LETTER_IDX[m % 12];

export const isSharp = (m) => [1,3,6,8,10].includes(m % 12);

/** Pitch-class name; system "solfege" gives Do Re Mi, anything else C D E. */
export const noteName = (m, system) => (system === "solfege" ? SOLFEGE : NOTE_NAMES)[m % 12];
