# read-answer

Read a short text (2-5 simple sentences, optional emoji), then answer questions as a/b/c or true/false. Skill: reading. Every text is our own invented writing, never from a book.

One round = one question = one `submit`; each round shows the same text. The exercise has no `from` selector (no vocab words are drawn), so `wordIds` is empty and nothing feeds the tricky-words stats.

| param | type | default | meaning |
|---|---|---|---|
| `text` | list of text, 2-5 | required | the sentences, one per entry (young readers: keep each short) |
| `emoji` | text | none | one picture shown above the text |
| `kind` | `abc` \| `tf` | `abc` | multiple choice, or true/false |
| `questions` | list, 1-3 | required | see below |
| `showTextWhileAnswering` | bool | `true` (false at difficulty 3) | `false`: the child reads, taps "I have read it", the text hides; a hint brings it back |

Question fields:

| field | used by | meaning |
|---|---|---|
| `q` | both | the question, or for `tf` the statement to judge |
| `options` | `abc` | 2-4 answers, kept in the order you write them; two equal answers (compared after trimming and lowercasing) are an error |
| `answer` | `abc` | index in `options` of the right one (0 = first) |
| `ok` | `tf` | `true` if the statement is true |
| `evidence` | optional | index in `text` of the sentence that holds the answer |

`make` also rejects blank sentences, questions and options, and an `ok` on an `abc` question; it throws a readable error (shown by `npm run check:units`) for the rules the schema cannot see: sentence and question counts, option counts, `answer` or `evidence` out of range, a `tf` question with `options`.

## Hints
- Miss 1: highlights the `evidence` sentence (bold, underline, coloured) and says "look at the marked sentence". It never greys out or points at an option; with more than 2 options a wrong tap disables that tapped option (it reveals nothing); with two options or `tf` a wrong tap disables nothing. With no `evidence` it just shows the whole text again.
- Miss 2: also marks the right option with a ✔, and the status line says so.
- Leave `evidence` out for an "inference" question (the answer is not stated word for word); the hint then falls back to re-reading the whole text. That is the room left for a harder mode.

## Speech and layout
A 🔊 button reads the text aloud, and another reads the question; both are hidden when `ctx.canSpeak` is false. Layout is one column, long words wrap, tap targets are at least 56px.

## Unit example
```json
{ "id": "parrot-read", "archetype": "read-answer", "difficulty": 1,
  "params": {
    "text": ["Mira tiene un loro.", "El loro es verde.", "Come fruta por la mañana."],
    "emoji": "🦜",
    "questions": [
      { "q": "¿Qué tiene Mira?", "options": ["un loro", "un gato", "un pez"], "answer": 0, "evidence": 0 },
      { "q": "¿De qué color es?", "options": ["rojo", "verde", "azul"], "answer": 1, "evidence": 1 },
      { "q": "¿Cuándo come?", "options": ["de noche", "por la mañana", "nunca"], "answer": 1, "evidence": 2 }
    ] },
  "prompt": { "es": "Lee y contesta.", "en": "Read and answer." } }
```
True/false version: add `"kind": "tf"` and write questions as `{ "q": "Mira tiene un gato.", "ok": false, "evidence": 0 }`.
