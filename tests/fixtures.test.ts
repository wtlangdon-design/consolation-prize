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

/**
 * A PLAYTEST FIXTURE IS A RESTORED SAVE AND NOTHING MORE. Doc 36 Q111. These
 * apply every fixture in the manifest through the same path a load takes and
 * check what that path guarantees: the room, the flags it names, the declared
 * initial value of every flag it does not, the items it names plus whatever
 * starts held, no conversation in progress -- and that the tree it says it
 * opens on is the one the runner opens.
 */
test('every fixture applies through the save path and lands where it says', async () => {
  const content = await loadContent(fsReader);
  assert.ok(content.fixtures.size > 0, 'the manifest lists fixtures');
  for (const fixture of content.fixtures.values()) {
    const state = new GameState(content, new MemoryStorage());
    assert.ok(state.applyFixture(fixture), `${fixture.id} applies`);
    assert.equal(state.roomId, fixture.room);
    for (const [id, value] of Object.entries(fixture.flags)) assert.equal(state.flags.get(id), value, `${fixture.id}: ${id}`);
    for (const flag of content.flags.flags) {
      if (!(flag.id in fixture.flags)) assert.equal(state.flags.get(flag.id), flag.initial, `${fixture.id}: ${flag.id} keeps its initial value`);
    }
    for (const id of fixture.inventory ?? []) assert.ok(state.carried.includes(id), `${fixture.id} holds ${id}`);
    assert.equal(state.dialogue.isActive, false, 'no conversation is open');
    if (fixture.expect?.tree) {
      state.dialogue.start(fixture.expect.tree);
      if (fixture.expect.opensOn) assert.equal(state.dialogue.positionSnapshot().node, fixture.expect.opensOn, `${fixture.id}: the tree opens where the fixture says`);
      assert.ok(state.dialogue.presentOptions().length >= 3, `${fixture.id}: the node offers choices`);
      state.dialogue.end();
    }
  }
});

test('a fixture cannot name what the game does not declare: unknown flags and items are dropped, not invented', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  const ok = state.applyFixture({ id: 'x', label: 'x', room: 'assay_office', flags: { NOT_A_FLAG: true, T_OPENING_DONE: true }, inventory: ['not_an_item'] });
  assert.ok(ok);
  assert.equal(state.flags.isDefined('NOT_A_FLAG'), false);
  assert.ok(!state.carried.includes('not_an_item'));
  assert.equal(state.flags.get('T_OPENING_DONE'), true);
  assert.equal(state.applyFixture({ id: 'y', label: 'y', room: 'no_such_room', flags: {} }), false, 'an unknown room is refused');
});

test('a fixture session saves under its own key, apart from the real game', async () => {
  const content = await loadContent(fsReader);
  const storage = new MemoryStorage();
  const real = new GameState(content, storage);
  real.save();
  const review = new GameState(content, storage, undefined, 'consolation.fixture.test');
  review.applyFixture([...content.fixtures.values()][0]!);
  review.save();
  assert.ok(storage.getItem('consolation.fixture.test'), 'the review session wrote its own key');
  const fresh = new GameState(content, storage);
  assert.ok(fresh.load(), 'the real save is still there');
  assert.equal(fresh.roomId, content.manifest.startRoom, 'and untouched by the review session');
});
