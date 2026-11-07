// odd-one-out: a cloud of words, tap the one that does not belong. Rules in logic.js, params in README.md.
import { make, judge, hint } from './logic.js';

export default {
  id: 'odd-one-out',
  title: { es: 'El intruso', en: 'Odd one out' },
  emoji: '🔎',
  help: { es: 'Una palabra no encaja con las demás. Tócala.', en: 'One word does not belong with the others. Tap it.' },
  skill: 'puzzle',
  paramsSchema: {
    from: { type: 'selector', optional: true },
    groups: { type: 'array', min: 1, optional: true, items: { words: { type: 'array', min: 2, items: { type: 'string' } }, odd: { type: 'string' }, theme: { type: 'string', optional: true } } },
    size: { type: 'int', min: 3, max: 6, default: 4 },
  },
  defaults: (difficulty) => ({ size: Math.min(6, difficulty + 2) }),
  make,
  judge,
  hint,

  mount(host, round, ctx) {
    const root = document.createElement('div');
    root.className = 'odd-one-out';
    const status = document.createElement('p');
    status.setAttribute('aria-live', 'polite');
    const grid = document.createElement('div');
    grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px;justify-content:center';
    const buttons = round.options.map((o) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.id = o.id;
      b.style.minWidth = b.style.minHeight = '64px';
      b.style.fontSize = '1.5rem';
      b.textContent = (o.emoji ? `${o.emoji} ` : '') + o.es;
      b.addEventListener('click', async () => {
        if (ctx.canSpeak) ctx.say(o.es);
        const r = await ctx.submit(o.id);
        if (r.ignored) return;
        status.textContent = (r.correct ? '✅ ' : '❌ ') + (r.feedback[ctx.lang] ?? r.feedback.en) + (r.hint?.theme ? ` 💡 ${r.hint.theme}` : ''); // the theme nudge is read out too
        ctx.sfx(r.correct ? 'right' : 'wrong');
        if (!r.correct) b.disabled = true;
        if (r.hint?.remove) buttons.find((x) => x.dataset.id === r.hint.remove).disabled = true;
        if (r.hint?.answer) buttons.find((x) => x.dataset.id === r.hint.answer).classList.add('reveal');
        if (!r.correct) buttons.find((x) => !x.disabled)?.focus(); // keep focus on the cloud after a miss
      });
      return b;
    });
    grid.append(...buttons);
    root.append(grid, status);
    host.append(root);
    return { destroy: () => root.remove() };
  },
};
