---
name: task-board
description: Split a project into task files (one markdown file per task with model, dependencies, touched paths and status) so separate chats, subagents and models can work in parallel and the owner can track progress. Use when planning work bigger than one session, creating or updating a <area>/tasks/ board, taking a task ("do task …/NNN-x.md"), coordinating a board, or asking what is ready, in progress or waiting for review.
---

# Task boards

For any app, project or repo. A board is a folder `tasks/` (repo-wide work) or `<area>/tasks/` (one app or project; `spanish-arcade/tasks/` is the first example) holding a `README.md` and one file per task. A repo can have many boards; the tooling finds them all. The task files are the only source of truth; the table in the README is generated. Coordinator runs over a board are described in [AGENTS.md](../../../AGENTS.md).

```
<area>/docs/PLAN.md        contracts every task builds on (schemas, interfaces, folder layout)
<area>/tasks/README.md     how to take a task, standard preamble, generated board
<area>/tasks/NNN-name.md   one task
```

## Board or plan?
- **Board** when work spans several chats, days or models, or the owner wants to track it: features, content packs, a new app.
- **Superpowers plan** (`writing-plans` skill) for the steps *inside* one code task, when that task is multi-step. Save it as `<area>/docs/plans/NNN-name.md` and link it from the task's `plan:` field. Don't put a plan's TDD steps in the task file.
- One small change: neither. Just do it.

## Task file
```markdown
---
id: "006"                    # quoted; sorts with the file name; letters allowed (001b)
title: Archetype listen-pick-word
model: Sonnet 5.5            # recommended model; first word is the tier (Fable|Opus|Sonnet|Haiku)
why_model: Clear contract; main risk is audio on the device.
kind: code                   # code | content | design | review  (decides the review gate)
status: todo                 # todo | in-progress | review | blocked | done
claimed: 2026-11-07          # date set with in-progress
depends_on: ["001"]          # ids that must be `done` first
touches: [spanish-arcade/archetypes/listen-pick-word/**, spanish-arcade/test/listen-pick-word.test.js]
plan: spanish-arcade/docs/plans/006-listen-pick-word.md   # optional superpowers plan
---
## Prompt       self-contained: what to build, which docs/sections to read, exact names and values
## Acceptance   checkable bullets (a test, a command and its output, a page that loads)
## Notes        risks and decisions; agents append `Ruling: <decision> — <why> — <cost if wrong>` lines
```
`kind` and `plan` are optional (default `code`, no plan). Unknown fields are ignored by the tooling.

## Statuses and who moves them
| Status | Meaning | Set by |
|---|---|---|
| todo | not started | whoever writes the task |
| in-progress | claimed; `claimed:` set | the chat or coordinator taking it, pushed **before** work starts |
| review | built, waiting on the owner (Spanish check, art, gameplay feel) | the worker, in the same commit as the work |
| blocked | can't continue; reason in `Notes` | the worker |
| done | accepted | worker for `code` that passed the task review; **only the owner** for `content`/`design` |

`review` does not unblock dependants: tasks waiting on it stay out of the ready list until the owner says done.

## Writing tasks
- **Contracts first.** Put shared schemas, interfaces and folder layout in `docs/PLAN.md`. Parallel work is only safe when tasks meet at written contracts. A task that must change a contract edits PLAN.md in the same commit and says so in the commit message.
- **Gate task 000**: an Opus (or Fable) review of PLAN.md and every task before anything is built. Cheapest place to fix mistakes.
- **Right size**: one chat, one reviewable diff, one independently testable deliverable. Fold setup and docs into the task that needs them; split only where a reviewer could reject one half and accept the other.
- **Self-contained prompt**: a worker sees only its task file, CLAUDE.md, AGENTS.md and the docs it names. Give exact file paths, names and values; never "see the chat".
- **Disjoint `touches`**: the fixed part of each pattern (before `*`) is what tooling compares. Tasks whose paths overlap are never run at the same time.
- **Acceptance you can check** without the author: a test name, a command, a page with no console errors.
- **Model per task** (state the tier and one-line why):

