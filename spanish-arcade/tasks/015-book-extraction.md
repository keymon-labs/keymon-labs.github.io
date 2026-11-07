---
id: "015"
title: Book extraction (private kit to public-safe digest)
model: Sonnet 5.5 (Haiku drafts per-session extracts; Sonnet checks)
why_model: Batch reading and structuring; a reviewer checks the notes stay in our own words.
kind: content
status: in-progress
claimed: 2026-11-07
depends_on: ["000"]
touches: [spanish-arcade/docs/BOOK-NOTES.md, spanish-arcade/docs/UNITS.md, spanish-arcade/docs/ARCHETYPES.md, spanish-arcade/docs/book/**]
---
## Prompt
Turn the owner's **private book material** into structured notes for building the app. The book and its text are NOT in this repo and must never be committed or linked from it. They live in the owner's **private assets repo** (private, under the owner's GitHub; the owner attaches it to the session like this one, read access is enough; if it isn't attached, ask the owner). Folder `book/` holds the page text (`book-text.md`), an index (`INDEX.md`), page images (`pages-100dpi/`, `hires/` for the cast and comics) and the PDF. Start with `INDEX.md` and `book-text.md`; look at page images for spot checks, the cast and the comics.

Work one unit at a time (U1: PDF pages 10–41, U2: 42–73, U3: 74–105), one subagent per unit, in parallel (Haiku drafts, Sonnet checks; per `AGENTS.md`). For each paper session (1, 3, 5, 7) produce:
1. **Story/comic summary in our own words** (plot beats, who appears, which vocabulary it uses), enough to build matching story-based exercises and unit intros with the cast (cast notes are in BOOK-NOTES.md).
2. **Exercise inventory**: each exercise's *kind* (not its content) mapped to an archetype id from `docs/ARCHETYPES.md`, with notes on what skill it trains; list kinds with no archetype yet and propose new archetype ideas.
3. **Language inventory**: topic words (counts and categories, a few example words only), grammar points, spelling rules, functional phrases (short phrases of a few words are fine; no sentences copied from dialogues).
4. **Culture and game ideas** that could become units or bonus games.
Then merge the results into `docs/BOOK-NOTES.md`, `docs/UNITS.md` (refine each unit's sketch to follow the book's story order) and `docs/ARCHETYPES.md` (new ideas). Put per-unit working notes in `docs/book/uN.md` **only** if they stay paraphrased.

## Acceptance
- Every session of U1–U3 has the four parts above, from the kit (spot-check three sessions against the page images).
- Original wording only: no stories, comic text, dialogues, songs, riddles, full exercise contents or full vocabulary lists; no links to private places; no images. A reviewer (Sonnet or above) greps the diff for long verbatim Spanish runs and confirms.
- UNITS.md sketches reference the book's story order; ARCHETYPES.md lists any new archetype ideas with a status.

## Notes
Ends in `review`: the owner confirms the digest is faithful to the book's topics and levels while staying in our own words.

Ruling: MVP scope is Unit 1 only (PDF pages 10–41); U2 and U3 stay for a later run — the MVP plays one unit (a1-u1-s1) — cost if wrong: one more extraction run later.
