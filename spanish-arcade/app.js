// App shell: hash routes, screen frame + footer, unit play through the session engine, diagnostics.
//   #/   #/profile/<id>   #/unit/<id>   #/settings
// Data: units/vocab/archetypes are bundled (core/content.js); progress lives in localStorage (core/profiles.js).
import { loadContent } from './core/content.js';
import { createStore } from './core/profiles.js';
import { createUnitSession } from './core/session.js';
import { recordUnit, recordExercise, unitProgress, applyRev, saveInProgress, isUnlocked, attemptSeed } from './core/progress.js';
import { createSpeech } from './ui/speech.js';
import { renderSettings } from './ui/settings.js';
import { registerServiceWorker } from '../shared/pwa.js';

const root = document.getElementById('app');
const speech = createSpeech();
const NEXT_DELAY = 700;
const SKIP_DELAY = 2000; // long enough to read the answer after "Saltar"

// Local-only error ring buffer (last 20). Nothing is sent anywhere.
const errors = [];
const logError = (msg) => { errors.push({ at: new Date().toISOString(), msg: String(msg).slice(0, 300) }); if (errors.length > 20) errors.shift(); };
addEventListener('error', (e) => logError(e.message));
addEventListener('unhandledrejection', (e) => logError(e.reason?.message ?? e.reason));

// Storage: probe a real write; a failing write is logged and play goes on in memory with a notice.
let unsaved = false;
const markUnsaved = (why) => { unsaved = true; logError(why); showUnsaved(); };
function safeStorage() {
  try {
    localStorage.setItem('spanish-arcade:probe', '1'); localStorage.removeItem('spanish-arcade:probe');
    return {
      getItem: (k) => localStorage.getItem(k),
      setItem: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { markUnsaved(`save failed: ${e.message}`); } },
      removeItem: (k) => localStorage.removeItem(k),
    };
  } catch (e) {
    unsaved = true; logError(`no browser storage: ${e.message}`);
    const m = new Map();
    return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
  }
}
const store = createStore({ storage: safeStorage() });
// Production builds leave out "dev" units (demo/test units).
const content = loadContent({ includeDev: import.meta.env.DEV });
for (const e of [...content.errors, ...(store.loadError ? [`store: ${store.loadError}`] : [])]) logError(e);
for (const p of store.data.profiles) { const next = applyRev(p, content.units); if (next !== p) store.update(p.id, () => next); }
const diagnostic = () => JSON.stringify({ app: 'spanish-arcade', build: __BUILD__, ua: navigator.userAgent, errors }, null, 2);

// Settings that change the page itself: text size (the page language is always Spanish).
function applySettings() {
  const { textSize } = store.data.settings;
  document.documentElement.style.fontSize = `${(textSize || 1) * 100}%`; // archetypes size in rem, so scale the root
}
applySettings();

// Parent gate hook: task 004 replaces this with the real gate (hold 2 s or a sum).
const gate = (run) => run();

/** h('button', {id: 'x', onclick}, 'text', child) */
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on')) el[k] = v; else if (k === 'class') el.className = v; else el.setAttribute(k, v);
  }
  el.append(...kids.flat().filter((k) => k != null));
  return el;
}
const link = (href, text, cls = 'btn') => h('a', { href, class: cls }, text);
const stars = (n) => h('span', { class: 'stars', role: 'img', 'aria-label': `${n} de 3 estrellas` }, '★'.repeat(n), h('span', {}, '★'.repeat(3 - n)));

function footer() {
  return h('footer', {}, `Arcade de español v1 · versión ${__BUILD__} · © 2026 keymon-labs · `,
    h('a', { href: 'https://github.com/keymon-labs/keymon-labs.github.io/blob/main/NOTICE.md' }, 'CC BY-NC-SA 4.0'));
}

let current = null; // mounted screen, if any: { destroy() }
let activeId = null;
const activeProfile = () => store.profile(activeId) ?? store.data.profiles[0] ?? null;

const unsavedNote = () => h('p', { id: 'unsaved', role: 'status', class: 'muted' }, 'El progreso no se guardará en este navegador.');
function showUnsaved() { const main = root.querySelector('main'); if (main && !root.querySelector('#unsaved')) main.prepend(unsavedNote()); }

/** Builds a screen: heading first (it gets focus on route change), then the rest. */
function screen(title, ...kids) {
  const main = h('main', {}, title ? h('h1', { tabindex: '-1' }, title) : null, ...kids);
  root.replaceChildren(main, footer());
  if (unsaved) showUnsaved();
  return main;
}

