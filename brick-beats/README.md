# Brick Beats

Build music on a brick mat, take a photo, press play. The photo is read on the device (no network, no Claude calls) into lanes and bricks, then played with Web Audio while a line moves over the photo.

## How the mat is read
- Green plate found by colour; bricks are the rectangles on it. The stud spacing gives the grid, so each brick gets a start stud and a length.
- Optional blue tape splits the plate into lanes (tracks). Without tape, rows of bricks are grouped by gap.
- 11 brick colours, each one a note; lane = instrument; 1 stud = an eighth note (2 studs = 1 beat).
- Fruit rhythms (plum 1 beat, apple 2, watermelon 4, banana 3, coconut 2+1, blueberry 1+2) are labelled from brick lengths; a button plays them slowly.

## Files
| File | What |
|---|---|
| `index.html`, `style.css` | Markup and styles (system fonts only) |
| `app.js` | UI, playback scheduler, playhead; test hook `window.__brickBeats` |
| `vision.js` | Photo pixels → `{ tracks, lanes, pitch, fit, loopLen }` (`detect`); `probe` re-reads one brick at a tapped point. Pure, no DOM |
| `correct.js` | Straightening before reading: finds the plate and tape, warps to a flat top-down view, turns the lanes left to right. Returns `null` if the whole plate is not in view. Pure |
| `profile.js` | What the app remembers between photos: colours the player taught it. Pure; saved as JSON in the browser (localStorage), never sent anywhere |
| `rhythm.js` | Colour → note, instruments, scales, fruit rhythm rules. Pure |
| `synth.js` | Web Audio voices (pad, lead, bass, pluck, strings, bell) |
| `example-photo.jpg` | Example: a photo of a plain mat (the owner's own) |
| `example-taped.png` | Example: generated taped mat, made by `scripts/brick-beats-mat.mjs` |
| `test/*.test.js` | Tests on generated mats and the rhythm rules |
| `sw.js`, `manifest.webmanifest`, `icon-*.png` | Installable, works offline |

## Photo correction
`correct.js` runs first. If the whole green plate (with its tape) is in the frame it is rebuilt as a flat top-down picture (perspective and rotation removed), and that picture is what the app shows and reads. If the plate is cut off by the frame, the photo is read as it is. Tried and left out: colour balance against the plate's green and a lighting flat-field; on real photos they helped some and hurt others. Not done yet: photos without a plate, and plates cut off by the frame (these need manual corner handles).

Reading itself (`vision.js`): brick length is `2 + (width - height) / pitch` (bricks are 2 studs deep, so side faces and shadows cancel out), start positions come from the stud grid fitted to all left edges, and each blob is trimmed to its brighter top face first.

## Learned colours
Tapping a colour swatch on a selected brick is a correction: the app remembers how that brick looked (its measured RGB) and the colour you chose. On the next photo, a brick that looks close to a remembered one (RGB distance under 30) takes the taught colour; anything else falls back to the fixed rules in `vision.js`. "Forget learned colours" is in the grown-up settings. Why it only overrides close matches: on the test mat the fixed rules were already right for every brick, and a catalogue learned in one lighting did worse than the rules in another, so learning is a correction layer, not a replacement. Not done: teaching colours the catalogue does not have (dark red, orange, pale aqua) needs the 11-colour list to become extendable. Also tried and dropped: reusing the last plate position as a fallback; the plate-fitting already survives a covered corner, and a stale position would be wrong whenever the camera moved.

## Fixing mistakes
Tap a brick to change its colour or length, or remove it. Tap empty space on the photo to add a missed brick: `probe()` grows a region of similar colour from the tap, picks the nearest lane, and selects the new brick so it can be adjusted.

## Data format
`detect()` returns `{ ok, plate, lanes, pitch, fit, loopLen, brickCount, tracks }` where each track is `{ row, bricks: [{ cls, start, len, x, y, w, h }] }`. `start` and `len` are in studs, relative to the leftmost brick; `cls` indexes `NAMES`/`COLOURS`.

## Shared modules used
`shared/music.js` (note names), `shared/pwa.js` (service worker, keep awake).

## Versions
v1 is the latest. No frozen snapshots yet.
