import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

// PLAYS: A3, A8

/**
 * ROOM 3'S TWO PUZZLES, PLAYED. Tyler, 2026-11-01: "What else needs to be done
 * in this room?" Played through, neither paid off: agreeing to Vessel's deal
 * moved nothing, and the piano said its line and paid nothing. Doc 57's A3
 * and A8 are what these hold.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

/**
 * The room is found from the data, not named: the one whose character's tree
 * sets T_SWINDLED, which is also where the piano pair with cases lives.
 */
const roomThree = (content: Awaited<ReturnType<typeof loadContent>>) => {
  const swindler = [...content.ambient.values()].find((npc) => npc.tree
    && content.dialogue.get(npc.tree)?.nodes.root?.options.some((option) => option.set?.T_SWINDLED));
  assert.ok(swindler, 'some character sells the deed');
  return swindler.room;
};
/** Act I, case lifted, standing in Room 3. w1-piano is such a save. */
const inRoomThree = async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  assert.ok(state.applyFixture(content.fixtures.get('w1-piano')!));
  state.enterRoom(roomThree(content));
  return state;
};
const vesselId = (state: GameState) => {
  const npc = [...state.content.ambient.values()].find((one) => one.room === state.roomId && one.tree
    && state.content.dialogue.get(one.tree)?.nodes.root?.options.some((option) => option.set?.T_SWINDLED));
  assert.ok(npc, 'the swindler is a Room 3 character');
  return npc;
};

test('A3: the swindle takes the four dollars and the watch, gives the deed, and Vessel leaves', async () => {
  const state = await inRoomThree();
  // AmbientLayer's own rule (engine/core/Ambient.ts): present while `when` holds.
  const here = state.roomId;
  const present = () => state.flags.test(vessel.placements?.[here]?.when ?? vessel.when);
  const vessel = vesselId(state);
  assert.ok(state.carried.includes('four_dollars'));
  assert.ok(state.carried.includes('watch'), 'the watch is held from the start (doc 23)');
  assert.ok(!state.carried.includes('deed'));
  assert.ok(present(), 'he is in Room 3 before');

  state.dialogue.start(vessel.tree!);
  const options = state.content.dialogue.get(vessel.tree!)!.nodes.root!.options;
  const deal = options.find((option) => option.set?.T_SWINDLED)!;
  const route: string[] = [];
  for (let at = deal; at; at = options.find((option) => option.id === at!.after?.[0])!) route.unshift(at.id);
  let last = null;
  for (const id of route) last = state.dialogue.select(id);
  assert.equal(last?.ended, true, 'the conversation is over when he has the money');

  assert.equal(state.flags.get('T_SWINDLED'), true);
  assert.ok(state.puzzleComplete('A3'));
  assert.ok(!state.carried.includes('four_dollars'), 'the four dollars are gone');
  assert.ok(!state.carried.includes('watch'), 'so is the watch');
  assert.ok(state.carried.includes('deed'), 'and he holds the deed');
  assert.ok(!present(), 'Vessel has left Room 3');
});

test('A3: the watch comes back at B6 by the duel\'s grant, swindle or no', async () => {
  const state = await inRoomThree();
  state.flags.set('T_SWINDLED', true);
  assert.ok(!state.carried.includes('watch'));
  (state as unknown as { inventory: string[] }).inventory.push('watch');
  assert.ok(state.carried.includes('watch'), 'a granted watch is ordinary inventory');
});

