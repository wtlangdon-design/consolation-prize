/**
 * SCENE A, THE HEARSE WON'T GO (doc 110 section 2; errata 233). E6b, between the executor and the coffin.
 *
 *   - The procession stalls at Boot Hill's gate on the first entry once the funeral can be reached (the executor
 *     named, the obituary out), never before and never after the funeral or the ride; ARRIVING is said on that entry.
 *   - The way up refuses with THE WAY ON while it is stalled.
 *   - THE HEARSE refuses with the town watching, and takes him during the prayer for the hill.
 *   - The prayer cannot be lost: he is paid by the foot, and it runs until the climb, across a visit and a save;
 *     his speaking breaks say its lines in turn, round again.
 *   - The ride completes E6b, goes over black, and lands in Room 31, where ARRIVING AT THE GRAVE is said once.
 *   - The funeral's own way back and S2 are as they were.
 *   - The hearse and its mule, one figure, are declared only once the picture is here, and it is (PR 314); they
 *     stand at the gate, and nobody walks through them while they do.
 *   - While the prayer runs the mourners bow their heads and shut their eyes, and now and then one of them peeks.
 *
 * Every line asserted is read from doc 110 or from the content extracted from it. Nothing here is typed from a
 * document.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { AmbientLayer } from '../engine/core/Ambient.ts';
import { WalkBoxes } from '../engine/core/WalkBoxes.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import type { FlagWrites, SpokenLine } from '../engine/core/types.ts';
import { HeadlessPlayer } from './lib/headless-player.ts';
// @ts-expect-error -- a plain .mjs module with no declarations; it reads 8-bit RGBA PNGs.
import { readPng } from '../tools/lib/png.mjs';

// PLAYS: E6b

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const doc110 = readFileSync(resolve(ROOT, 'docs/110-act-three-scenes.md'), 'utf8');
const LINES = doc110.slice(doc110.indexOf('\n### THE LINES\n'), doc110.indexOf('\n## 3 '));
const written = (line: string | null | undefined) => typeof line === 'string' && line.length > 0 && LINES.includes(line);
const words = (one: SpokenLine) => (typeof one === 'string' ? one : one.line);

const HILL = 'boot_hill';
const FUNERAL = 'funeral';
const FIGURES = ['procession_undertaker', 'procession_sowerby', 'procession_mourners'];
const SUBJECTS = ['hearse', 'grievance_at_the_gate', 'undertaker', 'reverend_sowerby_at_the_gate', 'mourners'];

/** A fixture's state, with flags changed, standing on the map, so the next room is an arrival. */
const inFixture = async (id: string, flags: FlagWrites = {}, room?: string) => {
  const state = new GameState(await loadContent(fsReader), new MemoryStorage());
  const fixture = state.content.fixtures.get(id);
  assert.ok(fixture, `fixture ${id}`);
  assert.ok(state.applyFixture({ ...fixture, ...(room ? { room } : {}), flags: { ...fixture.flags, ...flags } }));
  return { state, player: new HeadlessPlayer(state), ambient: new AmbientLayer(state) };
};
/** Room 14 just before the first entry after E6: the stall window open, nothing stalled yet. */
const beforeTheHill = (flags: FlagWrites = {}) => inFixture('r14-stall-a', { T_PROCESSION_STALLED: false, ...flags }, 'town_map');
const present = (ambient: AmbientLayer) => {
  ambient.arrived();
  return ambient.present.map((npc) => npc.id);
};
const target = (state: GameState, id: string) => {
  const found = state.targets.find((one) => one.id === id);
  assert.ok(found, `${id} is a target in ${state.roomId}`);
  return found;
};
const arrivalLines = (state: GameState) => state.arrivalOf().scenes.flatMap((scene) => scene.lines.map((one) => one.line));

test('the procession stalls on the first entry once the funeral can be reached, and says so once', async () => {
  const { state, ambient } = await beforeTheHill();
  state.enterRoom(HILL);
  assert.ok(state.flags.test({ T_PROCESSION_STALLED: true }), 'entering stalls it');
  const said = arrivalLines(state);
  assert.equal(said.length, 1, 'ARRIVING, one line');
  assert.ok(written(said[0]), 'read from doc 110');
  for (const id of FIGURES) assert.ok(present(ambient).includes(id), `${id} stands at the gate`);
  for (const id of SUBJECTS) target(state, id);
  state.enterRoom('town_map');
  state.enterRoom(HILL);
  assert.deepEqual(arrivalLines(state), [], 'said on the entry that stalls it, not again');
  assert.ok(state.flags.test({ T_PROCESSION_STALLED: true }), 'and still stalled');
});

