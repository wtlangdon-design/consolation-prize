/**
 * ROOM 34, THE TUNNEL UNDER THE CLAIM, from the room's own fixtures (content/fixtures/room-34.json).
 *
 * Doc 57 F1: the pickaxe on the hole is three days and forty feet, and Room 34
 * opens below it. One room in two states (errata 69 A): before F3 the way down,
 * after it the seam, the old lantern and the footprints. THE GAP is the way into
 * Room 33, its lines doc 57's (errata 99 H).
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const docs = (await Promise.all(['docs/05-examine-layer.md', 'docs/10-examine-batch-3.md', 'docs/54-batch-c.md',
  'docs/57-puzzle-completion.md', 'docs/49-wrong-answers.md']
  .map((path) => readFile(resolve(ROOT, path), 'utf8')))).join('\n');
const FIXTURE = JSON.parse(await readFile(resolve(ROOT, 'content/fixtures/room-34.json'), 'utf8')) as { fixtures: { id: string; room: string }[] };
const ROOM = FIXTURE.fixtures[0]!.room;
const [BEFORE, AFTER] = FIXTURE.fixtures.map((one) => one.id) as [string, string];

const inState = async (id: string) => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  assert.ok(state.applyFixture(content.fixtures.get(id)!));
  return state;
};
const ids = (state: GameState) => state.targets.map((one) => one.id);
const LATER = ['seam', 'old_lantern', 'footprints'];

test('before F3 every subject answers LOOK and LISTEN with a line the documents write, and the old working is not there', async () => {
  const state = await inState(BEFORE);
  assert.equal(state.roomId, ROOM);
  for (const one of state.targets) {
    for (const verb of ['LOOK_AT', 'LISTEN_TO']) {
      const said = state.interact(one, verb).say;
      assert.ok(said && docs.includes(said), `${one.id} ${verb}: "${said}" is written`);
    }
  }
  assert.ok(LATER.every((id) => !ids(state).includes(id)));
});

test('after F3 the seam, the old lantern and the footprints appear, and the plate is the second state', async () => {
  const state = await inState(AFTER);
  assert.ok(LATER.every((id) => ids(state).includes(id)));
  assert.equal(state.room.plateWhen?.find((one) => state.flags.test(one.when))?.plate, 'after');
  assert.equal(state.targets.length, 14, 'thirteen subjects, the way up among them, and THE GAP');
});

test('the pickaxe on the hole after F1 leads down, and the hole is the way down from then on', async () => {
  const state = await inState(BEFORE);
  // The claim above: the room the rope goes up to.
  const above = state.room.exits.find((one) => one.to !== 'listening_chamber')!.to;
  state.flags.set('T_DUG_DOWN', false);
  state.enterRoom(above);
  assert.ok(!state.targets.some((one) => (one as { to?: string }).to === ROOM), 'no way down before the digging');
  const hole = state.findTarget('hole')!;
  // Errata 245 (doc 118 O-7): he digs by the lamp from his room.
  const pockets = (state as unknown as { inventory: string[] }).inventory;
  if (!pockets.includes('hotel_lamp')) pockets.push('hotel_lamp');
  state.holdItem(null);
  state.holdItem('pickaxe');
  const dug = state.interact(hole, 'USE');
  assert.ok(dug.say && docs.includes(dug.say), 'three days, forty feet');
  assert.ok(state.flags.test({ T_DUG_DOWN: true }));
  assert.equal(dug.goesTo, ROOM, 'and once it is read he is at the bottom of it');
  state.enterRoom(above);
  assert.ok(state.targets.some((one) => (one as { to?: string }).to === ROOM), 'the hole leads down');
});

test('THE GAP is the way into the listening chamber, and answers with doc 57\'s lines', async () => {
  const state = await inState(BEFORE);
  const gap = state.room.exits.find((one) => one.to === 'listening_chamber')!;
  for (const verb of ['LOOK_AT', 'LISTEN_TO']) {
    const said = state.interact(gap, verb).say!;
    assert.ok(docs.includes(said));
  }
  const through = state.interact(gap, 'WALK_TO');
  assert.ok(through.changedRoom);
  assert.equal(state.roomId, 'listening_chamber');
});
