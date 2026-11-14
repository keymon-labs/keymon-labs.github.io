# Beat Tiles

Learn rhythm by playing. Every card is **one beat**; the picture says how many **sounds** fit inside that beat (1 = ta, 2 = ti-ti, 3 = tri-o-la, 4 = ti-ka-ti-ka, or a rest). The cards play left to right, a row per bar, as a groove that repeats and changes a little each time. Inspired by classroom "fruit rhythm" teaching (sound before symbol, say the word on the beat).

## How it plays
- 1-4 bars of 4 beats (default 2 bars = 4×2 cards). Bars follow A / A A' / A A A' / A A B A': a repeated bar with a changed ending and a busy last beat.
- Backing: kick on beats 1 and 3, hi-hat, bass (C C A G); word tunes are C pentatonic, so everything fits. Swing delays the second sound of a 2-sound beat.
- Tap a card: it becomes the next sound count (1, 2, 3, 4, rest). Editing by hand turns Auto-change off.
- **Theme** keeps the rhythm and swaps the words and pictures. Sound = Words, Clap, Stomp, Snap or **My voice**.
- **My voice**: record one clip per word (mic, or a file picker where there is no mic). The clip is trimmed and played once per beat, sped up (max 3×) if it is longer than the beat. Clips live in memory only: never saved, uploaded or committed.
- Rhythm names toggle shows ta / ti-ti / tri-o-la / ti-ka-ti-ka. Say words uses the browser's speech voice at the start of each beat (timing is the browser's).

## Files
| File | What |
|---|---|
| `index.html`, `style.css` | Markup and styles (system fonts only) |
| `game.js` | UI, playback clock, tap-to-change, themes, recording; test hook `window.__beatTiles` |
| `logic.js` | Pure rules: cards from a theme, grooves, evolving, rhythm names, clip speed. Tests in `test/logic.test.js` |
| `sound.js` | Web Audio: word tunes, clap/snap/stomp, backing, recorded clips (no samples) |
| `themes.json` | Themes: exactly one word per sound count (syllables listed). Add a theme = a JSON entry + 4 SVGs in `art/` named by word id |
| `art/*.svg` | Original artwork, one icon per word plus `rest.svg` (inlined at build) |
| `sw.js`, `manifest.webmanifest`, `icon-*.png` | Installable, works offline |

## Shared modules used
`shared/rng.js` (seeded grooves, so a groove number can be replayed), `shared/pwa.js` (service worker, install button, keep screen awake).

## Not done yet
Other bar lengths (3/4), listening games (echo the pattern, hide the cards), pre-made voice clips, saving grooves.

## Versions
v1 (latest): first version.
