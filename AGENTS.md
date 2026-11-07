# AGENTS.md: how sessions work in this repo

Read after [CLAUDE.md](CLAUDE.md), which wins on conflicts. Goal: **prototypes fast, iterate with the owner, enough structure and tests to keep going**, no more engineering than the change needs. The pattern is inspired by [superpowers](https://github.com/obra/superpowers) (MIT), done lightly.

## Pick the level by risk, not habit
| Level | When | How |
|---|---|---|
| **Quick** (default) | tweaks, a new game/screen in an existing app, a prototype, a bug | Build it yourself straight away. Ask at most 1–2 questions, only if the answer changes what gets built; otherwise state your call and go. No plan doc, no subagents, no review. |
| **Feature** | a new app, a change to `shared/`, anything touching saved data (export/import, migrations, storage schema) | A ≤5-line plan in the reply, then build. One review subagent at the end (Opus) **only** for `shared/` or data-loss risk. |
| **Board** | work spanning several chats or models | `task-board` skill. Light gates, see below. |

When unsure, go one level lower and ship; the owner's feedback is the review.

## How to build fast
- **Reuse first**: `shared/`, then a pattern from another app (copy and adapt), then a platform feature, then a library (CLAUDE.md order). New apps start from the closest existing app's shell (manifest, `sw.js`, footer, test hook), not from scratch.
- **Pull patterns into `shared/`** when a second app needs them. That is the investment that makes the next prototype quick.
- **Tests where they pay**: pure logic that's easy to break (scoring, parsers, validators, data migrations). UI: one headless smoke load, plus driving the test hook for games. No tests for markup or styling.
- **Bugs**: reproduce first, find the root cause, fix once where it lives. If the first fix doesn't work, stop guessing: trace the data back to where it goes wrong before the next attempt.
- **Done means checked**: `npm test`, `npm run build`, smoke load, then push. Say what you didn't check.
- Data (levels, word lists, episodes) stays in JSON so the owner and cheaper models can extend it without touching code.

## Subagents: only when they buy something
- Parallel independent work, a cheaper model for bulk/mundane work (Haiku: drafting data or content; Sonnet: routine implementation), an Opus second opinion on a hard call, or keeping a huge read out of your context.
- Always pass `model` explicitly. Hand over file paths, not the conversation. Workers don't push or spawn agents; you merge and push.
- Stuck after two attempts? Ask an Opus subagent for advice (read-only, recommendation + why) before a third.

## Board runs (light)
- "Do task <path>": take that task at its level (most are Quick or Feature), claim, build, finish in one commit. Details: `task-board` skill.
- "Coordinate <board>": take up to 3 ready tasks with disjoint `touches`. Small ones you do yourself in sequence; bigger or parallel ones go to subagents on the task's `model` (worktrees if parallel). Review only tasks that set contracts or touch `shared/`; everything else gets one batch review at the end of the run, or none for a small run. Push after each merged task.
- Content tasks (Haiku drafts) end in `review` for the owner; that is their review.
- Record decisions you made without the owner as `Ruling: <decision> — <why>` in the task's `Notes`. Stop and ask only for: irreversible actions, security or loader capabilities, personal data or licences needing consent.

## Where things go
Specs and plans, when one is worth writing: `<area>/docs/`. Board: `<area>/tasks/`. Everything is public (CLAUDE.md).
