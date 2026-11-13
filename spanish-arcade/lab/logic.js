// Pure helpers for the lab page (lab.js): deep links, params editor validation, lab unit/session, result log, feedback note.
import { checkParams } from '../core/schema.js';
import { resolveParams, seedFor } from '../core/generate.js';
import { createUnitSession } from '../core/session.js';

/** ?unit=&exercise=&archetype=&seed=&difficulty= -> plain object (only valid values). */
export function parseQuery(search) {
  const q = new URLSearchParams(search);
  const int = (k, min, max) => { const v = q.get(k); return v !== null && /^\d+$/.test(v) && +v >= min && +v <= max ? +v : null; };
  const text = (k) => (/^[\w-]{1,60}$/.test(q.get(k) ?? '') ? q.get(k) : null);
  return { unit: text('unit'), exercise: text('exercise'), archetype: text('archetype'), seed: int('seed', 0, 4294967295), difficulty: int('difficulty', 1, 3) };
}

const TRANSLATE = [
  [/^must be a whole number$/, () => 'debe ser un número entero'],
  [/^must be at least (.+)$/, (m) => `debe ser al menos ${m[1]}`],
  [/^must be at most (.+)$/, (m) => `debe ser como máximo ${m[1]}`],
  [/^must be true or false$/, () => 'debe ser true o false'],
  [/^must be text$/, () => 'debe ser texto entre comillas'],
  [/^must be one of (.+)$/, (m) => `debe ser uno de: ${m[1]}`],
  [/^must be a list$/, () => 'debe ser una lista [ ]'],
  [/^needs at least (.+) items$/, (m) => `necesita al menos ${m[1]} elementos`],
  [/^must be an object$/, () => 'debe ser un objeto { }'],
  [/^missing$/, () => 'falta (es obligatorio)'],
  [/^unknown (param|field)$/, () => 'no existe (campo desconocido)'],
];
const translate = (msg) => { for (const [re, f] of TRANSLATE) { const m = re.exec(msg); if (m) return f(m); } return msg; };

/** "params.from.n: must be at least 1" -> "from.n: debe ser al menos 1" */
export function readableError(e) {
  const i = e.indexOf(': ');
  return `${e.slice(0, i).replace(/^params\.?/, '') || 'parámetros'}: ${translate(e.slice(i + 2))}`;
}

/** Text of the editor -> { params, errors[] } (errors in Spanish). Validates the merged params (schema defaults + difficulty defaults + yours). */
export function parseParams(text, archetype, difficulty = 1) {
  let own;
  try { own = text.trim() === '' ? {} : JSON.parse(text); } catch (e) {
    const at = /position (\d+)/.exec(e.message);
    return { params: null, errors: [`JSON no válido${at ? ` cerca del carácter ${at[1]}` : ''}: revisa comas, comillas y llaves.`] };
  }
  if (own === null || typeof own !== 'object' || Array.isArray(own)) return { params: null, errors: ['Los parámetros deben ser un objeto { }.'] };
  const merged = resolveParams(archetype, { difficulty, params: own });
  const errors = checkParams(archetype.paramsSchema, merged).map(readableError);
  return errors.length ? { params: null, errors } : { params: own, errors: [] };
}

