# shared/: reusable modules

**Check this index before writing new code.** If a module here does the job, import it; if it almost does, extend it (keep existing callers working). Add a row here whenever you add or change a module.

Import from an app with a relative path; Vite bundles and hashes it:
```js
import { connectMidi } from "../shared/midi.js";
```

| Module | What it does | Exports | Used by |
|---|---|---|---|
| [`midi.js`](midi.js) | Note input from a real instrument: Web MIDI (USB/OS-paired), Bluetooth LE MIDI, computer keys as fallback. Note-on only. Chrome/Edge only. | `connectMidi(onNote, onStatus)`, `connectBluetoothMidi(onNote, onStatus)`, `keyboardNotes(onNote)` | piano-jump |
| [`music.js`](music.js) | Note names, note-string ↔ MIDI number, staff position. MIDI 60 = middle C. | `NOTE_NAMES`, `SOLFEGE`, `toMidi("C4")`, `stepOf(midi)`, `isSharp(midi)`, `noteName(midi, "letters"\|"solfege")` | piano-jump |
| [`audio.js`](audio.js) | Simple synthesized sound effects (Web Audio oscillator with envelope). | `unlockAudio()`, `tone(freq, dur, type, gain, delay, slideTo)` | piano-jump |
| [`pwa.js`](pwa.js) | Installable-app helpers: service worker, install button, keep screen awake. | `registerServiceWorker(url)`, `setupInstallButton(button)`, `keepAwake()`, `releaseWake()` | piano-jump, maths-arcade, homework-reader |

## Callback contracts
- `onNote(midi)`: a MIDI note number on note-on.
- `onStatus(s)`: `{ ok: true, name }` when connected; `{ ok: false, message, disconnected? }` otherwise. `message` is user-facing text.

## Rules for this folder
- One module per capability (MIDI input, audio, PWA…), not one per function. Keep each module dependency-free, or wrap one well-known library.
- Plain ES modules, no DOM assumptions beyond what the module is about (e.g. `pwa.js` takes the button, it doesn't look it up).
- Code moves here when a **second** app needs it, or when it is clearly generic (device I/O, PWA). App-specific logic stays in the app.
- Changing an export? Grep `shared/` usages across all apps (`grep -rn "shared/<module>" --include=*.js .`) and update every caller in the same commit. Frozen `vN/` folders don't import shared code, so they're unaffected.
