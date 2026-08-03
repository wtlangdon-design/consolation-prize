import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import type { ContentBundle } from '../engine/core/types.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

async function bundle(): Promise<ContentBundle> {
  return loadContent(fsReader);
}

/** Drives the harness into a distinctive, partly-explored state. */
function advance(state: GameState): void {
  state.enterRoom('harness_a');
  state.verbs.selectVerb('LOOK_AT');
  state.interact(state.findTarget('hs_alpha')!, state.verbs.verbFor(state.findTarget('hs_alpha')!)); // sets T_HARNESS_EXAMINED

  state.verbs.selectVerb('PUSH');
  state.interact(state.findTarget('hs_beta')!, state.verbs.verbFor(state.findTarget('hs_beta')!)); // HARNESS_PUSH_COUNT 0 -> 1
  state.interact(state.findTarget('hs_beta')!, state.verbs.verbFor(state.findTarget('hs_beta')!)); // -> 2

  state.verbs.selectVerb('TALK_TO');
  state.interact(state.findTarget('hs_alpha')!, state.verbs.verbFor(state.findTarget('hs_alpha')!)); // opens harness_tree at HARN_1

  state.dialogue.select('opt_topic'); // exhausts one option, stays on HARN_1
  state.dialogue.select('opt_unlock'); // sets T_HARNESS_UNLOCKED, moves to HARN_2
}

test('a fresh state starts from declared initial values', async () => {
  const state = new GameState(await bundle(), new MemoryStorage());

  assert.equal(state.roomId, state.content.manifest.startRoom);
  assert.equal(state.flags.getBoolean('T_HARNESS_EXAMINED'), false);
  assert.equal(state.flags.getNumber('HARNESS_PUSH_COUNT'), 0);
  assert.equal(state.dialogue.isActive, false);
});

test('save and load restore exact state, including partial dialogue trees', async () => {
  const content = await bundle();
  const storage = new MemoryStorage();

  const before = new GameState(content, storage);
  advance(before);
  before.save();

  const expected = {
    room: before.roomId,
    flags: before.flags.snapshot(),
    progress: before.dialogue.progressSnapshot(),
    position: before.dialogue.positionSnapshot(),
  };

  // A second GameState over the same storage is what a browser refresh does.
  const after = new GameState(content, storage);
  assert.equal(after.load(), true);

  assert.equal(after.roomId, expected.room);
  assert.deepEqual(after.flags.snapshot(), expected.flags);
  assert.deepEqual(after.dialogue.progressSnapshot(), expected.progress);
  assert.deepEqual(after.dialogue.positionSnapshot(), expected.position);

  // Mid-conversation, on the node it was left on.
  assert.equal(after.dialogue.isActive, true);
  assert.equal(after.dialogue.positionSnapshot().node, 'HARN_2');
});

test('exhaustion survives the round trip and repeat responses still differ', async () => {
  const content = await bundle();
  const storage = new MemoryStorage();

  const before = new GameState(content, storage);
  before.dialogue.start('harness_tree');
  const first = before.dialogue.select('opt_topic');
  before.save();

  const after = new GameState(content, storage);
  assert.equal(after.load(), true);

  const options = after.dialogue.presentOptions();
  const topic = options.find((presented) => presented.option.id === 'opt_topic');
  assert.ok(topic, 'opt_topic should still be present');
  assert.equal(topic.exhausted, true, 'an exhausted option stays visible and marked');

  const second = after.dialogue.select('opt_topic');
  assert.notEqual(second.say, first.say, 'a repeat selection answers differently');
});

test('gated options appear only once their flag is written', async () => {
  const state = new GameState(await bundle(), new MemoryStorage());
  state.dialogue.start('harness_tree');
  state.dialogue.select('opt_unlock');

  const ids = state.dialogue.presentOptions().map((presented) => presented.option.id);
  assert.ok(ids.includes('opt_gated'), 'gate opens once T_HARNESS_UNLOCKED is set');

  const fresh = new GameState(await bundle(), new MemoryStorage());
  fresh.dialogue.start('harness_tree');
  // HARN_1 does not offer the gated option at all, so jump straight to HARN_2.
  fresh.dialogue.select('opt_unlock');
  fresh.flags.set('T_HARNESS_UNLOCKED', false);
  const closed = fresh.dialogue.presentOptions().map((presented) => presented.option.id);
  assert.ok(!closed.includes('opt_gated'), 'gate closes when the flag is not set');
});

