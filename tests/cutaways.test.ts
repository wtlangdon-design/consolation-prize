/**
 * THE CUT-AWAYS (errata 158; doc 96). Monkey Island's LeChuck scenes: the
 * screen leaves the hero, shows somewhere else, and comes back exactly where
 * it was. Tyler, 2026-11-07: "You decide, and I want them included now so
 * that they're part of my play through."
 *
 * What can be held without a browser: the three are extracted with their
 * rooms, flags and speakers; nobody in one is anyone who could give the game
 * away; the claim jumper's scene names no money; and a visit changes nothing in the
 * story -- no flag, no standing place, and a save taken during one lands in
 * the room the hero is really in.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

test('three cut-aways, each with a room, a once-only flag, and lines spoken by people who are there', async () => {
  const content = await loadContent(fsReader);
  assert.equal(content.cutaways.length, 3, 'doc 96 has three');
  const flags = new Set(content.flags.flags.map((flag) => flag.id));
  for (const cut of content.cutaways) {
    assert.ok(content.rooms.has(cut.room), `${cut.id}: ${cut.room}`);
    assert.ok(flags.has(cut.done), `${cut.id}: its done flag ${cut.done} is declared`);
    const declared = content.flags.flags.find((flag) => flag.id === cut.done)!;
    assert.deepEqual(declared.writtenBy, [`cutaway:${cut.id}`]);
    for (const id of Object.keys(cut.when)) assert.ok(flags.has(id), `${cut.id}: reads ${id}`);
    assert.ok(cut.lines.length >= 3);
    // Whoever speaks is a figure in that room, or the one voice nobody sees.
    for (const { speaker } of cut.lines) {
      if (speaker === 'cutaway_voice') continue;
      const here = [...content.ambient.values()].some((npc) => npc.id === speaker && npc.room === cut.room);
      assert.ok(here, `${cut.id}: ${speaker} is a figure in ${cut.room}`);
    }
  }
});

test('no cut-away holds the reveal or the answer', async () => {
  const content = await loadContent(fsReader);
  for (const cut of content.cutaways) {
    // The watchman's identity is the game's best reveal (doc 01): he is in none.
    assert.ok(!cut.lines.some((line) => line.speaker === 'hob'), `${cut.id}: not the watchman`);
    assert.notEqual(cut.room, 'watchmans_shack', `${cut.id}: not the watchman's shack`);
  }
  // D5 is solved by working out how the claim jumper is paid: his scene names no money.
  const jumper = content.cutaways[1]!;
  for (const { line } of jumper.lines) {
    assert.ok(!/[\d$]|dollar|fee|paid|pay|money|week/i.test(line), `no money in the claim jumper's scene: "${line}"`);
  }
  // The Colonel only once the Act II turn has landed (doc 01's rule for him).
  const colonel = content.cutaways[2]!;
  assert.deepEqual(colonel.when.ACT, { atLeast: 3, atMost: 3 });
});

test('a visit is not an arrival: it changes nothing, and a save in one lands where he really is', async () => {
  const content = await loadContent(fsReader);
  const storage = new MemoryStorage();
  const state = new GameState(content, storage);
  state.enterRoom('main_street');
  state.rememberStanding(1234, 760);
  const flagsBefore = JSON.stringify(state.flags.snapshot());
  const elsewhere = content.cutaways[2]!.room;
  state.cutTo(elsewhere);
  assert.equal(state.roomId, elsewhere);
  assert.equal(state.inCutaway, true);
  state.rememberStanding(10, 10);
  state.save(0);
  state.cutBack();
  assert.equal(state.roomId, 'main_street');
  assert.equal(state.inCutaway, false);
  assert.equal(JSON.stringify(state.flags.snapshot()), flagsBefore, 'no onEnter write, nothing at all');
  const again = new GameState(content, storage);
  assert.ok(again.load(0));
  assert.equal(again.roomId, 'main_street', 'the save is where he was, not where the camera went');
  assert.deepEqual(again.resumeStanding(null) ?? again['standing']?.get?.('main_street'), [1234, 760]);
});

test('a close-up is declared exactly when both its frames are drawn, at the play area\'s size (errata 159)', async () => {
  const { existsSync, readdirSync, readFileSync } = await import('node:fs');
  const content = await loadContent(fsReader);
  const colonel = content.cutaways[2]!;
  // The frames are whatever the image session delivered into art/cutaways/: a rest and a talk.
  const dir = resolve(ROOT, 'art/cutaways');
  const files = existsSync(dir) ? readdirSync(dir) : [];
  const drawn = files.some((name) => name.endsWith('-closeup-rest.png')) && files.some((name) => name.endsWith('-closeup-talk.png'));
  assert.equal(Boolean(colonel.closeup), drawn, 'declared only once the image session has delivered both');
  if (!drawn) return;
  for (const path of colonel.closeup!.frames) {
    const bytes = readFileSync(resolve(ROOT, path));
    assert.equal(bytes.readUInt32BE(16), 1920, `${path} width`);
    assert.equal(bytes.readUInt32BE(20), 864, `${path} height`);
  }
  assert.ok(content.cutaways.slice(0, 2).every((one) => !one.closeup), 'the two comic scenes play in their rooms');
});

test('the Colonel\'s scene opens on the Company from the street, under its own darker music (errata 160)', async () => {
  const { existsSync } = await import('node:fs');
  const content = await loadContent(fsReader);
  const colonel = content.cutaways[2]!;
  const shot = colonel.establishing!;
  assert.ok(shot && existsSync(resolve(ROOT, shot.image)), 'the opening shot is a picture the game has');
  assert.ok(shot.seconds >= 2 && shot.seconds <= 8 && shot.push > 0 && shot.push <= 0.15, 'a held shot, creeping, not zooming');
  const music = colonel.music!;
  assert.ok(music && existsSync(resolve(ROOT, music.src)), 'its music is a file the game has');
  assert.ok(music.rate! > 0.6 && music.rate! < 1, 'played slower and lower than written');
  assert.ok(content.cutaways.slice(0, 2).every((one) => !one.establishing && !one.music), 'the comic scenes play in their rooms');
});

test('a bed played at a rate is slowed on top of the score\'s detune, and is a different bed', async () => {
  const { Music } = await import('../engine/core/Music.ts');
  const made: { src: string; playbackRate: number; paused: boolean }[] = [];
  class FakeAudio {
    volume = 1; currentTime = 0; paused = true; loop = false; playbackRate = 1; preservesPitch = true; preload = ''; duration = 30;
    readonly dataset: Record<string, string> = {};
    readonly src: string;
    constructor(src: string) { this.src = src; made.push(this); }
    play(): Promise<void> { this.paused = false; return Promise.resolve(); }
    pause(): void { this.paused = true; }
    addEventListener(): void { /* no errors */ }
  }
  Object.assign(globalThis, { Audio: FakeAudio, requestAnimationFrame: () => 0 });
  const music = new Music(() => true);
  music.unlock();
  music.play({ src: 'theme.wav' });
  const plain = made.find((one) => one.src === 'theme.wav')!.playbackRate;
  music.play({ src: 'theme.wav', rate: 0.84 });
  assert.equal(music.bed, 'theme.wav@0.84', 'a different bed, so the room bed and the scene bed are told apart');
  assert.ok(Math.abs(made.find((one) => one.src === 'theme.wav')!.playbackRate - plain * 0.84) < 1e-9);
});

