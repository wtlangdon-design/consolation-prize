import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { TITLE_STAMPED, titleStampAt } from '../engine/core/Bookends.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MachineSettings, SETTINGS_KEY } from '../engine/core/MachineSettings.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

/**
 * THE TITLE, STAMPED (errata 259; doc 122 P7).
 *
 * Tyler, 2026-11-10: "maybe there's a trigger in the game that once you reach a certain point where the stamp is used,
 * then the stamp comes down on the title card?" and then "Go". A first title is clean. Once the Registrar's stamp has
 * been seen in play, the title is stamped each time it shows, with the stamp's own sound landing as the mark does.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const content = await loadContent(fsReader);
const stamp = content.title!.stamp!;

test('a first title is clean, and an earned one is stamped at its moment, the sound a little before the mark', () => {
  assert.deepEqual(titleStampAt(stamp, false, 60), { sound: false, down: false }, 'a player who has never seen the stamp has one on his title');
  assert.deepEqual(titleStampAt(stamp, true, null), { sound: false, down: false }, 'it comes down under "Click to begin"');
  assert.deepEqual(titleStampAt(stamp, true, 0), { sound: false, down: false }, 'it is there the instant the title shows: it should be seen to land');
  const strike = stamp.strike ?? 0;
  assert.ok(strike > 0 && stamp.at > strike, 'the sound has a lead-in, and room for it');
  assert.deepEqual(titleStampAt(stamp, true, stamp.at - strike), { sound: true, down: false }, 'the pad is dabbed before the stamp lands');
  assert.deepEqual(titleStampAt(stamp, true, stamp.at), { sound: true, down: true });
  assert.deepEqual(titleStampAt(undefined, true, 60), { sound: false, down: false });
});

test('what earns it is a cue the game plays, what sounds is a cue the game has, and the picture is on disk', async () => {
  const sounds = content.sounds!;
  assert.ok(sounds.cues[stamp.after], `${stamp.after} is not a cue`);
  if (stamp.cue) assert.ok(sounds.cues[stamp.cue], `${stamp.cue} is not a cue`);
  // It can be earned: something in play fires it.
  const acted = await readFile(resolve(ROOT, 'content/acted-directions.json'), 'utf8');
  const fired = (sounds.lines ?? []).some((rule) => rule.cue === stamp.after) || acted.includes(`"id": "${stamp.after}"`);
  assert.ok(fired, `nothing in play fires ${stamp.after}: the stamp could never be earned`);
  assert.ok(existsSync(resolve(ROOT, stamp.sheet)), `${stamp.sheet} is not drawn: python3 tools/art/title-stamp.py`);
  // The word is the game's own: the Registrar stamps Thad's papers with it (doc 57).
  const doc57 = await readFile(resolve(ROOT, 'docs/57-puzzle-completion.md'), 'utf8');
  assert.ok(doc57.includes(`stamped ${stamp.word}`), `the Registrar never stamps anything ${stamp.word}`);
  // And it is drawn from content: the tool names no word.
  const tool = await readFile(resolve(ROOT, 'tools/art/title-stamp.py'), 'utf8');
  assert.ok(!tool.includes(stamp.word) && tool.includes("['word']"), 'the stamp\'s word is typed into the tool');
});

test('it is the machine\'s, not a save\'s: a new game, a load and a reset leave it, and no save carries it', () => {
  const storage = new MemoryStorage();
  const state = new GameState(content, storage);
  assert.notEqual(state.machine.read(TITLE_STAMPED), true, 'a fresh machine has seen the stamp');
  state.machine.write(TITLE_STAMPED, true);
  state.save();
  state.reset();
  assert.equal(state.machine.read(TITLE_STAMPED), true, 'NEW GAME took the stamp off the title');
  assert.equal(new GameState(content, storage).machine.read(TITLE_STAMPED), true, 'it did not survive the page');
  for (const key of ['consolation.save.v1']) assert.ok(!(storage.getItem(key) ?? '').includes(TITLE_STAMPED), 'the save carries the stamp');
  assert.ok((storage.getItem(SETTINGS_KEY) ?? '').includes(TITLE_STAMPED));
  assert.equal(new MachineSettings(new MemoryStorage()).read(TITLE_STAMPED), undefined);
});

test('the scene earns it only in play, and sounds and draws it by the rule', async () => {
  const scene = await readFile(resolve(ROOT, 'engine/scenes/GameScene.ts'), 'utf8');
  assert.ok(/if \(!this\.titleMenu && id === this\.state\.content\.title\?\.stamp\?\.after/.test(scene),
    'the title\'s own stamp could earn the title\'s stamp');
  const tick = scene.slice(scene.indexOf('private tickTitleStamp('), scene.indexOf('private onTitleClick('));
  assert.ok(tick.includes('titleStampAt(') && tick.includes('this.beginCard'), 'the stamp is not timed by the rule, or ignores the begin card');
  assert.ok(!new RegExp(`['"\`]${stamp.word}['"\`]`).test(scene), 'the stamp\'s word is in the scene');
});
