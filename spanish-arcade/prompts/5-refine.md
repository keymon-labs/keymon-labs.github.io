# 5. Refine an existing unit (repo only)

```text
Improve unit <unitId> in courses/<courseId>/. Problems to fix: <list, or "see the review comments">.
Rules:
- Never change the unit id, any word id, any existing exercise id, or the course id.
- Small fix (typo, accent, better distractor): edit in place, keep "status": "approved", no rev bump unless the
  rounds change meaningfully.
- Reworked exercise: give it a NEW id, bump "rev" by 1, set the unit "status" back to "review".
- Never delete a word that another unit selects.
- New text is original; do not copy from any book. Invented names only. Spain Spanish.
Run `npm run check:units` and `npm test`, fix all errors, and list each changed Spanish string
(exercise id | old | new).
```
