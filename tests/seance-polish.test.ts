/**
 * THE SÉANCE'S FOUR ROUGH EDGES (errata 239; Tyler, 2026-11-09, shown what was still rough after errata 238: "Fix all
 * the things that are rough"). Each test here fails with its defect put back, and says how it was put back.
 *
 *   1  THE TENT'S DARK REACHES THAD. With the lamp turned down the plate and the group went dark and he stood in his
 *      own even light. RoomFile.figureLightWhen grades the figures it names while a state holds.
 *   2  UNDER THE TABLE HE IS NOT DRAWN AND NOT WALKED. RoomFile.actorHiddenWhen; he is back, standing where he went
 *      under, when the conversation is left or the dead have spoken; it survives a save, and can always be left.
 *   3  THE LINES ARE READ BEFORE THE LIST IS OFFERED. A response that opens a tree owes it until its lines have been
 *      read (GameState.owesTree), and the scene heard from under the table is the node's opening, said once.
 *   4  NO SLIVER OF THE PLATE'S CRYSTAL BALL beside the medium's hand: the tent's séance plates are the shipping plate
 *      with one small rectangle of its own curtain over it.
 *
 * Every line asserted is read from doc 111. Ids come from the fixtures and the content, never typed as names of the
 * fiction.
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
import { hiddenClick } from '../engine/core/Standing.ts';
import type { AmbientFile, FlagWrites, RoomFile, SpokenLine } from '../engine/core/types.ts';
import { figureGrade, roomFigureLight } from '../engine/render/Renderer.ts';
// @ts-expect-error -- a plain .mjs module with no declarations; the check this file holds to its lesson.
import { DARK_PLATE, darkStates, measureCast } from '../tools/check-figure-light.mjs';
// @ts-expect-error -- a plain .mjs module with no declarations; it reads 8-bit RGBA PNGs.
import { readPng } from '../tools/lib/png.mjs';
import { HeadlessPlayer } from './lib/headless-player.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const content = await loadContent(fsReader);
const doc111 = readFileSync(resolve(ROOT, 'docs/111-scenes-b-and-c.md'), 'utf8');
const words = (one: SpokenLine) => (typeof one === 'string' ? one : one.line);

const LIT = 'r16-seance-a';
const DARK = 'r16-seance-b';
const fixture = (id: string) => {
  const found = content.fixtures.get(id);
  assert.ok(found, `fixture ${id}`);
  return found;
};
const TENT = fixture(LIT).room;
const tent = content.rooms.get(TENT)!;
const ACTOR = content.actor.id;

const inFixture = (id: string, flags: FlagWrites = {}, storage = new MemoryStorage()) => {
  const state = new GameState(content, storage);
  const one = fixture(id);
  assert.ok(state.applyFixture({ ...one, flags: { ...one.flags, ...flags } }));
  const player = new HeadlessPlayer(state);
  player.ambient.arrived();
  return { state, player, storage };
};
/** The subject whose USE takes him under: the room's one hotspot with a rule that writes the hidden state's flag. */
const hiddenFlags = Object.keys(tent.actorHiddenWhen?.when ?? {});
const table = tent.hotspots.find((one) => one.responses?.USE?.some((rule) => hiddenFlags.some((flag) => rule.set?.[flag] === true)));
assert.ok(table, 'a subject in the tent takes him out of sight');
const target = (state: GameState, id: string) => {
  const found = state.targets.find((one) => one.id === id);
  assert.ok(found, `${id} is a target in ${state.roomId}`);
  return found;
};
const grade = (state: GameState, id: string, sheet?: string) =>
  figureGrade(roomFigureLight(state.room, (when) => state.flags.test(when)), id, sheet);
