# Rain Garden (prototype)

An echo game on a real piano for beginners of about 4–7. A cloud sings a short pattern over five flowers, one per finger. The child plays it back ("rains" it) with the right hand in five-finger C position: thumb on middle C, one finger per key, colour and number per finger. Each note is a single raindrop: the arm drops it, then floats up on a rest beat. Live: https://keymon-labs.github.io/rain-garden/

Needs Chrome/Edge for a piano (Web MIDI or Bluetooth MIDI). Without one, tap the screen keys or use computer keys A S D F G.

## How it works
- **First time:** a grown-up posture check (bench height, feet, distance, soft round hand, home position), then a **rain check**. The child plays each flower gently, which gives the touch baseline for *this* keyboard. Then the child plays thumb and pinky at their own speed, which sets the pulse (clamped to 100–125 bpm).
- **Levels** (`levels.json`), in order: Two-islands → Three-islands (black-key groups anywhere on the piano, a different one each time) → Home C (every C, then middle C) → Finger names (the cloud waits) → Raindrops (1-3-5 on a tick, one rest beat each) → Five drops → Steps (next-door fingers) → Little tunes (3–5 notes, at least one rest beat in every four) → By ear (no visual cue from the start).
- **Echo loop:** the cloud sings on the pulse (👂), then the child answers on the same pulse (✋). The answer is judged as the right notes in order, inside a timing window **centred on the child's own average** (±2 SD, 100–200 ms), with nothing extra. Mashing never passes.
- **A miss shrinks the task:** the tick stops and the cloud sings the pattern again with full colour, then waits for each note. After two misses the tempo drops 5% for the next round, and it comes back toward the child's own pace after good rounds. There are no speed rewards.
- **Cues fade:** colour + number + position → position only → sound only, after 3 clean echoes in a row. They come back after 3 misses in a row. The 👁️ button replays the item with full cues at any time, without losing anything. A level **blooms** 🌸 only after 3 clean echoes with no cue. The next bed opens once the colour has faded. Progress never expires.
- **Feedback:** each note splashes while the item is new (cue 0). Once it is easier, feedback comes once per phrase. The round summary describes the sound: whether every flower got the same rain (velocity spread against the keyboard's own baseline), thunder for very hard notes, and drops on the tick, early or late (honest, shown after the round only). At most one praise line ("Steadier than last time!").
- **Session:** rounds of about 1–2 minutes. One "rain dance" off-screen break before the second round (skippable). A gentle "garden is sleepy" ending after 5/10/15 min (grown-up setting), with no lockout.
- **Grown-ups (🧑):** redo the posture check or the rain check, **Duet** (the grown-up plays low C+G on each tick; notes below A3 are theirs and never count), voice, note sound, open all beds, reset.

## Files
| File | Contents |
|---|---|
| `index.html`, `style.css` | Markup: map, set-up, break, summary and grown-up overlays |
| `game.js` | Canvas drawing (cloud, flowers, keys, islands), pulse scheduling, round flow, voice |
| `logic.js` | Pure rules: pattern parsing and checks, judging an echo, personal timing window, pace, tempo steps, evenness, islands, cue fading |
| `levels.json` | Levels: `{ id, kind: "islands" \| "home" \| "echo", icon, title, intro, hint, … }`. Echo levels have `timed`, `items`, `pool` of patterns like `"C4 D4 E4 -"` (one token per beat, `-` = rest beat), and an optional `startCue`. Tests check that every pattern stays under the hand, ends on a rest, has no more than 3 notes without a rest, and no more than 3 repeats of a note |
| `midi-in.js` | Copy of `shared/midi.js` that also reports velocity and event time (prototype shortcut) |
| `test/logic.test.js` | Timing window, judging (including mashing), pace, tempo, evenness, islands, cue fading, level data |

Shared modules used: `music.js`, `audio.js`, `rng.js`, `piano-keys.js`, `pwa.js` (keep screen awake).

## Test hook
`window.__rg` exposes `onNote(midi, vel, t)`, `startLevel(id)`, `toMap()`, `showMe()`, `state`, `item` (with expected times), `run`, `calib`, `progress`, `store`. The headless check fakes `navigator.requestMIDIAccess` and plays answers at the expected times.

## Similar ideas
Echo ("call and response") is a standard first step in Kodály and Orff teaching. Black-key groups as landmarks and the five-finger C position are common in beginner piano methods. Art (canvas drawing), sounds (Web Audio) and all text are our own.

## Known shortcuts (prototype)
- No PWA or offline mode, and no `vN/` snapshots yet.
- `midi-in.js` duplicates `shared/midi.js` to add velocity and time. Extract it at final.
- No separate latency calibration and no Bluetooth-audio warning. Centring the window on the child's mean absorbs a steady offset, so the "early/late" picture can lean slightly late on laggy audio.
- Only the right hand in C position. Legato, staccato, left hand and hands together are not built yet.
- Voice is the browser's speech synthesis (English only).
- One child per device.
