---
id: "018"
title: UI fully in Spanish, answer in the spoken gap
model: Sonnet 5.5
why_model: Wide but mechanical string work across shell and archetypes.
status: in-progress
claimed: 2026-11-07
depends_on: ["001b", "016"]
touches: [spanish-arcade/app.js, spanish-arcade/index.html, spanish-arcade/ui/**, spanish-arcade/archetypes/**, spanish-arcade/core/**, spanish-arcade/test/**, spanish-arcade/docs/**]
---
## Prompt
Owner feedback (the children are native Spanish speakers, English is only their school language): the whole UI must be Spanish, no English anywhere on screen, in the shell (map, profile, settings, result, errors) and in every archetype (feedback, hints, buttons, aria labels, notices such as the no-voice message), and `<html lang="es">`. English glosses (`en`) are never displayed; keep `en` in data as optional metadata. Remove the interface-language / help-language setting if there is one. In fill-gap-choice the speaker says the whole sentence including the answer (not "hueco"); the gap is shown as a blank line; from difficulty 2 the speaker is hidden.

## Acceptance
- A headless walk of the app finds no English words in the DOM text, titles, aria-labels or placeholders; a test guards against English UI strings; `npm test` and build pass.
