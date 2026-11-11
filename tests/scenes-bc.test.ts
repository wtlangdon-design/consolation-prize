/**
 * ACT III, SCENES B AND C (doc 111; errata 237): the séance, which is E1's way of completing, and the estate sale,
 * which is E3's way to the money. Played from fixtures through the engine, as a player's clicks reach it:
 *
 *   B - the sign and the séance are there from the act turn until the dead have spoken, and not after;
 *     - with the lamp lit the table is refused; the lamp put out, he goes under it, THE SÉANCE is heard, and the
 *       voice of the dead says the one thing that does the job;
 *     - the conversation under the table can be left and taken up again, and survives a save;
 *     - the Registrar's new row completes E1, and section nineteen follows whichever way E1 came;
 *     - every subject answers LOOK and LISTEN, and every wrong try, from doc 111.
 *   C - the raccoon is back after the Reverend's figure, and only on the estate sale's way;
 *     - the hen is lent only after the offer; the wrong orders at the hole are answered and change nothing;
 *     - the hen brings him halfway out, the coat takes him, and the hole is empty afterwards, into Act IV;
 *     - the raccoon in the coat is refused at the undertaker's and at the laundry; the sale pays; the money buys the
 *       funeral with doc 57 E3.3's lines and gates; a save between the hole and the sale keeps what he carries.
 *
 * Every line asserted is read from doc 111 or doc 57. Ids come from the fixtures and the content, never typed as
 * names of the fiction.
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
import type { FlagWrites, SpokenLine } from '../engine/core/types.ts';
import { HeadlessPlayer } from './lib/headless-player.ts';

// PLAYS: E1, E3

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const content = await loadContent(fsReader);
const doc111 = readFileSync(resolve(ROOT, 'docs/111-scenes-b-and-c.md'), 'utf8');
const LINES = doc111.slice(doc111.indexOf('\n## THE LINES\n'), doc111.indexOf('\n## After Tyler approves'));
const doc57 = readFileSync(resolve(ROOT, 'docs/57-puzzle-completion.md'), 'utf8');
const words = (one: SpokenLine) => (typeof one === 'string' ? one : one.line);
const written = (line: string | null | undefined) => typeof line === 'string' && line.length > 0 && LINES.includes(line);

const SEANCE = 'r16-seance-a';
const DARK = 'r16-seance-b';
const PRICED = 'r25-sale-a';
const WANTED = 'r23-sale-a';
const fixture = (id: string) => {
  const found = content.fixtures.get(id);
  assert.ok(found, `fixture ${id}`);
  return found;
};
const TENT = fixture(SEANCE).room;
const HOLE_ROOM = fixture(WANTED).room;
const CLAIM = fixture(PRICED).room;

/** A fixture's state, flags changed and optionally in another room, as a player standing there. */
const inFixture = (id: string, flags: FlagWrites = {}, room?: string, storage = new MemoryStorage()) => {
  const state = new GameState(content, storage);
  const one = fixture(id);
  assert.ok(state.applyFixture({ ...one, ...(room ? { room } : {}), flags: { ...one.flags, ...flags } }));
  const player = new HeadlessPlayer(state);
  player.ambient.arrived();
  return { state, player };
};
const target = (state: GameState, id: string) => {
  const found = state.targets.find((one) => one.id === id);
  assert.ok(found, `${id} is a target in ${state.roomId}`);
  return found;
};
const isTarget = (state: GameState, id: string) => state.targets.some((one) => one.id === id);
/** Whoever in the room talks through a tree that has the given node. */
const hostWith = (player: HeadlessPlayer, nodeId: string) => {
  player.state.verbs.resetToDefault();
  const npc = player.present().find((one) => one.tree && content.dialogue.get(one.tree)?.nodes[nodeId]);
  assert.ok(npc, `somebody here talks through ${nodeId}`);
  return npc;
};
const offered = (state: GameState) => state.dialogue.presentOptions().map((one) => one.option.id);
const node = (state: GameState) => state.dialogue.positionSnapshot().node;
const said = (result: { say: string | null; then?: SpokenLine[] }) => [result.say, ...(result.then ?? []).map(words)];
/** The séance's subjects, by the flag that puts them in the tent. */
const seanceSubjects = (state: GameState) => state.room.hotspots.filter((one) => one.when?.T_SEANCE_ON === true).map((one) => one.id);

