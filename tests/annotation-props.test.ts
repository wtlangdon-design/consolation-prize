/**
 * A PROP MOVED IN A ROOM FILE IS MOVED WHERE THE ROOM IS COMPILED FROM (errata 192).
 *
 * Room files are compiled from their annotation (`tools/compile-room.mjs NN --write`). A prop placed by hand in the
 * room file alone is put back at its old place by the next compile, silently: Room 23's stake was, every time.
 * So every prop an annotation places stands where its compiled room has it.
 */
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const json = async (path: string) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

interface Placed { id: string; x?: number; y?: number }

test('every prop an annotation places stands where its compiled room has it', async () => {
  const dirs = (await readdir(resolve(ROOT, 'reference'))).filter((one) => /^room-\d+$/.test(one));
  let seen = 0;
  for (const dir of dirs) {
    const path = `reference/${dir}/annotation.json`;
    if (!existsSync(resolve(ROOT, path))) continue;
    const ann = await json(path);
    const roomPath = `content/rooms/${ann.room}.json`;
    if (!ann.room || !existsSync(resolve(ROOT, roomPath))) continue;
    const room = await json(roomPath);
    const built = new Map(((room.props ?? []) as Placed[]).map((one) => [one.id, one]));
    for (const prop of (ann.props ?? []) as Placed[]) {
      const there = built.get(prop.id);
      if (!there) continue;
      seen += 1;
      assert.deepEqual([prop.x, prop.y], [there.x, there.y],
        `${path} places ${prop.id} at ${prop.x},${prop.y}; ${roomPath} has it at ${there.x},${there.y}. Move it in the annotation, then compile.`);
    }
  }
  assert.ok(seen > 0, 'some props are compared');
});
