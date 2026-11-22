// app.js — Screen navigation, app init

const App = {
  currentScreen: 'home',
  _lastEggMode: null,   // remember last egg mode for "Play Again"
  _lastEggSong: null,   // remember last egg song for "Play Again"

  async init() {
    // Init audio context on first user interaction
    document.addEventListener('click', () => AudioFX._ensureCtx(), { once: true });
    document.addEventListener('keydown', () => AudioFX._ensureCtx(), { once: true });

    // Init MIDI
    await MidiManager.init();

    // Init computer keyboard fallback
    KeyboardInput.init();

    // Build song list
    this.buildSongList();

    // Build egg home entry card
    this._buildEggHomeCard();

    // Wire up piano game buttons
    document.getElementById('btn-back').addEventListener('click', () => {
      Game.stop();
      this.showScreen('home');
    });

    document.getElementById('btn-pause').addEventListener('click', () => {
      const paused = Game.togglePause();
      document.getElementById('btn-pause').textContent = paused ? '▶ Resume' : '⏸ Pause';
    });

    document.getElementById('btn-beat').addEventListener('click', () => {
      Game.beatEnabled = !Game.beatEnabled;
      document.getElementById('btn-beat').textContent = Game.beatEnabled ? '🥁 Beat: On' : '🥁 Beat: Off';
    });

    document.getElementById('btn-home').addEventListener('click', () => {
      this.showScreen('home');
    });

    document.getElementById('btn-retry').addEventListener('click', () => {
      const songId = document.getElementById('btn-retry').dataset.songId;
      const song = SONGS.find(s => s.id === songId);
      if (song) this.playSong(song);
    });

    // Wire up egg game buttons
    this._wireEggButtons();

    // Show home
    this.showScreen('home');
  },

  // === PIANO GAME (unchanged) ===

  buildSongList() {
    const container = document.getElementById('song-list');
    container.innerHTML = '';

    SONGS.forEach(song => {
      const card = document.createElement('div');
      card.className = 'song-card';
      card.style.borderColor = song.color;

      const stars = '⭐'.repeat(song.difficulty);
      card.innerHTML = `
        <div class="song-color-bar" style="background: ${song.color}"></div>
        <div class="song-info">
          <h3 class="song-title">${song.title}</h3>
          <div class="song-difficulty">${stars}</div>
          <p class="song-desc">${song.description}</p>
        </div>
      `;
      card.addEventListener('click', () => this.playSong(song));
      container.appendChild(card);
    });
  },

  playSong(song) {
    this.showScreen('play');
    document.getElementById('btn-pause').textContent = '⏸ Pause';
    document.getElementById('btn-beat').textContent = Game.beatEnabled ? '🥁 Beat: On' : '🥁 Beat: Off';

    const canvas = document.getElementById('game-canvas');
    Renderer.init(canvas);

    Game.onComplete = (stats) => this.showResults(song, stats);
    Game.onScoreUpdate = null;
    Game.start(song);
  },

  showResults(song, stats) {
    this.showScreen('results');

    const starsEl = document.getElementById('result-stars');
    starsEl.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const star = document.createElement('span');
      star.className = 'result-star' + (i < stats.stars ? ' earned' : '');
      star.textContent = '⭐';
      starsEl.appendChild(star);
    }

    document.getElementById('result-score').textContent = stats.score;
    document.getElementById('result-accuracy').textContent = stats.accuracy + '%';
    document.getElementById('result-streak').textContent = stats.bestStreak;
    document.getElementById('result-hit').textContent = `${stats.notesHit} / ${stats.totalNotes}`;

    const msgEl = document.getElementById('result-message');
    if (stats.stars === 3) {
      msgEl.textContent = 'AMAZING! You are a piano star!';
      msgEl.style.color = '#FFD700';
      setTimeout(() => this._resultConfetti(), 200);
    } else if (stats.stars === 2) {
      msgEl.textContent = 'Great job! Almost perfect!';
      msgEl.style.color = '#44ff88';
    } else if (stats.stars === 1) {
      msgEl.textContent = 'Good try! Keep practicing!';
      msgEl.style.color = '#88ccff';
    } else {
      msgEl.textContent = 'Keep going, you can do it!';
      msgEl.style.color = '#ffaa88';
    }

    document.getElementById('result-song-title').textContent = song.title;
    document.getElementById('btn-retry').dataset.songId = song.id;
  },

  _resultConfetti() {
    const container = document.getElementById('results-screen');
    for (let i = 0; i < 60; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.animationDelay = Math.random() * 2 + 's';
      piece.style.backgroundColor = ['#FF4444', '#FF8C00', '#FFD700', '#44BB44', '#00CED1', '#4488FF', '#9944FF'][Math.floor(Math.random() * 7)];
      container.appendChild(piece);
      setTimeout(() => piece.remove(), 3000);
    }
  },

  // === EGG GAME ===

  _buildEggHomeCard() {
    const container = document.getElementById('egg-home-entry');
    container.innerHTML = `
      <div class="egg-home-card" id="egg-home-card">
        <div class="egg-home-icon">🥚🐦</div>
        <div class="egg-home-info">
          <h3>Egg Catcher</h3>
          <p>Catch falling eggs with piano keys! 1-2 players</p>
        </div>
      </div>
    `;
    document.getElementById('egg-home-card').addEventListener('click', () => {
      this.showScreen('egg-mode');
    });
  },

  _wireEggButtons() {
    // Mode select back
    document.getElementById('egg-mode-back-btn').addEventListener('click', () => {
      this.showScreen('home');
    });

    // Mode cards
    document.querySelectorAll('.egg-mode-card').forEach(card => {
      card.addEventListener('click', () => {
        const mode = card.dataset.mode;
        if (mode === 'song') {
          this._buildEggSongList();
          this.showScreen('egg-song');
        } else {
          this._startEggGame(mode, null);
        }
      });
    });

    // Song select back
    document.getElementById('egg-song-back-btn').addEventListener('click', () => {
      this.showScreen('egg-mode');
    });

    // Play screen controls
    document.getElementById('egg-btn-back').addEventListener('click', () => {
      EggGame.stop();
      this.showScreen('egg-mode');
    });

    document.getElementById('egg-btn-pause').addEventListener('click', () => {
      const paused = EggGame.togglePause();
      document.getElementById('egg-btn-pause').textContent = paused ? '▶ Resume' : '⏸ Pause';
    });

    // Results buttons
    document.getElementById('egg-btn-retry').addEventListener('click', () => {
      this._eggRetry();
    });

    document.getElementById('egg-btn-home').addEventListener('click', () => {
      MidiManager.onNoteOn = null;
      this.showScreen('home');
    });

    // Enter key to play again from results screen
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.currentScreen === 'egg-results') {
        e.preventDefault();
        this._eggRetry();
      }
    });

    // Also handle Enter on the piano results screen
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.currentScreen === 'results') {
        e.preventDefault();
        document.getElementById('btn-retry').click();
      }
    });
  },

  _eggRetry() {
    if (this._lastEggMode) {
      this._startEggGame(this._lastEggMode, this._lastEggSong);
    }
  },

  _buildEggSongList() {
    const container = document.getElementById('egg-song-list');
    container.innerHTML = '';

    SONGS.forEach(song => {
      const card = document.createElement('div');
      card.className = 'song-card';
      card.style.borderColor = song.color;
      const stars = '⭐'.repeat(song.difficulty);
      card.innerHTML = `
        <div class="song-color-bar" style="background: ${song.color}"></div>
        <div class="song-info">
          <h3 class="song-title">${song.title}</h3>
          <div class="song-difficulty">${stars}</div>
          <p class="song-desc">${song.description}</p>
        </div>
      `;
      card.addEventListener('click', () => this._startEggGame('song', song));
      container.appendChild(card);
    });
  },

  _startEggGame(mode, song) {
    this._lastEggMode = mode;
    this._lastEggSong = song;

    this.showScreen('egg-play');
    document.getElementById('egg-btn-pause').textContent = '⏸ Pause';

    const canvas = document.getElementById('egg-game-canvas');
    EggRenderer.init(canvas);

    EggGame.onComplete = (stats) => this._showEggResults(stats);
    EggGame.start({ mode, song });
  },

  _showEggResults(stats) {
    this.showScreen('egg-results');

    // Any piano key press = Play Again
    MidiManager.onNoteOn = () => {
      MidiManager.onNoteOn = null;
      this._eggRetry();
    };

    const titleEl = document.getElementById('egg-result-title');
    const eggsEl = document.getElementById('egg-result-eggs');
    const msgEl = document.getElementById('egg-result-message');
    const bodyEl = document.getElementById('egg-result-body');

    // Focus Play Again button so Enter works immediately
    setTimeout(() => document.getElementById('egg-btn-retry').focus(), 100);

    if (stats.mode === 'versus') {
      titleEl.textContent = 'Versus Match';
      eggsEl.innerHTML = '';
      const winner = stats.winner;

      msgEl.textContent = `Player ${winner} Wins!`;
      msgEl.style.color = winner === 1 ? '#FF8C00' : '#4488FF';

      bodyEl.innerHTML = `
        <div class="egg-versus-results">
          <div class="egg-versus-player ${winner === 1 ? 'winner' : ''}">
            <div class="egg-versus-label" style="color:#FF8C00">Player 1</div>
            <div class="egg-versus-score">${stats.player1.score}</div>
            <div class="egg-versus-detail">Caught: ${stats.player1.eggsCaught}</div>
            <div class="egg-versus-detail">Streak: ${stats.player1.bestStreak}</div>
          </div>
          <div class="egg-versus-player ${winner === 2 ? 'winner' : ''}">
            <div class="egg-versus-label" style="color:#4488FF">Player 2</div>
            <div class="egg-versus-score">${stats.player2.score}</div>
            <div class="egg-versus-detail">Caught: ${stats.player2.eggsCaught}</div>
            <div class="egg-versus-detail">Streak: ${stats.player2.bestStreak}</div>
          </div>
        </div>
      `;
    } else {
      titleEl.textContent = stats.mode === 'song' ? (this._lastEggSong ? this._lastEggSong.title : 'Song Mode') :
                            stats.mode === 'coop' ? 'Co-op Mode' : 'Endless Mode';

      // Egg rating (like stars)
      eggsEl.innerHTML = '';
      const stars = stats.stars || 0;
      for (let i = 0; i < 3; i++) {
        const egg = document.createElement('span');
        egg.className = 'egg-result-egg' + (i < stars ? ' earned' : '');
        egg.textContent = '🥚';
        eggsEl.appendChild(egg);
      }

      if (stars === 3) {
        msgEl.textContent = 'AMAZING! Egg-cellent catching!';
        msgEl.style.color = '#FFD700';
      } else if (stars === 2) {
        msgEl.textContent = 'Great catching! Almost perfect!';
        msgEl.style.color = '#44ff88';
      } else if (stars === 1) {
        msgEl.textContent = 'Good try! Keep catching!';
        msgEl.style.color = '#88ccff';
      } else {
        msgEl.textContent = 'Keep going, you\'ll get them!';
        msgEl.style.color = '#ffaa88';
      }

      bodyEl.innerHTML = `
        <div class="egg-result-stats">
          <div class="stat-box">
            <div class="stat-label">Score</div>
            <div class="stat-value">${stats.score}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Accuracy</div>
            <div class="stat-value">${stats.accuracy}%</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Best Streak</div>
            <div class="stat-value">${stats.bestStreak}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Eggs Caught</div>
            <div class="stat-value">${stats.eggsCaught} / ${stats.totalEggs}</div>
          </div>
        </div>
      `;
    }
  },

  // === SCREEN NAVIGATION ===

  showScreen(name) {
    document.querySelectorAll('.screen').forEach(el => {
      el.classList.toggle('active', el.id === name + '-screen');
    });
    this.currentScreen = name;
  }
};

// Boot
window.addEventListener('DOMContentLoaded', () => App.init());
