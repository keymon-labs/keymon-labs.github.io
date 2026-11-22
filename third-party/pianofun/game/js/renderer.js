// renderer.js — Canvas drawing: falling notes, keyboard, effects

const Renderer = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  keyboardHeight: 120,
  hitLineY: 0,
  effects: [],       // visual effects (flashes, particles)
  confetti: [],       // confetti particles

  _roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, h / 2, w / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  },

  init(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
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
    this.hitLineY = this.height - this.keyboardHeight - 10;
  },

  clear() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.width, this.height);
  },

  // Draw the piano keyboard at the bottom
  drawKeyboard(activeNotes, hitNotes) {
    const ctx = this.ctx;
    const { whiteKeys, blackKeys, whiteCount } = KEY_LAYOUT;
    const kbY = this.height - this.keyboardHeight;
    const ww = this.width / whiteCount;
    const wh = this.keyboardHeight;

    // White keys
    whiteKeys.forEach(key => {
      const x = key.index * ww;
      const active = activeNotes && activeNotes.has(key.midi);
      const hit = hitNotes && hitNotes[key.midi];

      ctx.fillStyle = hit === 'perfect' || hit === 'great' || hit === 'good'
        ? '#44ff88'
        : hit === 'wrong'
        ? '#ff6666'
        : active
        ? getNoteColor(key.midi)
        : '#f0f0f0';

      ctx.fillRect(x + 1, kbY, ww - 2, wh - 2);
      ctx.strokeStyle = '#ccc';
      ctx.strokeRect(x + 1, kbY, ww - 2, wh - 2);

      // Note name label
      ctx.fillStyle = '#666';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(midiToNoteName(key.midi), x + ww / 2, kbY + wh - 8);
    });

    // Black keys
    const bw = ww * 0.6;
    const bh = wh * 0.6;
    blackKeys.forEach(key => {
      const x = (key.whiteIndex + 0.75) * ww - bw / 2 + bw / 2;
      const active = activeNotes && activeNotes.has(key.midi);
      const hit = hitNotes && hitNotes[key.midi];

      ctx.fillStyle = hit === 'perfect' || hit === 'great' || hit === 'good'
        ? '#33cc66'
        : hit === 'wrong'
        ? '#cc4444'
        : active
        ? getNoteColor(key.midi)
        : '#333';

      const bx = (key.whiteIndex + 0.75) * ww - bw / 2;
      ctx.fillRect(bx, kbY, bw, bh);
    });

    // Hit line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(0, this.hitLineY);
    ctx.lineTo(this.width, this.hitLineY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
  },

  // Draw falling notes
  drawFallingNotes(notes, songTime, scrollSpeed) {
    const ctx = this.ctx;
    const hitY = this.hitLineY;
    // scrollSpeed = pixels per ms
    const pxPerMs = (hitY) / scrollSpeed;

    notes.forEach(note => {
      const noteEndTime = note.time + note.duration;

      // For hit notes: shrink from bottom as song progresses, hide when fully consumed
      if (note.hit) {
        // How much time has passed since hit
        const consumed = songTime - note.hitTime;
        const remaining = note.duration - consumed;
        if (remaining <= 0) return; // fully consumed

        // The remaining portion still falls — top stays, bottom shrinks up
        const remainBottom = hitY - (note.hitTime + consumed - songTime) * pxPerMs;
        const remainHeight = remaining * 0.9 * pxPerMs;
        const remainTop = remainBottom - remainHeight;

        if (remainBottom < -50 || remainTop > hitY + 50) return;

        const x = getKeyPosition(note.midi, this.width);
        const w = getNoteWidth(note.midi, this.width);
        if (x === null) return;

        const color = getNoteColor(note.midi);
        const rx = x - w / 2;
        const radius = 6;

        // Draw with bright glow to show it's being held
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        this._roundRect(ctx, rx, remainTop, w, Math.max(remainHeight, 4), radius);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
        return;
      }

      // Missed notes that scrolled past — skip
      if (note.missed) return;

      // Bottom edge = where the note's start time meets the hit line
      const noteBottom = hitY - (note.time - songTime) * pxPerMs;
      const visualDuration = note.duration * 0.9;
      const noteHeight = Math.max(visualDuration * pxPerMs, 20);
      // Top edge = duration extends upward (away from hit line)
      const noteTop = noteBottom - noteHeight;

      // Only draw if visible
      if (noteBottom < -50 || noteTop > hitY + 50) return;

      const x = getKeyPosition(note.midi, this.width);
      const w = getNoteWidth(note.midi, this.width);
      if (x === null) return;

      const color = getNoteColor(note.midi);

      // Note rectangle with rounded corners
      const rx = x - w / 2;
      const ry = noteTop;
      const rh = noteHeight;
      const radius = 6;

      ctx.fillStyle = color;
      this._roundRect(ctx, rx, ry, w, rh, radius);
      ctx.fill();

      // Glow when near hit line
      const dist = Math.abs(noteBottom - hitY);
      if (dist < 60) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 15 - dist / 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Note name text
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px "Fredoka", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const textY = ry + rh / 2;
      ctx.fillText(midiToNoteName(note.midi), x, textY);

      // Finger number (small, below note name)
      if (note.finger && rh > 30) {
        ctx.font = '11px "Fredoka", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(note.finger, x, textY + 14);
      }
    });
  },

  // Draw visual effects
  drawEffects(dt) {
    const ctx = this.ctx;

    this.effects = this.effects.filter(fx => {
      fx.age += dt;
      if (fx.age > fx.lifetime) return false;

      const progress = fx.age / fx.lifetime;
      const alpha = 1 - progress;

      if (fx.type === 'hit') {
        const radius = 20 + progress * 40;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = fx.color.replace(')', `, ${alpha * 0.4})`).replace('rgb', 'rgba');
        ctx.fill();
      } else if (fx.type === 'miss') {
        ctx.fillStyle = `rgba(255, 80, 80, ${alpha * 0.3})`;
        ctx.fillRect(fx.x - 25, fx.y - 10, 50, 20);
      } else if (fx.type === 'text') {
        ctx.font = `bold ${16 + progress * 8}px "Fredoka", sans-serif`;
        ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
        ctx.textAlign = 'center';
        ctx.fillText(fx.text, fx.x, fx.y - progress * 30);
      }

      return true;
    });
  },

  // Add a hit effect
  addHitEffect(midi, quality) {
    const x = getKeyPosition(midi, this.width);
    if (x === null) return;

    const color = getNoteColor(midi);
    this.effects.push({
      type: 'hit', x, y: this.hitLineY, color,
      age: 0, lifetime: 400
    });

    if (quality === 'perfect') {
      this.effects.push({
        type: 'text', x, y: this.hitLineY - 20, text: 'PERFECT!',
        age: 0, lifetime: 600
      });
    } else if (quality === 'great') {
      this.effects.push({
        type: 'text', x, y: this.hitLineY - 20, text: 'GREAT!',
        age: 0, lifetime: 500
      });
    }
  },

  // Add a miss/wrong effect
  addMissEffect(midi) {
    const x = getKeyPosition(midi, this.width);
    if (x === null) return;
    this.effects.push({
      type: 'miss', x, y: this.hitLineY,
      age: 0, lifetime: 300
    });
  },

  // Confetti system
  spawnConfetti(count = 100) {
    for (let i = 0; i < count; i++) {
      this.confetti.push({
        x: Math.random() * this.width,
        y: -10 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        size: Math.random() * 8 + 4,
        color: ['#FF4444', '#FF8C00', '#FFD700', '#44BB44', '#00CED1', '#4488FF', '#9944FF'][Math.floor(Math.random() * 7)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10
      });
    }
  },

  drawConfetti(dt) {
    const ctx = this.ctx;
    this.confetti = this.confetti.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.rotation += p.rotSpeed;

      if (p.y > this.height + 20) return false;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
      return true;
    });
  },

  // Draw countdown overlay
  drawCountdown(number) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.font = 'bold 120px "Fredoka", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = number === 'GO!' ? '#44ff88' : '#FFD700';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 30;
    ctx.fillText(number, this.width / 2, this.height / 2);
    ctx.shadowBlur = 0;
  },

  // Full frame render
  renderFrame(gameState, dt) {
    this.clear();

    if (gameState.notes) {
      this.drawFallingNotes(gameState.notes, gameState.songTime, gameState.scrollSpeed);
    }

    this.drawKeyboard(gameState.activeNotes, gameState.hitNotes);
    this.drawEffects(dt);
    this.drawConfetti(dt);

    if (gameState.countdown !== null) {
      this.drawCountdown(gameState.countdown);
    }
  }
};