const plateOf = (state: GameState) => {
  const entry = (state.room.plateWhen ?? []).find((one) => state.flags.test(one.when));
  return entry ? state.room.plates![entry.plate]! : state.room.background!;
};
const exitOf = (state: GameState) => {
  const out = state.dialogue.presentOptions().find((one) => one.option.tag === 'EXIT');
  assert.ok(out, 'the conversation has a way out');
  return out.option.id;
};
/** Under the table with the scene heard and the list up, as a player gets there. */
const under = (storage = new MemoryStorage()) => {
  const made = inFixture(DARK, {}, storage);
  made.player.verb(table.id, 'USE');
  return made;
};

/* ---- 1 · the tent's dark reaches Thad ---------------------------------------- */

test('errata 239, 1: with the lamp turned down the room grades the player darker, and only then', () => {
  const dark = inFixture(DARK).state;
  const down = grade(dark, ACTOR);
  assert.ok(down?.light, 'in the dark the room has a light for him');
  assert.ok(down.light.every((channel) => channel < 0.6), `and it is a dark one (${down.light.join(', ')})`);
  assert.equal(grade(inFixture(LIT).state, ACTOR), null, 'lit, he is drawn as he always was');
  assert.equal(grade(inFixture(DARK, { T_SEANCE_ON: false, T_MOTT_SPOKE: true }).state, ACTOR), null, 'and when the lamp has come up');
  // The group is not graded a second time: its dark sheet is painted dark.
  const group = [...content.ambient.values()].find((npc: AmbientFile) => npc.room === TENT && npc.spriteWhen?.length);
  assert.ok(group, 'the séance is a figure with a sheet for the dark');
  for (const variant of group.spriteWhen!) assert.equal(grade(dark, group.id, variant.sprite.sheet), null, 'the dark sheet is drawn as painted');
});

test('errata 239, 1: the figure-light check holds a room that goes dark to taking the player with it', () => {
  type Dark = { room: string; plateRatio: number; playerRatio: number; flagged: boolean };
  type Measured = { room: string; figure: string; ratio: number } & Record<string, number>;
  const found = (darkStates() as Dark[]).filter((one) => one.room === TENT);
  assert.equal(found.length, 1, 'the tent has one plate that is the room gone dark');
  const [state] = found;
  assert.ok(state!.plateRatio < DARK_PLATE);
  assert.ok(!state!.flagged, `he is at ${state!.playerRatio.toFixed(2)} of himself beside a plate at ${state!.plateRatio.toFixed(2)}`);
  // THE DEFECT PUT BACK: the room with no light by state. He stays at full brightness and the check says so.
  const before = (darkStates({ rooms: { [TENT]: { figureLightWhen: undefined } } }) as Dark[]).find((one) => one.room === TENT);
  assert.ok(before?.flagged && before.playerRatio === 1, 'ungraded, he is flagged');
  // And the group's dark sheet is measured beside Thad as he is drawn in the dark, not in the lit tent.
  const measured = measureCast().measured as Measured[];
  const sheets = measured.filter((one) => one.room === TENT && one.figure.includes('('));
  assert.ok(sheets.length >= 1, 'the dark sheet is measured');
  const lit = measured.find((one) => one.room === TENT && sheets[0]!.figure.startsWith(`${one.figure} (`))!;
  for (const one of sheets) {
    assert.ok(one[ACTOR]! < lit[ACTOR]! * 0.6, `beside the dark sheet he is ${one[ACTOR]!.toFixed(1)}, against ${lit[ACTOR]!.toFixed(1)} lit`);
    assert.ok(Math.abs(one.ratio - lit.ratio) < 0.2, `and the group is as far from him dark (${one.ratio.toFixed(2)}) as lit (${lit.ratio.toFixed(2)})`);
  }
});

/* ---- 2 · under the table ----------------------------------------------------- */

