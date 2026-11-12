---
id: "029"
title: Archetype letter-lock (Wordle-like)
model: Sonnet 5.5
why_model: New archetype with a small self-contained rules engine.
status: done
depends_on: []
touches: [spanish-arcade/archetypes/letter-lock/**, spanish-arcade/test/letter-lock.test.js]
---
## Prompt
Build `letter-lock` as specified in `docs/research/GAMES.md` §4.3: a picture clue, up to six tries, each letter marked right / in the word / not in it / missing tilde; guesses need not be real words; only the final result counts toward stars and hints. Provide a physical on-screen keyboard with ñ and accented letters. Write the feedback-marking function as pure logic with tests (repeated letters, accents, ñ). Do NOT edit `docs/ARCHETYPES.md`.

Context: the research behind this round is in `spanish-arcade/docs/research/` (GAMES, ENGAGEMENT, UI-ADVICE, VISUALS, QUESTIONS). Everything is public: no personal data.

## Acceptance
- Marking logic tested incl. repeated letters and accents; playable on a phone viewport; no fail state that blocks the round (after six tries the word is shown and the round continues).

## Notes
- Built `archetypes/letter-lock/` (index.js, logic.js, README.md) and `test/letter-lock.test.js`. Checks: `npm test` 344 pass, `npm run build` ok; lab page at 390x844 light and dark, no page errors; headless run: 5 wrong tries at d3 gives hint grid with 2 tries and first letter locked, 2 more wrong shows the word, typing it solves.
- Ruling: own keyboard rows instead of `specialLettersRow` (that helper adds ¿ ¡ and cannot colour keys); keys are 48px high but narrower than 48px wide on a phone (10 per row). Pre-filled hint letters are locked, so the child types only the free cells.
- Not done: no demo exercise in a unit (content task), `docs/ARCHETYPES.md` not ticked (told not to), audio-only clue not checked with a real voice.
