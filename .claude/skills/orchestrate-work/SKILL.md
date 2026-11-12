---
name: orchestrate-work
description: Orchestrate a big chunk of work as a plan, parallel subagents and a live progress artifact. Use when a request spans several apps, features or research areas, when the owner says "orchestrate", "plan and spawn agents", "work independently" or asks for a progress graph; not for Quick or ordinary Feature changes.
---

# Orchestrating big work

The orchestrator is the main chat. It plans, spawns subagents, merges, verifies, pushes and keeps one progress artifact current. Subagents do the research and the building. Use this only for work that is worth the overhead (several independent pieces, more than about an hour of work); everything smaller follows [AGENTS.md](../../../AGENTS.md) and `ponytail`. Task files and claiming are the `task-board` skill; this skill is the layer above it.

## 1. Plan before spawning
1. Read the repo indexes (CLAUDE.md, AGENTS.md, READMEs) and the target app's README. Say in one line what you will build and what you assume.
2. Draft a phase plan, as nodes with dependencies:
   - **Research** (parallel, optional): one agent per question, each writes one doc under `<area>/docs/research/`. Opus for judgement and design questions, Sonnet for fact gathering.
   - **Synthesis**: you decide, write the contracts (what each task may touch) and create the task files with `task-board`.
   - **Build** (parallel): one Sonnet agent per task in its own git worktree. Haiku only for bulk drafts that end in `review` for the owner.
   - **Check and ship**: merge, tests, build, smoke load, personal-data scan, push, deploy confirmed. Add an Opus review only for tasks that touch `shared/` or saved data.
3. Choose the model for each node on purpose and write the reason in the task file (`model`, `why_model`).
4. Keep `touches` disjoint between tasks that run together. Files that everyone appends to (a shared `style.css`, an index) are a conflict: serialise those tasks or tell the agents which section to use.
5. Open a question ledger (`<area>/docs/research/QUESTIONS.md`): every question for the owner, the assumption you took so nothing blocks, and what it costs if wrong. The owner answers later.
6. Create the TaskCreate list, then **publish the progress artifact before the first agent starts**, so the owner sees the plan.

## 2. The progress artifact
One page per session or work item, built from [plan-template.html](plan-template.html): a phase graph (nodes todo / running / done with arrows for dependencies), a screenshot gallery, helper-agent token bars, the question ledger and a log, newest first.
- Copy the template to the scratchpad, fill `__TITLE__`, `__SUBTITLE__`, the `N` nodes (`id`, `p` phase index, `t`, `d`, `m` model, `s` status, `from` ids) and publish with the Artifact tool. Republish the same file path after every step so the URL stays the same. Load `artifact-design` before the first publish.
- **It lives in Claude only.** Never commit it, never put its URL in the repo, a commit, a README or a task file. It is private until the owner shares it. Keep the content public-safe anyway (the owner may share the link): no personal data, no private chat content.
- Log times are real: call `current_time` and use that. Never invent or estimate a time. Newest first.
- Screenshots: take them while testing (headless Chromium, 390x844 portrait plus one landscape or dark if relevant), list them in a small JSON and run `python3 .claude/skills/orchestrate-work/build-gallery.py plan.html shots.json` (needs Pillow). Check the page stays well under 16 MB.
- Token bars: only helper agents report usage, so show those (thousands of tokens from each agent's final report). Do not claim anything about the 5-hour or 7-day plan quota: it cannot be seen from here.
- Change a node to `running` when you spawn it and to `done` when its branch is merged and verified, not when the agent says it finished.

## 3. Spawn
Spawn independent agents in one message so they run in parallel. Each prompt contains:
- The task file path and, for research, the one question and the output doc path.
- The exact files it may touch and the rule that other tasks run in parallel in other worktrees.
- Reuse first (`shared/`, other archetypes or apps), then CLAUDE.md rules: public repo, no personal data, licences into CREDITS.md.
- Worktree setup: `git worktree add /home/claude/wt/<n> -b task-<n>`; `node_modules` symlinked into it.
- It must: run `npm test` and `npm run build`, load changed pages headless and take screenshots, set the task to `review`, and commit only its own paths with a short imperative message and the `Co-Authored-By` trailer. No `Claude-Session:` line.
- It must not: push, spawn agents, `git add -A` at the repo root, edit shared index docs the orchestrator owns, or write anything private.
- Its final report: what changed, what was checked, what was not, questions for the owner, tokens used.

Subagents have no Projects tool. If the work needs private material (the book Project, memory, chats), the orchestrator reads it and writes paraphrased, generic notes into the repo, then points agents at those notes. Anything private stays out unless the owner agreed to that specific item in this conversation.

## 4. Merge and verify (orchestrator only)
For each finished branch, one at a time:
1. Merge locally (`git merge task-<n>`); resolve conflicts keeping both sides. Use `git pull --no-rebase`, never `--rebase` after merges.
2. `npm test > out.txt; echo $?` and `npm run build > out.txt; echo $?`. Read the exit codes; a piped `tail` hides failures.
3. Serve `dist/` and load each changed page headless: no page errors. Drive games through their test hook.
4. Scan the diff and commit message for personal data and for unlisted third-party material.
5. Push, then wait for the deploy with `until gh run list ... ; do sleep 20; done` and confirm it succeeded. Update the artifact and the log.
Then answer or park the questions each agent raised in the ledger.

## 5. Finish
- Task statuses current, `npm run tasks` regenerated, READMEs and `shared/README.md` updated, everything pushed.
- Reply: the live URL, what changed in a line, what the owner must review (content, wording, taste), what was **not verified** (real device, real voice, full play-through) and the open questions. Say plainly what you skipped.
- A final republish of the artifact with every node `done` or `review`.

## Gotchas
- `.gitignore` must contain `node_modules` without a trailing slash, or a symlinked `node_modules` in a worktree gets committed.
- Never `git add -A` at the repo root in a worktree; add paths.
- Several tasks appending to one CSS file will conflict: assign sections or serialise.
- Agents tend to report "tested" after loading only the first screen; ask what was actually driven and report that honestly.
- If personal data was committed, tell the owner at once; it needs a history rewrite, not a new commit.
- Do not call a node `done` on an agent's word alone: merge it and run the checks first.
