# 4. Review checklist (for a fluent or native Spanish speaker)

Play the unit (`npm run dev`, open `/spanish-arcade/`, debug mode on, or the Laboratorio for single exercises), with the table of strings from the draft prompt beside you.

- [ ] Spanish is correct: accents, ñ, ü, ¿ ? and ¡ ! at both ends, gender and number agreement, verb forms, capitals (days and months lowercase).
- [ ] Natural Spain Spanish a child of the target age knows; no regionalisms unless the course says so.
- [ ] Exactly one right answer per round; wrong options are plausible but really wrong (for example, two valid word orders in `order-words`).
- [ ] Reading questions can be answered from the text; inference questions are fair.
- [ ] Difficulty fits the audience; the unit is not trivial for children who already speak Spanish.
- [ ] Kid-safe: nothing scary, unkind, branded or adult; no recognisable characters, brands or songs.
- [ ] All names are invented; nothing looks like a real child, school or town.
- [ ] Nothing reads like the book (if you own it: no sentence or item you recognise). `npm run check:overlap` was run.
- [ ] English glosses are short and right (metadata, never shown).

Approve with a commit "Approve <unitId>" that changes `"status": "review"` to `"approved"` in the unit and the notes file. Only the repo owner merges.

To get an assistant's first pass, paste: "Check the strings in this table against the checklist above and list every problem with exercise id and a suggested fix. Do not rewrite items that are fine."
