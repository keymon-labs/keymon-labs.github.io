// Word Quest scene: builds an episode's actors in a 1000×600 world and plays beats with the Web Animations API.
// Beat shapes are documented in EPISODES.md; styles for .world, .actor, .speech, .particle live in style.css.
import { tweenFrames } from "./episode.js";
import { local } from "./game.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const settle = (anim) => anim.finished.catch(() => {}); // cancelled animations reject; that's fine here

export class Stage {
  /** `art`: name → SVG text · `lang()`: current language · `onSound(name)` · `onSay(actor, text)`. */
  constructor(box, ep, { art, lang, onSound = () => {}, onSay = () => {} }) {
    Object.assign(this, { box, ep, lang, onSound, onSay, pos: {}, at: {}, loops: [], dead: false });
    const sc = ep.scene;
    this.world = document.createElement("div");
    this.world.className = "world";
    this.world.style.background = `linear-gradient(${sc.sky?.[0] ?? "#8fd8ff"}, ${sc.sky?.[1] ?? "#e6f8ff"} ${sc.groundTop - 1}px, ${sc.ground ?? "#6cc451"} ${sc.groundTop}px)`;
    box.replaceChildren(this.world);
    for (const [name, a] of Object.entries(sc.actors)) {
      const el = document.createElement("div");
      el.className = "actor" + (a.shadow ? " shadow" : "");
      el.dataset.actor = name;
      Object.assign(el.style, { left: `${a.x}px`, top: `${a.y}px`, width: `${a.w}px`, height: `${a.h}px` });
      const body = document.createElement("div");
      body.className = "body";
      if (a.art) body.innerHTML = art[a.art] || "";
      else { body.textContent = a.emoji; body.style.fontSize = `${a.size || a.h * 0.85}px`; }
      el.append(body);
      this.world.append(el);
      this.pos[name] = { x: a.x, y: a.y, o: 1, r: 0 };
    }
    for (const [key, spot] of Object.entries(ep.state || {})) if (sc.spots?.[key]?.[spot]) this.place(key, spot);
    for (const [name, a] of Object.entries(sc.actors)) if (a.idle) this.pose(name, a.idle);
  }

  el(name) { return this.world.querySelector(`[data-actor="${name}"]`); }

  transform(name, p) {
    const a = this.ep.scene.actors[name];
    return `translate(${p.x - a.x}px, ${p.y - a.y}px) rotate(${p.r}deg)`;
  }

  /** Put an actor on a spot at once. */
  place(name, spot) {
    const s = this.ep.scene.spots[name][spot], el = this.el(name);
    this.pos[name] = { x: s.x, y: s.y, o: s.opacity ?? 1, r: this.pos[name].r % 360 };
    this.at[name] = spot;
    el.style.transform = this.transform(name, this.pos[name]);
    el.style.opacity = this.pos[name].o;
  }

  /** Slide to a spot. `arc` lifts the path into a parabola (px at the top), `spin` turns it (degrees). */
  async move(name, to, { dur = 500, arc = 0, spin = 0, ease = "ease-in-out" } = {}) {
    const s = this.ep.scene.spots[name]?.[to];
    if (!s) return;
    const from = this.pos[name], end = { x: s.x, y: s.y, o: s.opacity ?? 1, r: from.r + spin };
    if (!dur || (from.x === end.x && from.y === end.y && from.o === end.o && !spin)) return this.place(name, to);
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
    this.pos[name] = end;
    this.place(name, to);
    anim.cancel();
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
    const def = this.ep.fx[name], a = this.ep.scene.actors[at], p = this.pos[at];
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
    const a = this.ep.scene.actors[name], p = this.pos[name];
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
  }

  /** Beats in order; a list inside the list runs at the same time. */
  async play(beats = []) {
    for (const b of beats) {
      if (this.dead) return;
      await (Array.isArray(b) ? Promise.all(b.map((x) => this.one(x))) : this.one(b));
    }
  }

  /** Make every actor stand where the state says, in case the beats didn't take it there. */
  sync(state) {
    return Promise.all(Object.entries(state).map(([k, v]) => (this.ep.scene.spots?.[k]?.[v] && this.at[k] !== v ? this.move(k, v, { dur: 350 }) : null)));
  }

  destroy() {
    this.dead = true;
    for (const a of this.loops) a.cancel();
  }
}
