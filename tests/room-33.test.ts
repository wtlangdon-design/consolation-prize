/**
 * ROOM 33, THE LISTENING CHAMBER, from the room's own fixtures (content/fixtures/room-33.json).
 *
 * Doc 05: "LOOK is deliberately useless. LISTEN is the interface." LOOK is the
 * ladder that empties out (errata 70 F). A LISTEN on the rock is a tap
 * (engine/core/Listening.ts, doc 45 R33-TAP): nearer the void the tail is
 * longer and the ripple lasts exactly as long; on the void its one line, and
 * the score's ninety seconds (errata 71 E). F3 is three swings of the pickaxe,
 * the head flying off twice (doc 54), into Room 34's second state.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { rateForTune, tapAt, tuneAt } from '../engine/core/Listening.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const docs = (await Promise.all(['docs/05-examine-layer.md', 'docs/54-batch-c.md', 'docs/57-puzzle-completion.md', 'docs/49-wrong-answers.md']
  .map((path) => readFile(resolve(ROOT, path), 'utf8')))).join('\n');
const FIXTURE = JSON.parse(await readFile(resolve(ROOT, 'content/fixtures/room-33.json'), 'utf8')) as { fixtures: { id: string; room: string }[] };
const ROOM = FIXTURE.fixtures[0]!.room;
const [SEARCHING, TUNED] = FIXTURE.fixtures.map((one) => one.id) as [string, string];

const inState = async (id: string) => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  assert.ok(state.applyFixture(content.fixtures.get(id)!));
  return state;
};
const rock = (state: GameState) => state.findTarget(state.room.listening!.surface)!;

test('LOOK empties out over eight selections and then says the last line for good', async () => {
  const state = await inState(SEARCHING);
  assert.equal(state.roomId, ROOM);
  const seen = Array.from({ length: 11 }, () => state.interact(rock(state), 'LOOK_AT').say!);
  assert.ok(seen.every((line) => docs.includes(line)));
  assert.equal(new Set(seen.slice(7)).size, 1, 'from the eighth on, one line');
  assert.equal(seen[7], seen[10]);
});

test('a tap nearer the void rings longer, the void answers from the first tap, and nothing names it', async () => {
  const state = await inState(SEARCHING);
  const listening = state.room.listening!;
  const [vx, vy] = listening.void.at;
  const far = tapAt(listening, vx - listening.void.reach - 200, vy);
  const near = tapAt(listening, vx - listening.void.radius - 20, vy);
  const on = tapAt(listening, vx, vy);
  assert.ok(far.tail < near.tail && near.tail < on.tail, 'the tail lengthens toward the void');
  assert.ok(on.void && !near.void && !far.void);
  assert.ok(listening.taps.length >= 12, 'a fine gradient');
  assert.ok(listening.found.say && docs.includes(listening.found.say), 'its one line is written');
  assert.ok(!state.targets.some((one) => /void/i.test(one.id) || /VOID/.test(one.name)), 'no target is the void');
});

test('the ninety seconds tune the score from -35 cents to 0 and no faster', async () => {
  const state = await inState(SEARCHING);
  const listening = state.room.listening!;
  assert.equal(listening.tune.seconds, 90);
  assert.equal(tuneAt(listening, 0), 0);
  assert.equal(tuneAt(listening, 45_000), 0.5);
  assert.equal(tuneAt(listening, 90_000), 1);
  assert.equal(rateForTune(0), 1);
  assert.ok(Math.abs(rateForTune(1) - 2 ** (35 / 1200)) < 1e-9);
  assert.equal(state.content.manifest.music?.tunedFlag, listening.tune.doneFlag);
});

test('F3: before the score is in tune the rock refuses; then three swings, and the third breaks through', async () => {
  const before = await inState(SEARCHING);
  before.holdItem(null);
  before.holdItem('pickaxe');
  const refusal = before.interact(rock(before), 'USE');
  assert.ok(refusal.say && docs.includes(refusal.say));
  assert.ok(!before.flags.test({ T_BROKE_THROUGH: true }));
  const state = await inState(TUNED);
  const swings = [1, 2, 3].map(() => {
    state.enterRoom(ROOM);
    state.holdItem(null);
    state.holdItem('pickaxe');
    return state.interact(rock(state), 'USE');
  });
  for (const swing of swings.slice(0, 2)) {
    assert.ok(swing.say && docs.includes(swing.say), 'the head comes off');
    assert.equal(swing.direction, true, 'performed as a direction');
  }
  assert.ok(state.flags.test({ T_BROKE_THROUGH: true, T_STRIKE_FOUND: true }));
  assert.ok(state.puzzleComplete('F3'));
  assert.ok(state.carried.includes('sample'), 'a piece of the wall');
  assert.equal(swings[2]!.goesTo, 'under_prosperity', 'and once it is read, Room 34 in its second state');
});
