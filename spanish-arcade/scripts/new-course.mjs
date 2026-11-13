// npm run new:course -- <courseId> --level A1 --semester 2: creates courses/<id>/{course.json,CREDITS.md} (status draft). Tested in test/scaffold.test.js.
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CEFR } from '../core/schema.js';

const APP = fileURLToPath(new URL('..', import.meta.url));
export const COURSE_ID = /^[a-z0-9]{2,12}(-[a-z0-9]+)*$/;

export const CREDITS = (id) => `# Credits: course ${id}

Content in this course (units, vocabulary, notes) is original work by keymon-labs contributors, © its contributors, licensed under CC BY-NC-SA 4.0 with the additional internal-use permission in [NOTICE.md](../../../NOTICE.md). It follows the topics and level of a course book for children; it is unofficial, not endorsed by the book's authors or publisher, and distributes no text, images or audio from the book. Names of people and pets are invented. To report material you believe infringes your rights, see NOTICE.md.
`;

const existing = (app) => { const dir = join(app, 'courses'); return existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory() && existsSync(join(dir, d.name, 'course.json'))).map((d) => ({ id: d.name, ...JSON.parse(readFileSync(join(dir, d.name, 'course.json'), 'utf8')) })) : []; };

/** Returns the written paths; throws a readable Error on a bad, existing or nested id. */
export function scaffoldCourse(id, { level = 'A1', semester, app = APP } = {}) {
  if (!COURSE_ID.test(id ?? '')) throw new Error('course id: 2-12 lowercase letters/numbers, dashes between parts (e.g. "a1s2"); describe level and part, not the book or a person');
  if (!CEFR.includes(level)) throw new Error(`--level must be one of ${CEFR.join(', ')}`);
  if (semester !== undefined && ![1, 2].includes(semester)) throw new Error('--semester must be 1 or 2');
  const others = existing(app);
  if (existsSync(join(app, 'courses', id))) throw new Error(`courses/${id} already exists`);
  const prefix = `${id}-`;
  const clash = others.find((c) => typeof c.unitPrefix === 'string' && (c.unitPrefix.startsWith(prefix) || prefix.startsWith(c.unitPrefix)));
  if (clash) throw new Error(`unit prefix "${prefix}" overlaps course "${clash.id}" (prefix "${clash.unitPrefix}"); choose another id`);
  const order = Math.max(0, ...others.map((c) => (typeof c.order === 'number' ? c.order : 0))) + 10;
  const part = semester ? `, part ${semester}` : '';
  const course = { schema: 1, id, unitPrefix: prefix, order,
    title: { es: `Español ${level}${semester ? ` · cuatrimestre ${semester}` : ''}`, en: `Spanish ${level}${part}` },
    level, ...(semester ? { semester } : {}), variety: 'es-ES',
    difficultyCap: [{ upToBookUnit: 4, max: 2 }], names: [], maintainers: [], status: 'draft' };
  mkdirSync(join(app, 'courses', id), { recursive: true });
  writeFileSync(join(app, 'courses', id, 'course.json'), JSON.stringify(course, null, 2) + '\n');
  writeFileSync(join(app, 'courses', id, 'CREDITS.md'), CREDITS(id));
  return [`courses/${id}/course.json`, `courses/${id}/CREDITS.md`];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
  try {
    const written = scaffoldCourse(args[0], { level: opt('level') ?? 'A1', semester: opt('semester') ? Number(opt('semester')) : undefined });
    console.log(`created:\n${written.map((f) => `  spanish-arcade/${f}`).join('\n')}\nNext: add "maintainers" (GitHub handles) and the invented "names" in course.json, then  npm run new:unit -- ${args[0]} 1 1`);
  } catch (e) { console.error(`error: ${e.message}`); process.exit(1); }
}
