/**
 * SCENERY ANSWERS NOTHING (errata 186). Main Street's hitching rail and its
 * horses are drawn and move, but have no lines yet: the brief makes them
 * scenery until their LOOK and LISTEN lines are written. So the pointer passes
 * through them to the mud under them, and the hero walks around them, never
 * through. At dawn the horses are gone and the rail stands empty, a prop, and
 * he still walks around it (Tyler: "Just the hitching post is there").
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { AmbientLayer } from '../engine/core/Ambient.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import { WalkBoxes } from '../engine/core/WalkBoxes.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

test('main_street_dawn: the horses are gone, and the rail stands empty', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  state.enterRoom('main_street_dawn');
  const layer = new AmbientLayer(state);
  layer.arrived();
  assert.equal(layer.present.find((npc) => npc.id === 'hitching_horses'), undefined, 'no horses at dawn');
  const rail = (state.room.props ?? []).find((prop) => prop.id === 'hitching_rail');
  assert.ok(rail, 'the rail is a prop at dawn');
  assert.deepEqual([rail.x, rail.y], [content.ambient.get('hitching_horses')!.x, content.ambient.get('hitching_horses')!.y],
    'where the night rail stands');
});

for (const room of ['main_street']) {
  test(`${room}: the hitching horses are drawn there, and the pointer passes through them`, async () => {
    const content = await loadContent(fsReader);
    const state = new GameState(content, new MemoryStorage());
    state.enterRoom(room);
    const layer = new AmbientLayer(state);
    layer.arrived();
    const horses = layer.present.find((npc) => npc.id === 'hitching_horses');
    assert.ok(horses?.scenery, 'the horses are present, as scenery');
    const at = { x: 1545, y: 800 };
    assert.equal(layer.npcAt(at.x, at.y), undefined, 'no figure answers the pointer over them');
    assert.equal(state.targetAt(at.x, at.y)?.id, 'mud', 'the mud under them does');
  });

}

for (const room of ['main_street', 'main_street_dawn']) {
  test(`${room}: the hero walks around the hitching rail, never through it`, async () => {
    const content = await loadContent(fsReader);
    const room_ = content.rooms.get(room)!;
    const boxes = new WalkBoxes(room_.walkBoxes!, () => true);
    for (const [x, y] of [[1360, 840], [1545, 830], [1715, 850]] as const) {
      assert.equal(boxes.contains(x, y), false, `${x},${y} under the horses is not ground he can stand on`);
    }
    assert.ok(boxes.contains(1545, 780), 'the ground behind them is');
  });
}
