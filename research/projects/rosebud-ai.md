---
type: project
summary: Browser platform where you describe a game in chat and an assistant (Rosie) writes the code, art and sound; credits-based freemium with remixing, hosting and Steam export
status: studied
url: https://rosebud.ai/
licence: proprietary
licence_checked: terms
reuse: ideas-only
free: freemium
tech: [phaser, threejs, javascript, ai-code-generation]
themes: [ai-builders, games]
related: [projects/collidingscopes-arpeggiator, authors/collidingscopes]
captured: 2026-11-22
---
# Rosebud AI

A closed, hosted "vibe-coding" game maker, the commercial cousin of what we do here with Claude, GitHub and Pages. Based in San Francisco, founded 2019, Y Combinator backed. It claims 1M+ creators and 2.5M+ games. Its stated goal: help more people go from playing games to making them ("Creation is the new play"). The Arpeggiator README credits it.

## How it works
- Describe a game, or pick a template. Rosie asks a few questions (2D or 3D, mobile or desktop, solo or multiplayer) and builds a first playable version.
- Iterate by chat. Each project is real code with a code tab, an asset manager and a live build. Assets: images, sound, music, 360° skyboxes, 3D models, AI-driven characters. Multiplayer rooms (private or public).
- Remix: public games can be copied into your own editor with one press. Public and remixable by default.
- Publish: a link, a post on X that plays in the feed, a Windows build for Steam (Pro), or from a coding agent (Claude Code, Codex, Cursor) in one command, per its homepage.

## Tech
Generated JavaScript: Phaser for 2D, Three.js for 3D, voxel worlds, WebGL, and Babylon.js mentioned in blog posts. Runs in the browser, projects saved in the cloud. The AI models behind Rosie are not stated publicly.

## Business model
Credits subscription, free to start. Credits pay for every build or edit turn and every generated asset, and the editor shows what each turn used.
| Plan | Price | Credits | Adds |
|---|---|---|---|
| Free | $0 | 10,000 per week (eligible regions) | create, play, remix, share |
| Indie Dev | $15/month | 100,000 per month, plus 10,000 daily refresh | private projects, code tab in the browser, rollover once |
| 10x Dev | $30/month | 300,000 per month | full commercial rights, no Rosebud branding |
| Pro | $50/month | 1,000,000 per month | code download (desktop), Windows export, managed infrastructure |
| Scale | $100/month | not captured | for heavy AI use |
No commission on creators' earnings. The Free plan has no commercial rights.

## Funding
Reports differ. PitchBook: about $9.2M raised, investors include Andreessen Horowitz and Animoca Brands. A Tracxn page says unfunded and founded 2025, which conflicts with the company's own 2019 and YC claims.

## Terms worth knowing
- Users grant Rosebud a perpetual, irrevocable, worldwide licence to use, modify and distribute their content and feedback.
- The privacy policy says it may sell or license anonymised datasets, and models trained on them, to AI labs and research partners.
- Reviewers note limits: big structural edits can break working systems, manual control is shallow, and a portable project needs Pro.

## Learn
- Clarifying questions before building (2D or 3D, mobile or desktop, solo or multiplayer) beat a blank prompt.
- Show the cost of each AI turn; one-press Remix; templates by genre; publish as a plain link.
- Our edge is the opposite trade: open files in a public repo, no account, no data sold, kids' apps without tracking.

## Reuse
Proprietary platform and terms: ideas only. Because of the content licence and data-sale clauses, never upload anything private or personal to it.
