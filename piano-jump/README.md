# Piano Jump

Platform game played on a real piano: play the note shown on the staff and the egg jumps to the next stone. Live: https://keymon-labs.github.io/piano-jump/

Needs Chrome/Edge (Web MIDI / Web Bluetooth). Computer keys A–K play C4–C5 for testing (Shift = octave down).

## Files
| File | Contents |
|---|---|
| `index.html` | Markup only: canvas stage, HUD, menu, fail and win overlays |
| `style.css` | All styling |
| `game.js` | Game logic: settings, layout, note handling, update/draw loop, input wiring |
| `songs.json` | Song data (see format below) |
| `fingering.js` | Five-finger positions per hand: finger for each note, and where the hand moves |
| `library.js` | Import songs from a plain or password-protected library file, validation, on-device storage (see [LIBRARY.md](LIBRARY.md)) |
| `test/*.test.js` | Checks for library validation/encryption and fingering |
| `editor/` | Song editor: tap notes onto a staff, scan a printed page, save to the library, export JSON (see [editor/README.md](editor/README.md)) |
| `LIBRARY.md` | Library file format, encryption, and a prompt for an LLM to write libraries |
| `sw.js`, `manifest.webmanifest`, `icon-*.png` | Installable app / offline |
| `v1/`, `v2/` | Frozen earlier versions (single-file, self-contained; do not edit) |

Menu → **Song library** loads extra songs from a file onto the device. Tool: `scripts/pj-library.mjs` encrypts/decrypts library files.

Shared modules used: `midi.js`, `music.js`, `audio.js`, `pwa.js` (see [../shared/README.md](../shared/README.md)).

## Song format (`songs.json`)
```json
{ "id": "twinkle", "title": "Twinkle Twinkle", "info": "4/4 · C to A",
  "bpm": 96, "bar": 4,
  "notes": [ ["C4", 1, "Twin"], ["A4", 1, "lit", 5] ] }
```
Each note: `[pitch, beats, lyric?, finger?]`. Pitch is `C4`, `F#3`…; beats can be fractional (`0.5`); hands start in C position (right thumb on C4, left pinky on C3; right hand from middle C up) and keep their five-finger position until a note falls outside it; finger 1–5 sets a new position from that note on, so put hand moves at leaps or phrase breaks. The guide shows an arrow when the hand moves (`fingering.js`, tested in `test/fingering.test.js`). Adding a song is a data-only change.

## Test hook
`window.__pj` exposes `onNote(midi)`, `state` and `idx` for headless tests.