test('the stall appears only in its window', async () => {
  for (const [why, flags] of [
    ['before the executor is named', { T_EXECUTOR_NAMED: false }],
    ['before the obituary', { T_OBITUARY: false }],
    ['after the funeral', { T_FUNERAL_DONE: true }],
    ['after the ride', { T_RODE_UP: true }],
  ] as [string, FlagWrites][]) {
    const { state, ambient } = await beforeTheHill(flags);
    state.enterRoom(HILL);
    assert.ok(!state.flags.test({ T_PROCESSION_STALLED: true }), `not stalled ${why}`);
    assert.deepEqual(arrivalLines(state).filter(written), [], `nothing of doc 110 said ${why}`);
    for (const id of FIGURES) assert.ok(!present(ambient).includes(id), `${id} is not at the gate ${why}`);
    for (const id of SUBJECTS) assert.ok(!state.targets.some((one) => one.id === id), `${id} is not there ${why}`);
  }
});

test('while stalled the way up refuses with THE WAY ON, and nothing goes up the hill', async () => {
  const { state, player } = await inFixture('r14-stall-a');
  assert.ok(!state.room.exits.some((exit) => exit.to === FUNERAL && state.flags.test(exit.when)), 'the way up is not open');
  const refusal = state.interact(target(state, 'to_funeral_closed'), 'WALK_TO');
  assert.ok(written(refusal.say), 'doc 110\'s line');
  assert.equal(refusal.goesTo, undefined);
  assert.equal(state.roomId, HILL);
  assert.throws(() => player.go(FUNERAL), /no way/, 'no route to the funeral but the hearse');
});

test('the hearse refuses with the town watching, and the minister\'s prayer is what opens it', async () => {
  const { state } = await inFixture('r14-stall-a');
  for (const verb of ['USE', 'OPEN']) {
    const refused = state.interact(target(state, 'hearse'), verb);
    assert.ok(written(refused.say), `${verb}: doc 110's refusal`);
    assert.equal(refused.goesTo, undefined, `${verb}: nobody rides`);
    assert.ok(!state.puzzleComplete('E6b'));
  }
  const asked = state.interact(target(state, 'reverend_sowerby_at_the_gate'), 'TALK_TO');
  const exchange = [asked.say, ...(asked.then ?? []).map(words)].filter((one) => one !== '…');
  assert.ok(exchange.length >= 5 && exchange.every(written), 'the blessing asked, in doc 110\'s words');
  assert.ok((asked.then ?? []).some((one) => typeof one !== 'string' && one.speaker === 'procession_sowerby'), 'the minister answers');
  assert.ok(state.flags.test({ T_HILL_PRAYER: true }), 'the prayer runs');
  const mid = state.interact(target(state, 'reverend_sowerby_at_the_gate'), 'TALK_TO');
  assert.ok(written(mid.say) && !exchange.includes(mid.say!), 'mid-prayer, he is not asked again');
  const ride = state.interact(target(state, 'hearse'), 'USE');
  assert.equal(ride.goesTo, FUNERAL, 'during the prayer, the hearse takes him');
});

