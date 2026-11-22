// eggGame.js — Egg Catcher game engine: 4 modes, multiplayer, special eggs

const EggGame = {
  state: 'idle',  // idle | countdown | playing | paused | gameover | results
  mode: null,     // endless | song | versus | coop

  birds: [],
  eggs: [],
  players: {},
  gameTime: 0,
  lastFrameTime: 0,
  countdown: null,
  countdownTimer: 0,

  // Spawning
  spawnTimer: 0,
  spawnInterval: 1200,
  baseEggSpeed: 150,
  difficultyTimer: 0,
  difficultyLevel: 0,
  targetBirdCount: 3,
  birdSpawnTimer: 0,

  // Song mode
  song: null,
  songNotes: [],
  songNoteIndex: 0,
  eggFallDuration: 2000,

  // Tracking
  totalEggs: 0,
  eggsCaught: 0,
  eggsMissed: 0,

  // Speed modifier (frozen egg)
  speedMultiplier: 1,
  frozenTimer: 0,

  // UI state
  lastCaughtMidi: null,
  lastCaughtTimer: 0,
  pressedNotes: {},   // midi -> timer (ms remaining), for visual feedback
  _nextId: 0,

  // Callbacks
  onComplete: null,
  _gameOverContinueHandler: null,

  start(config) {
    this.mode = config.mode;
    this.song = config.song || null;
    this._reset();
    this._initPlayers();

    if (this.mode === 'song' && this.song) {
      this._prepareSongMode();
    }

    this.state = 'countdown';
    this.countdown = 3;
    this.countdownTimer = 0;

    MidiManager.onNoteOn = (midi, vel) => this._onNoteOn(midi, vel);

    // Click or Enter to continue from game over
    this._gameOverClickHandler = () => {
      if (this.state === 'gameover') this._showResults();
    };
    this._gameOverKeyHandler = (e) => {
      if (e.key === 'Enter' && this.state === 'gameover') this._showResults();
    };
    document.getElementById('egg-game-canvas').addEventListener('click', this._gameOverClickHandler);
    document.addEventListener('keydown', this._gameOverKeyHandler);

    this.lastFrameTime = performance.now();
    this._loop(this.lastFrameTime);
  },

  stop() {
    this.state = 'idle';
    MidiManager.onNoteOn = null;
    const canvas = document.getElementById('egg-game-canvas');
    if (canvas && this._gameOverClickHandler) {
      canvas.removeEventListener('click', this._gameOverClickHandler);
    }
    if (this._gameOverKeyHandler) {
      document.removeEventListener('keydown', this._gameOverKeyHandler);
    }
  },

  togglePause() {
    if (this.state === 'countdown') return false;
    if (this.state === 'playing') {
      this.state = 'paused';
      return true;
    }
    if (this.state === 'paused') {
      this.state = 'playing';
      this.lastFrameTime = performance.now();
      this._loop(this.lastFrameTime);
      return false;
    }
    return false;
  },

  _reset() {
    this.birds = [];
    this.eggs = [];
    this.gameTime = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 1200;
    this.baseEggSpeed = 150;
    this.difficultyTimer = 0;
    this.difficultyLevel = 0;
    this.targetBirdCount = 3;
    this.birdSpawnTimer = 0;
    this.songNoteIndex = 0;
    this.totalEggs = 0;
    this.eggsCaught = 0;
    this.eggsMissed = 0;
    this.speedMultiplier = 1;
    this.frozenTimer = 0;
    this.lastCaughtMidi = null;
    this.lastCaughtTimer = 0;
    this.pressedNotes = {};
    this._nextId = 0;
    EggRenderer.cleanup();
  },

  _initPlayers() {
    if (this.mode === 'versus') {
      this.players = {
        1: this._newPlayer([60, 71]),
        2: this._newPlayer([72, 84])
      };
    } else if (this.mode === 'coop') {
      // Co-op: each player physically controls their half, shared stats
      this.players = {
        1: this._newPlayer([60, 84])
      };
    } else {
      this.players = {
        1: this._newPlayer([60, 84])
      };
    }
  },

  _newPlayer(zone) {
    return {
      score: 0, streak: 0, bestStreak: 0,
      lives: this.mode === 'versus' ? 3 : 5,
      maxLives: this.mode === 'versus' ? 5 : 8,
      eggsCaught: 0, eggsMissed: 0,
      zone, lastScoreForLife: 0
    };
  },

  _prepareSongMode() {
    this.songNotes = this.song.notes.map((n, i) => ({
      index: i, midi: n.midi, time: n.time, spawned: false
    }));
    this.totalEggs = this.songNotes.length;
  },

  // === MAIN LOOP ===

  _loop(timestamp) {
    if (this.state === 'idle' || this.state === 'results') return;
    if (this.state === 'paused') return;

    const dt = Math.min(timestamp - this.lastFrameTime, 50);
    this.lastFrameTime = timestamp;

    // Decay pressed note timers (always, for visual feedback in all states)
    for (const midi in this.pressedNotes) {
      this.pressedNotes[midi] -= dt;
      if (this.pressedNotes[midi] <= 0) delete this.pressedNotes[midi];
    }

    if (this.state === 'countdown') {
      this._tickCountdown(dt);
    }

    if (this.state === 'playing') {
      this.gameTime += dt;

      if (this.frozenTimer > 0) {
        this.frozenTimer -= dt;
        if (this.frozenTimer <= 0) { this.frozenTimer = 0; this.speedMultiplier = 1; }
      }

      if (this.lastCaughtTimer > 0) {
        this.lastCaughtTimer -= dt;
        if (this.lastCaughtTimer <= 0) this.lastCaughtMidi = null;
      }

      this._updateBirds(dt);
      this._spawnEggs(dt);
      this._updateEggs(dt);
      this._checkMisses();
      this._checkGameEnd();

      if (this.mode !== 'song') this._updateDifficulty(dt);
    }

    // Render
    EggRenderer.renderFrame({
      birds: this.birds,
      eggs: this.eggs,
      mode: this.mode,
      players: this.players,
      nestMidis: this._getNestMidis(),
      activeNotes: MidiManager.activeNotes,
      pressedNotes: this.pressedNotes,
      lastCaughtMidi: this.lastCaughtMidi,
      gameTime: this.gameTime,
      frozenTimer: this.frozenTimer,
      countdown: this.countdown,
      gameOver: this.state === 'gameover',
      winner: this._getWinner(),
      songTitle: this.song ? this.song.title : null,
      totalEggs: this.totalEggs,
      eggsCaught: this.eggsCaught,
      eggsMissed: this.eggsMissed
    }, dt);

    requestAnimationFrame(t => this._loop(t));
  },

  _tickCountdown(dt) {
    this.countdownTimer += dt;
    if (this.countdownTimer >= 800) {
      this.countdownTimer = 0;
      if (this.countdown === 3) { AudioFX.countdownBeep(false); this.countdown = 2; }
      else if (this.countdown === 2) { AudioFX.countdownBeep(false); this.countdown = 1; }
      else if (this.countdown === 1) { AudioFX.countdownBeep(true); this.countdown = 'GO!'; }
      else { this.countdown = null; this.state = 'playing'; }
    }
  },

  _getNestMidis() {
    const midis = [];
    for (let m = PIANO_LOW; m <= PIANO_HIGH; m++) {
      if (!isBlackKey(m)) midis.push(m);
    }
    return midis;
  },

  // === BIRDS ===

  _updateBirds(dt) {
    this.birds = this.birds.filter(b => {
      b.x += b.vx * dt / 1000;
      b.y += Math.sin(b.phase) * 0.3;
      b.phase += dt * 0.003;
      b.flapPhase += dt * 0.008;
      if (b.direction === 1 && b.x > EggRenderer.width + 50) return false;
      if (b.direction === -1 && b.x < -50) return false;
      return true;
    });

    this.birdSpawnTimer += dt;
    if (this.birdSpawnTimer >= 500 && this.birds.length < this.targetBirdCount) {
      this.birdSpawnTimer = 0;
      this._spawnBird();
    }
  },

  _spawnBird() {
    const typeName = BIRD_TYPE_NAMES[Math.floor(Math.random() * BIRD_TYPE_NAMES.length)];
    const type = BIRD_TYPES[typeName];
    const dir = Math.random() < 0.5 ? 1 : -1;
    const speed = type.speed[0] + Math.random() * (type.speed[1] - type.speed[0]);
    this.birds.push({
      id: this._nextId++, type: typeName,
      x: dir === 1 ? -40 : EggRenderer.width + 40,
      y: 70 + Math.random() * (EggRenderer.height * 0.2),
      vx: speed * dir, direction: dir,
      phase: Math.random() * Math.PI * 2,
      flapPhase: Math.random() * Math.PI * 2,
      scale: 0.8 + Math.random() * 0.4
    });
  },

  // === EGG SPAWNING ===

  _spawnEggs(dt) {
    if (this.mode === 'song') {
      this._spawnSongEggs();
    } else {
      this._spawnRandomEggs(dt);
    }
  },

  _spawnRandomEggs(dt) {
    this.spawnTimer += dt;
    if (this.spawnTimer < this.spawnInterval) return;
    this.spawnTimer -= this.spawnInterval;

    if (this.mode === 'versus') {
      // Spawn for a random zone
      const zone = Math.random() < 0.5 ? 1 : 2;
      const [lo, hi] = this.players[zone].zone;
      this._spawnOneEgg(this._pickRandomMidi(lo, hi), this._pickEggType());
    } else {
      this._spawnOneEgg(this._pickRandomMidi(60, 84), this._pickEggType());
    }
  },

  _spawnSongEggs() {
    while (this.songNoteIndex < this.songNotes.length) {
      const note = this.songNotes[this.songNoteIndex];
      if (this.gameTime >= note.time - this.eggFallDuration) {
        this._spawnOneEgg(note.midi, 'normal');
        this.songNoteIndex++;
      } else {
        break;
      }
    }
  },

  _spawnOneEgg(midi, type) {
    const targetX = getKeyPosition(midi, EggRenderer.width);
    if (targetX === null) return;

    const bird = this._findNearestBird(targetX);
    const spawnX = bird ? bird.x : targetX + (Math.random() - 0.5) * 30;
    const spawnY = bird ? bird.y + 10 : 50 + Math.random() * 30;
    const fallDist = EggRenderer.basketY - spawnY;

    let vy;
    if (this.mode === 'song') {
      vy = fallDist / (this.eggFallDuration / 1000);
    } else {
      vy = this.baseEggSpeed;
    }

    const fallTime = fallDist / vy;
    const vx = fallTime > 0 ? (targetX - spawnX) / fallTime : 0;

    this.eggs.push({
      id: this._nextId++, midi, type,
      x: spawnX, y: spawnY, targetX,
      vx, vy,
      color: getNoteColor(midi), size: 28,
      hit: false, hitDone: false,
      missed: false, cracking: false, crackTime: 0
    });

    if (this.mode !== 'song') this.totalEggs++;
  },

  _pickRandomMidi(lo, hi) {
    // 70% white keys for playability
    if (Math.random() < 0.7) {
      const whites = [];
      for (let m = lo; m <= hi; m++) { if (!isBlackKey(m)) whites.push(m); }
      return whites[Math.floor(Math.random() * whites.length)];
    }
    return lo + Math.floor(Math.random() * (hi - lo + 1));
  },

  _pickEggType() {
    const r = Math.random();
    if (r < 0.05) return 'golden';
    if (r < 0.08) return 'rainbow';
    if (r < 0.10) return 'frozen';
    if (r < 0.15) return 'rotten';
    return 'normal';
  },

  _findNearestBird(targetX) {
    let best = null, bestDist = Infinity;
    for (const b of this.birds) {
      const d = Math.abs(b.x - targetX);
      if (d < bestDist) { bestDist = d; best = b; }
    }
    return best;
  },

  // === EGG UPDATES ===

  _updateEggs(dt) {
    const sm = this.speedMultiplier;
    this.eggs.forEach(egg => {
      if (egg.hit || egg.missed) return;
      if (egg.cracking) {
        egg.crackTime += dt;
        return;
      }
      egg.x += egg.vx * dt / 1000 * sm;
      egg.y += egg.vy * dt / 1000 * sm;
      // Ease toward target x near basket
      const dist = EggRenderer.basketY - egg.y;
      if (dist < 80 && dist > 0) {
        egg.x += (egg.targetX - egg.x) * 0.05;
      }
    });
    // Remove finished eggs
    this.eggs = this.eggs.filter(e => !(e.hitDone) && !(e.missed && e.crackTime >= 500));
  },

  _checkMisses() {
    this.eggs.forEach(egg => {
      if (egg.hit || egg.missed || egg.cracking) return;
      if (egg.y < EggRenderer.basketY + 20) return;

      // Egg hit the ground
      if (egg.type === 'rotten') {
        // Successfully avoided
        egg.cracking = true;
        egg.crackTime = 0;
        return;
      }

      egg.cracking = true;
      egg.crackTime = 0;
      EggAudio.eggCrack();

      const player = this._getPlayerForMidi(egg.midi);
      if (player) {
        player.lives--;
        player.eggsMissed++;
        player.streak = 0;
        this.eggsMissed++;
        if (player.lives <= 0) EggAudio.lifeLost();
      }
    });
  },

  // === INPUT ===

  _onNoteOn(midi, velocity) {
    // Always track pressed notes for visual feedback (even during countdown)
    this.pressedNotes[midi] = 300;

    if (this.state === 'gameover') {
      this._showResults();
      return;
    }
    if (this.state !== 'playing') return;

    // Find closest catchable egg
    let bestEgg = null, bestDist = Infinity;
    const catchZone = 45;

    for (const egg of this.eggs) {
      if (egg.hit || egg.missed || egg.cracking) continue;
      if (egg.midi !== midi) continue;
      const d = Math.abs(egg.y - EggRenderer.basketY);
      if (d < catchZone && d < bestDist) {
        bestDist = d;
        bestEgg = egg;
      }
    }

    if (bestEgg) {
      this._catchEgg(bestEgg, midi);
    }
    // No penalty for pressing with no egg — piano note plays from keyboard.js
  },

  _catchEgg(egg, midi) {
    egg.hit = true;
    egg.hitDone = true;

    const player = this._getPlayerForMidi(midi);
    if (!player) return;

    // Rotten egg penalty
    if (egg.type === 'rotten') {
      player.score = Math.max(0, player.score - 50);
      player.lives--;
      player.streak = 0;
      EggAudio.rottenCatch();
      EggRenderer.spawnStinkCloud(egg.x, egg.y);
      EggRenderer.spawnTextEffect(egg.x, egg.y - 20, '-50!', '#6B7B34');
      if (player.lives <= 0) EggAudio.lifeLost();
      return;
    }

    // Points
    let points = 100;

    if (egg.type === 'golden') {
      points = 300;
      EggAudio.goldenCatch();
      EggRenderer.spawnTextEffect(egg.x, egg.y - 20, '300!', '#FFD700');
    } else if (egg.type === 'rainbow') {
      EggAudio.rainbowCatch();
      EggRenderer.spawnRainbowWave(egg.x, egg.y);
      EggRenderer.spawnTextEffect(egg.x, egg.y - 20, 'RAINBOW!', '#FF44FF');
      // Chain catch nearby
      for (const other of this.eggs) {
        if (other === egg || other.hit || other.missed || other.cracking) continue;
        if (other.type === 'rotten') continue;
        const d = Math.sqrt(Math.pow(other.x - egg.x, 2) + Math.pow(other.y - egg.y, 2));
        if (d < 80) {
          other.hit = true;
          other.hitDone = true;
          player.score += 100;
          player.eggsCaught++;
          this.eggsCaught++;
          // Play note for chain-caught eggs (no keypress triggered these)
          AudioFX.playNote(other.midi, 80);
          setTimeout(() => AudioFX.stopNote(other.midi), 300);
          EggRenderer.spawnCatchParticles(other.x, other.y, other.color);
        }
      }
    } else if (egg.type === 'frozen') {
      EggAudio.frozenCatch();
      this.speedMultiplier = 0.5;
      this.frozenTimer = 5000;
      EggRenderer.spawnTextEffect(egg.x, egg.y - 20, 'FREEZE!', '#87CEEB');
    } else {
      EggAudio.eggCatch();
    }

    player.score += points;
    player.streak++;
    player.eggsCaught++;
    this.eggsCaught++;
    if (player.streak > player.bestStreak) player.bestStreak = player.streak;

    // Life gain every 500 pts
    const lifeThreshold = Math.floor(player.score / 500);
    if (lifeThreshold > player.lastScoreForLife && player.lives < player.maxLives) {
      player.lives++;
      player.lastScoreForLife = lifeThreshold;
      EggAudio.lifeGained();
      EggRenderer.spawnTextEffect(egg.x, egg.y - 40, '+1 Life!', '#44ff88');
    }

    // Streak milestones
    if (player.streak === 5 || player.streak === 10 || player.streak === 20) {
      AudioFX.streak();
      if (player.streak === 20) EggRenderer.spawnFeatherBurst();
    }

    // Visual effects
    EggRenderer.spawnCatchParticles(egg.x, egg.y, egg.color);
    this.lastCaughtMidi = midi;
    this.lastCaughtTimer = 300;
  },

  // === DIFFICULTY ===

  _updateDifficulty(dt) {
    this.difficultyTimer += dt;
    if (this.difficultyTimer >= 15000) {
      this.difficultyTimer -= 15000;
      this.difficultyLevel++;
      this.baseEggSpeed = Math.min(400, 150 + this.difficultyLevel * 10);
      this.spawnInterval = Math.max(400, 1200 - this.difficultyLevel * 30);
      this.targetBirdCount = Math.min(6, 3 + Math.floor(this.difficultyLevel / 3));
    }
  },

  // === GAME END ===

  _checkGameEnd() {
    if (this.mode === 'song') {
      if (this.songNoteIndex >= this.songNotes.length) {
        const active = this.eggs.some(e => !e.hit && !e.missed && !e.cracking);
        if (!active) {
          this.state = 'gameover';
          AudioFX.complete();
          setTimeout(() => this._showResults(), 1500);
        }
      }
    } else if (this.mode === 'versus') {
      if (this.players[1].lives <= 0 || this.players[2].lives <= 0) {
        this.state = 'gameover';
        AudioFX.complete();
      }
    } else {
      if (this.players[1].lives <= 0) {
        this.state = 'gameover';
        AudioFX.complete();
      }
    }
  },

  _getWinner() {
    if (this.mode !== 'versus' || this.state !== 'gameover') return null;
    const p1 = this.players[1], p2 = this.players[2];
    if (p1.lives <= 0 && p2.lives <= 0) return p1.score >= p2.score ? 1 : 2;
    if (p1.lives <= 0) return 2;
    if (p2.lives <= 0) return 1;
    return p1.score >= p2.score ? 1 : 2;
  },

  _showResults() {
    if (this.state === 'results') return; // prevent double call
    this.state = 'results';
    MidiManager.onNoteOn = null;
    // Clean up game-over listeners
    if (this._gameOverKeyHandler) {
      document.removeEventListener('keydown', this._gameOverKeyHandler);
    }
    if (this.onComplete) this.onComplete(this._getStats());
  },

  _getStats() {
    if (this.mode === 'versus') {
      return {
        mode: 'versus',
        winner: this._getWinner(),
        player1: { ...this.players[1] },
        player2: { ...this.players[2] }
      };
    }
    const p = this.players[1];
    const total = this.mode === 'song' ? this.totalEggs : (p.eggsCaught + p.eggsMissed);
    const accuracy = total > 0 ? Math.round((p.eggsCaught / total) * 100) : 0;
    const stars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : accuracy >= 40 ? 1 : 0;
    return {
      mode: this.mode, score: p.score,
      eggsCaught: p.eggsCaught, eggsMissed: p.eggsMissed,
      bestStreak: p.bestStreak, accuracy, stars, totalEggs: total
    };
  },

  _getPlayerForMidi(midi) {
    if (this.mode === 'versus') return midi >= 72 ? this.players[2] : this.players[1];
    return this.players[1];
  }
};