| Tier | Use for |
|---|---|
| Fable | the hardest calls only: architecture with many unknowns, a final review of a large run, a bug two Opus attempts couldn't find |
| Opus | contracts, plan review, design, coordinating, reviewing risky diffs |
| Sonnet | default implementer and reviewer; prose specs; multi-file work |
| Haiku | drafting data/content, transcribing complete code from a plan, one-file mechanical fixes; always reviewed by Sonnet or above |

Cheap models take more turns on multi-step work and can cost more overall; Sonnet is the floor for anything that needs judgement.

## Creating or extending a board
1. Write or update `docs/PLAN.md`, then the task files, then `tasks/README.md` (copy `spanish-arcade/tasks/README.md`: how to take a task, the standard preamble, and an empty `<!-- board:start … -->`/`<!-- board:end -->` pair).
2. `npm run tasks` regenerates the table and validates every board (unknown dependencies, cycles, duplicate ids, bad statuses). `npm test` runs the same validation in CI.
3. Commit the board on its own (`Add <area> task board`), then run task 000.

## Taking one task (a chat started with "do task …")
1. `git pull`; read CLAUDE.md, AGENTS.md, the board README preamble, the task, and only the docs it names.
2. Check it is `todo` and every `depends_on` is `done`. Otherwise stop and say which task is in the way.
3. **Claim**: set `status: in-progress` and `claimed: <today>`, run `npm run tasks`, commit `Claim <area> task NNN`, push. If the push is rejected, `git pull --rebase` and re-check the status: if someone else claimed it, pick another ready task or stop. The push is the lock.
4. Work inside `touches` following AGENTS.md (superpowers skills per task kind). Need another path? Make the minimal change and record it under `Notes`.
5. Finish in **one commit**: the work, `status: done` (or `review` for content/design, or `blocked` with the reason), Notes/rulings, regenerated board. Push, check the Actions run.
6. Reply: one line on what changed, one on what was skipped, and which tasks are now ready.

## Owner tracking
- `npm run tasks` prints for every board: counts by status, what is in progress (stale claims older than 3 days flagged), what is **waiting on you** (`review`), and the next ready tasks grouped into batches that can run in parallel.
- From the phone: ask a chat "status of the task boards" and it runs that command and reports.
- Approving content: read the change, then set `status: done` yourself (or ask a chat to, saying it is approved).

## Using it in another repo
Copy `.claude/skills/task-board/`, `scripts/tasks.mjs` and `scripts/tasks.test.js` (Node 22+, no dependencies), add `"tasks": "node scripts/tasks.mjs"` to `package.json`, and copy `AGENTS.md`, replacing its repo-specific lines (the skills it routes to, the checks it runs before pushing). For superpowers, copy `scripts/sync-superpowers.sh` and run it. Without Node, the files still work by hand: the front matter is the board.

## Why it is built this way
- Front matter is the single source of truth and the table is generated, so the board can't drift from the files (hand-kept tables did).
- Claims are commits on `main`: git's rejected push is a free lock, and history shows who did what and when.
- Overlapping file paths were the most common failure when agents ran in parallel; checking `touches` before starting each batch avoids most of it ([orchestrator write-up](https://dev.to/cloudx/one-brain-many-hands-building-a-parallel-task-orchestrator-for-ai-agents-3nb4)). Split along file and module boundaries ([agent teams guide](https://www.datacamp.com/tutorial/claude-code-agent-teams)).
- Markdown tasks with statuses, dependencies validated for cycles, and acceptance criteria are the common shape of agent task tools ([Backlog.md](https://github.com/MrLesk/Backlog.md)).
- Stronger model coordinating, cheaper models working, a durable ledger that survives context compaction, rulings recorded instead of stalls: from superpowers' subagent-driven development (vendored here, see `.claude/skills/SUPERPOWERS.md`).