/* ---- B · the séance ------------------------------------------------------- */

test('scene B: the sign and the séance are on from the act turn until the dead have spoken', () => {
  const { state } = inFixture(SEANCE, { T_SEANCE_ON: false }, 'town_map');
  const lane = content.rooms.get(TENT)!.exits.find((exit) => exit.to)!.to;
  state.enterRoom(lane);
  assert.equal(state.flags.get('T_SEANCE_ON'), true, 'the way in sets it, in Act III');
  const sign = state.room.hotspots.find((one) => one.when?.T_SEANCE_ON === true);
  assert.ok(sign && isTarget(state, sign.id), 'the sign is out');
  for (const verb of ['LOOK_AT', 'LISTEN_TO']) assert.ok(written(state.interact(target(state, sign.id), verb).say), `its ${verb} is doc 111's`);
  // After the dead have spoken it is over, and the way in does not start it again.
  const after = inFixture(SEANCE, { T_SEANCE_ON: false, T_MOTT_SPOKE: true }, 'town_map').state;
  after.enterRoom(lane);
  assert.equal(after.flags.get('T_SEANCE_ON'), false);
  assert.ok(!isTarget(after, sign.id), 'no sign');
  // Never sat in, the act turns: it is over too.
  const late = inFixture(SEANCE, { ACT: 4 }, 'town_map').state;
  late.enterRoom(TENT);
  assert.equal(late.flags.get('T_SEANCE_ON'), false, 'over by Act IV');
  assert.deepEqual(seanceSubjects(late).filter((id) => isTarget(late, id)), []);
});

test('scene B: the first entry to the tent says its arrival once, and the séance stands in place of the table and lamp', () => {
  const { state } = inFixture(SEANCE, {}, 'town_map');
  state.enterRoom(TENT);
  const { held } = state.arrivalOf();
  assert.ok(!held && state.room.onEnter?.say?.every(written), 'ARRIVING, from doc 111');
  assert.equal(state.flags.get('T_SEANCE_ARRIVED'), false, 'written when it is read');
  state.flags.set('T_SEANCE_ARRIVED', true);
  state.enterRoom('town_map');
  state.enterRoom(TENT);
  assert.ok(state.arrivalOf().held, 'not said again');
  const subjects = seanceSubjects(state);
  assert.equal(subjects.length, 5, 'table, lamp, sitters, the editor and the presiding medium');
  for (const id of subjects) assert.ok(isTarget(state, id));
  for (const gone of state.room.hotspots.filter((one) => one.when?.T_SEANCE_ON === false)) assert.ok(!isTarget(state, gone.id), `${gone.id} gives way`);
});

