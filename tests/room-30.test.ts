/**
 * ROOM 30, THE SUPPOSED STRIKE SITE, from the room's own fixtures
 * (content/fixtures/room-30.json). Doc 02 sites no puzzle here; nobody is
 * here ("the pilgrims are in the lines, not the room").
 *
 * Thirteen subjects, every line read from the documents; THE SITE ENTIRE
 * answers with doc 05 Part Two-B's Act IV line in Act IV; on the map once the
 * road to the claims has been walked, and the way back leads to it (errata
 * 99 A, F).
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
const doc05 = await readFile(resolve(ROOT, 'docs/05-examine-layer.md'), 'utf8');
const docs = doc05 + (await Promise.all(['docs/10-examine-batch-3.md', 'docs/54-batch-c.md', 'docs/08-examine-batch-1.md', 'docs/09-examine-batch-2.md']
  .map((path) => readFile(resolve(ROOT, path), 'utf8')))).join('\n');
const FIXTURE = JSON.parse(await readFile(resolve(ROOT, 'content/fixtures/room-30.json'), 'utf8')) as { fixtures: { id: string; room: string }[] };
const ROOM = FIXTURE.fixtures[0]!.room;

const inState = async (id: string) => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  assert.ok(state.applyFixture(content.fixtures.get(id)!));
  return state;
};

test('every subject answers LOOK and LISTEN with a line the documents write', async () => {
  const state = await inState(FIXTURE.fixtures[0]!.id);
  assert.equal(state.roomId, ROOM);
  for (const target of state.room.hotspots ?? []) {
    for (const verb of ['LOOK_AT', 'LISTEN_TO']) {
      const said = state.interact(target, verb).say;
      assert.ok(said && docs.includes(said), `${target.id} ${verb}: "${said}" is written`);
    }
  }
  assert.equal((state.room.hotspots ?? []).length, 13, 'thirteen subjects');
});

test('in Act IV the site answers with Part Two-B\'s line', async () => {
  const act4 = await inState(FIXTURE.fixtures[1]!.id);
  const act1 = await inState(FIXTURE.fixtures[0]!.id);
  const ground = (state: GameState) => (state.room.hotspots ?? []).find((one) => one.defaultVerb === 'WALK_TO')!;
  const later = act4.interact(ground(act4), 'LOOK_AT').say!;
  // Part Two-B's block for Room 30: the second '## ROOM 30' heading in doc 05.
  const at = doc05.indexOf('## ROOM 30', doc05.indexOf('## ROOM 30') + 5);
  assert.ok(at > 0 && doc05.slice(at, at + 2000).includes(later), 'Part Two-B, act 4');
  assert.notEqual(later, act1.interact(ground(act1), 'LOOK_AT').say);
});

test('the site goes on the map once the road to the claims has been walked, and leads back to it', async () => {
  const state = await inState(FIXTURE.fixtures[0]!.id);
  state.flags.set('T_SEEN_CLAIMS_ROAD', false);
  state.enterRoom('town_map');
  assert.ok(!state.mapLocations.some((one) => one.location.room === ROOM));
  state.flags.set('T_SEEN_CLAIMS_ROAD', true);
  state.enterRoom('town_map');
  assert.ok(state.mapLocations.some((one) => one.location.room === ROOM));
  const out = state.content.rooms.get(ROOM)!.exits![0]!;
  state.enterRoom(out.to!);
  assert.ok(state.room.entrances?.some((one) => one.from === ROOM));
});
