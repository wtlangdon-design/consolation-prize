/**
 * SCENES B AND C'S ART, WIRED (errata 238; reference/act3-seance/handback.md, reference/act3-estate-sale/handback.md).
 *
 *   B - the séance is drawn in the tent exactly while it is on, lit or in the dark as the lamp is, and goes when the
 *       dead have spoken; the medium's standing figure is not drawn beside her seated one; the group covers the plate's
 *       own table and what stands on it; the five subjects are over what is drawn, and Frame's words come from his
 *       chair; the lamp is drawn in the state the flags say, and the tent darkens with it;
 *   C - the hen is at the hole's mouth the moment she is set down, and only until the coat; the raccoon comes halfway
 *       out in his emerging sheet, the size of the raccoon who sits there, and goes under the coat halfway out while
 *       the player holds the bundle (his coat-bundle clip, a frame a line); the hen's and the coat's icons are in the
 *       shipping sheet, and the money's is still owed.
 *
 * Every id is read from the fixtures and the content (the figure the séance's flag places, the figure the player sets
 * down, the subject whose TALK TO opens a tree), never typed as a name of the fiction.
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
import type { AmbientFile, FlagWrites } from '../engine/core/types.ts';
import { HeadlessPlayer } from './lib/headless-player.ts';
// @ts-expect-error -- a plain .mjs module with no declarations; it reads 8-bit RGBA PNGs.
import { readPng } from '../tools/lib/png.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const content = await loadContent(fsReader);
const png = (path: string) => readPng(readFileSync(resolve(ROOT, path))) as { width: number; height: number; pixels: Uint8Array };

const SEANCE = 'r16-seance-a';
const DARK = 'r16-seance-b';
const WANTED = 'r23-sale-a';
const fixture = (id: string) => {
  const found = content.fixtures.get(id);
  assert.ok(found, `fixture ${id}`);
  return found;
};
const TENT = fixture(SEANCE).room;
const HOLE_ROOM = fixture(WANTED).room;

const inFixture = (id: string, flags: FlagWrites = {}) => {
  const state = new GameState(content, new MemoryStorage());
  const one = fixture(id);
  assert.ok(state.applyFixture({ ...one, flags: { ...one.flags, ...flags } }));
  const player = new HeadlessPlayer(state);
  player.ambient.arrived();
  return { state, player };
};

const inTent = [...content.ambient.values()].filter((npc) => npc.room === TENT);
/** The séance: the figure its flag places in the tent. */
const group = inTent.find((npc) => npc.when?.T_SEANCE_ON === true);
/** The medium standing behind her table: the tent's figure with a tree. */
const medium = inTent.find((npc) => npc.tree && npc.id !== group?.id);
const atHole = [...content.ambient.values()].filter((npc) => npc.room === HOLE_ROOM);
/** The hen: the figure the player sets down at the hole. */
const hen = atHole.find((npc) => npc.setDown);
/** The raccoon back in the hole: the figure with a sheet for being halfway out. */
const raccoon = atHole.find((npc) => npc.spriteWhen?.some((one) => one.when.T_RACCOON_OUT === true));

/** A frame's opaque pixels, as room coordinates, drawn 1:1 with its bottom row (or `footRow`) on y. */
function opaque(sprite: NonNullable<AmbientFile['sprite']>, index: number, x: number, y: number): Set<number> {
  const image = png(sprite.sheet);
  const [sx, sy, w, h] = sprite.frames[index]!;
  const left = x - Math.floor(w / 2);
  const top = y - (sprite.footRow ?? h - 1);
  const out = new Set<number>();
  for (let row = 0; row < h; row += 1) {
    for (let col = 0; col < w; col += 1) {
      if ((image.pixels[((sy + row) * image.width + sx + col) * 4 + 3] ?? 0) > 0) out.add((top + row) * 4096 + left + col);
    }
  }
  return out;
}
const sheetOf = (npc: AmbientFile, when: FlagWrites) => {
  const variant = npc.spriteWhen?.find((one) => Object.entries(one.when).every(([flag, value]) => when[flag] === value));
  return { ...npc.sprite!, ...(variant?.sprite ?? {}) } as NonNullable<AmbientFile['sprite']>;
};

