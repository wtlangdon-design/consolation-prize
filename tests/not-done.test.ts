import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import { HeadlessPlayer, playThrough } from './lib/headless-player.ts';

// PLAYS: C4, D4, E3

/**
 * THE NOT-DONE LIST (doc 121; errata 250). Held here, each against the defect it would otherwise let back in:
 *  - the burglary cannot be walked out of with the drawer open, and CLOSE is what lets him go;
 *  - the letter of introduction is not parted with while the church still wants it, nor without the nail;
 *  - each new object is taken once, and none of them is needed for anything;
 *  - a paper that is done with is not in his pockets in the last act.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const content = await loadContent(fsReader);
const walkthrough = JSON.parse(await readFile(resolve(ROOT, 'tests/data/full-game-walkthrough.json'), 'utf8')) as
  { steps: { id: string; do: string; verb?: string; item?: string; on?: string; note?: string }[] };
const NEW = ['nail', 'oats', 'parsley', 'capital_b', 'pikes_collar', 'button', 'room_key'];
const OPEN = 'T_DRAWER_OPEN';

/** The props the room draws in this state, by id (errata 254). */
const drawn = (state: GameState) => (state.room.props ?? []).filter((prop) => state.flags.test(prop.when)).map((prop) => prop.id);

function playedTo(id: string, steps = walkthrough.steps) {
  const state = new GameState(content, new MemoryStorage());
  const player = new HeadlessPlayer(state);
  playThrough(player, steps.slice(0, steps.findIndex((step) => step.id === id) + 1) as never);
  return { state, player };
}

test('the photograph taken, the door will not have the drawer open; shut, it does', () => {
  const { state, player } = playedTo('C4.3');
  assert.equal(state.flags.get(OPEN), true);
  // The plate draws the drawer open; the patch that draws it shut is off while it is open (errata 254).
  assert.ok(!drawn(state).includes('drawer_shut'), 'the drawer is open and is drawn shut');
  const room = state.room.id;
  const door = state.room.exits.find((exit) => exit.transitScene?.some((rule) => rule.stays))!;
  player.verb(door.id, 'WALK_TO');
  assert.equal(state.room.id, room, 'he walked out on an open drawer');
  player.verb('stock_portrait_drawer', 'CLOSE');
  assert.equal(state.flags.get(OPEN), false);
  assert.ok(drawn(state).includes('drawer_shut'), 'the drawer is shut and is still drawn open');
  player.verb(door.id, 'WALK_TO');
  assert.notEqual(state.room.id, room, 'the drawer is shut and the door still holds him');
});

test('the letter stays in his pocket until the church has had it and he has a nail', () => {
  // With the nail and before the memorial is booked: held out, as before, and kept.
  const early = playedTo('A5.2e');
  early.player.go('boot_hill');
  early.player.use('letter', 'pike_s_marker');
  assert.ok(early.state.carried.includes('letter') && early.state.carried.includes('nail'));
  // The memorial booked and no nail: kept.
  const without = playedTo('D4.1c', walkthrough.steps.filter((step) => step.id !== 'A5.2e'));
  without.player.use('letter', 'pike_s_marker');
  assert.ok(without.state.carried.includes('letter'), 'delivered with nothing to fix it by');
  // Both: delivered, and both gone.
  const { state, player } = playedTo('D4.1c');
  assert.ok(!drawn(state).includes('pike_s_envelope'), 'the envelope is on the board before he has put it there');
  player.use('letter', 'pike_s_marker');
  assert.ok(!state.carried.includes('letter') && !state.carried.includes('nail'));
  // And it is seen there (errata 254), behind the Colonel's wreath where both are drawn.
  assert.ok(drawn(state).includes('pike_s_envelope'), 'the letter is delivered and the board is bare');
  const order = (state.room.props ?? []).map((prop) => prop.id);
  assert.ok(order.indexOf('pike_s_envelope') < order.indexOf('colonel_s_wreath'), 'the envelope is drawn over the wreath');
});

test('every new object has its own picture in the panel (errata 254)', async () => {
  const icons = JSON.parse(await readFile(resolve(ROOT, 'content/ui/item-icons.json'), 'utf8')).icons;
  for (const id of NEW) {
    assert.ok(icons[id], `${id} has no cell in the icon sheet`);
    assert.equal((content.items.get(id) as { iconPending?: string }).iconPending, undefined, `${id} has a picture and is still marked as waiting for one`);
  }
});

test('each new object is taken by hand, once', () => {
  const taken = new Map<string, number>();
  for (const room of content.rooms.values()) {
    for (const spot of room.hotspots) {
      for (const rules of Object.values(spot.responses ?? {})) {
        for (const rule of rules) for (const id of rule.grants ?? []) {
          if (!NEW.includes(id)) continue;
          taken.set(id, (taken.get(id) ?? 0) + 1);
          assert.ok(Object.values((rule.when ?? {}) as Record<string, unknown>).includes(false), `${id}: nothing stops it being taken twice`);
        }
      }
    }
  }
  for (const id of NEW) assert.ok(taken.get(id), `${id}: no room gives it up to his hand`);
});

test('none of the new objects is needed: the game is won without touching one', () => {
  const mine = (step: { note?: string }) => /Errata 250/.test(step.note ?? '');
  const without = walkthrough.steps.filter((step) => !mine(step) || step.id === 'C4.3c');
  assert.ok(without.length < walkthrough.steps.length - 10, 'the route does not play doc 121');
  const { state } = playedTo('END.1', without);
  for (const id of NEW) assert.ok(!state.carried.includes(id));
});

test('in the last act the papers that are done with are packed, and the ones the filing wants are not', () => {
  const { state } = playedTo('F5.1');
  for (const id of ['executor_form', 'photograph', 'third_copy']) assert.ok(!state.carried.includes(id), `${id} is still in his pocket`);
  for (const id of ['deed', 'document_c', 'death_certificate', 'company_map']) assert.ok(state.carried.includes(id), `${id} was packed`);
  const before = playedTo('E9.3');
  for (const id of ['executor_form', 'photograph', 'third_copy']) assert.ok(before.state.carried.includes(id), `${id} went before the act did`);
});
