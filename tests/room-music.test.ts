/**
 * THE ROOM MIXES (errata 103; doc 28 Part Three).
 *
 * Every bed, layer and variant the manifest names is a file that exists; the
 * undertaker's is deliberate silence; every entry says why it is what it is;
 * and the music player keeps a bed's layers going on their own loops -- one
 * file shared by two rooms carries on through the crossfade, and the coffin's
 * suspend brings every layer back where it would have been.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { Music } from '../engine/core/Music.ts';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
type Track = { src: string; gain?: number; layers?: Track[]; variants?: (Track & { when: Record<string, boolean> })[]; why?: string };
const manifest = JSON.parse(readFileSync(resolve(ROOT, 'content/manifest.json'), 'utf8')) as {
  music: { title: Track; rooms: Record<string, Track | null> };
};

const filesOf = (track: Track): string[] => [
  track.src,
  ...(track.layers ?? []).map((layer) => layer.src),
  ...(track.variants ?? []).flatMap((variant) => filesOf(variant)),
];

test('every music file the manifest names is on disk', () => {
  const named = [manifest.music.title, ...Object.values(manifest.music.rooms)]
    .filter((track): track is Track => track !== null)
    .flatMap(filesOf);
  const missing = [...new Set(named)].filter((src) => !existsSync(resolve(ROOT, src)));
  assert.deepEqual(missing, [], 'Music.ts plays a missing file as silence, so a typo here is a silent room');
});

test("the undertaker's is silence, on purpose, and says nothing about why in the game (doc 28 Room 13)", () => {
  assert.equal(manifest.music.rooms.undertaker, null);
});

test('every room bed carries its reason', () => {
  for (const [room, track] of Object.entries(manifest.music.rooms)) {
    if (track === null) continue;
    assert.ok(track.why && /doc 28|errata/i.test(track.why), `${room}: no doc 28 line or ruling in "why"`);
  }
});

test('every room in the game has music chosen for it: none falls back to the title bed by omission (errata 104)', () => {
  const roomsDir = resolve(ROOT, 'content/rooms');
  // Engine fixtures, unbuilt candidates and stubs are not rooms a player walks
  // into; the coffin's music is the room's own `suspend` (doc 45 R32-MUTE).
  const notPlayed = /^(harness_|.*_candidate$|stub_)/;
  const ids = readdirSync(roomsDir)
    .map((file) => (JSON.parse(readFileSync(resolve(roomsDir, file), 'utf8')) as { id?: string; music?: string }))
    .filter((room) => room.id && !notPlayed.test(room.id) && room.music !== 'suspend')
    .map((room) => room.id as string);
  const unchosen = ids.filter((id) => !(id in manifest.music.rooms));
  assert.deepEqual(unchosen, [], 'a new room needs its music in content/manifest.json, or null for silence');
});

// ---------------------------------------------------------------- the player

class FakeAudio {
  static made: FakeAudio[] = [];
  volume = 1;
  currentTime = 0;
  paused = true;
  loop = false;
  playbackRate = 1;
  preservesPitch = true;
  preload = '';
  duration = 30;
  readonly dataset: Record<string, string> = {};
  readonly src: string;
  constructor(src: string) { this.src = src; FakeAudio.made.push(this); }
  play(): Promise<void> { this.paused = false; return Promise.resolve(); }
  pause(): void { this.paused = true; }
  addEventListener(): void { /* no errors in a fake */ }
}

function player(): Music {
  FakeAudio.made = [];
  Object.assign(globalThis, { Audio: FakeAudio, requestAnimationFrame: () => 0 });
  const music = new Music(() => true);
  music.unlock();
  return music;
}

const playing = (src: string): FakeAudio | undefined => FakeAudio.made.find((a) => a.src === src && !a.paused);

test('a bed starts its layers with it, each looping on its own', () => {
  const music = player();
  music.play({ src: 'bed.wav', layers: [{ src: 'layer.wav', gain: 0.4 }] });
  assert.ok(playing('bed.wav')?.loop);
  assert.ok(playing('layer.wav')?.loop);
});

test('a file in both the old bed and the new carries on instead of restarting', () => {
  const music = player();
  music.play({ src: 'fiddle.wav', layers: [{ src: 'piano.wav' }] });
  const piano = playing('piano.wav')!;
  piano.currentTime = 12.5;
  music.play({ src: 'piano.wav' });
  assert.equal(playing('piano.wav'), piano);
  assert.equal(piano.currentTime, 12.5, 'restarted under itself');
});

test('the coffin stops every layer dead, and each comes back where it would have been', () => {
  const music = player();
  music.play({ src: 'bed.wav', layers: [{ src: 'bell.wav' }] });
  const bed = playing('bed.wav')!;
  const bell = playing('bell.wav')!;
  bed.currentTime = 10;
  bell.duration = 21;
  bell.currentTime = 20;
  music.suspend();
  assert.ok(bed.paused && bell.paused);
  music.resume(5);
  assert.equal(bed.currentTime, 15);
  assert.equal(bell.currentTime, (20 + 5) % 21, 'a layer wraps at its own length, not the bed\'s');
  assert.ok(!bed.paused && !bell.paused);
});

test('silence fades out every layer', () => {
  const music = player();
  music.play({ src: 'bed.wav', layers: [{ src: 'layer.wav' }] });
  music.play(null);
  // requestAnimationFrame is stubbed, so the ramp's first step has run and no
  // other: both voices have begun to fade and neither is the playing bed.
  music.play({ src: 'bed.wav', layers: [{ src: 'layer.wav' }] });
  assert.ok(playing('bed.wav') && playing('layer.wav'), 'asking again brings both back');
});