/* ---- B · the séance -------------------------------------------------------- */

test('scene B art: the séance is drawn exactly while it is on, lit or dark as the lamp is, and her standing figure is not', () => {
  assert.ok(group?.sprite && medium, 'the séance is a drawn figure in the tent, and the medium stands there too');
  assert.equal(group.posture, 'seated');
  const lit = inFixture(SEANCE);
  const here = (player: HeadlessPlayer) => player.present().map((one) => one.id);
  assert.ok(here(lit.player).includes(group.id), 'the séance, lit');
  assert.ok(!here(lit.player).includes(medium.id), 'her standing figure is not drawn beside her seated one');
  const litSheet = lit.player.present().find((one) => one.id === group.id)!.sprite!.sheet;
  const dark = inFixture(DARK);
  const darkSheet = dark.player.present().find((one) => one.id === group.id)!.sprite!.sheet;
  assert.notEqual(darkSheet, litSheet, 'the lamp down, the group is its dark sheet');
  assert.equal(litSheet, group.sprite.sheet);
  // The dark sheet is registered on the lit one: every frame the same size, so nothing moves when the lamp goes down.
  const darkFrames = sheetOf(group, { T_SEANCE_ON: true, T_SEANCE_DARK: true }).frames;
  for (const frame of darkFrames) assert.deepEqual(frame.slice(2), group.sprite.frames[0]!.slice(2));
  // When the dead have spoken it is over: he comes back to the tent as it was, the medium behind her table.
  const after = inFixture(DARK, { T_SEANCE_ON: false, T_MOTT_SPOKE: true });
  assert.ok(!here(after.player).includes(group.id), 'no séance');
  assert.ok(here(after.player).includes(medium.id), 'and she is standing again');
});

test('scene B art: when the séance ends in front of him the group fades in the lit sheet, the lamp come up', () => {
  const { state, player } = inFixture(DARK);
  assert.ok(group?.leaves && group.leaves.fade > 0, 'the group fades rather than vanishing');
  assert.ok(player.present().some((one) => one.id === group.id), 'in the dark');
  state.flags.set('T_SEANCE_ON', false);
  const going = player.present().find((one) => one.id === group.id);
  assert.ok(going, 'still drawn as it goes');
  assert.equal(going.sprite!.sheet, group.sprite!.sheet, 'in the lit sheet: the lamp has come up');
});

test('scene B art: the group covers the plate\'s own table and what stands on it, in every frame of both sheets', () => {
  const room = content.rooms.get(TENT)!;
  const frames = [group!.sprite!, sheetOf(group!, { T_SEANCE_ON: true, T_SEANCE_DARK: true })]
    .flatMap((sprite) => sprite.frames.map((_, i) => opaque(sprite, i, group!.x, group!.y)));
  const covered = (key: number) => frames.every((one) => one.has(key));
  // The ball, the strong box and the teapot, by the mask the plate's own objects were cut with (her clip plane).
  const plane = room.occlusionPlanes?.find((one) => one.level === group!.clipPlane || one.level === 1);
  assert.ok(plane?.mask, 'the tent has the mask of what stands on its table');
  const mask = png(plane.mask);
  let on = 0; let under = 0;
  for (let y = 0; y < mask.height; y += 1) for (let x = 0; x < mask.width; x += 1) {
    if ((mask.pixels[(y * mask.width + x) * 4 + 3] ?? 0) === 0) continue;
    on += 1;
    if (covered(y * 4096 + x)) under += 1;
  }
  assert.ok(on > 0 && under / on >= 0.96, `the plate's ball, box and teapot are ${(100 * under / on).toFixed(1)}% under the group`);
  // The table and the box under it, every pixel of the subjects that stand for them out of the séance.
  const [gx, , gw] = [group!.x - Math.floor(group!.sprite!.frames[0]![2] / 2), 0, group!.sprite!.frames[0]![2]];
  const beneath = room.hotspots.filter((one) => one.when?.T_SEANCE_ON === false && one.rect[1] >= 500
    && one.rect[0] >= gx && one.rect[0] + one.rect[2] <= gx + gw);
  assert.ok(beneath.length >= 2, 'the table and what is under it');
  for (const spot of beneath) {
    const [rx, ry, rw, rh] = spot.rect;
    let open = 0;
    for (let y = ry; y < ry + rh; y += 1) for (let x = rx; x < rx + rw; x += 1) if (!covered(y * 4096 + x)) open += 1;
    assert.ok(open / (rw * rh) <= 0.01, `${spot.id}: ${open} px of it show past the group`);
  }
});

