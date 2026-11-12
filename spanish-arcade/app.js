// App shell: hash routes, screen frame + footer, unit play through the session engine, diagnostics.
//   #/   #/profile/<id>   #/unit/<id>   #/settings
// Data: units/vocab/archetypes are bundled (core/content.js); progress lives in localStorage (core/profiles.js).
import { loadContent } from './core/content.js';
import { createStore } from './core/profiles.js';
import { createUnitSession } from './core/session.js';
import { recordUnit, recordExercise, unitProgress, applyRev, saveInProgress, isUnlocked, attemptSeed } from './core/progress.js';
import { totalStars, doneToday, nextUnit, mascotLine, stoneEmoji, DAILY_GOAL } from './core/home.js';
import { createSpeech } from './ui/speech.js';
import { renderSettings } from './ui/settings.js';
import { createTapCounter } from './ui/tapcount.js';
import { registerServiceWorker } from '../shared/pwa.js';

const root = document.getElementById('app');
const speech = createSpeech();
speech.ready(); // start looking for voices at once, so a unit starts without waiting
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
  const { textSize, theme, palette } = store.data.settings;
  const el = document.documentElement;
  el.style.fontSize = `${(textSize || 1) * 100}%`; // archetypes size in rem, so scale the root
  if (theme === 'auto') el.removeAttribute('data-theme'); else el.dataset.theme = theme;
  el.dataset.palette = palette;
}
applySettings();
speech.setPreferred(store.data.settings.voice);

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
const stars = (n) => h('span', { class: 'stars', role: 'img', 'aria-label': `${n} de 3 estrellas` }, '★'.repeat(n), h('span', {}, '☆'.repeat(3 - n)));

// Hidden test mode: 10 quick taps on the footer text toggle settings.debug (the footer keeps its normal semantics).
const tapFooter = createTapCounter();
const debugLive = h('div', { id: 'debug-live', role: 'status', style: 'position:absolute;left:-9999px' });
document.body.append(debugLive);
function setDebug(on) {
  store.setSettings({ debug: on });
  if (!current) route(); // home, profile and unit intro: redraw so the link appears or goes
  debugLive.textContent = on ? 'Modo de pruebas activado' : 'Modo de pruebas desactivado';
}
const debugTools = () => (store.data.settings.debug
  ? h('p', { class: 'muted' }, link('./lab/', 'Laboratorio'), ' ', h('button', { type: 'button', id: 'debug-off', onclick: () => setDebug(false) }, 'Salir del modo de pruebas'))
  : '');

function footer() {
  const f = footerText();
  f.onclick = (e) => { if (!e.target.closest('a') && tapFooter()) setDebug(!store.data.settings.debug); };
  return f;
}
function footerText() {
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
  document.body.classList.remove('playing');
  const [page, id, sub] = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const unit = content.unitById[id];
  const profile = activeProfile();
  if (page === 'profile' && store.profile(id)) { activeId = id; renderProfile(store.profile(id)); }
  else if (page === 'unit' && unit && profile && isUnlocked(profile, content.units, unit.id)) (sub === 'play' ? playUnit : renderIntro)(profile, unit);
  else if (page === 'settings') gate(renderSettingsScreen);
  else renderHome();
  root.querySelector('h1')?.focus();
}

const mascot = (extra = '') => h('div', { class: 'mascot', 'aria-hidden': 'true' }, '🦊', extra);
const settingsLink = () => link('#/settings', '⚙️ Ajustes');

