---
id: "006"
title: Archetype listen-pick-word
model: Sonnet 5.5
why_model: Clear contract; the main risk is audio behaviour on the target device.
status: todo
depends_on: ["001"]
touches: [spanish-arcade/archetypes/listen-pick-word/**, test/listen-pick-word.test.js]
---
## Prompt
Implement `listen-pick-word` (see `docs/ARCHETYPES.md`): speak the target word via `speechSynthesis` (`es-ES`, falling back to any `es-*` voice), with a replay button and a slow-speed button; the child picks the word or picture. Params: `from`, `options`, `answerAs`, `replay`. Use `ui/speech.js` from task 001 (don't rewrite it). When no Spanish voice exists, switch to picture → pick the word (never matching identical words) with a small notice. Pure `make`/`judge` in `logic.js` with tests (distractors never equal the answer; difficulty raises similarity).

## Acceptance
- Works in headless Chromium (mock speech); fallback path tested. Tap targets large; picture mode uses emoji or our own art.
- `archetypes/listen-pick-word/README.md` documents params and a copy-paste unit example.

## Notes
Record any voice-quality concerns; recorded clips are a later task.