test('scene B: with the lamp lit the table is refused; put out, he goes under, hears the séance, and the dead speak', () => {
  const { state, player } = inFixture(SEANCE);
  const table = seanceSubjects(state).find((id) => content.rooms.get(TENT)!.hotspots.find((one) => one.id === id)!.responses?.USE);
  assert.ok(table);
  const lit = player.verb(table, 'USE');
  assert.ok(written(lit.say), 'the refusal is doc 111\'s');
  assert.equal(state.flags.get('T_UNDER_TABLE'), false);
  assert.equal(state.dialogue.isActive, false);
  // The medium, at the séance: OZY_E1. She is drawn at the head of the table, in the séance's own cut-out, and TALK TO
  // reaches her through the subject over her there (errata 238). The lamp is put out by asking whether the dead mind
  // the light.
  const presiding = seanceSubjects(state).find((id) => state.room.hotspots.find((one) => one.id === id)!.responses?.TALK_TO?.some((rule) => rule.dialogue));
  assert.ok(presiding, 'a séance subject opens her tree');
  player.verb(presiding, 'TALK_TO');
  assert.equal(node(state), 'OZY_E1');
  const tree = state.dialogue.activeTreeId!;
  const opening = state.dialogue.openingOf(tree);
  assert.ok(opening.length && opening.every((one) => written(one.line)), 'her opening is doc 111\'s');
  const dark = offered(state).find((id) => content.dialogue.get(tree)!.nodes.OZY_E1!.options.find((one) => one.id === id)?.set?.T_SEANCE_DARK);
  assert.ok(dark, 'the question that puts the lamp out is offered');
  player.choose(dark);
  assert.equal(state.flags.get('T_SEANCE_DARK'), true);
  player.leave();
  const under = player.verb(table, 'USE');
  assert.equal(state.flags.get('T_UNDER_TABLE'), true, 'under the cloth');
  for (const line of said(under)) assert.ok(written(line), `"${line}" is doc 111's`);
  assert.equal(state.dialogue.isActive, true);
  assert.equal(node(state), 'SEA_E1');
  // The séance is heard from under it: the node's opening, said before the list (errata 239; tests/seance-polish.test.ts).
  const heard = content.dialogue.get(state.dialogue.activeTreeId!)!.nodes.SEA_E1!.opening ?? [];
  assert.ok(heard.length >= 8 && heard.every((one) => written(one.line)), 'and the séance is heard from under it');
  // A comic try answers, and answers again differently; the try that empties two chairs goes; the dead speak.
  const seance = content.dialogue.get(state.dialogue.activeTreeId!)!;
  const options = seance.nodes.SEA_E1!.options;
  const comic = options.filter((one) => one.tag === 'COMIC');
  const first = state.dialogue.select(comic[0]!.id);
  const again = state.dialogue.select(comic[0]!.id);
  assert.ok(written(first.say) && written(again.say) && first.say !== again.say, 'the wind, then the persistent wind');
  const spent = comic.find((one) => one.afterUse === 'remove')!;
  state.dialogue.select(spent.id);
  assert.ok(!offered(state).includes(spent.id), 'two chairs go over once');
  const spoken = options.find((one) => one.set?.T_MOTT_SPOKE)!;
  assert.ok(offered(state).includes(spoken.id));
  player.choose(spoken.id);
  assert.equal(state.flags.get('T_MOTT_SPOKE'), true);
  assert.equal(state.flags.get('T_UNDER_TABLE'), false);
  assert.equal(state.flags.get('T_SEANCE_ON'), false, 'the séance is over');
  assert.equal(state.dialogue.isActive, false, 'and the conversation with it');
  assert.deepEqual(seanceSubjects(state).filter((id) => isTarget(state, id)), [], 'the tent is itself again');
  for (const one of spoken.exchange!) assert.ok(written(one.line), `"${one.line}" is doc 111's`);
  // Her own tree is her own again: the next time he comes in, she is standing behind her table.
  state.enterRoom(TENT);
  player.ambient.arrived();
  const host = hostWith(player, 'OZY_E1');
  assert.equal(host.tree, tree);
  player.talk(host.id);
  assert.notEqual(node(state), 'OZY_E1');
});

test('scene B: under the table, the way out brings him out from under it, and the table takes him back to the same choice', () => {
  const { state, player } = inFixture(DARK);
  const table = seanceSubjects(state).find((id) => state.room.hotspots.find((one) => one.id === id)!.responses?.USE)!;
  player.verb(table, 'USE');
  assert.equal(node(state), 'SEA_E1');
  // The tree's own way out, not the option that ends the séance.
  const away = state.dialogue.presentOptions().find((one) => one.option.tag === 'EXIT');
  assert.ok(away, 'the conversation has a way out');
  player.choose(away.option.id);
  assert.equal(state.dialogue.isActive, false);
  // Errata 239: he is not drawn under the cloth, so the way out brings him out from under it.
  assert.equal(state.flags.get('T_UNDER_TABLE'), false, 'out from under the cloth');
  const back = player.verb(table, 'USE');
  assert.equal(state.flags.get('T_UNDER_TABLE'), true, 'and under it again');
  assert.equal(back.say, null, 'nothing said: the séance is not heard twice');
  assert.equal(node(state), 'SEA_E1', 'the voice of the dead again');
  const spoken = state.dialogue.presentOptions().find((one) => one.option.set?.T_MOTT_SPOKE);
  assert.ok(spoken, 'and the one thing that does the job is still on offer');
  player.choose(spoken.option.id);
  assert.equal(state.flags.get('T_MOTT_SPOKE'), true);
});

