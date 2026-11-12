// read-answer: read a short text, answer a question (a/b/c or true/false). Rules in logic.js, params in README.md.
import { make, judge, hint } from './logic.js';

const T = {
  ready: 'Ya lo he leído',
  listenText: 'Escuchar el texto',
  listenQ: 'Escuchar la pregunta',
  marked: 'La respuesta correcta lleva ✔.',
  look: 'Mira la frase marcada.',
  reread: 'Lee el texto otra vez.',
};

export default {
  id: 'read-answer',
  title: { es: 'Lee y contesta', en: 'Read and answer' },
  emoji: '📖',
  help: { es: 'Lee el texto y contesta la pregunta. Si fallas, te marcamos la frase que te ayuda.', en: 'Read the text and answer the question. If you miss, we mark the sentence that helps.' },
  skill: 'reading',
  paramsSchema: {
    text: { type: 'array', items: { type: 'string' }, min: 2 },
    emoji: { type: 'string', optional: true },
    kind: { type: 'enum', values: ['abc', 'tf'], default: 'abc' },
    questions: {
      type: 'array', min: 1,
      items: {
        q: { type: 'string' },
        options: { type: 'array', items: { type: 'string' }, optional: true },
        answer: { type: 'int', min: 0, optional: true },
        ok: { type: 'bool', optional: true },
        evidence: { type: 'int', min: 0, optional: true },
      },
    },
    showTextWhileAnswering: { type: 'bool', default: true },
  },
  defaults: (difficulty) => ({ showTextWhileAnswering: difficulty < 3 }),
  make,
  judge,
  hint,

  mount(host, round, ctx) {
    const el = (tag, css, text) => {
      const e = document.createElement(tag);
      if (css) e.style.cssText = css;
      if (text !== undefined) e.textContent = text;
      return e;
    };
    const speaker = (label, text) => {
      const b = el('button', 'min-width:56px;min-height:56px', '🔊');
      b.type = 'button';
      b.setAttribute('aria-label', label);
      b.addEventListener('click', () => ctx.say(text));
      return b;
    };

    const root = el('div', 'overflow-wrap:anywhere');
    root.className = 'read-answer';
    const status = el('p', 'status');
    status.setAttribute('aria-live', 'polite');

    const box = el('div', 'padding:12px;border:2px solid var(--accent);border-radius:12px;margin-bottom:12px');
    if (round.emoji) box.append(el('div', 'font-size:3rem;text-align:center', round.emoji));
    const sentences = round.text.map((s, i) => {
      const span = el('span', 'padding:2px 4px;border-radius:6px', s);
      span.dataset.i = i;
      return span;
    });
    const body = el('p', 'margin:0;line-height:1.7');
    sentences.forEach((s, i) => { if (i) body.append(' '); body.append(s); });
    box.append(body);
    if (ctx.canSpeak) box.append(speaker(T.listenText, round.text.join(' ')));

    const mark = (index) => {
      sentences.forEach((s, i) => {
        const on = index === i;
        s.style.background = on ? 'var(--accent)' : '';
        s.style.fontWeight = on ? 'bold' : '';
        s.style.textDecoration = on ? 'underline' : '';
        s.style.color = on ? '#222' : '';
        s.style.outline = on ? '2px dotted #222' : '';
        s.dataset.mark = on ? '1' : '';
      });
      if (index != null) sentences[index].scrollIntoView?.({ block: 'nearest', behavior: ctx.reducedMotion ? 'auto' : 'smooth' });
    };

    const qRow = el('div', 'display:flex;align-items:center;gap:8px');
    qRow.append(el('p', 'flex:1;font-weight:bold;margin:8px 0', round.q));
    if (ctx.canSpeak) qRow.append(speaker(T.listenQ, round.q));

    const buttons = round.options.map((o) => {
      const b = el('button', 'display:block;width:100%;min-height:56px;margin:8px 0;text-align:left');
      b.type = 'button';
      b.dataset.id = o.id;
      b.textContent = typeof o.text === 'string' ? o.text : o.text.es;
      b.addEventListener('click', async () => {
        const r = await ctx.submit(o.id);
        status.textContent = (r.correct ? '✅ ' : '❌ ') + r.feedback.es;
        ctx.sfx(r.correct ? 'right' : 'wrong');
        if (r.correct) return;
        if (round.options.length > 2) b.disabled = true; // with two options this would give the answer away
        if (r.hint) {
          showText();
          mark(r.hint.evidence);
          status.textContent += ` ${(r.hint.evidence == null ? T.reread : T.look)}`;
          if (r.hint.answer) {
            const right = buttons.find((x) => x.dataset.id === r.hint.answer);
            right.classList.add('reveal');
            right.style.outline = '4px double currentColor'; // marked without changing its text (the badge is in the label)
            right.setAttribute('aria-label', `✔ ${right.textContent}`);
            status.textContent += ` ${T.marked}`;
          }
        }
      });
      return b;
    });
    if (!document.getElementById('ra-styles')) {
      const st = document.createElement('style');
      st.id = 'ra-styles';
      st.textContent = '@media (orientation:landscape) and (max-height:520px){.ra-answers{display:grid;grid-template-columns:1fr 1fr;column-gap:12px}.ra-answers>div,.ra-answers>.status{grid-column:1/-1}.ra-answers>.status{margin:2px 0}}';
      document.head.append(st);
    }
    const answers = el('div');
    answers.className = 'ra-answers';
    answers.append(qRow, ...buttons, status);

    // showTextWhileAnswering false: read first, then the text hides; a hint brings it back.
    let ready;
    const showText = () => { box.hidden = false; answers.hidden = false; ready?.remove(); ready = null; };
    if (!round.showText) {
      answers.hidden = true;
      ready = el('button', '', T.ready);
      ready.type = 'button';
      ready.addEventListener('click', () => { box.hidden = true; answers.hidden = false; ready.remove(); ready = null; buttons[0].focus(); });
      root.append(box, ready, answers);
    } else root.append(box, answers);
    host.append(root);
    return { destroy: () => root.remove() };
  },
};
