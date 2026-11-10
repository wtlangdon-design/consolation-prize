/**
 * THE PLAYED ROUTE IS HELD TO DOC 114'S STANDARDS (errata 243; Tyler, 2026-11-09: "make EVERYTHING in the game the best
 * it can be", and "All" to doc 114's rows, X-3 among them).
 *
 * "Best" was given six standards so that it could be checked and could end (doc 114 section 1). Two of them are
 * arithmetic over the played route, tests/data/full-game-walkthrough.json, and are held here; the other four are
 * judgements about scenes and are doc 114's own table.
 *
 *  2  Never more than three stops in a row where all he can do is choose a line. A stop is a room in which the route
 *     does anything at all; it is hands-on if the route uses a verb, an item, a duel, a tap or a wait there.
 *  4  Every verb on the panel solves something somewhere: each is used by the route at least once. And one item is
 *     used on another five times (Tyler, 2026-11-09).
 *
 * WHAT IS STILL FAILING IS WRITTEN DOWN, in proofs/pacing.json, each with the row of doc 114 that is to fix it. A
 * failure not on that list fails the check: a later change cannot quietly bring back four counters in a row. And a
 * listed failure that no longer fails must come off the list, so the list only ever holds what is true.
 *
 *   node tools/check-pacing.mjs
 */
import { pathToFileURL } from 'node:url';

import { Report, readJson, runCheck } from './lib/content.mjs';

const HANDS = new Set(['verb', 'use', 'duel', 'tap', 'wait', 'opening']);
const TALK_VERB = 'TALK_TO';
const LIMIT = 3;
const ITEM_ON_ITEM = 5;

/** The route as stops: each room he does something in, in order, and whether he does anything there with his hands. */
export function stopsOf(steps) {
  const stops = [];
  let here = null;
  for (const step of steps) {
    if (step.do === 'go') { here = { room: step.room, at: step.id, hands: false, did: false }; stops.push(here); continue; }
    if (!here) { here = { room: null, at: step.id, hands: false, did: false }; stops.push(here); }
    here.did = true;
    if (HANDS.has(step.do) && !(step.do === 'verb' && step.verb === TALK_VERB)) here.hands = true;
  }
  return stops.filter((stop) => stop.did);
}

/** Every run of more than `limit` stops with no hands in them, as the step it begins at and its rooms. */
export function talkRuns(stops, limit = LIMIT) {
  const runs = [];
  let run = [];
  const close = () => { if (run.length > limit) runs.push({ at: run[0].at, rooms: run.map((stop) => stop.room) }); run = []; };
  for (const stop of stops) { if (stop.hands) close(); else run.push(stop); }
  close();
  return runs;
}

export function check() {
  const report = new Report('The played route keeps doc 114\'s pace: no four counters in a row, and every verb solves something');
  const steps = readJson('tests/data/full-game-walkthrough.json').steps;
  const verbs = readJson('content/ui/verbs.json').verbs.map((verb) => verb.id);
  const ledger = readJson('proofs/pacing.json');
  const known = new Map(ledger.known.map((one) => [one.what, one]));
  const found = [];
  const stops = stopsOf(steps);
  for (const run of talkRuns(stops)) found.push(`talk-run from ${run.at}: ${run.rooms.join(' > ')}`);
  const used = new Set(steps.filter((step) => step.do === 'verb').map((step) => step.verb));
  if (steps.some((step) => step.do === 'use')) used.add('USE');
  if (steps.some((step) => step.do === 'talk')) used.add(TALK_VERB);
  for (const verb of verbs) if (!used.has(verb)) found.push(`verb never used: ${verb}`);
  const items = new Set(readJson('content/manifest.json').items.map((file) => readJson(file).id));
  // FIVE, NOT ONE (Tyler, 2026-11-09, asked whether to hold four or five: "Yes"): the first Monkey Island used an item on
  // an item a handful of times, and this game had none.
  const onItems = steps.filter((step) => step.do === 'use' && items.has(step.on)).length;
  if (onItems < ITEM_ON_ITEM) found.push(`an item is used on another item ${onItems} time(s), not ${ITEM_ON_ITEM}`);
  // THE MONKEY ISLAND YARDSTICK (doc 116; Tyler, 2026-11-09: "it's all stuff I want done at some point"). Counted, each
  // against doc 116's target, and listed while it falls short like the rest.
  const yard = ledger.yardstick;
  const paper = new Set([...yard.paper, ...yard.money]);
  const all = readJson('content/manifest.json').items.map((file) => readJson(file).id);
  for (const id of paper) if (!all.includes(id)) report.fail(`proofs/pacing.json calls "${id}" paper or money and there is no such item`);
  const objects = all.filter((id) => !paper.has(id)).length;
  if (objects * 2 < all.length) found.push(`objects are ${objects} of ${all.length} items, not half`);
  // PAPERS IN HIS POCKET AT THE FILING (Tyler, 2026-11-09: "the inventory still has tons of papers and documents"). The
  // fullest inventory of the game is the one he carries to the last counter: fixture r7-f5-held, which
  // tests/items.test.ts holds to exactly what the walkthrough carries there. Money is not counted either way.
  const held = (readJson('content/fixtures/room-07.json').fixtures.find((one) => one.id === 'r7-f5-held')?.inventory ?? [])
    .filter((id) => !yard.money.includes(id));
  const papers = held.filter((id) => yard.paper.includes(id));
  if (papers.length * 3 >= held.length) found.push(`papers are ${papers.length} of the ${held.length} things he carries to the filing, not under a third`);
  const rooms = readJson('content/manifest.json').rooms.map((file) => readJson(file));
  const takeable = new Set();
  for (const room of rooms) {
    for (const spot of room.hotspots ?? []) {
      for (const rules of Object.values(spot.responses ?? {})) {
        for (const rule of rules) for (const item of [...(rule.grants ?? []), ...(rule.items ?? [])]) takeable.add(item);
      }
    }
  }
  if (takeable.size < yard.targets.takenFromRooms) found.push(`${takeable.size} item(s) are taken from a room by hand, not ${yard.targets.takenFromRooms}`);
  const people = new Set(readJson('content/manifest.json').ambient.map((file) => readJson(file).id));
  const onWorld = new Set(steps.filter((step) => step.do === 'use' && !items.has(step.on) && !people.has(step.on) && !yard.counters.includes(step.on))
    .map((step) => `${step.item} on ${step.on}`));
  if (onWorld.size < yard.targets.itemOnWorld) found.push(`${onWorld.size} different item-on-the-world uses on the route, not ${yard.targets.itemOnWorld}`);
  for (const verb of yard.handVerbs) {
    const times = steps.filter((step) => step.do === 'verb' && step.verb === verb).length;
    if (times > 0 && times < yard.targets.eachHandVerb) found.push(`${verb} is used ${times} time(s) on the route, not ${yard.targets.eachHandVerb}`);
  }
  for (const what of found) {
    const row = known.get(what);
    if (row) report.note(`known, to be fixed by doc 114 ${row.row}: ${what}`);
    else report.fail(`${what} -- not in proofs/pacing.json: the route has got worse`);
  }
  for (const what of known.keys()) {
    if (!found.includes(what)) report.fail(`"${what}" is listed in proofs/pacing.json and no longer fails: take it off the list`);
  }
  report.note(`${stops.length} stops on the route, ${stops.filter((stop) => stop.hands).length} of them hands-on; ${found.length} standard(s) still failing, all listed`);
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = check();
  runCheck(report);
  process.exit(report.passed ? 0 : 1);
}
