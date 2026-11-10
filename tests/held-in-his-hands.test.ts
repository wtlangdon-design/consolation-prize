import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { AmbientLayer } from '../engine/core/Ambient.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { roomPose } from '../engine/core/RoomPose.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import type { Condition, RoomFile } from '../engine/core/types.ts';

/**
 * WHAT STAYS IN HIS HANDS, AND WHO WAITS TO GO (errata 246; doc 115 II-1 and II-5).
 *
 * Three things the first build of the collection and the wreath got wrong, each held here:
 *
 *  1. A rule's `holds` lets go with its last line, so between the line that put the plate in his hands and the verb
 *     that settles it he stood empty-handed. The room now says what he holds while a condition holds (`actorPoses`).
 *  2. A figure who fades out began fading the moment his condition ended, which is the moment the rule that sends him
 *     away STARTS: the Colonel faded through his own thanks. Nobody begins to fade while lines are being said.
 *  3. A room compiled from its own last output added a figure's written lines to the ones it carried, so the third
 *     compile said everything three times, the old wording last.
 *
 * The scene is a Phaser scene and does not run under node; its wiring is read, as tests/cutaway-keeps-room.test.ts does.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const content = await loadContent(fsReader);
const scene = await readFile(resolve(ROOT, 'engine/scenes/GameScene.ts'), 'utf8');
const actor = await readFile(resolve(ROOT, 'engine/core/Actor.ts'), 'utf8');

test('the room\'s pose is the first whose condition holds, its frames taken in turn; none holding, none', () => {
  const poses: NonNullable<RoomFile['actorPoses']> = [
    { when: { A: true }, clip: 'one', frames: [4, 5], rate: 1, rooted: true },
    { when: { B: true }, clip: 'two', frames: [9] },
  ];
  const flags = (set: Record<string, boolean>) => (when: Condition) => Object.entries(when).every(([k, v]) => (set[k] ?? false) === v);
  assert.equal(roomPose(poses, flags({}), 0), null);
  assert.equal(roomPose(undefined, flags({ A: true }), 0), null);
  assert.deepEqual(roomPose(poses, flags({ A: true, B: true }), 0), { clip: 'one', frame: 4, rooted: true });
  assert.deepEqual(roomPose(poses, flags({ A: true }), 1.2), { clip: 'one', frame: 5, rooted: true });
  assert.deepEqual(roomPose(poses, flags({ A: true }), 2.2), { clip: 'one', frame: 4, rooted: true });
  assert.deepEqual(roomPose(poses, flags({ B: true }), 7), { clip: 'two', frame: 9, rooted: false });
});

test('every pose a room declares is a clip he has, with those frames; and a rooted one names a way out that answers', () => {
  let declared = 0;
  for (const room of content.rooms.values()) {
    for (const pose of room.actorPoses ?? []) {
      declared += 1;
      const clip = content.actor.clips.find((one) => one.id === pose.clip);
      assert.ok(clip, `${room.id}: no clip ${pose.clip}`);
      for (const frame of pose.frames) assert.ok(frame >= 0 && frame < clip.frames.length, `${room.id}: ${pose.clip} has no frame ${frame}`);
      if (!pose.rooted) continue;
      // Held where he stands, every way out has to say why it is not taken, or a click on it does nothing at all.
      const held = room.exits.filter((exit) => exit.transitScene?.some((rule) => rule.stays && JSON.stringify(rule.when) === JSON.stringify(pose.when)));
      assert.ok(held.length > 0, `${room.id}: rooted, and no way out answers for it`);
    }
  }
  assert.ok(declared > 0, 'the collection plate is declared');
});

test('the scene draws the room\'s pose when no beat holds a frame of his, and roots him; the actor does not begin a walk rooted', () => {
  const update = scene.slice(scene.indexOf('update(): void {'));
  assert.match(update, /roomPose\(this\.state\.room\.actorPoses/);
  assert.match(update, /this\.actor\.rooted = carried\?\.rooted === true/);
  assert.match(update, /carried && !this\.actor\.isWalking/);
  const walk = actor.slice(actor.indexOf('  walkTo(x: number, y: number): boolean {'));
  assert.match(walk.slice(0, 120), /if \(this\.rooted\) return false;/);
});

test('each figure keeps his own held frame: another figure\'s beat does not let him go, and a rule\'s picture of him stays through it', () => {
  assert.match(scene, /const kept = \(this\.lingering \?\? \[\]\)\.filter\(\(pose\) => !acting\.has\(pose\.id\)\)/);
  const held = scene.slice(scene.indexOf('private heldPoses()'));
  assert.match(held.slice(0, 900), /spoken && !beat\?\.some\(\(pose\) => pose\.id === spoken\.id\)/);
});

test('a figure who fades does not begin while lines are being said, and goes when they are over', () => {
  const faders = [...content.ambient.values()].filter((npc) => npc.leaves && !npc.exit && npc.when
    && Object.values(npc.when).every((value) => typeof value === 'boolean'));
  assert.ok(faders.length > 0);
  let tried = 0;
  for (const npc of faders) {
    const state = new GameState(content, new MemoryStorage());
    state.enterRoom(npc.room);
    for (const [flag, value] of Object.entries(npc.when!)) state.flags.set(flag, value as boolean);
    state.enterRoom(npc.room);
    const layer = new AmbientLayer(state);
    layer.arrived();
    if (!layer.present.some((one) => one.id === npc.id)) continue;
    tried += 1;
    layer.noteDepartures(0);
    const [flag, value] = Object.entries(npc.when!)[0]!;
    state.flags.set(flag, !(value as boolean));
    layer.holdFades = true;
    layer.noteDepartures(1);
    layer.noteDepartures(1 + npc.leaves!.fade * 3);
    assert.ok(layer.present.some((one) => one.id === npc.id), `${npc.id} is still there while he is spoken of`);
    assert.equal(layer.opacity(npc.id), 1, `${npc.id} has not begun to fade`);
    layer.holdFades = false;
    const from = 2 + npc.leaves!.fade * 3;
    layer.noteDepartures(from);
    layer.noteDepartures(from + npc.leaves!.fade + 0.1);
    assert.ok(!layer.present.some((one) => one.id === npc.id), `${npc.id} goes once the lines are over`);
  }
  assert.ok(tried > 0, 'a fader was tried');
  assert.match(scene, /this\.ambient\.holdFades = this\.pendingSay\.length > 0 \|\| this\.sayingActor !== null;/);
});

test('no figure is given the same written line twice (a room compiled from its own last output)', () => {
  for (const room of content.rooms.values()) {
    for (const [id, verbs] of Object.entries(room.peopleResponses ?? {})) {
      for (const [verb, rules] of Object.entries(verbs)) {
        const lines = rules.map((rule) => `${JSON.stringify(rule.when ?? null)} ${rule.say}`);
        assert.equal(new Set(lines).size, lines.length, `${room.id}: ${id} ${verb} says a line twice`);
        const sources = rules.map((rule) => (rule as { sceneLine?: unknown }).sceneLine).filter((one) => typeof one === 'string');
        assert.equal(new Set(sources).size, sources.length, `${room.id}: ${id} ${verb} carries one written line twice`);
      }
    }
  }
});
