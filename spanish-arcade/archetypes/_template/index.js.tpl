// __ID__: __TITLE__ — pick the right answer among options. Rules in logic.js, params in README.md, styles in style.css (/* __ID__ */).
import { make, judge, hint } from './logic.js';

export default {
  id: '__ID__',
  title: { es: '__TITLE__', en: '__TITLE__' },
  emoji: '🎯',
  help: { es: 'Lee la frase y toca la respuesta correcta.', en: 'Read the sentence and tap the right answer.' },
  skill: 'puzzle', // listening | spelling | reading | grammar | puzzle: decides what counts for the unit mix
  paramsSchema: {
    items: {
      type: 'array', min: 1,
      items: { prompt: { type: 'string' }, answer: { type: 'string' }, wrong: { type: 'array', min: 1, items: { type: 'string' } } },
    },
    n: { type: 'int', min: 1, optional: true },
  },
  make,
  judge,
  hint,

  mount(host, round, ctx) {
    const root = document.createElement('div');
    root.className = '__ID__';
    const prompt = document.createElement('p');
    prompt.className = '__ID__-prompt';
    prompt.textContent = round.prompt;
    const status = document.createElement('p');
    status.className = '__ID__-status';
    status.setAttribute('aria-live', 'polite');
    const buttons = round.options.map((text) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = '__ID__-opt';
      b.textContent = text;
      b.addEventListener('click', async () => {
        ctx.say(text);
        const r = await ctx.submit(text);
        status.textContent = r.feedback.es;
        ctx.sfx(r.correct ? 'right' : 'wrong');
        if (!r.correct) b.disabled = true;
        if (r.hint?.remove) buttons.find((x) => x.textContent === r.hint.remove)?.setAttribute('disabled', '');
        if (r.hint?.answer) buttons.find((x) => x.textContent === r.hint.answer)?.classList.add('reveal');
      });
      return b;
    });
    root.append(prompt, ...buttons, status);
    host.append(root);
    return { destroy: () => root.remove() };
  },
};
