# Word Quest

A story game for writing practice. The child writes one sentence on paper and takes a photo. Claude reads it and points out the mistakes at the chosen level; the child fixes them on paper and takes another photo. Once the sentence is clean, the story plays out on screen: a stick figure, a ball, a basket and a frog, animated with the Web Animations API.

**Versions:** v1 (latest). First story: *Smash the Frog* (English and Spanish), which starts with an automatic tutorial the first time the app is opened.

## Files
| File | What |
|---|---|
| `index.html` | Markup: header with **?** (help), story screen with a **camera** button, help sheet, hidden debug dialog |
| `style.css` | Colours, minimal controls, scene and paper styles |
| `app.js` | Flow: photo → Claude correction → rules or improvisation → beats, tutorial, help, debug |
| `stage.js` | Scene builder and beat player (move, pose, fx, sound, wait) |
| `game.js` | Pure rules: normalise sentences, match outcomes, scene state, stars, improvised-reply check |
| `ai.js` | Claude prompts, reply parsing, API call (web) |
| `stories/index.js` | Loads every `stories/<id>/story.json` and its `assets/*.svg` (as text, so the Claude bundle stays one file) |
| `stories/frog/story.json` | The story: word groups, rules, scene (actors and spots), poses, fx, outcomes (beats + effects + text), tutorial script |
| `stories/frog/assets/` | SVG assets for the story (the stick figure) |
| `strings.json` | UI text in English and Spanish |
| `web.js` / `claude.js` | Entries: web (own API key) / inside Claude (`sample`, the viewer's own account) |
| `test/` | `game.test.js`, `ai.test.js`, and `story.test.js` (checks every story folder, including that each tutorial example gives the outcome it claims) |

## Adding a story
Create `stories/<id>/story.json` (copy `frog`) and any SVG assets in `stories/<id>/assets/`. Then run `npm test`: the story test checks that every rule, outcome, actor, spot, pose and fx reference exists.

The scene is a fixed 1000×600 world scaled to the screen. `scene.actors` are placed by top-left corner; `scene.spots` name the places an actor can move to (`{x, y, opacity?}`).

## Beats (what happens in an outcome)
- `{"move": {"actor", "to", "dur", "arc"}}`: slide to a spot, optionally up in an arc.
- `{"pose": {"actor", "name"}}`: play a named pose from `poses` (tweens on the body or a part, e.g. `kid:armR`).
- `{"fx": "boom", "at": "frog"}`: emoji burst from an actor.
- `{"sound": "good|bad|pop|win"}`: sound effect.
- `{"wait": 300}`.
An array inside the list runs its items in parallel.

## Rules
- Pick up the ball before throwing it; eating it is allowed but the frog stays.
- Win: throw, basket, bounce and frog in the same sentence (with the ball in hand).
- Stars: 3 on the first photo, 2 on the second, 1 after that; max 2 stars without the word "through".
- After two photos with mistakes, a hint shows a correct version of the sentence.
- Age sets the level: 4–5 basic, 6–8 standard, 9–12 advanced. Set it in Help. Photos are blocked until the age is set.
- Unplanned sentences go to Claude, which can pick a kid pose and say one friendly line. It cannot move the ball or the frog, and it cannot win.

## Tutorial and debug
- The tutorial runs by itself the first time (auto mode, one line at a time; tap the speech bubble to go faster). It plays the three examples through the same rules, without a photo. Replay it from **?**.
- Debug: tap the top-left corner of the story screen 10 times within 4 seconds. A dialog lets you type the sentence (skips the photo and Claude's correction).

## Data kept on the device
Browser storage only (`word-quest:v1`): language, age, tutorial done, stars per story, and a log of the last 200 sentences with their outcomes. The web version's API key is kept separately (`word-quest:apikey`) and is sent only to Anthropic.

## Shared modules used
- `shared/audio.js`: sound effects
- `shared/pwa.js`: service worker registration (web)
- `shared/claude-link.js`: "Open in Claude" button

## Checks
`npm test` covers the rules, the Claude reply parsing, and every story folder. The look and the animation are checked by hand on a phone.
