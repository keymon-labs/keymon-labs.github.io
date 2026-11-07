# match-pairs

Join the left items to the right items: tap one on the left, then its partner on the right. Skill: puzzle.

**Board, composite answer.** One round is one whole board. `mount` collects the pairing and submits once when every item is joined: `[[leftId, rightId], ...]`. `judge` is correct only if all pairs are right. Tap a joined item again to unjoin it. Joined pairs share a colour and a letter. Tap-tap is the only interaction (no drag), items are at least 56px tall.

| param | type | default | meaning |
|---|---|---|---|
| `from` | selector, optional | - | words to build boards from (`n` words) |
| `pairs` | list, optional | - | authored board: `{ a, b }` (left text, right text); one round with all pairs; wins over `from` |
| `mode` | `word-picture` \| `article-noun` | `word-picture` | with `from`: word <-> emoji, or noun <-> el/la/los/las |
| `size` | int 2-6 | difficulty + 2 (max 6) | pairs per board with `from` (a lone leftover joins the last board) |

Silently skipped: words without an emoji (`word-picture`), non-nouns or nouns without an article (`article-noun`), blank or repeated texts, and boards that would hold fewer than 2 pairs. No `pictures` flag, so a unit may use it on words without emoji, which are then dropped. In `article-noun` several nouns share an article; matching any of the equal-text articles counts as right. Question-answer matching: use `pairs`.

Hints: level 1 returns the wrongly joined left ids; `mount` already keeps the right pairs and unjoins those (a nudge, no answer). Level 2 also locks one correct pair in place.

## Unit example
```json
{ "id": "match-animals", "archetype": "match-pairs", "difficulty": 1,
  "params": { "from": { "tag": "animals", "n": 6 }, "size": 3 },
  "prompt": { "es": "Une cada palabra con su dibujo.", "en": "Join each word to its picture." } }
```
Authored: `"params": { "pairs": [ { "a": "¿Cómo te llamas?", "b": "Me llamo Pipo" }, { "a": "¿Qué tal?", "b": "Muy bien" } ] }`. Article: `"params": { "from": { "tag": "home", "n": 4 }, "mode": "article-noun" }`.
