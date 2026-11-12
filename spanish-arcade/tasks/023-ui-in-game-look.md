---
id: "023"
title: UI round 2: in-game look (progress dots, feedback faces, bigger tiles, hint/skip buttons)
model: Sonnet 5.5
why_model: Restyles shell and archetype UI against the tokens from 022.
status: done
depends_on: ["022"]
touches: [spanish-arcade/app.js, spanish-arcade/style.css, spanish-arcade/ui/tiles.js, spanish-arcade/archetypes/**, spanish-arcade/test/**]
---
## Prompt
Round progress as dots/stars instead of "Ejercicio 2/6 · 1/3"; emoji faces (🎉 😊 🤔) with the judged feedback; 💡 for the hint and ⏭️ for Saltar; larger tiles/gaps/choices; result screen with confetti (off under reduced motion) and the stars; check each archetype in light and dark with the lab page.

## Acceptance
- Every archetype readable in both themes at text size 1.5; no logic change (tests unchanged); lab screenshots attached to the task notes.

Ruling: 026 covers the in-game look of this task; take 026 and mark this done when 026 lands.
