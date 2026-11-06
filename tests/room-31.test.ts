/**
 * ROOM 31, THE FUNERAL, from the room's own fixtures (content/fixtures/room-31.json).
 *
 * Doc 48 S2 stages it: the player wanders his own funeral; beat 3 is spoken on
 * the second LOOK at the grave, or at the way back toward the rest of the hill.
 * Doc 57 E7: after beat 3 the coffin is the lying down, and the next room is
 * Room 32; during the service the way out refuses. Doc 57 E8: when Room 32 is
 * over he is back on the hill at night, and his line ends the funeral. Every
 * word is read from the documents (errata 99 G).
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
  'docs/48-act-turn-beats.md', 'docs/57-puzzle-completion.md', 'docs/49-wrong-answers.md']
  .map((path) => readFile(resolve(ROOT, path), 'utf8')))).join('\n');
const FIXTURE = JSON.parse(await readFile(resolve(ROOT, 'content/fixtures/room-31.json'), 'utf8')) as { fixtures: { id: string; room: string }[] };
const ROOM = FIXTURE.fixtures[0]!.room;
const [DAY, AFTER_BEAT, NIGHT] = FIXTURE.fixtures.map((one) => one.id) as [string, string, string];

const inState = async (id: string) => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  assert.ok(state.applyFixture(content.fixtures.get(id)!));
  return state;
};
const target = (state: GameState, id: string) => state.targets.find((one) => one.id === id)!;
const exitOut = (state: GameState) => state.room.exits.find((one) => one.to !== undefined && one.to !== 'town_map')!;
const lines = (result: { say: string | null; then?: unknown[] }) => [result.say,
  ...(result.then ?? []).map((one) => (typeof one === 'string' ? one : (one as { line: string }).line))];

test('during the service every subject answers LOOK and LISTEN with a line the documents write', async () => {
  const state = await inState(DAY);
  assert.equal(state.roomId, ROOM);
  const subjects = [...(state.room.hotspots ?? []), ...state.room.exits];
  for (const one of subjects) {
    for (const verb of ['LOOK_AT', 'LISTEN_TO']) {
      const said = state.interact(one, verb).say;
      assert.ok(said && docs.includes(said), `${one.id} ${verb}: "${said}" is written`);
    }
  }
  assert.equal(subjects.length, 13, 'thirteen subjects, the way back among them');
});

test('beat 3 plays on the second LOOK at the grave: the chain\'s second line, then two lines that are not his', async () => {
  const state = await inState(DAY);
  const grave = target(state, 'grave');
  const first = state.interact(grave, 'LOOK_AT');
  assert.ok(!state.flags.test({ T_GOOD_TURNOUT: true }), 'not on the first look');
  const second = state.interact(grave, 'LOOK_AT');
  const said = lines(second);
  assert.notEqual(said[0], first.say);
  assert.equal(said.length, 3, 'the second line, then the beat\'s two');
  assert.ok(said.every((line) => line && docs.includes(line)));
  assert.ok((second.then ?? []).every((one) => typeof one !== 'string'), 'the beat is spoken by the figure at the back');
  assert.ok(state.flags.test({ T_GOOD_TURNOUT: true }));
});

test('or at the way back, which then refuses: he stays for his own funeral', async () => {
  const state = await inState(DAY);
  const out = exitOut(state);
  const beat = state.interact(out, 'WALK_TO');
  assert.equal(beat.goesTo, undefined, 'beat 3 keeps him in the room');
  assert.equal(beat.changedRoom, false);
  assert.equal(lines(beat).length, 2);
  assert.ok(state.flags.test({ T_GOOD_TURNOUT: true }));
  const refused = state.interact(out, 'WALK_TO');
  assert.equal(refused.goesTo, undefined, 'and the way out refuses');
  assert.ok(refused.say && docs.includes(refused.say));
  assert.equal(state.roomId, ROOM);
});

test('the coffin refuses until beat 3, then lies him down and leads into the coffin', async () => {
  const before = await inState(DAY);
  const refusal = before.interact(target(before, 'coffin'), 'USE');
  assert.ok(refusal.say && docs.includes(refusal.say), 'doc 49\'s refusal');
  assert.equal(refusal.goesTo ?? null, null);
  const state = await inState(AFTER_BEAT);
  const lie = state.interact(target(state, 'coffin'), 'USE');
  assert.equal(lie.goesTo, 'coffin');
  const said = lines(lie);
  assert.equal(said.length, 2);
  assert.ok(said.every((line) => line && docs.includes(line)));
  assert.ok(state.puzzleComplete('E7'));
  assert.ok(!state.flags.test({ T_LAID_IN: true }), 'the service stays on the hill while the lines are said');
  state.enterRoom('coffin');
  assert.ok(state.flags.test({ T_LAID_IN: true }), 'the coffin writes it on entry');
  assert.deepEqual(state.room.afterTimeline?.goto, ROOM, 'and hands back to the hill when it is over');
});

test('at night the hill is empty but for the way down, and his line ends the funeral', async () => {
  const state = await inState(NIGHT);
  assert.deepEqual(state.room.plateWhen?.find((one) => state.flags.test(one.when))?.plate, 'night');
  assert.deepEqual(state.targets.map((one) => one.id), [exitOut(state).id], 'only the way down');
  const entry = state.room.onEnter!;
  assert.ok(entry.say?.length && entry.say.every((line) => docs.includes(line)));
  assert.ok(state.flags.test(entry.sayWhen));
  state.flags.applyWrites(entry.saySet!);
  assert.ok(state.flags.test({ T_FUNERAL_DONE: true }));
  const down = state.interact(exitOut(state), 'WALK_TO');
  assert.ok(down.changedRoom);
  assert.equal(state.roomId, 'boot_hill', 'the way down goes down');
});

test('from Boot Hill, the plot leads to the funeral once the executor is named, until it is done', async () => {
  const state = await inState(DAY);
  state.enterRoom('boot_hill');
  const way = state.targets.find((one) => 'to' in one && (one as { to: string }).to === ROOM);
  assert.ok(way, 'the plot is the way up');
  state.flags.set('T_FUNERAL_DONE', true);
  state.enterRoom('boot_hill');
  assert.ok(!state.targets.some((one) => 'to' in one && (one as { to: string }).to === ROOM), 'and not after');
});

test('the eulogy is the bark the script writes', async () => {
  const content = await loadContent(fsReader);
  const ids = content.rooms.get(ROOM)!.ambient ?? [];
  const barks = ids.flatMap((id) => Object.values(content.ambient.get(id)?.barks ?? {}));
  assert.ok(barks.length > 0 && barks.every((line) => docs.includes(line)));
});
