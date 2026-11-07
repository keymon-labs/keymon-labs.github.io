// Word Quest scene: builds an episode's actors in a 1000×600 world and plays beats with the Web Animations API.
// Beat shapes are documented in EPISODES.md and checked in episode.js; styles for .world, .actor, .speech, .particle live in style.css.
import { tweenFrames } from "./episode.js";
import { local } from "./game.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const settle = (anim) => anim.finished.catch(() => {}); // cancelled animations reject; that's fine here

export class Stage {
  /** `art`: name → SVG text · `lang()`: current language · `onSound(name)` · `onSay(actor, text)`. */
  constructor(box, ep, { art, lang, onSound = () => {}, onSay = () => {} }) {
    Object.assign(this, { box, ep, art, lang, onSound, onSay, actors: {}, pos: {}, at: {}, loops: [], dead: false });
    const sc = ep.scene;
    this.world = document.createElement("div");
    this.world.className = "world";
    this.world.style.background = `linear-gradient(${sc.sky?.[0] ?? "#8fd8ff"}, ${sc.sky?.[1] ?? "#e6f8ff"} ${sc.groundTop - 1}px, ${sc.ground ?? "#6cc451"} ${sc.groundTop}px)`;
    box.replaceChildren(this.world);
    for (const [name, a] of Object.entries(sc.actors)) this.addActor(name, a);
    for (const [key, spot] of Object.entries(ep.state || {})) if (sc.spots?.[key]?.[spot]) this.placeAt(key, this.target(key, spot));
    for (const [name, a] of Object.entries(sc.actors)) if (a.idle) this.pose(name, a.idle);
  }

  addActor(name, a) {
    const el = document.createElement("div");
    el.className = "actor" + (a.shadow ? " shadow" : "");
    el.dataset.actor = name;
    Object.assign(el.style, { left: `${a.x}px`, top: `${a.y}px`, width: `${a.w}px`, height: `${a.h}px` });
    const body = document.createElement("div");
    body.className = "body";
    if (a.art) body.innerHTML = this.art[a.art] || "";
    else { body.textContent = a.emoji; body.style.fontSize = `${a.size || a.h * 0.85}px`; }
    el.append(body);
    this.world.append(el);
    this.actors[name] = a;
    this.pos[name] = { x: a.x, y: a.y, o: 1, r: 0 };
    return el;
  }

  el(name) { return this.world.querySelector(`[data-actor="${name}"]`); }

  transform(name, p) {
    const a = this.actors[name];
    return `translate(${p.x - a.x}px, ${p.y - a.y}px) rotate(${p.r}deg)`;
  }

  /** Where `to` is for an actor: one of its spots, another actor (centred on it), or {x, y}. Null if unknown. */
  target(name, to) {
    const a = this.actors[name], now = this.pos[name];
    if (to && typeof to === "object") return { x: to.x, y: to.y, o: now.o, spot: null };
    const s = this.ep.scene.spots?.[name]?.[to];
    if (s) return { x: s.x, y: s.y, o: s.opacity ?? 1, spot: to };
    const b = this.actors[to];
    if (b) return { x: this.pos[to].x + (b.w - a.w) / 2, y: this.pos[to].y + (b.h - a.h) / 2, o: now.o, spot: null };
    return null;
  }

  /** Put an actor somewhere at once. */
  placeAt(name, t) {
    const el = this.el(name);
    this.pos[name] = { x: t.x, y: t.y, o: t.o, r: (this.pos[name].r || 0) % 360 };
    this.at[name] = t.spot;
    el.style.transform = this.transform(name, this.pos[name]);
    el.style.opacity = t.o;
  }

