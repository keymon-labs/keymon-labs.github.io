# __ID__

TODO one paragraph: what the child sees and does, the skill it trains (`__SKILL__`), and what one round is (one round = one judged answer = one `submit`). Learner text is Spanish only; every sentence is original and invented.

| param | type | default | meaning |
|---|---|---|---|
| `items` | list, min 1 | required | `{ prompt, answer, wrong }`: a Spanish sentence, the right option and 1+ wrong options (below) |
| `n` | int ≥ 1, optional | all items | rounds to play, in order |

An item: `prompt` (Spanish text), `answer` (the one right option), `wrong` (list of options that are plainly wrong; never equal to `answer`). Options are shuffled per seed.

Hints: level 1 greys out one wrong option (never the one just tried); level 2 marks the answer. TODO describe anything else the child sees (audio, feedback).

## Unit example
```json
{ "id": "__ID__-practice", "archetype": "__ID__", "difficulty": 1,
  "params": { "items": [
    { "prompt": "Yo ___ una pelota.", "answer": "tengo", "wrong": ["tienes", "tiene"] },
    { "prompt": "¿Dónde ___ el gato?", "answer": "está", "wrong": ["estás", "estoy"] },
    { "prompt": "Nosotros ___ en casa.", "answer": "estamos", "wrong": ["están", "estáis"] } ] },
  "prompt": { "es": "Elige la respuesta.", "en": "Choose the answer." } }
```
