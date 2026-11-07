---
id: "002"
title: Visual design system and mascot
model: Opus 5.5 (use the Design artifact type for mockups)
why_model: Look-and-feel decisions and original art direction; do this in its own chat so the design can be iterated visually.
kind: design
status: todo
depends_on: ["000"]
touches: [spanish-arcade/docs/DESIGN.md, spanish-arcade/ui/theme/**, spanish-arcade/ui/mascot.js, spanish-arcade/ui/sfx.js]
---
## Prompt
Design the look and feel for children aged about 6–8: friendly, bright, readable, light/dark aware, landscape-friendly. First produce mockups (Design artifact) of: home/profile picker, unit map with badges, an exercise screen (generic frame with "?" help button), result screen with stars and a joke. Then write `docs/DESIGN.md` (tokens, type scale, spacing, tap-target ≥ 48px, motion rules incl. `prefers-reduced-motion`, sound rules) and implement `ui/theme/tokens.css` (CSS variables) and reusable pieces: **original drawings** of the book's cast (cast notes in `docs/BOOK-NOTES.md`; our own style) as inline SVG: Toni the elk as main guide with moods (happy, thinking, cheer, oops), plus simple avatar/portrait versions of Gus, Gas, Luz and the friends, and small CSS animations, `ui/sfx.js` (Web Audio synthesised sounds via `shared/audio.js`), confetti. Fonts: OFL only, via npm or self-hosted; add to CREDITS.md. Original drawings only.

## Acceptance
- Mockups approved by the user before implementation.
- `DESIGN.md` is enough for another chat to style an archetype without asking.
- Mascot and theme work offline; reduced-motion respected; contrast checked.

## Notes
Check the drawing style against the cast page descriptions (e.g. Gas's multicoloured braid, Toni's antlers) but stay clearly our own; the user approves the character sheet before it is used everywhere. Runs in parallel with 001; integration into the shell happens in 004.