  /** Slide somewhere (see target). `arc` lifts the path into a parabola (px at the top), `spin` turns it (degrees). */
  async move(name, to, { dur = 500, arc = 0, spin = 0, ease = "ease-in-out" } = {}) {
    const end = this.actors[name] && this.target(name, to);
    if (!end) return;
    const from = this.pos[name];
    if (!dur || (from.x === end.x && from.y === end.y && from.o === end.o && !spin)) return this.placeAt(name, end);
    const steps = arc || spin ? 20 : 1;
    const frames = Array.from({ length: steps + 1 }, (_, i) => {
      const k = i / steps;
      const p = { x: from.x + (end.x - from.x) * k, y: from.y + (end.y - from.y) * k - 4 * arc * k * (1 - k), r: from.r + spin * k };
      return { transform: this.transform(name, p), opacity: from.o + (end.o - from.o) * k };
    });
    // A thrown object moves at a steady speed sideways; the parabola already gives the rise and fall, so no easing.
    const anim = this.el(name).animate(frames, { duration: dur, easing: arc ? "linear" : ease, fill: "forwards" });
    await settle(anim);
    if (this.dead) return;
    this.pos[name].r = from.r + spin;
    this.placeAt(name, end);
    anim.cancel();
  }

  /** Pop out of sight (it comes back with home()). */
  async vanish(name) {
    const el = this.el(name);
    if (!el) return;
    await settle(el.animate([{ transform: `${this.transform(name, this.pos[name])} scale(1)`, opacity: this.pos[name].o },
      { transform: `${this.transform(name, this.pos[name])} scale(1.4)`, opacity: 0 }], { duration: 250, easing: "ease-in" }));
    if (this.dead) return;
    this.pos[name].o = 0;
    el.style.opacity = 0;
  }

  /** A temporary emoji actor that appears next to an actor or at {x, y}; removed by home(). */
  prop(name, emoji, at, size = 90) {
    if (this.actors[name]) return Promise.resolve();
    const near = typeof at === "string" && this.actors[at] ? this.pos[at] : null;
    const x = near ? near.x + this.actors[at].w / 2 - size / 2 : at?.x ?? 500 - size / 2;
    const y = near ? near.y - size * 0.6 : at?.y ?? 300 - size / 2;
    const el = this.addActor(name, { emoji: String(emoji).slice(0, 8), x, y, w: size, h: size, prop: true });
    return settle(el.animate([{ transform: "scale(0)", opacity: 0 }, { transform: "scale(1.2)", opacity: 1 }, { transform: "scale(1)", opacity: 1 }],
      { duration: 350, easing: "ease-out" }));
  }

