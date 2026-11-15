/**
 * HE STANDS BESIDE WHAT HE LOOKS AT (errata 330; engine/core/LookAside.ts).
 *
 * Tyler, 2026-11-15, with a screenshot of Thad in front of the spittoon: "The game player needs to be able to see the
 * thing that Thad is looking at and describing. This goes for all other objects/things he looks at as well. Unless
 * there's a very specific reason he needs to be standing directly in front of it." And of the handbill: "Thad gets
 * waayyyy too close to read it." And of the mirror: "Thad doesn't stand in a location where he could actually see
 * his reflection when he talks about seeing his reflection."
 *
 * Held here: the rule finds a stand in the way; for every hotspot in the game whose own stand would hide it, there is
 * floor beside it from which it is not hidden, so the scene can always move him there; and a thing he must stand in
 * front of says why, and from its stand he does not hide it either (the mirror: he faces it, his head below it).
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { besides, hidden, inTheWay } from '../engine/core/LookAside.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const content = await loadContent(fsReader);
const ROOM_3 = String(JSON.parse(await readFile(resolve(ROOT, 'reference/room-03/annotation.json'), 'utf8')).room);

test('a man standing on the spittoon is in its way; beside it, he is not', () => {
  const spittoon = [1364, 740, 90, 78] as const;
  const onIt = { x: 1409, y: 830 };
  assert.ok(inTheWay(onIt, 440, spittoon), `in front, he hides ${(hidden(onIt, 440, spittoon) * 100).toFixed(0)}%`);
  for (const spot of besides(onIt, 440, spittoon, { x: 1600, y: 830 })) assert.ok(!inTheWay(spot, 440, spittoon));
});

test('a thing much wider than he is (the bar) is not one he can hide', () => {
  assert.equal(inTheWay({ x: 1500, y: 830 }, 440, [1180, 300, 720, 520]), false);
});

test('every hotspot whose stand would hide it has floor beside it, so he can always be moved clear', () => {
  const stuck: string[] = [];
  let hiding = 0;
  for (const [id, room] of content.rooms) {
    if ((room as { fixture?: boolean }).fixture) continue;
    const state = new GameState(content, new MemoryStorage());
    try { state.enterRoom(id); } catch { continue; }
    for (const spot of room.hotspots) {
      if (!spot.walkTo || spot.inFrontWhy) continue;
      const height = state.actorHeightAt(spot.walkTo.x, spot.walkTo.y);
      if (!height || !inTheWay(spot.walkTo, height, spot.rect)) continue;
      hiding += 1;
      const clear = besides(spot.walkTo, height, spot.rect, spot.walkTo).some((want) => {
        const floor = state.nearestFloor(want.x, want.y);
        return floor && !inTheWay(floor, state.actorHeightAt(floor.x, floor.y) ?? height, spot.rect);
      });
      if (!clear) stuck.push(`${id}/${spot.id}`);
    }
  }
  assert.ok(hiding > 0, 'the check found stands that hide their thing, which is what it is for');
  assert.deepEqual(stuck, [], 'give these a stand beside them, or an inFront reason');
});

test('a thing he must stand in front of says why, and from there he still does not hide it (the mirror)', () => {
  const room = content.rooms.get(ROOM_3)!;
  const mirror = room.hotspots.find((one) => one.id === 'mirror')!;
  assert.ok(mirror.inFrontWhy && /reflection/.test(mirror.inFrontWhy), 'the reason is written');
  assert.equal(mirror.walkTo?.facing, 'back', 'he faces the mirror');
  const state = new GameState(content, new MemoryStorage());
  state.enterRoom(ROOM_3);
  const height = state.actorHeightAt(mirror.walkTo!.x, mirror.walkTo!.y)!;
  assert.ok(hidden(mirror.walkTo!, height, mirror.rect) < 0.05, 'his head stops below the glass');
});

test('the handbill is read rule by rule, and read again on every look', () => {
  const room = content.rooms.get(ROOM_3)!;
  const handbill = room.hotspots.find((one) => one.id === 'handbill')!;
  const state = new GameState(content, new MemoryStorage());
  state.enterRoom(ROOM_3);
  const reads = [0, 1, 2].map(() => state.interact(handbill, 'LOOK_AT'));
  for (const read of reads) {
    assert.equal(read.say, 'RULES OF THE ASSAY.');
    assert.ok((read.then ?? []).filter((line) => /^(One|Two|Three|Four|Five):/.test(String(line))).length === 5, 'all five rules, each its own screen');
  }
  assert.ok((reads[1]!.then ?? []).length === 7, 'and from the second look, one of his comments after them');
});
