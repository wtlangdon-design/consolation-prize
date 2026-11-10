import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import { HeadlessPlayer, playThrough } from './lib/headless-player.ts';

// PLAYS: C3

/**
 * HE PULLS HIS OWN NOTICE (doc 118 O-2; errata 249). The printer handed it over at the end of a sentence. Now the
 * printer sets it and stands back, and the sheet comes off the press by the player's own PULL. Held here: nothing said
 * hands it over or completes the puzzle; the press gives nothing until the notice is set; the pull gives one and
 * completes it; and a second is not to be had while he holds the first.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const content = await loadContent(fsReader);
const walkthrough = JSON.parse(await readFile(resolve(ROOT, 'tests/data/full-game-walkthrough.json'), 'utf8')) as { steps: { id: string }[] };
const SET = 'T_NOTICE_SET';
const IN_HAND = 'T_NOTICE_IN_HAND';
const NOTICE = 'funeral_notice';
const PRESS = 'press';

/** In the print shop, the memorial booked, before the notice is asked for. */
function atThePress() {
  const state = new GameState(content, new MemoryStorage());
  const player = new HeadlessPlayer(state);
  const upTo = walkthrough.steps.findIndex((step) => step.id === 'C3.6');
  playThrough(player, walkthrough.steps.slice(0, upTo + 1) as never);
  return { state, player };
}
function askForIt(player: HeadlessPlayer, state: GameState) {
  const printer = state.content.ambient.get(player.present().find((one) => one.tree)!.id)!;
  player.talk(printer.id);
  const offered = state.dialogue.presentOptions().find((one) => one.option.set?.[SET] === true)!;
  player.choose(offered.option.id);
  player.leave();
}

test('nothing the printer says hands over the notice or completes the puzzle', () => {
  for (const tree of content.dialogue.values()) {
    for (const [id, node] of Object.entries(tree.nodes)) {
      for (const option of node.options) {
        assert.ok(!option.gives?.includes(NOTICE), `${id} ${option.id} hands the notice over by being said`);
        assert.equal(option.puzzle?.C3, undefined, `${id} ${option.id} completes it by being said`);
      }
    }
  }
});

test('the press gives nothing until the notice is set', () => {
  const { state, player } = atThePress();
  player.verb(PRESS, 'PULL');
  assert.equal(state.carried.includes(NOTICE), false);
  assert.equal(state.puzzleComplete('C3'), false);
});

test('asked for, it is set and not given; the pull gives one and completes it', () => {
  const { state, player } = atThePress();
  askForIt(player, state);
  assert.equal(state.flags.get(SET), true);
  assert.equal(state.carried.includes(NOTICE), false);
  assert.equal(state.puzzleComplete('C3'), false);
  player.verb(PRESS, 'PULL');
  assert.equal(state.carried.includes(NOTICE), true);
  assert.equal(state.flags.get(IN_HAND), true);
  assert.equal(state.flags.get(SET), false);
  assert.ok(state.puzzleComplete('C3'));
});

test('a second is not to be had while he holds the first', () => {
  const { state, player } = atThePress();
  askForIt(player, state);
  player.verb(PRESS, 'PULL');
  const first = player.verb(PRESS, 'PULL').say;
  const idle = state.room.hotspots.find((one) => one.id === PRESS)!.responses!.PULL!.at(-1)!.say;
  assert.notEqual(first, idle, 'holding one, the press answers as if nothing had been set');
  assert.equal(state.carried.filter((one) => one === NOTICE).length, 1);
  const printer = state.content.ambient.get(player.present().find((one) => one.tree)!.id)!;
  player.talk(printer.id);
  assert.equal(state.dialogue.presentOptions().some((one) => one.option.set?.[SET] === true), false, 'he offers to set another');
});
