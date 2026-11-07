# odd-one-out

A cloud of words from one category plus one intruder; tap the intruder. Skill: puzzle. One round = one tap = one submit.

| param | type | default | meaning |
|---|---|---|---|
| `from` | selector, optional | - | vocab mode: each of the `n` words is an intruder among words of a topic (tag) it does not share |
| `groups` | list, optional | - | authored mode: `{ words: [es...], odd: es, theme?: es }`; wins over `from` |
| `size` | int 3-6 | difficulty + 2 (max 6) | words in the cloud, intruder included |

Give `from` or `groups`. Silently skipped (no round): a vocab target with no other topic holding `size - 1` distinct words; a group with fewer than 2 distinct members or an intruder that repeats a member. Groups use plain text (not vocab ids), so they add no `wordIds` to the report; vocab mode does. Words with an emoji show it next to the word. No `pictures` flag: emoji are decoration here.

Hints: level 1 greys out one wrong word when 4 or more are shown, otherwise shows the group's `theme` (if any); it never reveals the answer. Level 2 highlights the intruder.

If the device has a Spanish voice (`ctx.canSpeak`), tapping a word also says it; there is no speaker button.

## Unit example
```json
{ "id": "odd-animals", "archetype": "odd-one-out", "difficulty": 1,
  "params": { "groups": [
    { "words": ["gato", "perro", "pez"], "odd": "mesa", "theme": "animales" },
    { "words": ["rojo", "azul", "verde"], "odd": "lápiz", "theme": "colores" } ], "size": 4 },
  "prompt": { "es": "¿Cuál sobra?", "en": "Which one does not belong?" } }
```
Vocab mode: `"params": { "from": { "tag": "animals", "n": 4 } }`.