test('scene B art: the five subjects are over what is drawn, Frame speaks from his chair, and nobody walks through the table', () => {
  const { state } = inFixture(SEANCE);
  const rest = opaque(group!.sprite!, 0, group!.x, group!.y);
  const subjects = state.room.hotspots.filter((one) => one.when?.T_SEANCE_ON === true);
  assert.equal(subjects.length, 5);
  const drawnUnder = (rect: [number, number, number, number]) => {
    const [rx, ry, rw, rh] = rect;
    let n = 0;
    for (let y = ry; y < ry + rh; y += 1) for (let x = rx; x < rx + rw; x += 1) if (rest.has(y * 4096 + x)) n += 1;
    return n / (rw * rh);
  };
  const props = (state.room.props ?? []).filter((one) => one.when?.T_SEANCE_ON === true);
  for (const spot of subjects) {
    const overProp = props.some((prop) => spot.rect[0] <= prop.x && prop.x <= spot.rect[0] + spot.rect[2] && spot.rect[1] < prop.y);
    if (overProp) continue;
    assert.ok(drawnUnder(spot.rect) >= 0.5, `${spot.id} is over the drawn group (${(100 * drawnUnder(spot.rect)).toFixed(0)}% of it)`);
  }
  // The one subject over no part of the group is over the lamp, drawn in both its states.
  assert.equal(props.length, 2, 'the lamp, lit and turned down');
  // Frame's voice is in his own box of the group, over his head.
  const members = (group!.sprite as { members?: { who: string; rect: number[] }[] }).members ?? [];
  assert.ok(members.length >= 6, 'the group says who sits where');
  const left = group!.x - Math.floor(group!.sprite!.frames[0]![2] / 2);
  const top = group!.y - group!.sprite!.frames[0]![3] + 1;
  for (const [speaker, voice] of Object.entries(state.room.voices ?? {})) {
    const box = members.find((one) => { const [x, y, w] = one.rect as [number, number, number, number]; return voice.x >= left + x && voice.x < left + x + w && voice.y >= top + y - 20; });
    assert.ok(box, `${speaker}'s words come from a sitter's place at the table, not from empty floor`);
  }
  // He stands beside the group for its subjects, never in front of it, where he would cover the table and the medium.
  const half = Math.floor(group!.sprite!.frames[0]![2] / 2);
  for (const spot of subjects) {
    assert.ok(spot.walkTo && (spot.walkTo.x < group!.x - half - 60 || spot.walkTo.x > group!.x + half + 60),
      `${spot.id}: he stands at ${spot.walkTo?.x}, in front of the group`);
  }
  // Nobody walks through the table: the floor while the séance is on stops in front of its chairs.
  const floor = state.room.walkBoxes!.filter((box) => box.enabledWhen?.T_SEANCE_ON === true);
  assert.ok(floor.length, 'a floor for the séance');
  for (const box of floor) {
    const xs = box.points.map((p) => p.x); const ys = box.points.map((p) => p.y);
    const inside = Math.min(...xs) < group!.x + 400 && Math.max(...xs) > group!.x - 400 && Math.min(...ys) < group!.y;
    assert.ok(!inside, `${box.id} runs under the group`);
  }
});

