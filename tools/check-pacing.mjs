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
 *     used on another somewhere.
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
  if (!steps.some((step) => step.do === 'use' && step.onItem)) found.push('no item is used on another item');
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
