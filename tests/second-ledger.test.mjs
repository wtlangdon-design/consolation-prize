import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { readPng } from '../tools/lib/png.mjs';

/**
 * THE SECOND LEDGER LIES ON HER COUNTER ONCE SHE HAS PRODUCED IT (errata 181, wired by errata 269).
 *
 * Tyler, 2026-11-08: "After Winnie takes it from under the floorboard, the ledger lies on her counter for the rest of
 * the game." The picture was drawn that day and never shown: the scene set T_SECOND_LEDGER and the room looked exactly
 * as before. Found on 2026-11-10 going through what the play-through left open.
 */
const root = new URL('..', import.meta.url);
const read = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));

test('once she is back behind her counter, the book is on it, and there is a book in the picture', () => {
  const room = read('content/rooms/assay-office.json');
  const prop = (room.props ?? []).find((one) => one.id === 'second_ledger');
  assert.ok(prop, 'Room 5 never shows the second ledger on the counter');
  // Errata 270: in her hands at the loose board until Thad leaves; on the counter from his next coming in.
  assert.deepEqual(prop.when, { T_LEDGER_ON_COUNTER: true });
  assert.ok(room.onEnter.setWhen.some((rule) => rule.when.T_SECOND_LEDGER === true && rule.set.T_LEDGER_ON_COUNTER === true),
    'nothing puts the ledger on the counter: coming back into the office does not write T_LEDGER_ON_COUNTER');
  const image = readPng(readFileSync(new URL(prop.sheet, root)));
  const [x, y, w, h] = prop.frame;
  let drawn = 0;
  for (let row = y; row < y + h; row += 1) for (let col = x; col < x + w; col += 1) if (image.pixels[(row * image.width + col) * 4 + 3] > 0) drawn += 1;
  assert.ok(drawn > 300, `the prop's frame holds ${drawn} drawn pixels: the frame misses the book`);
  // On the counter top, left of her (she stands at x 970 and on), and behind anyone on the floor.
  assert.ok(prop.x < 960 && prop.y < 450, 'the book is not on the counter top to her left');
});

test('the scene that produces it sets the flag the picture waits on', () => {
  assert.ok(JSON.stringify(read('content/dialogue/winnie.json')).includes('"T_SECOND_LEDGER":true'), 'nothing in her tree sets T_SECOND_LEDGER');
});
