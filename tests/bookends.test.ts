/**
 * THE TITLE AND THE CLOSE (errata 128; the bookends audit, findings 2 and 3).
 *
 * The game booted straight into Room 1, so the opening played in silence (a
 * browser plays nothing before a click) and "Quit to Title" silently started
 * a new game. And after the letter's last line the play area stayed black for
 * ever over a live verb panel: no ending, no way back to a title.
 *
 * These hold the pieces that can be held without a browser: the title's menu
 * from content, CONTINUE's rule, the close's room and its phases.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { endingAt, titleItems } from '../engine/core/Bookends.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

test('the title is content: its plate, its drawn title and its four items exist', async () => {
  const content = await loadContent(fsReader);
  const title = content.title;
  assert.ok(title, 'the manifest names content/ui/title.json');
  assert.ok(existsSync(resolve(ROOT, title.background)), title.background);
  assert.ok(title.logo && existsSync(resolve(ROOT, title.logo)), String(title.logo));
  assert.deepEqual(title.menu.items.map((item) => item.id), ['new', 'continue', 'options', 'credits']);
  // Tyler, 2026-11-06: "Title + THE END only". The words are content, never code.
  assert.ok(title.theEnd, 'the ending says THE END under the title');
});

test('CONTINUE is there and dim with no save; CREDITS is there and inert, because no document writes them', async () => {
  const content = await loadContent(fsReader);
  const none = titleItems(content.title!, false);
  assert.deepEqual(none.map((item) => [item.id, item.enabled]),
    [['new', true], ['continue', false], ['options', true], ['credits', false]]);
  assert.equal(titleItems(content.title!, true).find((item) => item.id === 'continue')?.enabled, true);
  for (const item of none) {
    assert.equal(item.label, content.title!.menu.items.find((each) => each.id === item.id)?.label, 'labels are content');
  }
});

test('CONTINUE needs a save, and not one taken after the close', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  assert.equal(state.canContinue, false, 'no save');
  state.autosave();
  assert.equal(state.canContinue, true, 'a game in progress');
  const close = [...content.rooms.values()].find((room) => room.endsGame);
  assert.ok(close?.blackWhen, 'the room the game ends in, and when it is over');
  state.enterRoom(close.id);
  state.flags.applyWrites(close.blackWhen as Record<string, boolean>);
  state.autosave();
  assert.equal(state.canContinue, false, 'a finished game has nothing to continue');
});

test('the close ends the game: no panel, the letter on one page over black, and an ending', async () => {
  const content = await loadContent(fsReader);
  const ends = [...content.rooms.values()].filter((room) => room.endsGame);
  assert.equal(ends.length, 1, 'one room ends the game');
  const close = ends[0]!;
  assert.equal(close.interface, 'none', 'doc 48 S7 beats 3-5 are control none');
  // The beat that arrives there: its first line in the picture, the letter over black.
  const scene = [...content.rooms.values()].flatMap((room) => room.exits ?? [])
    .filter((exit) => exit.to === close.id)
    .flatMap((exit) => (exit as { transitScene?: { arrives?: boolean; then?: { overBlack?: boolean }[] }[] }).transitScene ?? [])
    .find((rule) => rule.arrives);
  assert.ok(scene?.then?.length, 'the close is played where it arrives');
  assert.ok(scene.then.length >= 4 && scene.then.every((line) => line.overBlack), 'the letter is over black, every line');
  const timing = content.ui.timing;
  for (const key of ['endingHoldSeconds', 'endingFadeSeconds', 'endingBlackSeconds'] as const) {
    assert.ok((timing?.[key] ?? 0) > 0, key);
  }
});

test('after the last line: the page holds, fades, goes black, and the title returns', () => {
  const timing = { hold: 7, fade: 3, black: 2 };
  assert.deepEqual(endingAt(0, timing), { phase: 'hold', pageAlpha: 1 });
  assert.equal(endingAt(6.9, timing).phase, 'hold');
  const fading = endingAt(8.5, timing);
  assert.equal(fading.phase, 'fade');
  assert.ok(fading.pageAlpha > 0 && fading.pageAlpha < 1);
  assert.deepEqual(endingAt(10.5, timing), { phase: 'black', pageAlpha: 0 });
  assert.deepEqual(endingAt(12, timing), { phase: 'title', pageAlpha: 0 });
});
