// App shell: hash routes, screen frame + footer, unit play through the session engine, diagnostics.
//   #/   #/profile/<id>   #/unit/<id>   #/settings
// Data: units/vocab/archetypes are bundled (core/content.js); progress lives in localStorage (core/profiles.js).
import { loadContent } from './core/content.js';
import { createStore } from './core/profiles.js';
import { createUnitSession } from './core/session.js';
import { recordUnit, applyRev, saveInProgress, isUnlocked, attemptSeed } from './core/progress.js';
import { createSpeech } from './ui/speech.js';
import { renderSettings } from './ui/settings.js';
import { registerServiceWorker } from '../shared/pwa.js';

const root = document.getElementById('app');
const speech = createSpeech();
const NEXT_DELAY = 700;

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

// Settings that change the page itself: help language (<html lang>) and text size.
function applySettings() {
  const { lang, textSize } = store.data.settings;
  document.documentElement.lang = lang;
  document.documentElement.style.setProperty('--text-scale', String(textSize || 1));
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
const stars = (n) => h('span', { class: 'stars', role: 'img', 'aria-label': `${n} of 3 stars` }, '★'.repeat(n), h('span', {}, '★'.repeat(3 - n)));

function footer() {
  return h('footer', {}, `Spanish Arcade v1 · build ${__BUILD__} · © 2026 keymon-labs · `,
    h('a', { href: 'https://github.com/keymon-labs/keymon-labs.github.io/blob/main/NOTICE.md' }, 'CC BY-NC-SA 4.0'));
}

let current = null; // mounted screen, if any: { destroy() }
let activeId = null;
const activeProfile = () => store.profile(activeId) ?? store.data.profiles[0] ?? null;

const unsavedNote = () => h('p', { id: 'unsaved', role: 'status', class: 'muted' }, "Progress won't be saved in this browser.");
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
  const main = screen('Spanish Arcade');
  if (profiles.length) main.append(h('ul', { class: 'list' }, profiles.map((p) => h('li', {}, link(`#/profile/${p.id}`, p.firstName)))));
  if (profiles.length < 1) { // MVP: one profile
    const first = h('input', { id: 'first-name', required: '', autocomplete: 'off' });
    const form = h('form', { id: 'new-profile' }, h('label', {}, 'First name ', first), h('button', { type: 'submit' }, 'Start'));
    form.onsubmit = (e) => {
      e.preventDefault();
      if (!first.value.trim()) return;
      const p = store.addProfile({ firstName: first.value });
      location.hash = `#/profile/${p.id}`;
    };
    main.append(form);
  }
  main.append(link('#/settings', 'Settings'));
}

function renderProfile(profile) {
  const main = screen(`Hello, ${profile.firstName}!`);
  main.append(h('ul', { class: 'list' }, content.units.map((u) => {
    const open = isUnlocked(profile, content.units, u.id);
    const st = profile.units[u.id]?.stars ?? 0;
    const resumable = profile.inProgress?.unitId === u.id;
    return h('li', { class: open ? '' : 'locked' }, open ? link(`#/unit/${u.id}`, u.title.en, 'btn unit') : h('span', {}, `🔒 ${u.title.en}`), ' ', stars(st), resumable ? h('span', { class: 'muted' }, ' (resume)') : null);
  })));
  main.append(link('#/', 'Back'), link('#/settings', 'Settings'));
}

function renderIntro(profile, unit) {
  const lang = store.data.settings.lang;
  const resumable = profile.inProgress?.unitId === unit.id && profile.inProgress.rev === unit.rev;
  const main = screen(unit.title[lang] ?? unit.title.en, h('p', { id: 'unit-intro' }, unit.intro[lang] ?? unit.intro.en));
  const start = link(`#/unit/${unit.id}/play`, resumable ? 'Continue' : 'Start');
  start.id = 'start-unit';
  main.append(start, link(`#/profile/${profile.id}`, 'Back'));
  speech.ready().then(() => {
    if (!speech.available || !main.isConnected) return;
    const say = h('button', { type: 'button', id: 'say-intro', 'aria-label': 'Listen' }, '🔊');
    say.onclick = () => ctx0.say(unit.intro.es);
    start.before(say);
  });
}
const ctx0 = { say: (text, opts) => (store.data.settings.sound ? speech.say(text, opts) : Promise.resolve(false)) };

function renderSettingsScreen() {
  const main = screen(null);
  current = renderSettings(main, { store, content, diagnostic, gate, logError, applySettings });
  main.append(link(activeProfile() ? `#/profile/${activeProfile().id}` : '#/', 'Back'));
}

function playUnit(profile, unit) {
  const lang = store.data.settings.lang;
  const session = createUnitSession({ unit, content, seed: attemptSeed(profile, unit.id), resume: profile.inProgress });
  const stage = h('div', { id: 'stage' });
  const live = h('div', { id: 'live', 'aria-live': 'polite' });
  const main = screen(unit.title[lang] ?? unit.title.en, stage, live);
  let mounted = null;
  let timer = null;
  let busy = false; // true from a correct answer until the next round is shown: ignores double taps
  let lastResult = null;
  let result = null;
  const self = { destroy() { clearTimeout(timer); mounted?.destroy(); } };
  current = self;
  window.__spanishArcade.session = session;

  const ctx = {
    lang, t: (k) => k,
    say: ctx0.say,
    canSpeak: false, sfx: () => {}, mascot: () => {},
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    async submit(answer) {
      if (busy) return { ...lastResult, ignored: true };
      const r = session.submit(answer);
      lastResult = r;
      if (r.done) { // saved now, only the screen change is delayed
        result = session.result();
        store.update(profile.id, (p) => recordUnit(p, unit, result, store.now()));
      } else store.update(profile.id, (p) => saveInProgress(p, session.snapshot()));
      if (r.action === 'next') { busy = true; timer = setTimeout(r.done ? finish : show, NEXT_DELAY); }
      return r;
    },
  };

  function show() {
    mounted?.destroy();
    const cur = session.current;
    const host = h('div', { id: 'round' });
    stage.replaceChildren(
      h('p', { class: 'muted', id: 'progress' }, `Exercise ${cur.exerciseIndex + 1}/${unit.exercises.length} · ${cur.roundIndex + 1}/${cur.rounds}`),
      h('p', { id: 'exercise-prompt' }, cur.exercise.prompt?.[lang] ?? ''),
      host, link(`#/profile/${profile.id}`, 'Leave'));
    busy = false;
    mounted = cur.archetype.mount(host, cur.round, ctx);
  }

  function finish() {
    mounted?.destroy(); mounted = null;
    stage.replaceChildren(link(`#/profile/${profile.id}`, 'Back to the map'));
    live.replaceChildren(h('h2', {}, 'All done!'), h('p', { id: 'result-stars' }, stars(result.stars)),
      h('p', {}, `${result.correct} of ${unit.exercises.length} exercises without a reveal.`),
      h('p', { class: 'muted' }, 'Joke of the day: (placeholder)'));
  }

  // Archetypes read ctx.canSpeak at mount, so wait for the voice list first.
  speech.ready().then(() => { if (current !== self) return; ctx.canSpeak = speech.available; show(); });
}

window.__spanishArcade = { store, content, speech, errors, go: (hash) => { location.hash = hash; }, session: null };
addEventListener('hashchange', route);
route();
navigator.storage?.persist?.().catch(() => {});
registerServiceWorker('./sw.js');
