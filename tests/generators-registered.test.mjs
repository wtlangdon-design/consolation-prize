// Every compiled room is a registered generator (errata 290).
//
// Only Rooms 2, 3 and 5 were registered, so a line rewritten in the documents
// for any other compiled room never reached its room file and nothing said
// so: Rooms 9, 10 and 18 went stale in Thad's voice pass, and Room 23 had been
// stale since GIVE was added. check-generated runs only what is registered, so
// a room with an annotation and no registry entry is a room whose writing can
// silently stop reaching the game. This holds the registry to the annotations.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';

const { GENERATORS } = await import('../tools/lib/generators.mjs');

test('every room with an annotation is compiled by a registered generator', () => {
  const registered = new Set(GENERATORS
    .filter((g) => g.command[1] === 'tools/compile-room.mjs')
    .map((g) => Number(g.command[2])));
  const annotated = readdirSync('reference')
    .map((name) => name.match(/^room-(\d\d)$/))
    .filter((m) => m && existsSync(`reference/${m[0]}/annotation.json`))
    .map((m) => Number(m[1]));
  assert.ok(annotated.length > 40, `found ${annotated.length} annotated rooms`);
  const missing = annotated.filter((n) => !registered.has(n));
  assert.deepEqual(missing, [], `rooms compiled from an annotation but not registered in tools/lib/generators.mjs: ${missing.join(', ')}`);
});

test('the examine layer the rooms compile from is registered too', () => {
  assert.ok(GENERATORS.some((g) => g.command[1] === 'tools/extract-examine.mjs'),
    'tools/extract-examine.mjs is not a registered generator, so content/examine can go stale unseen');
});