test('A8: the barman offers, the fork tunes, the barman pays across the bar; flat again each visit, never twice into one pocket', async () => {
  // Errata 331. Tyler, 2026-11-15: "there needs to be a conversation with the bartender where he tells him he's going
  // to hire a piano tuner for $2 or something ... Then maybe after Thad tunes it he can talk to the bartender again and
  // then the bartender thanks him and gives him the money more deliberately?" The fork used to pay by itself.
  const state = await inRoomThree();
  const tune = () => {
    state.holdItem(null);
    state.holdItem('tuning_fork');
    const piano = state.findTarget('piano');
    assert.ok(piano, 'the piano is still there to tune');
    return state.interact(piano, 'USE');
  };
  const here = state.roomId;
  const elsewhere = [...state.content.rooms.keys()].find((id) => id !== here && !(state.content.rooms.get(id) as { fixture?: boolean }).fixture)!;
  const revisit = () => { state.enterRoom(elsewhere); state.enterRoom(here); };
  const spend = () => {
    const inv = state as unknown as { inventory: string[] };
    inv.inventory = inv.inventory.filter((item) => item !== 'filing_fee');
  };
  const pair = state.content.combinations.pairs.find((one) => one.room === here && one.rules?.length)!;
  const rule = (label: string) => pair.rules!.find((one) => one.case === label)!;
  // The barman, found by what he pays.
  const barman = [...state.content.ambient.values()].find((one) => one.room === here && one.tree
    && state.content.dialogue.get(one.tree)?.nodes.root?.options.some((option) => option.gives?.includes('filing_fee')))!;
  assert.ok(barman, 'someone in the room pays for the piano');
  const options = state.content.dialogue.get(barman.tree!)!.nodes.root!.options;
  const offer = options.find((option) => option.set?.T_PIANO_JOB)!;
  const pay = options.find((option) => option.gives?.includes('filing_fee'))!;
  const offered = () => state.dialogue.presentOptions().map((one) => one.option.id);
  const collect = () => {
    state.dialogue.start(barman.tree!);
    assert.ok(offered().includes(pay.id), 'he is told the piano is in tune');
    const said = state.dialogue.select(pay.id);
    state.dialogue.end();
    return said;
  };

  // Before he has offered, the fork does nothing and nothing is owed.
  assert.equal(tune().say, rule("before the barman's offer").say);
  assert.notEqual(state.flags.get('T_NUGGET_PIANO_TUNED'), true, 'not tuned uninvited');

  // He offers; asked about the piano first, as a man would be.
  state.dialogue.start(barman.tree!);
  assert.ok(!offered().includes(offer.id), 'nobody offers to tune a piano nobody has mentioned');
  assert.ok(!offered().includes(pay.id), 'and nothing is owed');
  state.dialogue.select(offer.after![0]!);
  state.dialogue.select(offer.id);
  state.dialogue.end();
  assert.equal(state.flags.get('T_PIANO_JOB'), true);

  // The fork tunes it and pays nothing.
  assert.equal(tune().say, rule('first time').say);
  assert.ok(!state.carried.includes('filing_fee'), 'the fork pays nothing by itself');
  assert.ok(!state.puzzleComplete('A8'));
  assert.equal(tune().say, rule('already tuned this visit').say, 'still in tune this visit');

  // Told so, he pays, out loud.
  collect();
  assert.ok(state.carried.includes('filing_fee'), 'the barman has paid');
  assert.ok(state.puzzleComplete('A8'));
  state.dialogue.start(barman.tree!);
  assert.ok(!offered().includes(pay.id), 'paid once for one tuning');
  state.dialogue.end();

  revisit();
  assert.equal(tune().say, rule('already holding THE FILING FEE').say, 'for nothing, with the fee in his pocket');

  spend(); revisit();
  assert.equal(tune().say, rule('second time').say);
  assert.ok(!state.carried.includes('filing_fee'));
  revisit();
  assert.equal(tune().say, rule('still owed for the last').say, 'owed once, not twice');
  collect();
  assert.ok(state.carried.includes('filing_fee'), 'paid again: the money repeats');
  spend(); revisit();
  assert.equal(tune().say, rule('third time and after').say);
  collect();
  spend(); revisit();
  assert.equal(tune().say, rule('third time and after').say, 'and after');
  collect();
  assert.ok(state.carried.includes('filing_fee'));
});

test('the piano answers every verb doc 16 and doc 49 write, and its act lines in their acts', async () => {
  const state = await inRoomThree();
  const piano = state.findTarget('piano')!;
  for (const verb of ['USE', 'OPEN', 'PUSH', 'TALK_TO']) {
    assert.ok(piano.overrides?.[verb], `THE PIANO answers ${verb} in its own words`);
  }
  const ordinary = state.interact(piano, 'LOOK_AT').say;
  state.flags.set('ACT', 2);
  const actTwo = state.interact(state.findTarget('piano')!, 'LOOK_AT').say;
  assert.notEqual(actTwo, ordinary, 'act 2 has its own LOOK');
  assert.equal(actTwo, piano.responses!.LOOK_AT!.find((rule) => rule.when?.ACT)?.say);
});