test('errata 239, 2: under the table he is not drawn and does not walk, and both ways out bring him back', () => {
  const lit = inFixture(LIT).state;
  assert.equal(lit.playerHidden, false, 'at the séance, lit, he is drawn');
  const dark = inFixture(DARK);
  assert.equal(dark.state.playerHidden, false, 'and in the dark, standing');
  // He goes under from where the subject stands him, and nothing moves him while he is there.
  assert.ok(table.walkTo, 'the table says where he stands to go under');
  dark.player.verb(table.id, 'USE');
  assert.equal(dark.state.playerHidden, true, 'under the cloth he is not drawn');
  assert.equal(dark.state.playerStays, true, 'and stays where he is');
  // By the conversation's way out.
  dark.player.choose(exitOf(dark.state));
  assert.equal(dark.state.dialogue.isActive, false);
  assert.equal(dark.state.playerHidden, false, 'the way out brings him out from under it');
  // Under again, and by the row that ends the séance.
  dark.player.verb(table.id, 'USE');
  assert.equal(dark.state.playerHidden, true, 'under again');
  const spoken = dark.state.dialogue.presentOptions().find((one) => one.option.ends && one.option.tag !== 'EXIT');
  assert.ok(spoken, 'the row that ends it is on offer');
  dark.player.choose(spoken.option.id);
  assert.equal(dark.state.playerHidden, false, 'and when the dead have spoken he is standing in the tent again');
  assert.equal(dark.state.playerStays, false);
});

test('errata 239, 2: a click while he is hidden never walks him, and a verb on a subject is still answered', () => {
  const ground = { target: false, walk: false, transit: false, person: false };
  assert.equal(hiddenClick(ground), 'stay', 'the floor');
  assert.equal(hiddenClick({ ...ground, target: true, walk: true }), 'stay', 'a walk to a subject');
  assert.equal(hiddenClick({ ...ground, target: true, transit: true }), 'stay', 'a door');
  assert.equal(hiddenClick({ ...ground, target: true, person: true }), 'stay', 'a person to walk up to');
  assert.equal(hiddenClick({ ...ground, target: true }), 'answer', 'a verb on a subject, from where he is');
  // The room's own data: every way out of the tent is a transit or a walk, so none of them is taken from under the table.
  const { state } = under();
  for (const exit of state.room.exits) assert.ok(exit.to !== undefined, `${exit.id} is a doorway, which a hidden man does not go through`);
});

test('errata 239, 2: he can always get out from under the table, whatever was saved', () => {
  // THE ONE STATE WITH NO CONVERSATION OPEN: a save made as he went under, before the list was up.
  const storage = new MemoryStorage();
  const { state } = inFixture(DARK, {}, storage);
  const result = state.interact(target(state, table.id), 'USE');
  assert.ok(result.opens && !state.dialogue.isActive, 'under, the tree owed');
  state.save(1);
  const loaded = new GameState(content, storage);
  assert.ok(loaded.load(1));
  assert.equal(loaded.playerStays, true, 'loaded under the cloth');
  assert.equal(loaded.dialogue.isActive, false);
  // The subject that hid him answers from where he is, and its conversation has a way out that unhides him.
  const again = loaded.interact(target(loaded, table.id), 'USE');
  const tree = again.opens ?? loaded.dialogue.activeTreeId;
  assert.ok(tree, 'the table opens the conversation again');
  if (again.opens) loaded.dialogue.start(again.opens);
  loaded.dialogue.select(exitOf(loaded));
  assert.equal(loaded.playerStays, false, 'and its way out brings him out');
  // The hidden state needs the subject that ends it: it never holds once the séance is over.
  const over = inFixture(DARK, { T_UNDER_TABLE: true, T_SEANCE_ON: false }).state;
  assert.equal(over.playerHidden, false, 'no table to come out from under, so he is not under it');
  // And nobody walks into the tent under its table (a save from before errata 239 could).
  const old = inFixture(DARK, { T_UNDER_TABLE: true }).state;
  old.enterRoom(tent.exits.find((exit) => exit.to)!.to!);
  old.enterRoom(TENT);
  assert.equal(old.playerHidden, false, 'walking in, he is standing');
});

/* ---- 3 · the lines before the list ------------------------------------------- */

