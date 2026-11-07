// Spanish speech for every audio archetype (PLAN §5 "Speech"): waits for voiceschanged, needs a tap first,
// prefers on-device voices, es-ES then any es-*, else reports "no voice" so games can switch to pictures.

const isEs = (v) => /^es([-_]|$)/i.test(v.lang);
const isEsES = (v) => /^es[-_]es$/i.test(v.lang);

/** Best Spanish voice or null. */
export function pickVoice(voices) {
  const rank = (v) => (isEsES(v) ? 0 : 2) + (v.localService ? 0 : 1);
  return voices.filter(isEs).sort((a, b) => rank(a) - rank(b))[0] ?? null;
}

/**
 * createSpeech() in the browser; tests inject synth, Utterance and activation.
 * ready() -> voice or null. say(text, {rate}) -> true if spoken, false if no voice / no tap yet / no synth.
 */
export function createSpeech({
  synth = globalThis.speechSynthesis,
  Utterance = globalThis.SpeechSynthesisUtterance,
  activation = globalThis.navigator?.userActivation,
  timeoutMs = 2000,
} = {}) {
  let voice = null;
  let waiting = null;

  const ready = () => {
    if (!synth || !Utterance) return Promise.resolve(null);
    waiting ??= new Promise((resolve) => {
      const done = () => { synth.removeEventListener?.('voiceschanged', check); clearTimeout(timer); voice = pickVoice(synth.getVoices()); resolve(voice); };
      const check = () => { if (synth.getVoices().length) done(); };
      // Some browsers never fire voiceschanged when there are no voices: give up after timeoutMs.
      const timer = setTimeout(done, timeoutMs);
      synth.addEventListener?.('voiceschanged', check);
      check();
    });
    return waiting;
  };

  return {
    ready,
    get available() { return voice !== null; },
    get voice() { return voice; },
    async say(text, { rate = 0.9 } = {}) {
      // Browsers block speech before the first user gesture; callers speak from a tap handler.
      if (activation && !activation.hasBeenActive) return false;
      const v = await ready();
      if (!v) return false;
      synth.cancel();
      const u = new Utterance(text);
      u.voice = v;
      u.lang = v.lang;
      u.rate = rate;
      return new Promise((resolve) => { u.onend = () => resolve(true); u.onerror = () => resolve(false); synth.speak(u); });
    },
    stop: () => synth?.cancel(),
  };
}
