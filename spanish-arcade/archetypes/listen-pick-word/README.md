# listen-pick-word

Hear a Spanish word (speech synthesis via `ui/speech.js`), tap the matching word or picture. Skill: listening.

| param | type | default | meaning |
|---|---|---|---|
| `from` | selector | required | words to practise (`n` rounds) |
| `options` | int 2-6 | 3 (difficulty + 2, max 6) | choices per round |
| `answerAs` | `word` \| `picture` | `word` | what the child taps; `picture` needs emoji on the target (else that round uses words) |
| `replay` | bool | `true` | `false`: one listen only, no slow button |
| `similar` | bool | `false` (true at difficulty 3) | distractors closest in spelling |

Distractors never share the answer's id, spelling or emoji, nor each other's.

Buttons: 🔊 listen, 🐢 slower (rate 0.5).

**No Spanish voice** (`ctx.canSpeak` false): the round becomes picture prompt, tap the word, with a small notice. Never "match identical words". Recorded clips are a later task; voice quality varies by device.

## Unit example
```json
{ "id": "animals-listen", "archetype": "listen-pick-word", "difficulty": 1,
  "params": { "from": { "tag": "animals", "n": 4 }, "options": 3, "answerAs": "picture" },
  "prompt": { "es": "Escucha y toca.", "en": "Listen and tap." } }
```
