// noteHelpers.js — MIDI number ↔ note name, colors, positions

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Rainbow colors for each natural note
const NOTE_COLORS = {
  'C': '#FF4444',   // Red
  'D': '#FF8C00',   // Orange
  'E': '#FFD700',   // Yellow
  'F': '#44BB44',   // Green
  'G': '#00CED1',   // Cyan
  'A': '#4488FF',   // Blue
  'B': '#9944FF',   // Purple
  // Sharps/flats get a darker shade
  'C#': '#CC3333', 'D#': '#CCAA00', 'F#': '#339933',
  'G#': '#00AAAA', 'A#': '#6633CC',
};

// Alias flats to sharps
NOTE_COLORS['Db'] = NOTE_COLORS['C#'];
NOTE_COLORS['Eb'] = NOTE_COLORS['D#'];
NOTE_COLORS['Gb'] = NOTE_COLORS['F#'];
NOTE_COLORS['Ab'] = NOTE_COLORS['G#'];
NOTE_COLORS['Bb'] = NOTE_COLORS['A#'];

// Convert MIDI number to note name (e.g., 60 → "C")
function midiToNoteName(midi) {
  return NOTE_NAMES[midi % 12];
}

// Convert MIDI number to full note name with octave (e.g., 60 → "C4")
function midiToFullName(midi) {
  const octave = Math.floor(midi / 12) - 1;
  return NOTE_NAMES[midi % 12] + octave;
}

// Is this MIDI note a black key?
function isBlackKey(midi) {
  const n = midi % 12;
  return n === 1 || n === 3 || n === 6 || n === 8 || n === 10;
}

// Get color for a MIDI note
function getNoteColor(midi) {
  const name = midiToNoteName(midi);
  return NOTE_COLORS[name] || '#888888';
}

// Piano range: C4 (60) to C6 (84) — 2 octaves + 1
const PIANO_LOW = 60;
const PIANO_HIGH = 84;

// Build the key layout for our visible keyboard range
function buildKeyLayout() {
  const whiteKeys = [];
  const blackKeys = [];
  let whiteIndex = 0;

  for (let midi = PIANO_LOW; midi <= PIANO_HIGH; midi++) {
    if (isBlackKey(midi)) {
      blackKeys.push({ midi, whiteIndex: whiteIndex - 1 });
    } else {
      whiteKeys.push({ midi, index: whiteIndex });
      whiteIndex++;
    }
  }
  return { whiteKeys, blackKeys, whiteCount: whiteIndex };
}

const KEY_LAYOUT = buildKeyLayout();

// Get x position of a MIDI note on the keyboard (0-1 range relative to keyboard width)
function getKeyPosition(midi, keyboardWidth) {
  const { whiteKeys, blackKeys, whiteCount } = KEY_LAYOUT;
  const whiteKeyWidth = keyboardWidth / whiteCount;

  if (isBlackKey(midi)) {
    const bk = blackKeys.find(k => k.midi === midi);
    if (!bk) return null;
    return (bk.whiteIndex + 0.75) * whiteKeyWidth;
  } else {
    const wk = whiteKeys.find(k => k.midi === midi);
    if (!wk) return null;
    return (wk.index + 0.5) * whiteKeyWidth;
  }
}

// Get the width of a note block for rendering
function getNoteWidth(midi, keyboardWidth) {
  const { whiteCount } = KEY_LAYOUT;
  const whiteKeyWidth = keyboardWidth / whiteCount;
  return isBlackKey(midi) ? whiteKeyWidth * 0.6 : whiteKeyWidth * 0.9;
}
