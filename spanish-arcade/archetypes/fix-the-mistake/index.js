// fix-the-mistake archetype: the fox wrote a text with one mistake; tap the wrong word, then fix it. Rules in logic.js, params in README.md.
import { make, judge, hint, parts, FOCUS_CHOICES } from './logic.js';
import { injectStyles, el, specialLettersRow } from '../../ui/tiles.js';

const CSS = `
.fm-fox{display:flex;align-items:center;gap:10px;margin:6px 0}
.fm-fox>span{font-size:2.6rem}
.fm-bubble{margin:0;padding:10px 14px;border-radius:16px;background:var(--soft,#eee);color:var(--fg,inherit);font-size:1.1rem}
.fm-text{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:12px 0}
.fm-word{min-width:48px;min-height:48px;padding:6px 10px;font:inherit;font-size:1.5rem;border-radius:10px;border:2px solid var(--line,currentColor);background:var(--card,Canvas);color:var(--fg,inherit);cursor:pointer;touch-action:manipulation}
.fm-word[aria-pressed=true]{outline:4px solid var(--accent,currentColor);outline-offset:1px}
.fm-word.dim{opacity:.3}
.fm-word.hinted{outline:4px double currentColor}
.fm-word:disabled{opacity:1}
.fm-word.dim:disabled{opacity:.3}
.fm-word.ok{border-color:var(--good,green);color:var(--good,green);font-weight:bold}
.fm-fix{text-align:center;margin:8px 0}
.fm-fix input{font:inherit;font-size:1.5rem;width:12ch;max-width:100%;min-height:48px;text-align:center;border-radius:10px;border:2px solid currentColor;background:var(--card,Canvas);color:var(--fg,inherit)}
.sp-opt[aria-pressed=true]{outline:4px solid var(--accent,currentColor);outline-offset:1px}
`;

