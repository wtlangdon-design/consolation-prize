/**
 * ROOM 35, THE COMPANY VAULT, from the room's own fixture (content/fixtures/room-35.json).
 *
 * Doc 20: it opens off the office it belongs to and is gated to Act IV. Sixteen
 * subjects (doc 54), nobody, no puzzle; in through the great safe from Act IV,
 * out by THE VAULT DOOR (errata 99 I).
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
const docs = (await Promise.all(['docs/05-examine-layer.md', 'docs/10-examine-batch-3.md', 'docs/54-batch-c.md', 'docs/49-wrong-answers.md']
  .map((path) => readFile(resolve(ROOT, path), 'utf8')))).join('\n');
const FIXTURE = JSON.parse(await readFile(resolve(ROOT, 'content/fixtures/room-35.json'), 'utf8')) as { fixtures: { id: string; room: string }[] };
const ROOM = FIXTURE.fixtures[0]!.room;

const inState = async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  assert.ok(state.applyFixture(content.fixtures.get(FIXTURE.fixtures[0]!.id)!));
  return state;
};

test('every subject answers LOOK and LISTEN with a line the documents write', async () => {
  const state = await inState();
  assert.equal(state.roomId, ROOM);
  for (const one of state.targets) {
    for (const verb of ['LOOK_AT', 'LISTEN_TO']) {
      const said = state.interact(one, verb).say;
      assert.ok(said && docs.includes(said), `${one.id} ${verb}: "${said}" is written`);
    }
  }
  assert.equal(state.targets.length, 16, 'sixteen subjects, the vault door among them');
});

test('the vault opens off the office in Act IV and not before, and its door leads back', async () => {
  const state = await inState();
  const door = state.room.exits.find((one) => one.to !== undefined)!;
  const office = door.to!;
  state.enterRoom(office);
  assert.ok(state.targets.some((one) => (one as { to?: string }).to === ROOM), 'Act IV: the way in');
  // Act IV begins at the confession (doc 48 S4 beat 3), which writes both.
  state.flags.set('ACT', 3);
  state.flags.set('T_HOB_IS_MOTT', false);
  state.enterRoom(office);
  assert.ok(!state.targets.some((one) => (one as { to?: string }).to === ROOM), 'Act III: shut');
  assert.ok(state.content.rooms.get(office)!.entrances?.some((one) => one.from === ROOM));
});
