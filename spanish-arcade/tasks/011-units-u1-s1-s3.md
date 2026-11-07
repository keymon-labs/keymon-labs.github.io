---
id: "011"
title: Units a1-u1-s1 and a1-u1-s3 plus vocabulary
model: Sonnet 5.5 (Haiku can draft the word lists and sentences)
why_model: Data writing with metadata; needs a reviewer for Spanish correctness and for not copying the book.
kind: content
status: in-progress   # ends in `review`: only the owner sets `done` after a Spanish check
claimed: 2026-11-07
depends_on: ["001", "006", "007", "008", "009", "010", "014", "015"]
touches: [spanish-arcade/units/**, data/vocab/<unitId>.json, test/units.test.js]
---
## Prompt
Write the first two units as data per `docs/PLAN.md` §4.2 and the sketches in `docs/UNITS.md`: `a1-u1-s1` (numbers 0–10, colours, family, *me llamo / tengo … años*) and `a1-u1-s3` (days, un/una/unos/unas, alphabet, ñ). 5–6 exercises each, at least three archetypes, one listening and one spelling exercise, non-decreasing difficulty. Create `data/vocab/<unitId>.json` with every word used, full metadata (tags, gender, article, spell focus, emoji, unit). Original sentences and texts only; topics from `docs/BOOK-NOTES.md`. Add own simple jokes for the result screens if task 012 hasn't. Add a unit test that loads every unit and checks it validates and generates.

## Acceptance
- Both units playable end to end. Every word has correct Spanish (accents, ñ, ¿¡, gender/article) and an English gloss.
- `npm run check:units` passes (article matches gender, emoji present, ≥3 archetypes, one listening and one spelling exercise, difficulty non-decreasing, stable exercise ids).
- Set `status: review` and flag it to the user: a Spanish speaker must check the text before `done`.
- Adding a third unit needs only new JSON files (unit + vocab).

## Notes
Use only archetypes that are done; list the ones skipped in `docs/UNITS.md`. Sentences and word lists are our own, not the book's.

Ruling: MVP scope is `a1-u1-s1` only; `a1-u1-s3` stays for a later run — cost if wrong: one more content run.
