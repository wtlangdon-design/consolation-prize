/**
 * A GAME SAVED BEFORE FIDDLER'S GULCH CAN STILL BE FINISHED (errata 218).
 *
 * Errata 213 changed B1 (Frame's story now pays with THE CLARION, which G3 gives the lookout) and B3 (the ride now
 * ends at the washout; `T_VESSEL_FOUND` is G9's) under saves at SAVE_VERSION 2, with no migration. Two windows of
 * those saves could not be finished:
 *   (a) after B1 and before B3: the old B1 gave no Clarion, Frame's options are spent, and G3 can never be solved;
 *   (b) after the old B3 and before B4: Room 4's VES_B1 no longer offers B4 or B5 and the livery refuses B3 again,
 *       so B6 is unreachable.
 *
 * Each window's save is made the way the old build made it -- the continuous playthrough's own state at that point,
 * with what the old build did instead (tests/data/full-game-walkthrough.json's route, ids only) -- written at version
 * 2, loaded, and played on to the last letter home by the headless player. The same save stamped with the current
 * version is NOT migrated, and play on from it breaks: that is the defect, and it is what proves the migration is
 * the reason the game can be finished. A save the new design made is loaded exactly as it was written.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage, SAVE_KEY, SAVE_VERSION, type SaveFile } from '../engine/core/SaveManager.ts';
import { HeadlessPlayer, playThrough, type Step } from './lib/headless-player.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const walkthrough = JSON.parse(await readFile(resolve(ROOT, 'tests/data/full-game-walkthrough.json'), 'utf8')) as {
  steps: Step[]; ending: { flags: Record<string, boolean | number>; puzzle: string };
};
const content = await loadContent(fsReader);
const migration = content.saveMigrations.find((one) => one.from === 2)!;
const rule = (id: string) => migration.rules.find((one) => one.id === id)!;
const B1_RULE = rule('old-b1-without-g3-paper');
const B3_RULE = rule('old-b3-ride-before-the-trip');
const at = (id: string) => {
  const index = walkthrough.steps.findIndex((step) => step.id === id);
  assert.ok(index >= 0, `the walkthrough has a step ${id}`);
  return index;
};
/** The first step of a puzzle on the route, and the step after its last. */
const firstOf = (puzzle: string) => walkthrough.steps.find((step) => step.puzzle === puzzle)!.id;
const afterLastOf = (puzzle: string) => {
  const last = walkthrough.steps.map((step) => step.puzzle).lastIndexOf(puzzle);
  return walkthrough.steps[last + 1]!.id;
};

// ONE CONTINUOUS RUN, saved at the points the windows open and once the trip is over.
const storage = new MemoryStorage();
const live = new GameState(content, storage);
const player = new HeadlessPlayer(live);
const snapshots = new Map<string, SaveFile>();
let played = 0;
const playUntil = (stepId: string) => {
  const until = at(stepId);
  const breaks = playThrough(player, walkthrough.steps.slice(played, until));
  assert.deepEqual(breaks, [], `the route plays cleanly up to ${stepId}`);
  played = until;
  live.save();
  snapshots.set(stepId, JSON.parse(storage.getItem(SAVE_KEY)!) as SaveFile);
};
// (a) opens once B1 is done: the step after B1's last.
const afterB1 = walkthrough.steps[at(firstOf('B2'))]!.id;
playUntil(afterB1);
// (b): the old B3 was played at the livery once B2 was done; the route's next step after B2.
const afterB2 = afterLastOf('B2');
playUntil(afterB2);
// A save the new design made after the whole trip (G9's ride home done).
const afterTrip = afterLastOf('G9');
playUntil(afterTrip);

/** The paper G3 takes from him, read from G3's own hand-over, not named here. */
const G3_PAPER = content.combinations.pairs.find((one) => one.puzzle === 'G3')!.item;
/** The items the old build never gave: B1's paper (G3's), and A9's third copy, which nothing needs (errata 213). */
const NEVER_GIVEN_BEFORE = [G3_PAPER, 'third_copy'];

/** The old build's save at (a): B1 done as it was, so without the Clarion. */
function oldAfterB1(): SaveFile {
  const save = structuredClone(snapshots.get(afterB1)!);
  save.inventory = save.inventory.filter((item) => !NEVER_GIVEN_BEFORE.includes(item));
  return { ...save, version: 2 };
}

/**
 * The old build's save at (b): B2 done, B1 without the Clarion, and the old B3 played (doc 57's ride, before errata
 * 213): the fork on Grievance wrote T_VESSEL_FOUND, completed B3 and put Thad in the Nugget, where Vessel's Room 4
 * greeting (VES_B1's openingOnce) was heard.
 */
