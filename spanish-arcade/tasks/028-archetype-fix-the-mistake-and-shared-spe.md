---
id: "028"
title: Archetype fix-the-mistake and shared spelling traps
model: Sonnet 5.5
why_model: New archetype plus a small refactor of existing spelling code; tests guard it.
status: todo
depends_on: []
touches: [spanish-arcade/archetypes/fix-the-mistake/**, spanish-arcade/core/spelling.js, spanish-arcade/archetypes/spell-fill-letters/logic.js, spanish-arcade/test/**]
---
## Prompt
Build `fix-the-mistake` as specified in `docs/research/GAMES.md` §4.2. The mascot shows one sentence with one mistake; the child taps the wrong word, then fixes it; the corrected text is always shown last. Move the spelling-trap table from `spell-fill-letters` into `core/spelling.js` in the same task, keeping all existing spelling tests green. Use the app's own mascot (QUESTIONS.md). Do NOT edit `docs/ARCHETYPES.md`.

Context: the research behind this round is in `spanish-arcade/docs/research/` (GAMES, ENGAGEMENT, UI-ADVICE, VISUALS, QUESTIONS). Everything is public: no personal data.

## Acceptance
- Existing tests unchanged and green; new tests for generation and scoring; README params table; one error per item; no error-spotting at difficulty 1.

## Notes