test('errata 239, 3: every line of the scene heard from under the table is said before any option is presented', () => {
  const { state } = inFixture(DARK);
  const result = state.interact(target(state, table.id), 'USE');
  // The list is NOT up while there is anything to read. (The defect put back: GameState.applyInteraction starting the
  // tree at once makes isActive true here, and `opens` absent.)
  assert.equal(state.dialogue.isActive, false, 'no conversation is open while the lines are read');
  assert.ok(result.opens, 'the response names the tree it owes');
  const tree = content.dialogue.get(result.opens)!;
  const own = [result.say, ...(result.then ?? []).map(words)];
  const opening = state.dialogue.openingOf(result.opens, true);
  // What is read before the list, in order: the response's own words, then the node's opening.
  const read = [...own, ...opening.map((one) => one.line)];
  // Doc 111's block, as written: every quoted line and every direction of THE SÉANCE, in order.
  const block = doc111.slice(doc111.indexOf('\n**THE SÉANCE** ·'));
  const scene = block.slice(0, block.indexOf('\n**`')).split('\n').filter((row) => row.startsWith('> '));
  // A pause is said as "…" (doc 58 rule 2; doc 130: nothing printed).
  const expected = scene.flatMap((row) => [...row.matchAll(/\*\(([^)]+)\)\*|"([^"]+)"/g)]
    .map((m) => (m[1] !== undefined && /^(beat|pause|long pause)$/i.test(m[1]) ? '…' : m[1] ?? m[2]!)));
  assert.ok(expected.length >= 8, 'doc 111 writes the scene');
  assert.deepEqual(opening.map((one) => one.line), expected, 'the opening is the scene, whole and in order');
  assert.ok(own.every((line) => typeof line === 'string' && doc111.includes(line)), 'after his own two lines going under');
  assert.equal(read.length, own.length + expected.length);
  // Two voices, each line by its speaker, and none of it Thad's.
  assert.ok(new Set(opening.map((one) => one.speaker)).size >= 2 && opening.every((one) => one.speaker !== ACTOR));
  // Only now the list.
  state.dialogue.start(result.opens);
  assert.ok(state.dialogue.presentOptions().length >= 3, 'the list is offered when the scene has been heard');
  assert.equal(state.flags.get(tree.nodes[tree.start]!.openingOnce!), true, 'and the scene is marked heard');
});

test('errata 239, 3: taken up again after the way out, the list opens with nothing said and the scene is not replayed', () => {
  const { state, player } = under();
  const tree = state.dialogue.activeTreeId!;
  player.choose(exitOf(state));
  const back = state.interact(target(state, table.id), 'USE');
  assert.equal(back.say, null, 'nothing said');
  assert.equal(back.then?.length ?? 0, 0);
  assert.equal(back.opens, undefined, 'nothing to read, so nothing is owed');
  assert.equal(state.dialogue.activeTreeId, tree, 'the list is up at once');
  assert.deepEqual(state.dialogue.openingOf(tree, true), [], 'and the scene is not said again');
  assert.equal(state.playerHidden, true, 'under the cloth again');
});

test('errata 239, 3: any response that speaks and opens a tree owes the tree until its lines are read', () => {
  // The rule is the engine's, not the tent's: every room's every rule with words and a tree.
  let found = 0;
  for (const room of content.rooms.values() as IterableIterator<RoomFile>) {
    for (const spot of [...room.hotspots, ...room.exits]) {
      for (const rules of Object.values(spot.responses ?? {})) {
        for (const rule of rules) {
          if (!rule.dialogue || (!rule.say && !rule.then?.length)) continue;
          found += 1;
          const state = new GameState(content, new MemoryStorage());
          assert.equal(state.owesTree({ dialogue: rule.dialogue, say: rule.say ?? null, then: rule.then }), true, `${room.id}/${spot.id}`);
        }
      }
    }
  }
  assert.ok(found >= 2, 'the harness room and the tent each have one');
  const state = new GameState(content, new MemoryStorage());
  assert.equal(state.owesTree({ dialogue: null, say: 'x', then: undefined }), false, 'no tree, nothing owed');
});