function oldAfterB3(): SaveFile {
  const save = structuredClone(snapshots.get(afterB2)!);
  save.inventory = save.inventory.filter((item) => !NEVER_GIVEN_BEFORE.includes(item));
  save.flags = { ...save.flags, T_VESSEL_FOUND: true, T_VESSEL_GREETED: true };
  save.puzzles = { ...save.puzzles, B3: 'complete' };
  // The ride ended by entering the room G9's ride home ends in now; the old build entered it, and saved there.
  const store = new MemoryStorage();
  store.setItem(SAVE_KEY, JSON.stringify(save));
  const old = new GameState(content, store);
  assert.ok(old.load());
  old.enterRoom(walkthrough.steps[at(afterTrip) - 1]!.expect!.room!);
  return { ...JSON.parse(store.getItem(SAVE_KEY)!) as SaveFile, version: 2 };
}

/** What a loaded state writes back when it is saved: the save as the game now holds it. */
function resaved(state: GameState): SaveFile {
  state.save(2);
  return state.saves.readSlot(2)!;
}

function loaded(save: SaveFile): GameState {
  const store = new MemoryStorage();
  store.setItem(SAVE_KEY, JSON.stringify(save));
  const state = new GameState(content, store);
  assert.ok(state.load(), 'the save loads');
  return state;
}

function playOn(state: GameState, from: string) {
  return playThrough(new HeadlessPlayer(state), walkthrough.steps.slice(at(from)));
}

function finished(state: GameState) {
  assert.ok(state.puzzleComplete(walkthrough.ending.puzzle), `${walkthrough.ending.puzzle} complete`);
  for (const [flag, value] of Object.entries(walkthrough.ending.flags)) assert.equal(state.flags.get(flag), value, `${flag} at the end`);
}

test('the save version is past 2, and a version 2 save loads', () => {
  assert.ok(SAVE_VERSION > 2);
  assert.ok(migration, 'content/save-migrations.json brings version 2 forward');
  assert.ok(loaded(oldAfterB1()));
});

test('(a) saved after the old B1, before B3: migrated, it is given the paper G3 takes and plays on to the end', () => {
  const state = loaded(oldAfterB1());
  assert.deepEqual(B1_RULE.gives, [G3_PAPER], 'the migration gives the paper G3 takes');
  assert.ok(state.carried.includes(G3_PAPER), 'the paper, as B1 now gives it');
  const breaks = playOn(state, afterB1);
  assert.deepEqual(breaks.map((one) => `${one.step}: ${one.problem}`), [], 'no break from the old save to the last letter home');
  finished(state);
});

test('(a) the same save, not migrated, cannot finish the trip', () => {
  const state = loaded({ ...oldAfterB1(), version: SAVE_VERSION });
  assert.ok(!state.carried.includes(G3_PAPER), 'a save at the current version is not touched');
  const breaks = playOn(state, afterB1);
  assert.ok(breaks.length > 0, 'without the migration, play breaks');
  assert.equal(breaks[0]!.puzzle, 'G3', `the first break is G3, whose paper the old B1 never gave (${breaks[0]!.step})`);
});

test('(b) saved after the old B3, before B4: migrated, B3 is owed again, and the ride goes to the washout and on to the end', () => {
  const old = oldAfterB3();
  const state = loaded(old);
  for (const [flag, value] of Object.entries(B3_RULE.set ?? {})) assert.equal(state.flags.get(flag), value, `${flag} put back`);
  for (const puzzle of B3_RULE.withdraws ?? []) assert.ok(!state.puzzleComplete(puzzle), `${puzzle} is owed again`);
  assert.ok(state.carried.includes(G3_PAPER), 'and the paper, so G3 can be solved on the trip');
  assert.equal(state.roomId, old.room, 'he is where he saved');
  const breaks = playOn(state, afterB2);
  assert.deepEqual(breaks.map((one) => `${one.step}: ${one.problem}`), [], 'no break from the old save to the last letter home');
  finished(state);
});

test('(b) the same save, not migrated, never reaches B6', () => {
  const state = loaded({ ...oldAfterB3(), version: SAVE_VERSION });
  const breaks = playOn(state, afterB2);
  assert.ok(breaks.length > 0, 'without the migration, play breaks');
  assert.equal(breaks[0]!.puzzle, 'B3', `the first break is B3, the ride the livery now refuses (${breaks[0]!.step})`);
  assert.ok(!state.puzzleComplete('B6'), 'and B6 is never reached');
});

test('a save the new design made is loaded exactly as written, at either version', () => {
  for (const point of [afterB1, afterB2, afterTrip]) {
    const made = snapshots.get(point)!;
    for (const version of [2, SAVE_VERSION]) {
      const state = loaded({ ...made, version });
      const back = resaved(state);
      assert.deepEqual([...back.inventory].sort(), [...made.inventory].sort(), `${point} v${version}: inventory`);
      assert.deepEqual(back.puzzles, made.puzzles, `${point} v${version}: puzzles`);
      assert.deepEqual(back.flags, made.flags, `${point} v${version}: flags`);
      assert.equal(state.roomId, made.room);
    }
  }
});
