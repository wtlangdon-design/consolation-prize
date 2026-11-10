import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { planCut, planNear, planRoom } from '../engine/core/BootAssets.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';

/**
 * A CUT-AWAY KEEPS THE ROOM IT LEFT (errata 242). The whole game played in the real build (2026-11-09) drew two props
 * a moment late, both straight after a cut-away (doc 112 section 1). The scene loads by room and lets go of what is not near; on a cut it asked only for the room
 * cut to, so the room he was standing in was let go and fetched again on the way back, against the black's limit.
 *
 * The scene is a Phaser scene and does not run under node, so this holds the list it loads from (`planCut`) and reads
 * GameScene for the wiring.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const content = await loadContent(fsReader);
const scene = await readFile(resolve(ROOT, 'engine/scenes/GameScene.ts'), 'utf8');

test('while cut away, every picture of the room he stands in stays on the list, from any room in the game', () => {
  let checked = 0;
  let wouldHaveGone = 0;
  for (const cut of content.cutaways) {
    for (const home of content.rooms.keys()) {
      if (home === cut.room) continue;
      const kept = new Set(planCut(content, cut.room, home).map((asset) => asset.key));
      const before = new Set(planNear(content, cut.room).map((asset) => asset.key));
      for (const asset of planRoom(content, home)) {
        assert.ok(kept.has(asset.key), `${cut.id} from ${home}: ${asset.key} is let go while the game is cut away`);
        if (!before.has(asset.key)) wouldHaveGone += 1;
        checked += 1;
      }
    }
  }
  assert.ok(checked > 0, 'there are cut-aways and rooms to check');
  // The defect itself: without the home room, the old list drops pictures the room he stands in needs.
  assert.ok(wouldHaveGone > 0, 'the list for the room cut to, alone, lets go of the room he stands in');
});

test('not cut away, the list is the room and its neighbours, exactly as before', () => {
  for (const room of content.rooms.keys()) {
    assert.deepEqual(planCut(content, room, null).map((asset) => asset.key), planNear(content, room).map((asset) => asset.key));
  }
});

test('the scene loads from that list, and fetches a cut-away\'s room under the fade out', () => {
  const start = scene.indexOf('private loadNear(');
  const loadNear = scene.slice(start, scene.indexOf('\n  update(): void {', start));
  assert.match(loadNear, /planCut\(this\.state\.content, this\.state\.roomId, this\.state\.cutawayHome, heading\)/);
  const tick = scene.slice(scene.indexOf('private tickCutaway('));
  const due = tick.slice(0, tick.indexOf("phase: 'out', at: now }"));
  assert.match(due, /planRoom\(this\.state\.content, due\.room\)/, 'the room cut to is asked for as the cut-away starts');
});
