// paragraph-editor archetype: the fox's diary needs an editor. Tap a wrong word in a short paragraph and fix it; one judged round per mistake. Rules in logic.js, params in README.md.
import { make, judge, hint, defaultFixed, remaining, countLabel, kindsLabel, KINDS } from './logic.js';
import { injectStyles, el, specialLettersRow } from '../../ui/tiles.js';

const CSS = `
.pe-head{display:flex;align-items:center;gap:8px;margin:4px 0}
.pe-head>span{font-size:2.2rem}
.pe-bubble{margin:0;padding:8px 12px;border-radius:16px;background:var(--soft,#eee);color:var(--fg,inherit);font-size:1rem;flex:1}
.pe-count{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center;justify-content:center;margin:2px 0;font-weight:bold;min-height:1.5em}
.pe-stamp{color:var(--good,green);border:3px solid var(--good,green);border-radius:8px;padding:0 8px;transform:rotate(-4deg)}
.pe-text{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin:8px 0}
.pe-word{min-width:36px;min-height:40px;padding:2px 7px;font:inherit;font-size:1.15rem;border-radius:10px;border:2px solid var(--line,currentColor);background:var(--card,Canvas);color:var(--fg,inherit);cursor:pointer;touch-action:manipulation}
.pe-word[aria-pressed=true]{outline:4px solid var(--accent,currentColor);outline-offset:1px}
.pe-word.hinted{outline:4px double currentColor}
.pe-word.ok{border-color:var(--good,green);color:var(--good,green);font-weight:bold}
.pe-word:disabled{opacity:1}
.pe-fix{text-align:center;margin:4px 0}
.pe-fix input{font:inherit;font-size:1.3rem;width:12ch;max-width:100%;min-height:44px;text-align:center;border-radius:10px;border:2px solid currentColor;background:var(--card,Canvas);color:var(--fg,inherit)}
.pe-fix .sp-opt[aria-pressed=true]{outline:4px solid var(--accent,currentColor);outline-offset:1px}
`;

