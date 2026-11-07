---
id: "004"
title: Profiles, home screen, help overlay
model: Sonnet 5.5
why_model: UI assembly following the design from 002.
status: todo
depends_on: ["001b", "002"]
touches: [spanish-arcade/app.js, style.css, ui/profile-*.js, ui/help.js, core/i18n.js]
---
## Prompt
Build the profile picker (1–4 profiles: first name, full name, class, avatar; no age), the unit map with stars and badge shelf, and the embedded help: a "?" on every screen opening a short, illustrated, mascot-voiced overlay, plus a first-time tip per archetype (`help` key in each archetype). Greeting uses the first name only; full name and class appear only in Settings/Report/Badge. Help text in English with Spanish words highlighted, a speaker button on prompts, switchable language, text-size setting. Build the **parent gate** (hold 2 seconds or an easy sum) used by Settings, export, import and delete; deleting a profile also needs typing the first name.

## Acceptance
- Four profiles creatable, a fifth refused politely. Edits persist. Greeting never shows full name.
- Every screen has working help. Keyboard and touch usable; tap targets ≥ 48px.

## Notes
Full name and class are personal data: only in the user's browser, never in code or tests (invented values only).
