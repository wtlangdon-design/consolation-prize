/**
 * ROOM 36, MAIN STREET AT DAWN, from the room's own fixture (content/fixtures/room-36.json).
 *
 * Doc 48 S7: "Not a cutscene at all ... the player walks the street they know,
 * reads the nine rewritten hotspots at their own pace, and the game ends when
 * they choose the one exit." The coach stop is that exit: Thad's last line,
 * then the Act IV letter over black (errata 99 J).
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
const docs = (await Promise.all(['docs/05-examine-layer.md', 'docs/08-examine-batch-1.md', 'docs/54-batch-c.md', 'docs/49-wrong-answers.md',
  'docs/48-act-turn-beats.md', 'docs/04-dialogue-trees.md'].map((path) => readFile(resolve(ROOT, path), 'utf8')))).join('\n');
const FIXTURE = JSON.parse(await readFile(resolve(ROOT, 'content/fixtures/room-36.json'), 'utf8')) as { fixtures: { id: string; room: string }[] };
const ROOM = FIXTURE.fixtures[0]!.room;

const inState = async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  assert.ok(state.applyFixture(content.fixtures.get(FIXTURE.fixtures[0]!.id)!));
  return state;
};

test('the nine dawn hotspots answer LOOK and LISTEN with lines the documents write', async () => {
  const state = await inState();
  assert.equal(state.roomId, ROOM);
  const hotspots = state.room.hotspots ?? [];
  assert.equal(hotspots.length, 9);
  for (const one of hotspots) {
    for (const verb of ['LOOK_AT', 'LISTEN_TO']) {
      const said = state.interact(one, verb).say;
      assert.ok(said && docs.includes(said), `${one.id} ${verb}: "${said}" is written`);
    }
  }
});

test('the one exit is the close: at the coach stop, the last line, the letter over black, and he stays', async () => {
  const state = await inState();
  assert.equal(state.room.exits.length, 1, 'one exit');
  const stop = state.room.exits[0]!;
  const close = state.interact(stop, 'WALK_TO');
  assert.ok(close.say && docs.includes(close.say), 'his last spoken line');
  const letter = (close.then ?? []).filter((one) => typeof one !== 'string' && one.overBlack);
  assert.equal(letter.length, 4, 'four lines, entirely true');
  assert.ok(state.flags.test({ T_CLOSE_SAID: true }));
  // ERRATA 115 B: doc 48 S7 beat 3 is "at the coach stop" -- the room changes first, and the line
  // is said there once the man on the ladder has nodded (his nod is timed from the arrival).
  assert.equal(close.changedRoom, true, 'he goes to the coach stop');
  assert.equal(close.arrives, true, 'and the beat is played there');
  assert.equal(state.roomId, 'coach_stop_dawn');
  const painter = state.content.ambient.get('sign_painter');
  assert.equal(painter?.room, 'coach_stop_dawn', 'the man on the ladder is at the sign');
  const nod = painter?.sprite?.onArrival;
  assert.ok(nod && close.pause !== undefined && close.pause > nod.at + nod.frames.length * (nod.frameSeconds ?? 0.3),
    'the line waits until the man on the ladder has nodded');
  assert.equal(state.room.exits.length, 0, 'and he stays: the game ends here');
  assert.equal((state.room.hotspots ?? []).length, 0);
  assert.ok(state.room.blackWhen && state.flags.test(state.room.blackWhen), 'a load after the close finds it black');
});
