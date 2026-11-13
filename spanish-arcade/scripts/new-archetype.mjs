// npm run new:archetype <id>: copies archetypes/_template/*.tpl to archetypes/<id>/ (+ test/<id>.test.js) and prints the manual steps.
// Pure part (scaffoldArchetype) is unit-tested in test/scaffold.test.js.
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const APP = fileURLToPath(new URL('..', import.meta.url));
export const ARCHETYPE_ID = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const FILES = [['index.js.tpl', 'archetypes/__ID__/index.js'], ['logic.js.tpl', 'archetypes/__ID__/logic.js'], ['README.md.tpl', 'archetypes/__ID__/README.md'],
  ['example.json.tpl', 'archetypes/__ID__/example.json'], ['test.js.tpl', 'test/__ID__.test.js']];

const titleOf = (id) => { const t = id.replace(/-/g, ' '); return t[0].toUpperCase() + t.slice(1); };

/** Writes the files under app (default: spanish-arcade/); throws a readable Error when the id is bad or taken. Returns the list of written paths. */
export function scaffoldArchetype(id, { app = APP } = {}) {
  if (!ARCHETYPE_ID.test(id ?? '')) throw new Error('archetype id: lowercase letters, numbers and single dashes, starting with a letter (e.g. "word-sort")');
  if (existsSync(join(app, 'archetypes', id))) throw new Error(`archetypes/${id} already exists`);
  if (existsSync(join(app, 'test', `${id}.test.js`))) throw new Error(`test/${id}.test.js already exists`);
  const sub = (s) => s.replaceAll('__ID__', id).replaceAll('__TITLE__', titleOf(id)).replaceAll('__SKILL__', 'puzzle');
  const written = [];
  for (const [from, to] of FILES) {
    const out = join(app, sub(to));
    mkdirSync(join(out, '..'), { recursive: true });
    writeFileSync(out, sub(readFileSync(join(app, 'archetypes/_template', from), 'utf8')));
    written.push(sub(to));
  }
  return written;
}

export function nextSteps(id) {
  return `
Next steps for "${id}":
 1. Try it in the lab: npm run dev, then open  http://localhost:5173/spanish-arcade/lab/?archetype=${id}
    (the lab starts from archetypes/${id}/example.json, so lab/logic.js needs no STARTERS entry; add one only for a different starter).
    Edit the params in the lab, play it, then copy the final params back into example.json. Do this before opening a PR.
 2. Replace the sample game in archetypes/${id}/{index.js,logic.js}; keep make/judge/hint pure and use only the rng for randomness.
    Update paramsSchema, README.md (params table + unit example) and the test; learner text is Spanish only.
 3. Styles: append a section to spanish-arcade/style.css (tap targets at least 48px):
      /* ${id} */
      .${id} { display: flex; flex-direction: column; gap: 8px; }
      .${id}-opt { min-height: 48px; }
      .${id}-opt.reveal { outline: 3px solid currentColor; }
 4. Tick it in docs/ARCHETYPES.md. Do not add it to a unit yet (that is a content PR).
 5. npm test && npm run build && npm run check:content`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const written = scaffoldArchetype(process.argv[2]);
    console.log(`created:\n${written.map((f) => `  spanish-arcade/${f}`).join('\n')}${nextSteps(process.argv[2])}`);
  } catch (e) { console.error(`error: ${e.message}`); process.exit(1); }
}
