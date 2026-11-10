// Physics for Pop and Match (Matter.js): a V-shaped funnel with a flat bottom. Balls pour in
// from above and pile up at the bottom centre. No DOM: scene.js draws it, tests run it headless.
// World units: x 0..W across the opening, y 0..H down to the bottom of the funnel.

import Matter from 'matter-js';

const { Engine, Bodies, Body, Composite } = Matter;

export const W = 520;      // width of the opening
export const H = 520;      // depth of the funnel
export const FLOOR = 120;  // width of the bottom
export const DEPTH = 28;   // the bottom dips this far into a small V, so loose balls always roll to the centre and meet
export const BOTTOM = H + DEPTH;
const T = 120;            // wall thickness (thick, so balls never tunnel through)
const TOUCH = 4;           // balls this close (edge to edge) count as touching
const STEP = 1000 / 60;
const MAX_SPEED = 25;      // units per step; thinner than the walls are thick
// Matter takes the higher static friction of the two bodies, and walls default to 0.5, which holds a ball on a slope.
const SLIPPERY = { friction: 0.05, frictionStatic: 0.05 };

export function createWorld() {
  const engine = Engine.create({ positionIterations: 10, velocityIterations: 8 });
  engine.gravity.scale = 0.0015;
  const cx = W / 2, bx = FLOOR / 2;
  Composite.add(engine.world, [
    wall(0, 0, cx - bx, H),
    wall(W, 0, cx + bx, H),
    wall(cx - bx, H, cx, BOTTOM),
    wall(cx + bx, H, cx, BOTTOM),
    Bodies.rectangle(-T / 2, -600, T, 1400, { isStatic: true, ...SLIPPERY }),     // side guards: nothing escapes
    Bodies.rectangle(W + T / 2, -600, T, 1400, { isStatic: true, ...SLIPPERY }),  // while the balls are still pouring in
  ]);
  return { engine, balls: [] };
}

// A slanted wall along the line (x1,y1)-(x2,y2), with its thickness on the outside of the funnel.
function wall(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  let nx = -dy / len, ny = dx / len;
  if (nx * (W / 2 - x1) + ny * (H / 2 - y1) > 0) { nx = -nx; ny = -ny; }
  // Longer than the segment, so neighbouring walls overlap and leave no crack where they meet.
  return Bodies.rectangle((x1 + x2) / 2 + (nx * T) / 2, (y1 + y2) / 2 + (ny * T) / 2, len + 2 * T, T, { isStatic: true, angle: Math.atan2(dy, dx), ...SLIPPERY });
}

let nextId = 1;

/** Drop balls ({ n, r } each) from above the opening, on a loose grid so they rain in over a second or two. */
export function pour(world, specs, rng) {
  const rMax = Math.max(...specs.map((s) => s.r));
  const gap = 2 * rMax + 6;
  const cols = Math.floor((W - 16) / gap);
  const left = (W - cols * gap) / 2 + gap / 2;
  const order = specs.map((_, i) => i).sort(() => rng.next() - 0.5);
  order.forEach((si, i) => {
    const { n, r } = specs[si];
    const x = left + (i % cols) * gap + (rng.next() - 0.5) * 6;
    const y = -30 - Math.floor(i / cols) * gap;
    // frictionStatic: the default (0.5) holds a ball on a slope. slop: tolerate a little overlap, much less jitter.
    const body = Bodies.circle(x, y, r, { restitution: 0.1, friction: 0.05, frictionStatic: 0.05, frictionAir: 0.003, density: 0.002, slop: 1 });
    const ball = { id: nextId++, n, r, body };
    Composite.add(world.engine.world, body);
    world.balls.push(ball);
  });
}

export function removeBall(world, ball) {
  Composite.remove(world.engine.world, ball.body);
  const i = world.balls.indexOf(ball);
  if (i >= 0) world.balls.splice(i, 1);
}

/** Advance the physics. Speed is capped so a squeezed ball can never shoot through a wall. */
export function step(world, n = 1) {
  for (let i = 0; i < n; i++) {
    Engine.update(world.engine, STEP);
    for (const { body } of world.balls) {
      if (body.speed > MAX_SPEED) Body.setVelocity(body, { x: (body.velocity.x * MAX_SPEED) / body.speed, y: (body.velocity.y * MAX_SPEED) / body.speed });
    }
  }
}

export const pos = (ball) => ball.body.position;

export const touching = (a, b) => a !== b && Math.hypot(a.body.position.x - b.body.position.x, a.body.position.y - b.body.position.y) <= a.r + b.r + TOUCH;

export function touchingPairs(world) {
  const out = [];
  const { balls } = world;
  for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) if (touching(balls[i], balls[j])) out.push({ a: balls[i], b: balls[j] });
  return out;
}

/** True once everything has (nearly) stopped moving. */
export const settled = (world, limit = 0.6) => world.balls.every((b) => b.body.speed < limit); // a pile shimmers a little, so the default is loose

/** The ball under a point, with `slack` extra reach for fingers. Nearest edge wins. */
export function ballAt(world, x, y, slack = 0) {
  let best = null, bestGap = Infinity;
  for (const b of world.balls) {
    const gap = Math.hypot(b.body.position.x - x, b.body.position.y - y) - b.r;
    if (gap <= slack && gap < bestGap) { best = b; bestGap = gap; }
  }
  return best;
}

/** Shake the pile towards the bottom centre. Safety net if no two balls touch. */
export function nudge(world) {
  for (const b of world.balls) Body.setVelocity(b.body, { x: (W / 2 - b.body.position.x) * 0.03, y: 2 });
  // shortcut: a blind shove; only needed if the funnel shape ever lets two balls rest apart
}

/** Everything is inside the funnel (for tests). */
export const allInside = (world) => world.balls.every((b) => b.body.position.x > 0 && b.body.position.x < W && b.body.position.y < BOTTOM);
