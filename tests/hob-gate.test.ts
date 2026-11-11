/**
 * ROOM 1'S FIRST GATE (the bookends audit, finding 4).
 *
 * At control Hob stands in front of the only exit, and the only way to speak
 * to him was a 60x73 lamp: his body was not a target, so LOOK and TALK TO on
 * him did nothing at all -- the written TALK TO override never played -- and
 * a click on the gap behind him walked Thad into him and left them standing
 * on each other.
 *
 * Now the lamp declares who carries it (`heldBy`), a click on that figure is a
 * click on the lamp, and a walk is never ended inside a standing figure.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { clearOfFigures } from '../engine/core/Standing.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

const HOB = { x: 600, y: 720, height: 230 };

test('a walk that would end on a standing figure ends beside him, on the side it came from', () => {
  // Thad at the coach, clicking the gap in the fence: the floor under it is Hob's.
  const from = { x: 1420, y: 830 };
  const to = clearOfFigures({ x: 575, y: 710 }, from, [HOB], 240);
  assert.ok(to.x - HOB.x >= 0.4 * HOB.height, `to the right of him, clear: ${to.x}`);
  assert.equal(to.y, 710);
  const fromLeft = clearOfFigures({ x: 610, y: 725 }, { x: 300, y: 760 }, [HOB], 240);
  assert.ok(HOB.x - fromLeft.x >= 0.4 * HOB.height, `to the left of him when coming from the left: ${fromLeft.x}`);
});

test('a walk clear of every figure is left alone, and so is one at another depth', () => {
  assert.deepEqual(clearOfFigures({ x: 1000, y: 760 }, { x: 1420, y: 830 }, [HOB], 240), { x: 1000, y: 760 });
  assert.deepEqual(clearOfFigures({ x: 600, y: 850 }, { x: 1420, y: 830 }, [HOB], 240), { x: 600, y: 850 });
});

test("the watchman's lamp says who carries it, and that figure answers TALK TO through it", async () => {
  const content = await loadContent(fsReader);
  const room = content.rooms.get('stage_road')!;
  const lamp = room.hotspots.find((spot) => spot.id === 'lamp')!;
  assert.equal(lamp.heldBy, 'hob', 'a click on Hob is a click on his lamp');
  // Errata 283: TALK TO speaks to him -- it begins beat 9 -- rather than playing doc 17's line for before beat 8,
  // when the player has no control. Under the first Monkey Island's click, TALK TO is how anyone is spoken to.
  assert.equal(lamp.overrides?.TALK_TO, undefined, 'no line in front of the exchange');
  for (const verb of ['LOOK_AT', 'LISTEN_TO', 'TALK_TO']) {
    assert.ok(lamp.responses?.[verb]?.every((rule) => rule.set?.T_HOB_SPOKEN === true), `${verb} still speaks to him`);
  }
});
