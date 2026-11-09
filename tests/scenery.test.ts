/**
 * SCENERY ANSWERS NOTHING (errata 187). Main Street's hitching rail and its
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

import { AmbientLayer, drawnBelowFeet } from '../engine/core/Ambient.ts';
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
  // The night group stands on its hooves (sprite.footRow, errata 201) and its frame reaches below them to the
  // foot of the hay: the prop's base line is that foot, drawn at the rail's own height.
  const horses = content.ambient.get('hitching_horses')!;
  const below = drawnBelowFeet(horses.sprite!.frames[0]![3], rail.frame[3], horses.sprite!.footRow);
  assert.deepEqual([rail.x, rail.y], [horses.x, horses.y + below], 'where the night rail stands');
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
    // Over the group's middle, a fifth of a man above its feet: horse or rail, never bare sky.
    const at = { x: horses!.x, y: horses!.y - 40 };
    assert.equal(layer.npcAt(at.x, at.y), undefined, 'no figure answers the pointer over them');
    assert.equal(state.targetAt(at.x, at.y)?.id, 'mud', 'the mud under them does');
  });

}

for (const room of ['main_street', 'main_street_dawn']) {
  test(`${room}: the hero walks around the hitching rail, never through it`, async () => {
    const content = await loadContent(fsReader);
    const room_ = content.rooms.get(room)!;
    const boxes = new WalkBoxes(room_.walkBoxes!, () => true);
    // Read from where the horses stand (errata 198 moved them), not restated: their feet, both ends of the
    // group's footprint, and the ground a man's half-height behind them.
    const { x: hx, y: hy } = content.ambient.get('hitching_horses')!;
    for (const [x, y] of [[hx - 165, hy - 10], [hx, hy - 20], [hx + 140, hy]] as const) {
      assert.equal(boxes.contains(x, y), false, `${x},${y} under the horses is not ground he can stand on`);
    }
    assert.ok(boxes.contains(hx, hy - 80), 'the ground behind them is');
  });
}
