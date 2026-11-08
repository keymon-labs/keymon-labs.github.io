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
| `merge.js` | One brick at a time per lane (`clearFor`, `tidy`) and joining a retake with the earlier reading of the same mat (`mergeTracks`). Pure |
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

**Corners and distortion.** `findCorners()` returns the plate's four corners plus a distortion score (`distortion()`: how much shorter the far side looks, how squashed one direction is, how far the corners are from right angles; level good / ok / high) and `sure` (the four sides are straight lines and the angle is not extreme). Good and ok are straightened silently; high is still straightened but the status asks for a retake from straight above with the whole square in view. If no square is found, or it is not `sure`, the *Fix corners* editor opens by itself: drag four dots onto the corners (or onto the working area, which also works for a mat-less table or floor) and `warp()` rebuilds the flat view from them; `turnQuad()` turns lanes left to right when tape shows which way. *Fix corners* is always available under the photo.

**Finding the corners.** The plate (green) and the tape on it are one region; small gaps are closed, so a thin line, glare or a hand does not split it. The outline is reduced to the best four corners (the four-sided shape whose sides stay closest to it, so rounded corners and bumps do not move it), then the four sides are refitted twice and intersected. The result is checked against the region it came from (nothing left outside, not much empty floor inside) and the sides must be straight: that is `sure`. *Snap dots to corners* in the corner editor lets a dot land on the plate corner or on a strong colour corner (Harris on colour gradients, at a coarse scale so single studs fade out) near where it was let go.

**The matrix (`grid.js`).** In a straightened photo the plate fills a known square, so the reading is a fixed matrix: lane lines (dashed) × stud columns, and the loop is the number of columns. Bricks snap to a column from their left edge and to the lane their middle is in; notes cannot be dragged outside it. *Edit grid* shows the lines: drag a lane line (a move that would put two notes at the same time in one lane is refused), tap a line then *Remove line*, *Add lane* (splits the tallest), drag the left column edge to slide the grid and the right one to change the stud size, *Fewer / More columns*. Bricks the reader found stay where they are in the photo and re-snap; bricks you placed move with the grid. A tap above the first or below the last lane makes a new lane there. The matrix, the lane lines and the corners are remembered between photos (localStorage `brick-beats-map-v1`): a new photo of the same mat reuses the grid when you set it by hand, or when it finds the same number of lane lines; when the reader is not sure of the corners it tries the last photo's, as long as they still sit on the plate. *Reset grid* forgets all of it and reads the photo again from scratch. Photos that could not be straightened are read as before (loop as long as the bricks).

## Learned colours
Tapping a colour swatch on a selected brick is a correction: the app remembers how that brick looked (its measured RGB) and the colour you chose. On the next photo, a brick that looks close to a remembered one (RGB distance under 30) takes the taught colour; anything else falls back to the fixed rules in `vision.js`. "Forget learned colours" is in the grown-up settings. Why it only overrides close matches: on the test mat the fixed rules were already right for every brick, and a catalogue learned in one lighting did worse than the rules in another, so learning is a correction layer, not a replacement. Not done: teaching colours the catalogue does not have (dark red, orange, pale aqua) needs the 11-colour list to become extendable. Also tried and dropped: reusing the last plate position as a fallback; the plate-fitting already survives a covered corner, and a stale position would be wrong whenever the camera moved.

## Fixing mistakes
Tap a brick to change its colour or length, or remove it. Tap empty space on the photo to add a missed brick: `probe()` grows a region of similar colour from the tap, picks the nearest lane, and selects the new brick so it can be adjusted.

**Drag on the photo.** Drag a brick to move it (snaps to studs, and to the lane it is dropped in); the selected brick has grips at both ends to stretch it from either side. The dashed lines are the lane boundaries: drag one and every brick re-joins the lane its centre is now in. Thin lines mark half-beats (one stud), heavy ones beats (two studs); the lane rolls below use the same two weights. The ♪ column left of the photo mutes a lane. **One brick at a time per lane:** a brick that lands on or grows over another trims it, or removes it if it is fully covered.

**Retaking the photo.** *Take photo* asks the phone for the back camera (`capture="environment"`); *Choose photo* opens the gallery. If the new photo has the same number of lanes and at least half of its bricks match the earlier reading (allowing the first brick to have moved), the two are joined: bricks keep their identity and any edits, a brick seen in two photos with the same colour becomes sure, a disagreement is marked for a check, and bricks the new photo missed are kept but marked unsure. Lane settings (instrument, mute, solo) are kept; dragged lane lines are kept when both photos were straightened. A different mat (or an example) replaces the reading. A new photo while playing does not stop the music: the new lanes take over at the next note.

## Data format
`detect()` returns `{ ok, plate, lanes, pitch, fit, loopLen, brickCount, tracks }` where each track is `{ row, bricks: [{ cls, start, len, x, y, w, h }] }`. `start` and `len` are in studs, relative to the leftmost brick; `cls` indexes `NAMES`/`COLOURS`.

## Shared modules used
`shared/music.js` (note names), `shared/pwa.js` (service worker, keep awake).

## Versions
v1 is the latest. No frozen snapshots yet.

## Gaps between lanes
With tape lanes, gaps are on by default and as wide as the tape the reader measured. The **Gap** button in the grid editor gives each lane a margin at its top and bottom (for tape or the space between rows). Bricks and the note editor sit exactly inside the lane band; Gap − / Gap + adjust it. The gap is remembered with the mapping.

## Test photos
`scripts/brick-beats-mat.mjs` generates mats (straight, turned, slanted, wood floor with tape ends, far away, plain) into `examples/` with `index.json`. `test/examples.test.js` checks that each one is straightened and read back exactly. The app lists them under "More test photos…". Real photos are never committed.

See [IDEAS.md](IDEAS.md) for planned work (library, history, sharing).
