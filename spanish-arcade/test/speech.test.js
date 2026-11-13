// Speech helper (ui/speech.js) with a fake speechSynthesis.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickVoice, createSpeech } from '../ui/speech.js';

const v = (lang, localService = false, name = lang) => ({ lang, localService, name });

test('pickVoice: es-ES local > es-ES > es-* local > es-* > none', () => {
  assert.equal(pickVoice([v('en-GB'), v('es-MX', true), v('es-ES'), v('es-ES', true, 'local')]).name, 'local');
  assert.equal(pickVoice([v('es-MX', true), v('es_ES')]).lang, 'es_ES');
  assert.equal(pickVoice([v('es-US'), v('es-MX', true)]).lang, 'es-MX');
  assert.equal(pickVoice([v('en-GB'), v('es-419')]).lang, 'es-419');
  assert.equal(pickVoice([v('en-GB'), v('eu-ES')]), null);
  assert.equal(pickVoice([]), null);
});

test('pickVoice: Spain first even for spa-ESP, a chosen voice wins when installed', () => {
  assert.equal(pickVoice([v('es-US', true), v('spa-ESP')]).lang, 'spa-ESP');
  const mx = { lang: 'es-MX', localService: true, name: 'Ana', voiceURI: 'ana' };
  assert.equal(pickVoice([mx, v('es-ES')], 'ana').name, 'Ana');
  assert.equal(pickVoice([mx, v('es-ES')], 'gone').lang, 'es-ES'); // not installed: back to automatic
});

function fakeSynth(voices, { late = false } = {}) {
  const listeners = {};
  const synth = {
    spoken: [],
    getVoices: () => (late && !synth.loaded ? [] : voices),
    addEventListener: (e, f) => { (listeners[e] ??= []).push(f); },
    removeEventListener: (e, f) => { listeners[e] = (listeners[e] ?? []).filter((x) => x !== f); },
    silent: false,
    speak(u) { synth.spoken.push(u); if (!synth.silent) queueMicrotask(() => u.onend?.()); },
    cancel() {},
    fireVoices() { synth.loaded = true; [...(listeners.voiceschanged ?? [])].forEach((f) => f()); },
  };
  return synth;
}
class Utterance { constructor(text) { this.text = text; } }

test('waits for voiceschanged, then speaks with the Spanish voice', async () => {
  const synth = fakeSynth([v('en-GB'), v('es-ES', true)], { late: true });
  const sp = createSpeech({ synth, Utterance, activation: { hasBeenActive: true } });
  const ready = sp.ready();
  synth.fireVoices();
  assert.equal((await ready).lang, 'es-ES');
  assert.equal(await sp.say('hola', { rate: 0.6 }), true);
  assert.equal(synth.spoken[0].text, 'hola');
  assert.equal(synth.spoken[0].lang, 'es-ES');
  assert.equal(synth.spoken[0].rate, 0.6);
});

test('no Spanish voice, no synth, or no tap yet: say() returns false', async () => {
  const noEs = createSpeech({ synth: fakeSynth([v('en-GB')]), Utterance, activation: { hasBeenActive: true } });
  assert.equal(await noEs.ready(), null);
  assert.equal(noEs.available, false);
  assert.equal(await noEs.say('hola'), false);

  const none = createSpeech({ synth: undefined, Utterance });
  assert.equal(await none.ready(), null);
  assert.equal(await none.say('hola'), false);

  const synth = fakeSynth([v('es-ES')]);
  const notTapped = createSpeech({ synth, Utterance, activation: { hasBeenActive: false } });
  assert.equal(await notTapped.say('hola'), false);
  assert.equal(synth.spoken.length, 0);
});

test('re-picks the voice when voiceschanged fires again', async () => {
  const voices = [v('es-MX')];
  const synth = fakeSynth(voices);
  const sp = createSpeech({ synth, Utterance, activation: { hasBeenActive: true } });
  assert.equal((await sp.ready()).lang, 'es-MX');
  voices.push(v('es-ES', true));
  synth.fireVoices();
  assert.equal(sp.voice.lang, 'es-ES');
  await sp.say('hola');
  assert.equal(synth.spoken[0].lang, 'es-ES');
});

test('say() resolves false when the engine never reports back', async () => {
  const synth = fakeSynth([v('es-ES')]);
  synth.silent = true;
  const sp = createSpeech({ synth, Utterance, activation: { hasBeenActive: true }, sayTimeoutMs: 20 });
  assert.equal(await sp.say('hola'), false);
});

test('voices that never arrive time out to "no voice"', async () => {
  const sp = createSpeech({ synth: fakeSynth([], { late: true }), Utterance, timeoutMs: 10 });
  assert.equal(await sp.ready(), null);
});

// ---- bundled clips ----
import { normLang, normText } from '../ui/speech.js';