test('scene B art: the lamp and the tent are as the flags say', () => {
  for (const [id, lit] of [[SEANCE, true], [DARK, false]] as const) {
    const { state } = inFixture(id);
    const drawn = (state.room.props ?? []).filter((prop) => state.flags.test(prop.when));
    assert.equal(drawn.length, 1, `${id}: one lamp`);
    const plate = (state.room.plateWhen ?? []).find((one) => state.flags.test(one.when));
    // Errata 239: lit, it is the tent's séance plate (the shipping plate, the ball's sliver filled); dark, that dimmed.
    assert.ok(plate, `${id}: a plate for the séance`);
    assert.equal(state.flags.test(plate.when) && plate.when.T_SEANCE_DARK === true, !lit, `${id}: the tent is ${lit ? 'lit' : 'darkened'}`);
    const lantern = (state.room.lamps ?? []).filter((lamp) => lamp.at[1] < 300 && state.flags.test(lamp.when));
    assert.equal(lantern.length, lit ? 1 : 0, `${id}: the lantern ${lit ? 'breathes' : 'is turned down to a bead'}`);
    if (plate) assert.ok(state.room.plates?.[plate.plate], 'a plate the room declares');
  }
  const after = inFixture(DARK, { T_SEANCE_ON: false, T_MOTT_SPOKE: true }).state;
  assert.equal((after.room.props ?? []).filter((prop) => after.flags.test(prop.when)).length, 0, 'the plate\'s own lamp, afterwards');
  assert.equal((after.room.plateWhen ?? []).filter((one) => after.flags.test(one.when)).length, 0, 'the lamp has come up');
});

test('scene B art: the séance turns when Frame writes, played on the group from the frame drawn for it', () => {
  const rows = (JSON.parse(readFileSync(resolve(ROOT, 'content/acted-directions.json'), 'utf8')) as {
    directions: { class: string; performedBy?: string[]; frames?: number[]; where: string }[] }).directions;
  const acted = rows.filter((row) => row.class === 'A' && row.performedBy?.includes(group!.id));
  assert.equal(acted.length, 1, 'one direction is the group\'s');
  const dark = sheetOf(group!, { T_SEANCE_ON: true, T_SEANCE_DARK: true });
  for (const frame of acted[0]!.frames ?? []) assert.ok(frame > 1 && frame < dark.frames.length, 'an action frame of the dark sheet');
  assert.ok(acted[0]!.where.startsWith('dialogue/'), 'in the conversation under the table');
});

/* ---- C · the estate sale --------------------------------------------------- */

test('scene C art: the hen is at the hole the moment she is set down, and the raccoon comes halfway out in his own sheet', () => {
  assert.ok(hen?.sprite && raccoon?.sprite, 'the hen and the raccoon are drawn figures at the hole');
  assert.equal(hen.posture, 'animal');
  const { state, player } = inFixture(WANTED);
  const ids = () => player.present().map((one) => one.id);
  assert.ok(!ids().includes(hen.id), 'not before');
  const sitting = player.present().find((one) => one.id === raccoon.id)!.sprite!.sheet;
  const item = state.carried.find((one) => (content.combinations?.pairs ?? [])
    .some((pair) => pair.item === one && pair.room === HOLE_ROOM && pair.rules?.some((rule) => rule.set?.T_RACCOON_OUT)));
  assert.ok(item, 'the hen is carried');
  const target = (content.combinations?.pairs ?? []).find((pair) => pair.item === item && pair.rules?.some((rule) => rule.set?.T_RACCOON_OUT))!.target;
  player.use(item, target);
  assert.equal(state.flags.get('T_RACCOON_OUT'), true);
  assert.ok(ids().includes(hen.id), 'the hen, set down in front of him');
  const out = player.present().find((one) => one.id === raccoon.id)!;
  assert.notEqual(out.sprite!.sheet, sitting, 'halfway out, in his emerging sheet');
  // The coat: he holds the bundle over the lines, and the raccoon goes under it halfway out.
  const spot = state.room.hotspots.find((one) => one.responses?.USE?.some((rule) => rule.set?.T_RACCOON_IN_COAT))!;
  const result = player.verb(spot.id, 'USE');
  const holds = (result as { holds?: { clip: string; frames: number[] } }).holds;
  assert.ok(holds, 'the player holds his coat over the lines');
  const clip = content.actor.clips.find((one) => one.id === holds.clip);
  assert.ok(clip, `${holds.clip} is one of his clips`);
  for (const frame of holds.frames) assert.ok(frame < clip.frames.length);
  assert.equal(state.flags.get('T_RACCOON_IN_COAT'), true);
  const going = player.present().find((one) => one.id === raccoon.id);
  assert.ok(going, 'he fades, not vanishes');
  assert.equal(going.sprite!.sheet, out.sprite!.sheet, 'halfway out as the coat comes down, not sitting');
  // Away and back: the hen has gone back to the player, and the hole is empty.
  state.enterRoom('town_map');
  state.enterRoom(HOLE_ROOM);
  player.ambient.arrived();
  assert.ok(!ids().includes(hen.id) && !ids().includes(raccoon.id), 'nobody at the hole');
});

