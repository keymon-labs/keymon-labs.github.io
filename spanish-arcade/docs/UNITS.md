# Unit ideas

One game unit per paper session of the book, 5–6 exercises each (see [BOOK-NOTES.md](BOOK-NOTES.md) for topics, [ARCHETYPES.md](ARCHETYPES.md) for the games). Unit ids are `a1-u<unit>-s<session>`; exercise ids inside a unit are stable and never reused. Status: `idea` → `task-NNN` → `done`. Units are data only (`units/<id>.json`, contract in [PLAN.md §4.2](PLAN.md)); new words go into `data/vocab/<unitId>.json` first. Authoring rules: [AUTHORING.md](AUTHORING.md).

| id | Title idea (es / en) | Focus | Exercise sketch (archetype × params) | Status |
|---|---|---|---|---|
| `a1-u1-s1` | Me llamo… / My name is… | numbers 0–10, colours, family, *me llamo / tengo … años* | 1 `listen-pick-word` numbers · 2 `odd-one-out` family vs school · 3 `match-pairs` family ↔ emoji · 4 `fill-gap-choice` *me llamo / tengo* · 5 `spell-tiles` colours · 6 `read-answer` tiny intro text (V/F) | task-011 |
| `a1-u1-s3` | Los días y la ñ / Days and ñ | days of the week, un/una/unos/unas, alphabet, ñ | 1 `listen-pick-word` days · 2 `order-words` weekday sentence · 3 `fill-gap-choice` un/una/unos/unas · 4 `spell-fill-letters` ñ · 5 `match-pairs` day ↔ activity · 6 `read-answer` | task-011 |
| `a1-u1-s5` | Mi familia / My family | ser/estar/tener, ¿? ¡! | `verb-conjugator`, `punctuation-pick`, `read-answer`, `spot-the-words`, `word-search` family | idea |
| `a1-u1-s7` | Mi pasaporte / My passport | personal data, countries, describing a person | `dialogue-complete`, `match-pairs` country ↔ flag (our own art), `who-is-who`, `fill-gap-choice` | idea |
| `a1-u2-s1` | En el cole / At school | school objects, el/la/los/las, *me gusta* | `listen-pick-word`, `sort-into-bins` el/la, `match-pairs`, `fill-gap-choice` me gusta + mucho/poco, `memory-flip` | idea |
| `a1-u2-s3` | ¿Qué hora es? / What time is it? | clock times, encima/debajo/delante/detrás, del/de la, r vs rr | `clock-reader`, `place-the-object`, `fill-gap-choice` del/de la, `spell-fill-letters` r/rr | idea |
| `a1-u2-s5` | Palabras mágicas / Magic words | present of -ar/-er/-ir verbs, classroom phrases | `verb-conjugator`, `order-words`, `dialogue-complete`, `read-answer`, `code-breaker` | idea |
| `a1-u2-s7` | ¡Me voy a clase! / Off to class | politeness phrases, positions, timetable | `dialogue-complete`, `place-the-object`, `read-answer` timetable, `spell-fill-letters` r/rr, `bingo` | idea |
| `a1-u3-s1` | Los sentidos y el cuerpo / Senses and body | senses, body parts, feelings, describing hair/eyes | `listen-pick-word`, `match-pairs` body labels, `fill-gap-choice` estoy + feeling, `odd-one-out`, `who-is-who` | idea |
| `a1-u3-s3` | ¡Me duele! / It hurts! | advice phrases, reflexive verbs, s vs x | `fill-gap-choice` advice, `verb-conjugator` reflexives, `spell-fill-letters` s/x, `syllable-order`, `crossword-lite` | idea |
| `a1-u3-s5` | Ayer en el parque / In the park | sequence words, routines, *veo veo* | `order-words` primero/luego/después/por último, `verb-conjugator`, `veo-veo`, `true-false-listen`, `read-answer` | idea |
| `a1-u3-s7` | ¡Me siento súper! / I feel super | emotions, describing a character, body review | `match-pairs` emotion ↔ colour, `colour-by-code`, `fill-gap-choice`, `spell-fill-letters`, `bingo` body parts | idea |

First two units to build: **`a1-u1-s1`** and **`a1-u1-s3`** (task 011). Next candidates for Haiku-sized data tasks: u1-s5, u1-s7, then Unit 2 and Unit 3 in order.

## Ideas for a later layer
- "Tricky words" revision unit generated from the per-word stats in the store (data already collected, PLAN §4.4); a weekly challenge unit.
- Unit-level difficulty ladder: the same archetypes with `difficulty` 2–3 in later units.
- Seasonal extras (our own, e.g. Christmas words) once the core works.
