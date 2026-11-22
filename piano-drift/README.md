# Piano Drift (prototype)

Play a real piano and the visuals drift with it. Live: https://keymon-labs.github.io/piano-drift/

Needs Chrome/Edge for MIDI/Bluetooth. Computer keys A W S E D F T G Y H U J K play C4–C5 (Shift = octave down). Pick a style and palette in the menu; the visuals start with the first note. Mic and "Upload Track" from the original still work and mix with the piano.

## How it works
stereoDrift draws everything from one Web Audio `AnalyserNode` (`analyser`, a global of its script). `piano.js` plays each note as a small synth voice (triangle + saw + octave sine, decay by pitch, brightness by velocity) into that analyser, so all styles react without being changed. The speakers get the voice only when **Sound** is On, or Auto with no instrument connected, so a real piano isn't doubled.

## Files
| File | Contents |
|---|---|
| `index.html` | Trimmed Stereo Drift page plus the piano panel |
| `boot.js` | Puts npm `d3` on `window`, loads the vendored scripts in order, then `piano.js` |
| `piano.js` | MIDI/Bluetooth/keys input → synth voice → analyser; test hook `window.__pianoDrift` (`onNote`, `energy()`, `state`) |
| `voice.js` | Pure: note + velocity → frequency, loudness, decay, brightness (tested) |
| `piano.css` | Piano panel and footer |
| `stereodrift/` | Vendored visualiser, CC BY-NC 3.0: see [SOURCE.md](stereodrift/SOURCE.md) |
| `test/voice.test.js` | Checks for `voice.js` |

Shared modules used: `midi.js` (see [../shared/README.md](../shared/README.md)).

## Known shortcuts
- Note-off and sustain aren't used: every note rings for its own decay.
- Not installable or offline (no manifest or service worker yet).
- The vendored scripts also end up un-hashed in `dist/piano-drift/stereodrift/` next to the hashed copies (about 300 KB wasted).
- Piano notes sit in the low frequency bins, so some styles look quieter than with full-band music.
- Non-commercial only (CC BY-NC 3.0 on the visuals).
