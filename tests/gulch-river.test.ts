/**
 * FIDDLER'S GULCH, ROOM 53: THE RIVER (reference/fiddlers-gulch/brief.md, "What the engine needs" 7; doc 109; errata 208).
 *
 * G7, Duel One on the bar: Vessel calls it in the grog tent (VES_G1 option 6, B4, or the replay) and it is fought here,
 * when the player comes down to the river. Doc 03's duel, with doc 109's differences: the rule-keeper recites the bar's rules
 * in place of Sowerby's handbill, he scores with pebbles (doc 45 R53-PEBBLE), the panner mutters each counter, and after
 * the loss the rule-keeper has the last word. Then the bar's LOOK is the one after Duel One.
 *
 * And the water: the ford is level and knee-deep, so a man in it is masked from the knee down by one plane and nowhere
 * else; the panner stands in the channel beside the bar behind his own.
 *
 * Every line asserted here is read from doc 109 or from the content extracted from the documents, never typed here.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { ambientHere } from '../engine/core/Ambient.ts';
import { DuelSession } from '../engine/core/Assay.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import type { AmbientFile, Interactable } from '../engine/core/types.ts';
// @ts-expect-error -- a plain .mjs module with no declarations; it reads 8-bit RGBA PNGs.
import { readPng } from '../tools/lib/png.mjs';

// PLAYS: G7

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const doc109 = readFileSync(resolve(ROOT, 'docs/109-fiddlers-gulch-lines.md'), 'utf8');
const section = (heading: string) => {
  const at = doc109.search(new RegExp(`\\n${heading.replace(/[()]/g, '\\$&')}(?: |\\n)`));
  assert.ok(at >= 0, `doc 109 has ${heading}`);
  return doc109.slice(at + 1, doc109.indexOf('\n---', at + 1));
};
const quotes = (text: string) => [...text.replace(/\*\([^)]*\)\*/g, '').matchAll(/"([^"]+)"/g)].map((m) => m[1]!);
const BAR_DUEL = section('## DUEL ONE, ON THE BAR');
const SPLIT = BAR_DUEL.indexOf('*After each exchange');
const RULES = quotes(BAR_DUEL.slice(0, SPLIT).split('\n').filter((one) => one.startsWith('> **')).join('\n'));
const CLOSE = quotes(BAR_DUEL.slice(SPLIT).split('\n').filter((one) => one.startsWith('> **')).join('\n'));
const BAR_AFTER = quotes(section('### THE BAR').split('\n').find((one) => one.startsWith('*After Duel One:*'))!)[0]!;

const ROOM = (await JSON.parse(readFileSync(resolve(ROOT, 'proofs/readiness/room-53.sources.json'), 'utf8')));

const inState = async (fixtureId: string) => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  const fixture = content.fixtures.get(fixtureId);
  assert.ok(fixture && state.applyFixture(fixture), `fixture ${fixtureId} applies`);
  assert.equal(ROOM.room, 53);
  return state;
};
const here = (state: GameState) => [...state.content.ambient.values()]
  .filter((npc) => npc.room === state.roomId || npc.placements?.[state.roomId])
  .filter((npc) => ambientHere(npc, state.roomId, (when) => state.flags.test(when)));
const target = (state: GameState, id: string): Interactable => {
  const found = state.findTarget(id);
  assert.ok(found, `${id} is here`);
  return found;
};

test('G7: Vessel called it in the tent; coming down to the river, Duel One is fought on the bar', async () => {
  const state = await inState('r53-b');
  const accost = state.room.onEnter?.accost;
  assert.ok(accost?.duel && state.flags.test(accost.when), 'the call is answered on entering');
  const duel = state.content.assay!.duels[accost.duel]!;
  const people = here(state);
  const vessel = people.find((npc) => npc.id === accost.npc)!;
  assert.ok(vessel, 'Vessel is on the bar');
  assert.equal(duel.opponent, vessel.id);
  const judge = people.find((npc) => npc.id === duel.pencil)!;
  assert.ok(judge, 'the rule-keeper is on the bar with him');
  assert.ok(people.some((npc) => npc.id === duel.bystander), 'the panner is in the water beside it');
  assert.equal(accost.approach, true, 'the hero walks out to face him');

  // The rule-keeper's rules, in place of Sowerby's handbill, then Vessel's first boast.
  const intro = state.dialogue.duelIntro(accost.duel);
  const said = intro.filter((one) => !one.direction).map((one) => one.line);
  assert.deepEqual(said.slice(0, RULES.length), RULES, 'doc 109: the rules of the bar, all of them, in order');
  assert.ok(intro.slice(0, -1).every((one) => one.speaker === judge.id), 'the rule-keeper recites them');
  assert.equal(intro.at(-1)!.speaker, vessel.id, 'then Vessel throws');

  state.dialogue.startDuel(vessel.tree!, accost.duel);
  for (let round = 0; round < 5 && state.dialogue.isActive; round += 1) state.dialogue.select('w0');
  assert.equal(state.dialogue.isActive, false, 'he called it: when it ends, the conversation is over');
  assert.ok(state.puzzleComplete(duel.puzzle), 'B5, lost on the bar');
  assert.equal(state.flags.get('T_DUEL_ONE_LOST'), true);
  assert.equal(state.flags.get('T_DUEL_ONE_CALLED'), false, 'the call is answered');
  assert.ok(!here(state).some((npc) => npc.id === vessel.id || npc.id === judge.id), 'they go back up to the tent');
  assert.equal(state.interact(target(state, 'bar'), 'LOOK_AT').say, BAR_AFTER, 'and the bar remembers');
});

