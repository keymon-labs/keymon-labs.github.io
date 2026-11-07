// Shared UI for the spelling archetypes: tile styles, tap-or-drag tiles, special-letters row. Styles are injected once from here.
export const SPECIAL = ['ñ', 'á', 'é', 'í', 'ó', 'ú', 'ü', '¿', '¡'];

const CSS = `
.sp-tiles{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:10px 0;min-height:56px}
.sp-tiles.slots{border-bottom:3px solid currentColor;padding-bottom:8px}
.sp-tile,.sp-key,.sp-opt,.sp-check{min-width:48px;min-height:48px;padding:6px 12px;font:inherit;font-size:1.4rem;border-radius:10px;border:2px solid currentColor;background:Canvas;color:inherit;cursor:pointer;touch-action:manipulation}
.sp-tile{touch-action:none}
.sp-tile.locked{opacity:.6}
.sp-tile.ghost{position:relative;z-index:5;pointer-events:none}
.sp-opt[disabled],.sp-tile[disabled]{opacity:.35}
.sp-check{touch-action:manipulation;font-size:1.1rem}
.sp-key{touch-action:manipulation;font-size:1.1rem}
.sp-gap{min-width:48px;min-height:48px;font:inherit;font-size:1.6rem;text-align:center;border:0;border-bottom:3px dashed currentColor;background:transparent;color:inherit;width:3ch}
.sp-gap.active{border-bottom-style:solid;outline:2px solid currentColor}
.sp-gap.hinted{background:rgba(255,200,0,.35);outline:3px dotted currentColor}
.sp-word{font-size:1.8rem;letter-spacing:.05em;margin:10px 0;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:2px}
.sp-reveal{font-size:1.6rem;font-weight:bold;text-align:center;margin:6px 0}
.sp-prompt{font-size:2.4rem;text-align:center;margin:6px 0}
.sp-row{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:8px 0}
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
    if (!dragged && Math.hypot(dx, dy) < 8) return;
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
