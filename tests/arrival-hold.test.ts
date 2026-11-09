import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { ArrivalHold } from '../engine/core/ArrivalHold.ts';
import { planNear, planRoom } from '../engine/core/BootAssets.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';

/**
 * EVERY ARRIVAL WAITS FOR ITS ROOM (errata 223; Tyler, 2026-11-09: "Yes, and
 * is it possible to have it say "Loading..." On the screen if it's waiting for
 * it to load a room?"). Errata 221's playthrough left it for him: a map walk
 * skipped by a click, or an exit taken the instant a room appeared, arrived
 * before the next room had loaded and showed it in pieces. Only NEW GAME, the
 * fades and the cut-aways held black until the room was whole.
 *
 * The scene is a Phaser scene and does not run under node, so this plays the
 * scene's own frame rule -- `ArrivalHold`, asked exactly as GameScene asks it,
 * whether the room is whole decided by `planRoom` against the pictures that
 * have arrived -- at 60 fps, and reads GameScene and the Renderer for the
 * wiring that puts every arrival through it.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const content = await loadContent(fsReader);
const scene = await readFile(resolve(ROOT, 'engine/scenes/GameScene.ts'), 'utf8');
const renderer = await readFile(resolve(ROOT, 'engine/render/Renderer.ts'), 'utf8');
const FRAME = 1 / 60;
const LIMIT = content.ui.timing?.roomReadyLimitSeconds ?? 12;
const AFTER = content.ui.loading?.afterSeconds ?? 0.5;

/** A method's body in GameScene, from its declaration to the next one. */
const body = (name: string): string => {
  const start = scene.indexOf(`private ${name}(`);
  assert.ok(start >= 0, `GameScene has ${name}`);
  const next = scene.slice(start + 1).search(/\n {2}(private|public|update|create)\b[^\n]*\(/);
  return scene.slice(start, next < 0 ? undefined : start + 1 + next);
};

/**
 * One arrival, frame by frame, as GameScene plays it: `enterRoomPerformance`
 * asks `arrive`, every frame `holdsArrival` asks `tick` (the screen black
 * while it holds, the room not run), and `showLoading` asks `label` of the
 * black. `arrivals` says which pictures come in on which frame.
 */
function play(roomId: string, have: Set<string>, arrivals: Map<number, string[]>, frames: number) {
  const hold = new ArrivalHold();
  const needs = planRoom(content, roomId).map((asset) => asset.key);
  const whole = () => needs.every((key) => have.has(key));
  let black = hold.arrive(0, whole()) ? 1 : 0;
  const seen: { at: number; black: number; whole: boolean; label: boolean; running: boolean }[] = [];
  for (let n = 0; n <= frames; n += 1) {
    const now = n * FRAME;
    for (const key of arrivals.get(n) ?? []) have.add(key);
    const tick = hold.tick(now, whole(), LIMIT);
    const running = !tick || tick.released;
    if (tick) black = tick.released ? 0 : 1;
    const label = hold.label(now, black, black >= 1 ? whole() : true, AFTER);
    seen.push({ at: now, black, whole: whole(), label, running });
  }
  return { seen, needs };
}

/** A room that needs more than its plate, reached from the map (errata 221's Claims Road was one). */
const mapRoom = [...content.rooms.values()].find((room) => room.kind === 'map')!;
const farRoom = (mapRoom.locations ?? []).map((location) => location.room)
  .find((id) => content.rooms.has(id) && planRoom(content, id).length >= 3)!;

test('an arrival on a room still loading is held in black until every picture it needs is in', () => {
  assert.ok(farRoom, 'the map takes the player to a room with several pictures');
  const needs = planRoom(content, farRoom).map((asset) => asset.key);
  // Its pictures come in one by one over a second and a half: the last at frame 90.
  const arrivals = new Map<number, string[]>();
  needs.forEach((key, index) => {
    const at = Math.round(((index + 1) / needs.length) * 90);
    arrivals.set(at, [...(arrivals.get(at) ?? []), key]);
  });
  const { seen } = play(farRoom, new Set(), arrivals, 180);
  const inPieces = seen.filter((frame) => frame.black < 1 && !frame.whole);
  assert.deepEqual(inPieces, [], `${farRoom} is never seen while a picture of it is missing`);
  assert.ok(seen.slice(0, 90).every((frame) => frame.black === 1 && !frame.running),
    'black, and the room not run, on every frame before the last picture arrives');
  assert.equal(seen[90]!.black, 0, 'shown on the frame the last picture arrives, with no added delay');
  assert.ok(seen[90]!.running, 'and the room begins on that frame');

  // A load that never finishes does not strand him: the hold lets go at errata 157's limit.
  const stalled = play(farRoom, new Set(), new Map(), Math.ceil(LIMIT / FRAME) + 2).seen;
  const first = stalled.findIndex((frame) => frame.black === 0);
  assert.ok(first > 0 && Math.abs(stalled[first]!.at - LIMIT) < 2 * FRAME, `a stalled load is let go at ${LIMIT} s`);

  // AND THE SCENE PLAYS IT ON EVERY ARRIVAL: an exit, the map, a goto, a hand-on, an act's opening, a load.
  // Every call that changes the room he is in is followed by the arrival, which asks the hold.
  const changes = [...scene.matchAll(/this\.state\.(enterRoom|handOn|applyFixture|travelTo|openAct|reset)\(/g)];
  assert.ok(changes.length >= 10, 'GameScene changes rooms in many places');
  for (const change of changes) {
    const after = scene.slice(change.index, change.index! + 900);
    assert.match(after, /this\.enterRoomPerformance\(/, `state.${change[1]} at offset ${change.index} is followed by an arrival`);
  }
  for (const load of scene.matchAll(/this\.state\.load\(/g)) {
    assert.match(scene.slice(load.index, load.index! + 200), /this\.afterLoad\(\)/, 'a load is followed by afterLoad');
  }
  assert.match(body('afterLoad'), /this\.enterRoomPerformance\(null\)/, 'afterLoad is an arrival');

  const arrival = body('enterRoomPerformance');
  assert.match(arrival, /this\.arrivalHold\.arrive\([^;]*this\.roomWhole\(\)/s, 'every arrival asks the hold whether its room is whole');
  assert.match(arrival, /this\.fadeBlack = 1/, 'and a held arrival is black from its first frame');

  const update = scene.slice(scene.indexOf('\n  update(): void {'), scene.indexOf('\n  private present(): void {'));
  const freeze = update.indexOf('if (this.holdsArrival(now))');
  assert.ok(freeze > 0, 'update asks the hold every frame');
  for (const runs of ['this.tickTimeline()', 'this.sequence.update(', 'this.actors.update(', 'this.advanceSay()', 'this.tickCutaway(now)']) {
    assert.ok(update.indexOf(runs) > freeze, `${runs} is not reached while an arrival is held`);
  }
  assert.match(update.slice(freeze, freeze + 200), /return;/, 'a held frame returns before the room runs');
  const hold = body('holdsArrival');
  assert.match(hold, /this\.arrivalHold\.tick\(now, this\.roomWhole\(\)/, 'the hold lets go only on a whole room (or the limit)');
  assert.match(hold, /roomReadyLimitSeconds/, 'under errata 157\'s limit');
  assert.match(body('onPointerDown'), /this\.arrivalHold\.holding/, 'a click in the black is not spent on a room not yet seen');
  assert.match(body('quietForCutaway'), /!this\.arrivalHold\.holding/, 'no cut-away starts inside the hold');
});

test('an arrival on a room already whole is not held: nothing is added and nothing changes', () => {
  let rooms = 0;
  for (const room of content.rooms.values()) {
    // The usual case: the room was asked for while he stood next door (BootAssets.planNear).
    for (const to of new Set((room.exits ?? []).map((exit) => exit.to))) {
      if (!content.rooms.has(to)) continue;
      const have = new Set(planNear(content, room.id).map((asset) => asset.key));
      const { seen } = play(to, have, new Map(), 120);
      assert.ok(seen.every((frame) => frame.black === 0 && frame.running && !frame.label),
        `${room.id} -> ${to}: no black, no wait and no words on an arrival whose room is already here`);
      rooms += 1;
    }
  }
  assert.ok(rooms > 40, `every exit in the game was played (${rooms})`);
});

test('"Loading…" comes up only once a wait passes its threshold, never on an arrival already loaded', async () => {
  const words = content.ui.loading;
  assert.ok(words, 'ui.json declares the words');
  assert.equal(words.label, 'Loading…', 'the words, with the single ellipsis character');
  assert.ok(Math.abs((words.afterSeconds ?? 0) - 0.5) < 0.2, 'the threshold is about half a second');
  const font = JSON.parse(await readFile(resolve(ROOT, 'art/ui/font-5x7.json'), 'utf8')) as { glyphs: Record<string, unknown> };
  for (const glyph of new Set(words.label.replace(/ /g, ''))) assert.ok(font.glyphs[glyph], `the face draws ${glyph}`);

  // A wait of two seconds: no words before the threshold, words after it, none once the room is in.
  const needs = planRoom(content, farRoom).map((asset) => asset.key);
  const { seen } = play(farRoom, new Set(), new Map([[120, needs]]), 180);
  const threshold = Math.ceil(AFTER / FRAME);
  assert.ok(seen.slice(0, threshold - 1).every((frame) => !frame.label), 'nothing before the threshold');
  assert.ok(seen.slice(threshold + 1, 120).every((frame) => frame.label), 'the words after it, for as long as it waits');
  assert.ok(seen.slice(120).every((frame) => !frame.label), 'gone on the frame the room is whole');

  // A wait shorter than the threshold never shows them: an ordinary slow arrival does not flash.
  const brief = play(farRoom, new Set(), new Map([[threshold - 3, needs]]), 120).seen;
  assert.ok(brief.every((frame) => !frame.label), 'a hold shorter than the threshold never shows the words');

  // A fade's black over a room that is whole is not waiting on anything.
  const fade = new ArrivalHold();
  for (let n = 0; n < 240; n += 1) assert.equal(fade.label(n * FRAME, 1, true, AFTER), false);

  // The scene draws the content's words, not its own, over full black only, on the map as in a room.
  assert.match(body('showLoading'), /this\.arrivalHold\.label\(now, this\.fadeBlack/, 'the scene asks the same rule');
  assert.match(scene, /loading: this\.loadingUp \? this\.state\.content\.ui\.loading\?\.label/, 'the frame carries ui.json\'s words');
  const draw = renderer.slice(renderer.indexOf('private drawFadeBlack('), renderer.indexOf('private drawTitleScreen('));
  assert.match(draw, /black >= 1 && frame\.loading/, 'drawn only over full black');
  assert.match(draw, /drawCentredOutlined\(ctx, frame\.loading, NATIVE_WIDTH \/ 2/, 'centred, in the shipping face');
  assert.match(draw, /roleColour\('ink'\)/, 'in the speech ink');
  assert.ok((renderer.match(/this\.drawFadeBlack\(frame\)/g) ?? []).length >= 2, 'over a room and over the map');
  // And the words live in content: no engine file spells them.
  const files = async (dir: string): Promise<string[]> => (await readdir(resolve(ROOT, dir), { withFileTypes: true }))
    .flatMap((entry) => entry.isDirectory() ? [] : [`${dir}/${entry.name}`]);
  for (const dir of ['engine/core', 'engine/scenes', 'engine/render', 'engine/dev']) {
    for (const file of (await files(dir)).filter((name) => name.endsWith('.ts'))) {
      const source = await readFile(resolve(ROOT, file), 'utf8');
      assert.doesNotMatch(source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, ''), /['"`]Loading/i, `${file} spells the words`);
    }
  }
});