/* ---- save and load, in each state ---------------------------------------------- */

test('errata 239: a save in each state of the séance restores the grade, the plate, the hidden man and the conversation', () => {
  const states: [string, () => { state: GameState; storage: MemoryStorage }][] = [
    ['lit', () => inFixture(LIT)],
    ['dark', () => inFixture(DARK)],
    ['under the table, the list up', () => under()],
    ['out by the way out, the scene heard', () => { const made = under(); made.player.choose(exitOf(made.state)); return made; }],
    ['the dead have spoken', () => {
      const made = under();
      made.player.choose(made.state.dialogue.presentOptions().find((one) => one.option.ends && one.option.tag !== 'EXIT')!.option.id);
      return made;
    }],
  ];
  const seen = new Set<string>();
  for (const [name, make] of states) {
    const { state, storage } = make();
    state.rememberStanding(table.walkTo!.x, table.walkTo!.y);
    state.save(1);
    const loaded = new GameState(content, storage);
    assert.ok(loaded.load(1), `${name}: loads`);
    assert.deepEqual(loaded.flags.snapshot(), state.flags.snapshot(), `${name}: flags`);
    assert.equal(loaded.playerHidden, state.playerHidden, `${name}: hidden`);
    assert.deepEqual(grade(loaded, ACTOR), grade(state, ACTOR), `${name}: his grade`);
    assert.equal(plateOf(loaded), plateOf(state), `${name}: the plate`);
    assert.deepEqual(loaded.dialogue.positionSnapshot(), state.dialogue.positionSnapshot(), `${name}: the conversation`);
    assert.deepEqual(loaded.resumeStanding(null), [table.walkTo!.x, table.walkTo!.y], `${name}: where he stands`);
    if (loaded.dialogue.isActive) {
      assert.deepEqual(loaded.dialogue.presentOptions().map((one) => one.option.id), state.dialogue.presentOptions().map((one) => one.option.id));
    }
    seen.add(`${loaded.playerHidden}/${grade(loaded, ACTOR) !== null}/${plateOf(loaded)}`);
  }
  assert.ok(seen.size >= 4, 'the states differ in what is drawn, so the save is tested on each');
});

/* ---- 4 · the sliver ------------------------------------------------------------ */

type Png = { width: number; height: number; pixels: Uint8Array };
const decoded = new Map<string, Png>();
const png = (path: string): Png => {
  if (!decoded.has(path)) decoded.set(path, readPng(readFileSync(resolve(ROOT, path))) as Png);
  return decoded.get(path)!;
};

