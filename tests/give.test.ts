/**
 * GIVE (errata 282, doc 127; Tyler, 2026-11-11: "Add GIVE as a 10th verb"). A hand-over is GIVE, as Monkey
 * Island's were; USE on a person for one is the item's own wrong answer; GIVE has its own lines where nothing is
 * written. Proved against the defect: on main before this change there is no GIVE verb, and every test here fails.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import type { Interactable } from '../engine/core/types.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const content = await loadContent(fsReader);
const doc = readFileSync(new URL('../docs/127-give.md', import.meta.url), 'utf8');
const rows = [...doc.matchAll(/^\| `([a-z0-9_]+)` \| `([a-z0-9_]+)` \| (GIVE|Either) \|$/gm)].map(([, item, target, verb]) => ({ item: item!, target: target!, verb: verb! }));
const stub = (id: string): Interactable => ({ id, name: id, rect: [0, 0, 1, 1], colour: 0, responses: {} } as unknown as Interactable);

test('GIVE is a verb, carries what it gives, and has a cell and a key of its own', () => {
  const give = content.verbs.verbs.find((one) => one.id === 'GIVE');
  assert.ok(give, 'GIVE is on the panel');
  assert.ok(give.key, 'GIVE has a key');
  assert.ok((content.verbs.carryVerbs ?? []).includes('GIVE'), 'GIVE picks an item up to hand it over');
  const cells = new Set(content.verbs.verbs.map((one) => `${one.col},${one.row}`));
  assert.equal(cells.size, content.verbs.verbs.length, 'no two verbs share a cell');
  assert.match(content.ui.sentence.itemTemplates?.GIVE ?? '', / to \{target\}/, 'the sentence reads GIVE X TO Y');
});

test('every hand-over doc 127 names answers GIVE, and USE only where it says Either', () => {
  assert.ok(rows.length >= 20, 'the table is read');
  for (const row of rows) {
    const pairs = content.combinations.pairs.filter((pair) => pair.item === row.item && pair.target === row.target);
    assert.ok(pairs.length, `${row.item} to ${row.target} is a pair`);
    for (const pair of pairs) {
      assert.ok(pair.verbs?.includes('GIVE'), `${row.item} to ${row.target} answers GIVE`);
      assert.equal(pair.verbs?.includes('USE'), row.verb === 'Either', `${row.item} to ${row.target}: USE only if Either`);
    }
  }
});

test('USE on a person for a hand-over is the item\'s wrong answer; GIVE is the pair', () => {
  const state = new GameState(content, new MemoryStorage());
  // The first GIVE-only hand-over that completes a puzzle, read from the data.
  const pair = content.combinations.pairs.find((one) => one.verbs?.join() === 'GIVE' && (one.completes || one.rules?.some((rule) => rule.completes)))!;
  assert.ok(pair, 'a hand-over that completes something');
  const used = state.verbs.resolveWith('USE', pair.item, stub(pair.target), pair.room, [], true);
  assert.ok(!used.effects.some((effect) => effect.kind === 'puzzleProgress'), 'USE completes nothing');
  assert.ok(used.say && !JSON.stringify(pair).includes(JSON.stringify(used.say)), 'and says nothing the pair says');
});

test('GIVE with nothing written: his lines for a person, and for a thing', () => {
  const state = new GameState(content, new MemoryStorage());
  const pools = content.combinations.givePools!;
  const toPerson = state.verbs.resolveWith('GIVE', 'tuning_fork', stub('pie_woman'), 'main_street', [], true);
  assert.ok(pools.people.includes(toPerson.say!), 'a person declines, in his words');
  const toThing = state.verbs.resolveWith('GIVE', 'tuning_fork', stub('trough'), 'main_street', [], false);
  assert.ok(pools.things.includes(toThing.say!), 'a thing cannot accept');
  assert.ok(content.verbFallbacks.pools.GIVE?.length && content.verbFallbacks.people?.GIVE?.length, 'and with nothing in hand');
});
