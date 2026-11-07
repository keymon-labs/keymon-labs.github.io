---
id: "000"
title: Plan review (gate before any implementation or design)
model: Opus 5.5
why_model: Contracts and architecture are costly to get wrong; every other task builds on them.
kind: review
status: done
depends_on: []
touches: [spanish-arcade/docs/**, spanish-arcade/tasks/**]
---
## Prompt
Review `spanish-arcade/docs/PLAN.md`, `ARCHETYPES.md`, `UNITS.md`, `BOOK-NOTES.md` and every task file as a senior engineer and a primary-school teacher would. Look for: contract gaps that would make parallel tasks collide; schema/migration flaws; export/import design problems; kid-UX and accessibility issues for young children; privacy and content-handling risks in a public repo; tasks that are too big, mis-ordered or have the wrong model; missing acceptance checks. Return ranked findings with concrete fixes. Don't implement.

## Acceptance
- Findings listed by severity, each with a fix.
- Fixes applied to the docs and tasks (or explicitly declined with a reason) before 001 and 002 start.

## Notes
Done in the planning chat via an Opus subagent; its blockers and major findings were folded into `docs/PLAN.md`, the docs and these tasks (stable exercise ids + `rev`, UUID profile ids, glob-discovered archetypes/units/vocab, archetype/ctx contract, export merge rules, stars/unlock rules, originality rules, task split).
