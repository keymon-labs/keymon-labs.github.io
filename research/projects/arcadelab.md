---
type: project
summary: Free no-account platform (formerly KidHubb) where kids publish single-file HTML games made with AI and share them by link; sandboxed, MIT-licensed platform code
status: studied
url: https://kidhubb.vercel.app/
repo: https://github.com/mlapeter/arcadelab
licence: MIT
licence_checked: repo
reuse: ok
free: yes
tech: [nextjs, supabase, vercel, phaser, p5js, threejs, tonejs]
themes: [kids-games, sharing, ai-builders, inspiration]
related: [projects/rosebud-ai, projects/pocket-sequencer, projects/ohmygame, techniques/ai-game-builders]
captured: 2026-11-23
---
# ArcadeLab (was KidHubb)

"The shortest path from 'I made a game' to 'my friends can play it'": make a game with an AI assistant, paste the code at the publish page, get a shareable URL. No email or password; a memorable Creator Code identifies the publisher. One self-contained HTML file per game, capped at 750 KB, starting with an ARCADELAB header comment (title, description, libraries, emoji, colour). Libraries (Phaser, p5, Three.js, GSAP, Tone, Pixi, Matter, D3, React) are injected when declared, so no CDN tags. Games run in sandboxed iframes on a separate origin with no network access; a lightweight scanner checks for bad patterns, with no stated human review. Deliberately no comments, followers or DMs. Pages also give AI assistants a briefing so they can help kids publish. Stack: Next.js, Supabase, Tailwind, TypeScript; repo has about 2 stars.

## Learn
- The same shape we want: share-by-link, no accounts, single-file games, safe by sandboxing.
- Declaring libraries in a header, instead of CDN tags, keeps files small and safe.
- Counts (plays, stars) without social features is a gentle way to show popularity.
- Open question for us: moderation depends on a scanner, and games are public on the internet.

## Reuse
MIT: allowed with the licence kept and a CREDITS.md row. Our site is static (GitHub Pages), so we could not copy its server stack, but the single-file header and sandbox ideas can be reimplemented.
