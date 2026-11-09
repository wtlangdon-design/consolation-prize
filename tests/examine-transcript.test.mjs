/**
 * THE EXAMINE TRANSCRIPT'S PROBE CHANGES NOTHING (errata 227).
 *
 * tools/examine-transcript.mjs asks, on every arrival in the walkthrough, what
 * LOOK AT and LISTEN TO would say to everything in the room. Resolving a verb
 * advances the verb system's line cursors, so a probe that kept them would
 * spend the establishing lines and the run's own later LOOKs would get repeat
 * variants. These hold it to leaving the state exactly as it found it.
 *
 * Plain ESM, as the tool is.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import { HeadlessPlayer, playThrough } from './lib/headless-player.ts';
import { examineRun, probeRoom, stateSnapshot } from '../tools/examine-transcript.mjs';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const reader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const walkthrough = await reader('tests/data/full-game-walkthrough.json');
const content = await loadContent(reader);

/** A player some way into the walkthrough, standing in a room with things in it. */
function playerAt(count) {
  const player = new HeadlessPlayer(new GameState(content, new MemoryStorage()));
  playThrough(player, walkthrough.steps.slice(0, count));
  return player;
}

test('a probe leaves the state snapshot exactly as it was', () => {
  for (const count of [1, 5, 20, 60]) {
    const player = playerAt(count);
    const before = stateSnapshot(player);
    const entries = probeRoom(player);
    assert.equal(stateSnapshot(player), before, `the probe changed the state after ${count} step(s), in ${player.state.roomId}`);
    if (!player.state.isMap) assert.ok(entries.some((one) => one.LOOK_AT.length), `the probe found lines in ${player.state.roomId}`);
  }
});

test('a probe answers the same twice, and a real LOOK afterwards gets the line the probe showed', () => {
  const player = playerAt(5);
  const first = probeRoom(player);
  assert.deepEqual(probeRoom(player), first, 'a second probe saw a cursor the first one moved');
  const entry = first.find((one) => one.LOOK_AT.length && player.state.findTarget(one.id));
  assert.ok(entry, 'a hotspot with a LOOK line');
  const result = player.state.interact(player.state.findTarget(entry.id), 'LOOK_AT');
  assert.equal(result.say, entry.LOOK_AT[0].line);
});

test('the snapshot sees what a probe must not do: a real LOOK moves it', () => {
  const player = playerAt(5);
  const before = stateSnapshot(player);
  const target = player.state.targets.find((one) => one.responses?.LOOK_AT?.length);
  assert.ok(target);
  player.state.interact(target, 'LOOK_AT');
  assert.notEqual(stateSnapshot(player), before);
});

test('the probed run plays the walkthrough as the plain run does: it breaks only where the walkthrough knows', async () => {
  const { arrivals, breaks, knownBreaks } = await examineRun();
  assert.deepEqual(breaks.map((one) => one.step), knownBreaks);
  assert.ok(arrivals.length > 0);
});
