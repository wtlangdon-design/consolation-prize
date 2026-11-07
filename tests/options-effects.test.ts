/**
 * EVERY OPTIONS ROW CHANGES SOMETHING THE PLAYER CAN SEE OR HEAR (errata 156).
 *
 * Errata 154 required each row's label to change when chosen, and BACKGROUND
 * MOTION passed it -- its On/Off label flipped -- while the palette cycling it
 * switched had been retired by errata 54 and no room had a live element. A
 * label is not an effect. So each row id here names what it acts on, and that
 * thing must exist in the shipped game; a row with no consumer fails.
 *
 * And MUSIC did the opposite of its name: it gated the sound effects and the
 * room backgrounds, and an off switch only refused to START a bed, so the one
 * playing played on. Tyler, 2026-11-07: "Music only".
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { liveCycling } from '../engine/core/PaletteCycling.ts';
import { Music } from '../engine/core/Music.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

test('every Options row acts on something that exists in the game', async () => {
  const content = await loadContent(fsReader);
  const rooms = readdirSync(resolve(ROOT, 'content/rooms')).filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(readFileSync(resolve(ROOT, 'content/rooms', name), 'utf8')) as { cycling?: never[] });
  const effects: Record<string, () => boolean> = {
    music: () => Object.keys(content.manifest.music?.rooms ?? {}).length > 0,
    textSpeed: () => Boolean(content.ui.timing?.textSpeeds),
    cycling: () => rooms.some((room) => liveCycling(room).length > 0),
  };
  const inert: string[] = [];
  for (const item of content.menu.options.items) {
    const effect = effects[item.id];
    if (!effect) inert.push(`${item.id}: nothing in the engine reads it`);
    else if (!effect()) inert.push(`${item.id}: what it switches is not in the game`);
  }
  assert.ok(rooms.length > 30, `rooms read: ${rooms.length}`);
  assert.deepEqual(inert, [], 'a row that changes nothing is a false affordance (doc 33 section 8.3)');
});

class FakeAudio {
  static made: FakeAudio[] = [];
  volume = 1; currentTime = 0; paused = true; loop = false; playbackRate = 1; preservesPitch = true; preload = ''; duration = 30;
  readonly dataset: Record<string, string> = {};
  readonly src: string;
  constructor(src: string) { this.src = src; FakeAudio.made.push(this); }
  play(): Promise<void> { this.paused = false; return Promise.resolve(); }
  pause(): void { this.paused = true; }
  addEventListener(): void { /* no errors in a fake */ }
}

test('Music Off stops the bed that is playing, and On brings this room\'s back', () => {
  FakeAudio.made = [];
  Object.assign(globalThis, { Audio: FakeAudio, requestAnimationFrame: () => 0 });
  let on = true;
  const music = new Music(() => on);
  music.unlock();
  music.play({ src: 'room.wav' });
  assert.equal(music.bed, 'room.wav');
  on = false; music.refresh();
  assert.equal(music.bed, null, 'Off silences the bed already playing');
  music.play({ src: 'next-room.wav' });
  assert.equal(music.bed, null, 'and a new room stays silent while it is off');
  on = true; music.refresh();
  assert.equal(music.bed, 'next-room.wav', 'On plays the room he is in');
});

test('the Music switch reaches the score and nothing else', () => {
  const scene = readFileSync(resolve(ROOT, 'engine/scenes/GameScene.ts'), 'utf8');
  const gated = [...scene.matchAll(/private readonly (\w+) = new (\w+)\(\(\) => this\.state\.menu\.toggle\(MUSIC_OPTION\)/g)].map((m) => m[1]);
  assert.deepEqual(gated, ['music'], 'footsteps, doors and room backgrounds are not music');
});
