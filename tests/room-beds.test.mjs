/**
 * EVERY ROOM'S BED, AS DOC 45 PLANS IT (errata 203, 204).
 *
 * tools/check-room-beds.mjs holds the plan; this proves it fails on each kind
 * of violation, put back into the real data: a planned room without its bed, a
 * silent room given one, a bed or layer keyed to a puzzle flag, a layer that
 * follows nobody in the room, a sound on Prosperity's hole, and the raccoon's
 * breathing -- the one layer doc 45 named that invariant 3 drops, because the
 * raccoon sits in the hole's mouth. And the engine's side: a figure's layer
 * plays only while the figure is there, and the back room's bed is silent for
 * as long as a duel sounds.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { ambienceFor } from '../engine/core/Ambience.ts';
import { check, judge, planOf } from '../tools/check-room-beds.mjs';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const read = (path) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const manifest = read('content/manifest.json');
const doc = readFileSync(resolve(ROOT, 'docs/45-audio-cue-sheet.md'), 'utf8');
const rooms = new Map(manifest.rooms.map(read).map((room) => [room.id, room]));
const figures = new Map(manifest.ambient.map(read).map((npc) => [npc.id, npc]));
const flags = new Set(read(manifest.flags).flags.map((flag) => flag.id));
const fresh = () => read(manifest.sounds);
const failures = (sounds, page = doc) => judge({ doc: page, sounds, rooms, figures, flags }).failures;

test('every planned room has its bed, the silent four have none, and nothing is keyed to a puzzle', () => {
  assert.deepEqual(check().failures, []);
});

test('doc 45 is read for the plan: thirty-five rows and four silent rooms', () => {
  const plan = planOf(doc);
  assert.equal(plan.rows.length, 35);
  assert.deepEqual(plan.silent, ['13', '32', '33', '34']);
});

test('a planned room with no bed fails', () => {
  const sounds = fresh();
  delete sounds.ambience.boot_hill;
  assert.ok(failures(sounds).some((f) => f.includes('boot_hill') && f.includes('has no bed')));
});

test('a silent room given a bed fails: the undertaker\'s, the coffin, the chamber, under Prosperity', () => {
  for (const room of ['undertaker', 'coffin', 'listening_chamber', 'under_prosperity']) {
    const sounds = fresh();
    sounds.ambience[room] = { src: 'audio/sfx/wind.wav', gain: 0.4, why: 'a mistake' };
    assert.ok(failures(sounds).some((f) => f.includes(room) && f.includes('gives it none')), room);
  }
});

test('a row the doc adds, or one the plan drops, fails', () => {
  const sounds = fresh();
  delete sounds.bedPlan.rows['41'];
  assert.ok(failures(sounds).some((f) => f.includes("doc 45's table has rows")));
});

test('a bed or a layer keyed to a puzzle flag fails', () => {
  const when = fresh();
  when.ambience.livery.when = { T_GRIEVANCE_TUNED: true };
  assert.ok(failures(when).some((f) => f.includes('livery') && f.includes('`when`')));
  const layer = fresh();
  layer.ambience.livery.layers[0].when = { ACT: 2 };
  assert.ok(failures(layer).some((f) => f.includes("livery's layer 0 has `when`")));
  const named = fresh();
  named.ambience.church.duringDuel = 'T_DRAUGHT';
  assert.ok(failures(named).some((f) => f.includes('T_DRAUGHT')));
});

test('a layer that follows nobody in its room fails', () => {
  const sounds = fresh();
  sounds.ambience.livery.layers[0].whenPresent = 'alley_cat';
  assert.ok(failures(sounds).some((f) => f.includes('stands in back_alley')));
});

test('nothing at Prosperity is tied to the hole', () => {
  const verb = fresh();
  verb.verbs.push({ room: 'prosperity', target: 'hole', verb: 'LISTEN_TO', cue: 'R23/24-MUD' });
  assert.ok(failures(verb).some((f) => f.includes('sounds on hole')));
  const door = fresh();
  door.transits.push({ between: ['under_prosperity', 'prosperity'], cue: 'R05/06-LATCH' });
  assert.ok(failures(door).some((f) => f.includes('the way down the hole')));
});

test('the raccoon\'s breathing, the layer invariant 3 drops, fails if it is ever wired: he sits in the hole\'s mouth', () => {
  const sounds = fresh();
  sounds.ambience.prosperity.layers = [{ src: 'audio/sfx/dog-breathing.wav', gain: 0.2, whenPresent: 'raccoon' }];
  assert.ok(failures(sounds).some((f) => f.includes('follows raccoon, who sits on the hole')));
});

test('a figure\'s layer plays only while the figure is there', () => {
  const bed = fresh().ambience.livery;
  assert.deepEqual(ambienceFor(bed, new Set(['grievance']), null)?.layers.map((l) => l.src), ['audio/sfx/beds/grievance-breathing.wav']);
  assert.deepEqual(ambienceFor(bed, new Set(), null)?.layers, []);
  assert.equal(ambienceFor(undefined, new Set(), null), null);
});

test('the back room hears nothing in a duel but the duel\'s own cues (row 4); other rooms keep their beds', () => {
  const sounds = fresh();
  assert.equal(ambienceFor(sounds.ambience.nugget_back, new Set(), 'duel_one'), null);
  assert.equal(ambienceFor(sounds.ambience.nugget_back, new Set(), null)?.src, sounds.ambience.nugget_back.src);
  assert.equal(ambienceFor(sounds.ambience.nugget, new Set(), 'duel_one')?.src, sounds.ambience.nugget.src);
});
