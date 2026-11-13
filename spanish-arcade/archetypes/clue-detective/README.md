# clue-detective

Who is it? 4-6 suspect cards and clue notes in Spanish. The child crosses out the cards a clue rules out (free, never judged; tap again to restore), then presses "Es este" on the last one standing. Skill: reading. One round = one case = one judged answer.

| param | type | default | meaning |
|---|---|---|---|
| `cases` | list, min 1 | required | `{ suspects, clues, answer, rules? }` (below) |
| `reveal` | `one` \| `all` | `one`; `all` at difficulty 1 | `one`: the first clue shows, "Otra pista" brings the next |
| `crossOut` | bool | `true` | cards can be crossed out; `false` hides that interaction (read and pick) |
| `n` | int ≥ 1, optional | all cases | cases to play, in order |

A case: `suspects` 4-6 of `{ name, emoji?, place? }` (names differ); `clues` 1-5 Spanish sentences; `answer` the index of the culprit in `suspects`; `rules` (optional) one list per clue with the suspect indexes that clue rules out (never the answer). **Every clue must be true of the answer**: the validator cannot check it, the author does. Suspect order is shuffled per seed; clue order is kept. Invented names only.

Hints: level 1 uses `rules` when given (the first clue that rules someone out is shown and those cards are crossed out); without `rules` it crosses out the wrong pick and shows one more clue. Level 2 marks the answer with a double outline and a check, and crosses out the rest. Nothing is revealed before a miss. After a correct pick "CASO CERRADO" shows and the name is spoken (only if `ctx.canSpeak`).

Audio: each clue is a button (🔊) when a Spanish voice exists; otherwise it is plain text. Tap targets are at least 44px; three cards per row, so 6 suspects fit in two rows. `example.json` is the params the layout audit plays (no unit uses this archetype yet).

Difficulty guide (authoring): 1 = one feature per clue, positive sentences, all shown. 2 = clues one by one, negation (*no lleva gafas*). 3 = relative clauses, comparisons, ser/estar contrasts.

## Unit example
```json
{ "id": "case-kitchen", "archetype": "clue-detective", "difficulty": 2,
  "params": { "cases": [ {
    "suspects": [ { "name": "Nico", "emoji": "🧑‍🍳", "place": "cocina" }, { "name": "Rita", "emoji": "👩‍🔬", "place": "jardín" },
                  { "name": "Teo", "emoji": "🧑‍🎨", "place": "cocina" }, { "name": "Lola", "emoji": "👩‍🚀", "place": "salón" } ],
    "clues": ["No está en el jardín.", "Lleva un gorro blanco.", "Está en la cocina, pero no pinta cuadros."],
    "answer": 0, "rules": [[1], [2, 3], [2]] } ] },
  "prompt": { "es": "¿Quién es?", "en": "Who is it?" } }
```