test('scene B: a save made under the table restores the conversation, and it can be finished', () => {
  const storage = new MemoryStorage();
  const { state, player } = inFixture(DARK, {}, undefined, storage);
  const table = seanceSubjects(state).find((id) => state.room.hotspots.find((one) => one.id === id)!.responses?.USE)!;
  player.verb(table, 'USE');
  state.save(1);
  const loaded = new GameState(content, storage);
  assert.ok(loaded.load(1));
  assert.equal(loaded.dialogue.isActive, true, 'the conversation is restored');
  assert.equal(loaded.dialogue.positionSnapshot().node, 'SEA_E1');
  assert.deepEqual(offered(loaded), offered(state));
  const spoken = loaded.dialogue.presentOptions().find((one) => one.option.set?.T_MOTT_SPOKE)!;
  loaded.dialogue.select(spoken.option.id);
  assert.equal(loaded.flags.get('T_MOTT_SPOKE'), true);
});

test('scene B: the new row at the counter completes E1 from the front page, and section nineteen follows either way', () => {
  for (const [way, flags] of [['the front page', { T_MOTT_SPOKE: true }], ['the petition', {}]] as [string, FlagWrites][]) {
    const { state, player } = inFixture(SEANCE, { T_SECTION_NINETEEN: true, ...flags }, 'claims_registrar');
    const host = hostWith(player, 'SUM_E1');
    player.talk(host.id);
    assert.equal(node(state), 'SUM_E1');
    const options = content.dialogue.get(host.tree!)!.nodes.SUM_E1!.options;
    const front = options.find((one) => one.when?.T_MOTT_SPOKE === true)!;
    const petition = options.find((one) => one.puzzle?.E1 && one !== front)!;
    const section = options.find((one) => one.puzzle?.E2)!;
    assert.ok(!offered(state).includes(section.id), `${way}: section nineteen waits for E1`);
    assert.equal(offered(state).includes(front.id), flags.T_MOTT_SPOKE === true, `${way}: the front page only once the dead have spoken`);
    const chosen = flags.T_MOTT_SPOKE ? front : petition;
    const reply = state.dialogue.select(chosen.id);
    assert.ok(state.puzzleComplete('E1'), `${way}: E1, blocked by design`);
    if (chosen === front) for (const line of [reply.say, ...reply.rest.map((one) => one.line)]) assert.ok(written(line), `"${line}" is doc 111's`);
    assert.ok(offered(state).includes(section.id), `${way}: section nineteen follows in the same visit`);
    state.dialogue.select(section.id);
    assert.ok(state.puzzleComplete('E2'));
  }
});

test('scene B: every subject at the séance answers LOOK and LISTEN, and every wrong try, from doc 111', () => {
  const { state, player } = inFixture(SEANCE);
  for (const id of seanceSubjects(state)) {
    for (const verb of ['LOOK_AT', 'LISTEN_TO']) {
      for (let n = 0; n < 4; n += 1) assert.ok(written(state.interact(target(state, id), verb).say), `${id} ${verb} ${n + 1}`);
    }
    const spot = state.room.hotspots.find((one) => one.id === id)!;
    for (const [verb, line] of Object.entries(spot.overrides ?? {})) {
      assert.ok(written(line), `${id} ${verb}`);
      assert.equal(player.verb(id, verb).say, line);
    }
    // TALK TO an exchange, not a tree (the presiding medium's opens OZY_E1, played above).
    const talk = spot.responses?.TALK_TO?.[0];
    if (talk && !talk.dialogue) {
      const first = player.verb(id, 'TALK_TO');
      for (const line of said(first)) assert.ok(written(line), `${id} TALK TO: "${line}"`);
      assert.ok(said(first).length >= 3, 'an exchange, with his line in it');
      const second = player.verb(id, 'TALK_TO');
      assert.ok(written(second.say) && second.say !== first.say, 'and a second time');
    }
  }
});

/* ---- C · the estate sale -------------------------------------------------- */

