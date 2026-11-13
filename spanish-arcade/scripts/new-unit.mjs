// npm run new:unit -- <courseId> <unit> <section> [--recap]: creates courses/<id>/units/<unitId>.json (draft, dev) and vocab/<unitId>.json.
// Tested in test/scaffold.test.js. The placeholder exercises use authored items only, so a new unit validates before any vocab exists.
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const APP = fileURLToPath(new URL('..', import.meta.url));

const placeholders = () => [
  { id: 'draft-gaps', archetype: 'fill-gap-choice', difficulty: 1,
    params: { items: [{ text: 'Yo ___ una pelota.', options: ['tengo', 'tienes', 'tiene'], answer: 'tengo' }, { text: '¿Dónde ___ el gato?', options: ['está', 'estás', 'estoy'], answer: 'está' }, { text: 'Nosotros ___ en casa.', options: ['estamos', 'están', 'estáis'], answer: 'estamos' }] },
    prompt: { es: 'Completa la frase.', en: 'Fill the gap.' } },
  { id: 'draft-odd', archetype: 'odd-one-out', difficulty: 1,
    params: { groups: [{ words: ['gato', 'perro', 'pez'], odd: 'mesa', theme: 'animales' }, { words: ['rojo', 'azul', 'verde'], odd: 'lápiz', theme: 'colores' }], size: 4 },
    prompt: { es: '¿Cuál sobra?', en: 'Which one does not belong?' } },
  { id: 'draft-read', archetype: 'read-answer', difficulty: 1,
    params: { text: ['Mira tiene un loro.', 'El loro es verde.', 'Come fruta por la mañana.'], emoji: '🦜', questions: [{ q: '¿Qué tiene Mira?', options: ['un loro', 'un gato', 'un pez'], answer: 0, evidence: 0 }, { q: '¿De qué color es?', options: ['rojo', 'verde', 'azul'], answer: 1, evidence: 1 }, { q: '¿Cuándo come?', options: ['de noche', 'por la mañana', 'nunca'], answer: 1, evidence: 2 }] },
    prompt: { es: 'Lee y contesta.', en: 'Read and answer.' } },
  { id: 'draft-spell', archetype: 'spell-fill-letters', difficulty: 1,
    params: { items: [{ es: 'perro' }, { es: 'cumpleaños' }, { es: 'pingüino' }] },
    prompt: { es: 'Completa la palabra.', en: 'Complete the word.' } },
  { id: 'draft-order', archetype: 'order-words', difficulty: 1,
    params: { items: [{ es: '¿Dónde está el gato?', emoji: '🐱' }, { es: 'Hoy es lunes.', emoji: '📅' }] },
    prompt: { es: 'Ordena la frase.', en: 'Put the sentence in order.' } },
];

/** Returns the written paths; throws a readable Error. Dev: true keeps the placeholder out of production until the author replaces it. */
export function scaffoldUnit(courseId, unit, section, { recap = false, app = APP } = {}) {
  const cfile = join(app, 'courses', courseId ?? '', 'course.json');
  if (!courseId || !existsSync(cfile)) throw new Error(`course "${courseId}" not found (npm run new:course -- <courseId> first)`);
  const course = JSON.parse(readFileSync(cfile, 'utf8'));
  const u = Number(unit), s = Number(section);
  if (!Number.isInteger(u) || u < 0 || (!recap && (!Number.isInteger(s) || s < 1))) throw new Error('usage: new:unit <courseId> <unit> <section> [--recap]');
  const id = recap ? `${course.unitPrefix}u${u}-recap` : `${course.unitPrefix}u${u}-s${s}`;
  const unitPath = join(app, 'courses', courseId, 'units', `${id}.json`);
  const vocabPath = join(app, 'courses', courseId, 'vocab', `${id}.json`);
  if (existsSync(unitPath) || existsSync(vocabPath)) throw new Error(`unit ${id} already exists`);
  const data = { schema: 1, id, rev: 1, order: u * 100 + (recap ? 90 : s * 10), status: 'draft', dev: true,
    title: { es: recap ? `Unidad ${u} · repaso (borrador)` : `Unidad ${u} · sesión ${s} (borrador)`, en: `Unit ${u}${recap ? ' recap' : `, section ${s}`} (draft)` },
    bookRef: recap ? { unit: u } : { unit: u, session: s }, theme: 'sunny',
    intro: { es: '¡Vamos a practicar!', en: "Let's practise!" },
    badge: { name: { es: '¡Buen trabajo!', en: 'Good work' }, icon: '⭐' },
    pass: { minCorrect: 3 }, exercises: placeholders() };
  mkdirSync(join(app, 'courses', courseId, 'units'), { recursive: true });
  mkdirSync(join(app, 'courses', courseId, 'vocab'), { recursive: true });
  writeFileSync(unitPath, JSON.stringify(data, null, 2) + '\n');
  writeFileSync(vocabPath, JSON.stringify({ schema: 1, words: [] }, null, 2) + '\n');
  return [`courses/${courseId}/units/${id}.json`, `courses/${courseId}/vocab/${id}.json`];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2).filter((a) => a !== '--recap');
  try {
    const written = scaffoldUnit(args[0], args[1], args[2], { recap: process.argv.includes('--recap') });
    console.log(`created:\n${written.map((f) => `  spanish-arcade/${f}`).join('\n')}
Next: fill the vocab file first, then replace the five placeholder exercises (docs/AUTHORING.md), 5-6 exercises, at least 3 archetypes with one listening and one spelling.
The unit is "dev": true and "status": "draft" so it never reaches production. When it is ready: delete "dev", set "status": "review", run npm run check:content.`);
  } catch (e) { console.error(`error: ${e.message}`); process.exit(1); }
}
