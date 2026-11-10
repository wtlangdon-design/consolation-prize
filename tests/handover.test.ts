import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { hiddenNow } from '../engine/core/Standing.ts';

/**
 * TWO THINGS SEEN ONLY WHEN THE ACTED DIRECTIONS WERE FILMED (errata 267).
 *
 * 1. An item used on a person was answered from wherever Thad stood. The raccoon was sold to Mr. Pratt from the far
 *    side of the claim: Pratt opened the coat, counted out the money and held out his hand to a man sixty feet off.
 *    The person's stand was declared on the target and never walked to. He walks there first now, as TALK TO does.
 * 2. Thad going down on his hands and knees at the séance was never seen: the rule that acts it also sets the state
 *    that hides him, and he was hidden first. While he holds a frame of an acted direction he is drawn.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

test('a room that hides him does not hide him while he is acting his way out of sight', () => {
  assert.equal(hiddenNow({ hidden: true, acting: true }), false, 'he vanished before he had gone down');
  assert.equal(hiddenNow({ hidden: true, acting: false }), true, 'the act is over and he is still on the floor');
  assert.equal(hiddenNow({ hidden: false, acting: false }), false);
  assert.equal(hiddenNow({ hidden: false, acting: true }), false);
});

test('the renderer hides him by that rule, and an item carried to a person is walked to the person', async () => {
  const renderer = await readFile(resolve(ROOT, 'engine/render/Renderer.ts'), 'utf8');
  assert.ok(/hiddenNow\(\{ hidden: playerHidden, acting:/.test(renderer), 'the renderer hides him without asking whether he is acting');
  const scene = await readFile(resolve(ROOT, 'engine/scenes/GameScene.ts'), 'utf8');
  const taker = scene.slice(scene.indexOf('const taker = person && held && chosen !== null'), scene.indexOf("THE ROOM'S LINES FOR THIS PERSON FIRST"));
  assert.ok(taker.includes('if (handed.walkTo) this.beginInteraction(handed, chosen);') && taker.includes('one.id === person.id)?.walkTo'),
    'an item used on a person with a stand is answered from where he is, not walked over');
  assert.ok(taker.includes('this.itemTaker = handed;') && scene.includes('this.itemTaker?.id === step.interact.target'),
    'the person the item is for is forgotten by the time he gets there');
});

test('everyone an item can be handed to says where to stand for it', async () => {
  // The walk needs a stand: a person with a written pair and no `walkTo` would still be answered from afar.
  const read = async (path: string) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
  const manifest = await read('content/manifest.json') as { ambient: string[] };
  const cast = new Map<string, { id: string; walkTo?: unknown; tree?: string; placements?: Record<string, { walkTo?: unknown }> }>();
  for (const path of manifest.ambient) { const one = await read(path); cast.set(one.id, one); }
  const pairs = (await read('content/combinations.json')).pairs as { item: string; target: string; rules?: { direction?: boolean }[]; direction?: boolean }[];
  // A figure that is also a thing in its room (Grievance over her half door) stands where the room says to.
  const stands = new Set<string>();
  for (const path of (manifest as unknown as { rooms: string[] }).rooms) {
    for (const spot of ((await read(path)).hotspots ?? []) as { id: string; walkTo?: unknown }[]) if (spot.walkTo) stands.add(spot.id);
  }
  const bare = new Set<string>();
  for (const pair of pairs) {
    const person = cast.get(pair.target);
    if (!person) continue;
    // Only where something is ACTED or directed at the handing over: a line thrown back can be thrown from anywhere.
    const staged = pair.direction || (pair.rules ?? []).some((rule) => rule.direction);
    if (staged && !person.walkTo && !stands.has(person.id)) bare.add(person.id);
  }
  assert.deepEqual([...bare], [], 'give each a walkTo (content/ambient): a staged handing-over from across the room');
});
