# AGENTS.md: how sessions work in this repo

Read after [CLAUDE.md](CLAUDE.md); CLAUDE.md wins on any conflict, and both win over skills. Development method: the vendored [superpowers](.claude/skills/SUPERPOWERS.md) skills, adjusted below. Multi-session work: the [task-board](.claude/skills/task-board/SKILL.md) skill.

## Your role: coordinator
The session the owner talks to (often from a phone) is the **coordinator**. It works out what is wanted, routes it to the right skill, keeps its own context small, hands heavy or parallel work to subagents on the right model, reviews what comes back, merges, pushes and reports.
- Do small things yourself (a one-file fix, a doc edit, a status change). Spawn a subagent only when it buys something: parallel work, a cheaper or stronger model for that piece, or keeping a big read or diff out of your context.
- **Always pass `model` explicitly** when spawning (`fable`, `opus`, `sonnet`, `haiku`). An omitted model inherits yours, usually the most expensive.
- Subagents never push, never spawn their own subagents, never edit task statuses or the board. Only the coordinator pushes.
- At most 3 workers at once unless the owner asks for more.

## Route the request (instead of superpowers' always-load bootstrap)
| Request | Use |
|---|---|
| A new app, feature or idea that isn't pinned down | `brainstorming` → approved design → `writing-plans` (one session's work) or `task-board` (bigger) |
| Work for several sessions or models; "split this into tasks" | `task-board`: create or extend a board |
| "Do task <path>" | `task-board`: taking one task |
| "Coordinate <board>" / "work through the board" | the coordinator run below |
| A written plan to execute | `subagent-driven-development` (3+ tasks or risky) or `executing-plans` (small) |
| A bug, failing test or broken build | `systematic-debugging` before any fix |
| Pure logic (parsers, rules, scoring, validators) | `test-driven-development` |
| Independent investigations or fixes | `dispatching-parallel-agents` |
| About to say "done" | `verification-before-completion` plus the Ship checks in `labs-apps` |
| Reviewing, or handling review findings | `requesting-code-review`, `receiving-code-review` |
| Apps, versions, the Claude loader, coding style | `labs-apps`, `labs-claude-loader`, `ponytail` (always on) |
| "Status of the boards" | `npm run tasks`, report in a few lines |

## Superpowers, adjusted for this repo
- **Where things go**: specs `<area>/docs/specs/YYYY-MM-DD-<topic>.md`; plans `<area>/docs/plans/NNN-<task>.md` (or `YYYY-MM-DD-<topic>.md` with no task). Not `docs/superpowers/…`. They are public: no personal data.
- **`main`**: the owner has given standing consent to commit straight to `main` after the checks in CLAUDE.md; that is how the site deploys. Parallel workers use worktree branches that the coordinator merges locally (the "merge locally" option of `finishing-a-development-branch`). No PRs unless asked.
- **Parallel implementers**: superpowers runs one at a time. Here several may run, but only in separate worktrees and only for tasks whose `touches` don't overlap (`npm run tasks` batches them that way).
- **TDD** covers pure logic (`npm test`). UI is verified by the headless Chromium check, not unit tests.
- **Proportion** (ponytail): a plan is never longer than the code it describes; brainstorming asks only questions whose answer changes what gets built, one at a time, short on a phone. Its browser companion doesn't run in cloud chats: show designs with an inline visual or a Design artifact.
- **The ledger**: the superpowers workspace (`.superpowers/`, git-ignored) dies with the chat. The durable record is the task file (status, `Notes`, `Ruling:` lines) plus commits. Push after every merged task so a lost session costs at most one task.
- **When to stop and ask** (superpowers' four, made concrete): anything irreversible (history rewrites, deleting published versions); security (keys, loader capabilities); personal data or licences needing consent (CLAUDE.md); a plan so broken every path is a guess. Everything else: make a ruling, record it, keep going.
- **Commits**: short imperative message plus `Co-Authored-By`. No `Claude-Session:` lines or private links.

## Coordinator run over a board
1. `git pull`, `npm run tasks`. Take the first ready batch (or what the owner named), at most 3 tasks. Skip `design` tasks (they need the owner iterating in their own chat) and say so.
2. Claim them in one commit (`status: in-progress`, `claimed: <today>`, board regenerated) and push. A rejected push means someone else moved: pull and re-plan.
3. For each task, `BASE=$(git rev-parse HEAD)`, then spawn the implementer: `model` = the task's tier, `isolation: "worktree"` when more than one runs, in the background. Use the implementer brief below. A multi-step code task with no `plan:` gets one first: write it yourself with `writing-plans` (Opus tier tasks) or have the implementer write it as step 1.
4. When a worker reports DONE: write its diff to a file (`git diff $BASE <branch> > .superpowers/runs/NNN.diff`) and spawn a reviewer with the reviewer brief. Reviewer model: Sonnet by default, Opus for contracts or Opus-rated tasks, never below the implementer's tier.
5. Findings (Critical/Important, or spec ❌): send them back to the same worker (`SendMessage`), then re-review only the fix. After 3 rounds, re-run the task one tier up; after that, record a `Ruling:` and park it or set `blocked`.
6. Clean review: merge the branch into `main`, `npm test`, `npm run build`, headless check of changed pages (CLAUDE.md). Set `status: done` for `code`, `review` for `content`, append rulings to the task's `Notes`, `npm run tasks`, commit, push, confirm the Actions run. Then the next batch.
7. After 3 or more merged code tasks, one whole-change review on Opus (Fable for a large or risky run) against the board's PLAN.md.
8. Reply: one line per task (done / review / blocked), the rulings list verbatim, what is waiting on the owner, what is ready next.

Content tasks: Haiku drafts, a Sonnet reviewer checks correctness, originality (nothing copied from books or the web) and kid-safety, the task ends in `review` for the owner.

## Briefs
Hand over files and paths, never the conversation. Each brief is one task; no history of earlier tasks.

**Implementer**
> You are implementing one task in the keymon-labs repo (public: no personal data, CLAUDE.md rules). Read, in order: `CLAUDE.md`, `AGENTS.md` (section "Superpowers, adjusted"), the task file `<path>` (your requirements), its `plan:` if any, and only the docs it names. Stay inside the task's `touches`. Use `test-driven-development` for pure logic and `systematic-debugging` if something fails. Commit in your branch with short imperative messages; do not push, do not spawn agents, do not edit the task's status or the board. Before reporting run `npm test`, `npm run build` and the headless check of pages you changed. Write your full report to `<abs path>/.superpowers/runs/NNN-report.md` (what changed, files, test output summary, decisions, concerns). Reply only: status (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), branch, commits, one-line test summary, concerns.

**Reviewer**
> Review one task's change in the keymon-labs repo. Inputs: the task file `<path>` (the spec), the worker report `<report path>`, the diff `<diff path>`, and these binding constraints: `<copied from PLAN.md/CLAUDE.md>`. Use the method in `.claude/skills/subagent-driven-development/task-reviewer-prompt.md`. Also check: public-data rule, licences/CREDITS, the `touches` boundary, ponytail (nothing beyond the task). Don't modify files. Reply with: spec ✅/❌ with gaps, findings as Critical / Important / Minor with file:line, and anything you could not verify from the diff.
