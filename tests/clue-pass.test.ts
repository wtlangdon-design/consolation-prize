/**
 * THE CLUE PASS IS WIRED, AND NO POOL MISSTATES WHAT IS HELD (errata 127;
 * doc 94). Every line doc 94 writes reaches the game behind its gate, and the
 * filing fee -- two dollars -- no longer answers with FOUR DOLLARS' pool
 * ("I have four dollars"), which doc 24 had headed as one.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const read = (path: string) => readFileSync(resolve(ROOT, path), 'utf8');

test('every line doc 94 writes is in a room, behind a gate', () => {
  const doc = read('docs/94-clue-pass.md');
  const lines = [...doc.matchAll(/^\*\*[A-Z' -]+\*\* · [A-Z ]+ — (.+)$/gm)]
    .flatMap((m) => [...m[1]!.matchAll(/"([^"]+)"/g)].map((q) => q[1]!));
  assert.ok(lines.length >= 6, `doc 94 has ${lines.length} lines`);
  const rooms = readdirSync(resolve(ROOT, 'content/rooms')).filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(read(`content/rooms/${name}`)));
  for (const line of lines) {
    const found = rooms.flatMap((room) => room.hotspots ?? []).flatMap((h: { responses?: Record<string, { when?: object; say?: string; repeat?: string[] }[]> }) => Object.values(h.responses ?? {}).flat())
      .find((rule) => rule.say === line || (rule.repeat ?? []).includes(line));
    assert.ok(found, `"${line.slice(0, 40)}" is wired`);
    assert.ok(found.when && Object.keys(found.when).length, `"${line.slice(0, 40)}" waits on its state`);
  }
});

test('the filing fee\'s pool does not say it is four dollars', () => {
  const pools = JSON.parse(read('content/combinations.json')).itemPools;
  assert.ok(pools.filing_fee?.length, 'the filing fee has a pool');
  assert.ok(!pools.filing_fee.some((line: string) => /four dollars/i.test(line)), 'two dollars is not four');
});