test('the prayer cannot be lost: leave and come back, still praying; his breaks say it in turn, round again', async () => {
  const { state, ambient } = await inFixture('r14-stall-a');
  const minister = () => ambient.present.find((npc) => npc.id === 'procession_sowerby')!;
  present(ambient);
  assert.equal(ambient.breakLine(minister()), null, 'before the prayer his breaks say nothing');
  state.interact(target(state, 'reverend_sowerby_at_the_gate'), 'TALK_TO');
  const first = ambient.breakLine(minister());
  const second = ambient.breakLine(minister());
  assert.ok(written(first) && written(second) && first !== second, 'the prayer, one line a break, in turn');
  state.enterRoom('town_map');
  state.enterRoom(HILL);
  assert.ok(state.flags.test({ T_HILL_PRAYER: true }), 'still praying after he has been away');
  present(ambient);
  const turns = minister().barkTurns!.find((one) => one.onBreaks)!;
  assert.equal(turns.lines.length, 5);
  const heard = [first, second, ...Array.from({ length: turns.lines.length }, () => ambient.breakLine(minister()))];
  assert.deepEqual(heard.slice(0, 5), turns.lines, 'every line, in order, across the visit');
  assert.equal(heard[5], turns.lines[0], 'and round again');
  assert.equal(state.flags.getNumber(turns.counter), 7, 'counted, so a save keeps its place');
  const saved = state.flags.snapshot();
  const { state: loaded } = await inFixture('r14-stall-b');
  loaded.flags.restore(saved);
  assert.ok(loaded.flags.test({ T_HILL_PRAYER: true }), 'and still praying in a save');
  assert.equal(loaded.interact(target(loaded, 'hearse'), 'OPEN').goesTo, FUNERAL, 'so the hearse still takes him');
});

test('the ride completes E6b, goes over black, and lands in Room 31, where his arrival is said once', async () => {
  const { state } = await inFixture('r14-stall-b');
  const ride = state.interact(target(state, 'hearse'), 'USE');
  assert.ok(!ride.direction && written(ride.say), 'he climbs in, and says so: nothing printed (doc 130; errata 314)');
  const then = ride.then ?? [];
  const over = then.filter((one) => typeof one !== 'string' && one.overBlack);
  assert.equal(over.length, 3, 'THE RIDE: three lines over black');
  assert.ok(then.every((one) => written(words(one))), 'every line doc 110\'s');
  assert.ok(state.puzzleComplete('E6b'), 'E6b');
  assert.ok(state.flags.test({ T_RODE_UP: true, T_HILL_PRAYER: false, T_PROCESSION_STALLED: false }));
  state.enterRoom(ride.goesTo!);
  assert.equal(state.roomId, FUNERAL);
  const arrived = arrivalLines(state);
  assert.equal(arrived.length, 1, 'ARRIVING AT THE GRAVE');
  assert.ok(written(arrived[0]));
  for (const scene of state.arrivalOf().scenes) if (scene.after) state.afterArrival(scene.after);
  state.enterRoom(FUNERAL);
  assert.deepEqual(arrivalLines(state), [], 'once');
  // The headless player plays it the same way: the scene travels, and the arrival's outcome lands.
  const again = await inFixture('r14-stall-b');
  again.player.verb('hearse', 'USE');
  assert.equal(again.state.roomId, FUNERAL);
  assert.ok(again.state.flags.test({ T_RIDE_ARRIVED: true }));
});

test('the undertaker speaks the first time, and the second time says another line', async () => {
  const { state } = await inFixture('r14-stall-a');
  const first = state.interact(target(state, 'undertaker'), 'TALK_TO');
  assert.equal(first.by, 'procession_undertaker');
  // Errata 314 (doc 130): his "low" was a printed tone; he simply says it now, and Thad answers.
  assert.ok(!first.direction && written(first.say), 'his line, said, nothing printed');
  assert.ok((first.then ?? []).every((one) => written(words(one))) && (first.then ?? []).length === 1);
  const second = state.interact(target(state, 'undertaker'), 'TALK_TO');
  assert.equal(second.by, 'procession_undertaker');
  assert.ok(!second.direction, 'a repeat is a line, not the first answer\'s direction');
  assert.ok(written(second.say) && second.say !== first.say);
});

test('afterwards the funeral is as it was: its way back, S2 beat 3 and E7; and the plot leads up again', async () => {
  const { state, player } = await inFixture('r14-stall-b');
  player.verb('hearse', 'USE');
  assert.equal(state.roomId, FUNERAL);
  const way = state.room.exits.find((exit) => exit.to === HILL)!;
  const beat = state.interact(way, 'WALK_TO');
  assert.equal(beat.changedRoom, false, 'S2 beat 3 at the way back');
  assert.ok(state.flags.test({ T_GOOD_TURNOUT: true }));
  assert.equal(state.interact(way, 'WALK_TO').changedRoom, false, 'then it refuses, as E7 says');
  const lie = state.interact(target(state, 'coffin'), 'USE');
  assert.equal(lie.goesTo, 'coffin', 'E7 lies him down');
  assert.ok(state.puzzleComplete('E7'));
  // From the hill, once he has ridden up and before the funeral is over, the plot is the way up again.
  const { state: hill } = await inFixture('r14-stall-a', { T_PROCESSION_STALLED: false, T_RODE_UP: true });
  hill.enterRoom(HILL);
  assert.ok(hill.targets.some((one) => 'to' in one && (one as { to: string }).to === FUNERAL), 'the plot leads up');
  assert.ok(!hill.targets.some((one) => one.id === 'to_funeral_closed'), 'and does not refuse');
});

