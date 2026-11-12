// listen-pick-word: speak a Spanish word, the child taps the word or picture. Rules in logic.js, params in README.md.
import { make, judge, hint } from './logic.js';

const NOTICE = '🔇 Sin voz: mira el dibujo';
let noticeShown = false; // the chip appears once per session, not every round
const CSS = '.lpw-bar{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center}.lpw-bar .lpw-pic{font-size:4rem;margin:0;line-height:1.1}.lpw-bar .lpw-chip{margin:0;font-size:.9rem;color:var(--muted)}@media (orientation:landscape) and (max-height:520px){.listen-pick-word{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,3fr);column-gap:16px;align-items:center}.listen-pick-word .status{grid-column:2}.lpw-bar .lpw-pic{font-size:3rem}}';

export default {
  id: 'listen-pick-word',
  title: { es: 'Escucha y toca', en: 'Listen and tap' },
  emoji: '🎧',
  help: { es: 'Escucha la palabra y toca la correcta. Puedes oírla otra vez.', en: 'Listen to the word and tap the right one. You can hear it again.' },
  skill: 'listening',
  pictures: true,
  paramsSchema: {
    from: { type: 'selector' },
    distractorFrom: { type: 'selector', optional: true },
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
    if (!document.getElementById('lpw-styles')) {
      const st = document.createElement('style');
      st.id = 'lpw-styles';
      st.textContent = CSS;
      document.head.append(st);
    }
    const root = document.createElement('div');
    root.className = 'listen-pick-word';
    const status = document.createElement('p');
    status.className = 'status';
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
    bar.className = 'lpw-bar';
    if (voice) {
      let played = false;
      const play = async (rate, btn) => {
        if (played && round.replay === false) return;
        if (await ctx.say(round.prompt.es, { rate }) && round.replay === false) { played = true; btn.disabled = true; }
      };
      const listen = control('Escuchar', '🔊', () => play(0.9, listen));
      bar.append(listen);
      if (round.replay !== false) bar.append(control('Más despacio', '🐢', () => play(0.5)));
      play(0.9, listen); // works if the child already tapped; otherwise they press the speaker
    } else {
      const pic = document.createElement('p');
      pic.className = 'lpw-pic';
      pic.textContent = round.emoji;
      bar.append(pic);
      if (!noticeShown) {
        noticeShown = true;
        const notice = document.createElement('p');
        notice.className = 'lpw-chip';
        notice.textContent = NOTICE;
        bar.prepend(notice);
      }
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
        status.textContent = (r.correct ? '✅ ' : '❌ ') + (r.feedback.es);
        ctx.sfx(r.correct ? 'right' : 'wrong');
        if (r.correct && voice) ctx.say(o.es);
        const enabled = () => buttons.filter((x) => !x.disabled);
        if (!r.correct && enabled().length > 2) b.disabled = true; // never leave only the answer
        if (r.hint?.remove && enabled().length > 2) buttons.find((x) => x.dataset.id === r.hint.remove).disabled = true;
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
