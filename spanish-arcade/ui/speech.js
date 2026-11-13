// Spanish speech for every audio archetype (PLAN §5 "Speech"): bundled Castilian clips first (audio/manifest.json,
// made by `npm run audio`), then the browser voice: waits for voiceschanged, needs a tap first, prefers on-device
// voices, es-ES then any es-*, else reports "no voice" so games can switch to pictures.

const isEs = (v) => /^(es|spa)([-_]|$)/i.test(v.lang); // some Android engines say spa-ESP instead of es-ES
const isEsES = (v) => /^(es[-_]es|spa[-_]esp)$/i.test(v.lang);
const idOf = (v) => v.voiceURI || v.name;

/** BCP-47 tag for a voice: es_ES -> es-ES, spa-ESP -> es-ES (Android reports underscores and ISO 639-2 codes). */
export const normLang = (tag = '') => (/^spa[-_]esp$/i.test(tag) ? 'es-ES' : tag.replace(/_/g, '-').replace(/^([a-z]+)(?=-|$)/i, (l) => l.toLowerCase()).replace(/-([a-z]{2})$/i, (_, r) => `-${r.toUpperCase()}`));

/** Key of a spoken text in the clip manifest. Must match scripts/audio-lib.mjs (the generator imports this). */
export const normText = (text) => String(text).normalize('NFC').replace(/\s+/g, ' ').trim();

/** Spanish voices, Spain first. */
export const spanishVoices = (voices) => voices.filter(isEs).sort((a, b) => rank(a) - rank(b));
const rank = (v) => (isEsES(v) ? 0 : 2) + (v.localService ? 0 : 1);

/** The chosen voice if installed, else the best Spanish voice (Spain first, on-device first) or null. */
export function pickVoice(voices, preferred = '') {
  const es = spanishVoices(voices);
  return (preferred && es.find((v) => idOf(v) === preferred)) || es[0] || null;
}

// The app root (the lab page lives one folder deeper). No location (node tests) = no bundled clips.
const defaultBase = () => (globalThis.location ? new URL(location.pathname.replace(/lab\/(index\.html)?$/, ''), location.href).href : null);
const EMPTY = { clips: {} };

/** Fetches audio/manifest.json; any problem (404, offline, bad JSON) means "no clips". */
async function fetchManifest(base) {
  if (!base || typeof fetch !== 'function') return EMPTY;
  try {
    const res = await fetch(new URL('audio/manifest.json', base), { signal: globalThis.AbortSignal?.timeout?.(4000) });
    const m = res.ok ? await res.json() : null;
    return m && typeof m.clips === 'object' && m.clips ? m : EMPTY;
  } catch { return EMPTY; }
}

/**
 * createSpeech() in the browser; tests inject synth, Utterance, activation, base/loadManifest and Audio.
 * ready() -> voice or null (also loads the clip manifest). say(text, {rate, voiceOnly}) -> true if spoken, false if
 * nothing could speak / no tap yet. A bundled clip is played when the manifest has one; otherwise the browser voice.
 */
