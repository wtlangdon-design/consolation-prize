/**
 * DOC 45'S EVERYDAY SOUNDS, WIRED (errata 105).
 *
 * The sounds file names only files that exist and cues it defines; every verb
 * it hears is a real target and verb in a real room; every door it hears joins
 * two rooms that really connect; every room a player walks in has a floor to
 * walk on; a sound tied to one written line follows that line; and no
 * load-bearing LISTEN gets a sound of its own (doc 05, doc 45 section 3.5).
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import type { Interactable, SoundsFile } from '../engine/core/types.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const manifest = JSON.parse(readFileSync(resolve(ROOT, 'content/manifest.json'), 'utf8')) as { sounds: string };
const sounds = JSON.parse(readFileSync(resolve(ROOT, manifest.sounds), 'utf8')) as SoundsFile;

test('every file the sounds name is on disk', () => {
  const files = [
    ...Object.values(sounds.cues).flatMap((cue) => [...(cue.play ?? []), ...(cue.bed ? [cue.bed] : [])].map((part) => part.src)),
    ...Object.values(sounds.ambience).flatMap((bed) => (bed.layers ?? []).map((layer) => layer.src)),
    ...Object.values(sounds.footsteps.surfaces).flat(),
    ...Object.values(sounds.ambience).map((bed) => bed.src),
  ];
  assert.deepEqual([...new Set(files)].filter((src) => !existsSync(resolve(ROOT, src))), []);
});

test('every cue a verb or a door fires is defined, and every step trigger\'s cue too', async () => {
  const content = await loadContent(fsReader);
  const fired = [...sounds.verbs.map((rule) => rule.cue), ...sounds.transits.map((rule) => rule.cue)];
  for (const room of content.rooms.values()) {
    for (const thing of room.hotspots ?? []) if (thing.step?.cue) fired.push(thing.step.cue);
  }
  // The opening's cues (errata 106), every line that sounds, and every engine event.
  const opening = JSON.parse(readFileSync(resolve(ROOT, 'content/sequences/opening.json'), 'utf8')) as
    { beats: { staging?: { do: string; cue?: string }[] }[] };
  for (const beat of opening.beats) for (const step of beat.staging ?? []) if (step.do === 'cue') fired.push(step.cue!);
  fired.push(...(sounds.lines ?? []).map((rule) => rule.cue), ...Object.values(sounds.events ?? {}));
  // A townsperson's played bark, and a sound on Room 33's tuning arc (errata 116).
  for (const npc of content.ambient.values()) fired.push(...Object.values(npc.barkCues ?? {}));
  for (const room of content.rooms.values()) fired.push(...(room.listening?.tune.cues ?? []).map((one) => one.cue));
  assert.deepEqual(fired.filter((cue) => !(cue in sounds.cues)), []);
});

test('every line that sounds is a line the game shows, word for word', () => {
  const everything = ['content/rooms', 'content/dialogue']
    .flatMap((dir) => readdirSync(resolve(ROOT, dir)).map((file) => readFileSync(resolve(ROOT, dir, file), 'utf8')))
    .join('\n');
  for (const rule of sounds.lines ?? []) {
    assert.ok(everything.includes(JSON.stringify(rule.line)), `"${rule.line}" (${rule.cue}) is in no room or tree: the doc changed it`);
  }
});

test('the opening plays its sounds where doc 45 puts them (errata 106)', () => {
  const opening = JSON.parse(readFileSync(resolve(ROOT, 'content/sequences/opening.json'), 'utf8')) as
    { beats: { beat: string; staging?: { do: string; cue?: string }[] }[] };
  const where = Object.fromEntries(opening.beats.flatMap((beat) =>
    (beat.staging ?? []).filter((step) => step.do === 'cue').map((step) => [step.cue!, beat.beat])));
  // O-02-S2, the team at the halt, starts in errata 157's stars (beat 1b): the
  // coach has halted before the view comes down, and Tyler approved "the
  // horses breathe" in the dark.
  assert.deepEqual(where, { 'O-02-S2': '1b', 'O-06-S1': '6', 'O-06B-S': '6b', 'O-09-M': '9' });
});

test('every verb the sounds hear is a real target and verb in its room', async () => {
  const content = await loadContent(fsReader);
  for (const rule of sounds.verbs) {
    const room = content.rooms.get(rule.room);
    assert.ok(room, `${rule.cue}: no room ${rule.room}`);
    const target = [...(room.hotspots ?? []), ...(room.exits ?? [])].find((thing) => thing.id === rule.target);
    assert.ok(target, `${rule.cue}: no ${rule.target} in ${rule.room}`);
    // An item used on it is a combination pair (doc 24), not one of its own responses.
    const paired = rule.item !== undefined && content.combinations.pairs.some((pair) =>
      pair.item === rule.item && pair.target === rule.target && (!pair.room || pair.room === rule.room));
    assert.ok(target.responses?.[rule.verb] || target.overrides?.[rule.verb] || rule.verb === 'OPEN' || paired,
      `${rule.cue}: ${rule.target} has nothing for ${rule.verb}${rule.item ? ` with ${rule.item}` : ''}`);
  }
});

test('every door the sounds hear joins two rooms that connect', async () => {
  const content = await loadContent(fsReader);
  for (const { between: [a, b], cue } of sounds.transits) {
    const joined = (from: string, to: string) => (content.rooms.get(from)?.exits ?? []).some((exit) => exit.to === to);
    assert.ok(joined(a, b) || joined(b, a), `${cue}: ${a} and ${b} have no door between them`);
  }
});

test('every room a player walks in has a floor to sound on', async () => {
  const content = await loadContent(fsReader);
  const notWalked = /^(harness_|.*_candidate$|stub_|town_map$)/;
  const unfloored = [...content.rooms.values()]
    .filter((room) => !notWalked.test(room.id) && room.music !== 'suspend')
    .map((room) => room.id)
    .filter((id) => !((sounds.footsteps.rooms[id] ?? "") in sounds.footsteps.surfaces));
  assert.deepEqual(unfloored, []);
});

test('a sound tied to written lines follows the line: the sign creaks twice, then has stopped (R01-SIGN)', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  const rule = sounds.verbs.find((each) => each.cue === 'R01-SIGN');
  assert.ok(rule?.variants);
  assert.equal(state.roomId, rule.room);
  const sign = state.room.hotspots?.find((thing) => thing.id === rule.target) as Interactable;
  const variants = [1, 2, 3, 4].map(() => state.interact(sign, rule.verb).variant);
  assert.deepEqual(variants, [1, 2, 3, 3], 'one variant per written line, holding at the last');
  assert.deepEqual(variants.map((variant) => rule.variants!.includes(variant!)), [true, true, false, false]);
});

test('no load-bearing LISTEN has a sound of its own: the timesheet plays what other paper plays (doc 05; doc 45 R08-TIME)', () => {
  const timesheet = sounds.verbs.find((rule) => rule.cue === 'R08-TIME');
  if (!timesheet) return;
  const own = (sounds.cues[timesheet.cue]!.play ?? []).map((part) => part.src);
  const elsewhere = new Set(sounds.verbs.filter((rule) => rule.cue !== timesheet.cue)
    .flatMap((rule) => (sounds.cues[rule.cue]!.play ?? []).map((part) => part.src)));
  for (const src of own) assert.ok(elsewhere.has(src), `${src} is heard only on the timesheet`);
});
