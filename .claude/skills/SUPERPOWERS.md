# Vendored superpowers skills

Source: https://github.com/obra/superpowers, **v7.0.2** (commit 22f0b46, 2026-11-03), © 2025 Jesse Vincent, MIT licence: [SUPERPOWERS-LICENSE](SUPERPOWERS-LICENSE).
Copied verbatim by `scripts/sync-superpowers.sh` so every session (Claude app, claude.ai, Claude Code) has them without installing a plugin. Don't edit these folders; repo-specific rules and overrides live in [AGENTS.md](../../AGENTS.md), which wins over the skills (superpowers itself says user instructions take precedence).

| Skill | Used here for |
|---|---|
| brainstorming | turning an idea into an approved design before any code |
| writing-plans | the step plan inside one code task |
| subagent-driven-development | coordinator executes a plan: fresh implementer per task, task review, final review |
| executing-plans | same plan, done inline by one session (no subagents) |
| dispatching-parallel-agents | independent investigations or fixes in parallel |
| test-driven-development | pure logic (`npm test` scope) |
| systematic-debugging | any bug or failing check, before proposing a fix |
| verification-before-completion | evidence before saying "done" |
| requesting-code-review / receiving-code-review | the task review gate, and handling its findings |
| using-git-worktrees | isolated checkouts for parallel workers |
| finishing-a-development-branch | merging a worker branch back to `main` |

Not vendored: `using-superpowers` (its "always load a skill first" bootstrap is replaced by the routing table in AGENTS.md, to keep mobile sessions cheap), `writing-skills` (large; use the `skill-creator` skill instead), `diagnosing-superpowers` (reads local session transcripts; not something for a public repo).

Text in these skills says `superpowers:<name>`; here the skill is just `<name>`. Paths like `docs/superpowers/plans/` are replaced by the locations in AGENTS.md.

Update: `scripts/sync-superpowers.sh [tag]`, read the release notes, review the diff, update the version above.