test('a proof that sets a cut-away\'s state waits for the cut-away before it acts or captures', async () => {
  // Errata 161: setting ACT 3 plays Fanshawe's cut-away at once; the proofs
  // that set it clicked into it (swallowed) or photographed it as the room.
  const { readdirSync } = await import('node:fs');
  const cutaways = (await fsReader('content/cutaways.json')) as { cutaways: { id: string; when: Record<string, unknown> }[] };
  const holds = (when: Record<string, unknown>, flags: Record<string, unknown>) => Object.entries(when).every(([key, want]) => {
    const have = flags[key] ?? (key === 'ACT' ? 1 : false);
    if (want && typeof want === 'object') {
      const range = want as { atLeast?: number; atMost?: number };
      return Number(have) >= (range.atLeast ?? -Infinity) && Number(have) <= (range.atMost ?? Infinity);
    }
    return have === want;
  });
  const late: string[] = [];
  for (const file of readdirSync(resolve(ROOT, 'proofs/spec')).filter((name) => name.endsWith('.json'))) {
    const spec = (await fsReader('proofs/spec/' + file)) as { room: string; principalChange?: { flags?: Record<string, unknown>; actions?: { do: string; room?: string }[] } };
    const change = spec.principalChange;
    if (!change?.flags) continue;
    if (!cutaways.cutaways.some((one) => holds(one.when, change.flags!))) continue;
    const first = (change.actions ?? []).find((action) => action.do !== 'wait');
    if (!(first?.do === 'waitFor' && first.room === spec.room)) late.push(file);
  }
  assert.deepEqual(late, [], 'these set a cut-away\'s state and do not wait for it to end');
});