test('scene C art: the raccoon halfway out is the size of the raccoon who sits there, and graded into the night', () => {
  // The span across his ears, both sheets drawn 1:1 (the handback's own measure: 32 px).
  const span = (sprite: NonNullable<AmbientFile['sprite']>) => {
    const image = png(sprite.sheet);
    const [sx, sy, w, h] = sprite.frames[0]!;
    let top = -1;
    for (let row = 0; row < h && top < 0; row += 1) for (let col = 0; col < w; col += 1) {
      if ((image.pixels[((sy + row) * image.width + sx + col) * 4 + 3] ?? 0) > 0) { top = row; break; }
    }
    // Ears: the rows from the first opaque one down a seventh of the head's frame; their outer columns.
    let left = w; let right = -1;
    for (let row = top; row < top + Math.round(h / 7); row += 1) for (let col = 0; col < w; col += 1) {
      if ((image.pixels[((sy + row) * image.width + sx + col) * 4 + 3] ?? 0) > 0) { left = Math.min(left, col); right = Math.max(right, col); }
    }
    return right - left + 1;
  };
  const sitting = span(raccoon!.sprite!);
  const emerging = span(sheetOf(raccoon!, { T_RACCOON_OUT: true }));
  assert.ok(!raccoon!.sprite!.figureHeight, 'drawn 1:1');
  assert.ok(Math.abs(emerging - sitting) / sitting <= 0.1, `ears ${emerging} px across halfway out, ${sitting} sitting`);
  const light = content.rooms.get(HOLE_ROOM)!.figureLight;
  assert.ok(light?.figures.includes(hen!.id), 'the hen is graded into the night');
  assert.ok(light?.sheets?.includes(sheetOf(raccoon!, { T_RACCOON_OUT: true }).sheet), 'and the raccoon\'s emerging sheet');
  assert.ok(!light?.figures.includes(raccoon!.id) && !light?.sheets?.includes(raccoon!.sprite!.sheet), 'not his sitting one, painted into it');
});

test('scene C art: the hen\'s and the coat\'s icons are in the shipping sheet; the money\'s is still owed', () => {
  const icons = (JSON.parse(readFileSync(resolve(ROOT, 'content/ui/item-icons.json'), 'utf8')) as { icons: Record<string, number[]> }).icons;
  const pairs = content.combinations?.pairs ?? [];
  const sale = pairs.find((pair) => pair.rules?.some((rule) => rule.set?.T_RACCOON_SOLD));
  assert.ok(sale, 'the sale');
  const sold = sale.rules!.find((rule) => rule.set?.T_RACCOON_SOLD)!;
  const handed = [sale.item, ...((sold as { takes?: string[] }).takes ?? [])];
  for (const id of new Set([sale.item, ...handed.filter((one) => content.items.has(one))])) {
    assert.ok(icons[id], `${id} has its cell`);
    assert.equal((content.items.get(id) as { iconPending?: string }).iconPending, undefined, `${id} is no longer pending`);
  }
  const money = [...content.items.values()].filter((item) => (item as { iconPending?: string }).iconPending);
  assert.ok(money.every((item) => !icons[item.id]), 'nothing pending has a cell');
});
