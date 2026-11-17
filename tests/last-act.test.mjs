/**
 * THE LAST ACT, SAID WHERE IT IS PLAYED (errata 356; Tyler, 2026-11-16: "Go"). From the Act IV review:
 *
 * 1. The gift is decided on the path, in words: the strike is his, and he gives it to Mott's name, and why.
 * 2. The room under Prosperity does not say "seam" before the wall gives; the seam and the dawn are said on arrival.
 * 3. The Colonel is not at his desk in Act IV; the watchman's window says nobody is at it.
 * 4. Act IV's lines wait for what they speak of (the piano's A for the tuning; no dawn before the dawn).
 *
 * Proved against the defect: each assertion below failed on main before errata 356.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const json = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const room = (name) => json(`content/rooms/${name}.json`);
const target = (name, id) => [...room(name).hotspots, ...(room(name).exits ?? [])].find((one) => one.id === id);

test('the gift is decided where every player hears it', () => {
  const run = json('content/dialogue/winnie.json').nodes.WIN_F1.options.find((one) => one.set?.T_ASSAY_RUN);
  const thad = run.exchange.filter((one) => one.speaker === 'thad').map((one) => one.line).join(' ');
  assert.match(thad, /sell the Colonel/); // errata 372: the choice the counter allows, not a filing in his own name
  assert.match(thad, /Mott/);
});

test('the room under the claim waits for the wall, and the seam and the dawn are said on arrival', () => {
  for (const [id, verb] of [['walls', 'LOOK_AT'], ['to_prosperity', 'LOOK_AT'], ['to_prosperity', 'LISTEN_TO']]) {
    const rules = target('under-prosperity', id).responses[verb];
    const open = rules.filter((one) => !one.when).flatMap((one) => [one.say, ...(one.repeat ?? [])]).join(' ');
    assert.doesNotMatch(open, /seam|worthless claim\. I'm in no hurry|They don't know yet/, `${id} ${verb} before the wall gives`);
  }
  assert.equal(room('under-prosperity').onEnter.sayWhen.T_BROKE_THROUGH, true);
  assert.ok(room('main-street-dawn').onEnter.say?.length);
});

test('the Colonel is gone in Act IV, and nobody is at the watchman\'s window', () => {
  assert.deepEqual(json('content/ambient/fanshawe.json').when.ACT, { atMost: 3 });
  assert.ok(target('watchmans-shack', 'window').responses.LOOK_AT.some((one) => one.when?.ACT));
});

test('Act IV lines wait for what they speak of', () => {
  const piano = target('nugget', 'piano').responses.LISTEN_TO.find((one) => /Four hundred and forty/.test(one.say));
  assert.equal(piano.when.T_IN_TUNE, true);
  assert.ok(!target('church', 'window_glass').responses.LOOK_AT.some((one) => /dawn does the colors/.test(one.say)));
});
