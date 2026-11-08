/**
 * SCENERY ANSWERS NOTHING (errata 178). Main Street's hitching rail and its
 * horses are drawn and move, but have no lines yet: the brief makes them
 * scenery until their LOOK and LISTEN lines are written. So the pointer passes
 * through them to the mud under them, in the night street and the dawn one,
 * and the hero walks around them, never through.
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

for (const room of ['main_street', 'main_street_dawn']) {
  test(`${room}: the hitching horses are drawn there, and the pointer passes through them`, async () => {
    const content = await loadContent(fsReader);
    const state = new GameState(content, new MemoryStorage());
    state.enterRoom(room);
    const layer = new AmbientLayer(state);
    layer.arrived();
    const horses = layer.present.find((npc) => npc.id === 'hitching_horses');
    assert.ok(horses?.scenery, 'the horses are present, as scenery');
    const at = { x: 2080, y: 800 };
    assert.equal(layer.npcAt(at.x, at.y), undefined, 'no figure answers the pointer over them');
    assert.equal(state.targetAt(at.x, at.y)?.id, 'mud', 'the mud under them does');
  });

  test(`${room}: the hero walks around the hitching rail, never through it`, async () => {
    const content = await loadContent(fsReader);
    const room_ = content.rooms.get(room)!;
    const boxes = new WalkBoxes(room_.walkBoxes!, () => true);
    for (const [x, y] of [[1900, 840], [2080, 830], [2260, 850]] as const) {
      assert.equal(boxes.contains(x, y), false, `${x},${y} under the horses is not ground he can stand on`);
    }
    assert.ok(boxes.contains(2080, 780), 'the ground behind them is');
  });
}
