// Shared UI for the spelling archetypes: tile styles, tap-or-drag tiles, special-letters row. Styles are injected once from here.
export const SPECIAL = ['ñ', 'á', 'é', 'í', 'ó', 'ú', 'ü', '¿', '¡'];

const CSS = `
.sp-root{--tile:min(64px,calc((100vw - 32px - 40px)/6));display:flex;flex-direction:column}
.sp-root>.sp-say{align-self:center}
.sp-tiles{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:10px 0;min-height:var(--tile)}
.sp-tiles.slots{border-bottom:3px solid var(--line);padding-bottom:8px}
.sp-tile,.sp-key,.sp-opt,.sp-check{min-width:48px;min-height:48px;padding:6px 12px;font:inherit;font-size:1.4rem;border-radius:14px;border:2px solid var(--accent);background:var(--card);color:var(--fg);cursor:pointer;touch-action:manipulation;margin:0;box-shadow:none}
.sp-tile{width:var(--tile);height:var(--tile);padding:0;touch-action:none}
.sp-tile.empty{border:2px dashed var(--line);background:transparent}
.sp-tile.empty[disabled]{opacity:1}
.sp-tile.used{border-style:dashed;border-color:var(--line);background:transparent;color:transparent}
.sp-tile.used[disabled]{opacity:.5}
.sp-tile.locked{background:var(--accent);color:var(--on-accent);border-color:transparent}
.sp-tile.locked[disabled]{opacity:1}
.sp-tile.ghost{position:relative;z-index:5;pointer-events:none}
.sp-opt[disabled],.sp-tile[disabled]{opacity:.35}
.sp-check{min-height:var(--tap);width:100%;font-size:1.15rem;font-weight:700;background:var(--accent);color:var(--on-accent);border-color:transparent}
.sp-check[disabled]{background:transparent;color:var(--muted);border-color:var(--line);opacity:1}
.sp-key{font-size:1.1rem;min-width:48px;min-height:48px}
.sp-opt{min-width:var(--tile);min-height:var(--tile)}
.sp-say{width:56px;height:56px;border-radius:50%;padding:0}
.sp-root>.sp-say{align-self:center;justify-self:center}
.sp-gap{min-width:48px;min-height:56px;font:inherit;font-size:1.6rem;text-align:center;border:2px solid var(--line);border-radius:12px;background:var(--card);color:inherit;width:3ch;margin:0 3px}
.sp-gap.active{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent)}
.sp-gap.hinted{background:rgba(255,200,0,.35);outline:3px dotted currentColor}
.sp-word{font-size:1.8rem;letter-spacing:.05em;margin:10px 0;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:2px}
.sp-reveal{font-size:1.6rem;font-weight:bold;text-align:center;margin:6px 0;min-height:2.4rem}
.sp-prompt{font-size:2.4rem;text-align:center;margin:6px 0}
.sp-row{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:8px 0}.sp-note{flex:0 0 100%;margin:0;text-align:center;font-size:.8rem;color:var(--muted,#667)}
@media (orientation:landscape) and (max-height:520px){
.sp-root{--tile:clamp(44px,calc(((100vw - 48px) * .6 - 6px * var(--n,8)) / var(--n,8)),52px);display:grid;grid-template-columns:minmax(0,2fr) minmax(0,3fr);grid-template-rows:auto auto 1fr auto;grid-template-areas:'p w' 's t' 'r t' 'c x';column-gap:16px;align-items:start}
.sp-root>.sp-prompt{grid-area:p;align-self:center}.sp-root>.sp-say{grid-area:s;justify-self:center}.sp-root>.sp-reveal{grid-area:r}
.sp-root>.slots,.sp-root>.sp-word{grid-area:w}.sp-root>.tray,.sp-root>.sp-row{grid-area:t}.sp-root>.sp-check{grid-area:c}.sp-root>.status{grid-area:x;align-self:center}
.sp-prompt{font-size:2rem;margin:0}
.sp-reveal{margin:2px 0;min-height:1.8rem}
.sp-tiles{margin:4px 0;gap:6px}
.sp-word{margin:4px 0}
.sp-row{margin:4px 0}
}
`;

export function injectStyles() {
  if (document.getElementById('sp-styles')) return;
  const s = document.createElement('style');
  s.id = 'sp-styles';
  s.textContent = CSS;
  document.head.append(s);
}

export function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

/**
 * Row of buttons for typing without the phone keyboard: the gap's own letters (letters), ñ á é í ó ú ü ¿ ¡, and a backspace.
 * They never take focus, so a typing field keeps its caret.
 */
export function specialLettersRow(onPick, { letters = [], onBackspace, backLabel = 'Borrar' } = {}) {
  const row = el('div', 'sp-row');
  row.setAttribute('role', 'group');
  row.setAttribute('aria-label', 'ñ á é í ó ú ü ¿ ¡');
  row.append(el('p', 'sp-note', 'Escribe con el teclado. Letras especiales, si tu teclado no las tiene:'));
  const add = (text, fn, label) => {
    const b = el('button', 'sp-key', text);
    b.type = 'button';
    if (label) b.setAttribute('aria-label', label);
    b.addEventListener('pointerdown', (e) => e.preventDefault());
    b.addEventListener('click', fn);
    row.append(b);
  };
  for (const ch of new Set([...letters, ...SPECIAL])) add(ch, () => onPick(ch));
  if (onBackspace) add('⌫', onBackspace, backLabel);
  return row;
}

/**
 * A tile is tapped (onTap) or dragged onto `dropZone()` (onDrop). Both paths exist so no drag is required.
 * A drag that ends outside the zone just snaps back.
 */
export function tapOrDrag(tile, { onTap, dropZone, onDrop }) {
  let start = null;
  let dragged = false;
  tile.addEventListener('pointerdown', (e) => {
    if (tile.disabled || !onDrop) return;
    start = { x: e.clientX, y: e.clientY };
    dragged = false;
    tile.setPointerCapture?.(e.pointerId);
  });
  tile.addEventListener('pointermove', (e) => {
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (!dragged && Math.hypot(dx, dy) < 18) return; // finger wobble on a phone is more than 8px: a smaller threshold swallowed taps
    dragged = true;
    tile.classList.add('ghost');
    tile.style.transform = `translate(${dx}px,${dy}px)`;
  });
  const end = (e) => {
    if (!start) return;
    start = null;
    tile.classList.remove('ghost');
    tile.style.transform = '';
    if (!dragged) return;
    const under = document.elementFromPoint(e.clientX, e.clientY);
    if (under && dropZone().contains(under)) onDrop();
  };
  tile.addEventListener('pointerup', end);
  tile.addEventListener('pointercancel', () => { start = null; tile.classList.remove('ghost'); tile.style.transform = ''; });
  tile.addEventListener('click', () => { if (dragged) { dragged = false; return; } onTap(); });
}