/** A starting point for the editor: archetypes with a `from` selector get n=4; the ones that need lists get a tiny invented example. */
export const STARTERS = {
  'spell-fill-letters': { items: [{ es: 'perro' }, { es: 'cumpleaños' }, { es: 'pingüino' }] },
  'order-words': { items: [{ es: '¿Dónde está el gato?', emoji: '🐱' }, { es: 'Hoy es lunes.', emoji: '📅' }] },
  // --- question-maker sample (invented) ---
  'question-maker': { items: [
    { answer: 'Vivo en una casa azul.', focus: 'en una casa azul', question: '¿Dónde vives?', wrong: ['¿Dónde vivo?'], emoji: '🏠' },
    { answer: 'Llego tarde porque perdí el autobús.', focus: 'porque perdí el autobús', question: '¿Por qué llegas tarde?', emoji: '🚌' },
    { answer: 'Mi hermano tiene tres gatos.', focus: 'tres', question: '¿Cuántos gatos tiene tu hermano?', emoji: '🐱' },
    { answer: 'Mañana juego con Ana.', focus: 'con Ana', question: '¿Con quién juegas mañana?', emoji: '⚽' },
  ], build: 'tiles' },
  // --- end question-maker sample ---
  // paragraph-editor
  'paragraph-editor': { texts: [
    { text: 'Ayer fuimos al río con mis tíos. El agua estaba muy fría y las piedras eran resbaladizas. ¿Quién quiere volver mañana?', errors: [{ at: 3, as: 'rio', kind: 'accent' }, { at: 16, as: 'resbaladizos.', kind: 'agreement' }, { at: 17, as: 'Quién', kind: 'punctuation' }] },
    { text: 'Mi hermana tiene un perro pequeño. Cada día lo saca al parque y juega con él. Es muy simpático.', errors: [{ at: 5, as: 'pequeña.', kind: 'agreement' }, { at: 9, as: 'sacan', kind: 'verb' }, { at: 15, as: 'el.', kind: 'accent' }] }] },
  // end paragraph-editor
  'read-answer': { text: ['Ana tiene un gato.', 'El gato es negro.'], questions: [{ q: '¿De qué color es el gato?', options: ['negro', 'blanco', 'verde'], answer: 0, evidence: 1 }] },
  // clue-detective
  'clue-detective': { cases: [{ suspects: [{ name: 'Nico', emoji: '🧑‍🍳', place: 'cocina' }, { name: 'Rita', emoji: '👩‍🔬', place: 'jardín' }, { name: 'Teo', emoji: '🧑‍🎨', place: 'cocina' }, { name: 'Lola', emoji: '👩‍🚀', place: 'salón' }], clues: ['No está en el jardín.', 'Está en la cocina, pero no pinta cuadros.'], answer: 0, rules: [[1], [2, 3]] }] },
};
/** examples = { "../archetypes/<id>/example.json": params } (import.meta.glob in lab.js): a new archetype needs no STARTERS entry. */
export function starterParams(archetype, examples = {}) {
  const own = STARTERS[archetype.id] ?? examples[`../archetypes/${archetype.id}/example.json`];
  if (own) return structuredClone(own);
  return 'from' in (archetype.paramsSchema || {}) ? { from: { n: 4 } } : {};
}

/** Short stable id of a params object, for notes. */
export const paramsHash = (params) => seedFor(JSON.stringify(params ?? {})).toString(16).padStart(8, '0').slice(0, 6);

export function makeNote({ archetype, exercise, params, seed, text = '' }) {
  const what = exercise || `params ${paramsHash(params)}`;
  return `laboratorio: ${archetype} ${what} seed ${seed}${text.trim() ? ` — ${text.trim()}` : ''}`;
}

/**
 * A one-exercise unit for the real session. base = a real unit (keeps its id, so "words taught so far" works);
 * without base the unit is unknown to the content and every word is allowed.
 */
export function buildLabUnit({ archetype, exerciseId = 'lab', difficulty = 1, params = {}, base = null, prompt }) {
  const exercise = { id: exerciseId, archetype, difficulty, params, ...(prompt ? { prompt } : {}) };
  return { ...(base ?? { id: 'lab-unit' }), rev: 1, pass: { minCorrect: 1 }, exercises: [exercise] };
}

/** The real session (core/session.js): hint after 1 miss, reveal after 2, retry after that. */
export const createLabSession = ({ unit, content, seed }) => createUnitSession({ unit, content, seed });

/** Skip the current round: the session has no skip, so resume a snapshot one round further. */
export function skipRound(unit, content, session) {
  const snap = session.snapshot();
  const { rounds } = session.current;
  snap.misses = 0;
  if (snap.roundIndex + 1 >= rounds) { snap.exerciseIndex++; snap.roundIndex = 0; } else snap.roundIndex++;
  return createUnitSession({ unit, content, seed: snap.seed, resume: snap });
}

/** Result log: one row per round left behind. */
export function createLog() {
  const rows = [];
  return {
    rows,
    add({ misses, skipped = false }) { rows.push({ round: rows.length + 1, correct: !skipped, misses, skipped }); },
    summary: () => ({ rondas: rows.length, correctas: rows.filter((r) => r.correct).length, saltadas: rows.filter((r) => r.skipped).length, fallos: rows.reduce((n, r) => n + r.misses, 0) }),
  };
}
