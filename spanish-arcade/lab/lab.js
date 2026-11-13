// Lab page: plays any archetype with editable params through the real session (core/session.js). Not for children.
// Nothing is saved (no storage, no service worker). Logic in logic.js, sample vocab in sample.js, styles in lab.css.
import { loadContent } from '../core/content.js';
import { createSpeech } from '../ui/speech.js';
import { SAMPLE_WORDS } from './sample.js';
import { parseQuery, parseParams, starterParams, makeNote, buildLabUnit, createLabSession, skipRound, createLog } from './logic.js';

const NEXT_DELAY = 500;
const root = document.getElementById('app');
const speech = createSpeech();
const real = loadContent({ includeDev: import.meta.env.DEV }); // production: real units only
const archetypes = Object.values(real.archetypeById).sort((a, b) => a.id.localeCompare(b.id));
const query = parseQuery(location.search);
const examples = import.meta.glob('../archetypes/*/example.json', { eager: true, import: 'default' }); // starter params for archetypes without a STARTERS entry

function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on')) el[k] = v; else if (k === 'class') el.className = v; else if (v !== false) el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...kids.flat().filter((k) => k != null));
  return el;
}
const opt = (value, text, selected) => h('option', { value, selected: selected || false }, text);
const json = (v) => JSON.stringify(v, null, 2);
const newSeed = () => Math.floor(Math.random() * 1e9);

// ---- state
const unitFromQuery = real.unitById[query.unit];
const exFromQuery = unitFromQuery?.exercises.find((e) => e.id === query.exercise);
const st = {
  archetype: exFromQuery?.archetype ?? (real.archetypeById[query.archetype] ? query.archetype : archetypes[0].id),
  unit: unitFromQuery ? unitFromQuery.id : '', exercise: exFromQuery ? exFromQuery.id : '',
  vocab: exFromQuery ? 'reales' : 'ejemplo',
  difficulty: query.difficulty ?? exFromQuery?.difficulty ?? 1,
  seed: query.seed ?? newSeed(), sound: true, reduced: false, textSize: 1,
};
let session = null, unit = null, content = null, mounted = null, timer = null, log = createLog(), lastHint = null, busy = false;
const arch = () => real.archetypeById[st.archetype];
const baseUnit = () => (st.vocab === 'reales' ? real.unitById[st.unit] ?? null : null);
const exerciseDef = () => real.unitById[st.unit]?.exercises.find((e) => e.id === st.exercise);

// ---- controls
const el = {};
el.archetype = h('select', { id: 'archetype', onchange: () => { st.archetype = el.archetype.value; st.exercise = ''; el.exercise.value = ''; el.params.value = json(starterParams(arch(), examples)); apply(); } },
  archetypes.map((a) => opt(a.id, `${a.emoji ?? ''} ${a.title.es} (${a.id})`, a.id === st.archetype)));
el.unit = h('select', { id: 'unit', onchange: () => { st.unit = el.unit.value; st.exercise = ''; fillExercises(); } },
  [opt('', '(ninguna)', !st.unit), ...real.units.map((u) => opt(u.id, `${u.title.es} (${u.id})`, u.id === st.unit))]);
el.exercise = h('select', { id: 'exercise', onchange: () => { st.exercise = el.exercise.value; loadExercise(); } });
el.vocab = h('select', { id: 'vocab', onchange: () => { st.vocab = el.vocab.value; apply(); } },
  [opt('ejemplo', 'Datos de ejemplo (inventados)', st.vocab === 'ejemplo'), opt('reales', 'Vocabulario real cargado', st.vocab === 'reales')]);
el.difficulty = h('select', { id: 'difficulty', onchange: () => { st.difficulty = +el.difficulty.value; apply(); } },
  [1, 2, 3].map((d) => opt(d, `Dificultad ${d}`, d === st.difficulty)));
el.textSize = h('select', { id: 'text-size', onchange: () => { st.textSize = +el.textSize.value; document.documentElement.style.fontSize = `${st.textSize * 100}%`; } },
  [[1, 'Texto normal'], [1.25, 'Texto grande'], [1.5, 'Texto muy grande']].map(([v, t]) => opt(v, t, v === 1)));
