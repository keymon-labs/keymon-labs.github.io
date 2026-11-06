// App shell: hash routes, menus, progress, and mounting mini games.
//   #/                 game menu
//   #/<game>           level list
//   #/<game>/<level>   play
// Hash routes keep Android's back button working inside the installed app.

import { games, findGame } from './games/index.js';
import { createProgress } from './core/progress.js';
import { showResult } from './ui/play-layout.js';
import { registerServiceWorker } from '../shared/pwa.js';

const root = document.getElementById('app');
const progress = createProgress(safeStorage());
let current = null; // mounted game, if any

function safeStorage() { try { return window.localStorage; } catch { return null; } }
const go = (hash) => { location.hash = hash; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const starRow = (n) => `<span class="stars" aria-label="${n} of 3 stars">${'★'.repeat(n)}<span>${'★'.repeat(3 - n)}</span></span>`;

function route() {
  current?.destroy(); current = null;
  root.className = '';
  const [gameId, levelId] = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const game = gameId && findGame(gameId);
  if (!game) return renderHome();
  const level = levelId && game.levels.find((l) => l.id === levelId);
  if (!level) return renderLevels(game);
  play(game, level);
}

function renderHome() {
  root.innerHTML = `
    <main class="menu">
      <h1>Maths <span>Arcade</span></h1>
      <ul class="cards">
        ${games.map((g) => `
          <li><a class="card" href="#/${g.id}">
            <span class="card-emoji">${g.emoji}</span>
            <span><strong>${esc(g.title)}</strong><small>${esc(g.blurb)}</small>
            <small class="muted">★ ${progress.total(g.id)} / ${g.levels.length * 3}</small></span>
          </a></li>`).join('')}
        <li class="card soon">More games coming soon</li>
      </ul>
      <p class="muted" style="font-size:13px;margin-top:20px">© 2026 keymon-labs · <a href="https://github.com/keymon-labs/keymon-labs.github.io/blob/main/NOTICE.md">CC BY-NC-SA 4.0</a></p>
    </main>`;
}

function renderLevels(game) {
  root.innerHTML = `
    <main class="menu">
      <header class="menu-head"><a class="icon-btn" href="#/" aria-label="Back">‹</a><h1>${game.emoji} ${esc(game.title)}</h1></header>
      <ol class="levels">
        ${game.levels.map((l, i) => `
          <li><a class="level" href="#/${game.id}/${l.id}">
            <span class="level-num">${i + 1}</span>
            <span class="level-title">${l.icon ?? ''} ${esc(l.title)}</span>
            ${starRow(progress.stars(game.id, l.id))}
          </a></li>`).join('')}
      </ol>
    </main>`;
}

function play(game, level) {
  root.className = 'playing';
  const idx = game.levels.indexOf(level);
  const next = game.levels[idx + 1];
  current = game.mount(root, level, {
    onExit: () => go(`#/${game.id}`),
    onFinish: ({ stars }) => {
      const improved = progress.record(game.id, level.id, stars);
      showResult(root, {
        stars, improved, hasNext: !!next,
        onAgain: () => route(),
        onNext: () => go(`#/${game.id}/${next.id}`),
        onMenu: () => go(`#/${game.id}`),
      });
    },
  });
}

window.addEventListener('hashchange', route);
route();

registerServiceWorker('./sw.js');
