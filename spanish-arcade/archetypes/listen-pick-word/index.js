// listen-pick-word: speak a Spanish word, the child taps the word or picture. Rules in logic.js, params in README.md.
import { make, judge, hint } from './logic.js';

const NOTICE = {
  es: 'Este dispositivo no tiene voz en español. Mira el dibujo y toca la palabra.',
  en: 'This device has no Spanish voice. Look at the picture and tap the word.',
};

export default {
  id: 'listen-pick-word',
  title: { es: 'Escucha y toca', en: 'Listen and tap' },
  emoji: '🎧',
  help: { es: 'Escucha la palabra y toca la correcta. Puedes oírla otra vez.', en: 'Listen to the word and tap the right one. You can hear it again.' },
  skill: 'listening',
  pictures: true,
  paramsSchema: {
    from: { type: 'selector' },
    options: { type: 'int', min: 2, max: 6, default: 3 },
    answerAs: { type: 'enum', values: ['word', 'picture'], default: 'word' },
    replay: { type: 'bool', default: true },
    similar: { type: 'bool', default: false },
  },
  defaults: (difficulty) => ({ options: Math.min(6, difficulty + 2), similar: difficulty >= 3 }),
  make,
  judge,
  hint,

  mount(host, round, ctx) {
    const root = document.createElement('div');
    root.className = 'listen-pick-word';
    const status = document.createElement('p');
    status.setAttribute('aria-live', 'polite');
    const control = (label, text, onClick) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lpw-listen';
      b.style.minWidth = b.style.minHeight = '56px';
      b.setAttribute('aria-label', label);
      b.textContent = text;
      b.addEventListener('click', onClick);
      return b;
    };

    const voice = ctx.canSpeak;
    const asPicture = voice && round.answerAs === 'picture'; // no voice: picture prompt, word options
    const bar = document.createElement('div');
    if (voice) {
      let played = false;
      const play = async (rate, btn) => {
        if (played && round.replay === false) return;
        if (await ctx.say(round.prompt.es, { rate }) && round.replay === false) { played = true; btn.disabled = true; }
      };
      const listen = control(ctx.lang === 'es' ? 'Escuchar' : 'Listen', '🔊', () => play(0.9, listen));
      bar.append(listen);
      if (round.replay !== false) bar.append(control(ctx.lang === 'es' ? 'Más despacio' : 'Slower', '🐢', () => play(0.5)));
      ctx.say(round.prompt.es); // works if the child already tapped; otherwise they press the speaker
    } else {
      const notice = document.createElement('p');
      notice.textContent = NOTICE[ctx.lang] ?? NOTICE.en;
      const pic = document.createElement('p');
      pic.style.fontSize = '4rem';
      pic.textContent = round.emoji || round.prompt.en; // shortcut: a word with no emoji falls back to its English gloss
      bar.append(notice, pic);
    }

    const buttons = round.options.map((o) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.id = o.id;
      b.style.minWidth = b.style.minHeight = '64px';
      b.style.fontSize = asPicture ? '2.5rem' : '1.5rem';
      b.textContent = asPicture ? o.emoji : o.es;
      if (asPicture) b.setAttribute('aria-label', o.es);
      b.addEventListener('click', async () => {
        const r = await ctx.submit(o.id);
        status.textContent = (r.correct ? '✅ ' : '❌ ') + (r.feedback[ctx.lang] ?? r.feedback.en);
        ctx.sfx(r.correct ? 'right' : 'wrong');
        if (r.correct && voice) ctx.say(o.es);
        if (!r.correct) b.disabled = true;
        if (r.hint?.remove) buttons.find((x) => x.dataset.id === r.hint.remove).disabled = true;
        if (r.hint?.answer) buttons.find((x) => x.dataset.id === r.hint.answer).classList.add('reveal');
      });
      return b;
    });
    const grid = document.createElement('div');
    grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px;justify-content:center';
    grid.append(...buttons);
    root.append(bar, grid, status);
    host.append(root);
    return { destroy: () => root.remove() };
  },
};