test('scene C: the raccoon is back after the Reverend\'s figure, on the estate sale\'s way only, and says so once', () => {
  const { state, player } = inFixture(PRICED, {}, 'town_map');
  player.go(HOLE_ROOM);
  const back = player.present().filter((one) => one.when?.T_SOWERBY_PRICE === true).map((one) => one.id);
  assert.equal(back.length, 1, 'the raccoon, back in the hole');
  assert.ok(isTarget(state, 'raccoon'));
  assert.ok(!state.arrivalOf().held && state.room.onEnter?.say?.every(written), 'ARRIVING, from doc 111');
  for (const [why, flags] of [
    ['before the Reverend\'s figure', { T_SOWERBY_PRICE: false }],
    ['with the loan already taken', { T_SHENG_LOAN: true }],
    ['with the funeral already booked', { T_FUNERAL_BOOKED: true }],
    ['once he is in the coat', { T_RACCOON_IN_COAT: true }],
    ['in Act IV', { ACT: 4, T_RACCOON_IN_COAT: true }],
  ] as [string, FlagWrites][]) {
    const other = inFixture(PRICED, flags, 'town_map');
    other.player.go(HOLE_ROOM);
    assert.ok(!isTarget(other.state, 'raccoon'), `${why}: no raccoon in the hole`);
    assert.deepEqual(other.player.present().filter((one) => back.includes(one.id)).map((one) => one.id), [], why);
  }
});

test('scene C: the hen is lent only after the offer, and the offer opens his node until the sale', () => {
  const { state, player } = inFixture(PRICED);
  const host = hostWith(player, 'PRA_E3');
  player.talk(host.id);
  assert.equal(node(state), 'PRA_E3');
  const options = content.dialogue.get(host.tree!)!.nodes.PRA_E3!.options;
  const offer = options.find((one) => one.set?.T_RACCOON_WANTED)!;
  const hen = options.find((one) => one.gives?.includes('hen'))!;
  assert.ok(!offered(state).includes(hen.id), 'not before the offer');
  assert.ok(!state.carried.includes('hen'));
  player.choose(offer.id);
  assert.equal(state.flags.get('T_RACCOON_WANTED'), true);
  assert.ok(offered(state).includes(hen.id));
  player.choose(hen.id);
  assert.ok(state.carried.includes('hen'), 'the hen, on loan');
  for (const option of [offer, hen]) for (const one of option.exchange!) assert.ok(written(one.line), `"${one.line}" is doc 111's`);
});

test('scene C: the wrong orders at the hole are answered and change nothing; the hen brings him out; the coat takes him', () => {
  // Before he is wanted, his Act I refusal stands and nothing of doc 111's is said.
  const early = inFixture(PRICED, {}, HOLE_ROOM);
  const refused = early.player.verb('raccoon', 'PICK_UP').say;
  assert.ok(refused && !written(refused), 'his ordinary refusal');
  const { state, player } = inFixture(WANTED);
  const before = state.flags.snapshot();
  for (const [what, act] of [
    ['a hand in the hole', () => player.verb('raccoon', 'PICK_UP')],
    ['the coat on the hole without bait', () => player.verb('hole', 'USE')],
    ['the fork on him', () => player.use('tuning_fork', 'raccoon')],
  ] as [string, () => { say: string | null }][]) {
    assert.ok(written(act().say), `${what}: doc 111's line`);
  }
  // The hen to him before he is out has no line of its own: the hen's pool, and he stays in.
  const early_hen = player.use('hen', 'raccoon').say;
  assert.ok(!written(early_hen ?? ''), 'the hen to him in the hole is not the halfway line');
  assert.deepEqual(state.flags.snapshot(), before, 'nothing changed');
  // The hen at the hole: halfway out.
  const bait = player.use('hen', 'hole');
  for (const line of said(bait)) assert.ok(written(line), `"${line}" is doc 111's`);
  assert.equal(state.flags.get('T_RACCOON_OUT'), true);
  assert.ok(state.carried.includes('hen'), 'the hen stays with him');
  for (const [what, act] of [
    ['his hands, with him halfway out', () => player.verb('raccoon', 'PICK_UP')],
    ['the hen again, without the coat', () => player.use('hen', 'raccoon')],
  ] as [string, () => { say: string | null }][]) {
    assert.ok(written(act().say), `${what}: doc 111's line`);
  }
  assert.ok(!state.carried.includes('raccoon_in_coat'));
  const coat = player.verb('raccoon', 'USE');
  for (const line of said(coat)) assert.ok(written(line), `"${line}" is doc 111's`);
  assert.ok(state.carried.includes('raccoon_in_coat') && state.carried.includes('hen'), 'the raccoon in the coat, and the hen');
  assert.ok(!isTarget(state, 'raccoon'), 'the hole is empty');
  // Into Act IV, the hole stays empty of raccoons for the dig.
  state.flags.set('ACT', 4);
  state.enterRoom('town_map');
  player.go(HOLE_ROOM);
  assert.ok(!isTarget(state, 'raccoon'));
  assert.ok(!player.present().some((one) => one.posture === 'animal' && /raccoon/.test(one.id)), 'no raccoon in the hole in Act IV');
});