export default {
  id: 'paragraph-editor',
  title: { es: 'Editor de párrafos', en: 'Paragraph editor' },
  emoji: '📖',
  help: {
    es: 'El diario del zorro tiene errores. Toca una palabra mal escrita y corrígela. Si todo está bien, di «Ya está perfecto».',
    en: "The fox's diary has mistakes. Tap a wrong word and fix it. When everything is right, say it is perfect.",
  },
  skill: 'spelling',
  paramsSchema: {
    texts: {
      type: 'array', min: 1,
      items: {
        text: { type: 'string' },
        errors: { type: 'array', min: 1, items: { at: { type: 'int', min: 0 }, as: { type: 'string' }, kind: { type: 'enum', values: KINDS, optional: true }, alts: { type: 'array', items: { type: 'string' }, optional: true } } },
      },
    },
    fix: { type: 'enum', values: ['choice', 'type'], default: 'choice' },
    options: { type: 'int', min: 2, max: 3, default: 3 },
    showCount: { type: 'bool', default: true },
    showKind: { type: 'bool', default: false },
    allowPerfect: { type: 'bool', default: false },
  },
  defaults: (d) => ({ fix: d >= 3 ? 'type' : 'choice', showCount: d < 3, showKind: d === 1, allowPerfect: d >= 3 }),
  make,
  judge,
  hint,

  mount(host, round, ctx) {
    injectStyles();
    if (!document.getElementById('pe-styles')) {
      const s = el('style');
      s.id = 'pe-styles';
      s.textContent = CSS;
      document.head.append(s);
    }
    const typing = round.fix === 'type';
    const pkey = round.textKey + round.clean.join(' ');
    // the board survives from round to round of the same text, whichever mistake the child fixed first; a resumed round assumes the first k
    const prev = board.progress;
    let fixed = prev && prev.key === pkey && prev.fixed.length === round.k ? [...prev.fixed] : defaultFixed(round);
    let sel = null;
    let pick = null;
    let hinted = -1; // level 2: the word whose right form was shown
    let busy = false;
    let done = false; // the paragraph is finished (stamp, words locked)

    const root = el('div', 'pe-root');
    const bubble = el('p', 'pe-bubble', round.finish ? '¿Todo bien? Léelo otra vez.' : round.k === 0 ? 'Mi diario necesita un editor. Toca una palabra mal escrita.' : '¡Sigue! Todavía hay algo mal.');
    const head = el('div', 'pe-head');
    head.append(el('span', '', '📖'), bubble);
    head.firstChild.setAttribute('aria-hidden', 'true');
    const count = el('div', 'pe-count');
    count.setAttribute('aria-live', 'polite');
    const text = el('div', 'pe-text');
    text.setAttribute('role', 'group');
    text.setAttribute('aria-label', 'Párrafo');
    const fixBox = el('div', `pe-fix${typing ? ' typing' : ''}`);
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
    const reveal = el('p', 'sp-reveal');
    const check = el('button', 'sp-check', '✔ Comprobar');
    check.type = 'button';
    check.addEventListener('click', () => submit());
    if (typing) fixBox.append(chosen, reveal, input, specialLettersRow(insert, { onBackspace: back, backLabel: 'Borrar' }), check);
    else fixBox.append(chosen, reveal, options);
    const perfect = el('button', 'sp-check', 'Ya está perfecto');
    perfect.type = 'button';
    perfect.hidden = !round.allowPerfect;
    perfect.addEventListener('click', () => { if (!busy && !done) submit({ perfect: true }); });
    const status = el('p');
    status.setAttribute('aria-live', 'polite');
    root.append(head, count, text, fixBox, perfect, status);
    host.append(root);

    const left = () => remaining(round, fixed);
    const errAt = (i) => round.errors.find((e) => e.at === i);

    function render() {
      const n = left().length;
      const bits = [];
      if (done) bits.push('✔ Corregido');
      else {
        if (round.showCount) bits.push(countLabel(n));
        if (round.showKind && n) bits.push(kindsLabel(left()));
      }
      count.replaceChildren(...bits.map((b, i) => el('span', done ? 'pe-stamp' : '', i ? `· ${b}` : b)));
      text.replaceChildren(...round.words.map((w, i) => {
        const fixedNow = done || round.finish || fixed.includes(i);
        const b = el('button', `pe-word${fixedNow && round.clean[i] !== w ? ' ok' : ''}${hinted === i ? ' hinted' : ''}`, fixedNow ? round.clean[i] : w);
        b.type = 'button';
        b.disabled = done;
        b.setAttribute('aria-pressed', String(sel === i));
        b.addEventListener('click', () => {
          if (busy || done) return;
          if (!errAt(i) || fixed.includes(i)) { status.textContent = 'Esta palabra está bien.'; return; } // not a submit
          if (sel !== i) { pick = null; input.value = ''; reveal.textContent = hinted === i ? `Es: ${errAt(i).right}` : ''; }
          sel = i;
          status.textContent = '';
          render();
          if (typing) input.focus();
        });
        return b;
      }));
      const fixing = sel !== null && !done;
      fixBox.hidden = !fixing;
      root.classList.toggle('fixing', fixing);
      perfect.disabled = busy || done;
      if (fixing) {
        chosen.textContent = round.words[sel];
        if (!typing) {
          options.replaceChildren(...errAt(sel).choices.map((o) => {
            const b = el('button', 'sp-opt', o);
            b.type = 'button';
            b.setAttribute('aria-pressed', String(pick === o));
            b.addEventListener('click', () => { if (!busy) { pick = o; submit(); } });
            return b;
          }));
        }
        check.disabled = busy || !input.value.trim();
      }
    }

    async function submit(extra) {
      const sent = extra ?? { at: sel, fix: typing ? input.value.trim() : pick, fixed: [...fixed] };
      if (!extra && (sel === null || !sent.fix)) return;
      busy = true;
      render();
      const r = await ctx.submit(sent);
      busy = false;
      status.textContent = `${r.correct ? '✔' : '✖'} ${r.feedback.es}`;
      ctx.sfx(r.correct ? 'right' : 'wrong');
      ctx.mascot(r.correct ? 'happy' : 'oops');
      if (r.correct) {
        if (!extra) fixed.push(sent.at);
        board.progress = { key: pkey, fixed: [...fixed] };
        sel = null;
        hinted = -1;
        reveal.textContent = '';
        done = extra ? true : !left().length && !round.allowPerfect;
        if (done) {
          bubble.textContent = '¡Párrafo corregido!';
          if (ctx.canSpeak) ctx.say(round.clean.join(' '));
        } else if (!extra) bubble.textContent = left().length ? '¡Bien! Sigue buscando.' : '¡Todo corregido! ¿Lo ves perfecto?';
      } else {
        pick = null;
        input.value = '';
        const h = r.hint;
        if (h?.level === 1) {
          status.textContent += ` ${h.line.es}`;
          if (h.say && ctx.canSpeak) ctx.say(h.say); // the correct sentence, so the ear can catch a stress mark
        }
        if (h?.level === 2 && h.at >= 0) { // idempotent: shown again on every retry
          hinted = h.at;
          sel = h.at;
          reveal.textContent = `Es: ${h.answer}`;
        }
      }
      render();
    }
    render();
    return { destroy: () => root.remove() };
  },
};
const board = { progress: null }; // survives between rounds of one paragraph (the shell destroys each mount)
