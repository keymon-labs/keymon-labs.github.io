# Drone Hide (prototype)

Hide-and-seek for two players in front of one laptop camera. A drone's light sweeps the room; hide behind the (virtual) rocks, then dash out and touch the gems to collect them. Caught in the light = lose a star. Most stars after 60 seconds wins.

## Similar things (ideas only, nothing copied)
- Webcam "EyeToy"-style games: your body is the controller, found by comparing the camera picture with an empty-room snapshot ([overview of the technique](https://timtaubert.de/blog/2013/02/getusermedia-part-3-simple-motion-detection-in-a-live-video/)).
- [MediaPipe Image Segmenter](https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter/web_js): ML person cut-out in the browser. Sturdier against lighting changes, but needs a model file and WASM; the upgrade path if background subtraction is not enough.

## How it works
- Camera → 160×120 mirrored buffer. At start everyone steps out for a few seconds and the empty room is averaged into a background (`bg`).
- Each frame, pixels that differ from `bg` are the players (`foreground()`, specks removed). The background drifts slowly with room light, only where nobody stands (`adapt()`).
- Left half of the picture = player 1, right half = player 2.
- Rocks are drawn over the video, so standing behind one hides you on screen too. `hiddenShare()` drives the 🪨 hidden / 👀 visible hint.
- The drone flies to random spots (faster as the round goes on). If ≥25 of a player's visible pixels are in its light, that player loses a star (2.5 s grace).
- Gems appear in the open, 3 per side; touching one with ≥10 body pixels collects it.
- Press **d** to see what the camera takes for players (green). If it is wrong, use **Retake the empty room** and keep the camera still.

## Privacy
The camera picture is only drawn to a canvas on this page. Nothing is recorded, saved or sent anywhere; the camera stops when the page closes. Needs https (the live site is) or localhost.

## Files
| File | What |
|---|---|
| `index.html`, `style.css` | Markup and styles |
| `game.js` | Camera, game loop, drawing |
| `logic.js` | Pure rules: foreground mask, hiding, drone sight, gem touch, rock layout |
| `test/logic.test.js` | Checks for `logic.js` |

Shared modules used: `rng.js`, `audio.js`, `pwa.js` (`keepAwake`). Test hook: `window.__droneHide`; add `?fast` to the URL for short countdowns and a 12 s round.

## Known shortcuts
- Moving the camera or big light changes break the background: retake the room.
- Two players must stay in their own half; no per-person tracking.
- Skin or clothes close to the background colour are found less well.
- No PWA, no version snapshots, no per-device tuning (thresholds are constants in `logic.js` / `game.js`).