export function createSpeech({
  synth = globalThis.speechSynthesis,
  Utterance = globalThis.SpeechSynthesisUtterance,
  activation = globalThis.navigator?.userActivation,
  Audio = globalThis.Audio,
  base = defaultBase(),
  loadManifest = () => fetchManifest(base),
  timeoutMs = 2000,
  sayTimeoutMs = 10000,
} = {}) {
  let voice = null;
  let manifest = EMPTY;
  let last = null; // 'clip' | 'voice' of the latest say()
  let audio = null; // one element, reused (phones allow it after the first tap)
  let abort = null; // resolves the clip being played as aborted
  let waiting = null;
  let preferred = ''; // voice id chosen in settings; '' = automatic (Spain first)
  // Voices can change later (installed, or a list that arrives in parts): pick again every time.
  synth?.addEventListener?.('voiceschanged', () => { voice = pickVoice(synth.getVoices(), preferred); });

  const voicesReady = () => {
    if (!synth || !Utterance) return Promise.resolve(null);
    return new Promise((resolve) => {
      const done = () => { synth.removeEventListener?.('voiceschanged', check); clearTimeout(timer); voice = pickVoice(synth.getVoices(), preferred); resolve(voice); };
      const check = () => { if (synth.getVoices().length) done(); };
      // Some browsers never fire voiceschanged when there are no voices: give up after timeoutMs.
      const timer = setTimeout(done, timeoutMs);
      synth.addEventListener?.('voiceschanged', check);
      check();
    });
  };
  const ready = () => {
    waiting ??= Promise.all([loadManifest().then((m) => { manifest = m; }, () => {}), voicesReady()]).then(([, v]) => v);
    return waiting;
  };

  /** Plays a bundled clip: 'played', 'failed' (use the browser voice) or 'aborted' (stop() or a newer say()). */
  async function playClip(file, rate) {
    if (!Audio || !base) return 'failed';
    abort?.();
    audio ??= new Audio();
    const a = audio;
    return new Promise((resolve) => {
      let started = false;
      let timer;
      const done = (r) => { clearTimeout(timer); a.onended = a.onerror = null; if (abort === cancel) abort = null; resolve(r); };
      const cancel = () => { try { a.pause(); } catch { /* nothing playing */ } done('aborted'); };
      abort = cancel;
      a.onended = () => done('played');
      a.onerror = () => done(started ? 'played' : 'failed'); // a clip that broke half-way is not repeated by the browser voice
      a.preservesPitch = true;
      a.src = new URL(file, base).href;
      a.playbackRate = Math.min(1.5, Math.max(0.5, rate / 0.9)); // clips are recorded at the normal speed (rate 0.9)
      timer = setTimeout(() => done('failed'), 5000); // must start within 5 s
      Promise.resolve(a.play()).then(() => {
        started = true;
        clearTimeout(timer);
        timer = setTimeout(() => done('played'), ((a.duration || 20) * 1000) / a.playbackRate + 3000);
      }, () => done('failed'));
    });
  }

  return {
    ready,
    get available() { return voice !== null || Object.keys(manifest.clips).length > 0; },
    get voice() { return voice; },
    /** For the settings screen: bundled clips, the phone voice in use, whether it is from Spain, and what the last say() used. */
    info: () => ({ clips: Object.keys(manifest.clips).length, voice: voice && { name: voice.name, region: normLang(voice.lang), spain: isEsES(voice) }, last }),
    voices: () => spanishVoices(synth?.getVoices?.() ?? []).map((v) => ({ id: idOf(v), name: v.name, region: normLang(v.lang) })),
    setPreferred(id) { preferred = id || ''; if (synth) voice = pickVoice(synth.getVoices(), preferred); },
    async say(text, { rate = 0.9, voiceOnly = false } = {}) {
      // Browsers block speech before the first user gesture; callers speak from a tap handler.
      if (activation && !activation.hasBeenActive) return false;
      await ready();
      const id = voiceOnly ? undefined : manifest.clips[normText(text)];
      if (typeof id === 'string' && /^[\w-]+$/.test(id)) {
        synth?.cancel();
        const r = await playClip(`audio/${id}.mp3`, rate);
        if (r !== 'failed') { last = 'clip'; return r === 'played'; }
      }
      const v = voice; // current pick, not the first one ready() resolved with
      if (!v) return false;
      abort?.();
      synth.cancel();
      last = 'voice';
      const u = new Utterance(text);
      u.voice = v;
      u.lang = normLang(v.lang);
      u.rate = rate;
      return new Promise((resolve) => {
        // Some engines (Android) never fire onend/onerror: don't leave the caller waiting.
        const timer = setTimeout(() => resolve(false), sayTimeoutMs + text.length * 150);
        u.onend = () => { clearTimeout(timer); resolve(true); };
        u.onerror = () => { clearTimeout(timer); resolve(false); };
        synth.speak(u);
      });
    },
    stop: () => { abort?.(); synth?.cancel(); },
  };
}
