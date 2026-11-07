// read-answer: read a short text, answer a question (a/b/c or true/false). Rules in logic.js, params in README.md.
import { make, judge, hint } from './logic.js';

const T = {
  ready: { es: 'Ya lo he leído', en: 'I have read it' },
  listen: { es: 'Escuchar', en: 'Listen' },
  look: { es: 'Mira la frase marcada.', en: 'Look at the marked sentence.' },
  reread: { es: 'Lee el texto otra vez.', en: 'Read the text again.' },
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
    const L = (o) => o[ctx.lang] ?? o.en;
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
    const status = el('p');
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
    if (ctx.canSpeak) box.append(speaker(L(T.listen), round.text.join(' ')));

    const mark = (index) => {
      sentences.forEach((s, i) => {
        const on = index === i;
        s.style.background = on ? 'var(--accent)' : '';
        s.style.fontWeight = on ? 'bold' : '';
        s.style.textDecoration = on ? 'underline' : '';
        s.dataset.mark = on ? '1' : '';
      });
      if (index != null) sentences[index].scrollIntoView?.({ block: 'nearest', behavior: ctx.reducedMotion ? 'auto' : 'smooth' });
    };

    const qRow = el('div', 'display:flex;align-items:center;gap:8px');
    qRow.append(el('p', 'flex:1;font-weight:bold;margin:8px 0', round.q));
    if (ctx.canSpeak) qRow.append(speaker(L(T.listen), round.q));

    const buttons = round.options.map((o) => {
      const b = el('button', 'display:block;width:100%;min-height:56px;margin:8px 0;text-align:left');
      b.type = 'button';
      b.dataset.id = o.id;
      b.textContent = typeof o.text === 'string' ? o.text : (ctx.lang === 'es' ? o.text.es : `${o.text.es} / ${o.text.en}`);
      b.addEventListener('click', async () => {
        const r = await ctx.submit(o.id);
        status.textContent = (r.correct ? '✅ ' : '❌ ') + L(r.feedback);
        ctx.sfx(r.correct ? 'right' : 'wrong');
        if (r.correct) return;
        if (round.options.length > 2) b.disabled = true; // with two options this would give the answer away
        if (r.hint) {
          showText();
          mark(r.hint.evidence);
          status.textContent += ` ${L(r.hint.evidence == null ? T.reread : T.look)}`;
          if (r.hint.answer) {
            const right = buttons.find((x) => x.dataset.id === r.hint.answer);
            right.classList.add('reveal');
            right.textContent = `✔ ${right.textContent}`;
          }
        }
      });
      return b;
    });
    const answers = el('div');
    answers.append(qRow, ...buttons, status);

    // showTextWhileAnswering false: read first, then the text hides; a hint brings it back.
    let ready;
    const showText = () => { box.hidden = false; answers.hidden = false; ready?.remove(); ready = null; };
    if (!round.showText) {
      answers.hidden = true;
      ready = el('button', '', L(T.ready));
      ready.type = 'button';
      ready.addEventListener('click', () => { box.hidden = true; answers.hidden = false; ready.remove(); ready = null; });
      root.append(box, ready, answers);
    } else root.append(box, answers);
    host.append(root);
    return { destroy: () => root.remove() };
  },
};
