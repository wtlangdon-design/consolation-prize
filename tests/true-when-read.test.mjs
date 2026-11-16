/**
 * AN ACT'S LINE IS TRUE WHEN IT CAN BE READ (errata 350; the Act II to IV review).
 *
 * Act III begins at the Colonel's offer, six puzzles before Thad thinks of dying, and about forty examine lines gated
 * on the act alone said he was dead, mourned and buried from its first minute ("My own funeral notice, very
 * prominently posted!"). Act IV's spoke from after the strike or the duel. reference/act-line-gates.json gives each
 * the flag its sentence needs. This holds the two faults that were whole families:
 *   - no line gated on Act III alone speaks of his death, his funeral or his grave;
 *   - the hole at Prosperity has no Act III variant at all (invariant 3; doc 92 rule 2).
 * Proved against the defect: on main before errata 350 the first test lists 40 lines and the second fails.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const rooms = readdirSync(new URL('../content/rooms/', import.meta.url)).filter((name) => name.endsWith('.json'))
  .map((name) => JSON.parse(readFileSync(new URL(`../content/rooms/${name}`, import.meta.url), 'utf8'))).filter((room) => room.id);
const onlyActThree = (when) => when && Object.keys(when).length === 1 && typeof when.ACT === 'object' && when.ACT.atLeast === 3 && when.ACT.atMost === 3;
const DEATH = /\b(dead|died|deceased|buried|funeral|grave|coffin|mourn\w*|my loss|my memory|outlasted me|outlived)\b/i;
// Lines that use one of those words about somebody or something else, read and kept.
const ABOUT_OTHERS = new Set([]);

test('no line gated on Act III alone speaks of Thad\'s death, funeral or grave', () => {
  const early = [];
  for (const room of rooms) {
    for (const target of [...room.hotspots, ...(room.exits ?? [])]) {
      for (const [verb, rules] of Object.entries(target.responses ?? {})) {
        for (const rule of rules) {
          const said = [rule.say, ...(rule.repeat ?? [])].filter((one) => typeof one === 'string').join(' ');
          if (onlyActThree(rule.when) && DEATH.test(said) && !ABOUT_OTHERS.has(said)) early.push(`${room.id}/${target.id}/${verb}: ${said.slice(0, 70)}`);
        }
      }
    }
  }
  assert.deepEqual(early, [], 'give each the flag its sentence needs in reference/act-line-gates.json (T_OBITUARY, T_DECEASED or T_FUNERAL_DONE)');
});

test('the hole at Prosperity says in Act III what it has always said', () => {
  const hole = rooms.find((room) => room.id === 'prosperity').hotspots.find((one) => one.id === 'hole');
  for (const verb of ['LOOK_AT', 'LISTEN_TO']) {
    for (const rule of hole.responses[verb]) assert.ok(!onlyActThree(rule.when), `${verb}: no Act III variant`);
  }
});
