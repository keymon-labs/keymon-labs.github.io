// Profile store in localStorage["spanish-arcade:v1"] (PLAN §4.4). Storage, clock and uuid are injected; no DOM.
import { validateStore, MAX_PROFILES } from './schema.js';
import { THEMES, PALETTES } from './home.js';

export const STORE_KEY = 'spanish-arcade:v1';
export { MAX_PROFILES };
const DEFAULT_SETTINGS = { lang: 'es', sound: true, textSize: 1, lastBackupAt: null, debug: false, voice: '', theme: 'auto', palette: 'caramel' };

const empty = () => ({ schema: 1, profiles: [], settings: { ...DEFAULT_SETTINGS } });

/**
 * createStore({ storage: localStorage, clock: () => new Date(), uuid: () => crypto.randomUUID() })
 * Unreadable data is copied to "<key>:corrupt" before starting fresh, so nothing is silently lost.
 */
export function createStore({ storage, clock = () => new Date(), uuid = () => crypto.randomUUID() }) {
  let data = empty();
  let loadError = null;
  const raw = storage.getItem(STORE_KEY);
  if (raw != null) {
    try {
      const parsed = JSON.parse(raw);
      const errs = validateStore(parsed);
      if (errs.length) throw new Error(errs.join('; '));
      data = { ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } };
      data.settings.debug = data.settings.debug === true; // hidden test mode: anything else is off
      if (typeof data.settings.voice !== 'string') data.settings.voice = '';
      if (!THEMES.includes(data.settings.theme)) data.settings.theme = 'auto';
      if (!PALETTES.includes(data.settings.palette)) data.settings.palette = 'caramel';
    } catch (e) {
      loadError = e.message;
      storage.setItem(`${STORE_KEY}:corrupt`, raw);
    }
  }
  const save = () => storage.setItem(STORE_KEY, JSON.stringify(data));

  return {
    get data() { return data; },
    get loadError() { return loadError; },
    profile: (id) => data.profiles.find((p) => p.id === id) ?? null,

    addProfile({ firstName, fullName = '', class: cls = '', avatar = '' }) {
      if (data.profiles.length >= MAX_PROFILES) throw new Error(`at most ${MAX_PROFILES} profiles`);
      if (!firstName?.trim()) throw new Error('a first name is needed');
      const p = { id: uuid(), firstName: firstName.trim(), fullName: fullName.trim(), class: cls.trim(), avatar,
        created: clock().toISOString(), units: {}, words: {}, history: [], inProgress: null, badges: [] };
      data = { ...data, profiles: [...data.profiles, p] };
      save();
      return p;
    },

    removeProfile(id) { data = { ...data, profiles: data.profiles.filter((p) => p.id !== id) }; save(); },

    /** fn(profile) -> new profile (use progress.js helpers). */
    update(id, fn) {
      data = { ...data, profiles: data.profiles.map((p) => (p.id === id ? fn(p) : p)) };
      save();
      return this.profile(id);
    },

    setSettings(patch) { data = { ...data, settings: { ...data.settings, ...patch } }; save(); },
    now: () => clock().toISOString(),
  };
}
