import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

/**
 * ROOM 5's ENGINE ADDITIONS, asserted against the shipped content.
 *
 * Doc 04 gives every principal a root per act; `entries` is how a tree opens
 * on the right one. Asserted with Winnie's real tree so the test reads the
 * same data the game does.
 */

test('WINNIE opens on WIN_A1 with nothing set, and on WIN_B1 after T_BORDERS_MOTT', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  state.dialogue.start('WINNIE');
  assert.equal(state.dialogue.activeTreeId, 'WINNIE');
  assert.ok((state.dialogue.currentNode?.prompt?.length ?? 0) > 0, 'the Act I root has its opening line');
  const first = state.dialogue.presentOptions().map((entry) => entry.option.id);
  assert.ok(first.includes('winnie1'), 'Act I root offers the assay request');
  state.dialogue.end();

  state.flags.set('T_BORDERS_MOTT', true);
  state.dialogue.start('WINNIE');
  const second = state.dialogue.presentOptions().map((entry) => entry.option.text);
  assert.ok(second.some((text) => /certified assay/.test(text)), 'Act II root offers the certified assay');
  state.dialogue.end();
});

test('WIN_A1 gates "I tune pianos" on T_TUNES_PIANOS -- the negative side and the positive side', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  state.dialogue.start('WINNIE');
  assert.ok(!state.dialogue.presentOptions().some((entry) => entry.option.id === 'winnie3'), 'absent before the flag');
  state.dialogue.end();
  state.flags.set('T_TUNES_PIANOS', true);
  state.dialogue.start('WINNIE');
  assert.ok(state.dialogue.presentOptions().some((entry) => entry.option.id === 'winnie3'), 'present after it');
  state.dialogue.end();
});

test('the queue bench exists at ACT 2 and not at ACT 1', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  state.enterRoom?.('assay_office');
  const room = content.rooms.get('assay_office')!;
  const bench = room.hotspots.find((hotspot) => hotspot.id === 'queue_bench')!;
  assert.deepEqual(bench.when, { ACT: { atLeast: 2, atMost: 4 } });
  assert.equal(state.flags.test(bench.when), false, 'ACT starts at 1');
  state.flags.set('ACT', 2);
  assert.equal(state.flags.test(bench.when), true);
  state.flags.set('ACT', 5);
  assert.equal(state.flags.test(bench.when), false, 'and it is gone again past act 4');
});
