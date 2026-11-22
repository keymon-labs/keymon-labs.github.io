// keyboard.js — Computer keyboard input mapped to piano notes

const KeyboardInput = {
  activeKeys: new Set(),

  // Two octaves mapped across two rows of keys
  // Lower octave (C4-B4): bottom row
  // Upper octave (C5-B5): top row
  keyMap: {
    // Lower octave - white keys
    'a': 60, // C4
    's': 62, // D4
    'd': 64, // E4
    'f': 65, // F4
    'g': 67, // G4
    'h': 69, // A4
    'j': 71, // B4
    // Lower octave - black keys
    'w': 61, // C#4
    'e': 63, // D#4
    't': 66, // F#4
    'y': 68, // G#4
    'u': 70, // A#4

    // Upper octave - white keys
    'k': 72, // C5
    'l': 74, // D5
    ';': 76, // E5
    "'": 77, // F5
    // Use number row for remaining upper octave
    '1': 79, // G5
    '2': 81, // A5
    '3': 83, // B5
    '4': 84, // C6
    // Upper octave - black keys
    'o': 73, // C#5
    'p': 75, // D#5
    ']': 78, // F#5
    '5': 80, // G#5
    '6': 82, // A#5
  },

  init() {
    document.addEventListener('keydown', (e) => this._onKeyDown(e));
    document.addEventListener('keyup', (e) => this._onKeyUp(e));
  },

  _onKeyDown(e) {
    // Ignore if typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    // Ignore repeats
    if (e.repeat) return;

    const key = e.key.toLowerCase();
    const midi = this.keyMap[key];
    if (midi === undefined) return;

    e.preventDefault();
    this.activeKeys.add(midi);
    MidiManager.activeNotes.add(midi);
    AudioFX.playNote(midi, 100);
    if (MidiManager.onNoteOn) MidiManager.onNoteOn(midi, 100);
  },

  _onKeyUp(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key.toLowerCase();
    const midi = this.keyMap[key];
    if (midi === undefined) return;

    e.preventDefault();
    this.activeKeys.delete(midi);
    MidiManager.activeNotes.delete(midi);
    AudioFX.stopNote(midi);
    if (MidiManager.onNoteOff) MidiManager.onNoteOff(midi);
  },

  isNoteActive(midi) {
    return this.activeKeys.has(midi);
  }
};
