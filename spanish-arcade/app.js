// App shell: hash routes, screen frame + footer, unit play through the session engine, diagnostics.
//   #/   #/profile/<id>   #/unit/<id>   #/settings
// Data: courses (units + vocab) and archetypes are bundled (core/content.js); progress lives in localStorage (core/profiles.js).
import { loadContent } from './core/content.js';
import { createStore, MAX_PROFILES } from './core/profiles.js';
import { createUnitSession, LEG_SIZE } from './core/session.js';
import { recordUnit, recordExercise, unitProgress, applyRev, saveInProgress, isUnlocked, attemptSeed, isPersonalBest } from './core/progress.js';
import { totalStars, doneToday, nextUnit, mascotLine, stoneEmoji, visibleUnits, visibleCourses, currentCourse, DAILY_GOAL } from './core/home.js';
import { createSpeech } from './ui/speech.js';
import { renderSettings } from './ui/settings.js';
import { createTapCounter } from './ui/tapcount.js';
import { createSfx, unlockOnFirstTap } from './ui/sfx.js';
import { answerMark, stepBurst, legBurst, unitBurst, legMascot, effortLine, UNIT_LINES, stickerFor, stickerHtml } from './ui/celebrate.js';
import { mascot as mascotSvg, burst } from './ui/art/art.js';
import { registerServiceWorker } from '../shared/pwa.js';

const root = document.getElementById('app');
const speech = createSpeech();
speech.ready(); // start looking for voices at once, so a unit starts without waiting
const NEXT_DELAY = 700;
const sfx = createSfx({ enabled: () => store.data.settings.sound });
unlockOnFirstTap(); // audio starts only after the first tap
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
const debugOn = () => store.data.settings.debug;
/** Units of one course a child may see now (review units only in debug mode), in order. These are the unlock chain. */
const unitsOfCourse = (courseId) => visibleUnits(content.units.filter((u) => u.course === courseId), debugOn());
const coursesNow = () => visibleCourses(content, { debug: debugOn(), dev: import.meta.env.DEV });
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
    h('a', { href: 'https://github.com/keymon-labs/keymon-labs.github.io/blob/main/NOTICE.md' }, 'CC BY-NC-SA 4.0'),
    h('a', { href: '../', class: 'footlink' }, '← Página principal de keymon-labs'));
}

// "Install as an app": a small icon opens the steps for each browser; Chrome's own prompt is offered when the browser allows it.
let installEvt = null;
const installBtns = new Set();
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; installBtns.forEach((b) => { b.hidden = false; }); });
function installWidget() {
  if (matchMedia('(display-mode: standalone)').matches || navigator.standalone) return null; // already an app
  const toggle = h('button', { type: 'button', id: 'install-toggle', class: 'icon', 'aria-label': 'Instalar como aplicación', 'aria-expanded': 'false', 'aria-controls': 'install-help' }, '📲');
  const now = h('button', { type: 'button', id: 'install-now', class: 'reveal' }, 'Instalar ahora');
  now.hidden = !installEvt;
  installBtns.add(now);
  now.onclick = async () => { installEvt?.prompt(); await installEvt?.userChoice.catch(() => {}); installEvt = null; now.hidden = true; };
  const panel = h('section', { id: 'install-help', class: 'card', hidden: '' }, h('h2', {}, 'Instalar como aplicación'),
    h('p', {}, 'Se abre a pantalla completa, sin la barra del navegador, y funciona sin conexión.'),
    h('ul', {},
      h('li', {}, h('b', {}, 'Chrome (Android): '), 'toca ⋮ y elige «Instalar aplicación» o «Añadir a la pantalla de inicio».'),
      h('li', {}, h('b', {}, 'Firefox (Android): '), 'toca ⋮ y elige «Instalar» o «Añadir a la pantalla de inicio».'),
      h('li', {}, h('b', {}, 'Safari (iPhone y iPad): '), 'toca Compartir y elige «Añadir a pantalla de inicio».'),
      h('li', {}, h('b', {}, 'Ordenador (Chrome, Edge): '), 'usa el icono de instalar que aparece en la barra de direcciones.')),
    now);
  toggle.onclick = () => { panel.hidden = !panel.hidden; toggle.setAttribute('aria-expanded', String(!panel.hidden)); };
  return [h('div', { class: 'toprow' }, toggle), panel];
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
  else if (page === 'unit' && unit && profile && (!unit.course || coursesNow().some((c) => c.id === unit.course)) && unitsOfCourse(unit.course).some((u) => u.id === unit.id) && isUnlocked(profile, unitsOfCourse(unit.course), unit.id)) (sub === 'play' ? playUnit : renderIntro)(profile, unit);
  else if (page === 'settings') gate(renderSettingsScreen);
  else renderHome();
  root.querySelector('h1')?.focus();
}