function renderHome() {
  const profiles = store.data.profiles;
  const main = screen(null, h('div', { class: 'hero' }, mascot(), h('div', {}, h('h1', { tabindex: '-1' }, 'Arcade de español'), h('p', { class: 'bubble' }, '¡Vamos a jugar con las palabras!'))));
  if (profiles.length) main.append(h('ul', { class: 'list' }, profiles.map((p) => h('li', {}, link(`#/profile/${p.id}`, `🙂 ${p.firstName}`, 'btn primary')))));
  if (profiles.length < 1) { // MVP: one profile
    const first = h('input', { id: 'first-name', required: '', autocomplete: 'off' });
    const form = h('form', { id: 'new-profile', class: 'card' }, h('label', {}, '¿Cómo te llamas? ', first), h('button', { type: 'submit', class: 'reveal' }, '▶️ Empezar'));
    form.onsubmit = (e) => {
      e.preventDefault();
      if (!first.value.trim()) return;
      const p = store.addProfile({ firstName: first.value });
      location.hash = `#/profile/${p.id}`;
    };
    main.append(form);
  }
  main.append(h('div', { class: 'row' }, settingsLink()), debugTools());
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
  const done = doneToday(profile, new Date());
  const pct = Math.min(100, Math.round((done / DAILY_GOAL) * 100));
  const main = screen(null,
    h('div', { class: 'hero' }, mascot(), h('div', {}, h('h1', { tabindex: '-1' }, `¡Hola, ${profile.firstName}!`), h('p', { class: 'bubble' }, mascotLine(done)))),
    h('div', { class: 'chips' }, h('span', { class: 'chip', id: 'total-stars' }, `⭐ ${totalStars(profile, content.units)}`)));
  const next = nextUnit(profile, content.units);
  if (next) {
    const up = unitProgress(profile, next);
    const a = link(`#/unit/${next.id}`, '', 'continue');
    a.id = 'continue';
    a.append(h('span', { class: 'big', 'aria-hidden': 'true' }, '▶️'), h('span', {}, h('b', {}, up.resumable ? 'Seguir jugando' : up.attempts ? 'Jugar otra vez' : 'Empezar'), h('small', {}, `${next.title.es} · ${statusLine(up)}`)));
    main.append(a);
  }
  main.append(h('div', { class: 'card goal', id: 'goal' }, h('div', { class: 'ring', style: `--pct:${pct}`, role: 'img', 'aria-label': `${done} de ${DAILY_GOAL} ejercicios hoy` }, h('span', {}, `${Math.min(done, DAILY_GOAL)}/${DAILY_GOAL}`)),
    h('div', {}, h('b', {}, 'Meta de hoy'), h('div', { class: 'muted' }, `${done} de ${DAILY_GOAL} ejercicios`))));
  main.append(h('h2', {}, 'Mis unidades'), h('ol', { class: 'trail' }, content.units.map((u, i) => {
    const open = isUnlocked(profile, content.units, u.id);
    const up = unitProgress(profile, u);
    const dot = h('span', { class: 'dot', 'aria-hidden': 'true' }, open ? stoneEmoji(i) : '🔒');
    const text = h('span', {}, h('b', {}, u.title.es), open ? [stars(up.stars), h('div', { class: 'muted unit-status' }, statusLine(up))] : null);
    return h('li', { class: open ? '' : 'locked' }, open ? h('a', { href: `#/unit/${u.id}`, class: 'stone unit' }, dot, text) : h('div', { class: 'stone' }, dot, text));
  })));
  main.append(h('div', { class: 'row' }, link('#/', '🏠 Inicio'), settingsLink()), debugTools());
}

function renderIntro(profile, unit) {
  const resumable = profile.inProgress?.unitId === unit.id && profile.inProgress.rev === unit.rev;
  const up = unitProgress(profile, unit);
  const main = screen(unit.title.es, h('p', { id: 'unit-intro' }, unit.intro.es));
  main.append(...[h('p', { id: 'unit-status' }, stars(up.stars), ' ', statusLine(up)),
    up.last && up.attempts ? h('p', { class: 'muted', id: 'unit-last' }, `Último intento: ${'★'.repeat(up.last.stars)}${'☆'.repeat(3 - up.last.stars)} · Mejor: ${'★'.repeat(up.stars)}${'☆'.repeat(3 - up.stars)}`) : null,
    h('ol', { id: 'exercise-list', class: 'list' }, unit.exercises.map((e, i) => {
      const r = up.rows[i];
      const mark = !r.done ? '○ pendiente' : r.ok ? '✔ sin ayuda' : '● con ayuda';
      return h('li', { class: r.done ? '' : 'muted' }, `${content.archetypeById[e.archetype]?.title.es ?? e.id}: `, h('span', {}, mark), r.done && !r.ok && r.bestOk ? ' (antes, sin ayuda)' : null);
    }))].filter(Boolean));
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
  current = renderSettings(main, { store, content, diagnostic, gate, logError, applySettings, speech });
  main.append(link(activeProfile() ? `#/profile/${activeProfile().id}` : '#/', 'Volver'));
}