function route() {
  current?.destroy(); current = null;
  const [page, id, sub] = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const unit = content.unitById[id];
  const profile = activeProfile();
  if (page === 'profile' && store.profile(id)) { activeId = id; renderProfile(store.profile(id)); }
  else if (page === 'unit' && unit && profile && isUnlocked(profile, content.units, unit.id)) (sub === 'play' ? playUnit : renderIntro)(profile, unit);
  else if (page === 'settings') gate(renderSettingsScreen);
  else renderHome();
  root.querySelector('h1')?.focus();
}

function renderHome() {
  const profiles = store.data.profiles;
  const main = screen('Arcade de español');
  if (profiles.length) main.append(h('ul', { class: 'list' }, profiles.map((p) => h('li', {}, link(`#/profile/${p.id}`, p.firstName)))));
  if (profiles.length < 1) { // MVP: one profile
    const first = h('input', { id: 'first-name', required: '', autocomplete: 'off' });
    const form = h('form', { id: 'new-profile' }, h('label', {}, 'Nombre ', first), h('button', { type: 'submit' }, 'Empezar'));
    form.onsubmit = (e) => {
      e.preventDefault();
      if (!first.value.trim()) return;
      const p = store.addProfile({ firstName: first.value });
      location.hash = `#/profile/${p.id}`;
    };
    main.append(form);
  }
  main.append(link('#/settings', 'Ajustes'));
}

/** "3 de 6 ejercicios · seguir" / "6 de 6 ejercicios · mejor: 4 sin ayuda" / "sin empezar" */
function statusLine(up) {
  if (!up.started && !up.attempts) return 'Sin empezar';
  const bits = [`${up.doneCount} de ${up.total} ejercicios`];
  if (up.resumable) bits.push('para seguir');
  if (up.attempts) bits.push(`mejor: ${up.bestCorrect} de ${up.total} sin ayuda`, `intentos: ${up.attempts}`);
  return bits.join(' · ');
}

function renderProfile(profile) {
  const main = screen(`¡Hola, ${profile.firstName}!`);
  main.append(h('ul', { class: 'list' }, content.units.map((u) => {
    const open = isUnlocked(profile, content.units, u.id);
    const up = unitProgress(profile, u);
    return h('li', { class: open ? '' : 'locked' }, open ? link(`#/unit/${u.id}`, u.title.es, 'btn unit') : h('span', {}, `🔒 ${u.title.es}`), ' ', stars(up.stars),
      open ? h('div', { class: 'muted unit-status' }, statusLine(up)) : null);
  })));
  main.append(link('#/', 'Volver'), link('#/settings', 'Ajustes'));
}

function renderIntro(profile, unit) {
  const resumable = profile.inProgress?.unitId === unit.id && profile.inProgress.rev === unit.rev;
  const up = unitProgress(profile, unit);
  const main = screen(unit.title.es, h('p', { id: 'unit-intro' }, unit.intro.es));
  main.append(h('p', { id: 'unit-status' }, stars(up.stars), ' ', statusLine(up)),
    up.last && up.attempts ? h('p', { class: 'muted', id: 'unit-last' }, `Último intento: ${'★'.repeat(up.last.stars)}${'☆'.repeat(3 - up.last.stars)} · Mejor: ${'★'.repeat(up.stars)}${'☆'.repeat(3 - up.stars)}`) : null,
    h('ol', { id: 'exercise-list', class: 'list' }, unit.exercises.map((e, i) => {
      const r = up.rows[i];
      const mark = !r.done ? '○ pendiente' : r.ok ? '✔ sin ayuda' : '● con ayuda';
      return h('li', { class: r.done ? '' : 'muted' }, `${content.archetypeById[e.archetype]?.title.es ?? e.id}: `, h('span', {}, mark), r.done && !r.ok && r.bestOk ? ' (antes, sin ayuda)' : null);
    })));
  const start = link(`#/unit/${unit.id}/play`, resumable ? 'Seguir' : up.attempts ? 'Jugar otra vez' : 'Empezar');
  start.id = 'start-unit';
  main.append(start, link(`#/profile/${profile.id}`, 'Volver'));
  speech.ready().then(() => {
    if (!speech.available || !main.isConnected) return;
    const say = h('button', { type: 'button', id: 'say-intro', 'aria-label': 'Escuchar' }, '🔊');
    say.onclick = () => ctx0.say(unit.intro.es);
    start.before(say);
  });
}
const ctx0 = { say: (text, opts) => (store.data.settings.sound ? speech.say(text, opts) : Promise.resolve(false)) };

function renderSettingsScreen() {
  const main = screen(null);
  current = renderSettings(main, { store, content, diagnostic, gate, logError, applySettings });
  main.append(link(activeProfile() ? `#/profile/${activeProfile().id}` : '#/', 'Volver'));
}

