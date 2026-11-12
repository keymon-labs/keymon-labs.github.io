---
id: "028"
title: Archetype fix-the-mistake and shared spelling traps
model: Sonnet 5.5
why_model: New archetype plus a small refactor of existing spelling code; tests guard it.
status: done
depends_on: []
touches: [spanish-arcade/archetypes/fix-the-mistake/**, spanish-arcade/core/spelling.js, spanish-arcade/archetypes/spell-fill-letters/logic.js, spanish-arcade/test/**]
---
## Prompt
Build `fix-the-mistake` as specified in `docs/research/GAMES.md` §4.2. The mascot shows one sentence with one mistake; the child taps the wrong word, then fixes it; the corrected text is always shown last. Move the spelling-trap table from `spell-fill-letters` into `core/spelling.js` in the same task, keeping all existing spelling tests green. Use the app's own mascot (QUESTIONS.md). Do NOT edit `docs/ARCHETYPES.md`.

Context: the research behind this round is in `spanish-arcade/docs/research/` (GAMES, ENGAGEMENT, UI-ADVICE, VISUALS, QUESTIONS). Everything is public: no personal data.

## Acceptance
- Existing tests unchanged and green; new tests for generation and scoring; README params table; one error per item; no error-spotting at difficulty 1.

## Notes
Done. Traps moved to `core/spelling.js` (`FOCI`, `RULES`, `pickFocus`, `misspellings`, `misspell`); `spell-fill-letters/logic.js` imports them and re-exports `FOCUS_CHOICES` (its `index.js` is untouched).
- Ruling: authored items are flat `{ text, at, as, perfect?, en? }` (the schema has no nested object type), not `wrong: { at, as }`.
- Ruling: "no error-spotting at difficulty 1" = new param `spot` (false at 1): the wrong word is pre-selected and the child only fixes it; `allowPerfect` is ignored then. Also added `options` (2 at d1, else 3).
- Ruling: choice options = right form + other plausible slips (never a taught word); the shown slip only as a last resort. Fix field uses a normal text input (soft keyboard) plus the special-letters row.
- Checks: `npm test` 348 pass, `npm run build` ok, lab page at 390x844 light and dark driven through the real session (list d1/d3, sentence d2): no page errors, no horizontal scroll. Not checked: wrong-answer hint screens visually, real unit exercise (none added; content task), mascot art (emoji fox; `ctx.mascot` is called).
