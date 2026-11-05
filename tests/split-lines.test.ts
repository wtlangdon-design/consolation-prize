/**
 * DOC 30 §5's SPLIT UTTERANCES REACH THE PLAYER. A response rule's `then`
 * lines are the rest of what he says the first time he looks: the setup, a
 * beat, the punchline. VerbSystem.resolve read "is this the first look" AFTER
 * advancing the line cursor, so it never was, and every split first look in
 * the game -- 139 rules, the hotel register's among them --
 * said its setup and dropped the rest. Found building Room 19, whose Act IV
 * letter arrived as "Dear Mother." alone.
 *
 * Every room's every object, from a fresh state in that room: the first
 * selection of a rule that has `then` delivers it, word for word, and the
 * second does not repeat it.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

test('a split first line is spoken whole, once', async () => {
  const content = await loadContent(fsReader);
  let checked = 0;
  for (const fixture of content.fixtures.values()) {
    const state = new GameState(content, new MemoryStorage());
    if (!state.applyFixture(fixture)) continue;
    for (const target of [...state.targets]) {
      for (const [verb, rules] of Object.entries(target.responses ?? {})) {
        if (verb !== 'LOOK_AT' && verb !== 'LISTEN_TO') continue;
        const rule = rules.find((one) => state.flags.test(one.when) && !one.afterPuzzles && !one.untilPuzzles);
        if (!rule?.then?.length || rule !== rules.find((one) => state.flags.test(one.when))) continue;
        state.holdItem(null);
        const first = state.interact(target, verb);
        assert.equal(first.say, rule.say, `${state.roomId}/${target.id} ${verb}: the setup`);
        assert.deepEqual(first.then, rule.then, `${state.roomId}/${target.id} ${verb}: the rest of it, the first time`);
        const again = state.interact(target, verb);
        assert.ok(!again.then?.length, `${state.roomId}/${target.id} ${verb}: not again`);
        checked += 1;
      }
    }
  }
  assert.ok(checked >= 20, `split first lines checked: ${checked}`);
});
