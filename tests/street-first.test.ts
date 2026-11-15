/**
 * THE STREET BEFORE THE DOORS, AND HER BACK DOOR (errata 317; doc 133).
 *
 * Tyler, 2026-11-14: "Thad shouldnt be able to go into any of the buildings on Main Street until he's talked to all
 * three characters on the street". And of the assay office's back room: "should Winnie allow me to walk back into the
 * records room with her standing there? Especially when it's the first time I've met her?"
 *
 * Held here: on the first day, before the swindle, every door on Main Street refuses him and he stays put, while each
 * of the street's three questions is still unasked; once all three are asked, every door opens. The ways on to the
 * other streets are never refused. Each of the three flags is written by its own question, so the gate can always be
 * opened (invariant 6: no dead end). And the records room's door refuses him, in Winnie's voice, until she has shown
 * him the second ledger.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import type { Exit } from '../engine/core/types.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const content = await loadContent(fsReader);

const THREE = ['T_MOTT_TOLD', 'T_TOLD_MONEY', 'T_TOLD_WHY'];
const street = content.rooms.get('main_street')!;
const doors = street.exits.filter((exit) => exit.transitScene?.some((rule) => rule.when && 'T_TOLD_WHY' in rule.when));
const ways = street.exits.filter((exit) => !doors.includes(exit));

function onStreet(flags: Record<string, boolean>): GameState {
  const state = new GameState(content, new MemoryStorage());
  // Arrived by the road, as every player has (T_THAD_LEAVING is written when he leaves the stage road).
  for (const [flag, value] of Object.entries({ T_THAD_LEAVING: true, ...flags })) state.flags.set(flag, value);
  state.enterRoom('main_street');
  return state;
}

test('the street has its six doors and its ways on', () => {
  assert.equal(doors.length, 6, doors.map((one) => one.id).join(', '));
  assert.ok(ways.length >= 2, 'Lower Street and the lane');
});

test('with any of the three unasked, every door refuses him and he stays on the street', () => {
  for (const missing of THREE) {
    const flags = Object.fromEntries(THREE.map((flag) => [flag, flag !== missing]));
    for (const door of doors) {
      const state = onStreet(flags);
      const result = state.interact(state.targets.find((one) => one.id === door.id)!, 'WALK_TO');
      assert.equal(result.goesTo, undefined, `${door.id} with ${missing} unasked: no travel`);
      assert.ok(result.say, `${door.id}: he says why`);
    }
  }
});

test('with all three asked, every door opens; the ways on are never refused', () => {
  const asked = Object.fromEntries(THREE.map((flag) => [flag, true]));
  for (const door of doors) {
    const state = onStreet(asked);
    const result = state.interact(state.targets.find((one) => one.id === door.id)!, 'WALK_TO');
    assert.ok(result.changedRoom || result.goesTo, `${door.id} opens`);
  }
  for (const way of ways as Exit[]) {
    const state = onStreet({});
    const result = state.interact(state.targets.find((one) => one.id === way.id)!, 'WALK_TO');
    assert.ok(result.changedRoom || result.goesTo, `${way.id} is a street, not a door`);
  }
});

test('each of the three is written by a question on the street, so the doors can always be opened', () => {
  const written = new Set<string>();
  for (const tree of content.dialogue.values()) {
    for (const node of Object.values(tree.nodes)) {
      for (const option of node.options) for (const flag of Object.keys(option.set ?? {})) written.add(flag);
    }
  }
  for (const flag of THREE) assert.ok(written.has(flag), `${flag} is set by an option`);
});

test('her back door refuses him in her voice until the second ledger, and then opens', () => {
  const office = content.rooms.get('assay_office')!;
  const door = office.exits.find((exit) => exit.to === 'assay_records')!;
  for (const [ledger, opens] of [[false, false], [true, true]] as const) {
    const state = new GameState(content, new MemoryStorage());
    state.flags.set('T_SECOND_LEDGER', ledger);
    state.enterRoom('assay_office');
    const result = state.interact(state.targets.find((one) => one.id === door.id)!, 'WALK_TO');
    if (opens) assert.ok(result.changedRoom || result.goesTo, 'after the ledger, it opens');
    else {
      assert.equal(result.goesTo, undefined, 'before the ledger, no travel');
      assert.ok(result.say && result.by, 'and she says why');
    }
  }
});
