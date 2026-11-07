/**
 * THE CUT-AWAYS (errata 158; doc 96). Monkey Island's LeChuck scenes: the
 * screen leaves the hero, shows somewhere else, and comes back exactly where
 * it was. Tyler, 2026-11-07: "You decide, and I want them included now so
 * that they're part of my play through."
 *
 * What can be held without a browser: the three are extracted with their
 * rooms, flags and speakers; nobody in one is anyone who could give the game
 * away; the claim jumper's scene names no money; and a visit changes nothing in the
 * story -- no flag, no standing place, and a save taken during one lands in
 * the room the hero is really in.
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

test('three cut-aways, each with a room, a once-only flag, and lines spoken by people who are there', async () => {
  const content = await loadContent(fsReader);
  assert.equal(content.cutaways.length, 3, 'doc 96 has three');
  const flags = new Set(content.flags.flags.map((flag) => flag.id));
  for (const cut of content.cutaways) {
    assert.ok(content.rooms.has(cut.room), `${cut.id}: ${cut.room}`);
    assert.ok(flags.has(cut.done), `${cut.id}: its done flag ${cut.done} is declared`);
    const declared = content.flags.flags.find((flag) => flag.id === cut.done)!;
    assert.deepEqual(declared.writtenBy, [`cutaway:${cut.id}`]);
    for (const id of Object.keys(cut.when)) assert.ok(flags.has(id), `${cut.id}: reads ${id}`);
    assert.ok(cut.lines.length >= 3);
    // Whoever speaks is a figure in that room, or the one voice nobody sees.
    for (const { speaker } of cut.lines) {
      if (speaker === 'cutaway_voice') continue;
      const here = [...content.ambient.values()].some((npc) => npc.id === speaker && npc.room === cut.room);
      assert.ok(here, `${cut.id}: ${speaker} is a figure in ${cut.room}`);
    }
  }
});

test('no cut-away holds the reveal or the answer', async () => {
  const content = await loadContent(fsReader);
  for (const cut of content.cutaways) {
    // The watchman's identity is the game's best reveal (doc 01): he is in none.
    assert.ok(!cut.lines.some((line) => line.speaker === 'hob'), `${cut.id}: not the watchman`);
    assert.notEqual(cut.room, 'watchmans_shack', `${cut.id}: not the watchman's shack`);
  }
  // D5 is solved by working out how the claim jumper is paid: his scene names no money.
  const jumper = content.cutaways[1]!;
  for (const { line } of jumper.lines) {
    assert.ok(!/[\d$]|dollar|fee|paid|pay|money|week/i.test(line), `no money in the claim jumper's scene: "${line}"`);
  }
  // The Colonel only once the Act II turn has landed (doc 01's rule for him).
  const colonel = content.cutaways[2]!;
  assert.deepEqual(colonel.when.ACT, { atLeast: 3, atMost: 3 });
});

test('a visit is not an arrival: it changes nothing, and a save in one lands where he really is', async () => {
  const content = await loadContent(fsReader);
  const storage = new MemoryStorage();
  const state = new GameState(content, storage);
  state.enterRoom('main_street');
  state.rememberStanding(1234, 760);
  const flagsBefore = JSON.stringify(state.flags.snapshot());
  const elsewhere = content.cutaways[2]!.room;
  state.cutTo(elsewhere);
  assert.equal(state.roomId, elsewhere);
  assert.equal(state.inCutaway, true);
  state.rememberStanding(10, 10);
  state.save(0);
  state.cutBack();
  assert.equal(state.roomId, 'main_street');
  assert.equal(state.inCutaway, false);
  assert.equal(JSON.stringify(state.flags.snapshot()), flagsBefore, 'no onEnter write, nothing at all');
  const again = new GameState(content, storage);
  assert.ok(again.load(0));
  assert.equal(again.roomId, 'main_street', 'the save is where he was, not where the camera went');
  assert.deepEqual(again.resumeStanding(null) ?? again['standing']?.get?.('main_street'), [1234, 760]);
});
