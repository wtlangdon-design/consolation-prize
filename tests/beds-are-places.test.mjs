// A ROOM'S BED IS THE PLACE, NOT A THING HAPPENING IN IT (errata 322).
//
// Tyler, 2026-11-14: "There's a weird background sfx in the mercantile that doesn't seem to match anything seen in
// the store." The mercantile's 12-second bed looped the batwings' hinge, up close, three swings every pass, beside
// doors the room draws standing still. A door heard in a bed is somebody else's door, far off in the town (`far(`);
// the room's own door is heard once, when he comes through it (a transit in content/audio/sounds.json).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const SOURCE = readFileSync(new URL('../tools/audio/render-room-beds.py', import.meta.url), 'utf8');

export function doorsUpClose(source) {
  return source.split('\n').map((line, i) => [i + 1, line])
    .filter(([, line]) => /\b(HINGE|LATCH)\b/.test(line) && !/^\s*(HINGE|LATCH)\s*=/.test(line) && !/^\s*#/.test(line))
    .filter(([, line]) => !/\bfar\(/.test(line) && !/"""|^\s+[A-Z].*\./.test(line))
    .map(([n, line]) => `${n}: ${line.trim()}`);
}

test('no bed loops a door up close: a door in a bed is far off in the town', () => {
  assert.deepEqual(doorsUpClose(SOURCE), []);
});

test('the check finds the mercantile\'s hinge as it was', () => {
  assert.equal(doorsUpClose('        bed.at(lowpass(HINGE[k], 2400), at, g)\n').length, 1);
});

test('the mercantile\'s doors are heard as he comes through them', () => {
  const sounds = JSON.parse(readFileSync(new URL('../content/audio/sounds.json', import.meta.url), 'utf8'));
  assert.ok(sounds.transits.some((rule) => rule.between.includes('mercantile') && rule.between.includes('main_street')));
});
