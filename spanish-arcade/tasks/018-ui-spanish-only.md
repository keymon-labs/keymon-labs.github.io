---
id: "018"
title: UI fully in Spanish, answer in the spoken gap
model: Sonnet 5.5
why_model: Wide but mechanical string work across shell and archetypes.
status: done
claimed: 2026-11-07
depends_on: ["001b", "016"]
touches: [spanish-arcade/app.js, spanish-arcade/index.html, spanish-arcade/ui/**, spanish-arcade/archetypes/**, spanish-arcade/core/**, spanish-arcade/test/**, spanish-arcade/docs/**]
---
## Prompt
Owner feedback (the children are native Spanish speakers, English is only their school language): the whole UI must be Spanish, no English anywhere on screen, in the shell (map, profile, settings, result, errors) and in every archetype (feedback, hints, buttons, aria labels, notices such as the no-voice message), and `<html lang="es">`. English glosses (`en`) are never displayed; keep `en` in data as optional metadata. Remove the interface-language / help-language setting if there is one. In fill-gap-choice the speaker says the whole sentence including the answer (not "hueco"); the gap is shown as a blank line; from difficulty 2 the speaker is hidden.

## Acceptance
- A headless walk of the app finds no English words in the DOM text, titles, aria-labels or placeholders; a test guards against English UI strings; `npm test` and build pass.

Ruling: the UI language is always Spanish; the help-language setting is gone and `{es,en}` metadata stays in archetypes but is never rendered; a lint test (`test/spanish-only.test.js`) guards against English UI strings — cost if wrong: re-add a language setting.
Ruling: fill-gap-choice speaks the whole sentence; the speaker is hidden from difficulty 2 (it would give the answer to a child who knows the word by ear).
Ruling: the app footer is Spanish ("Arcade de español v1 · versión … · © 2026 keymon-labs · CC BY-NC-SA 4.0") at the owner's request — a deliberate departure from the English footer template in CLAUDE.md; the manifest names were also translated (coordinator).
Known: the root landing card in /index.html is still English (the owner's site page). Spell exercises with a word that has no emoji show an empty prompt: keep an emoji on spelling words.
