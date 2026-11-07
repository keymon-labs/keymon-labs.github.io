// Placeholder archetype: the template for real ones (rules in logic.js, contract in ../README.md). Unstyled on purpose.
import { make, judge, hint } from './logic.js';

export default {
  id: 'placeholder',
  title: { es: 'Toca la palabra', en: 'Tap the word' },
  emoji: '👆',
  help: { es: 'Mira el dibujo y toca la palabra en español.', en: 'Look at the picture and tap the Spanish word.' },
  skill: 'puzzle',
  pictures: true,
  paramsSchema: {
    from: { type: 'selector' },
    options: { type: 'int', min: 2, max: 4, default: 3 },
  },
  defaults: (difficulty) => ({ options: Math.min(4, difficulty + 1) }),
  make,
  judge,
  hint,

  mount(host, round, ctx) {
    const root = document.createElement('div');
    root.className = 'placeholder';
    const prompt = document.createElement('p');
    prompt.textContent = `${round.emoji} ${round.prompt.es}`;
    const status = document.createElement('p');
    status.setAttribute('aria-live', 'polite');
    const buttons = round.options.map((o) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = o.es;
      b.dataset.id = o.id;
      b.addEventListener('click', async () => {
        ctx.say(o.es);
        const r = await ctx.submit(o.id);
        status.textContent = r.feedback.es;
        ctx.sfx(r.correct ? 'right' : 'wrong');
        const enabled = () => buttons.filter((x) => !x.disabled);
        if (!r.correct && enabled().length > 2) b.disabled = true; // the tapped wrong option is greyed while 2+ others remain
        if (r.hint?.remove && enabled().length > 2) buttons.find((x) => x.dataset.id === r.hint.remove).disabled = true;
        if (r.hint?.answer) buttons.find((x) => x.dataset.id === r.hint.answer).classList.add('reveal');
      });
      return b;
    });
    root.append(prompt, ...buttons, status);
    host.append(root);
    return { destroy: () => root.remove() };
  },
};