test('scene C: the raccoon is refused elsewhere, the sale pays, and the money buys the funeral as the loan did', () => {
  const storage = new MemoryStorage();
  const { state, player } = inFixture(WANTED, {}, undefined, storage);
  player.use('hen', 'hole');
  player.verb('raccoon', 'USE');
  // A save between the hole and the sale keeps what he carries.
  state.save(2);
  const loaded = new GameState(content, storage);
  assert.ok(loaded.load(2));
  assert.ok(loaded.carried.includes('raccoon_in_coat') && loaded.carried.includes('hen'), 'the coat and the hen survive a save');
  assert.ok(!loaded.targets.some((one) => one.id === 'raccoon'));
  const on = new HeadlessPlayer(loaded);
  for (const [room, who] of [['undertaker', 'undertaker'], ['laundry', 'sheng']] as [string, string][]) {
    on.go(room);
    const answer = on.give('raccoon_in_coat', who);
    assert.ok(written(answer.say), `${who}: doc 111's refusal`);
    assert.ok(loaded.carried.includes('raccoon_in_coat'), `${who} does not take it`);
  }
  assert.equal(loaded.flags.get('T_FUNERAL_BOOKED'), false);
  on.go(CLAIM);
  const pratt = hostWith(on, 'PRA_E3');
  assert.ok(written(on.give('hen', pratt.id).say), 'the hen is on loan');
  assert.ok(loaded.carried.includes('hen'));
  const sale = on.give('raccoon_in_coat', pratt.id);
  for (const line of said(sale)) assert.ok(written(line), `"${line}" is doc 111's`);
  assert.ok(loaded.carried.includes('pratt_money'), 'two dollars and sixty cents');
  assert.ok(!loaded.carried.includes('hen') && !loaded.carried.includes('raccoon_in_coat'), 'the hen back, the raccoon sold');
  assert.equal(loaded.flags.get('T_RACCOON_SOLD'), true);
  on.talk(pratt.id);
  assert.notEqual(loaded.dialogue.positionSnapshot().node, 'PRA_E3', 'his node is over');
  on.leave();
  // The undertaker: doc 57 E3.3's lines and gates, unchanged.
  on.go('undertaker');
  const unsized = on.give('pratt_money', 'undertaker');
  assert.ok(unsized.say && doc57.includes(unsized.say), 'not before the sizing');
  assert.ok(loaded.carried.includes('pratt_money'));
  on.talk('undertaker');
  const sizing = loaded.dialogue.presentOptions().find((one) => one.option.set?.T_COFFIN_SIZED)!;
  on.choose(sizing.option.id);
  on.leave();
  const paid = on.give('pratt_money', 'undertaker');
  assert.ok(paid.say && doc57.includes(paid.say), 'paid, in doc 57\'s words');
  assert.ok(loaded.puzzleComplete('E3'));
  assert.equal(loaded.flags.get('T_FUNERAL_BOOKED'), true);
  assert.ok(!loaded.carried.includes('pratt_money'), 'spent');
});

test('scene C: the money at the undertaker\'s answers exactly as the loan does', () => {
  const pairs = content.combinations.pairs;
  const loan = pairs.find((pair) => pair.item === 'loan' && pair.target === 'undertaker')!;
  const money = pairs.find((pair) => pair.item === 'pratt_money' && pair.target === 'undertaker')!;
  const strip = (rules: typeof loan.rules) => (rules ?? []).map(({ takes, ...rest }) => ({ ...rest, takes: (takes ?? []).length }));
  assert.deepEqual(strip(money.rules), strip(loan.rules), 'the same cases, gates, words and outcome; only the money differs');
});