export default {
  id: 'fix-the-mistake',
  title: { es: 'Corrige el error', en: 'Fix the mistake' },
  emoji: '🔎',
  help: {
    es: 'El zorro escribió algo con un error. Toca la palabra mal escrita, elige o escribe cómo se escribe bien y toca Comprobar.',
    en: 'The fox wrote something with one mistake. Tap the wrong word, pick or type the right spelling, then tap Check.',
  },
  skill: 'spelling',
  paramsSchema: {
    from: { type: 'selector', optional: true },
    items: { type: 'array', optional: true, items: { text: { type: 'string' }, at: { type: 'int', min: 0, optional: true }, as: { type: 'string', optional: true }, perfect: { type: 'bool', optional: true }, en: { type: 'string', optional: true } } },
    focus: { type: 'enum', values: FOCUS_CHOICES, default: 'auto' },
    mode: { type: 'enum', values: ['list', 'sentence'], optional: true },
    size: { type: 'int', min: 3, max: 5, default: 3 },
    fix: { type: 'enum', values: ['choice', 'type'], default: 'choice' },
    allowPerfect: { type: 'bool', default: false },
    spot: { type: 'bool', default: false },
    options: { type: 'int', min: 2, max: 3, default: 2 },
  },
  defaults: (d) => ({ size: d + 2, fix: d >= 3 ? 'type' : 'choice', allowPerfect: d >= 3, spot: d >= 2, options: d >= 2 ? 3 : 2 }),
  make,
  judge,
  hint,

  mount(host, round, ctx) {
    injectStyles();
    if (!document.getElementById('fm-styles')) {
      const s = el('style');
      s.id = 'fm-styles';
      s.textContent = CSS;
      document.head.append(s);
    }
    const typing = round.fix === 'type';
    let sel = round.spot ? null : round.at; // without spotting the fox points at the word itself
    let pick = null; // chosen option
    let keep = null; // hint: indices left undimmed
    let hinted = false; // level 2: the wrong word is outlined
    let busy = false;
    let done = false;

    const root = el('div', 'fm-root');
    const bubble = el('p', 'fm-bubble', round.spot ? 'He escrito esto. ¿Hay algún error?' : 'Hay un error en esta palabra. ¿Cómo se escribe bien?');
    const fox = el('div', 'fm-fox');
    fox.append(el('span', '', '🦊'), bubble);
    fox.firstChild.setAttribute('aria-hidden', 'true');
    const text = el('div', 'fm-text');
    text.setAttribute('role', 'group');
    text.setAttribute('aria-label', 'Texto');
    const reveal = el('p', 'sp-reveal');
    const fixBox = el('div', 'fm-fix');
    const chosen = el('p', 'sp-reveal');
    const options = el('div', 'sp-row');
    const input = el('input');
    input.type = 'text';
    input.autocomplete = 'off';
    input.autocapitalize = 'off';
    input.spellcheck = false;
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('aria-label', 'Escribe la palabra bien');
    input.addEventListener('input', render);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    const insert = (ch) => { input.value += ch; input.focus(); render(); };
    const back = () => { input.value = input.value.slice(0, -1); input.focus(); render(); };
    if (typing) fixBox.append(chosen, input, specialLettersRow(insert, { onBackspace: back, backLabel: 'Borrar' }));
    else fixBox.append(chosen, options);
    const perfect = el('button', 'sp-check', '¡Está perfecto!');
    perfect.type = 'button';
    perfect.hidden = !(round.allowPerfect && round.spot);
    perfect.addEventListener('click', () => { if (!busy && !done) { sel = -1; pick = null; render(); } });
    const check = el('button', 'sp-check', '✔ Comprobar');
    check.type = 'button';
    check.addEventListener('click', submit);
    const status = el('p');
    status.setAttribute('aria-live', 'polite');
    root.append(fox, text, perfect, fixBox, reveal, check, status);
    host.append(root);

    const fixValue = () => (typing ? input.value.trim() : pick);

    function render() {
      const words = done ? round.text.split(' ') : round.words;
      text.replaceChildren(...words.map((w, i) => {
        const b = el('button', `fm-word${keep && !keep.includes(i) ? ' dim' : ''}${hinted && i === round.at ? ' hinted' : ''}${done ? ' ok' : ''}`, w);
        b.type = 'button';
        b.disabled = done;
        b.setAttribute('aria-pressed', String(sel === i));
        b.addEventListener('click', () => {
          if (busy || done || !round.spot) return;
          if (sel !== i) { pick = null; input.value = ''; }
          sel = i;
          render();
          if (typing) input.focus();
        });
        return b;
      }));
      perfect.setAttribute('aria-pressed', String(sel === -1));
      const fixing = sel !== null && sel >= 0 && !done;
      fixBox.hidden = !fixing;
      if (fixing) {
        chosen.textContent = parts(round.words[sel])[1];
        if (!typing) {
          options.replaceChildren(...round.choices.map((o) => {
            const b = el('button', 'sp-opt', o);
            b.type = 'button';
            b.setAttribute('aria-pressed', String(pick === o));
            b.addEventListener('click', () => { if (!busy) { pick = o; render(); } });
            return b;
          }));
        }
      }
      check.disabled = busy || done || sel === null || (sel >= 0 && !fixValue());
    }

    async function submit() {
      if (check.disabled) return;
      busy = true;
      render();
      const sent = { at: sel, fix: sel >= 0 ? fixValue() : '' };
      const r = await ctx.submit(sent);
      busy = false;
      status.textContent = `${r.correct ? '✔' : '✖'} ${r.feedback.es}`;
      ctx.sfx(r.correct ? 'right' : 'wrong');
      ctx.mascot(r.correct ? 'happy' : 'oops');
      if (r.correct) {
        done = true;
        keep = null;
        reveal.textContent = '';
        bubble.textContent = round.perfect ? '¡Estaba perfecto!' : '¡Ya está bien escrito!';
      } else {
        const h = r.hint;
        if (sent.at !== round.at) { sel = round.spot ? null : round.at; pick = null; input.value = ''; } // wrong word: tap again
        else { pick = null; input.value = ''; } // right word, wrong fix
        if (h?.level === 1) {
          keep = h.keep;
          status.textContent += ` ${h.line.es}`;
        }
        if (h?.level === 2) { // stays visible and idempotent; the child now taps the word and fixes it
          keep = null;
          hinted = !round.perfect;
          reveal.textContent = round.perfect ? '¡Está perfecto!' : h.answer;
          if (round.spot) { sel = null; pick = null; input.value = ''; }
        }
      }
      render();
    }
    render();
    return { destroy: () => root.remove() };
  },
};