test('on the bar the panner mutters each counter, a point is a pebble, and the rule-keeper has the last word', async () => {
  const content = await loadContent(fsReader);
  const assay = content.assay!;
  const [id, duel] = Object.entries(assay.duels).find(([, one]) => one.markCue)!;
  assert.equal(content.sounds?.cues?.[duel.markCue!] !== undefined, true, 'the pebble is a cue that sounds');
  const session = new DuelSession(assay, id, new Set());
  const lines = [];
  let last;
  for (let round = 0; round < 5; round += 1) {
    last = session.commit(session.offered()[0]!.id);
    lines.push(...last.lines);
    if (last.ended) break;
  }
  const muttered = lines.filter((one) => one.speaker === duel.bystander);
  assert.equal(muttered.length, 4, 'the panner mutters pairs 1 to 4, and nobody the repeat (errata 73 D)');
  const marks = lines.filter((one) => one.mark);
  assert.ok(marks.length >= 5, 'every point is written down');
  assert.ok(marks.every((one) => one.speaker === duel.pencil && one.markCue === duel.markCue), 'by the rule-keeper, with a pebble');
  assert.ok(last!.ended);
  assert.deepEqual(last!.lines.filter((one) => one.speaker === duel.pencil && !one.mark).map((one) => one.line), CLOSE,
    'after the loss dialogue: "Five to nothing. Rule four."');
  // Doc 03's own loss dialogue is said by Vessel's figure here, whoever doc 03 wrote it for.
  const vessel = [...content.ambient.values()].find((npc) => npc.id === duel.opponent)!;
  const speakers = new Set(lines.map((one) => one.speaker));
  for (const one of speakers) {
    assert.ok([duel.opponent, duel.pencil, duel.bystander, content.actor.id, vessel.speaksAs].includes(one),
      `${one} speaks on the bar, and is nobody there`);
  }
});

test('the ford is knee-deep and level: one plane masks a man in it from the knee down, and nothing on the bank or the bar', async () => {
  const content = await loadContent(fsReader);
  const room = content.rooms.get('gulch_river')!;
  const ford = room.walkBoxes!.find((box) => box.clipPlane === 1)!;
  assert.ok(ford, 'a walk box on plane 1');
  const ys = ford.points.map((point) => point.y);
  const xs = ford.points.map((point) => point.x);
  const plane = room.occlusionPlanes!.find((one) => one.level === 1)!;
  const mask = readPng(readFileSync(resolve(ROOT, plane.mask))) as { width: number; pixels: Uint8Array };
  const on = (x: number, y: number) => (mask.pixels[(y * mask.width + x) * 4] ?? 0) > 128;
  const curve = (y: number) => {
    const scale = ford.scaleMode as { farY: number; farHeight: number; nearY: number; nearHeight: number };
    return scale.farHeight + ((scale.nearHeight - scale.farHeight) * (y - scale.farY)) / (scale.nearY - scale.farY);
  };
  const mid = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
  const feet = Math.max(...ys);
  assert.ok(on(mid, feet - 4), 'his shins are under the water');
  assert.ok(!on(mid, Math.round(feet - 0.5 * curve(feet))), 'his waist is not');
  assert.ok(Math.max(...ys) - Math.min(...ys) <= 30, 'the ford is one level band');
  // Off the ford, in the same rows, the bank and the bar are dry: nothing there is masked.
  const bank = room.walkBoxes!.find((box) => box.id !== ford.id && box.points.some((p) => p.y >= feet) && box.points.some((p) => p.y <= feet - 10))!;
  assert.ok(!on(Math.min(...bank.points.map((p) => p.x)) + 20, feet - 4), 'the bank is dry');
  const panner = [...content.ambient.values()].find((npc) => npc.room === 'gulch_river' && npc.clipPlane)!;
  const theirs = room.occlusionPlanes!.find((one) => one.level === panner.clipPlane)!;
  const water = readPng(readFileSync(resolve(ROOT, theirs.mask))) as { width: number; pixels: Uint8Array };
  const wet = (x: number, y: number) => (water.pixels[(y * water.width + x) * 4] ?? 0) > 128;
  assert.ok(wet(panner.x, panner.y - 10), 'the panner stands in the water to the knee');
  assert.ok(!wet(panner.x, Math.round(panner.y - 0.5 * curve(panner.y))), 'and not to the waist');
});

test('the panner: his tree and his barks are doc 109\'s', async () => {
  const state = await inState('r53-a');
  const panner = here(state).find((npc) => npc.tree && npc.barkTurns)! as AmbientFile;
  assert.ok(panner);
  const doc = section('### THE PANNER');
  assert.deepEqual(panner.barkTurns![0]!.lines, quotes(doc.split('\n').find((one) => one.startsWith('**Barks**'))!));
  state.dialogue.start(panner.tree!);
  const opening = quotes(doc.split('\n').find((one) => one.startsWith('> **'))!);
  const tree = state.content.dialogue.get(panner.tree!)!;
  assert.equal(tree.nodes[tree.start!]!.prompt, opening.at(-1), 'his opening is doc 109\'s');
  assert.ok(state.dialogue.presentOptions().some((one) => one.option.tag === 'COMIC'));
});
