---
id: "009"
title: Archetypes spell-tiles and spell-fill-letters
model: Sonnet 5.5
why_model: Spelling is the core skill; needs careful handling of Spanish characters.
status: done
claimed: 2026-11-07
depends_on: ["001"]
touches: [spanish-arcade/archetypes/spell-tiles/**, archetypes/spell-fill-letters/**, ui/tiles.js, test/spell.test.js]
---
## Prompt
`spell-tiles`: prompt by picture and/or audio; build the word from draggable/tappable letter tiles (extra decoy letters by difficulty, first-letter hint). `spell-fill-letters`: word with blanks for a focus (`ñ`, `rr`/`r`, `s`/`x`, accents, `h`, `¿¡`) with a choice of letters at low difficulty and free typing at high difficulty with an on-screen special-letters row (ñ, á, é, í, ó, ú, ü, ¿, ¡). Normalisation rules in pure `logic.js` (case, ñ ≠ n, `accents: "strict"|"lenient"` param, default strict). After a reveal the child copies the word. Every drag has a tap-tap alternative; free typing uses the special-letters row with `inputmode="none"`. Feedback explains the rule in one friendly sentence (e.g. "rr between vowels").

## Acceptance
- Tests for judging with and without accents; ñ vs n; decoy generation never makes a second valid word. Works with touch and physical keyboard. README with params + examples.

## Notes
Declare `accents` in the archetype's `paramsSchema`.

Ruling: `core/spelling.js` (`key`, `sameWord`) added outside `touches`, shared by both archetypes and reused by 008 — cost if wrong: move the file.
Ruling: hint level 1 is only a nudge (never reveals letters); strict accents when the focus is accent or ü — cost if wrong: a param.
Ruling: words an archetype cannot use (spaces, no emoji) are dropped silently and documented; the validator's rounds check catches units that lose too many — cost if wrong: none.
Reviewed by Opus, then three scoped Sonnet re-reviews: clean. Drag was only checked with emulated pointer events; keyboard and touch paths were run in headless Chromium.
