#!/usr/bin/env bash
# Vendor the chosen superpowers skills (github.com/obra/superpowers, MIT) into .claude/skills/, verbatim.
# Usage: scripts/sync-superpowers.sh [git-ref]   (default: the latest release tag). Then review the diff,
# update the version in .claude/skills/SUPERPOWERS.md and AGENTS.md if overrides need changing.
set -euo pipefail
SKILLS="brainstorming writing-plans executing-plans subagent-driven-development dispatching-parallel-agents
test-driven-development systematic-debugging verification-before-completion requesting-code-review
receiving-code-review using-git-worktrees finishing-a-development-branch"
root=$(git rev-parse --show-toplevel)
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
git clone -q https://github.com/obra/superpowers "$tmp/sp"
ref=${1:-$(git -C "$tmp/sp" describe --tags --abbrev=0)}
git -C "$tmp/sp" checkout -q "$ref"
for s in $SKILLS; do rm -rf "$root/.claude/skills/$s"; cp -R "$tmp/sp/skills/$s" "$root/.claude/skills/$s"; done
cp "$tmp/sp/LICENSE" "$root/.claude/skills/SUPERPOWERS-LICENSE"
echo "vendored superpowers $ref ($(git -C "$tmp/sp" rev-parse --short HEAD)): update the version line in .claude/skills/SUPERPOWERS.md"
