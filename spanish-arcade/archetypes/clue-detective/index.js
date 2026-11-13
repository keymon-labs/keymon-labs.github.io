// clue-detective: suspect cards and clue notes; cross out who the clues rule out, then pick the culprit. Rules in logic.js, params in README.md, styles in style.css (/* clue-detective */).
import { make, judge, hint } from './logic.js';

const DEFAULT_CASE = 'Caso cerrado';

export default {
  id: 'clue-detective',
  title: { es: 'Detective', en: 'Clue detective' },
  emoji: '🕵️',
  help: { es: 'Lee las pistas. Toca una carta para tacharla si no puede ser. Cuando sepas quién es, pulsa «Es este».', en: 'Read the clues. Tap a card to cross it out if it cannot be. When you know who it is, press "Es este".' },
  skill: 'reading',
  paramsSchema: {
    cases: {
      type: 'array', min: 1,
      items: {
        suspects: { type: 'array', min: 4, items: { name: { type: 'string' }, emoji: { type: 'string', optional: true }, place: { type: 'string', optional: true } } },
        clues: { type: 'array', min: 1, items: { type: 'string' } },
        answer: { type: 'int', min: 0 },
        rules: { type: 'array', optional: true, items: { type: 'array', items: { type: 'int', min: 0 } } },
      },
    },
    reveal: { type: 'enum', values: ['one', 'all'], default: 'one' },
    crossOut: { type: 'bool', default: true },
    n: { type: 'int', min: 1, optional: true },
  },
  defaults: (difficulty) => ({ reveal: difficulty === 1 ? 'all' : 'one' }),
  make,
  judge,
  hint,

  mount(host, round, ctx) {
    const el = (tag, cls, text) => {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text !== undefined) e.textContent = text;
      return e;
    };
    const root = el('div', 'clue-detective');
    const status = el('p', 'status');
    status.setAttribute('aria-live', 'polite');

    // clues
    let shown = round.reveal === 'all' ? round.clues.length : 1;
    const list = el('ol', 'cd-clues');
    const more = el('button', 'cd-more');
    more.type = 'button';
    const clueEls = round.clues.map((text, i) => {
      const li = el('li', 'cd-clue');
      const b = el(ctx.canSpeak ? 'button' : 'span', 'cd-clue-text', (ctx.canSpeak ? '🔊 ' : '') + text);
      if (ctx.canSpeak) { b.type = 'button'; b.addEventListener('click', () => ctx.say(text)); }
      li.append(b);
      return li;
    });
    const syncClues = () => {
      clueEls.forEach((li, i) => { li.hidden = i >= shown; });
      more.hidden = shown >= round.clues.length;
      more.textContent = `🔎 Otra pista (${shown}/${round.clues.length})`;
    };
    more.addEventListener('click', () => { shown++; syncClues(); ctx.sfx('tap'); clueEls[shown - 1].classList.add('new'); });
    list.append(...clueEls);

    // suspects
    const out = new Set();
    const grid = el('div', 'cd-grid');
    const cards = round.suspects.map((s) => {
      const card = el('div', 'cd-card');
      card.dataset.id = s.id;
      const face = el('button', 'cd-face');
      face.type = 'button';
      face.append(el('span', 'cd-emoji', s.emoji), el('span', 'cd-name', s.name), ...(s.place ? [el('span', 'cd-place', s.place)] : []));
      const pick = el('button', 'cd-pick', 'Es este');
      pick.type = 'button';
      pick.setAttribute('aria-label', `Es ${s.name}`);
      const mark = (on) => {
        on ? out.add(s.id) : out.delete(s.id);
        card.classList.toggle('out', on);
        face.setAttribute('aria-pressed', String(on));
        face.setAttribute('aria-label', `${s.name}${s.place ? `, ${s.place}` : ''}${round.crossOut ? (on ? ', tachado. Toca para volver a ponerlo' : '. Toca para tacharlo') : ''}`);
        pick.disabled = on;
      };
      mark(false);
      if (round.crossOut) face.addEventListener('click', () => mark(!out.has(s.id)));
      else face.disabled = true;
      pick.addEventListener('click', async () => {
        const r = await ctx.submit(s.id);
        if (r.ignored) return;
        status.textContent = (r.correct ? '✅ ' : '❌ ') + r.feedback.es;
        ctx.sfx(r.correct ? 'right' : 'wrong');
        if (r.correct) {
          root.classList.add('closed');
          ctx.say(`${s.name}. ${DEFAULT_CASE}.`);
          return;
        }
        const h = r.hint;
        if (!h) return;
        if (h.level === 1) {
          clueEls.forEach((li) => li.classList.remove('new'));
          if (h.clue != null) {
            shown = Math.max(shown, h.clue + 1);
            clueEls[h.clue].classList.add('new');
            status.textContent += ' Mira la pista marcada.';
          } else if (shown < round.clues.length) {
            shown++;
            clueEls[shown - 1].classList.add('new');
            status.textContent += ' Aquí tienes otra pista.';
          }
          syncClues();
          for (const id of h.out) { cards.find((c) => c.dataset.id === id)?._mark(true); }
        } else if (h.answer) {
          shown = round.clues.length;
          syncClues();
          for (const c of cards) c._mark(c.dataset.id !== h.answer);
          const right = cards.find((c) => c.dataset.id === h.answer);
          right.classList.add('reveal');
          right.querySelector('.cd-pick').setAttribute('aria-label', `✔ Es ${right.querySelector('.cd-name').textContent}`);
          status.textContent += ' La carta con ✔ es la buena. Púlsala.';
        }
      });
      card._mark = mark;
      card.append(face, pick);
      return card;
    });
    grid.append(...cards);
    syncClues();
    root.append(grid, list, more, status);
    host.append(root);
    return { destroy: () => root.remove() };
  },
};
