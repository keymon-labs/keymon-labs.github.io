---
name: labs-modes
description: Development modes for new ideas in keymon-labs. Brainstorm (fast back-and-forth with a throwaway Claude artifact), Prototype (researched, usable, basics only), Final (the normal process). Use when the owner says brainstorm, prototype or final, sketches a new idea, or asks to promote one to the next mode.
---

# Modes for new ideas

Rules live in `CLAUDE.md` and `AGENTS.md`. This is the step list. A mode says **how much to invest**; it relaxes design, structure, tests and process only. The public-data and licence rules apply in every mode (a private artifact is one share away from public).

## Picking the mode
- The owner's word wins: `brainstorm: …`, `prototype: …`, `make it final`.
- No word: a loose new idea with no app yet → Brainstorm. Anything on an existing app, a bug, a tweak → Final, as before.
- Say it in the usual one line: "Brainstorm: <idea>, assuming <guess>."
- Promote only when asked. When the owner has iterated a few times and likes it, suggest the next mode in one line.

## Brainstorm: is the idea worth it?
Goal: the owner reacts to something real within minutes.
1. Optional, at most 2 quick web searches for similar apps or known patterns. Give 3–5 bullets with links: what exists, which mechanic is worth borrowing. Skip when the idea is obvious or the owner says no search. Ideas and mechanics are fine to borrow; art, names and levels are not (CLAUDE.md).
2. Build **one self-contained HTML file**, one screen, only the core interaction. Default styling (system font, two colours): no design pass, no PWA, no footer, no README, no tests. Fake data inline. Copy a pattern from an existing app only if it saves time.
3. If the idea calls Claude, test the prompt with the artifact's own Claude capability (`artifact-capabilities` skill), so no API key. This is a separate artifact: never touch the loader or its capabilities.
4. Deliver as a private Claude artifact; republish the same URL on every change. No Artifact tool in the session: send the file. Do not commit it.
5. Reply in 4 lines or fewer: what it does, what to try, one or two variants or the open question. Next turn changes only what the feedback says.
6. Ends with: go (→ Prototype), shelve (nothing to clean up), or a one-line "not viable because …".

Cost rules: stay on the current model, no subagents, no review, no plan.

## Prototype: real enough to judge, a sound base to build on
Goal: the owner can use it (on a phone) and the architecture will survive promotion.
1. **Research how it is actually built**, a handful of searches then stop: open-source implementations, libraries (licence check as in CLAUDE.md; MIT/BSD/Apache fine, GPL and "free for personal use" ask first), platform features, 2–3 viable architectures. Check the `README.md` and `shared/README.md` indexes first: reuse beats new code.
2. **Plan in 5 lines or fewer**: chosen architecture and why, what is reused, what is skipped on purpose, one close alternative. Build unless the owner objects.
3. **Build** in `<app>/` from the closest app's shell. May be thinner than the final shape (one html plus one js file, data inline or JSON). Still needed because they are cheap: the footer line, a README (the idea, similar things found with links, how it works, known shortcuts), a landing card with `<span class="tag">Prototype</span>`, and a README Apps row ending "(prototype)". An app that only needs to run in Claude can stay an artifact, with the same research and plan.
4. **Basics only**: no PWA files, no `vN/` snapshots, no `claude/apps.json` entry, no changes to `shared/` (copy what you need and mark it `// shortcut: copied from shared/<x>, extract at final`), no migrations for saved data. Tests only for logic that is hard to eyeball (parser, scoring): one assert-based check. Mark every corner cut `// shortcut: <limit>, <when to fix>`.
5. **Check**: `npm test` and `npm run build` pass (CI runs both), one headless smoke load of the page. Push, confirm the Actions run, reply with the live URL, one line on what changed and one on the shortcuts.

Cost rules: Sonnet is enough; subagents only for parallel research; no Opus review.

## Final: the current process
When the owner says "make it final":
1. `grep -rn "shortcut:" <app>` is the to-do list.
2. Treat it as a Feature-level change (`AGENTS.md`): default app shape (split JS only past ~500 lines with a clear seam), PWA (manifest, icons, `sw.js`, `registerServiceWorker()`), tests for the logic, repeated patterns moved to `shared/` when a second app needs them, `CREDITS.md` rows, and the Prototype tag and README note removed.
3. Versioning, registering and shipping: `labs-apps`. Loader: `labs-claude-loader`, only if the app calls Claude.
