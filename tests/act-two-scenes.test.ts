import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';

/**
 * ACT II'S THREE SCENES (doc 113; errata 242), held where the full walkthrough does not already hold them. The audit
 * (doc 112) found the stretch's one hands-on room had nothing to solve, a claim-jump the player could only talk at,
 * and an arrival line describing people the picture did not show.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const content = await loadContent(fsReader);
const DOC = 'docs/113-act-two-scenes.md';
type Rule = Record<string, unknown> & { sceneLine?: unknown; when?: Record<string, unknown> };
const rulesOf = (room: string): { owner: string; verb: string; rule: Rule }[] => {
  const file = content.rooms.get(room)!;
  const out: { owner: string; verb: string; rule: Rule }[] = [];
  for (const spot of file.hotspots) {
    for (const [verb, rules] of Object.entries(spot.responses ?? {})) for (const rule of rules as Rule[]) out.push({ owner: spot.id, verb, rule });
  }
  for (const [who, verbs] of Object.entries(file.peopleResponses ?? {})) {
    for (const [verb, rules] of Object.entries(verbs as Record<string, Rule[]>)) for (const rule of rules) out.push({ owner: who, verb, rule });
  }
  return out;
};
// Room ids are read from the content, as every test's are: the swap's pair names the office, the figure names the claim.
const OFFICE = content.combinations.pairs.find((pair) => pair.item === 'company_ledger' && pair.target === 'submission_log')!.room!;
const JUMPER = [...content.ambient.values()].find((npc) => npc.id.endsWith('_jump'))!;
const WRITES = ['set', 'grants', 'items', 'takes', 'completes', 'goto', 'dialogue'];

test('A: no verb on the desk hands the log over bare; only the swap does, and it leaves the double in its place', () => {
  const bare = rulesOf(OFFICE).filter(({ rule }) => (rule.items as string[] | undefined)?.includes('padded_log')
    || (rule.grants as string[] | undefined)?.includes('padded_log'));
  assert.deepEqual(bare.map((one) => `${one.owner} ${one.verb}`), [], 'the log is not picked up off the desk');
  const swaps = content.combinations.pairs.filter((pair) => pair.rules?.some((rule) => rule.items?.includes('padded_log')));
  assert.deepEqual(swaps.map((pair) => `${pair.item} on ${pair.room}/${pair.target}`), [`company_ledger on ${OFFICE}/submission_log`]);
  const rule = swaps[0]!.rules!.find((one) => one.items?.includes('padded_log'))!;
  assert.deepEqual(rule.takes, ['company_ledger'], 'the ledger stays on the desk');
  assert.deepEqual(rule.set, { T_QUEUE_PADDED: true });
  const room = content.rooms.get(OFFICE)!;
  const log = room.hotspots.find((spot) => spot.id === 'submission_log')!;
  const double = room.hotspots.find((spot) => spot.id === 'ledger_on_the_desk')!;
  assert.deepEqual(log.when, { T_QUEUE_PADDED: false });
  assert.deepEqual(double.when, { T_QUEUE_PADDED: true }, 'after the swap the book on the desk is the double');
  assert.deepEqual(double.rect, log.rect, 'and it lies where the log lay');
});

test('A: the shelf gives one ledger, once, and only while the office is empty', () => {
  const gives = rulesOf(OFFICE).filter(({ rule }) => (rule.grants as string[] | undefined)?.includes('company_ledger'));
  assert.equal(gives.length, 1);
  assert.deepEqual(gives[0]!.rule.when, { T_FUNERAL_DAY: true, T_QUEUE_PADDED: false, T_LEDGER_TAKEN: false });
  assert.deepEqual(gives[0]!.rule.set, { T_LEDGER_TAKEN: true });
});

test('B: nothing tried on the man on the claim or on the marker changes anything', () => {
  const scene = rulesOf(JUMPER.room!).filter(({ rule }) => typeof rule.sceneLine === 'string' && rule.sceneLine.startsWith(`${DOC}::### B`));
  assert.ok(scene.length >= 7, `the scene's verbs are in the room (${scene.length})`);
  for (const { owner, verb, rule } of scene) {
    for (const key of WRITES) assert.equal(rule[key], undefined, `${owner} ${verb} writes ${key}`);
  }
  const pairs = content.combinations.pairs.filter((pair) => pair.room === JUMPER.room && pair.target === JUMPER.id);
  assert.equal(pairs.length, 2);
  for (const pair of pairs) for (const rule of pair.rules ?? []) for (const key of WRITES) assert.equal((rule as unknown as Rule)[key], undefined);
});

test('C: whoever the arrival line puts on the hill is drawn on exactly the entries it is said on', () => {
  const room = content.rooms.get('boot_hill')!;
  const enter = room.onEnter!;
  const town = [...content.ambient.values()].filter((npc) => npc.room === 'boot_hill' && 'T_TOWN_ON_HILL' in (npc.when ?? {}));
  assert.equal(town.length, 2, 'the town, and the man in front of it');
  for (const npc of town) assert.deepEqual(npc.when, { T_TOWN_ON_HILL: true });
  assert.equal(enter.set?.T_TOWN_ON_HILL, false, 'gone on the next entry');
  const sets = (enter.setWhen ?? []).filter((rule) => rule.set.T_TOWN_ON_HILL === true);
  assert.equal(sets.length, 1);
  assert.deepEqual(sets[0]!.when, enter.sayWhen, 'there when, and only when, the line about them is said');
  const spot = room.hotspots.find((one) => one.id === 'town_coming_down')!;
  assert.deepEqual(spot.when, { T_TOWN_ON_HILL: true });
});
