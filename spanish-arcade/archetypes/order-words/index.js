// order-words archetype: build a sentence from word tiles (tap or drag), optionally with ¿ ? ¡ ! . tiles and look-alike decoys. Rules in logic.js, contract in ../README.md.
import { make, judge, hint, tilesFor, textsOf } from './logic.js';
import { injectStyles, el, tapOrDrag } from '../../ui/tiles.js';

const CSS = `.ow-tile{min-height:56px}.ow-tile.mark{min-width:48px;padding:6px 8px}.ow-root .sp-tiles{align-items:center}`;
function ownStyles() {
  if (document.getElementById('ow-styles')) return;
  const s = document.createElement('style');
  s.id = 'ow-styles';
  s.textContent = CSS;
  document.head.append(s);
}

export default {
  id: 'order-words',
  title: { es: 'Ordena la frase', en: 'Order the sentence' },
  emoji: '🧩',
  help: {
    es: 'Toca las palabras en orden, o arrástralas, para formar la frase. Toca una palabra de arriba para quitarla.',
    en: 'Tap the words in order, or drag them, to build the sentence. Tap a placed word to take it back.',
  },
  skill: 'grammar',
  paramsSchema: {
    items: { type: 'array', min: 1, items: { es: { type: 'string' }, accept: { type: 'array', optional: true, items: { type: 'string' } }, emoji: { type: 'string', optional: true }, en: { type: 'string', optional: true } } },
    n: { type: 'int', min: 1, optional: true },
    punctuation: { type: 'bool', default: false },
    decoys: { type: 'int', min: 0, max: 3, default: 0 },
  },
  defaults: (difficulty) => ({ punctuation: difficulty >= 2, decoys: [0, 1, 2][difficulty - 1] ?? 2 }),
  make,
  judge,
  hint,

  mount(host, round, ctx) {
    injectStyles();
    ownStyles();
    let placed = []; // tile ids, in answer order
    let locked = 0; // leading tiles that stay (hint)
    let busy = false;
    let decoysOff = false; // after the reveal the decoys are disabled
    const root = el('div', 'sp-root ow-root');
    const prompt = el('p', 'sp-prompt', round.emoji);
    const say = el('button', 'sp-key', '🔊');
    say.type = 'button';
    say.setAttribute('aria-label', 'Escuchar');
    say.addEventListener('click', () => ctx.say(round.es));
    say.hidden = !(ctx.canSpeak && ctx.difficulty === 1); // it gives the order away: easiest level only
    const reveal = el('p', 'sp-reveal');
    reveal.hidden = true;
    const slots = el('div', 'sp-tiles slots');
    const tray = el('div', 'sp-tiles');
    const check = el('button', 'sp-check', '✔ Comprobar');
    check.type = 'button';
    const status = el('p');
    status.setAttribute('aria-live', 'polite');
    root.append(prompt, say, reveal, slots, tray, check, status);
    host.append(root);

    const tileOf = (id) => round.tiles.find((t) => t.id === id);
    const tile = (t, onTap, onDrop, isLocked) => {
      const b = el('button', `sp-tile ow-tile${/^[¿¡?!.,]$/.test(t.text) ? ' mark' : ''}${isLocked ? ' locked' : ''}`, t.text);
      b.type = 'button';
      b.disabled = isLocked || (decoysOff && t.decoy);
      if (!b.disabled) tapOrDrag(b, { onTap, onDrop, dropZone: () => slots });
      return b;
    };
    const place = (id) => () => { placed.push(id); render(); };
    function render() {
      const free = round.tiles.filter((t) => !placed.includes(t.id));
      slots.replaceChildren(...placed.map((id, i) => tile(tileOf(id), () => { placed.splice(i, 1); render(); }, null, i < locked)));
      tray.replaceChildren(...free.map((t) => tile(t, place(t.id), place(t.id))));
      slots.setAttribute('aria-label', textsOf(round, placed).join(' '));
      check.disabled = busy || free.some((t) => !t.decoy); // ready when every real tile is placed
    }

    async function submit() {
      if (busy || check.disabled) return;
      busy = true;
      render();
      const r = await ctx.submit(textsOf(round, placed));
      status.textContent = `${r.correct ? '✔' : '✖'} ${r.feedback.es}`;
      ctx.sfx(r.correct ? 'right' : 'wrong');
      busy = false;
      if (!r.correct && r.hint?.level === 1) {
        placed = tilesFor(round, r.hint.prefix); // the right leading tiles stay, the rest go back
        locked = placed.length;
      }
      if (!r.correct && r.hint?.level === 2) {
        reveal.textContent = r.hint.text; // stays visible; the child now builds it again
        reveal.hidden = false;
        placed = [];
        locked = 0;
        decoysOff = true;
      }
      render();
    }
    check.addEventListener('click', submit);

    render();
    return { destroy() { root.remove(); } };
  },
};