el.sound = h('input', { type: 'checkbox', id: 'sound', checked: true, onchange: () => { st.sound = el.sound.checked; apply(); } });
el.reduced = h('input', { type: 'checkbox', id: 'reduced', onchange: () => { st.reduced = el.reduced.checked; document.body.classList.toggle('reduced', st.reduced); apply(); } });
el.seed = h('input', { type: 'number', id: 'seed', min: 0, value: st.seed, onchange: () => { st.seed = Math.max(0, Math.floor(+el.seed.value) || 0); apply(); } });
el.params = h('textarea', { id: 'params', spellcheck: 'false', 'aria-describedby': 'errors' });
el.errors = h('ul', { id: 'errors', class: 'errors', role: 'alert', hidden: true });
el.noteText = h('input', { id: 'note-text', placeholder: 'Qué has visto (opcional)' });
el.copyMsg = h('span', { id: 'copy-msg', role: 'status', class: 'muted' });
el.stage = h('div', { id: 'stage' });
el.live = h('div', { id: 'live', 'aria-live': 'polite' });
el.round = h('pre', { id: 'round-json' });
el.state = h('pre', { id: 'state-json' });
el.logBody = h('tbody');

function fillExercises() {
  const u = real.unitById[st.unit];
  el.exercise.replaceChildren(opt('', '(ninguno)', !st.exercise), ...(u?.exercises ?? []).map((e) => opt(e.id, `${e.id} · ${e.archetype}`, e.id === st.exercise)));
  el.exercise.disabled = !u;
}
function loadExercise() {
  const e = exerciseDef();
  if (!e) return;
  st.archetype = e.archetype; el.archetype.value = e.archetype;
  st.difficulty = e.difficulty ?? 1; el.difficulty.value = st.difficulty;
  st.vocab = 'reales'; el.vocab.value = 'reales';
  el.params.value = json(e.params ?? {});
  apply();
}

// ---- play
const speechOk = () => speech.available && st.sound;
const ctx = {
  t: (k) => k, difficulty: 1,
  say: (text, opts) => (st.sound ? speech.say(text, opts) : Promise.resolve(false)),
  canSpeak: false, sfx: () => {}, mascot: () => {}, reducedMotion: false,
  async submit(answer) {
    if (busy) return { ...lastResult, ignored: true };
    const before = session.current.misses;
    const r = session.submit(answer);
    lastResult = r;
    lastHint = r.action === 'next' ? lastHint : { action: r.action, hint: r.hint };
    if (r.action === 'next') {
      log.add({ misses: before });
      busy = true; lastHint = null;
      timer = setTimeout(show, NEXT_DELAY);
    }
    refresh(r);
    return r;
  },
};
let lastResult = null;

function show() {
  mounted?.destroy(); mounted = null;
  busy = false; lastResult = null;
  if (session.done) { el.stage.replaceChildren(h('p', { id: 'finished' }, '¡Terminado! Pulsa «Nueva semilla» para repetir.')); return refresh(); }
  const cur = session.current;
  const host = h('div', { id: 'round' });
  ctx.difficulty = st.difficulty;
  ctx.canSpeak = speechOk();
  ctx.reducedMotion = st.reduced;
  el.stage.replaceChildren(h('p', { class: 'muted', id: 'progress' }, `Ronda ${cur.roundIndex + 1}/${cur.rounds}`), exercisePrompt(), host,
    h('button', { type: 'button', id: 'skip', onclick: skip }, 'Saltar ronda'));
  mounted = cur.archetype.mount(host, cur.round, ctx);
  refresh();
}
const exercisePrompt = () => h('p', { id: 'exercise-prompt' }, exerciseDef()?.prompt?.es ?? '');

function skip() {
  if (!session || session.done) return;
  log.add({ misses: session.current.misses, skipped: true });
  clearTimeout(timer); lastHint = null;
  session = skipRound(unit, content, session);
  show();
}

function refresh() {
  const cur = session?.current;
  el.round.textContent = cur ? json(cur.round) : '(sin ronda)';
  el.state.textContent = json({ fallos: cur?.misses ?? 0, ultimaRespuesta: lastResult ? { correcta: lastResult.correct, accion: lastResult.action } : null, pista: lastHint });
  el.logBody.replaceChildren(...log.rows.map((r) => h('tr', {}, h('td', {}, r.round), h('td', {}, r.correct ? 'sí' : 'no'), h('td', {}, r.misses), h('td', {}, r.skipped ? 'sí' : 'no'))));
}

