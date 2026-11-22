// eggRenderer.js — Canvas rendering for the Egg Catcher game

const EggRenderer = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  groundY: 0,
  basketY: 0,
  skyCache: null,
  clouds: [],
  particles: [],
  effects: [],

  init(canvasEl) {
    // Remove old resize handler if re-initializing
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
    }
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.particles = [];
    this.effects = [];
    this.resize();
    this._initClouds();
    this._resizeHandler = () => this.resize();
    window.addEventListener('resize', this._resizeHandler);
  },

  destroy() {
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
    }
  },

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.width = this.canvas.parentElement.clientWidth;
    this.height = this.canvas.parentElement.clientHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.groundY = this.height - 45;
    this.basketY = this.groundY - 15;
    this._cacheSky();
    EggSprites.generateGrass(this.width);
  },

  _cacheSky() {
    const c = document.createElement('canvas');
    c.width = this.width;
    c.height = this.height;
    const octx = c.getContext('2d');
    const grad = octx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#3a5f8a');
    grad.addColorStop(0.3, '#5b8fb9');
    grad.addColorStop(0.55, '#87CEEB');
    grad.addColorStop(0.75, '#FFE4B5');
    grad.addColorStop(0.9, '#FFDAB9');
    grad.addColorStop(1, '#5a8a3c');
    octx.fillStyle = grad;
    octx.fillRect(0, 0, this.width, this.height);
    this.skyCache = c;
  },

  _initClouds() {
    this.clouds = [];
    for (let i = 0; i < 6; i++) {
      this.clouds.push({
        x: Math.random() * (this.width + 200) - 100,
        y: 30 + Math.random() * this.height * 0.25,
        speed: 10 + Math.random() * 20,
        scale: 0.5 + Math.random() * 0.8
      });
    }
  },

  renderFrame(state, dt) {
    const ctx = this.ctx;

    // Sky
    if (this.skyCache) {
      ctx.drawImage(this.skyCache, 0, 0, this.width, this.height);
    }

    // Clouds
    this.clouds.forEach(c => {
      c.x += c.speed * dt / 1000;
      if (c.x > this.width + 120) { c.x = -120; c.y = 30 + Math.random() * this.height * 0.25; }
      EggSprites.drawCloud(ctx, c.x, c.y, c.scale);
    });

    // Birds
    if (state.birds) {
      state.birds.forEach(b => {
        EggSprites.drawBird(ctx, b.x, b.y, b.type, b.flapPhase, b.direction, b.scale || 1);
      });
    }

    // Falling eggs
    if (state.eggs) {
      state.eggs.forEach(egg => {
        if (egg.hit || egg.cracking || egg.missed) return;
        EggSprites.drawEgg(ctx, egg.x, egg.y, egg.size || 28, egg.color, egg.type, state.gameTime || 0);
        // Note name on normal/golden eggs
        if (egg.type === 'normal' || egg.type === 'golden') {
          ctx.fillStyle = egg.type === 'golden' ? '#6B4400' : '#fff';
          ctx.font = 'bold 10px "Fredoka", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(midiToNoteName(egg.midi), egg.x, egg.y);
        }
      });

      // Crack animations
      state.eggs.forEach(egg => {
        if (!egg.cracking) return;
        const progress = Math.min(egg.crackTime / 500, 1);
        EggSprites.drawCrackedEgg(ctx, egg.x, egg.y, egg.size || 28, egg.color, progress);
      });
    }

    // Particles
    this._updateParticles(ctx, dt);

    // Effects
    this._updateEffects(ctx, dt);

    // Ground + grass
    EggSprites.drawGround(ctx, this.width, this.height, this.groundY);

    // Nests + key labels
    if (state.nestMidis) {
      const pressed = state.pressedNotes || {};
      state.nestMidis.forEach(midi => {
        const x = getKeyPosition(midi, this.width);
        if (x === null) return;
        const w = getNoteWidth(midi, this.width);
        const pressTimer = pressed[midi] || 0;
        const isCaught = state.lastCaughtMidi === midi;
        EggSprites.drawNest(ctx, x, this.basketY, w, isCaught, pressTimer);
      });

      // Key labels under each nest
      ctx.font = '10px "Fredoka", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      state.nestMidis.forEach(midi => {
        const x = getKeyPosition(midi, this.width);
        if (x === null) return;
        const key = this._midiToKeyLabel(midi);
        if (!key) return;
        const pressTimer = pressed[midi] || 0;
        ctx.fillStyle = pressTimer > 0 ? '#FFD700' : 'rgba(255,255,255,0.35)';
        ctx.fillText(key, x, this.basketY + 20);
      });

      // Glow for pressed black keys (no nest drawn for them)
      for (const midi in pressed) {
        const m = parseInt(midi);
        if (!isBlackKey(m)) continue;
        const x = getKeyPosition(m, this.width);
        if (x === null) continue;
        const color = getNoteColor(m);
        const alpha = Math.min(1, pressed[midi] / 150);
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha * 0.7;
        ctx.beginPath();
        ctx.arc(x, this.basketY, 12, 0, Math.PI * 2);
        ctx.fill();
        // Key label
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#fff';
        ctx.font = '10px "Fredoka", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const key = this._midiToKeyLabel(m);
        if (key) ctx.fillText(key, x, this.basketY + 20);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }

    // Frost overlay
    if (state.frozenTimer > 0) {
      ctx.fillStyle = 'rgba(135,206,235,0.08)';
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // Versus divider
    if (state.mode === 'versus') {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(this.width / 2, 55);
      ctx.lineTo(this.width / 2, this.groundY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Score bar
    this._drawScoreBar(ctx, state);

    // Lives
    this._drawLives(ctx, state);

    // Countdown
    if (state.countdown !== null && state.countdown !== undefined) {
      this._drawCountdown(ctx, state.countdown);
    }

    // Game over
    if (state.gameOver) {
      this._drawGameOver(ctx, state);
    }
  },

  _updateParticles(ctx, dt) {
    this.particles = this.particles.filter(p => {
      p.x += p.vx * dt / 1000;
      p.y += p.vy * dt / 1000;
      p.vy += p.gravity * dt / 1000;
      p.rotation += p.rotSpeed * dt / 1000;
      p.age += dt;
      if (p.age > p.lifetime) return false;
      const alpha = 1 - p.age / p.lifetime;

      if (p.ptype === 'feather') {
        EggSprites.drawFeather(ctx, p.x, p.y, p.rotation, p.scale, p.color, alpha);
      } else if (p.ptype === 'sparkle') {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        const r = Math.max(0.5, p.size * (1 - p.age / p.lifetime));
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      } else if (p.ptype === 'leaf') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.ellipse(0, 0, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      return true;
    });
  },

  _updateEffects(ctx, dt) {
    this.effects = this.effects.filter(fx => {
      fx.age += dt;
      if (fx.age > fx.lifetime) return false;
      const p = fx.age / fx.lifetime;
      const alpha = 1 - p;

      if (fx.type === 'catch') {
        const r = 15 + p * 35;
        ctx.beginPath(); ctx.arc(fx.x, fx.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = fx.color;
        ctx.globalAlpha = alpha * 0.6;
        ctx.lineWidth = 3 * (1 - p);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
      } else if (fx.type === 'text') {
        ctx.font = `bold ${14 + p * 6}px "Fredoka", sans-serif`;
        ctx.fillStyle = fx.color;
        ctx.globalAlpha = alpha;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fx.text, fx.x, fx.y - p * 30);
        ctx.globalAlpha = 1;
      } else if (fx.type === 'stink') {
        ctx.globalAlpha = alpha * 0.4;
        ctx.fillStyle = '#9B8B34';
        ctx.beginPath(); ctx.arc(fx.x, fx.y, 20 + p * 30, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      return true;
    });
  },

  _drawScoreBar(ctx, state) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, this.width, 50);
    ctx.font = 'bold 18px "Fredoka", sans-serif';
    ctx.textBaseline = 'middle';

    if (state.mode === 'versus' && state.players) {
      const p1 = state.players[1];
      const p2 = state.players[2];
      ctx.fillStyle = '#FF8C00'; ctx.textAlign = 'left';
      ctx.fillText(`P1: ${p1.score}`, 20, 18);
      ctx.font = '13px "Fredoka", sans-serif'; ctx.fillStyle = '#ccc';
      ctx.fillText(`Streak: ${p1.streak}`, 20, 38);
      ctx.font = 'bold 18px "Fredoka", sans-serif';
      ctx.fillStyle = '#4488FF'; ctx.textAlign = 'right';
      ctx.fillText(`P2: ${p2.score}`, this.width - 20, 18);
      ctx.font = '13px "Fredoka", sans-serif'; ctx.fillStyle = '#ccc';
      ctx.fillText(`Streak: ${p2.streak}`, this.width - 20, 38);
    } else {
      const p = state.players ? state.players[1] : {};
      ctx.fillStyle = '#FFD700'; ctx.textAlign = 'left';
      ctx.fillText(`Score: ${p.score || 0}`, 20, 25);
      const streak = p.streak || 0;
      const st = streak >= 20 ? `${streak} AMAZING!` : streak >= 10 ? `${streak} GREAT!` : streak >= 5 ? `${streak} NICE!` : `${streak}`;
      ctx.fillStyle = streak >= 5 ? '#FF6B6B' : '#fff'; ctx.textAlign = 'center';
      ctx.fillText(`Streak: ${st}`, this.width / 2, 25);
      ctx.fillStyle = '#88ff88'; ctx.textAlign = 'right';
      const label = state.mode === 'song' ? (state.songTitle || 'Song') : state.mode === 'coop' ? 'Co-op' : 'Endless';
      ctx.fillText(label, this.width - 20, 25);
    }

    // Progress bar for song mode
    if (state.mode === 'song' && state.totalEggs > 0) {
      const prog = (state.eggsCaught + state.eggsMissed) / state.totalEggs;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(0, 46, this.width, 4);
      ctx.fillStyle = '#44ff88';
      ctx.fillRect(0, 46, this.width * prog, 4);
    }
  },

  _drawLives(ctx, state) {
    if (!state.players) return;
    if (state.mode === 'versus') {
      this._drawLivesRow(ctx, 20, 55, state.players[1].lives, state.players[1].maxLives, '#FF8C00');
      const p2x = this.width - 20 - state.players[2].maxLives * 22;
      this._drawLivesRow(ctx, p2x, 55, state.players[2].lives, state.players[2].maxLives, '#4488FF');
    } else {
      const p = state.players[1];
      this._drawLivesRow(ctx, 20, 55, p.lives, p.maxLives, '#FF6B6B');
    }
  },

  _drawLivesRow(ctx, x, y, lives, maxLives, color) {
    for (let i = 0; i < maxLives; i++) {
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      if (i < lives) {
        // Draw a small egg shape
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x + i * 20 + 6, y + 8, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.ellipse(x + i * 20 + 6, y + 8, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },

  _drawCountdown(ctx, number) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.font = 'bold 120px "Fredoka", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = number === 'GO!' ? '#44ff88' : '#FFD700';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 30;
    ctx.fillText(String(number), this.width / 2, this.height / 2);
    ctx.shadowBlur = 0;
  },

  _drawGameOver(ctx, state) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (state.mode === 'versus' && state.winner) {
      ctx.font = 'bold 48px "Fredoka", sans-serif';
      ctx.fillStyle = state.winner === 1 ? '#FF8C00' : '#4488FF';
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 20;
      ctx.fillText(`Player ${state.winner} Wins!`, this.width / 2, this.height / 2 - 20);
    } else {
      ctx.font = 'bold 48px "Fredoka", sans-serif';
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 20;
      ctx.fillText('Game Over', this.width / 2, this.height / 2 - 20);
    }
    ctx.shadowBlur = 0;
    ctx.font = '20px "Fredoka", sans-serif';
    ctx.fillStyle = '#ccc';
    ctx.fillText('Press any key to continue', this.width / 2, this.height / 2 + 30);
  },

  // Particle spawn helpers
  spawnCatchParticles(x, y, color) {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        ptype: 'feather', x, y,
        vx: (Math.random() - 0.5) * 120, vy: -80 - Math.random() * 80,
        gravity: 100, rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 5, scale: 0.5 + Math.random() * 0.5,
        color, age: 0, lifetime: 800 + Math.random() * 400
      });
    }
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 50 + Math.random() * 100;
      this.particles.push({
        ptype: 'sparkle', x, y,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40,
        gravity: 80, rotation: 0, rotSpeed: 0,
        size: 2 + Math.random() * 3, color,
        age: 0, lifetime: 400 + Math.random() * 300
      });
    }
    this.effects.push({ type: 'catch', x, y, color, age: 0, lifetime: 400 });
  },

  spawnTextEffect(x, y, text, color) {
    this.effects.push({ type: 'text', x, y, text, color: color || '#FFD700', age: 0, lifetime: 600 });
  },

  spawnStinkCloud(x, y) {
    this.effects.push({ type: 'stink', x, y, age: 0, lifetime: 800 });
  },

  spawnRainbowWave(x, y) {
    const cols = ['#FF4444', '#FF8C00', '#FFD700', '#44BB44', '#00CED1', '#4488FF', '#9944FF'];
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 80 + Math.random() * 150;
      this.particles.push({
        ptype: 'sparkle', x, y,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        gravity: 30, rotation: 0, rotSpeed: 0,
        size: 3 + Math.random() * 4, color: cols[Math.floor(Math.random() * cols.length)],
        age: 0, lifetime: 600 + Math.random() * 400
      });
    }
  },

  spawnFeatherBurst() {
    const birdColors = ['#8B7355', '#E5533E', '#64B5F6', '#CC2222', '#C4A882'];
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        ptype: 'feather',
        x: Math.random() * this.width, y: -10,
        vx: (Math.random() - 0.5) * 100, vy: 50 + Math.random() * 100,
        gravity: 30, rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 5, scale: 0.5 + Math.random() * 0.8,
        color: birdColors[Math.floor(Math.random() * birdColors.length)],
        age: 0, lifetime: 2000 + Math.random() * 1000
      });
    }
  },

  // Reverse map: MIDI number -> keyboard key label
  _midiKeyMap: null,
  _midiToKeyLabel(midi) {
    if (!this._midiKeyMap) {
      this._midiKeyMap = {};
      const km = KeyboardInput.keyMap;
      for (const key in km) {
        const label = key === ';' ? ';' : key === "'" ? "'" : key === ']' ? ']' : key.toUpperCase();
        this._midiKeyMap[km[key]] = label;
      }
    }
    return this._midiKeyMap[midi] || null;
  },

  cleanup() {
    this.particles = [];
    this.effects = [];
  }
};
