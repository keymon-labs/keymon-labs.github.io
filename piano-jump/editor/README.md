# Piano Jump song editor

Page: `piano-jump/editor/` (live: https://keymon-labs.github.io/piano-jump/editor/). Make songs by tapping notes onto a staff, or import a photo of a printed staff, then save to the on-device library the game reads, or export JSON. No network calls at runtime, no accounts, no analytics.

## Files
| File | Contents |
|---|---|
| `index.html`, `editor.css` | Markup and styles (touch targets 44px+, no web fonts) |
| `song-model.js` | Pure logic: notes on a half-beat grid, placing, duration cycling, bar sums, rests on export, library conversion, scan layout, undo history |
| `staff-view.js` | Layout, tap hit-testing and SVG drawing of the staff |
| `editor.js` | UI glue: toolbar, lyrics, preview (Web Audio), save/export, library list, draft autosave, `hooks` |
| `scan.js` | Photo → straighten, contrast, crop → recogniser → editor (review screen) |
| `omr/engine.js` | Our own pure-JS staff recogniser behind `recognize(imageData, { clef })` |
| `test/` | `song-model`, `staff-view`, `engine` tests; `synth.js` draws synthetic staves for the engine tests |

Library storage and export helpers (`upsertStored`, `libraryObject`, `libraryJson`) live in `../library.js`.

## Using it
- Tap a free beat: new note (length from the toolbar, pitch from the line or space). Tap a note: quarter → half → whole → removed. Tap just above or below a note: stem up or down (drawing only). Type a syllable under a note.
- Toolbar: eighth, quarter, half, whole, dotted (quarter and half), rest, undo/redo, play, clear, bass staff, staff size, new song.
- Bars show their beat total; a warning names what is missing. Changing "Beats per bar" moves the barlines, notes keep their beats.
- The game has no rests, so on export a rest (or gap) is added to the note before it; if that gives a length the game does not allow, the error names the note. Errors always name the song and the note; save and export are disabled until they are fixed.
- **Load into Piano Jump** calls `hooks.loadIntoPianoJump({ songs: [song] })` in `editor.js` (also `window.pianoJumpEditorHooks`). The default copies the song text. Saving to the library already makes the song appear in the game menu.
- The editor keeps a draft of the current song in this browser so a reload does not lose it.

## Scan a page
Photo or image file → rotate / Straighten / Contrast → drag the box round **one staff** → clef → Read. Notes are added to the editor (after existing notes, one staff at a time) and the cropped photo stays beside it; orange notes are low confidence. Fix everything with the tap tools. Nothing is uploaded or stored: the full photo is dropped after reading, the cropped staff is kept in memory until "Discard photo".
- The recogniser reads: staff lines, filled/hollow heads, stems, flags and beams, dots, barlines, pitch from position. It does **not** read rests, sharps/flats, key signatures, ties, lyrics or grand staves.
- Tested on synthetic staves only; real photos will need a clean, flat, well-lit crop.
- NoteLens was considered and not used: its repository has no licence file, and it is a standalone page, not a library. To try a different engine (for example an ONNX model), implement `recognize` with the same result shape and change the import in `scan.js`.
