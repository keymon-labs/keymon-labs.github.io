---
id: "029"
title: Archetype letter-lock (Wordle-like)
model: Sonnet 5.5
why_model: New archetype with a small self-contained rules engine.
status: todo
depends_on: []
touches: [spanish-arcade/archetypes/letter-lock/**, spanish-arcade/test/letter-lock.test.js]
---
## Prompt
Build `letter-lock` as specified in `docs/research/GAMES.md` §4.3: a picture clue, up to six tries, each letter marked right / in the word / not in it / missing tilde; guesses need not be real words; only the final result counts toward stars and hints. Provide a physical on-screen keyboard with ñ and accented letters. Write the feedback-marking function as pure logic with tests (repeated letters, accents, ñ). Do NOT edit `docs/ARCHETYPES.md`.

Context: the research behind this round is in `spanish-arcade/docs/research/` (GAMES, ENGAGEMENT, UI-ADVICE, VISUALS, QUESTIONS). Everything is public: no personal data.

## Acceptance
- Marking logic tested incl. repeated letters and accents; playable on a phone viewport; no fail state that blocks the round (after six tries the word is shown and the round continues).

## Notes
