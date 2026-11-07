/**
 * THE WAY INTO ROOM 1: FROM THE STARS, AND NEVER IN PIECES (errata 157).
 *
 * Tyler, 2026-11-07: "When you come out of the main menu into room 1, it takes
 * a moment for it to load, and it loads in pieces ... It needs something other
 * than an immediate jump from the main menu into [the hero] starting his first
 * line." He chose the pan down from a starry sky. Beat 2 had held 0.73 s of
 * doc 17's stated eight before the first line.
 *
 * These hold what can be held without a browser: the pan is in beat 2, before
 * the hero steps down and before he introduces himself; it holds the beat for its length;
 * the sky exists, is the plate's width and joins it without a step; and the
 * sky is one of the things Room 1 waits for. The browser half -- no frame of
 * the room seen before it is whole, the first sight is the sky, the first line
 * after the pan settles -- is the opening gauntlet's (tools/gauntlet/run.mjs).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { planRoom } from '../engine/core/BootAssets.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { segmentsOf, stepsFor } from '../engine/core/Opening.ts';
import { SequenceRunner } from '../engine/core/Sequence.ts';
// @ts-expect-error -- a plain .mjs module with no declarations; it reads 8-bit RGBA PNGs.
import { readPng } from '../tools/lib/png.mjs';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

test('the opening starts in the sky, speaks there, and pans down before the hero steps down or introduces himself', async () => {
  const content = await loadContent(fsReader);
  const steps = segmentsOf(content.sequences.get('opening')!)
    .filter((segment) => segment.kind === 'automatic').flatMap((segment) => stepsFor(segment));
  const sky = steps.findIndex((step) => step.kind === 'sky');
  const pan = steps.findIndex((step) => step.kind === 'pan');
  const firstWalk = steps.findIndex((step) => step.kind === 'walk');
  const firstLine = steps.findIndex((step) => step.kind === 'say');
  const introduces = steps.findIndex((step) => step.kind === 'say' && (step as { line?: string }).line?.startsWith('My name is'));
  assert.ok(sky === 0 || steps.slice(0, sky).every((step) => step.kind !== 'say' && step.kind !== 'walk'),
    'the view is in the sky before anything is said or walked');
  assert.ok(firstLine > sky, 'the voices in the dark are said under the sky (errata 157, beat 1b)');
  assert.ok(pan > firstLine, 'and the view comes down after them');
  assert.ok(pan < firstWalk && pan < introduces, 'the camera settles before he moves or introduces himself');
  const seconds = (steps[pan] as { seconds: number }).seconds;
  assert.ok(seconds >= 3 && seconds <= 8, `a glide, not a cut or a wait: ${seconds}s`);
});

test('a pan holds the runner for its length', () => {
  const runner = new SequenceRunner();
  const said: string[] = [];
  let panned = 0;
  const host = { pan: (s: number) => { panned = s; }, say: () => { said.push('line'); return 1; } } as never;
  runner.start([{ kind: 'pan', seconds: 5 }, { kind: 'say', line: 'x' }] as never);
  runner.update(0, host);
  runner.update(4.9, host);
  assert.equal(panned, 5);
  assert.deepEqual(said, [], 'nothing is said while the view comes down');
  runner.update(5.01, host);
  assert.deepEqual(said, ['line']);
});

test('Room 1 has a sky the plate\'s width that joins it without a step, and waits for it', async () => {
  const content = await loadContent(fsReader);
  const room = content.rooms.get(content.manifest.startRoom)!;
  assert.ok(room.sky && existsSync(resolve(ROOT, room.sky)), String(room.sky));
  const sky = readPng(readFileSync(resolve(ROOT, room.sky)));
  const plate = readPng(readFileSync(resolve(ROOT, room.background!)));
  assert.equal(sky.width, plate.width, 'the same width as the plate');
  assert.ok(sky.height >= 864, 'at least a screen of sky, so the first frame is all sky');
  // The seam: the sky's last rows against the plate's first, by mean colour.
  // readPng hands back RGBA whatever the file's own channels.
  const mean = (img: { width: number; pixels: Uint8Array }, y0: number, y1: number) => {
    const out = [0, 0, 0]; let n = 0;
    for (let y = y0; y < y1; y += 1) for (let x = 0; x < img.width; x += 1) {
      const at = (y * img.width + x) * 4;
      for (let c = 0; c < 3; c += 1) out[c]! += img.pixels[at + c]!;
      n += 1;
    }
    return out.map((v) => v / n);
  };
  const above = mean(sky, sky.height - 6, sky.height);
  const below = mean(plate, 0, 6);
  for (let c = 0; c < 3; c += 1) assert.ok(Math.abs(above[c]! - below[c]!) < 4, `no step at the join: ${above} against ${below}`);
  assert.ok(planRoom(content, room.id).some((asset) => asset.path === room.sky), 'the room is not whole without its sky');
});

test('every star that flickers is a star in the sky, not empty night', async () => {
  const content = await loadContent(fsReader);
  const room = content.rooms.get(content.manifest.startRoom)!;
  const sky = readPng(readFileSync(resolve(ROOT, room.sky!)));
  assert.ok((room.skyStars ?? []).length >= 6, 'a few stars flicker');
  for (const [x, y] of room.skyStars ?? []) {
    let brightest = 0;
    for (let dy = -3; dy <= 3; dy += 1) for (let dx = -3; dx <= 3; dx += 1) {
      brightest = Math.max(brightest, sky.pixels[((y + dy) * sky.width + (x + dx)) * 4]!);
    }
    assert.ok(brightest > 150, `(${x}, ${y}) flickers over a star: its red peaks at ${brightest}`);
  }
});
