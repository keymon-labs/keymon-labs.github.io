# match-pairs

Join the left items to the right items: tap one on the left, then its partner on the right. Skill: puzzle.

**Board, composite answer.** One round is one whole board. `mount` collects the pairing and submits once when every item is joined: `[[leftId, rightId], ...]`. `judge` is correct only if all pairs are right. Tap a joined item again to unjoin it. Joined pairs share a colour and a letter. Tap-tap is the only interaction (no drag), items are at least 56px tall.

| param | type | default | meaning |
|---|---|---|---|
| `from` | selector, optional | - | words to build boards from (`n` words) |
| `pairs` | list, optional | - | authored board: `{ a, b }` (left text, right text); one round with all pairs; wins over `from` |
| `mode` | `word-picture` \| `article-noun` | `word-picture` | with `from`: word <-> emoji, or noun <-> el/la/los/las |
| `size` | int 2-6 | difficulty + 2 (max 6) | pairs per board with `from` (a lone leftover joins the last board) |

Silently skipped: words without an emoji (`word-picture`), non-nouns or nouns without an article (`article-noun`), blank or repeated texts (compared trimmed and ignoring case), and boards that would hold fewer than 2 pairs. No `pictures` flag, so a unit may use it on words without emoji, which are then dropped. In `article-noun` several nouns share an article; matching any of the equal-text articles counts as right. Question-answer matching: use `pairs`.

Boards have 2 to 6 pairs: `size` is capped at 6, boards are dealt evenly (7 words with `size` 6 make 4 + 3, never 6 + 1), and authored `pairs` above 6 is an error. In `article-noun` a board needs at least 2 different articles (boards of only `el` nouns are skipped, the same article is spread over boards). Words that take `el` although feminine (`elException`, agua) pair with `el`.

Hints: level 1 only says how many pairs were wrong; `mount` then unjoins the whole board (a nudge, nothing revealed). Level 2 keeps the right pairs and locks one correct pair (lock icon and solid border). On every further retry another correct pair is locked.

## Unit example
Rounds: `from` gives one board per `size` words, and the unit check wants at least 3 rounds, so use `n` >= 3 x `size`.
```json
{ "id": "match-house", "archetype": "match-pairs", "difficulty": 1,
  "params": { "from": { "tag": "house", "n": 9 }, "size": 3 },
  "prompt": { "es": "Une cada palabra con su dibujo.", "en": "Join each word to its picture." } }
```
Article and noun (nine nouns incl. agua, `"article": "el", "elException": true`, so there are `el` and `la` words to spread over three boards):
```json
{ "id": "match-articles", "archetype": "match-pairs", "difficulty": 1,
  "params": { "from": { "tag": "house", "n": 9 }, "size": 3, "mode": "article-noun" },
  "prompt": { "es": "Une cada nombre con su artículo.", "en": "Join each noun to its article." } }
```
Authored board (one round, 2 to 6 pairs):
```json
{ "id": "match-questions", "archetype": "match-pairs", "difficulty": 1,
  "params": { "pairs": [ { "a": "¿Cómo te llamas?", "b": "Me llamo Pipo" }, { "a": "¿Qué tal?", "b": "Muy bien" } ] },
  "prompt": { "es": "Une cada pregunta con su respuesta.", "en": "Join each question to its answer." } }
```

Words an article-noun board has to drop (a board without two different articles) are not reported by `check:units`; add a few nouns of each article if a unit loses rounds.
