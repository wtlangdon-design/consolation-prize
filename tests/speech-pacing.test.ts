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
import { DialoguePerformance, readingHold, type HoldTiming } from '../engine/core/DialoguePerformance.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
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

/**
 * THAD'S ECHO MOVES ON BY ITSELF; EVERY OTHER CONVERSATION LINE STILL WAITS
 * (Tyler, 2026-11-06, errata 147: "Echo moves on by itself", narrowing the
 * 2026-11-01 click-to-read ruling). Make the echo wait again, or let a reply
 * come down on its hold, and these fail.
 */
test("the protagonist's echo of the choice never waits for a click; the answer to it does", () => {
  assert.equal(waitsForClick({ conversation: true, clickToRead: true, echo: true }), false, 'the echo comes down on its hold');
  assert.equal(waitsForClick({ conversation: true, clickToRead: true, echo: false }), true, 'a reply waits');
  assert.equal(waitsForClick({ conversation: true, clickToRead: true }), true, 'a greeting waits');
});

test('in a performed exchange the echo advances on its hold, and every reply holds for its click', async () => {
  const content = await loadContent(fsReader);
  const ui = content.ui.timing;
  assert.equal(ui?.conversationWaitsForClick, true, 'the shipped game reads conversations by click');
  const timing: HoldTiming = {
    base: ui?.holdBaseSeconds ?? 0.45, perGlyph: ui?.holdPerGlyphSeconds ?? 0.055,
    minimum: ui?.holdMinimumSeconds ?? 1.8, maximum: ui?.holdMaximumSeconds ?? 8, waitForClick: true,
  };
  // Every tree's every first-offered option with an exchange of two or more
  // replies: the echo, then each reply.
  let checked = 0;
  for (const treeId of content.dialogue.keys()) {
    const state = new GameState(content, new MemoryStorage());
    state.dialogue.start(treeId);
    const chosen = state.dialogue.presentOptions().find((p) => !p.option.duel);
    if (!chosen) continue;
    const exchange = state.dialogue.beginSelection(chosen.option.id);
    const said = exchange.presentation;
    const replies = [...(said.say ? [{ speaker: said.sayer ?? 'other', line: said.say }] : []), ...said.rest]
      .filter((line) => !line.rest && line.line && !/^\s*(…|\.\.\.)\s*$/.test(line.line));
    if (!replies.length) continue;
    const echo = { speaker: content.actor.id, line: chosen.text };
    const performance = new DialoguePerformance(exchange, echo, replies, timing, 0);
    assert.equal(performance.echoing, true, `${treeId}: the echo is up first`);
    assert.equal(performance.waiting, false, `${treeId}: the echo does not wait`);
    performance.tick(readingHold(echo.line, timing) + 0.01);
    assert.equal(performance.echoing, false, `${treeId}: the echo came down on its hold, with no click`);
    for (let at = 0; at < replies.length; at += 1) {
      assert.equal(performance.waiting, true, `${treeId}: reply ${at + 1} waits for its click`);
      assert.equal(performance.tick(1000 + at), false, `${treeId}: the clock alone never clears reply ${at + 1}`);
      performance.skip(1000 + at + 1);
    }
    checked += 1;
  }
  assert.ok(checked > 10, `exchanges checked: ${checked}`);
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