test('errata 239, 4: the séance plates are the shipping plate but for one patch of its own curtain, and the dark one is that dimmed', () => {
  const spec = JSON.parse(readFileSync(resolve(ROOT, 'reference/room-16/seance-plate.json'), 'utf8')) as { patch: [number, number, number, number]; shift: number };
  const [px, py, pw, ph] = spec.patch;
  assert.ok(pw * ph <= 900, 'a small patch');
  const lit = inFixture(LIT).state;
  const dark = inFixture(DARK).state;
  assert.notEqual(plateOf(lit), tent.background, 'the séance has its own plate, lit');
  assert.notEqual(plateOf(dark), plateOf(lit), 'and another in the dark');
  assert.equal(plateOf(inFixture(DARK, { T_SEANCE_ON: false }).state), tent.background, 'the tent is its own plate when it is over');
  const own = png(tent.background!);
  const seance = png(plateOf(lit));
  const dimmed = png(plateOf(dark));
  assert.deepEqual([seance.width, seance.height, dimmed.width, dimmed.height], [own.width, own.height, own.width, own.height]);
  let outside = 0; let inside = 0; let offDim = 0; let dimRatio = 0; let n = 0;
  for (let y = 0; y < own.height; y += 1) {
    for (let x = 0; x < own.width; x += 1) {
      const i = (y * own.width + x) * 4;
      const inPatch = x >= px && x < px + pw && y >= py && y < py + ph;
      const from = inPatch ? (y * own.width + x - spec.shift) * 4 : i;
      for (let c = 0; c < 3; c += 1) {
        // Outside the patch, the shipping plate; inside it, the shipping plate's own pixel `shift` columns left.
        if (seance.pixels[i + c] !== own.pixels[from + c]) { if (inPatch) inside += 1; else outside += 1; }
        const lum = seance.pixels[i + c]!;
        if (lum >= 40) { dimRatio += dimmed.pixels[i + c]! / lum; n += 1; }
        if (dimmed.pixels[i + c]! > lum) offDim += 1;
      }
    }
  }
  assert.equal(outside, 0, 'not a pixel of the plate is changed outside the patch');
  assert.equal(inside, 0, 'and inside it every pixel is the plate\'s own curtain');
  assert.equal(offDim, 0, 'the dark plate is nowhere brighter than the lit one');
  assert.ok(Math.abs(dimRatio / n - 0.44) < 0.02, `the dark plate is the séance plate dimmed (x${(dimRatio / n).toFixed(3)})`);
});

test('errata 239, 4: nothing of the plate\'s ball, box or teapot shows past the group on the plate the séance is drawn over', () => {
  const group = [...content.ambient.values()].find((npc: AmbientFile) => npc.room === TENT && npc.spriteWhen?.length)!;
  const sheets = [group.sprite!, ...group.spriteWhen!.map((one) => ({ ...group.sprite!, ...one.sprite }))];
  const [, , w, h] = group.sprite!.frames[0]!;
  const left = group.x - Math.floor(w / 2);
  const top = group.y - (h - 1);
  // Covered in every frame of both sheets.
  const covered = (x: number, y: number) => sheets.every((sprite) => {
    const image = png(sprite.sheet);
    return sprite.frames.every(([sx, sy]) => x >= left && x < left + w && y >= top && y < top + h
      && (image.pixels[((sy + y - top) * image.width + sx + x - left) * 4 + 3] ?? 0) > 0);
  });
  const mask = png(tent.occlusionPlanes!.find((one) => one.mask)!.mask!);
  const onMask = (x: number, y: number) => (mask.pixels[(y * mask.width + x) * 4 + 3] ?? 0) > 0;
  const open: [number, number][] = [];
  for (let y = 0; y < mask.height; y += 1) for (let x = 0; x < mask.width; x += 1) if (onMask(x, y) && !covered(x, y)) open.push([x, y]);
  // THE DEFECT, AS IT WAS: over the shipping plate the group leaves a sliver of the ball open.
  assert.ok(open.length > 100, `over the shipping plate ${open.length} px of them show (errata 238 A: about 15 px square)`);
  // Every one of those pixels is inside the patch, where the séance plates hold curtain instead...
  const spec = JSON.parse(readFileSync(resolve(ROOT, 'reference/room-16/seance-plate.json'), 'utf8')) as { patch: [number, number, number, number]; shift: number };
  const [px, py, pw, ph] = spec.patch;
  for (const [x, y] of open) assert.ok(x >= px && x < px + pw && y >= py && y < py + ph, `${x},${y} shows past the group outside the patch`);
  // ...and the curtain the patch is filled from is curtain: none of it is the ball, the box or the teapot.
  for (let y = py; y < py + ph; y += 1) for (let x = px - spec.shift; x < px - spec.shift + pw; x += 1) assert.ok(!onMask(x, y), `${x},${y}: the patch is filled from the plate's table things`);
  // And the séance is drawn over those plates in both its states (the defect put back: no plate for the lit state).
  for (const id of [LIT, DARK]) assert.notEqual(plateOf(inFixture(id).state), tent.background, `${id}: drawn over the shipping plate, where the sliver shows`);
});
