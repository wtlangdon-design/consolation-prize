/**
 * THINGS A PLAYER HITS (errata 355; Tyler, 2026-11-16: "Go"). From the Acts II to IV review and its playtest:
 *
 * 1. The Gulch is a round trip: Grievance carries him home before it is finished, and back out from the livery.
 * 2. The executor's form is Sump's, issued blank at the decease; Hob signs it; Sump will not take it blank. So the
 *    five refusals can be heard before the answer is found, as doc 02 designs the puzzle.
 * 3. Winnie at the filing answers TALK TO as herself.
 *
 * Proved against the defect: each assertion below failed on main before errata 355.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const json = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const hotspot = (room, id) => json(`content/rooms/${room}.json`).hotspots.find((one) => one.id === id);

test('the Gulch is a round trip', () => {
  const home = hotspot('washout', 'grievance').responses.USE.find((one) => one.when?.T_VESSEL_FOUND === false);
  assert.equal(home.goto, 'livery');
  const out = hotspot('livery', 'grievance').responses.USE.find((one) => one.goto === 'washout');
  assert.deepEqual(out.when, { T_GULCH_TRIP: true, T_VESSEL_FOUND: false });
});

test('the executor\'s form is issued blank and signed by Hob', () => {
  const issue = json('content/dialogue/sump.json').nodes.SUM_C1.options.find((one) => one.id === 'sump1');
  assert.deepEqual(issue.gives, ['executor_form']);
  const sign = json('content/dialogue/hob.json').nodes.HOB_E6.options.find((one) => one.id === 'hob1');
  assert.equal(sign.gives, undefined);
  assert.equal(sign.set.T_HOB_SIGNED, true);
  const sump = json('content/combinations.json').pairs.find((one) => one.item === 'executor_form' && one.target === 'sump');
  assert.equal(sump.rules.find((one) => one.completes === 'E6').when.T_HOB_SIGNED, true);
  assert.ok(sump.rules.some((one) => one.when?.T_HOB_SIGNED === false && !one.set), 'blank, it is refused');
});

test('Winnie at the filing is talked to as herself', () => {
  assert.ok(json('content/rooms/claims-registrar.json').peopleResponses.winnie_registrar.TALK_TO?.length);
  const ambient = readFileSync(new URL('../engine/core/Ambient.ts', import.meta.url), 'utf8');
  assert.match(ambient, /!this\.state\.room\.peopleResponses\?\.\[npc\.id\]\?\.TALK_TO/);
});
