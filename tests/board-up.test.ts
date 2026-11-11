import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { AmbientLayer } from '../engine/core/Ambient.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

/**
 * WHILE THE LOOSE BOARD LIES LIFTED HE WALKS ROUND IT (errata 271).
 *
 * Tyler, 2026-11-10: "Can you keep Thad from walking over the hole or board once it's up?" Errata 270 lifted the
 * board for as long as she is out at it with the second ledger, and left the floor under it floor: he walked across
 * the plank standing on end and the hollow where it had lain.
 *
 * And the fault under that one: a room's floor was read once, on coming in. A floor that changes while he stands
 * in the room did not change until he left and came back.
 */
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const inOffice = async () => {
  const state = new GameState(await loadContent(fsReader), new MemoryStorage());
  const fixture = state.content.fixtures.get('r5-c');
  assert.ok(fixture, 'fixture r5-c');
  assert.ok(state.applyFixture({ ...fixture, flags: { ...fixture.flags, T_SECOND_LEDGER: false, T_LEDGER_ON_COUNTER: false } }));
  assert.equal(state.roomId, 'assay_office');
  return state;
};
// The middle of the plank, and the floor in front of it.
const ON_BOARD = [600, 765] as const;
const IN_FRONT = [600, 815] as const;

test('the board is floor until it is lifted, not floor while it is up, and floor again when she is back', async () => {
  const state = await inOffice();
  assert.ok(state.boxes!.boxAt(...ON_BOARD), 'before the ledger the board is walked on (it creaks)');
  // In the room, in front of him: the floor changes without his leaving.
  state.flags.set('T_SECOND_LEDGER', true);
  assert.equal(state.boxes!.boxAt(...ON_BOARD), undefined, 'he can stand on the lifted board');
  assert.ok(state.boxes!.boxAt(...IN_FRONT), 'there is no way past in front of it');
  state.flags.set('T_LEDGER_ON_COUNTER', true);
  assert.ok(state.boxes!.boxAt(...ON_BOARD), 'the board is down and still not floor');
});

test('he crosses the room round it: no point of the way is on the board', async () => {
  const state = await inOffice();
  state.flags.set('T_SECOND_LEDGER', true);
  const [x0, y0, x1, y1] = [300, 765, 1000, 765];
  const route = state.routeTo(x0, y0, x1, y1);
  assert.ok(route, 'the two sides of the room are not joined while the board is up');
  const points = [{ x: x0, y: y0 }, ...route.waypoints];
  const obstacle = [452, 700, 306, 96];
  for (let leg = 1; leg < points.length; leg += 1) {
    for (let t = 0; t <= 1; t += 0.02) {
      const x = points[leg - 1]!.x + (points[leg]!.x - points[leg - 1]!.x) * t;
      const y = points[leg - 1]!.y + (points[leg]!.y - points[leg - 1]!.y) * t;
      assert.ok(!(x > obstacle[0]! + 1 && x < obstacle[0]! + obstacle[2]! - 1 && y > obstacle[1]! + 1 && y < obstacle[1]! + obstacle[3]! - 1),
        `his way crosses the lifted board at ${Math.round(x)},${Math.round(y)}`);
    }
  }
});

test('where anyone stands while it is up is still floor', async () => {
  const state = await inOffice();
  state.flags.set('T_SECOND_LEDGER', true);
  const winnie = state.content.ambient.get('winnie_at_board')!;
  assert.ok(state.boxes!.boxAt(winnie.x, winnie.y), 'she kneels where there is no floor');
  assert.ok(state.boxes!.boxAt(winnie.walkTo!.x, winnie.walkTo!.y), 'he cannot stand where he talks to her');
  const board = state.room.hotspots.find((one) => one.id === 'floorboard')!;
  assert.ok(state.boxes!.boxAt(board.walkTo!.x, board.walkTo!.y), 'he cannot stand where he looks at the board');
});

test('called by her direction she is in the room and her counter figure is not; uncalled, the reverse', async () => {
  const state = await inOffice();
  const ambient = new AmbientLayer(state);
  ambient.arrived();
  assert.deepEqual(ambient.present.map((npc) => npc.id), ['winnie']);
  assert.deepEqual(ambient.wings.map((npc) => npc.id), ['winnie_at_board']);
  ambient.noteDepartures(0);
  assert.ok(ambient.summon('winnie_at_board'));
  assert.ok(!ambient.present.some((npc) => npc.id === 'winnie'), 'her counter figure stays behind while she walks out');
  assert.ok(ambient.noteDepartures(1), 'she does not begin to walk');
});
