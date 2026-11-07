---
id: "010"
title: Archetypes odd-one-out, match-pairs, order-words, word-search
model: Sonnet 5.5
why_model: Four small, independent games; a single chat can do them one after another.
status: done
claimed: 2026-11-07
depends_on: ["001"]
touches: [spanish-arcade/archetypes/{odd-one-out,match-pairs,order-words,word-search}/**, test/puzzles.test.js]
---
## Prompt
Implement the four puzzle archetypes from `docs/ARCHETYPES.md`: `odd-one-out` (clouds of words; tap the intruder), `match-pairs` (tap-to-join or drag; word ↔ emoji, article ↔ noun, question ↔ answer), `order-words` (tiles into a sentence, punctuation tiles included), `word-search` (seeded grid generation, no word overlaps that break spelling, tap-drag selection, words list with ticks). Each: pure `make`/`judge` + tests, README with params and example, touch-friendly.

## Acceptance
- Word-search always contains every word exactly once and is deterministic per seed. order-words accepts alternative valid orders when `alts` given.
- Each archetype passes through the session engine from task 001 in headless Chromium.

## Notes
If it grows too big, split into two chats: (odd-one-out, match-pairs) and (order-words, word-search).

Ruling: MVP scope is `odd-one-out` and `match-pairs` only; `order-words` and `word-search` stay for a later run — the MVP unit uses only the first two — cost if wrong: a follow-up task, which remains in the idea list.

Ruling: MVP ships odd-one-out and match-pairs only; order-words and word-search stay `idea` (task stays open for them via ARCHETYPES.md) — cost if wrong: one more task later.
Ruling: match-pairs is one composite board per round (one submit when fully joined); miss 1 unjoins everything and shows only a wrong-count, miss 2 keeps the right pairs and locks one; boards hold at most 6 pairs — cost if wrong: a UI change.
Ruling: authored match `pairs` and odd-one-out `groups` are plain text, not checked by the vocab validator — cost if wrong: a validator rule later.
Known minors accepted: the vocab-mode theme nudge shows the raw English tag; dropped article-noun words are not reported (documented); from miss 3 on, a board shows which pairs are right.
Reviewed by Opus, fix round re-reviewed by Sonnet: clean.
