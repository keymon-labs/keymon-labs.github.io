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
const content = loadContent();
const speech = createSpeech();
const NEXT_DELAY = 700;

function safeStorage() {
  try { localStorage.getItem('x'); return localStorage; }
  catch { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; }
}
const store = createStore({ storage: safeStorage() });
for (const p of store.data.profiles) store.update(p.id, (x) => applyRev(x, content.units));

// Local-only error ring buffer (last 20). Nothing is sent anywhere.
const errors = [];
const logError = (msg) => { errors.push({ at: new Date().toISOString(), msg: String(msg).slice(0, 300) }); if (errors.length > 20) errors.shift(); };
for (const e of [...content.errors, ...(store.loadError ? [`store: ${store.loadError}`] : [])]) logError(e);
addEventListener('error', (e) => logError(e.message));
addEventListener('unhandledrejection', (e) => logError(e.reason?.message ?? e.reason));
const diagnostic = () => JSON.stringify({ app: 'spanish-arcade', build: __BUILD__, ua: navigator.userAgent, errors }, null, 2);

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
const stars = (n) => h('span', { class: 'stars', 'aria-label': `${n} of 3 stars` }, '★'.repeat(n), h('span', {}, '★'.repeat(3 - n)));

function footer() {
  return h('footer', {}, `Spanish Arcade v1 · build ${__BUILD__} · © 2026 keymon-labs · `,
    h('a', { href: 'https://github.com/keymon-labs/keymon-labs.github.io/blob/main/NOTICE.md' }, 'CC BY-NC-SA 4.0'));
}

let current = null; // mounted screen, if any: { destroy() }
let activeId = null;
const activeProfile = () => store.profile(activeId) ?? store.data.profiles[0] ?? null;

function screen(...kids) {
  const main = h('main', {}, ...kids);
  root.replaceChildren(main, footer());
  return main;
}

function route() {
  current?.destroy(); current = null;
  const [page, id] = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (page === 'profile' && store.profile(id)) { activeId = id; return renderProfile(store.profile(id)); }
  if (page === 'unit' && content.unitById[id] && activeProfile()) return playUnit(activeProfile(), content.unitById[id]);
  if (page === 'settings') return gate(renderSettingsScreen);
  renderHome();
}

function renderHome() {
  const profiles = store.data.profiles;
  const main = screen(h('h1', {}, 'Spanish Arcade'));
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
  const main = screen(h('h1', {}, `Hello, ${profile.firstName}!`));
  main.append(h('ul', { class: 'list' }, content.units.map((u) => {
    const open = isUnlocked(profile, content.units, u.id);
    const st = profile.units[u.id]?.stars ?? 0;
    const resumable = profile.inProgress?.unitId === u.id;
    return h('li', { class: open ? '' : 'locked' }, open ? link(`#/unit/${u.id}`, u.title.en, 'btn unit') : h('span', {}, `🔒 ${u.title.en}`), ' ', stars(st), resumable ? h('span', { class: 'muted' }, ' (resume)') : null);
  })));
  main.append(link('#/', 'Back'), link('#/settings', 'Settings'));
}

function renderSettingsScreen() {
  const main = screen();
  current = renderSettings(main, { store, content, diagnostic });
  main.append(link(activeProfile() ? `#/profile/${activeProfile().id}` : '#/', 'Back'));
}

function playUnit(profile, unit) {
  const lang = store.data.settings.lang;
  const session = createUnitSession({ unit, content, seed: attemptSeed(profile, unit.id), resume: profile.inProgress });
  const main = screen();
  let mounted = null;
  let timer = null;
  const self = { destroy() { clearTimeout(timer); mounted?.destroy(); } };
  current = self;
  window.__spanishArcade.session = session;

  const ctx = {
    lang, t: (k) => k,
    say: (text, opts) => (store.data.settings.sound ? speech.say(text, opts) : Promise.resolve(false)),
    canSpeak: false, sfx: () => {}, mascot: () => {},
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    async submit(answer) {
      const r = session.submit(answer);
      store.update(profile.id, (p) => (r.done ? p : saveInProgress(p, session.snapshot())));
      if (r.action === 'next') timer = setTimeout(r.done ? finish : show, NEXT_DELAY);
      return r;
    },
  };

  function show() {
    mounted?.destroy();
    const cur = session.current;
    main.replaceChildren(
      h('p', { class: 'muted', id: 'progress' }, `${unit.title[lang] ?? unit.title.en} · exercise ${cur.exerciseIndex + 1}/${unit.exercises.length} · ${cur.roundIndex + 1}/${cur.rounds}`),
      h('p', { id: 'exercise-prompt' }, cur.exercise.prompt?.[lang] ?? ''),
    );
    const host = h('div', { id: 'round' });
    main.append(host, link(`#/profile/${profile.id}`, 'Leave'));
    mounted = cur.archetype.mount(host, cur.round, ctx);
  }

  function finish() {
    mounted?.destroy(); mounted = null;
    const res = session.result();
    store.update(profile.id, (p) => recordUnit(p, unit, res, store.now()));
    main.replaceChildren(
      h('h1', {}, 'All done!'), h('p', { id: 'result-stars' }, stars(res.stars)),
      h('p', {}, `${res.correct} of ${unit.exercises.length} exercises without a reveal.`),
      h('p', { class: 'muted' }, 'Joke of the day: (placeholder)'),
      link(`#/profile/${profile.id}`, 'Back to the map'));
  }

  // Archetypes read ctx.canSpeak at mount, so wait for the voice list first.
  speech.ready().then(() => { if (current !== self) return; ctx.canSpeak = speech.available; session.done ? finish() : show(); });
}

window.__spanishArcade = { store, content, speech, errors, go: (hash) => { location.hash = hash; }, session: null };
addEventListener('hashchange', route);
route();
navigator.storage?.persist?.().catch(() => {});
registerServiceWorker('./sw.js');