  /** After a turn: props go, vanished actors pop back, and everyone returns to their spot (from the state) or their start. */
  home(state = {}) {
    return Promise.all(Object.entries(this.actors).map(async ([name, a]) => {
      if (a.prop) {
        await settle(this.el(name).animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" }));
        this.el(name)?.remove();
        delete this.actors[name];
        delete this.pos[name];
        return;
      }
      const end = (state[name] && this.target(name, state[name])) || { x: a.x, y: a.y, o: 1, spot: null };
      const now = this.pos[name];
      if (now.x === end.x && now.y === end.y && now.o === end.o) return;
      if (now.o === 0) { // reappear where it belongs instead of flying back invisible
        this.placeAt(name, end);
        return settle(this.el(name).animate([{ opacity: 0, transform: `${this.transform(name, this.pos[name])} scale(.3)` },
          { opacity: end.o, transform: `${this.transform(name, this.pos[name])} scale(1)` }], { duration: 400, easing: "ease-out" }));
      }
      return this.move(name, end.spot ?? { x: end.x, y: end.y }, { dur: 450 });
    }));
  }

  /** Play a named pose on an actor: tweens on its body or its parts (`data-part` in the SVG), plus the pose's fx and sound. */
  pose(name, poseName) {
    const def = this.ep.poses[poseName], root = this.el(name);
    if (!def || !root) return Promise.resolve();
    const waits = [];
    for (const t of def.tweens || []) {
      const node = t.part ? root.querySelector(`[data-part="${t.part}"]`) : root.querySelector(".body");
      if (!node) continue;
      if (!t.part) node.style.transformOrigin = t.origin || "";
      const anim = node.animate(tweenFrames(t), {
        duration: t.dur || 600, delay: t.delay || 0, easing: t.easing || "ease-in-out",
        iterations: t.loop ? Infinity : 1, fill: t.hold ? "forwards" : "none",
      });
      if (t.loop) this.loops.push(anim); else waits.push(settle(anim));
    }
    if (def.fx) this.fx(def.fx, name);
    if (def.sound) this.onSound(def.sound);
    return Promise.all(waits);
  }

  /** Emoji burst from an actor. */
  fx(name, at) {
    const def = this.ep.fx[name], a = this.actors[at], p = this.pos[at];
    if (!def || !a) return Promise.resolve();
    const cx = p.x + a.w / 2, cy = p.y + a.h / 3, spread = def.spread ?? 260, rise = def.rise ?? 200;
    for (let i = 0; i < (def.count ?? 6); i++) {
      const s = document.createElement("span");
      s.className = "particle";
      s.textContent = def.emoji[i % def.emoji.length];
      Object.assign(s.style, { left: `${cx}px`, top: `${cy}px` });
      this.world.append(s);
      const dx = (Math.random() - 0.5) * spread, dy = -rise * (0.4 + Math.random() * 0.6), r = (Math.random() - 0.5) * 140;
      const at = (x, y, sc) => `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${sc}) rotate(${r}deg)`;
      settle(s.animate([
        { transform: at(0, 0, 0.3), opacity: 1 },
        { transform: at(dx, dy, 1.2), opacity: 1, offset: 0.6 },
        { transform: at(dx * 1.2, dy + 70, 1), opacity: 0 },
      ], { duration: 1000 + Math.random() * 500, easing: "cubic-bezier(.2,.7,.3,1)" })).then(() => s.remove());
    }
    return sleep(450);
  }

  /** Speech bubble over an actor; also reported through onSay so the page can repeat it. */
  say(name, text) {
    const a = this.actors[name], p = this.pos[name];
    if (!a || !text) return Promise.resolve();
    this.world.querySelector(`.speech[data-for="${name}"]`)?.remove();
    const b = document.createElement("div");
    b.className = "speech";
    b.dataset.for = name;
    b.textContent = text;
    Object.assign(b.style, { left: `${Math.min(Math.max(p.x + a.w / 2, 170), 830)}px`, top: `${Math.max(p.y, 110)}px` });
    this.world.append(b);
    b.animate([{ transform: "translate(-50%, -100%) scale(.3)", opacity: 0 }, { transform: "translate(-50%, -100%) scale(1)", opacity: 1 }],
      { duration: 260, easing: "cubic-bezier(.3,1.6,.6,1)" });
    this.onSay(name, text);
    setTimeout(() => settle(b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" })).then(() => b.remove()),
      Math.min(4500, 1600 + text.length * 70));
    return sleep(700);
  }

  /** Camera shake (the scene box, in screen pixels). */
  shake(ms = 400) {
    const f = [0, -10, 9, -7, 5, -2, 0].map((x, i) => ({ transform: `translate(${x}px, ${i % 2 ? -x / 2 : x / 2}px)` }));
    return settle(this.box.animate(f, { duration: ms }));
  }

  /** One beat (see EPISODES.md). Any beat can wait first with "delay". */
  async one(b) {
    if (b.delay) await sleep(b.delay);
    if (this.dead) return;
    const actor = b.actor ?? this.ep.hero;
    if ("move" in b) return this.move(b.move, b.to, b);
    if ("pose" in b) return this.pose(actor, b.pose);
    if ("fx" in b) return this.fx(b.fx, b.at ?? actor);
    if ("sound" in b) return this.onSound(b.sound);
    if ("say" in b) return this.say(actor, local(b.say, this.lang()));
    if ("shake" in b) return this.shake(b.shake);
    if ("wait" in b) return sleep(b.wait);
    if ("vanish" in b) return this.vanish(b.vanish);
    if ("prop" in b) return this.prop(b.name, b.prop, b.at ?? (b.x != null ? { x: b.x, y: b.y } : actor), b.size);
  }

  /** Beats in order; a list inside the list runs at the same time. */
  async play(beats = []) {
    for (const b of beats) {
      if (this.dead) return;
      await (Array.isArray(b) ? Promise.all(b.map((x) => this.one(x))) : this.one(b));
    }
  }

  destroy() {
    this.dead = true;
    for (const a of this.loops) a.cancel();
  }
}
