---
id: "038"
title: Compact exercise UI (audio button beside the icon, no scroll on phones)
model: Sonnet 5.5
why_model: CSS and layout work across several archetypes, checked with screenshots.
status: review
depends_on: ["031"]
touches: [spanish-arcade/style.css, spanish-arcade/archetypes/*/index.js, spanish-arcade/ui/**, spanish-arcade/test/layout.test.js]
---
## Prompt
Owner remark: the UI is too overloaded on big exercises and needs scrolling on a phone. Put the audio button to the right of the picture or icon, shrink prompt, tiles and answer areas to fit, and keep tap targets at least 44px. Check every archetype in the lab at 390x844 and 360x640 (portrait) and one landscape: the exercise, its feedback and the primary button must be visible without page scroll at difficulty 1-3. Screenshots go in the report. Do not touch `core/session.js` (task 036 runs in parallel).

## Acceptance
- No vertical page scroll in the exercise view for any archetype at 390x844 and 360x640 with the longest sample item in the lab.
- Audio button sits beside the icon.
- `npm test` and `npm run build` pass.

## Notes
Task 036 edits `core/session.js`, `core/progress.js`, `app.js`. Keep your `style.css` edits in one clearly commented section `/* compact */` at the end to ease merges.
