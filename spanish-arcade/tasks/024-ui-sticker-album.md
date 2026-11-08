---
id: "024"
title: UI round 3: sticker album and rewards
model: Sonnet 5.5
why_model: New screen on top of existing badges and stars; shares work with task 005.
status: todo
depends_on: ["022", "005"]
touches: [spanish-arcade/app.js, spanish-arcade/ui/**, spanish-arcade/core/**, spanish-arcade/test/**]
---
## Prompt
An album page of emoji stickers (🌟🦋🚀…), one per unit star/badge, grey slots until earned; a small pop animation when a sticker is won at the end of a unit; linked from the home. Needs an event log (when stickers were won) — decide with 005 how badges are stored.

## Acceptance
- Earned stickers persist; export/import (003) includes them; reduced motion respected.
