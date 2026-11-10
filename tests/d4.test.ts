import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import { HeadlessPlayer } from './lib/headless-player.ts';

// PLAYS: D4

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const doc57 = await readFile(resolve(ROOT, 'docs/57-puzzle-completion.md'), 'utf8');

/**
 * D4'S FIRST HALF, THE PLATE AT THE GATE. Doc 57 D4: "On the funeral day he has a full plate, at the foot of Boot
 * Hill" -- the exchange, then THE LINEN MONEY. Doc 57 C3: "If T_SHENG_TASK is set and D4 is not done, Sowerby is at
 * the gate with the plate." The laundry half is tests/room-28.test.ts.
 *
 * ERRATA 246 (doc 115 II-1): arriving used to collect the money. Now the Reverend is asked and will not make change
 * while the town watches; with a hymnal Thad stands in the line, the plate stops with him, and PULL settles it. The
 * day lasts until it is settled, so going back for the hymnal does not end it.
 */
const setup = async (task: boolean) => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  assert.ok(state.applyFixture(content.fixtures.get('r14-a')!));
  const hill = state.roomId;
  const away = state.room.exits[0]!.to;
  state.enterRoom(away);
  state.flags.set('T_FUNERAL_DAY', true);
  state.flags.set('T_SHENG_TASK', task);
  return { content, state, hill, away };
};
const atGate = (state: GameState) => [...state.content.ambient.values()]
  .filter((npc) => npc.room === state.roomId && npc.when !== undefined && 'T_PLATE_AT_GATE' in npc.when && state.flags.test(npc.when));
const LINE = 'town_coming_down';
const HELD = 'mr_pike_s_collection';

test('on the funeral day with the task open: asked, refused, into the line with a hymnal, and PULL pays', async () => {
  const { state, hill } = await setup(true);
  state.enterRoom(hill);
  const player = new HeadlessPlayer(state);
  const reverend = atGate(state);
  assert.equal(reverend.length, 1, 'one figure at the gate');
  assert.equal(state.flags.get('T_FUNERAL_DAY'), true, 'arriving no longer ends the day while the plate is open');
  assert.ok(!state.carried.includes('linen_money'), 'and arriving no longer pays');

  // Before he is asked, the line is not joined; nor without a hymnal.
  player.verb(LINE, 'USE');
  assert.equal(state.flags.get('T_HOLDS_PLATE'), false);
  const asking = state.room.peopleResponses![reverend[0]!.id]!.TALK_TO!.find((rule) => rule.set?.T_LINEN_ASKED === true)!;
  const asked = [asking.say!, ...(asking.then ?? []).map((one) => (typeof one === 'string' ? one : one.line))];
  for (const line of asked.slice(0, 3)) assert.ok(doc57.includes(line), `"${line}" is doc 57's`);
  player.verb(reverend[0]!.id, 'TALK_TO');
  assert.equal(state.flags.get('T_LINEN_ASKED'), true);
  player.verb(LINE, 'USE');
  assert.equal(state.flags.get('T_HOLDS_PLATE'), false, 'no hymnal, no place in the line');
  assert.equal(state.findTarget(HELD), undefined);

  state.flags.set('T_HYMNAL_TAKEN', true);
  player.verb(LINE, 'USE');
  assert.equal(state.flags.get('T_HOLDS_PLATE'), true, 'the plate stops with him');
  const held = state.findTarget(HELD)!;
  // Nothing but PULL settles it.
  for (const verb of ['PUSH', 'USE', 'PICK_UP', 'OPEN', 'CLOSE']) {
    state.interact(held, verb);
    assert.equal(state.flags.get('T_LINEN_COLLECTED'), false, `${verb} does not settle it`);
  }
  const pull = held.responses!.PULL!.find((rule) => rule.grants?.length)!;
  const closing = (pull.then ?? []).map((one) => (typeof one === 'string' ? one : one.line)).slice(-2);
  for (const line of closing) assert.ok(doc57.includes(line), `the PULL ends in doc 57's own: "${line}"`);
  state.interact(held, 'PULL');
  assert.ok(state.carried.includes('linen_money'), 'THE LINEN MONEY');
  assert.equal(state.flags.get('T_LINEN_COLLECTED'), true);
  assert.equal(state.flags.get('T_FUNERAL_DAY'), false, 'and the day is over');
  assert.equal(state.findTarget(HELD), undefined, 'once');
  assert.equal(atGate(state).length, 1, 'he stays for the visit');
});

test('while he holds the plate he stands where he is: the room says so, and the gate does not let him out', async () => {
  const { state, hill } = await setup(true);
  state.enterRoom(hill);
  state.flags.set('T_LINEN_ASKED', true);
  state.flags.set('T_HYMNAL_TAKEN', true);
  new HeadlessPlayer(state).verb(LINE, 'USE');
  const pose = state.room.actorPoses?.find((one) => state.flags.test(one.when));
  assert.ok(pose?.rooted, 'held, and rooted');
  assert.ok(state.content.actor.clips.some((clip) => clip.id === pose!.clip), 'in a clip he has');
  for (const exit of state.room.exits.filter((one) => one.transitScene?.length)) {
    const stays = exit.transitScene!.find((rule) => state.flags.test(rule.when));
    assert.ok(stays?.stays && stays.say, `${exit.id} answers and keeps him`);
  }
  assert.ok(state.room.exits.some((one) => one.transitScene?.some((rule) => rule.stays)), 'a way out that is held');
});

test('without the task the day ends on arriving; with it, it lasts until the plate is settled', async () => {
  const { state, hill } = await setup(false);
  state.enterRoom(hill);
  assert.equal(atGate(state).length, 0);
  assert.equal(state.flags.get('T_FUNERAL_DAY'), false, 'no plate business: arriving ends the day, as it always did');

  const second = await setup(true);
  second.state.enterRoom(second.hill);
  second.state.enterRoom(second.away); // back for the hymnal
  assert.equal(second.state.flags.get('T_FUNERAL_DAY'), true, 'the day is still on');
  second.state.enterRoom(second.hill);
  assert.equal(atGate(second.state).length, 1, 'and the Reverend is still at the gate');
  assert.equal(second.state.flags.get('T_HOLDS_PLATE'), false, 'the plate is never held across an entry');
  second.state.flags.applyWrites({ T_LINEN_COLLECTED: true, T_FUNERAL_DAY: false });
  second.state.enterRoom(second.away);
  second.state.enterRoom(second.hill);
  assert.equal(atGate(second.state).length, 0, 'settled: gone the next time');
});
