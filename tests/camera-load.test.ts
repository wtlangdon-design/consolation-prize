/**
 * A LOAD PUTS THE VIEW ON HIM, as walking in through a door does.
 *
 * `arrive` centres the camera on the entrance and hands it to the player on
 * every entry; a load (and a playtest fixture, which is a load) set the room
 * and left the camera at 0, following nobody. In a room wider than the window
 * he stood off the frame and the view never caught him up -- found building
 * Room 36, whose fixture starts at the east edge of a 3700-pixel street.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { cameraAt, roomWidth } from '../engine/core/Camera.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

test('every fixture in a room wider than the window opens with the view on him, following him', async () => {
  const content = await loadContent(fsReader);
  let wide = 0;
  for (const fixture of content.fixtures.values()) {
    const room = content.rooms.get(fixture.room);
    if (!room || roomWidth(room.size) <= roomWidth(undefined)) continue;
    wide += 1;
    const state = new GameState(content, new MemoryStorage());
    assert.ok(state.applyFixture(fixture));
    const at = room.entrances?.find((one) => one.from === 'default')?.at?.[0] ?? (room as { entrance?: [number, number] }).entrance?.[0] ?? roomWidth(room.size) / 2;
    assert.equal(state.cameraX, cameraAt(at, roomWidth(room.size)), `${fixture.id}: the view starts where he stands`);
    assert.equal(state.cameraFollowing, content.actor.id, `${fixture.id}: and follows him`);
  }
  assert.ok(wide > 0, 'at least one fixture is in a wide room');
});