test('the fork on the mule at the gate is the line she already gave it', async () => {
  const { state } = await inFixture('r14-stall-a');
  const pair = state.content.combinations?.pairs.find((one) => one.room === HILL && one.target === 'grievance_at_the_gate'
    && one.item === 'tuning_fork');
  assert.ok(pair?.say && written(pair.say), 'doc 110\'s wrong try');
  const livery = state.content.combinations?.pairs.find((one) => one.room === 'livery' && one.item === 'tuning_fork');
  assert.ok(livery?.rules?.some((rule) => rule.say === pair.say), 'B3\'s own line, as doc 110 says ("the existing line")');
});

test('the hearse and its mule are declared only once their picture is in the repository', async () => {
  const content = await loadContent(fsReader);
  // The picture the extractor waits for, as tools/extract-content.mjs declares it (HEARSE_FIGURE).
  const extractor = readFileSync(resolve(ROOT, 'tools/extract-content.mjs'), 'utf8');
  const sheet = /HEARSE_FIGURE = \{\s*sheet: '([^']+)'/.exec(extractor)?.[1];
  assert.ok(sheet, 'the extractor names the picture it waits for');
  const drawn = existsSync(resolve(ROOT, sheet));
  const manifest = JSON.parse(readFileSync(resolve(ROOT, 'content/manifest.json'), 'utf8')) as { ambient: string[] };
  assert.equal(manifest.ambient.includes('content/ambient/procession-hearse.json'), drawn, 'listed exactly when drawn');
  assert.equal(content.ambient.has('procession_hearse'), drawn);
  assert.equal(existsSync(resolve(ROOT, 'content/ambient/procession-hearse.json')), drawn);
});

test('while the prayer runs the mourners bow their heads and shut their eyes, and one of them peeks now and then', async () => {
  const { state, ambient } = await inFixture('r14-stall-a');
  const mourners = () => { ambient.arrived(); return ambient.present.find((npc) => npc.id === 'procession_mourners')!; };
  const standing = mourners().sprite!;
  const variant = mourners().spriteWhen?.find((one) => one.when.T_HILL_PRAYER === true);
  assert.ok(variant?.sprite.sheet && variant.sprite.sheet !== standing.sheet, 'a bowed sheet of their own, for the prayer');
  assert.ok(existsSync(resolve(ROOT, variant.sprite.sheet)), 'and it is drawn');
  state.interact(target(state, 'reverend_sowerby_at_the_gate'), 'TALK_TO');
  const praying = mourners().sprite!;
  assert.equal(praying.sheet, variant.sprite.sheet, 'they bow when he begins');
  assert.deepEqual(praying.frames, variant.sprite.frames);
  assert.ok((praying.breaks ?? []).some((run) => run.includes(1)), 'the peek is a break, now and then');
  assert.ok(!(praying.breaks ?? []).some((run) => run[0] === 0 && run.length === 1), 'and the rest is the bowed frame');
  // Registered to the rest frame: the same size, so the group does not jump as they bow.
  assert.deepEqual(praying.frames[0]!.slice(2), standing.frames[0]!.slice(2));
  const { ambient: later } = await inFixture('r14-stall-b', { T_HILL_PRAYER: false });
  later.arrived();
  assert.equal(later.present.find((npc) => npc.id === 'procession_mourners')!.sprite!.sheet, standing.sheet,
    'without the prayer they stand as at the funeral');
});

