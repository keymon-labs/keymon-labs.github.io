// fill-gap-choice archetype: pick (tap or drag) the word that fills the gap. Rules in logic.js, params in README.md.
import { make, judge, hint, speakerShown, FOCUSES } from './logic.js';
import { injectStyles, el, tapOrDrag } from '../../ui/tiles.js';

const CSS = `
.fg-sentence{font-size:1.7rem;text-align:center;margin:12px 0;line-height:2.6rem}
.fg-gap{display:inline-block;min-width:4.5ch;min-height:48px;line-height:48px;vertical-align:middle;border-bottom:3px dashed currentColor;text-align:center}
.fg-gap.hinted{background:rgba(255,200,0,.35);outline:3px dotted currentColor}
.fg-gap.filled{border-bottom-style:solid;font-weight:bold}
.fg-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.fg-gap.land{animation:fg-land .45s ease-out}
@keyframes fg-land{from{transform:translateY(60px) scale(.6);opacity:.2}to{transform:none;opacity:1}}
.fg-pic{font-size:3rem;text-align:center;margin:4px 0}
.fg-opt{position:relative;width:auto;height:auto;min-height:64px;padding:6px 18px}
.fg-opt.wrong{text-decoration:line-through}
.fg-opt.wrong::after,.fg-opt.reveal::after{position:absolute;top:-8px;right:-4px;font-size:1rem;line-height:1;text-decoration:none}
.fg-opt.wrong::after{content:'✖'}
.fg-opt.reveal::after{content:'👉'}
.fg-opt.reveal{outline:4px double currentColor}
`;

export default {
  id: 'fill-gap-choice',
  title: { es: 'Completa la frase', en: 'Fill the gap' },
  emoji: '🧩',
  help: {
    es: 'Falta una palabra en la frase. Toca la palabra correcta o arrástrala al hueco.',
    en: 'A word is missing from the sentence. Tap the right word or drag it into the gap.',
  },
  skill: 'grammar',
  paramsSchema: {
    from: { type: 'selector', optional: true },
    items: { type: 'array', optional: true, items: { text: { type: 'string' }, options: { type: 'array', items: { type: 'string' } }, answer: { type: 'string' }, en: { type: 'string', optional: true } } },
    n: { type: 'int', min: 1, optional: true },
    focus: { type: 'enum', values: FOCUSES, default: 'article' },
    options: { type: 'int', min: 2, max: 4, default: 3 },
  },
  defaults: (difficulty) => ({ options: Math.min(4, difficulty + 1) }),
  make,
  judge,
  hint,

  mount(host, round, ctx) {
    injectStyles();
    if (!document.getElementById('fg-styles')) {
      const s = el('style');
      s.id = 'fg-styles';
      s.textContent = CSS;
      document.head.append(s);
    }
    let busy = false;
    let done = false;

    const root = el('div', 'fg-root');
    const gap = el('span', 'fg-gap');
    const gapName = el('span', 'fg-sr', 'hueco');
    gap.append(gapName);
    const sentence = el('p', 'fg-sentence');
    sentence.append(round.parts[0], gap, round.parts[1]);
    const say = el('button', 'sp-key', '🔊');
    say.type = 'button';
    say.setAttribute('aria-label', 'Escuchar la frase');
    say.hidden = !speakerShown(ctx.canSpeak, ctx.difficulty); // it reads the answer too, so not from difficulty 2
    say.addEventListener('click', () => ctx.say(round.heard));
    const row = el('div', 'sp-row');
    const status = el('p', 'status');
    status.setAttribute('aria-live', 'polite');
    const head = [];
    if (round.emoji) head.push(el('p', 'fg-pic', round.emoji));

    const buttons = new Map();
    for (const o of round.options) {
      const b = el('button', 'sp-tile fg-opt', o);
      b.type = 'button';
      tapOrDrag(b, { onTap: () => pick(o, b), dropZone: () => gap, onDrop: () => pick(o, b) });
      buttons.set(o, b);
      row.append(b);
    }
    root.append(...head, sentence, say, row, status);
    host.append(root);

    async function pick(o, b) {
      if (busy || done || b.disabled) return;
      busy = true;
      const r = await ctx.submit(o);
      busy = false;
      status.textContent = `${r.correct ? '✔' : '✖'} ${r.feedback.es}${r.correct ? ` ${round.full}` : ''}`;
      ctx.sfx(r.correct ? 'right' : 'wrong');
      if (r.correct) {
        done = true;
        gap.textContent = o;
        gap.classList.remove('hinted');
        gap.classList.add('filled');
        if (!ctx.reducedMotion) gap.classList.add('land');
        buttons.forEach((x) => { x.disabled = true; });
        if (ctx.canSpeak) ctx.say(round.full);
        return;
      }
      const enabled = () => [...buttons.values()].filter((x) => !x.disabled);
      if (enabled().length > 2) { // with 2 left the tapped one stays, so the child is never left with only the answer
        b.disabled = true;
        b.classList.add('wrong'); // the badge is CSS: the text never changes, so the row does not re-wrap
      }
      const h = r.hint;
      if (h?.mark) gap.classList.add('hinted');
      if (h?.remove && enabled().length > 2) buttons.get(h.remove).disabled = true;
      if (h?.answer !== undefined) { // level 2: show it and let the child pick it
        const a = buttons.get(h.answer);
        a.classList.add('reveal');
        gap.classList.add('hinted');
        status.textContent += ' La respuesta correcta está marcada con 👉.';
      }
      enabled()[0]?.focus();
    }
    return { destroy: () => root.remove() };
  },
};
