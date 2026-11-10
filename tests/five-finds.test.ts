import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

/**
 * FIVE MORE THINGS TO FIND (doc 123; errata 258. Tyler, 2026-11-10: "P6 - yes").
 *
 * Each is a verb a room never answered, on a thing that was always there: said once, then said differently. The rule
 * that makes them safe is that they are worth nothing: no item, no puzzle, no flag anything else reads, and nothing a
 * LISTEN says. This holds each of those, so that a sixth cannot be added as a clue by accident.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const content = await loadContent(fsReader);
const FINDS = [
  { room: 'main_street', target: 'dog', verb: 'PICK_UP', flag: 'T_DOG_SCRATCHED' },
  { room: 'barbers', target: 'chair', verb: 'PULL', flag: 'T_CHAIR_TRIED' },
  { room: 'undertaker', target: 'measuring_wall', verb: 'USE', flag: 'T_WALL_MEASURED' },
  { room: 'pratts_claim', target: 'coffee_pot', verb: 'OPEN', flag: 'T_COFFEE_SMELLED' },
  { room: 'company_vault', target: 'champagne', verb: 'PICK_UP', flag: 'T_CHAMPAGNE_TURNED' },
];
const GRAPH = (JSON.parse(await readFile(resolve(ROOT, 'content/puzzles/puzzle-graph.json'), 'utf8')) as { puzzles: { id: string }[] })
  .puzzles.map((puzzle) => puzzle.id);
const doc = await readFile(resolve(ROOT, 'docs/123-five-more-things-to-find.md'), 'utf8');

for (const find of FINDS) {
  test(`${find.room}/${find.target}: ${find.verb} is answered once, then differently, in doc 123's words`, () => {
    const rules = content.rooms.get(find.room)!.hotspots.find((spot) => spot.id === find.target)!.responses![find.verb]!;
    assert.equal(rules.length, 2, 'a first time and an again');
    const [first, again] = rules;
    assert.deepEqual(first!.when, { [find.flag]: false });
    assert.deepEqual(first!.set, { [find.flag]: true });
    assert.deepEqual(again!.when, { [find.flag]: true });
    for (const rule of rules) {
      assert.ok(doc.includes(`"${rule.say}"`), `"${rule.say}" is not doc 123's line`);
      assert.equal(rule.grants, undefined, 'a find gives nothing');
      assert.equal(rule.completes, undefined, 'a find completes nothing');
      assert.equal(rule.dialogue, undefined, 'a find opens no conversation');
      assert.equal(rule.direction, undefined, 'a find is said, not staged: it asks no pose of anybody');
    }
    assert.notEqual(first!.say, again!.say);
  });
}

test('nothing else in the game reads a find: no rule, exit, figure, item, tree or puzzle waits on one', async () => {
  const flags = FINDS.map((find) => find.flag);
  const manifest = JSON.parse(await readFile(resolve(ROOT, 'content/manifest.json'), 'utf8')) as Record<string, unknown>;
  const paths = new Set<string>();
  const collect = (value: unknown): void => {
    if (typeof value === 'string' && value.startsWith('content/') && value.endsWith('.json')) paths.add(value);
    else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === 'object') Object.values(value).forEach(collect);
  };
  collect(manifest);
  for (const path of paths) {
    const text = await readFile(resolve(ROOT, path), 'utf8');
    for (const find of FINDS) {
      const uses = text.split(`"${find.flag}"`).length - 1;
      if (path === 'content/flags/flags.json') { assert.equal(uses, 1, `${find.flag} is declared once`); continue; }
      const own = [...content.rooms.values()].find((room) => room.id === find.room)!;
      const ownPath = [...paths].find((each) => each.startsWith('content/rooms/') && JSON.parse(text).id === own.id && each === path);
      // In its own room: the first line's `when` and `set`, and the second line's `when`. Anywhere else: nothing.
      assert.equal(uses, ownPath ? 3 : 0, `${find.flag} is read or written ${uses} time(s) in ${path}`);
    }
  }
  assert.equal(new Set(flags).size, 5);
});

test('a find is not a way of hearing anything: none is on LISTEN TO, and none is in the sounds', async () => {
  const sounds = await readFile(resolve(ROOT, 'content/audio/sounds.json'), 'utf8');
  for (const find of FINDS) {
    assert.notEqual(find.verb, 'LISTEN_TO');
    const spot = content.rooms.get(find.room)!.hotspots.find((each) => each.id === find.target)!;
    for (const rule of spot.responses![find.verb]!) assert.ok(!sounds.includes(JSON.stringify(rule.say)), 'a find has a sound of its own');
  }
});

test('played: each is found once and the second time says the other line; no puzzle moves', () => {
  for (const find of FINDS) {
    const state = new GameState(content, new MemoryStorage());
    state.enterRoom(find.room);
    assert.equal(state.room.id, find.room);
    const done = () => GRAPH.filter((id) => state.puzzleComplete(id)).length;
    const before = done();
    const carried = [...state.carried];
    const spot = state.findTarget(find.target)!;
    assert.ok(spot, `${find.target} is not in ${find.room}`);
    const first = state.interact(spot, find.verb);
    const again = state.interact(spot, find.verb);
    assert.ok(first.say && again.say && first.say !== again.say);
    assert.equal(state.flags.get(find.flag), true);
    assert.equal(done(), before, 'a find completed a puzzle');
    assert.deepEqual([...state.carried], carried, 'a find put something in his pockets');
    assert.equal(state.room.id, find.room, 'a find took him somewhere');
  }
});