function playUnit(profile, unit) {
  const session = createUnitSession({ unit, content, seed: attemptSeed(profile, unit.id), resume: profile.inProgress });
  const stage = h('div', { id: 'stage' });
  const live = h('div', { id: 'live', 'aria-live': 'polite' });
  const main = screen(unit.title.es, stage, live);
  let mounted = null;
  let timer = null;
  let busy = false; // true from a correct answer until the next round is shown: ignores double taps
  let lastResult = null;
  let result = null;
  const before = unitProgress(profile, unit).last; // previous attempt, for "antes" on the result screen
  const self = { destroy() { clearTimeout(timer); mounted?.destroy(); } };
  current = self;
  window.__spanishArcade.session = session;

  const ctx = {
    t: (k) => k,
    difficulty: 1, // set per exercise in show()
    say: ctx0.say,
    canSpeak: false, // speech.available && settings.sound, set once the voices are known
    sfx: () => {}, mascot: () => {},
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    async submit(answer) {
      if (busy) return { ...lastResult, ignored: true };
      return settle(session.submit(answer));
    },
  };

  // Save a judged round now (an ended exercise at once, the unit at its end); only the screen change is delayed.
  function settle(r, delay = NEXT_DELAY) {
    lastResult = r;
    const at = store.now();
    if (r.done) {
      result = session.result();
      store.update(profile.id, (p) => recordUnit(r.exerciseDone ? recordExercise(p, unit, r.exerciseDone, at) : p, unit, result, at));
    } else store.update(profile.id, (p) => saveInProgress(r.exerciseDone ? recordExercise(p, unit, r.exerciseDone, at) : p, session.snapshot()));
    if (r.action === 'next' || r.action === 'skip') { busy = true; skipBtn.disabled = true; timer = setTimeout(r.done ? finish : show, delay); }
    return r;
  }

  /** The right answer as text, for the moment after "Saltar" (best effort across archetypes). */
  function answerText(round, hint) {
    const a = hint?.answer;
    if (a == null) return '';
    const o = Array.isArray(round.options) ? round.options.find((x) => String(x?.id) === String(a)) : null;
    return String(o ? (o.es ?? o.text ?? o.label ?? '') : typeof a === 'string' ? a : '');
  }

  const skipBtn = h('button', { type: 'button', id: 'skip', 'aria-label': 'Saltar esta pregunta y ver la respuesta' }, 'Saltar');
  skipBtn.onclick = () => {
    if (busy || session.done) return;
    const round = session.current.round;
    const r = settle(session.skip(), SKIP_DELAY);
    const text = answerText(round, r.hint);
    live.replaceChildren(h('p', { id: 'skipped' }, text ? `Saltada. La respuesta era: ${text}` : 'Saltada.'));
  };

  function show() {
    mounted?.destroy();
    const cur = session.current;
    const host = h('div', { id: 'round' });
    ctx.difficulty = cur.exercise.difficulty ?? 1;
    stage.replaceChildren(
      h('p', { class: 'muted', id: 'progress' }, `Ejercicio ${cur.exerciseIndex + 1}/${unit.exercises.length} · ${cur.roundIndex + 1}/${cur.rounds}`),
      h('p', { id: 'exercise-prompt' }, cur.exercise.prompt?.es ?? ''),
      host, skipBtn, link(`#/profile/${profile.id}`, 'Salir'));
    busy = false;
    skipBtn.disabled = false;
    live.replaceChildren();
    mounted = cur.archetype.mount(host, cur.round, ctx);
  }

  function finish() {
    mounted?.destroy(); mounted = null;
    stage.replaceChildren(link(`#/profile/${profile.id}`, 'Volver al mapa'));
    live.replaceChildren(h('h2', {}, '¡Todo hecho!'), h('p', { id: 'result-stars' }, stars(result.stars)),
      h('p', {}, `${result.correct} de ${unit.exercises.length} ejercicios sin ayuda.`),
      before ? h('p', { id: 'result-before' }, 'Antes: ', stars(before.stars), before.correct != null ? ` (${before.correct} de ${unit.exercises.length} sin ayuda)` : '') : null);
  }

  // A unit whose exercises all make 0 rounds (the session already warned) has nothing to play.
  function start() {
    if (!session.done) return show();
    stage.replaceChildren(h('p', {}, 'Todavía no hay nada que jugar en esta unidad.'), link(`#/profile/${profile.id}`, 'Volver al mapa'));
  }

  // Archetypes read ctx.canSpeak at mount, so wait for the voice list first.
  speech.ready().then(() => { if (current !== self) return; ctx.canSpeak = speech.available && store.data.settings.sound; start(); });
}

window.__spanishArcade = { store, content, speech, errors, go: (hash) => { location.hash = hash; }, session: null };
addEventListener('hashchange', route);
route();
navigator.storage?.persist?.().catch(() => {});
registerServiceWorker('./sw.js');