function playUnit(profile, unit) {
  const session = createUnitSession({ unit, content, seed: attemptSeed(profile, unit.id), resume: profile.inProgress });
  const stage = h('div', { id: 'stage' });
  const live = h('div', { id: 'live', 'aria-live': 'polite' }); // feedback strip: its height is reserved, so nothing below it moves
  const dots = h('div', { class: 'dots', id: 'progress', role: 'img' });
  const bar = h('div', { class: 'roundbar', 'aria-hidden': 'true' }, h('i'));
  const exitBtn = h('button', { type: 'button', id: 'exit', class: 'icon', 'aria-label': 'Salir' }, '✕');
  const skipBtn = h('button', { type: 'button', id: 'skip', class: 'skip', 'aria-label': 'Saltar esta pregunta y ver la respuesta' }, '⏭️ Saltar');
  const header = h('header', { class: 'playbar' }, exitBtn, dots, bar);
  const actions = h('div', { class: 'actions' }, live, skipBtn);
  const main = screen(unit.title.es, header, stage, actions);
  main.classList.add('play');
  main.querySelector('h1').className = 'sr-only';
  root.querySelector('footer')?.remove(); // no licence text under a round; it stays on the home and settings screens
  document.body.classList.add('playing');
  let mounted = null;
  let timer = null;
  let skipArm = null; // "Toca otra vez" window after the first press on Saltar
  let busy = false; // true from a correct answer until the next round is shown: ignores double taps
  let lastResult = null;
  let result = null;
  const before = unitProgress(profile, unit).last; // previous attempt, for "antes" on the result screen

  // Exit guard: ✕ and the browser's back button open a sheet; the round stays mounted until "Salir".
  let sheet = null;
  const closeSheet = () => { sheet?.remove(); sheet = null; exitBtn.focus(); };
  function openSheet() {
    if (sheet) return;
    sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': '¿Salir?' },
      h('div', { class: 'sheet-box' }, h('p', {}, h('b', {}, '¿Salir?'), ' Tu progreso se guarda.'),
        h('button', { type: 'button', id: 'stay', class: 'btn primary', onclick: closeSheet }, 'Seguir jugando'),
        h('a', { href: `#/profile/${profile.id}`, id: 'leave', class: 'btn' }, 'Salir')));
    main.append(sheet);
    sheet.querySelector('#stay').focus();
  }
  exitBtn.onclick = openSheet;
  const onPop = () => { if (!location.hash.endsWith('/play')) return; history.pushState({ round: true }, ''); openSheet(); };
  history.pushState({ round: true }, '');
  addEventListener('popstate', onPop);
  const self = { destroy() { clearTimeout(timer); clearTimeout(skipArm); removeEventListener('popstate', onPop); document.body.classList.remove('playing'); mounted?.destroy(); } };
  current = self;
  window.__spanishArcade.session = session;

  const ctx = {
    t: (k) => k,
    difficulty: 1, // set per exercise in show()
    say: ctx0.say,
    get canSpeak() { return speech.available && store.data.settings.sound; }, // read at mount: true once the voices are known
    sfx: () => {}, mascot: () => {},
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    async submit(answer) {
      if (busy) return { ...lastResult, ignored: true };
      const r = settle(session.submit(answer));
      if (store.data.settings.debug && !r.correct && !r.skipped) { // debug mode: show what was sent, to find why a right-looking answer was judged wrong
        const round = session.current?.round;
        live.replaceChildren(h('p', { class: 'muted', id: 'debug-sent' }, `enviado: «${JSON.stringify(answer)}» · esperado: «${round?.answer ?? round?.word ?? ''}»`));
      }
      return r;
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

  const SKIP_LABEL = '⏭️ Saltar';
  const disarm = () => { clearTimeout(skipArm); skipArm = null; skipBtn.textContent = SKIP_LABEL; };
  skipBtn.onclick = () => {
    if (busy || session.done) return;
    if (!skipArm) { // first press only asks; a stray tap near the answers cannot skip
      skipBtn.textContent = 'Toca otra vez';
      skipArm = setTimeout(disarm, 3000);
      return;
    }
    disarm();
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
    const total = unit.exercises.length;
    dots.setAttribute('aria-label', `Ejercicio ${cur.exerciseIndex + 1} de ${total}, pregunta ${cur.roundIndex + 1} de ${cur.rounds}`);
    dots.replaceChildren(...unit.exercises.map((_, i) => h('span', { class: i < cur.exerciseIndex ? 'done' : i === cur.exerciseIndex ? 'now' : '' })));
    bar.firstChild.style.width = `${Math.round((cur.roundIndex / cur.rounds) * 100)}%`;
    stage.replaceChildren(h('p', { id: 'exercise-prompt', tabindex: '-1' }, cur.exercise.prompt?.es ?? ''), host);
    busy = false;
    disarm();
    skipBtn.disabled = false;
    live.replaceChildren();
    mounted = cur.archetype.mount(host, cur.round, ctx);
    stage.scrollTop = 0; // a new round starts at the top, whatever the last one scrolled to
    scrollTo(0, 0);
    stage.querySelector('#exercise-prompt').focus({ preventScroll: true });
  }

  function finish() {
    mounted?.destroy(); mounted = null;
    main.classList.add('done'); // hides the round header and action bar
    stage.replaceChildren(link(`#/profile/${profile.id}`, 'Volver al mapa'));
    stage.append(h('h2', {}, '¡Todo hecho!'), h('p', { id: 'result-stars' }, stars(result.stars)),
      h('p', {}, `${result.correct} de ${unit.exercises.length} ejercicios sin ayuda.`),
      ...(before ? [h('p', { id: 'result-before' }, 'Antes: ', stars(before.stars), before.correct != null ? ` (${before.correct} de ${unit.exercises.length} sin ayuda)` : '')] : []));
  }

  // A unit whose exercises all make 0 rounds (the session already warned) has nothing to play.
  function start() {
    if (!session.done) return show();
    main.classList.add('done');
    stage.replaceChildren(h('p', {}, 'Todavía no hay nada que jugar en esta unidad.'), link(`#/profile/${profile.id}`, 'Volver al mapa'));
  }

  // Archetypes read ctx.canSpeak at mount. Never leave a blank page: show a loader at once and start when the voices are
  // known, or after 400 ms (later rounds pick the voice up; speech.ready() is cached for the session).
  stage.replaceChildren(h('p', { class: 'loader' }, '🦊 Preparando…'));
  let started = false;
  const begin = () => { if (started || current !== self) return; started = true; start(); };
  speech.ready().then(begin);
  setTimeout(begin, 400);
}

window.__spanishArcade = { store, content, speech, errors, go: (hash) => { location.hash = hash; }, session: null };
addEventListener('hashchange', route);
route();
navigator.storage?.persist?.().catch(() => {});
registerServiceWorker('./sw.js');
