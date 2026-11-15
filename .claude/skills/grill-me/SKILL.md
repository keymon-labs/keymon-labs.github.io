---
name: grill-me
description: >
  Interview the owner until a fuzzy goal or plan is clear, one question at a time,
  each with a recommended answer. Use when the user says "grill me", asks to be
  questioned, or when a request is vague, has several very different readings, or
  carries lock-out, data-loss or exposure risk and needs decisions first.
version: 1.0.0
shared: [keymon-labs, keyhouse-config]
---

# Grill me

Goal: reach a shared, concrete plan by asking the questions that change what gets built. Not a form, not a checklist.

## How
1. First read the repo (CLAUDE.md, the docs, the task). Never ask what the files or the machine already answer.
2. Ask **one question at a time**. Each has 2-3 options, your **recommendation first** with a one-line why, and the cost of being wrong. Use the AskUserQuestion tool when available.
3. Walk the decision tree in dependency order: decisions that unblock others come first. When an answer closes a branch, say so and skip it.
4. Push back when an answer conflicts with an earlier one, with CLAUDE.md principles, or with security. Say it plainly, then let the owner decide.
5. Stop when the remaining questions would not change the plan. Don't ask for the sake of asking: if a sensible default exists, state it and move on.

## Output
End with a short summary: decisions made (and why), open items, and where they were recorded. Record decisions where the repo keeps them, otherwise in the reply. New work becomes task files.
