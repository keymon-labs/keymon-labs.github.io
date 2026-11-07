// Checks every story folder: rules point at real groups, outcomes use known actors, spots, poses and effects, and tutorial examples do what they say.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { evaluate, initialState } from "../game.js";

const dir = new URL("../stories/", import.meta.url);
const ids = readdirSync(dir).filter((d) => existsSync(new URL(`${d}/story.json`, dir)));

for (const id of ids) {
  const story = JSON.parse(readFileSync(new URL(`${id}/story.json`, dir)));
  test(`story ${id}: data is consistent`, () => {
    const { actors, spots } = story.scene;
    for (const lang of ["en", "es"]) {
      assert.ok(story.groups[lang], `groups for ${lang}`);
      for (const r of story.rules) for (const g of r.if || []) assert.ok(story.groups[lang][g], `group ${g}`);
      for (const r of story.rules) assert.ok(story.outcomes[r.outcome], `outcome ${r.outcome}`);
    }
    for (const [name, o] of Object.entries(story.outcomes)) {
      assert.ok(o.text.en && o.text.es, `${name} text in en and es`);
      const visit = (b) => {
        if (Array.isArray(b)) return b.forEach(visit);
        if (b.move) {
          assert.ok(actors[b.move.actor], `${name}: actor ${b.move.actor}`);
          assert.ok(spots[b.move.actor]?.[b.move.to], `${name}: spot ${b.move.actor}.${b.move.to}`);
        }
        if (b.pose) assert.ok(actors[b.pose.actor], `${name}: pose actor ${b.pose.actor}`);
        if (b.fx) assert.ok(story.fx[b.fx], `${name}: fx ${b.fx}`);
        if (b.sound) assert.ok(["good", "bad", "pop", "win"].includes(b.sound), `${name}: sound ${b.sound}`);
      };
      o.beats.forEach(visit);
      for (const k of Object.keys(o.effects || {})) assert.ok(["ballHeld", "ballAt", "ballGone", "frog"].includes(k), `${name}: effect ${k}`);
    }
    for (const p of story.kidPoses) assert.ok(story.poses[p] !== undefined, `pose ${p}`);
    for (const [pname, tweens] of Object.entries(story.poses)) {
      for (const t of tweens) assert.ok(actors[t.target.split(":")[0]], `${pname}: target ${t.target}`);
    }
  });
  test(`story ${id}: tutorial examples give the outcome they claim`, () => {
    for (const step of story.tutorial || []) {
      if (!step.demo) continue;
      for (const lang of ["en", "es"]) {
        const r = evaluate(step.demo.sentence[lang], initialState(), story, lang);
        assert.equal(r && r.id, step.demo.expect, `${lang}: "${step.demo.sentence[lang]}"`);
      }
    }
  });
}
