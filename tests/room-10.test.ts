/**
 * ROOM 10, THE IMPROVEMENT COMPANY LOBBY: its act-4 state and its clerk,
 * played through the game state from the room's own fixtures
 * (content/fixtures/room-10.json).
 *
 * No puzzle is sited here (doc 02). What the room must do is hold its one
 * visual change -- the prospectus rack empty in Act IV, a prop over the plate,
 * beside doc 05 Part Two-B's act-4 lines -- and keep its clerk at his desk in
 * every act. Every line asserted here is read from the compiled content,
 * never typed into this file.
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

const inState = async (fixtureId: string) => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  const fixture = content.fixtures.get(fixtureId);
  assert.ok(fixture, `fixture ${fixtureId} exists`);
  assert.ok(state.applyFixture(fixture));
  return state;
};
const shownProps = (state: GameState) => (state.room.props ?? []).filter((prop) => state.flags.test(prop.when));
const rack = (state: GameState) => {
  const found = state.findTarget('prospectus_rack');
  assert.ok(found, 'the prospectus rack is a hotspot');
  return found;
};
const actRule = (state: GameState) => {
  const rule = rack(state).responses?.LOOK_AT?.find((one) => one.when && 'ACT' in one.when);
  assert.ok(rule, 'the rack has an act-gated LOOK');
  return rule;
};

test('Act IV: the rack is drawn empty, over the rack, and its LOOK is the act-4 line', async () => {
  const state = await inState('r10-b');
  const props = shownProps(state);
  assert.equal(props.length, 1, 'one prop shows in Act IV');
  const [prop] = props;
  assert.ok(prop);
  const [x, y, w, h] = rack(state).rect;
  const left = prop.x - Math.floor(prop.frame[2] / 2);
  const top = prop.y - prop.frame[3] + 1;
  assert.ok(left >= x && left + prop.frame[2] <= x + w, 'the empty rack lies inside the rack hotspot across');
  assert.ok(top >= y && top + prop.frame[3] <= y + h, 'and down');
  assert.equal(state.interact(rack(state), 'LOOK_AT').say, actRule(state).say);
});

test('Act I: the rack is full -- no prop -- and its LOOK is the ordinary one', async () => {
  const state = await inState('r10-a');
  assert.equal(shownProps(state).length, 0);
  assert.notEqual(state.interact(rack(state), 'LOOK_AT').say, actRule(state).say);
});

test('the clerk stands at the desk in every act, behind it, and has no tree', async () => {
  for (const id of ['r10-a', 'r10-b']) {
    const state = await inState(id);
    const here = [...state.content.ambient.values()].filter((one) => one.room === state.roomId);
    assert.equal(here.length, 1, `${id}: one figure in the lobby`);
    const [clerk] = here;
    assert.ok(clerk);
    assert.equal(clerk.posture, 'behind-counter');
    assert.equal(clerk.tree, undefined, 'no document gives him a tree');
    const desk = state.findTarget('reception_desk');
    assert.ok(desk);
    assert.ok(clerk.x > desk.rect[0] && clerk.x < desk.rect[0] + desk.rect[2], 'he stands over the desk');
    assert.ok(clerk.y <= desk.rect[1] + 2, 'cut at the desk top, which hides him below it');
  }
});
