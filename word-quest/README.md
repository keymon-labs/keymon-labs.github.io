# Word Quest

A story game for writing practice. The child writes one sentence on paper and takes a photo. Claude reads the photo, points out the mistakes at the chosen level, and the child fixes them on paper and takes another photo. Once the sentence is clean, the story plays out. Planned sentences follow fixed rules; unplanned ones are improvised by Claude within limits.

**Versions:** v1 (latest). Tutorial story: *Smash the Frog* (English and Spanish).

## Files
| File | What |
|---|---|
| `index.html` | Markup only (home, play, log, settings) |
| `style.css` | Tokens, light/dark, the emoji scene and its animations |
| `app.js` | Play loop: photo → Claude correction → rules or improvisation → scene, sound, speech, log |
| `game.js` | Pure rules: normalise sentences, match planned outcomes, scene state, stars. Tested |
| `ai.js` | Claude prompts, reply parsing, API call (web). Tested |
| `stories.json` | Stories: word groups per language, ordered rules, outcomes (effects + text) |
| `strings.json` | UI text in English and Spanish |
| `web.js` / `claude.js` | Entries: web (own API key) / inside Claude (`sample`, the viewer's account) |
| `test/*.test.js` | Unit tests for `game.js` and `ai.js` |

## Adding a story
Add an entry to `stories.json`: `title`, `mission`, `intro`, `target` words, `groups` per language (word lists, accents not required), `rules` (checked in order; first match wins; `held` tests whether the ball is in hand), and `outcomes` (`effects` with `ballHeld`, `ballAt`, `ballGone`, `frog`, `kid`; `sound`; `text` per language; `win: true` ends the story).

## Rules
- Pick up the ball before throwing it; eating it is allowed but the frog stays.
- Win: throw, basket, bounce and frog in the same sentence (with the ball in hand).
- Stars: 3 on the first photo, 2 on the second, 1 after that; max 2 stars without the word "through".
- After two photos with mistakes, a hint shows a correct version of the sentence.
- Age sets the level: 4–5 basic, 6–8 standard, 9–12 advanced. It changes how strict the corrections are.

## Data kept on the device
Browser storage only (`word-quest:v1`): language, age, stars per story, and a log of the last 200 sentences with outcomes (kept for review). The web version's API key is kept separately (`word-quest:apikey`) and is sent only to Anthropic. Nothing is uploaded by the app itself.

## Shared modules used
- `shared/audio.js`: sound effects
- `shared/pwa.js`: service worker registration (web)
- `shared/claude-link.js`: "Open in Claude" button

## Checks
`npm test` runs the rule and parser tests. The play-through of the tutorial is manual: sentences that should behave as described in `stories.json`.
