/**
 * ROOM 25, THE CLAIM NEXT DOOR, and the jump on the claim beside it: D2 and
 * D5, played through the game state from the room's own fixtures
 * (content/fixtures/room-25.json).
 *
 * Doc 04: "Every single conversation, regardless of topic, ends with [him]
 * making an offer. It never stops." -- the tree's `closing`, one higher each
 * time, held at the last. PRA_A1 option 1 (A5's fourth way) only while the
 * hole is warm. Doc 57 D2: on the first visit next door in Act II he is on it
 * with his mallet, and PRA_D2 plays as Thad arrives; option 1 opens D2 and he
 * walks home. At his own claim, PRA_B1 option 6 is D2; option 7 is the turn
 * (D5), the arithmetic done out loud, and PRA_D6 follows. Every line asserted
 * is read from the documents; every id from the content.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import { AmbientLayer } from '../engine/core/Ambient.ts';
import type { AmbientFile, DialogueFile } from '../engine/core/types.ts';

// PLAYS: D2, D5

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const doc04 = await readFile(resolve(ROOT, 'docs/04-dialogue-trees.md'), 'utf8');
const quoted = (text: string) => [...text.matchAll(/"([^"]+)"/g)].map((m) => m[1]!);
/** Doc 04's offer run, read from the document: each offer one or more lines. */
const OFFERS = doc04.slice(doc04.indexOf('## The offer')).split('\n').find((line) => line.startsWith('> "'))!
  .slice(2).split(' · ').map(quoted);

const inState = async (fixtureId: string) => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  const fixture = content.fixtures.get(fixtureId);
  assert.ok(fixture, `fixture ${fixtureId} exists`);
  assert.ok(state.applyFixture(fixture));
  return state;
};
const hostOf = (state: GameState): AmbientFile => {
  const npc = [...state.content.ambient.values()].find((one) => one.room === state.roomId && one.tree);
  assert.ok(npc?.tree, 'the room has a character with a tree');
  return npc;
};
const opt = (state: GameState, n: string) => `${state.content.dialogue.get(state.dialogue.positionSnapshot().tree!)!.speaker}${n}`;
const shown = (state: GameState) => state.dialogue.presentOptions().map((one) => one.option.id);
const leave = (state: GameState) => {
  const exit = state.dialogue.presentOptions().find((one) => one.option.tag === 'EXIT');
  assert.ok(exit, 'a way out');
  const said = state.dialogue.select(exit.option.id);
  return [said.say, ...said.rest.map((one) => one.line)].filter(Boolean);
};

test('every conversation ends with his next offer, one higher each time, held at the last', async () => {
  const state = await inState('r25-a');
  const tree = hostOf(state).tree!;
  const file = state.content.dialogue.get(tree) as DialogueFile;
  assert.deepEqual(file.closing?.lines, OFFERS, 'the run is doc 04\'s');
  for (let n = 0; n < OFFERS.length + 2; n += 1) {
    state.dialogue.start(tree);
    const said = leave(state);
    const offer = OFFERS[Math.min(n, OFFERS.length - 1)]!;
    assert.deepEqual(said.slice(-offer.length), offer, `conversation ${n + 1} ends on offer ${Math.min(n, OFFERS.length - 1) + 1}`);
  }
});

test('A5\'s fourth way: asked only while the hole is warm, and the bite after', async () => {
  const state = await inState('r25-a');
  state.dialogue.start(hostOf(state).tree!);
  assert.equal(state.dialogue.positionSnapshot().node, 'PRA_A1');
  assert.ok(shown(state).includes(opt(state, '1')), 'the hole is warm: he can be asked');
  assert.ok(!shown(state).includes(opt(state, '4')), 'no bite yet');
  state.dialogue.select(opt(state, '1'));
  assert.equal(state.flags.get('T_PRATT_BITTEN'), true);
  assert.ok(shown(state).includes(opt(state, '4')), 'now the bite');
  const cold = await inState('r25-a');
  cold.flags.set('T_WARM_HOLE', true);
  cold.dialogue.start(hostOf(cold).tree!);
  assert.ok(!shown(cold).includes(opt(cold, '1')), 'the hole gone cold: nothing to ask');
});

