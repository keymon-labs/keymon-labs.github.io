# Movement and camera games for kids

Browser games where the webcam sees the player and the body is the controller. Captured Nov 2026 from web searches and each site's own pages. "Seen" means read from a search snippet only, not checked in the repo.

## Summary
| Name | Link | Licence | Free? | Type | Tech |
|---|---|---|---|---|---|
| Hoppo | [playhoppo.com](https://playhoppo.com/) | Proprietary, all rights reserved | Free for personal and educational use; commercial use needs a paid licence | About 27 camera and touch minigames for ages 5 to 8: movement, learning, creative. Also a no-camera whole-class Brain Break | Static HTML pages, client-side tracking, library not named. Says video stays on the device |
| MovePlay | [moveplay.gg](https://moveplay.gg) | Proprietary | Freemium | 30+ whole-body motion games, ages 4+, with fitness stats | Browser pose tracking on the device, joint-angle analysis |
| Pug's Hunt | [pugshunt.com](https://pugshunt.com) | Not stated | Free | Retro shooter: point a finger to aim, pinch to shoot, mouse fallback | MediaPipe hand tracking in WebAssembly |
| Fruit Ninja (collidingScopes) | [repo](https://github.com/collidingScopes/fruit-ninja), [play](https://collidingscopes.github.io/fruit-ninja/) | MIT (checked) | Free | Slice fruit with your hand; lives, rising difficulty | MediaPipe Hands, Three.js, vanilla JS |
| Arpeggiator (collidingScopes) | [repo](https://github.com/collidingScopes/arpeggiator), [play](https://collidingscopes.github.io/arpeggiator/) | MIT (checked) | Free | Hand-controlled arpeggiator and drum machine with audio-reactive visuals | MediaPipe, Tone.js, Three.js |
| cam-run-for-kids | [repo](https://github.com/jwenjian/cam-run-for-kids) | GPLv3 (seen) | Free | Endless runner steered by body movement, with a feedback companion | Three.js, MediaPipe Pose |
| mediapipe-game | [repo](https://github.com/SUcy6/mediapipe-game) | None seen, so all rights reserved | Free to view | Air painting, motion-to-animation, nose-controlled fruit slicer | Python, MediaPipe, OpenCV, Unity |
| hotspot-game | [repo](https://github.com/pageauc/hotspot-game) | None seen | Free | Hit shrinking boxes with body motion, one or two players | Python, OpenCV; desktop or Raspberry Pi |
| WebCam Mania 4 | [webcam.sulat.net](https://webcam.sulat.net) | Not stated | Free | EyeToy-style minigames (wipe frost, pop bubbles) | Browser; older versions were Flash |
| Hopla Games | [Reddit post](https://www.reddit.com/r/playmygame/comments/1w1levo/hopla_games_webcam_is_the_controller_movement) | Unknown | Unknown | 15 browser games for young kids played by waving | Webcam pose tracking |
| Air Jake | [Reddit post](https://www.reddit.com/r/WebGames/comments/1xqgimn/air_jake_free_browser_games_you_play_with_your) | Unknown | Free per the post | Whole-body browser games | Tracking in the browser |

Also: the [itch.io webcam tag](https://itch.io/games/free/input-webcam) lists about 78 free games, licences vary per game. Hardware versions of the same idea: Nex Playground (camera console), Just Dance with a phone camera, Osmo (tablet plus pieces).

## What stands out
- Almost everything browser-based uses **MediaPipe** (Hands or Pose) for tracking. It runs on the device, so no video is uploaded, which is the privacy line every site advertises.
- Hoppo's mix is worth studying as a design, not a codebase: short games, three input modes (hand, move, touch), a no-camera mode for classrooms, a parent view, difficulty and performance settings.
- Touch fallback and mouse fallback matter: they keep a game playable when the camera is missing or refused.

## Learn / try
- A shared MediaPipe camera module (permission, mirrored preview, hand or pose landmarks, performance mode) that several games can use. Candidate for `shared/` once a second app needs it.
- Gesture vocabulary for young kids: wave, pop, reach, jump. Keep it forgiving.
- A no-camera "call the moves" mode for group use.

## Licence note on Hoppo
Hoppo's terms prohibit copying, modifying, mirroring and reverse engineering, and allow only personal, non-commercial use. This note describes it from the outside. Nothing from the site is stored here.
