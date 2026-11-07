// Word Quest scene: builds the actors from story.json and plays beats with Web Animations.
// Beat shapes: {move:{actor,to,dur,arc}} · {pose:{actor,name}} · {fx,at} · {sound} · {wait}. An array runs its beats in parallel.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tr = (o) => `translate(${o.x}px, ${o.y}px)`;

export class Stage {
  constructor(container, story, onSound) {
    this.story = story;
    this.onSound = onSound;
    this.offsets = {};
    this.world = document.createElement("div");
    this.world.className = "world";
    const sc = story.scene;
    this.world.style.background = `linear-gradient(${sc.sky[0]}, ${sc.sky[1]} 60%, ${sc.ground} ${sc.groundTop}px)`;
    this.world.style.width = sc.width || "1000px";
    container.replaceChildren(this.world);
    for (const [name, a] of Object.entries(sc.actors)) {
      const el = document.createElement("div");
      el.className = "actor" + (a.static ? " static" : "");
      el.dataset.actor = name;
      Object.assign(el.style, { left: a.x + "px", top: a.y + "px", width: a.w + "px", height: a.h + "px" });
      const body = document.createElement("div");
      body.className = "body";
      if (a.svg) body.innerHTML = story.assets[a.svg];
      else { body.textContent = a.emoji; body.style.fontSize = (a.size || 80) + "px"; }
      el.append(body);
      this.world.append(el);
      this.offsets[name] = { x: 0, y: 0 };
    }
  }

  el(name) { return this.world.querySelector(`[data-actor="${name}"]`); }

  /** Move an actor to a named spot, optionally along an arc (px upwards). */
  move(actor, to, dur = 500, arc = 0) {
    const sc = this.story.scene, base = sc.actors[actor], spot = sc.spots[actor]?.[to];
    if (!spot) return Promise.resolve();
    const el = this.el(actor), from = this.offsets[actor];
    const end = { x: spot.x - base.x, y: spot.y - base.y };
    const mid = { x: (from.x + end.x) / 2, y: (from.y + end.y) / 2 - arc };
    const frames = arc
      ? [{ transform: tr(from) }, { transform: tr(mid), offset: 0.5 }, { transform: tr(end) }]
      : [{ transform: tr(from) }, { transform: tr(end) }];
    el.style.transition = "opacity .4s";
    el.style.opacity = spot.opacity ?? 1;
    const anim = el.animate(frames, { duration: dur, easing: "ease-in-out" });
    return anim.finished.then(() => {
      el.style.transform = tr(end);
      this.offsets[actor] = end;
      anim.cancel();
    });
  }

  /** Play a named pose: tweens on the actor's body or parts ("kid:armR"). */
  pose(actor, name) {
    const tweens = this.story.poses[name] || [];
    const anims = tweens.map((t) => {
      const [who, part] = t.target.split(":");
      const sel = part ? `[data-part="${part}"]` : ".body";
      const node = this.world.querySelector(`[data-actor="${who}"] ${sel}`);
      if (!node) return null;
      const a = node.animate(t.keyframes, { duration: t.dur, easing: "ease-in-out", fill: t.hold ? "forwards" : "none" });
      return a.finished;
    }).filter(Boolean);
    return Promise.all(anims);
  }

  /** Little emoji burst from an actor. */
  fx(name, at) {
    const def = this.story.fx[name];
    const base = this.story.scene.actors[at], off = this.offsets[at] || { x: 0, y: 0 };
    if (!def) return Promise.resolve();
    const cx = base.x + off.x + base.w / 2, cy = base.y + off.y + base.h / 3;
    for (let i = 0; i < def.count; i++) {
      const s = document.createElement("span");
      s.className = "particle";
      s.textContent = def.emoji[i % def.emoji.length];
      s.style.left = cx + "px"; s.style.top = cy + "px";
      this.world.append(s);
      const dx = (Math.random() - 0.5) * 300, dy = -80 - Math.random() * 200;
      const a = s.animate([
        { transform: "translate(-50%, -50%) scale(.4)", opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.2)`, opacity: 0 },
      ], { duration: 900 + Math.random() * 400, easing: "ease-out" });
      a.finished.then(() => s.remove());
    }
    return sleep(700);
  }

  one(b) {
    if (b.move) return this.move(b.move.actor, b.move.to, b.move.dur, b.move.arc);
    if (b.pose) return this.pose(b.pose.actor, b.pose.name);
    if (b.fx) return this.fx(b.fx, b.at);
    if (b.sound) { this.onSound(b.sound); return Promise.resolve(); }
    if (b.wait) return sleep(b.wait);
    return Promise.resolve();
  }

  /** Run beats in order; an array inside runs in parallel. */
  async run(beats) {
    for (const b of beats) {
      if (Array.isArray(b)) await Promise.all(b.map((x) => this.one(x)));
      else await this.one(b);
    }
  }
}