class FakeAudio {
  constructor() { this.played = []; this.fail = false; this.duration = 1; }
  play() { this.played.push({ src: this.src, rate: this.playbackRate }); if (this.fail) return Promise.reject(new Error('NotSupported')); queueMicrotask(() => this.onended?.()); return Promise.resolve(); }
  pause() { this.paused = true; }
}
const clipSpeech = (clips, synth, extra = {}) => {
  const audios = [];
  const sp = createSpeech({ synth, Utterance, activation: { hasBeenActive: true }, base: 'http://x/app/',
    Audio: class extends FakeAudio { constructor() { super(); audios.push(this); if (extra.fail) this.fail = true; } },
    loadManifest: async () => ({ clips }), ...extra });
  return { sp, audios };
};

test('normLang: underscores, ISO codes and case become BCP-47', () => {
  assert.equal(normLang('es_ES'), 'es-ES');
  assert.equal(normLang('spa-ESP'), 'es-ES');
  assert.equal(normLang('es_mx'), 'es-MX');
  assert.equal(normLang('es-419'), 'es-419');
  assert.equal(normText('  ¡Hola!   ¿Cómo\n te llamas? '), '¡Hola! ¿Cómo te llamas?');
});

test('utterance gets the normalised tag (es_ES -> es-ES)', async () => {
  const synth = fakeSynth([v('es_ES', true)]);
  const sp = createSpeech({ synth, Utterance, activation: { hasBeenActive: true } });
  await sp.say('hola');
  assert.equal(synth.spoken[0].lang, 'es-ES');
  assert.equal(sp.voices()[0].region, 'es-ES');
});

test('a text with a clip plays the clip and never the browser voice', async () => {
  const synth = fakeSynth([v('es-MX')]);
  const { sp, audios } = clipSpeech({ 'hola mundo': 'abc123' }, synth);
  assert.equal(await sp.say('  hola   mundo ', { rate: 0.9 }), true);
  assert.equal(audios[0].played[0].src, 'http://x/app/audio/abc123.mp3');
  assert.equal(audios[0].played[0].rate, 1);
  assert.equal(synth.spoken.length, 0);
  assert.equal(sp.info().last, 'clip');
  await sp.say('hola mundo', { rate: 0.45 });
  assert.equal(audios.length, 1); // one reused element
  assert.equal(audios[0].played[1].rate, 0.5);
});

test('no clip for the text, or voiceOnly: browser voice', async () => {
  const synth = fakeSynth([v('es-ES')]);
  const { sp, audios } = clipSpeech({ hola: 'abc123' }, synth);
  assert.equal(await sp.say('adiós'), true);
  assert.equal(await sp.say('hola', { voiceOnly: true }), true);
  assert.deepEqual(synth.spoken.map((u) => u.text), ['adiós', 'hola']);
  assert.equal(audios.length, 0);
  assert.equal(sp.info().last, 'voice');
});

test('a clip that fails to play falls back to the browser voice', async () => {
  const synth = fakeSynth([v('es-ES')]);
  const { sp } = clipSpeech({ hola: 'abc123' }, synth, { fail: true });
  assert.equal(await sp.say('hola'), true);
  assert.equal(synth.spoken.length, 1);
});

test('empty or broken manifest: exactly the old behaviour', async () => {
  const synth = fakeSynth([v('es-ES')]);
  for (const loadManifest of [async () => ({ clips: {} }), async () => { throw new Error('404'); }]) {
    const sp = createSpeech({ synth, Utterance, activation: { hasBeenActive: true }, base: 'http://x/', Audio: FakeAudio, loadManifest });
    assert.equal(await sp.say('hola'), true);
  }
  assert.equal(synth.spoken.length, 2);
  const none = createSpeech({ synth: fakeSynth([v('en-GB')]), Utterance, base: 'http://x/', loadManifest: async () => ({ clips: {} }) });
  await none.ready();
  assert.equal(none.available, false);
});

test('clips alone make speech available, even without any Spanish voice; an id with a path is ignored', async () => {
  const { sp } = clipSpeech({ hola: 'abc123', mal: '../x' }, fakeSynth([v('en-GB')]));
  await sp.ready();
  assert.equal(sp.available, true);
  assert.equal(await sp.say('hola'), true);
  assert.equal(await sp.say('mal'), false);
});

test('no tap yet: no clip either; stop() aborts a clip without the browser voice', async () => {
  const synth = fakeSynth([v('es-ES')]);
  const { sp, audios } = clipSpeech({ hola: 'abc123' }, synth, { activation: { hasBeenActive: false } });
  assert.equal(await sp.say('hola'), false);
  assert.equal(audios.length, 0);

  const slow = createSpeech({ synth, Utterance, activation: { hasBeenActive: true }, base: 'http://x/', loadManifest: async () => ({ clips: { hola: 'abc123' } }),
    Audio: class extends FakeAudio { play() { return Promise.resolve(); } } }); // never ends
  const p = slow.say('hola');
  await new Promise((r) => setTimeout(r, 10));
  slow.stop();
  assert.equal(await p, false);
  assert.equal(synth.spoken.length, 0);
});