test('D2: on the first visit next door in Act II he is on it, and option 1 sends him home at a walk', async () => {
  const state = await inState('r25-c');
  // The room where a man whose every conversation ends on an offer opens on
  // arrival: found by the content, not named.
  const closes = (npc?: string) => {
    const tree = npc ? state.content.ambient.get(npc)?.tree : undefined;
    return Boolean(tree && state.content.dialogue.get(tree)?.closing);
  };
  const next = [...state.content.rooms.values()].find((room) => closes(room.onEnter?.accost?.npc));
  assert.ok(next, 'a room where he opens on arrival');
  state.enterRoom(next.id);
  const accost = next.onEnter!.accost!;
  assert.ok(state.flags.test(accost.when), 'Act II, the first time: he opens');
  const jumper = state.content.ambient.get(accost.npc)!;
  const layer = new AmbientLayer(state);
  layer.arrived();
  layer.noteDepartures(0);
  assert.ok(layer.present.some((one) => one.id === jumper.id), 'he is on it');
  for (const [flag, value] of Object.entries(accost.set ?? {})) state.flags.set(flag, value);
  assert.ok(!state.flags.test(accost.when), 'once only');
  const tree = state.content.dialogue.get(jumper.tree!)!;
  const opening = state.dialogue.openingOf(jumper.tree!, true).map((one) => one.line);
  const d2 = doc04.slice(doc04.indexOf('## `PRA_D2`'));
  assert.deepEqual(opening, quoted(d2.split('\n| #')[0]!), 'PRA_D2\'s opening, from doc 04');
  state.dialogue.start(tree.id);
  state.dialogue.select(opt(state, '1'));
  assert.equal(state.puzzleProgress().D2, 'pending', 'D2 opens');
  layer.noteDepartures(0.1);
  assert.ok(layer.departing.some((one) => one.npc.id === jumper.id), 'he goes home at a walk');
});

test('D2 and D5 at his claim: the refusal to attest, then the arithmetic, then PRA_D6', async () => {
  const state = await inState('r25-b');
  state.dialogue.start(hostOf(state).tree!);
  assert.equal(state.dialogue.positionSnapshot().node, 'PRA_B1');
  for (const n of ['1', '2', '3', '4']) {
    assert.ok(shown(state).includes(opt(state, n)), `option ${n} follows the one before`);
    state.dialogue.select(opt(state, n));
  }
  assert.equal(state.flags.get('T_PRATT_PAID'), true);
  state.dialogue.select(opt(state, '6'));
  assert.ok(state.puzzleComplete('D2'), 'the refusal to attest is D2');
  const turn = state.dialogue.select(opt(state, '7'));
  const lines = [turn.say, ...turn.rest.map((one) => one.line)];
  const d5 = doc04.slice(doc04.indexOf('## `PRA_D5`'), doc04.indexOf('\n# ', doc04.indexOf('## `PRA_D5`')));
  const written = [...d5.matchAll(/^> \*\*[A-Z]+:\*\* (.+)$/gm)].map((m) => quoted(m[1]!.replace(/\*\([^)]*\)\*/g, ''))[0]);
  assert.deepEqual(lines, written, 'the turn, every line doc 04 writes, in order');
  assert.ok(state.puzzleComplete('D5'));
  assert.equal(state.flags.get('T_PRATT_TURNED'), true);
  assert.equal(state.dialogue.positionSnapshot().node, 'PRA_D6', 'PRA_D6 follows');
  state.dialogue.select(opt(state, '5'));
  assert.equal(state.flags.get('T_PRATT_SWEARS'), true, 'he will swear to the ninety days');
});

test('the claim next door is on the map only with the map in hand, and over the border from the claim beside it', async () => {
  const state = await inState('r25-b');
  const here = state.roomId;
  state.enterRoom('town_map');
  assert.ok(state.mapLocations.some((one) => one.location.room === here), 'on the map with it');
  const without = await inState('r22-a');
  assert.ok(!without.carried.includes('company_map'));
  without.enterRoom('town_map');
  assert.ok(!without.mapLocations.some((one) => one.location.room === here), 'and not without it');
  const back = state.content.rooms.get(here)!.exits!.find((exit) => exit.to)!.to!;
  state.enterRoom(back);
  assert.ok(state.targets.some((t) => (t as { to?: string }).to === here), 'the way next door');
});
