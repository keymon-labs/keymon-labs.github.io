# listen-pick-word

Hear a Spanish word (speech synthesis via `ui/speech.js`), tap the matching word or picture. Skill: listening.

| param | type | default | meaning |
|---|---|---|---|
| `from` | selector | required | words to practise (`n` rounds) |
| `options` | int 2-6 | difficulty + 2 (max 6) | choices per round |
| `answerAs` | `word` \| `picture` | `word` | what the child taps; `picture` shows emoji options and unique emoji per option |
| `replay` | bool | `true` | `false`: one listen only, no slow button |
| `similar` | bool | `false` (true at difficulty 3) | distractors closest in spelling, never a homophone of the answer (hola/ola) |

Distractors never share the answer's id or spelling or sound. In picture mode they also have a unique emoji; in word mode emoji-less distractors are fine. The homophone rule is deliberately conservative: z/ce/ci count as s, so it also drops pairs that differ for es-ES speakers; it never offers a true homophone. Distractors never share the answer's emoji (it can be the no-voice prompt). A pool too small for `options` gives fewer options.

**Targets without an emoji get no round** (the no-voice fallback needs a picture to show). Use nouns with emoji for listening exercises.

Buttons: 🔊 listen, 🐢 slower (rate 0.5).

**No Spanish voice** (`ctx.canSpeak` false): the round becomes picture prompt, tap the word, with a small notice. Never "match identical words". Recorded clips are a later task; voice quality varies by device.

## Unit example
```json
{ "id": "animals-listen", "archetype": "listen-pick-word", "difficulty": 1,
  "params": { "from": { "tag": "animals", "n": 4 }, "options": 3, "answerAs": "picture" },
  "prompt": { "es": "Escucha y toca.", "en": "Listen and tap." } }
```