async function apply() {
  clearTimeout(timer); mounted?.destroy(); mounted = null;
  const { params, errors } = parseParams(el.params.value, arch(), st.difficulty);
  el.errors.hidden = !errors.length;
  el.errors.replaceChildren(...errors.map((e) => h('li', {}, e)));
  if (!params) return;
  const baseU = baseUnit();
  const e = exerciseDef();
  content = st.vocab === 'ejemplo' ? { ...real, words: SAMPLE_WORDS } : real;
  unit = buildLabUnit({ archetype: st.archetype, exerciseId: e && baseU ? e.id : 'lab', difficulty: st.difficulty, params, base: baseU });
  log = createLog(); lastHint = null;
  const q = new URLSearchParams({ archetype: st.archetype, seed: st.seed, difficulty: st.difficulty });
  if (st.unit && st.exercise) { q.set('unit', st.unit); q.set('exercise', st.exercise); }
  history.replaceState(null, '', `?${q}`);
  const mine = (session = createLabSession({ unit, content, seed: st.seed }));
  await speech.ready();
  if (session !== mine) return; // another apply() ran meanwhile
  if (session.done) { el.stage.replaceChildren(h('p', { id: 'empty' }, 'Estos parámetros no generan ninguna ronda (faltan palabras).')); return refresh(); }
  show();
}

function newSeedClick() { st.seed = newSeed(); el.seed.value = st.seed; apply(); }
async function copyNote() {
  const { params } = parseParams(el.params.value, arch(), st.difficulty);
  const note = makeNote({ archetype: st.archetype, exercise: st.exercise || null, params, seed: st.seed, text: el.noteText.value });
  try { await navigator.clipboard.writeText(note); el.copyMsg.textContent = 'Nota copiada.'; } catch { el.copyMsg.textContent = `No se pudo copiar. Nota: ${note}`; }
}

// ---- page
const footer = h('footer', {}, `Laboratorio v1 · versión ${__BUILD__} · © 2026 keymon-labs · `,
  h('a', { href: 'https://github.com/keymon-labs/keymon-labs.github.io/blob/main/NOTICE.md' }, 'CC BY-NC-SA 4.0'));
const field = (id, label, control) => h('label', { for: id }, label, control);
root.append(h('main', { class: 'lab-form' },
  h('h1', { tabindex: '-1' }, 'Laboratorio'), h('p', {}, h('span', { class: 'badge' }, 'Laboratorio · no es para niños')),
  h('p', { class: 'muted' }, 'Prueba un juego con parámetros propios. No se guarda nada.'),
  field('archetype', 'Juego (arquetipo)', el.archetype),
  field('unit', 'Unidad', el.unit), field('exercise', 'Ejercicio de la unidad', el.exercise),
  field('vocab', 'Palabras', el.vocab),
  h('div', { class: 'row' }, field('difficulty', 'Dificultad', el.difficulty), field('text-size', 'Tamaño del texto', el.textSize)),
  h('label', { class: 'check' }, el.sound, 'Sonido y voz (si hay voz en español)'),
  h('label', { class: 'check' }, el.reduced, 'Reducir movimiento'),
  h('div', { class: 'row' }, field('seed', 'Semilla', el.seed), h('button', { type: 'button', id: 'new-seed', onclick: newSeedClick }, 'Nueva semilla')),
  field('params', 'Parámetros (JSON)', el.params), el.errors,
  h('button', { type: 'button', id: 'apply', onclick: apply }, 'Aplicar y jugar'),
  h('button', { type: 'button', id: 'reset-params', onclick: () => { el.params.value = json(exerciseDef()?.params ?? starterParams(arch(), examples)); apply(); } }, 'Restablecer parámetros'),
  el.stage, el.live,
  h('section', { class: 'panel' }, h('h2', {}, 'Ronda actual'), el.round, h('h2', {}, 'Estado'), el.state),
  h('section', { class: 'panel' }, h('h2', {}, 'Resultados'),
    h('table', { class: 'log' }, h('thead', {}, h('tr', {}, ['Ronda', 'Correcta', 'Fallos', 'Saltada'].map((t) => h('th', {}, t)))), el.logBody)),
  h('section', { class: 'panel' }, h('h2', {}, 'Nota'), field('note-text', 'Comentario', el.noteText),
    h('button', { type: 'button', id: 'copy-note', onclick: copyNote }, 'Copiar nota'), el.copyMsg)), footer);

el.params.value = json(exFromQuery?.params ?? starterParams(arch(), examples));
fillExercises();
window.__spanishLab = { st, get session() { return session; }, apply, real, get log() { return log; } };
apply();
