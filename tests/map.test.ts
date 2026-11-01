/**
 * EVERY PLACE ON THE TOWN MAP THAT CAN BE TRAVELLED TO IS CLICKABLE ON ITS OWN
 * MARKER, in every state a fixture describes.
 *
 * Found building Room 7: at the play area's type scale the undertaker's label
 * ran across the registrar's marker, the first box under a click won, and the
 * registrar -- whose only way in is this map -- could not be reached. The
 * check asserts the rule (engine/render/MapLayout.ts mapPlaceAt) against the
 * real labels, measured in the real face.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import { BitmapFont, GLYPH_SCALE } from '../engine/render/BitmapFont.ts';
import { mapLayout, mapPlaceAt } from '../engine/render/MapLayout.ts';
import { NATIVE_WIDTH } from '../engine/render/Screen.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

test('every place the map can travel to is reached by clicking its own marker, in every fixture\'s state', async () => {
  const content = await loadContent(fsReader);
  const font = new BitmapFont(content.font);
  const mapId = [...content.rooms.values()].find((room) => room.kind === 'map')?.id;
  assert.ok(mapId, 'the manifest has a map');
  const dims = { marker: 3 * GLYPH_SCALE, labelHeight: 11 * GLYPH_SCALE, glyph: GLYPH_SCALE, width: NATIVE_WIDTH };
  let checked = 0;
  for (const fixture of content.fixtures.values()) {
    const state = new GameState(content, new MemoryStorage());
    assert.ok(state.applyFixture(fixture));
    state.enterRoom(mapId);
    const boxes = mapLayout(state.mapLocations, (text) => font.measure(text), dims);
    for (const box of boxes.filter((one) => one.built)) {
      const [x, y] = box.location.at;
      const hit = mapPlaceAt(boxes, x + Math.floor(dims.marker / 2), y);
      assert.equal(hit?.location.id, box.location.id,
        `${fixture.id}: a click on ${box.location.id}'s marker reaches ${hit?.location.id ?? 'nothing'}`);
      checked += 1;
    }
  }
  assert.ok(checked > 0, 'some places were checked');
});
