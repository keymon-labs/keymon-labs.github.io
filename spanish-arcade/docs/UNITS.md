# Unit ideas

One game unit per paper session of the book, 5–6 exercises each (see [BOOK-NOTES.md](BOOK-NOTES.md) for topics, [ARCHETYPES.md](ARCHETYPES.md) for the games). Unit ids are `a1-u<unit>-s<session>`; exercise ids inside a unit are stable and never reused. Status: `idea` → `task-NNN` → `done`. Units are data only (`units/<id>.json`, contract in [PLAN.md §4.2](PLAN.md)); new words go into `data/vocab/<unitId>.json` first. Authoring rules: [AUTHORING.md](AUTHORING.md).

| id | Title idea (es / en) | Focus | Exercise sketch (archetype × params) | Status |
|---|---|---|---|---|
| `a1-u1-s1` | Me llamo… / My name is… | numbers 0–20 (words), colours, family, school, *me llamo / tengo … años*; written Spanish for native speakers | 1 `listen-pick-word` numbers, written options · 2 `spell-tiles` long words, no hint letters · 3 `fill-gap-choice` agreement and verb forms · 4 `spell-fill-letters` rr/h/tilde/ñ, tap · 5 `spell-fill-letters` same traps, typing · 6 `read-answer` 5 sentences, text hidden, one inference question (difficulty 1,1,2,2,2,2) | task-019 |
| `a1-u1-s3` | Los días y la ñ / Days and ñ | days of the week, un/una/unos/unas, alphabet, ñ | 1 `listen-pick-word` days · 2 `spell-tiles` unscramble the days · 3 `fill-gap-choice` un/una/unos/unas · 4 `spell-fill-letters` ñ · 5 `match-pairs` day ↔ activity · 6 `read-answer` | task-033 |
| `a1-u1-s5` | Mi familia / My family | ser/estar/tener, ¿? ¡!, family, flags (the book puts the flags page here) | `read-answer` short family text, `punctuation-pick`, `verb-conjugator`, `fill-gap-choice` with audio, `spell-fill-letters` missing vowels (spelling item we add), `spot-the-words`; bonus `word-search` family, `memory-flip` flags | task-033 |
| `a1-u1-s7` | Mi pasaporte / My passport | personal data, languages, describing a person from clues | `read-answer` passport, `form-card` (new), `who-is-who` clue version, `punctuation-pick`, `listen-pick-word`; closing `bingo` family | task-033 |
| `a1-u1-recap` | Repaso / Unit 1 check | articles, ¿ ¡, colours, ñ, family and numbers, coded phrase | `fill-gap-choice`, `punctuation-pick`, `spell-tiles`, `spell-fill-letters` ñ, `type-the-answer` (new), `code-breaker`, plus one `listen-pick-word` | idea |
| `a1-u2-s1` | En el cole / At school | school objects, el/la/los/las, *me gusta* | `listen-pick-word`, `sort-into-bins` el/la, `match-pairs`, `fill-gap-choice` me gusta + mucho/poco, `memory-flip` | idea |
| `a1-u2-s3` | ¿Qué hora es? / What time is it? | clock times, encima/debajo/delante/detrás, del/de la, r vs rr | `clock-reader`, `place-the-object`, `fill-gap-choice` del/de la, `spell-fill-letters` r/rr | idea |
| `a1-u2-s5` | Palabras mágicas / Magic words | present of -ar/-er/-ir verbs, classroom phrases | `verb-conjugator`, `order-words`, `dialogue-complete`, `read-answer`, `code-breaker` | idea |
| `a1-u2-s7` | ¡Me voy a clase! / Off to class | politeness phrases, positions, timetable | `dialogue-complete`, `place-the-object`, `read-answer` timetable, `spell-fill-letters` r/rr, `bingo` | idea |
| `a1-u3-s1` | Los sentidos y el cuerpo / Senses and body | senses, body parts, feelings, describing hair/eyes | `listen-pick-word`, `match-pairs` body labels, `fill-gap-choice` estoy + feeling, `odd-one-out`, `who-is-who` | idea |
| `a1-u3-s3` | ¡Me duele! / It hurts! | advice phrases, reflexive verbs, s vs x | `fill-gap-choice` advice, `verb-conjugator` reflexives, `spell-fill-letters` s/x, `syllable-order`, `crossword-lite` | idea |
| `a1-u3-s5` | Ayer en el parque / In the park | sequence words, routines, *veo veo* | `order-words` primero/luego/después/por último, `verb-conjugator`, `veo-veo`, `true-false-listen`, `read-answer` | idea |
| `a1-u3-s7` | ¡Me siento súper! / I feel super | emotions, describing a character, body review | `match-pairs` emotion ↔ colour, `colour-by-code`, `fill-gap-choice`, `spell-fill-letters`, `bingo` body parts | idea |

Unit 1 follows the book's order: greet and meet (S1), a comic about a party and days (S3, the story hook), family and the three verbs (S5), a passport and clue-based description (S7), then a recap. Difficulty rises from listen-and-match in S1 to clue reading and free writing in S7. S3's comic can feed a `read-answer` set; a scrambled-days `spell-tiles` item would match the book's rhythm better than `order-words`. Details: [book/u1.md](courses/a1s1/u1.md).

First two units to build: **`a1-u1-s1`** and **`a1-u1-s3`** (task 011). Next candidates for Haiku-sized data tasks: u1-s5, u1-s7, then Unit 2 and Unit 3 in order.

## Ideas for a later layer
- "Enough for today" screen and daily limits (soft stop after about 24 rounds or 15 minutes, optional parent limit): parked by the owner, spec in [research/ENGAGEMENT.md §3.5](research/ENGAGEMENT.md). Not for now.
- "Tricky words" revision unit generated from the per-word stats in the store (data already collected, PLAN §4.4); a weekly challenge unit.
- Unit-level difficulty ladder: the same archetypes with `difficulty` 2–3 in later units.
- Seasonal extras (our own, e.g. Christmas words) once the core works.
