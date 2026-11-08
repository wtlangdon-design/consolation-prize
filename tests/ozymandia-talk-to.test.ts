/**
 * TALK TO ON A PERSON WITH NO TREE (errata 192; reference/ozymandia-prosperity/talk-to-brief.md, Tyler's C).
 *
 * In Act IV after the void the medium stands at the claim with no tree. TALK TO walks the hero to her stand first, then he
 * says doc 54's line for the selection -- the first, the second, the third and after -- and she answers each time
 * with her one line, her bark, in her own voice. Every line here is read from the extracted content.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { AmbientLayer } from '../engine/core/Ambient.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { personLines } from '../engine/core/PersonLines.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

// Room 23's annotation names the room and the one figure its `people` map gives lines to: read, not typed.
const ROOM_23 = 'reference/room-23/annotation.json';

async function atTheClaimAfterTheVoid() {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  const fixture = content.fixtures.get('r34-b');
  assert.ok(fixture && state.applyFixture(fixture), 'Act IV, the void found');
  const annotation = JSON.parse(await readFile(resolve(ROOT, ROOM_23), 'utf8'));
  const ids = Object.values(annotation.people as Record<string, string[]>).flat();
  assert.equal(ids.length, 1, 'one figure has lines there');
  state.enterRoom(annotation.room);
  const layer = new AmbientLayer(state);
  layer.arrived();
  const her = layer.present.find((npc) => npc.id === ids[0]);
  assert.ok(her, 'she is at the claim after the void');
  return { state, layer, her };
}

test('TALK TO her: his three lines in order, the third again after, each answered by hers', async () => {
  const { state, layer, her } = await atTheClaimAfterTheVoid();
  // Her written name is whatever the annotation's `people` maps to her figure's id.
  const people = JSON.parse(await readFile(resolve(ROOT, ROOM_23), 'utf8')).people as Record<string, string[]>;
  const name = Object.keys(people).find((key) => people[key]!.includes(her.id));
  assert.ok(name, 'the annotation maps a written name to her figure');
  const written = JSON.parse(await readFile(resolve(ROOT, 'content/examine/room-23.json'), 'utf8')).exitsAndUnplaced[name];
  const his = [written.TALK_TO, written['TALK_TO (second time)'], written['TALK_TO (third time and after)']];
  const hers = her.barks[layer.reputationState];
  assert.ok(hers, 'her bark is her answer');
  const said: string[] = [];
  for (let n = 0; n < 4; n += 1) {
    const staged = personLines(state.room, her, 'TALK_TO', (when) => state.flags.test(when), layer.hitBox(her),
      (one) => layer.barkLinesFor(one));
    assert.ok(staged, 'the room answers TALK TO on her');
    assert.deepEqual(staged.target.walkTo, her.walkTo, 'he walks to her stand before he speaks');
    assert.deepEqual(staged.answer, [{ speaker: her.speaksAs, line: hers }], 'she answers with her bark, as herself');
    said.push(state.interact(staged.target, 'TALK_TO').say ?? '');
  }
  assert.deepEqual(said, [...his, his[2]]);
});

test('every other verb on her is his alone: no answer from her', async () => {
  const { state, layer, her } = await atTheClaimAfterTheVoid();
  const staged = personLines(state.room, her, 'LOOK_AT', (when) => state.flags.test(when), layer.hitBox(her),
    (one) => layer.barkLinesFor(one));
  assert.ok(staged === null || staged.answer.length === 0);
  assert.ok(staged === null || staged.target.walkTo === undefined, 'only TALK TO walks over first');
});

test('the scene walks up to a person before her lines, through the staged chain', async () => {
  // GameScene cannot run headless; this holds the wiring: the people path stages the walk (beginInteraction, which
  // walks to the target's walkTo first) rather than answering where he stands, and queues her answer after his line.
  const scene = await readFile(resolve(ROOT, 'engine/scenes/GameScene.ts'), 'utf8');
  const at = scene.indexOf('const personal = npc && chosen !== null');
  assert.ok(at > 0, 'the people path asks core/PersonLines.ts');
  const path = scene.slice(at, scene.indexOf('return;', at));
  assert.match(path, /if \(chosen === 'TALK_TO'\) this\.beginInteraction\(personal\.target, chosen\)/);
  assert.match(scene, /this\.pendingSay\.push\(\.\.\.this\.personTarget\.answer\)/);
});
