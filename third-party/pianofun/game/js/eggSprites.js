// eggSprites.js — Canvas 2D sprite drawing for Egg Catcher game

const EggSprites = {
  grassBlades: [],

  generateGrass(width) {
    this.grassBlades = [];
    for (let i = 0; i < 150; i++) {
      this.grassBlades.push({
        x: Math.random() * width,
        height: 8 + Math.random() * 20,
        lean: (Math.random() - 0.5) * 0.4,
        width: 2 + Math.random() * 3,
        shade: Math.random()
      });
    }
  },

  drawCloud(ctx, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath(); ctx.ellipse(0, 0, 50, 25, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-30, -10, 30, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(25, -8, 35, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-5, -20, 28, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },

  drawGround(ctx, width, height, groundY) {
    const grad = ctx.createLinearGradient(0, groundY, 0, height);
    grad.addColorStop(0, '#5a8a3c');
    grad.addColorStop(0.3, '#4a7a30');
    grad.addColorStop(1, '#3d6628');
    ctx.fillStyle = grad;
    ctx.fillRect(0, groundY, width, height - groundY);

    this.grassBlades.forEach(blade => {
      const g = 100 + Math.floor(blade.shade * 80);
      ctx.strokeStyle = `rgb(${60 + Math.floor(blade.shade * 40)}, ${g}, ${30 + Math.floor(blade.shade * 30)})`;
      ctx.lineWidth = blade.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(blade.x, groundY);
      ctx.quadraticCurveTo(
        blade.x + blade.lean * blade.height,
        groundY - blade.height * 0.6,
        blade.x + blade.lean * blade.height * 1.5,
        groundY - blade.height
      );
      ctx.stroke();
    });
  },

  drawNest(ctx, x, y, width, highlighted, pressTimer) {
    const w = Math.max(width * 0.65, 16);
    const h = 18;
    // pressTimer: 0 = idle, >0 = recently pressed (fades from 300 to 0)
    const pressAlpha = pressTimer > 0 ? Math.min(1, pressTimer / 150) : 0;
    const isPressed = pressAlpha > 0;

    ctx.save();
    ctx.translate(x, y);

    // Bright glow behind nest when pressed
    if (isPressed) {
      const glowSize = 1 + pressAlpha * 0.3;
      ctx.save();
      ctx.scale(glowSize, glowSize);
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 25 * pressAlpha;
      ctx.fillStyle = `rgba(255, 215, 0, ${pressAlpha * 0.4})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2 + 10, h + 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Bowl body
    const grad = ctx.createLinearGradient(-w / 2, -h, w / 2, h);
    if (isPressed) {
      // Bright warm glow
      const r = Math.round(184 + 71 * pressAlpha);
      const g = Math.round(144 + 80 * pressAlpha);
      const b = Math.round(30 + 30 * pressAlpha);
      grad.addColorStop(0, `rgb(${r},${g},${b})`);
      grad.addColorStop(0.5, `rgb(${Math.min(255, r + 20)},${Math.min(255, g + 20)},${b})`);
      grad.addColorStop(1, `rgb(${r - 40},${g - 40},${b - 10})`);
    } else {
      grad.addColorStop(0, '#8B6914');
      grad.addColorStop(0.5, '#A0792C');
      grad.addColorStop(1, '#6B5210');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2);
    ctx.quadraticCurveTo(-w / 2 - 3, h / 2, -w / 3, h);
    ctx.lineTo(w / 3, h);
    ctx.quadraticCurveTo(w / 2 + 3, h / 2, w / 2, -h / 2);
    ctx.closePath();
    ctx.fill();

    // Rim
    ctx.fillStyle = isPressed ? `rgba(255, 224, 100, ${0.7 + pressAlpha * 0.3})` : '#A0792C';
    ctx.beginPath();
    ctx.ellipse(0, -h / 2, w / 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isPressed ? '#B8901E' : '#6B5210';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Weave lines
    ctx.strokeStyle = 'rgba(107, 82, 16, 0.35)';
    ctx.lineWidth = 0.8;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * w / 6, -h / 2);
      ctx.lineTo(i * w / 5, h);
      ctx.stroke();
    }

    // Caught egg green ring
    if (highlighted) {
      ctx.shadowColor = '#44ff88';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = 'rgba(68, 255, 136, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 2, w / 2 + 4, h, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  },

  // Egg shape path (used by all egg variants)
  _eggPath(ctx, w, h) {
    ctx.beginPath();
    ctx.moveTo(0, -h / 2);
    ctx.bezierCurveTo(w * 0.8, -h / 2, w, -h / 6, w, h / 6);
    ctx.bezierCurveTo(w, h / 2, w * 0.5, h / 2, 0, h / 2);
    ctx.bezierCurveTo(-w * 0.5, h / 2, -w, h / 2, -w, h / 6);
    ctx.bezierCurveTo(-w, -h / 6, -w * 0.8, -h / 2, 0, -h / 2);
    ctx.closePath();
  },

  drawEgg(ctx, x, y, size, color, type, time) {
    ctx.save();
    ctx.translate(x, y);
    const w = size * 0.55;
    const h = size;

    if (type === 'golden') {
      this._drawGoldenEgg(ctx, w, h, time);
    } else if (type === 'rainbow') {
      this._drawRainbowEgg(ctx, w, h, time);
    } else if (type === 'frozen') {
      this._drawFrozenEgg(ctx, w, h, time);
    } else if (type === 'rotten') {
      this._drawRottenEgg(ctx, w, h, time);
    } else {
      this._drawNormalEgg(ctx, w, h, color);
    }

    ctx.restore();
  },

  _drawNormalEgg(ctx, w, h, color) {
    this._eggPath(ctx, w, h);
    const grad = ctx.createRadialGradient(-w * 0.2, -h * 0.2, 2, 0, 0, h);
    grad.addColorStop(0, this._lighten(color, 50));
    grad.addColorStop(0.5, color);
    grad.addColorStop(1, this._darken(color, 30));
    ctx.fillStyle = grad;
    ctx.fill();
    // Highlight
    ctx.beginPath();
    ctx.ellipse(-w * 0.25, -h * 0.2, w * 0.18, h * 0.12, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fill();
  },

  _drawGoldenEgg(ctx, w, h, time) {
    const shimmer = 0.7 + Math.sin(time * 0.005) * 0.3;
    this._eggPath(ctx, w, h);
    const grad = ctx.createRadialGradient(-w * 0.2, -h * 0.2, 2, 0, 0, h);
    grad.addColorStop(0, '#FFF8DC');
    grad.addColorStop(0.4, '#FFD700');
    grad.addColorStop(1, '#B8860B');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.globalAlpha = shimmer * 0.4;
    ctx.beginPath();
    ctx.ellipse(-w * 0.15, -h * 0.15, w * 0.25, h * 0.2, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.globalAlpha = 1;
    // Sparkles
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 4; i++) {
      const a = time * 0.003 + i * Math.PI / 2;
      const d = w * 1.3 + Math.sin(time * 0.005 + i) * 3;
      const s = 2 + Math.sin(time * 0.008 + i * 1.5);
      ctx.beginPath();
      ctx.arc(Math.cos(a) * d, Math.sin(a) * d * 0.6, Math.max(0.5, s), 0, Math.PI * 2);
      ctx.fill();
    }
  },

  _drawRainbowEgg(ctx, w, h, time) {
    const hue = (time * 0.1) % 360;
    this._eggPath(ctx, w, h);
    const grad = ctx.createLinearGradient(-w, -h / 2, w, h / 2);
    grad.addColorStop(0, `hsl(${hue}, 80%, 65%)`);
    grad.addColorStop(0.33, `hsl(${(hue + 120) % 360}, 80%, 65%)`);
    grad.addColorStop(0.66, `hsl(${(hue + 240) % 360}, 80%, 65%)`);
    grad.addColorStop(1, `hsl(${hue}, 80%, 65%)`);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-w * 0.2, -h * 0.2, w * 0.18, h * 0.12, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fill();
  },

  _drawFrozenEgg(ctx, w, h, time) {
    this._eggPath(ctx, w, h);
    const grad = ctx.createRadialGradient(-w * 0.2, -h * 0.2, 2, 0, 0, h);
    grad.addColorStop(0, '#E0F0FF');
    grad.addColorStop(0.5, '#87CEEB');
    grad.addColorStop(1, '#4682B4');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const cx = (i - 1) * w * 0.4;
      const cy = (i - 1) * h * 0.15;
      const sz = 3 + Math.sin(time * 0.004 + i) * 1.5;
      for (let j = 0; j < 6; j++) {
        const a = j * Math.PI / 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * sz, cy + Math.sin(a) * sz);
        ctx.stroke();
      }
    }
  },

  _drawRottenEgg(ctx, w, h, time) {
    this._eggPath(ctx, w, h);
    const grad = ctx.createRadialGradient(-w * 0.2, -h * 0.2, 2, 0, 0, h);
    grad.addColorStop(0, '#9B8B54');
    grad.addColorStop(0.5, '#6B7B34');
    grad.addColorStop(1, '#4B5B24');
    ctx.fillStyle = grad;
    ctx.fill();
    // Dark spots
    ctx.fillStyle = 'rgba(50,50,20,0.3)';
    ctx.beginPath(); ctx.ellipse(w * 0.2, h * 0.1, w * 0.2, h * 0.15, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-w * 0.3, -h * 0.05, w * 0.15, h * 0.1, -0.5, 0, Math.PI * 2); ctx.fill();
    // Stink lines
    ctx.strokeStyle = 'rgba(100,120,40,0.5)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const sx = (i - 1) * w * 0.5;
      const ph = time * 0.005 + i;
      ctx.beginPath();
      ctx.moveTo(sx, -h / 2 - 3);
      for (let t = 0; t < 12; t++) {
        ctx.lineTo(sx + Math.sin(ph + t * 0.5) * 4, -h / 2 - 3 - t * 1.5);
      }
      ctx.stroke();
    }
  },

  drawCrackedEgg(ctx, x, y, size, color, progress) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = 1 - progress;
    const w = size * 0.55;
    const h = size;
    const split = progress * h * 0.3;

    // Top half
    ctx.save();
    ctx.translate(0, -split);
    ctx.rotate(-progress * 0.2);
    ctx.beginPath();
    ctx.moveTo(-w, 0);
    ctx.lineTo(-w * 0.6, h * 0.05); ctx.lineTo(-w * 0.3, -h * 0.03);
    ctx.lineTo(0, h * 0.05); ctx.lineTo(w * 0.3, -h * 0.02);
    ctx.lineTo(w * 0.6, h * 0.04); ctx.lineTo(w, 0);
    ctx.bezierCurveTo(w * 0.8, -h / 2, w * 0.5, -h / 2, 0, -h / 2);
    ctx.bezierCurveTo(-w * 0.5, -h / 2, -w * 0.8, -h / 2, -w, 0);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();

    // Bottom half
    ctx.save();
    ctx.translate(0, split);
    ctx.rotate(progress * 0.15);
    ctx.beginPath();
    ctx.moveTo(-w, 0);
    ctx.lineTo(-w * 0.6, h * 0.05); ctx.lineTo(-w * 0.3, -h * 0.03);
    ctx.lineTo(0, h * 0.05); ctx.lineTo(w * 0.3, -h * 0.02);
    ctx.lineTo(w * 0.6, h * 0.04); ctx.lineTo(w, 0);
    ctx.bezierCurveTo(w, h / 3, w * 0.5, h / 2, 0, h / 2);
    ctx.bezierCurveTo(-w * 0.5, h / 2, -w, h / 3, -w, 0);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();

    // Yolk splat
    if (progress > 0.2) {
      ctx.globalAlpha = (1 - progress) * 0.8;
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.ellipse(0, h * 0.3 + progress * 10, w * 0.8 + progress * 10, h * 0.15 + progress * 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },

  drawBird(ctx, x, y, birdType, flapPhase, direction, scale) {
    const type = BIRD_TYPES[birdType] || BIRD_TYPES.sparrow;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(direction * scale, scale);

    const wingAngle = Math.sin(flapPhase) * 0.4;
    const bw = type.bodyWidth;
    const bh = type.bodyHeight;

    // Body
    ctx.fillStyle = type.bodyColor;
    ctx.beginPath(); ctx.ellipse(0, 0, bw, bh, 0, 0, Math.PI * 2); ctx.fill();

    // Belly
    ctx.fillStyle = type.bellyColor;
    ctx.beginPath(); ctx.ellipse(2, bh * 0.3, bw * 0.6, bh * 0.5, 0, 0, Math.PI * 2); ctx.fill();

    // Head
    ctx.fillStyle = type.headColor;
    ctx.beginPath(); ctx.arc(bw * 0.8, -bh * 0.4, bh * 0.7, 0, Math.PI * 2); ctx.fill();

    // Eye
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(bw * 1.0, -bh * 0.5, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(bw * 1.05, -bh * 0.55, 0.8, 0, Math.PI * 2); ctx.fill();

    // Beak
    ctx.fillStyle = type.beakColor;
    ctx.beginPath();
    ctx.moveTo(bw * 1.3, -bh * 0.35);
    ctx.lineTo(bw * 1.7, -bh * 0.2);
    ctx.lineTo(bw * 1.3, -bh * 0.1);
    ctx.closePath();
    ctx.fill();

    // Wings
    ctx.save();
    ctx.translate(-bw * 0.2, -bh * 0.3);
    ctx.rotate(wingAngle);
    ctx.fillStyle = type.wingColor;
    ctx.beginPath(); ctx.ellipse(0, 0, bw * 1.2, bh * 0.5, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Tail
    ctx.fillStyle = type.tailColor;
    ctx.beginPath();
    ctx.moveTo(-bw * 0.8, 0);
    ctx.lineTo(-bw * 1.5, -bh * 0.3);
    ctx.lineTo(-bw * 1.6, bh * 0.1);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  },

  drawFeather(ctx, x, y, rotation, scale, color, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.quadraticCurveTo(4, -4, 3, 0);
    ctx.quadraticCurveTo(2, 4, 0, 8);
    ctx.quadraticCurveTo(-2, 4, -3, 0);
    ctx.quadraticCurveTo(-4, -4, 0, -8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 8); ctx.stroke();
    ctx.restore();
  },

  _lighten(hex, amt) {
    if (!hex || hex[0] !== '#') return hex;
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amt);
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amt);
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amt);
    return `rgb(${r},${g},${b})`;
  },

  _darken(hex, amt) {
    if (!hex || hex[0] !== '#') return hex;
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amt);
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amt);
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amt);
    return `rgb(${r},${g},${b})`;
  }
};