test('a COMIC option can set a flag without presenting as progress', async () => {
  const state = new GameState(await bundle(), new MemoryStorage());
  state.dialogue.start('harness_tree');
  state.dialogue.select('opt_unlock');

  assert.equal(state.flags.getBoolean('T_HARNESS_COMIC_SEEN'), false);
  state.dialogue.select('opt_comic_flag');
  assert.equal(state.flags.getBoolean('T_HARNESS_COMIC_SEEN'), true);

  const option = state.content.dialogue
    .get('harness_tree')!
    .nodes['HARN_2']!.options.find((candidate) => candidate.id === 'opt_comic_flag')!;
  assert.equal(option.tag, 'COMIC', 'the tag stays COMIC -- the player must not be able to tell');
});

test('room transitions autosave, and a corrupt save is refused rather than half-applied', async () => {
  const content = await bundle();
  const storage = new MemoryStorage();

  const state = new GameState(content, storage);
  state.enterRoom('harness_a');
  state.verbs.selectVerb(state.verbs.walkVerbId);
  state.interact(state.findTarget('exit_a_to_b')!, state.verbs.verbFor(state.findTarget('exit_a_to_b')!));
  assert.equal(state.roomId, 'harness_b');

  const reloaded = new GameState(content, storage);
  assert.equal(reloaded.load(), true);
  assert.equal(reloaded.roomId, 'harness_b', 'the transition autosaved without an explicit save');

  storage.setItem('consolation.save.v1', '{"version":1,"room":');
  const broken = new GameState(content, storage);
  assert.equal(broken.load(), false);
  assert.equal(broken.roomId, content.manifest.startRoom, 'a refused load leaves the fresh state untouched');
});

test('reset returns to initial state and clears the save', async () => {
  const content = await bundle();
  const storage = new MemoryStorage();

  const state = new GameState(content, storage);
  advance(state);
  state.save();
  state.reset();

  assert.equal(state.roomId, state.content.manifest.startRoom);
  assert.equal(state.flags.getNumber('HARNESS_PUSH_COUNT'), 0);
  assert.equal(state.dialogue.isActive, false);
  assert.equal(state.saves.exists(), false);
  assert.equal(state.load(), false);
});

test('a non-transit verb examines a doorway in place instead of going through it', async () => {
  const state = new GameState(await bundle(), new MemoryStorage());
  state.enterRoom('harness_a');

  state.verbs.selectVerb('LOOK_AT');
  const result = state.interact(state.findTarget('exit_a_to_b')!, state.verbs.verbFor(state.findTarget('exit_a_to_b')!));
  assert.equal(result.changedRoom, false, 'looking at a doorway examines it in place');
  assert.equal(state.roomId, 'harness_a');
  assert.ok(result.say, 'and still produces a line');
});

test('an unhandled verb draws from the target fallback pool, rotating', async () => {
  const state = new GameState(await bundle(), new MemoryStorage());
  state.enterRoom('harness_a');
  const alpha = state.findTarget('hs_alpha')!;

  state.verbs.selectVerb('PULL'); // hs_alpha defines no PULL response
  const first = state.interact(alpha, state.verbs.verbFor(alpha)).say;
  const second = state.interact(alpha, state.verbs.verbFor(alpha)).say;

  assert.ok(first, 'fallback produces a line rather than nothing');
  assert.notEqual(first, second, 'the pool rotates instead of repeating');
});


test('save and load restore where he was standing, not where the door is', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());

  // THE CRITERION IS CLAUDE.md's OWN: save/load restores exact state. The
  // payload had eight fields and not one of them was his position, so loading
  // put him back at the entrance -- measured in play as x700 saved, x960
  // restored.
  state.rememberStanding(700, 830);
  state.save();
  state.rememberStanding(120, 700);

  assert.equal(state.load(), true);
  assert.deepEqual(state.resumeStanding(null), [700, 830]);
});

test('coming back from the map resumes; coming through a door does not', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());

  const map = [...content.rooms.values()].find((room) => room.kind === 'map');
  assert.ok(map, 'the town map is a room, doc 20 rule 5');

  const here = state.roomId;
  state.rememberStanding(691, 839);
  state.enterRoom(map.id);
  state.enterRoom(here);

  // OPENING A MENU IS NOT A MOVE. Doc 20 rule 2 makes the map always
  // reachable, so under the old behaviour checking where you are relocated
  // you: he walked to x691 and came back at x960.
  assert.deepEqual(state.resumeStanding(map.id), [691, 839]);

  // And an arrival is still an arrival. Walking in through an exit resumes
  // nothing, because the entrance is what a door is for.
  const other = [...content.rooms.values()]
    .find((room) => room.id !== here && room.kind !== 'map');
  assert.ok(other);
  assert.equal(state.resumeStanding(other.id), undefined);
});