test('the hearse and its mule stand at the gate, and he walks round them, never through', async () => {
  const content = await loadContent(fsReader);
  const hitch = content.ambient.get('procession_hearse');
  if (!hitch) return; // waits on its picture (the test above holds when that is)
  const { state } = await inFixture('r14-stall-a');
  assert.ok(state.room.ambient?.includes('procession_hearse'), 'cast in Room 14');
  const floor = new WalkBoxes(state.room.walkBoxes!, (when) => state.flags.test(when));
  assert.equal(floor.boxAt(hitch.x, hitch.y - 10), undefined, 'no floor under the hitch while it stands there');
  assert.ok(floor.boxAt(hitch.x, hitch.y + 30), 'and floor in front of it, to walk past');
  state.flags.set('T_PROCESSION_STALLED', false);
  const empty = new WalkBoxes(state.room.walkBoxes!, (when) => state.flags.test(when));
  assert.ok(empty.boxAt(hitch.x, hitch.y - 10), 'and the grass is floor again once it has gone');
});

/**
 * THE GROUP FACES THE HEARSE (Tyler, 2026-11-09: "are the mourners all looking the wrong direction now?"; doc 55
 * section 8). The funeral's group is drawn facing left, toward the grave. At the gate the hearse stands on their
 * right, so here every cell is the funeral's cell mirrored, standing and bowed alike.
 */
test('at the gate the group turns toward the hearse on its right', async () => {
  const content = await loadContent(fsReader);
  const group = content.ambient.get('procession_mourners')!;
  const hitch = content.ambient.get('procession_hearse');
  const funeral = [...content.ambient.values()].find((one) => one.room !== group.room
    && one.sprite?.sheet === 'art/actors/room-31-mourners-master.png');
  assert.ok(funeral, 'the funeral still has its own group, facing the grave');
  if (hitch) assert.ok(hitch.x > group.x, 'the hearse is on their right');
  const pixels = (path: string) => readPng(readFileSync(resolve(ROOT, path))) as { width: number; pixels: Uint8Array };
  const mirrored = (gate: string, source: string, frames: number[][]) => {
    const a = pixels(gate);
    const b = pixels(source);
    for (const [x, y, w, h] of frames) {
      for (let row = y!; row < y! + h!; row += 7) {
        for (let col = 0; col < w!; col += 3) {
          const at = (row * a.width + x! + col) * 4;
          const from = (row * b.width + x! + (w! - 1 - col)) * 4;
          for (let channel = 0; channel < 4; channel += 1) {
            if (a.pixels[at + channel] !== b.pixels[from + channel]) return false;
          }
        }
      }
    }
    return true;
  };
  assert.ok(mirrored(group.sprite!.sheet, 'art/actors/room-31-mourners-master.png', group.sprite!.frames),
    'standing at the gate, they face the hearse, not the grave they face at the funeral');
  const bowed = group.spriteWhen?.find((one) => one.when.T_HILL_PRAYER === true)?.sprite;
  assert.ok(bowed && mirrored(bowed.sheet!, 'art/actors/room-14-mourners-bowed.png', bowed.frames!),
    'and bowed for the prayer, the same way');
});

/**
 * HE PRAYS WITH HIS EYES SHUT (Tyler, 2026-11-09: "Fix all the things that are rough"; errata 240). The line said
 * during the prayer has his eyes shut, so while it runs he is drawn praying, on frames the size of his own so he
 * does not shift; without it he is as he was.
 */
test('while the prayer runs the one praying is drawn praying, and not otherwise', async () => {
  const { ambient } = await inFixture('r14-stall-b', { T_HILL_PRAYER: true });
  ambient.arrived();
  const praying = ambient.present.find((npc) => npc.id === 'procession_sowerby')!.sprite!;
  const { ambient: before } = await inFixture('r14-stall-b', { T_HILL_PRAYER: false });
  before.arrived();
  const standing = before.present.find((npc) => npc.id === 'procession_sowerby')!.sprite!;
  assert.notEqual(praying.sheet, standing.sheet, 'a sheet of his own for the prayer');
  assert.ok(existsSync(resolve(ROOT, praying.sheet)), 'and it is drawn');
  assert.deepEqual(praying.frames[0]!.slice(2), standing.frames[0]!.slice(2), 'the same size, so he does not shift');
  assert.ok((praying.breaksThatSpeak ?? []).length > 0, 'and the prayer is still said on his breaks');
});
