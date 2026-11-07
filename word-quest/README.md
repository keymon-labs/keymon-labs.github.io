# Word Quest

A story game for writing practice. The child writes one sentence on paper and takes a photo. Claude reads it and points out the mistakes at the chosen level; the child fixes them on paper and takes another photo. Once the sentence is clean, the episode plays it out: stick-figure animation in the scene, and the result (plus every speech bubble) in the box under the scene.

**Versions:** v1 (latest, still in development). Episodes: *Smash the Frog* (English and Spanish), with a step-by-step tutorial the first time.

## How it's built
Episodes are **data**; the code is a small engine that plays any episode.

| File | What |
|---|---|
| `episodes/<id>/episode.json` | One episode: scene, state, word groups, rules, outcomes, tutorial. Format: [EPISODES.md](EPISODES.md). |
| `art/*.svg` | Shared art (kid rig, frog, ball, hoop, sun, cloud, hills). Movable parts are `data-part` groups. |
| `library.json` | Shared poses (tween shorthand) and emoji effects, usable by every episode. |
| `game.js` | Engine, pure: matching, state, `between` resets, `takeTurn`, stars, coins, Claude-reply checks. |
| `episode.js` | Episode checks with friendly messages (tests and Help → *Try it*), library merge, tween → keyframes. |
| `stage.js` | Scene renderer and beat player (move with arc/spin, pose, say, fx, sound, shake, wait). |
| `sounds.js` | Synthesized sound effects (names used by episodes). |
| `ai.js` | Claude prompts (read the photo, improvise), reply parsing, API call (web). |
| `app.js` | UI controller: screens, feedback box, tutorial, photo flow, help, debug. |
| `index.html` / `style.css` / `strings.json` | Markup, styles, UI text (en/es). |
| `episodes/index.js` | Loads every episode and SVG (as text, so the Claude bundle stays one file). |
| `web.js` / `claude.js` | Entries: web (own API key) / inside Claude (`sample`, the viewer's account). |
| `test/` | `game.test.js` (engine, incl. a generic fixture), `episode.test.js` (every episode folder, library, error messages), `ai.test.js`. |

To change behaviour, prefer data: a new reaction is an outcome; a new move is a pose in `library.json`; a new character is an SVG in `art/`. Code changes go in the one module that owns the concern.

## Game rules
- Photo → Claude lists mistakes for the level (age in Help: 4–5 basic, 6–8 standard, 9–12 advanced). Spanish accents are never required.
- Coins (header): +1 per word written right, −1 per mistake, never below 0. Scored on every photo.
- After two photos with mistakes, a hint shows a correct version.
- A clean sentence runs the first matching rule; anything else goes to Claude, which picks a hero pose, a speech bubble and a funny line. It can't move other actors or win.
- Stars on a win: 3 on the first photo, 2 on the second, 1 after; 2 at most without the episode's bonus word.

## Tutorial, help, debug
- Tutorial: steps in the box under the scene with **Next** (and Skip); the examples play through the real rules. Replay from Help.
- Help → *Make your own episode*: a prompt to give Claude, and a box to paste an `episode.json` and try it (kept on this device).
- Debug: tap the top-left corner of the scene 10 times within 4 seconds, then type a sentence (skips the photo).
- Test hook: `window.__wordQuest` (`store()`, `run()`, `busy()`).

## Data kept on the device
Browser storage only (`word-quest:v1`): language, age, coins, progress (stars, tutorial seen) per episode, pasted episodes, and the last 200 sentences. The web version's API key is kept separately (`word-quest:apikey`) and is sent only to Anthropic.

## Shared modules used
- `shared/audio.js`: sound synthesis
- `shared/pwa.js`: service worker (web)
- `shared/claude-link.js`: "Open in Claude" button
