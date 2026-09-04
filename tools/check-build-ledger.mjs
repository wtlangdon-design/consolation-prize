import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { readJson, Report, ROOT, runCheck } from './lib/content.mjs';
import { resolveIssueRef } from './lib/issueref.mjs';

/**
 * THE OPERATIONAL LEDGER POINTS AT THINGS THAT EXIST.
 *
 * A ledger is only worth having if a machine can act on it, and a machine
 * acting on a pointer to a file that is not there does something worse than
 * nothing: it reports a room as proven on the strength of a proof that was
 * deleted, or waits on a dependency nobody ever named.
 *
 * SO EVERY POINTER IS RESOLVED AND EVERY STATUS IS EARNED. `proven` needs a
 * proof file that exists AND says it passed; `accepted` needs that proof plus
 * a `visual_accepted` nobody but Tyler sets. A row cannot claim a status its
 * own evidence does not support, which is the whole difference between a
 * ledger and a list of intentions.
 *
 * IT ASSERTS NOTHING ABOUT CONTENT, because the ledger holds none. Doc
 * pointers, ids, statuses and paths. The words stay in /docs.
 */

const STATUSES = ['unstarted', 'blocked', 'in-progress', 'built', 'proven', 'accepted', 'ruled'];

/**
 * `ruled` exists because a DECISION is not a room and cannot be proven.
 *
 * The font decision was Tyler's, it is recorded in the errata, and forcing it
 * through `accepted` would have made it claim a four-panel proof it can never
 * have. A status that has to be lied to is a status that will be.
 */
const LEDGER = 'content/build-ledger.json';

export function check() {
  const report = new Report('The build ledger points at things that exist');
  if (!existsSync(resolve(ROOT, LEDGER))) {
    report.fail(`${LEDGER} is missing. The ledger is how an autonomous pass knows what may `
      + 'be started; without it that question has only a prose answer.');
    return report;
  }
  const ledger = readJson(LEDGER);
  const ids = new Set(ledger.items.map((item) => item.id));
  if (ids.size !== ledger.items.length) report.fail('two items share an id');

  for (const item of ledger.items) {
    const where = `${LEDGER}/${item.id}`;
    if (!STATUSES.includes(item.status)) {
      report.fail(`${where}: status "${item.status}" is not one of ${STATUSES.join(', ')}`);
    }
    if (!item.sources?.length) {
      report.fail(`${where}: no source document. An item with no canonical pointer is one `
        + 'nobody can check against the writing, which is the only place the writing lives.');
    }
    for (const source of item.sources ?? []) {
      if (!existsSync(resolve(ROOT, source))) report.fail(`${where}: no such source ${source}`);
    }
    for (const dependency of item.dependsOn ?? []) {
      if (!ids.has(dependency)) report.fail(`${where}: depends on "${dependency}", which is `
        + 'not an item in this ledger');
    }
    for (const path of [item.proof, item.gauntlet].filter(Boolean)) {
      // `validation` names a COMMAND rather than a file, deliberately: what
      // proves a room valid is the suite passing on it, and there is no
      // artefact of that to point at.
      if (!existsSync(resolve(ROOT, path))) report.fail(`${where}: names ${path}, which does `
        + 'not exist');
    }
    // BLOCKERS MUST NAME SOMETHING, AND NAME IT UNAMBIGUOUSLY.
    //
    // This used to accept `/^Q\d+$/`, which looked like a check and was not:
    // docs/36-issue-list.md carries TWO Q-number series, so "Q16" named both
    // the panel layout and a broken validator, and a row blocked on it could
    // not say which. Tyler's ruling -- historical numbering stays, references
    // get qualified. A blocker is now either another item in this ledger or a
    // path.md::Heading that resolves to exactly one heading.
    for (const blocker of item.blockers ?? []) {
      if (ids.has(blocker)) continue;
      const resolved = resolveIssueRef(blocker);
      if (!resolved.ok) {
        report.fail(`${where}: blocker ${resolved.why}`);
      }
    }
    if (item.status === 'blocked' && (item.blockers ?? []).length === 0) {
      report.fail(`${where}: blocked and names no blocker`);
    }
    if (item.status === 'proven' || item.status === 'accepted') {
      if (!item.proof) {
        report.fail(`${where}: claims "${item.status}" with no proof path. A room is proven `
          + 'by a four-panel proof or it is not proven.');
      } else {
        const proof = readJson(item.proof);
        if (proof.passed !== true) {
          report.fail(`${where}: claims "${item.status}" and ${item.proof} says passed=`
            + `${proof.passed}`);
        }
        if (!proof.workingTreeClean) {
          report.note(`${item.id}: its proof was taken on a dirty tree, so those frames do `
            + `not correspond to ${proof.commit?.slice(0, 8)}`);
        }
      }
      if (!item.commit) report.fail(`${where}: claims "${item.status}" and names no commit`);
    }
    if (item.status === 'ruled') {
      if (item.kind !== 'decision') {
        report.fail(`${where}: only a decision can be "ruled"; this is a ${item.kind}`);
      }
      if (!item.ruling) {
        report.fail(`${where}: "ruled" and names no ruling. A decision whose ruling cannot be `
          + 'read is indistinguishable from one somebody assumed.');
      } else {
        const resolved = resolveIssueRef(item.ruling);
        if (!resolved.ok) report.fail(`${where}: ruling ${resolved.why}`);
      }
      if ((item.blockers ?? []).length) {
        report.fail(`${where}: "ruled" and still names blockers`);
      }
    }
    if (item.status === 'accepted' && item.visual_accepted !== true) {
      report.fail(`${where}: status is "accepted" and visual_accepted is not true. Only Tyler `
        + 'sets that field, and a status that outruns it is a tool claiming his judgement.');
    }
    if (item.visual_accepted === true && item.status !== 'accepted') {
      report.note(`${item.id}: visual_accepted is true and its status is "${item.status}"`);
    }
  }

  // A DEPENDENCY CYCLE IS A QUEUE NOTHING CAN BE TAKEN FROM.
  const seen = new Map();
  const byId = new Map(ledger.items.map((item) => [item.id, item]));
  const walk = (id, trail) => {
    if (trail.includes(id)) {
      report.fail(`dependency cycle: ${[...trail, id].join(' -> ')}`);
      return;
    }
    if (seen.get(id)) return;
    seen.set(id, true);
    for (const next of byId.get(id)?.dependsOn ?? []) walk(next, [...trail, id]);
  };
  for (const item of ledger.items) walk(item.id, []);

  const counted = STATUSES
    .map((status) => `${ledger.items.filter((item) => item.status === status).length} ${status}`);
  report.note(`${ledger.items.length} item(s): ${counted.join(', ')}`);
  const ready = ledger.items.filter((item) => item.status === 'blocked'
    && (item.dependsOn ?? []).every((id) => ['built', 'proven', 'accepted']
      .includes(byId.get(id)?.status)));
  for (const item of ready) {
    report.note(`${item.id}: every dependency is built, so only its blockers `
      + `(${item.blockers.join(', ')}) stand in the way`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
