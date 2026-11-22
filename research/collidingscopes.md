# collidingScopes: computer-vision projects to learn from

One author (GitHub [collidingScopes](https://github.com/collidingScopes), also "Fun With Computer Vision") who publishes many small browser projects built on hand and body tracking, with code and tutorials. A good place to learn how MediaPipe, Three.js and Tone.js fit together.

## Projects seen
| Project | Link | Licence | What | Tech |
|---|---|---|---|---|
| Fruit Ninja | [repo](https://github.com/collidingScopes/fruit-ninja), [play](https://collidingscopes.github.io/fruit-ninja/) | MIT (checked in README) | Slice fruit by waving a hand; 5 lives, rising difficulty, high score | MediaPipe Hands, Three.js, vanilla JS, mobile-friendly |
| Arpeggiator | [repo](https://github.com/collidingScopes/arpeggiator), [play](https://collidingscopes.github.io/arpeggiator/) | MIT (checked in README) | Hand 1 plays an arpeggio (height is pitch, pinch is volume); hand 2 picks drum patterns by how many fingers are up; visuals react to the audio | MediaPipe, Tone.js, Three.js, canvas |
| 3D Model Playground | listed in the Arpeggiator README | not checked | Control 3D models with voice and hand gestures | not checked |
| Three.js hand tracking tutorial | listed in the Arpeggiator README | not checked | Basic hand tracking setup with Three.js and MediaPipe | not checked |
| Particular Drift | listed in the Arpeggiator README | not checked | Turn photos into flowing particle animations | not checked |
| Video-to-ASCII | listed in the Arpeggiator README | not checked | Convert video into ASCII pixel art | not checked |

The author sells lifetime access to full project files and tutorials through Fun With Computer Vision, while keeping many repos open source.

## Learn / try
- The Arpeggiator mapping (hand height to pitch, pinch to volume, finger count to pattern) is a clean template for hands-in-the-air music toys. Ties in with the singing pad and the rhythm games.
- Fruit Ninja shows the minimum viable camera game: no framework, one tracking loop, simple scoring.
- Read the Three.js hand tracking tutorial first to get a camera plus landmarks running fast.

## Reuse
Both checked projects are MIT, so code can be reused with the licence text kept and a [CREDITS.md](../CREDITS.md) row added. The other projects need their licence checked first.
