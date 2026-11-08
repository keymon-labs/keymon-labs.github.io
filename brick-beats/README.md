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
| `rhythm.js` | Colour → note, instruments, scales, fruit rhythm rules. Pure |
| `synth.js` | Web Audio voices (pad, lead, bass, pluck, strings, bell) |
| `example-photo.jpg` | Example: a photo of a plain mat (the owner's own) |
| `example-taped.png` | Example: generated taped mat, made by `scripts/brick-beats-mat.mjs` |
| `test/*.test.js` | Tests on generated mats and the rhythm rules |
| `sw.js`, `manifest.webmanifest`, `icon-*.png` | Installable, works offline |

## Fixing mistakes
Tap a brick to change its colour or length, or remove it. Tap empty space on the photo to add a missed brick: `probe()` grows a region of similar colour from the tap, picks the nearest lane, and selects the new brick so it can be adjusted.

## Data format
`detect()` returns `{ ok, plate, lanes, pitch, fit, loopLen, brickCount, tracks }` where each track is `{ row, bricks: [{ cls, start, len, x, y, w, h }] }`. `start` and `len` are in studs, relative to the leftmost brick; `cls` indexes `NAMES`/`COLOURS`.

## Shared modules used
`shared/music.js` (note names), `shared/pwa.js` (service worker, keep awake).

## Versions
v1 is the latest. No frozen snapshots yet.
