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
