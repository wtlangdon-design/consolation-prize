/**
 * QUEUED LINES PLAY ON THEIR OWN, AND NEVER EAT A CLICK (the bookends audit,
 * finding 1; engine/core/SpeechPolicy.ts).
 *
 * Only a conversation's greeting and an arrival scene with an outcome used to
 * chain. Every other queued line -- a verb's `then`, Main Street's first
 * sight, a door's beat, the filing's read-backs, the close and its letter --
 * showed its first line, went blank, and waited for a click; the click that
 * came was spent on the next line instead of the walk, the verb or the map.
 * The letter at the end of the game sat on a black screen until clicked, line
 * by line.
 *
 * Reintroduce it (make `holdOver` answer `down` with lines queued, or let a
 * timed line take a click) and these fail.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { readingHold, type HoldTiming } from '../engine/core/DialoguePerformance.ts';
import { clickOnSpeech, holdOver, waitsForClick } from '../engine/core/SpeechPolicy.ts';
import type { ResponseRule } from '../engine/core/types.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

test('a line outside a conversation never waits for a click, and never takes one', () => {
  for (const clickToRead of [true, false]) {
    const waiting = waitsForClick({ conversation: false, clickToRead });
    assert.equal(waiting, false, `click-to-read ${clickToRead}`);
    assert.equal(clickOnSpeech({ waiting }), 'through', 'the click walks, acts or travels');
  }
});

test("a conversation's line waits for its click under Tyler's ruling, stays up, and takes the click", () => {
  const waiting = waitsForClick({ conversation: true, clickToRead: true });
  assert.equal(waiting, true);
  assert.equal(clickOnSpeech({ waiting }), 'advance');
  assert.equal(waitsForClick({ conversation: true, clickToRead: false }), false, 'timed conversation, when it is off');
});

test('a hold that runs out brings up the next queued line, and only an empty queue goes quiet', () => {
  assert.equal(holdOver(3), 'next');
  assert.equal(holdOver(1), 'next');
  assert.equal(holdOver(0), 'down');
});

/**
 * Every multi-line scene the content queues outside a conversation, played
 * through the policy on a clock with NO CLICKS: each must reach its last line
 * by its reading holds alone.
 */
test('every queued scene in the content plays to its last line with no click', async () => {
  const content = await loadContent(fsReader);
  const ui = content.ui.timing;
  const timing: HoldTiming = {
    base: ui?.holdBaseSeconds ?? 0.45, perGlyph: ui?.holdPerGlyphSeconds ?? 0.055,
    minimum: ui?.holdMinimumSeconds ?? 1.8, maximum: ui?.holdMaximumSeconds ?? 8,
  };
  const clickToRead = ui?.conversationWaitsForClick === true;
  const scenes: { where: string; lines: string[] }[] = [];
  const text = (line: string | { line: string }) => (typeof line === 'string' ? line : line.line);
  for (const [id, room] of content.rooms) {
    if ((room.onEnter?.say?.length ?? 0) > 1) scenes.push({ where: `${id} onEnter`, lines: room.onEnter!.say! });
    for (const scene of room.onEnter?.scenes ?? []) {
      const lines = (scene as { lines?: { line: string }[] }).lines ?? [];
      if (lines.length > 1) scenes.push({ where: `${id} arrival scene`, lines: lines.map(text) });
    }
    for (const target of [...(room.hotspots ?? []), ...(room.exits ?? [])]) {
      const rules = [...Object.values(target.responses ?? {}).flat(),
        ...((target as { transitScene?: ResponseRule[] }).transitScene ?? [])];
      for (const rule of rules) {
        if (!rule?.then?.length) continue;
        scenes.push({ where: `${id}/${target.id}`, lines: [...(rule.say ? [rule.say] : []), ...rule.then.map(text)] });
      }
    }
  }
  assert.ok(scenes.length >= 50, `multi-line scenes found: ${scenes.length}`);
  for (const scene of scenes) {
    const queue = [...scene.lines];
    let onScreen: string | null = queue.shift() ?? null;
    const shown: string[] = onScreen ? [onScreen] : [];
    let clock = 0;
    for (let guard = 0; onScreen !== null && guard < 100; guard += 1) {
      assert.equal(waitsForClick({ conversation: false, clickToRead }), false, `${scene.where}: waits`);
      clock += readingHold(onScreen, timing);
      if (holdOver(queue.length) === 'next') {
        onScreen = queue.shift()!;
        shown.push(onScreen);
      } else {
        onScreen = null;
      }
    }
    assert.deepEqual(shown, scene.lines, `${scene.where}: every line, in order, with no click`);
    assert.ok(clock > 0);
  }
});