const mascot = (extra = '') => h('div', { class: 'mascot', 'aria-hidden': 'true' }, '🦊', extra);
const settingsLink = () => link('#/settings', '⚙️ Ajustes');

function renderHome() {
  const profiles = store.data.profiles;
  const main = screen(null, h('div', { class: 'hero' }, mascot(), h('div', {}, h('h1', { tabindex: '-1' }, 'Arcade de español'), h('p', { class: 'bubble' }, '¡Vamos a jugar con las palabras!'))));
  main.prepend(...(installWidget() ?? []));
  if (profiles.length) main.append(h('ul', { class: 'list' }, profiles.map((p) => h('li', {}, link(`#/profile/${p.id}`, `🙂 ${p.firstName}`, 'btn primary')))));
  if (profiles.length < MAX_PROFILES) { // several children can share the device, up to MAX_PROFILES
    const first = h('input', { id: 'first-name', required: '', autocomplete: 'off' });
    const form = h('form', { id: 'new-profile', class: 'card' }, h('label', {}, profiles.length ? 'Nombre del niño o de la niña ' : '¿Cómo te llamas? ', first), h('button', { type: 'submit', class: 'reveal' }, profiles.length ? '➕ Añadir' : '▶️ Empezar'));
    form.onsubmit = (e) => {
      e.preventDefault();
      if (!first.value.trim()) return;
      const p = store.addProfile({ firstName: first.value });
      location.hash = `#/profile/${p.id}`;
    };
    if (profiles.length) main.append(h('details', { id: 'add-profile', class: 'card' }, h('summary', {}, '➕ Añadir otro niño o niña'), form));
    else main.append(form);
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
  const courses = coursesNow();
  const course = currentCourse(profile, courses);
  const units = course ? unitsOfCourse(course.id) : content.units.some((u) => u.course) ? [] : visibleUnits(content.units, debugOn()); // units of hidden courses never show
  const next = nextUnit(profile, units);
  if (next) {
    const up = unitProgress(profile, next);
    const a = link(`#/unit/${next.id}`, '', 'continue');
    a.id = 'continue';
    a.append(h('span', { class: 'big', 'aria-hidden': 'true' }, '▶️'), h('span', {}, h('b', {}, up.resumable ? 'Seguir jugando' : up.attempts ? 'Jugar otra vez' : 'Empezar'), h('small', {}, `${next.title.es} · ${statusLine(up)}`)));
    main.append(a);
  }
  main.append(h('div', { class: 'card goal', id: 'goal' }, h('div', { class: 'ring', style: `--pct:${pct}`, role: 'img', 'aria-label': `${done} de ${DAILY_GOAL} ejercicios hoy` }, h('span', {}, `${Math.min(done, DAILY_GOAL)}/${DAILY_GOAL}`)),
    h('div', {}, h('b', {}, 'Meta de hoy'), h('div', { class: 'muted' }, `${done} de ${DAILY_GOAL} ejercicios`))));
  if (courses.length > 1) main.append(coursePicker(profile, courses, course));
  if (!units.length) main.append(h('p', { id: 'no-units', class: 'muted' }, 'Todavía no hay unidades para jugar.'));
  main.append(h('h2', {}, 'Mis unidades'), h('ol', { class: 'trail' }, units.map((u, i) => {
    const open = isUnlocked(profile, units, u.id);
    const up = unitProgress(profile, u);
    const dot = h('span', { class: 'dot', 'aria-hidden': 'true' }, open ? stoneEmoji(i) : '🔒');
    const text = h('span', {}, h('b', {}, u.title.es), open ? [stars(up.stars), h('div', { class: 'muted unit-status' }, statusLine(up))] : null);
    return h('li', { class: open ? '' : 'locked' }, open ? h('a', { href: `#/unit/${u.id}`, class: 'stone unit' }, dot, text) : h('div', { class: 'stone' }, dot, text));
  })));
  main.append(h('div', { class: 'row' }, link('#/', '🏠 Inicio'), settingsLink()), debugTools());
}

/** "Mis cursos": only when there is more than one course. Picking one is remembered on the profile (profile.courseId). */
function coursePicker(profile, courses, current) {
  const cards = courses.map((c) => {
    const us = unitsOfCourse(c.id);
    const on = c.id === current?.id;
    const b = h('button', { type: 'button', class: `btn course${on ? ' primary' : ''}`, 'data-course': c.id, 'aria-pressed': String(on),
      onclick: () => { store.setCourse(profile.id, c.id); route(); } },
      h('b', {}, c.title.es), h('div', { class: 'muted' }, `${c.level}${c.semester ? ` · ${c.semester}.º cuatrimestre` : ''} · ⭐ ${totalStars(profile, us)}/${us.length * 3}`));
    return h('li', {}, b);
  });
  return h('section', { id: 'courses' }, h('h2', {}, 'Mis cursos'), h('ul', { class: 'list' }, cards));
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
  const trail = h('ol', { class: 'trail-play', id: 'progress', role: 'progressbar', 'aria-label': 'Ejercicios', 'aria-valuemin': '0' }); // one stone per exercise, a flag after each leg
  const segs = h('div', { class: 'segs', id: 'segs', role: 'progressbar', 'aria-label': 'Preguntas', 'aria-valuemin': '0' }); // one segment per round: ★ first try, ● with help
  const exitBtn = h('button', { type: 'button', id: 'exit', class: 'icon', 'aria-label': 'Salir' }, '✕');
  const skipBtn = h('button', { type: 'button', id: 'skip', class: 'skip', 'aria-label': 'Saltar esta pregunta y ver la respuesta' }, '⏭️ Saltar');
  const header = h('header', { class: 'playbar' }, exitBtn, trail, segs);
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
  const marks = {}; // exercise id -> outcome per round: 'star' (first try) or 'help'; rounds before a resume count as 'help'. Rounds of an exercise are split over runs (task 036)
  const marksOf = (c) => (marks[c.exercise.id] ??= []);
  const was = unitProgress(profile, unit);
  const before = was.last; // previous attempt, for "antes" on the result screen
  const bestBefore = was.attempts ? { stars: was.stars, correct: was.bestCorrect } : null; // for the personal-best ribbon
  let lastHelp = false; // the last judged answer needed a hint: picks 'ok' over 'good' for ctx.sfx('right')
  let legs = 0;
  const later = []; // timers of celebrations, cleared on leaving

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
  const self = { destroy() { clearTimeout(timer); clearTimeout(skipArm); later.forEach(clearTimeout); removeEventListener('popstate', onPop); document.body.classList.remove('playing'); mounted?.destroy(); } };
  current = self;
  window.__spanishArcade.session = session;
  window.__spanishArcade.answer = async (a) => { const r = await ctx.submit(a); if (!r.ignored) ctx.sfx(r.correct ? 'right' : 'wrong'); return r; }; // test hook: same path as an archetype's submit

  const ctx = {
    t: (k) => k,
    difficulty: 1, // set per exercise in show()
    say: ctx0.say,
    get canSpeak() { return speech.available && store.data.settings.sound; }, // read at mount: true once the voices are known
    // archetypes say 'right' / 'wrong' after submit(); the shell picks the sound and mascot (never red-only: words stay in the round)
    sfx: (name) => {
      if (name === 'right') { if (lastResult?.exerciseDone && !lastResult.legDone && !lastResult.done) { sfx('step'); stepBurst(); } else sfx(lastHelp ? 'ok' : 'good'); }
      else if (name === 'wrong') sfx('almost');
    },
    mascot: () => {},
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    async submit(answer) {
      if (busy) return { ...lastResult, ignored: true };
      const c = session.current;
      const r = settle(session.submit(answer));
      if (!r.skipped && !r.ignored) {
        lastHelp = r.correct && c.misses > 0;
        if (r.correct) answerMark(live, lastHelp ? 'help' : 'happy'); else if (!r.correct) answerMark(live, 'think');
      }
      if (r.action === 'next') { marksOf(c)[c.roundIndex] = c.misses === 0 ? 'star' : 'help'; drawSegs(c, c.roundIndex + 1); }
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
    if (r.action === 'next' || r.action === 'skip') { busy = true; skipBtn.disabled = true; timer = setTimeout(r.done ? finish : r.legDone ? rest : show, delay); }
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
    const c = session.current;
    const round = c.round;
    const r = settle(session.skip(), SKIP_DELAY);
    marksOf(c)[c.roundIndex] = 'help'; drawSegs(c, c.roundIndex + 1);
    const text = answerText(round, r.hint);
    live.replaceChildren(h('p', { id: 'skipped' }, text ? `Saltada. La respuesta era: ${text}` : 'Saltada.'));
  };

  // Trail: ✓ done, 🦊 now, ○ to do (shape as well as colour); 🚩 closes each leg. Segments: ★ first try, ● with help, ▷ now.
  function drawTrail(cur) {
    const n = session.order.length, at = cur.exerciseIndex; // exercises of a leg end in any order: done = in cur.finished, now = where the current one sits
    const gone = new Set(cur.finished);
    trail.setAttribute('aria-valuemax', String(n));
    trail.setAttribute('aria-valuenow', String(at));
    trail.setAttribute('aria-valuetext', at >= n ? `${n} de ${n} ejercicios` : `Ejercicio ${at + 1} de ${n}`);
    trail.replaceChildren(...session.order.flatMap((id, i) => [
      h('li', { class: gone.has(id) ? 'done' : i === cur.position ? 'now' : '', 'aria-hidden': 'true' }, gone.has(id) ? '✓' : i === cur.position ? '🦊' : '○'),
      (i + 1) % LEG_SIZE === 0 && i + 1 < n ? h('li', { class: 'flag', 'aria-hidden': 'true' }, '🚩') : null].filter(Boolean)));
  }
  function drawSegs(cur, at) {
    segs.setAttribute('aria-valuemax', String(cur.rounds));
    segs.setAttribute('aria-valuenow', String(at));
    segs.setAttribute('aria-valuetext', `Pregunta ${Math.min(at + 1, cur.rounds)} de ${cur.rounds}`);
    segs.replaceChildren(...Array.from({ length: cur.rounds }, (_, i) => {
      const m = i < at ? (marksOf(cur)[i] ?? 'help') : '';
      return h('span', { class: m ? `seg ${m}` : i === at ? 'seg now' : 'seg', 'aria-hidden': 'true' }, m === 'star' ? '★' : m ? '●' : '');
    }));
  }

  // Parada en el camino: after each leg that is not the last. Progress is already saved, so leaving loses nothing.
  function rest() {
    mounted?.destroy(); mounted = null;
    const left = session.order.length - session.current.exerciseIndex;
    drawTrail(session.current);
    main.classList.add('rest');
    const go = h('button', { type: 'button', id: 'next-leg', class: 'btn primary', onclick: () => { main.classList.remove('rest'); show(); } }, 'Seguir');
    const face = h('div', { class: 'parada-face', 'aria-hidden': 'true' });
    face.innerHTML = legMascot();
    stage.replaceChildren(h('div', { class: 'parada' }, face, h('h2', { tabindex: '-1' }, 'Parada en el camino'),
      h('p', { id: 'leg-line' }, `${effortLine(legs++)} Faltan ${left} ${left === 1 ? 'ejercicio' : 'ejercicios'}.`), go,
      h('a', { href: `#/profile/${profile.id}`, id: 'save-leave', class: 'btn' }, 'Guardar y salir')));
    live.replaceChildren();
    sfx('leg'); legBurst();
    stage.querySelector('h2').focus({ preventScroll: true });
    go.focus({ preventScroll: true });
  }

  function show() {
    mounted?.destroy();
    const cur = session.current;
    const host = h('div', { id: 'round' });
    ctx.difficulty = cur.exercise.difficulty ?? 1;
    drawTrail(cur);
    drawSegs(cur, cur.roundIndex);
    // The game changed (runs of at most 3 rounds, task 036): say so, then the new instruction line as for every round.
    stage.replaceChildren(...(cur.switched ? [h('p', { id: 'game-switch', class: 'game-switch', role: 'status' }, '🔀 Otro juego')] : []),
      h('p', { id: 'exercise-prompt', tabindex: '-1' }, cur.exercise.prompt?.es ?? ''), host);
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
    const n = unit.exercises.length;
    const pb = isPersonalBest(bestBefore, result);
    const starEls = [1, 2, 3].map((i) => h('span', { class: `big-star${i <= result.stars ? ' on' : ''}`, style: `--i:${i}`, 'aria-hidden': 'true' }, i <= result.stars ? '★' : '☆'));
    const sky = h('div', { class: 'result-sky', 'aria-hidden': 'true' });
    sky.innerHTML = burst({ size: 220 });
    const face = h('div', { class: 'result-face', 'aria-hidden': 'true' });
    face.innerHTML = mascotSvg(result.stars === 1 ? 'happy' : 'cheer', { size: 88 });
    const badge = h('div', { class: 'result-sticker', id: 'result-sticker' });
    badge.innerHTML = stickerHtml(stickerFor(content.units.filter((u) => u.course === unit.course).findIndex((u) => u.id === unit.id))); // position inside its course
    badge.append(h('span', {}, '¡Pegatina nueva!'));
    const ribbon = pb ? h('p', { class: 'ribbon', id: 'result-pb' }, '🏅 ¡Tu mejor intento!') : null;
    stage.replaceChildren(h('div', { class: 'result' }, sky, face, h('h2', { tabindex: '-1' }, '¡Todo hecho!'),
      h('p', { id: 'result-stars', class: 'big-stars', role: 'img', 'aria-label': `${result.stars} de 3 estrellas` }, ...starEls),
      ribbon, h('p', { id: 'result-line' }, UNIT_LINES[result.stars] ?? UNIT_LINES[1]),
      h('p', {}, `${result.correct} de ${n} ejercicios sin ayuda.`),
      ...(before ? [h('p', { id: 'result-before', class: 'muted' }, 'Antes: ', stars(before.stars), before.correct != null ? ` (${before.correct} de ${n} sin ayuda)` : '')] : []),
      badge,
      link(`#/profile/${profile.id}`, 'Volver al mapa', 'btn primary'), link(`#/unit/${unit.id}`, 'Jugar otra vez')));
    stage.querySelector('h2').focus({ preventScroll: true });
    sfx('unit'); unitBurst();
    later.push(setTimeout(() => sfx('sticker'), 1200));
    if (pb) later.push(setTimeout(() => sfx('pb'), 1900));
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
