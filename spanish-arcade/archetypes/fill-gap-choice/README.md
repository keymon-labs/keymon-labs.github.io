# fill-gap-choice

A sentence with one gap and 2-4 options. The child taps a word (or drags it into the gap); the right word lands in the gap and the completed sentence is read aloud when a Spanish voice exists (🔊 button, hidden otherwise). Skill: grammar.

| param | type | default | meaning |
|---|---|---|---|
| `items` | list of `{ text, options, answer, en? }` (`en` is metadata, never shown) | none | authored sentences; `text` has exactly one `___` |
| `n` | int ≥ 1 | all | take this many of the `items` (random, seeded) |
| `from` | selector | none | words to generate items from (needs `focus`) |
| `focus` | `article` \| `feeling` | `article` | what `from` generates (below) |
| `options` | int 2-4 | difficulty + 1 (max 4) | choices per generated round; authored items use their own `options` |

Use `items`, `from`, or both (authored rounds come first).

## Authored items
`text` = `"Yo ___ ocho años"`, `options` = 2-4 words or marks (`"está"`, `"año"`, `"¡"`), `answer` = one of them. Accents are strict: `está` and `esta` are different options, and `papá` is not `papa`. Option comparison ignores case and spaces only.
**A bad item is an error** (`items[i]: ...`, shown by `npm run check:units`): no or several `___`, fewer than 2 or more than 4 options, a blank or duplicate option, or an answer that is not among the options. The option replaces `___` as-is, so write spaces yourself: for a mark glued to the next word use `"___Qué sorpresa!"` (no space).

## Generated items (`from` + `focus`)
- `article`: nouns with an `article` (`el la los las`). Sentence "Mira ___ gato." with the picture. Options are the definite articles, the noun's own number first, so 2 options is `el`/`la` (or `los`/`las`). `elException` nouns keep their article (`el agua`: `la` is the wrong option).
- `feeling`: adjectives (`pos: adj`) tagged `feelings` **with an emoji**. Sentence "Hoy estoy ___." and the picture says which feeling is right. Distractors are other `feelings` words with a different emoji.
- Targets that do not fit (not a noun, no article, not a feeling, no emoji) get no round; the rest are used. A small pool gives fewer options than asked, never duplicates.
- `verb-form` and `preposition` are **not generated**: vocab has no conjugation or preposition metadata yet. Write those as `items`.

## Hints and speaker
Level 1 outlines the gap (dotted outline, not only colour); with 4 options it also disables one wrong option other than the last tapped. A wrong tapped option is disabled (✖, strikethrough) only while more than 2 options are enabled, so with 2 options a miss leaves both enabled and at least 2 choices always remain. Level 2 marks the answer with 👉 and a double outline (the status line says so) and the child taps it. After a miss focus moves to the first enabled option. Feedback has ✔ / ✖ in an `aria-live` line, which adds the completed sentence on a correct answer. Options are at least 48px; dragging is optional, tapping always works.
The 🔊 button reads the **whole sentence, answer included** (`round.heard` is the complete sentence); the visible gap stays a blank line and only its screen-reader label says "hueco". Because that gives the answer away, the button is **hidden from `difficulty >= 2`** (`speakerShown` in `logic.js`, `ctx.difficulty`) and when there is no Spanish voice. The completed sentence is still read aloud after a correct answer.

## Unit example
Three authored sentences (our own words) and one generated exercise:
```json
{ "id": "grammar-gaps", "archetype": "fill-gap-choice", "difficulty": 1,
  "params": { "items": [
    { "text": "Yo ___ una pelota", "options": ["tengo", "tienes"], "answer": "tengo", "en": "I have a ball" },
    { "text": "¿Dónde ___ la luna?", "options": ["está", "esta", "estoy"], "answer": "está" },
    { "text": "___Qué sorpresa!", "options": ["¡", "¿"], "answer": "¡" } ] },
  "prompt": { "es": "Completa la frase.", "en": "Fill the gap." } },
{ "id": "animals-articles", "archetype": "fill-gap-choice", "difficulty": 1,
  "params": { "from": { "tag": "animals", "n": 3 }, "focus": "article", "options": 2 },
  "prompt": { "es": "¿El o la?", "en": "El or la?" } }
```
`items` with fewer than 3 entries are accepted by `npm run check:units` (it needs min(3, number of items) rounds).
