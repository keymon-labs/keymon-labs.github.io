# question-maker

"Eres periodista": an answer is shown with one part highlighted ("Vivo **en una casa azul**."). The child builds the question that asks for that part. Trains question words with accent, `¿ ?`, person change (*vivo → vives*) and *por qué*. Skill: `grammar`. Tile board, decoy look-alikes and the tokeniser come from `order-words` (imported, not copied). A 🔊 button reads the answer; when the question is right the reporter asks it aloud.

| Param | Type | Default | Notes |
|---|---|---|---|
| `items` | array of `{ answer, focus, question, accept?, wrong?, emoji? }`, min 1 | required | `focus` must be an exact substring of `answer` (`make` throws otherwise). `question` is the target. `accept`: other correct questions (same tiles, other order). `wrong`: full wrong questions: shown as options in `choice`, and their words not in the target become extra decoy tiles in `tiles`. |
| `build` | `choice` \| `tiles` \| `type` | `choice` / `tiles` / `type` for difficulty 1 / 2 / 3 | Choice: tap one of 3 questions. Tiles: `¿ ? , .` are tiles of their own (2-9 tiles). Type: text field with a ñ á é í ó ú ü ¿ ¡ row. |
| `decoys` | int 0-3 | 0 / 2 / 3 | Look-alike tiles (`tiles` only): *donde/dónde*, *que/qué*, plus words from `wrong` (*vivo/vives*). |
| `n` | int ≥ 1 | all items | Items to play (seeded random pick). |

`choice` needs a wrong question: give `wrong`, or the target has an accent (an accent-less look-alike is made) or there are other items (their questions are used).

Judge: exact tokens (`¿`, `?` count; case and accents strict) against `question` or an `accept`. Feedback tells apart: marks missing, accents/capitals, right words in the wrong order, otherwise "look at the marked part". Answers can be a tile list or a string.

Hints: first miss: `choice` greys out one wrong option; `tiles` keeps the right leading tiles (at least `¿` + the question word); `type` types the start for the child. Second miss: the question is shown to copy; wrong options/decoys are disabled.

```json
{ "archetype": "question-maker", "difficulty": 2, "prompt": { "es": "¿Qué pregunta da esta respuesta?", "en": "Which question gives this answer?" },
  "params": { "items": [
    { "answer": "Vivo en una casa azul.", "focus": "en una casa azul", "question": "¿Dónde vives?", "wrong": ["¿Dónde vivo?"], "emoji": "🏠" },
    { "answer": "Llego tarde porque perdí el autobús.", "focus": "porque perdí el autobús", "question": "¿Por qué llegas tarde?", "emoji": "🚌" },
    { "answer": "Mi hermano tiene tres gatos.", "focus": "tres", "question": "¿Cuántos gatos tiene tu hermano?", "emoji": "🐱" }
  ], "n": 3 } }
```

Rules in `logic.js` (`make`, `judge`, `hint`, `splitFocus`); tests in `test/question-maker.test.js`; styles in the `/* question-maker */` block of `style.css`.
