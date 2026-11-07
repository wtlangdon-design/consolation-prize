/**
 * TEXT SPEED DOES WHAT IT SAYS, AND NO OPTIONS ROW IS A FALSE AFFORDANCE
 * (errata 154). The first-playthrough audit found Options' "Text speed" and
 * "Window scale" drawn as enabled rows that did nothing -- MenuSystem.select
 * had no case for either, and both fell to `{ kind: 'none' }` -- while
 * errata 152 had just told Tyler to use Text speed to set the pace.
 *
 * Doc 33 table 6: TEXT SPEED cycles SLOW / NORMAL / FAST / MANUAL, doc 30's
 * 1.35x / 1x / 0.75x holds with the 1.8 s minimum, and MANUAL never advances
 * a line by itself. Section 7.3: it is a machine setting, read apart from the
 * save slots. Section 8.3: "Remove the current inert Window scale row."
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import { holdTimingFor, readingHold } from '../engine/core/DialoguePerformance.ts';
import { waitsForClick } from '../engine/core/SpeechPolicy.ts';
import { SequenceRunner } from '../engine/core/Sequence.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

test('every enabled Options row does something; Window scale is gone', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  state.menu.openOn('options');
  const ids = state.menu.rows().filter((row) => row.enabled && row.id !== 'back').map((row) => row.id);
  assert.ok(!ids.includes('scale'), 'doc 33 section 8.3 removes the inert Window scale row');
  for (const id of ids) {
    const before = state.menu.rows().find((row) => row.id === id)!.label;
    state.menu.select(id);
    const after = state.menu.rows().find((row) => row.id === id)!.label;
    assert.notEqual(after, before, `Options row "${id}" changes what it shows when chosen`);
  }
});

test('Text speed cycles Slow, Normal, Fast, Manual and is kept apart from the save slots', async () => {
  const content = await loadContent(fsReader);
  const storage = new MemoryStorage();
  const state = new GameState(content, storage);
  assert.equal(state.menu.choice('textSpeed'), 'normal', 'Normal by default');
  state.save(0);
  state.menu.openOn('options');
  const seen: (string | undefined)[] = [];
  for (let i = 0; i < 4; i += 1) { state.menu.select('textSpeed'); seen.push(state.menu.choice('textSpeed')); }
  assert.deepEqual(seen, ['fast', 'manual', 'slow', 'normal'], 'one value on per click, wrapping');
  state.menu.select('textSpeed'); // fast
  assert.equal(state.menu.choice('textSpeed'), 'fast');
  // Loading a slot saved at Normal does not put it back (doc 33 section 7.3).
  state.load(0);
  assert.equal(state.menu.choice('textSpeed'), 'fast', 'a slot never changes the reading preference');
  // And it is still Fast in the next session on this machine.
  const again = new GameState(content, storage);
  assert.equal(again.menu.choice('textSpeed'), 'fast', 'the setting survives a new session');
});

test('each Text speed scales a real line\'s hold by doc 30\'s factor, within the clamp', async () => {
  const content = await loadContent(fsReader);
  const timing = content.ui.timing;
  const line = 'A sentence long enough that its hold sits between the minimum and the maximum.';
  const normal = readingHold(line, holdTimingFor(timing, 'normal'));
  const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;
  assert.ok(close(readingHold(line, holdTimingFor(timing, 'slow')), Math.min(8, normal * 1.35)), 'Slow is 1.35x');
  assert.ok(close(readingHold(line, holdTimingFor(timing, 'fast')), Math.max(1.8, normal * 0.75)), 'Fast is 0.75x');
  assert.ok(readingHold('Yes.', holdTimingFor(timing, 'fast')) >= 1.8, 'never under the 1.8 s minimum');
});

test('Manual makes every line wait for its click, and a click releases a scripted line', async () => {
  const content = await loadContent(fsReader);
  const manual = holdTimingFor(content.ui.timing, 'manual');
  assert.equal(manual.manual, true);
  assert.equal(waitsForClick({ conversation: false, clickToRead: false, manual: true }), true, 'an examine line waits');
  assert.equal(waitsForClick({ conversation: true, clickToRead: false, manual: true, echo: true }), true, 'even the player\'s echo');
  assert.equal(waitsForClick({ conversation: true, clickToRead: false, manual: true, rest: true }), false, 'a bare pause still keeps its time');
  assert.equal(holdTimingFor(content.ui.timing, 'normal').manual, false, 'Normal does not wait');
  // A scripted line held "until clicked" moves on at the next tick after releaseLine.
  const runner = new SequenceRunner();
  const said: string[] = [];
  const host = { say: (step: { line?: string }) => { said.push(step.line ?? ''); return 24 * 60 * 60; } } as never;
  runner.start([{ kind: 'say', line: 'One.' }, { kind: 'say', line: 'Two.' }] as never);
  runner.update(0, host);
  runner.update(100, host);
  assert.deepEqual(said, ['One.'], 'the clock alone does not move a held line on');
  runner.releaseLine();
  runner.update(100.1, host);
  assert.deepEqual(said, ['One.', 'Two.'], 'the click moved it on, one line');
});
