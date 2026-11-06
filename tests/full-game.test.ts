/**
 * THE WHOLE GAME, PLAYED CONTINUOUSLY. From a fresh save -- no fixture, no
 * flag written by hand -- to the last letter home, through the real engine,
 * carrying the inventory, flags and acts that play itself produced from room
 * to room. This is the run a playtester makes by hand, done headless.
 *
 * Every other puzzle test starts from a prepared state, which can paper over
 * a gap between two puzzles: the state a fixture declares is not always the
 * state the puzzle before it leaves. tools/check-puzzle-graph.mjs traverses an
 * abstract requires/yields graph and cannot see one either.
 *
 * THE ROUTE IS DATA (tests/data/full-game-walkthrough.json): ids only -- rooms,
 * characters, options, items, hotspots -- in doc 57's order. Each step says
 * what it must have changed, so a break is named at the first step where
 * continuous play stops working.
 *
 * A BREAK IS A FINDING, NOT A FAILURE TO BE HIDDEN. Where play cannot go on,
 * the step may carry a `bypass` -- the smallest write that lets the run reach
 * the next break -- and the bypass is applied only after the step has broken.
 * The breaks found are listed in the data's `knownBreaks`, and this test holds
 * the run to that list exactly: a new break fails it, and so does a break
 * that has been fixed (take it out of the list, and out of the bypass). Every
 * known break is printed on every run.
 *
 * The player is tests/lib/headless-player.ts: GameState, plus a mirror of the
 * few things GameScene does with content when a click lands (arrival lines and
 * scenes, accosts, timelines, the listening room, travel after a scene).
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
// @ts-expect-error -- a plain .mjs module with no declarations; the canonical 45 (errata ruling 5).
import { CANONICAL_PUZZLE_IDS } from '../tools/check-puzzle-graph.mjs';
import { HeadlessPlayer, playThrough, type Break, type Step } from './lib/headless-player.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

interface KnownBreak {
  step: string;
  puzzle: string;
  room: string;
  cause: 'content gap' | 'engine gap' | 'staging';
  finding: string;
}
interface Walkthrough {
  steps: Step[];
  knownBreaks: KnownBreak[];
  /** Canonical puzzles nothing records as complete, though their yields arrive. */
  neverRecorded: { puzzle: string; finding: string }[];
  /** The state the last step must leave: the final letter home has been read. */
  ending: { flags: Record<string, boolean | number>; puzzle: string };
}

const walkthrough = JSON.parse(await readFile(resolve(ROOT, 'tests/data/full-game-walkthrough.json'), 'utf8')) as Walkthrough;
const content = await loadContent(fsReader);
const storage = new MemoryStorage();
const state = new GameState(content, storage);
const player = new HeadlessPlayer(state);
const breaks: Break[] = playThrough(player, walkthrough.steps);

const describe = (one: Break) => `${one.step} [${one.puzzle ?? '-'}] in ${one.room}: ${one.problem}`
  + (one.bypassed ? ` -- BYPASSED: ${one.bypassed}` : '');

test('the walkthrough is the whole game: every canonical puzzle is a step, and the run starts from nothing', () => {
  const covered = new Set(walkthrough.steps.map((step) => step.puzzle).filter(Boolean));
  assert.deepEqual((CANONICAL_PUZZLE_IDS as string[]).filter((id) => !covered.has(id)), [], 'puzzles no step plays');
  assert.equal(walkthrough.steps[0]?.do, 'opening', 'the run begins with the opening, in the start room');
  const ids = walkthrough.steps.map((step) => step.id);
  assert.equal(new Set(ids).size, ids.length, 'step ids are unique');
  for (const known of walkthrough.knownBreaks) assert.ok(ids.includes(known.step), `known break ${known.step} names a step`);
  // A bypass is a finding's way past, and only a known break may carry one.
  for (const step of walkthrough.steps.filter((one) => one.bypass)) {
    assert.ok(walkthrough.knownBreaks.some((known) => known.step === step.id), `${step.id} carries a bypass and is not a known break`);
  }
});

test('continuous play from a fresh save breaks exactly where the known findings say, and nowhere else', (t) => {
  for (const one of breaks) {
    const known = walkthrough.knownBreaks.find((each) => each.step === one.step);
    t.diagnostic(`BREAK ${one.step} [${one.puzzle ?? '-'}] in ${one.room}: ${one.problem}`);
    if (one.bypassed) t.diagnostic(`  bypassed: ${one.bypassed}`);
    t.diagnostic(known ? `  finding (${known.cause}): ${known.finding}` : '  NOT A KNOWN FINDING');
  }
  const found = breaks.map((one) => one.step);
  const expected = walkthrough.knownBreaks.map((one) => one.step);
  const fresh = breaks.filter((one) => !expected.includes(one.step));
  const fixed = expected.filter((id) => !found.includes(id));
  assert.deepEqual(fresh, [], `NEW BREAKS in continuous play -- the first one is where play now stops:\n  ${fresh.map(describe).join('\n  ')}`);
  assert.deepEqual(fixed, [], 'known breaks that no longer break: take them out of knownBreaks, and their bypasses out of the steps');
});

test('the run reaches the ending: the filing is done and the last letter home is read', () => {
  assert.ok(state.puzzleComplete(walkthrough.ending.puzzle), `${walkthrough.ending.puzzle} complete`);
  for (const [flag, value] of Object.entries(walkthrough.ending.flags)) {
    assert.equal(state.flags.get(flag), value, `${flag} at the end`);
  }
});

test('every canonical puzzle is recorded complete by the end, except the ones nothing records', (t) => {
  const missing = (CANONICAL_PUZZLE_IDS as string[]).filter((id) => !state.puzzleComplete(id));
  for (const one of walkthrough.neverRecorded) t.diagnostic(`NEVER RECORDED ${one.puzzle}: ${one.finding}`);
  assert.deepEqual(missing, walkthrough.neverRecorded.map((one) => one.puzzle));
});

test('the state the whole run produced survives a save and a load', () => {
  state.save(1);
  const loaded = new GameState(content, storage);
  assert.ok(loaded.load(1));
  assert.equal(loaded.roomId, state.roomId);
  assert.deepEqual([...loaded.carried].sort(), [...state.carried].sort());
  assert.deepEqual(loaded.puzzleProgress(), state.puzzleProgress());
  assert.deepEqual(loaded.flags.snapshot(), state.flags.snapshot());
});
