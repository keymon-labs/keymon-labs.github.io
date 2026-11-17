# Finger Moles (prototype)

Whack-a-mole played on a real piano, for small kids learning the five-finger C position. Each finger owns a coloured mole (1 red thumb … 5 blue pinky); a mole pops up, the glove on screen lifts the matching finger, and the kid bonks it by playing that key. Live: https://keymon-labs.github.io/finger-moles/

Needs Chrome/Edge for a piano (Web MIDI / Web Bluetooth). Without one: tap the on-screen keys, or computer keys A S D F G (Shift = left hand).

## What it teaches
- **Hand position**: right thumb on middle C (C4) or left pinky on C3; the five keys under the hand are the five holes.
- **Finger numbers**: mole colour = finger colour = number on its belly. A wrong key makes the mole giggle and the voice says the finger ("Three! Middle finger").
- **Staying home**: any key outside the five shakes the glove and says "Hands home! Thumb on C".

## Modes
| Mode | How |
|---|---|
| Hide & Seek | 10 random moles that wait forever. Key glows after 3 s as a hint. |
| Song Moles | Moles pop in the order of a tune (`tunes.json`), then the moles sing it back as a reward. |
| Speedy Moles | 20 moles that hide again; each hit makes the next one quicker (`upTime`). |

Combo of 5 first-try hits: cheer and bonus points. End screen: 1–3 stars for first-try hits.

## Files
| File | Contents |
|---|---|
| `index.html`, `style.css` | Markup, menu and end overlays |
| `game.js` | Canvas drawing (moles, keys, glove), loop, input, voice |
| `logic.js` | Pure rules: hand keys and fingers, judging a played key, round sequences, stars, speed |
| `tunes.json` | Public-domain tunes inside C–G: `{ id, title, notes: "E4 D4 C4 …" }` (right hand; left hand plays an octave lower) |
| `test/logic.test.js` | Rules and every tune fits under the hand |

Shared modules used: `midi.js`, `audio.js`, `rng.js`, `music.js`.

## Similar ideas
Whack-a-mole is a classic arcade mechanic; finger-colour coding is common in beginner piano methods. Art, sounds and code here are our own.

## Shortcuts
- `// shortcut:` tunes are played with even rhythm (no note lengths); add durations if songs need to feel right.
- No PWA files (manifest, service worker, icons) yet: add at Final.
- Voice uses the browser's speech synthesis (English); quality depends on the device.
- Both hands at once and moving hand positions (G position) not done.
