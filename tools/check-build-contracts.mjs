import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { listFiles, readJson, Report, ROOT, runCheck } from './lib/content.mjs';
import { resolveIssueRef } from './lib/issueref.mjs';

/**
 * THE PER-ROOM BUILD CONTRACT, VALIDATED. Factory v2 (docs/46-room-factory.md,
 * part four). One file per room under content/build-contracts/, versioned by
 * `schema`, holding IDS, STATUSES AND POINTERS and no creative content: which
 * gate answered what and where the evidence is, which asset is at which
 * lifecycle stage, what Tyler has ruled and when, what was built early and
 * what is contracted and unbuilt, and how each element is classified for a
 * retrofit. The build ledger stays the queue ("what may be started"); the
 * contract is the room's own record ("what has been established, by whom").
 *
 * WHY A CONTRACT AND NOT MORE LEDGER FIELDS. Room 5 taught that a room has
 * SEVERAL acceptances -- visual, gameplay per act or scene, promotion -- and
 * that a single `accepted` status collapses them: the ledger's `accepted`
 * means visual_accepted, Room 5's Act I gameplay was accepted a day later,
 * and its C5 scene is built and NOT accepted, all at once. Those are three
 * facts about one room and a status enum cannot hold three facts.
 *
 * WHAT IT ASSERTS, and each is a way a contract could quietly lie:
 *
 *   - every status is from its closed list; a new word is a build failure,
 *     because a status a tool does not know is a status a person invented
 *     to avoid saying FAIL
 *   - every gate answer but NOT-RUN cites at least one piece of evidence,
 *     and every evidence string RESOLVES: a file that exists, a
 *     `path.md::Heading` that resolves to exactly one heading, or a `cmd:`
 *     command (recorded, not run here)
 *   - an accepted exception names its ruling
 *   - a lifecycle stage agrees with where the file lives: nothing under
 *     art/staging/ may claim SHIPPING, and nothing outside it may claim a
 *     candidate stage -- the accepted-work protection of Factory v2 part five
 *   - the contract's visual acceptance agrees with the build ledger's
 *     visual_accepted, which is Tyler's field: a contract may not outrun it
 *     and the ledger may not outrun the contract
 *   - the room and ledger ids it names exist
 *
 * WHAT IT DOES NOT ASSERT: that a gate's answer is RIGHT. A PASS with evidence
 * that resolves is a claim a person can check in a minute, which is the whole
 * of what a validator can offer here (doc 44, honesty 1).
 */

export const CONTRACT_SCHEMA = 1;
export const GATE_STATUSES = ['PASS', 'PASS-WITH-ACCEPTED-EXCEPTION', 'DEFERRED', 'FAIL', 'NOT-APPLICABLE', 'NOT-RUN'];
export const LIFECYCLE_STAGES = ['GENERATED', 'STAGED', 'GATES', 'CANDIDATE', 'LIVE-PROOF', 'OWNER-VISUAL-ACCEPTED', 'GAMEPLAY-ACCEPTED', 'SHIPPING', 'REJECTED', 'LEGACY'];
export const ASSET_CLASSES = ['PLATE', 'STATEFUL', 'TAKEABLE', 'MOVER', 'ABSENT-LATER', 'OVERLAY', 'MASK', 'LIGHT', 'PROP'];
export const ACCEPTANCE_STATUSES = ['OWNER-ACCEPTED', 'PENDING', 'NOT-SUBMITTED', 'OWNER-REJECTED', 'NOT-APPLICABLE'];
export const PROMOTION_STATUSES = ['DONE', 'NOT-DONE', 'NOT-APPLICABLE'];
export const LATER_STATE_STATUSES = ['OWNER-ACCEPTED', 'BUILT-EARLY-NOT-ACCEPTED', 'CONTRACTED-UNBUILT', 'UNSPECIFIED', 'NOT-APPLICABLE'];
export const RETROFIT_CLASSES = ['KEEP', 'IMPROVE', 'RECAST', 'REGENERATE-CANDIDATE', 'DEBT-NOT-VISUAL', 'NOT-CLASSIFIED'];
/** The pre-art gate, doc 46 part four §A-I. Every contract answers all nine. */
export const PRE_ART_GATES = ['roomStoryState', 'staticVsStatefulArt', 'cast', 'roomLife', 'physicalContact', 'lighting', 'cluePerceptibility', 'contentCompilerHealth', 'artBudget'];
/** Before a live candidate is offered to Tyler. */
export const LIVE_GATES = ['compiler', 'annotation', 'fourPanelProof', 'lifeProof', 'gameplayProof', 'regression'];
const STAGING = 'art/staging/';
const CANDIDATE_STAGES = new Set(['GENERATED', 'STAGED', 'GATES', 'CANDIDATE', 'LIVE-PROOF', 'OWNER-VISUAL-ACCEPTED', 'GAMEPLAY-ACCEPTED', 'REJECTED']);

/** Does one evidence string resolve? */
export function evidenceResolves(evidence) {
  if (typeof evidence !== 'string' || !evidence.trim()) return { ok: false, why: 'empty evidence' };
  if (evidence.startsWith('cmd:')) return { ok: true };
  if (evidence.includes('::')) {
    const found = resolveIssueRef(evidence);
    return found.ok ? { ok: true } : { ok: false, why: found.why };
  }
  return existsSync(resolve(ROOT, evidence)) ? { ok: true } : { ok: false, why: `${evidence} does not exist` };
}

function gateBlock(report, where, block, keys) {
  if (!block || typeof block !== 'object') { report.fail(`${where}: missing`); return; }
  for (const key of keys) {
    const gate = block[key];
    const at = `${where}/${key}`;
    if (!gate) { report.fail(`${at}: not answered. Every gate is answered, NOT-RUN included.`); continue; }
    if (!GATE_STATUSES.includes(gate.status)) {
      report.fail(`${at}: status "${gate.status}" is not one of ${GATE_STATUSES.join(', ')}`);
      continue;
    }
    if (gate.status !== 'NOT-RUN' && !(gate.evidence ?? []).length) {
      report.fail(`${at}: ${gate.status} with no evidence. An answer nobody can check is an opinion.`);
    }
    if (gate.status === 'PASS-WITH-ACCEPTED-EXCEPTION' && !gate.exception) {
      report.fail(`${at}: an accepted exception names the ruling that accepted it (\`exception\`)`);
    }
    if (gate.status === 'NOT-RUN' && !gate.note) {
      report.fail(`${at}: NOT-RUN says why it has not been run (\`note\`)`);
    }
    for (const evidence of gate.evidence ?? []) {
      const found = evidenceResolves(evidence);
      if (!found.ok) report.fail(`${at}: evidence ${found.why}`);
    }
  }
  for (const key of Object.keys(block)) {
    if (!keys.includes(key) && key !== 'note') report.fail(`${where}: "${key}" is not a gate in this block`);
  }
}

export function check(paths = listFiles('content/build-contracts', ['.json']), ledger = readJson('content/build-ledger.json'), manifest = readJson('content/manifest.json')) {
  const report = new Report('Every room build contract is complete, closed-vocabulary, evidenced and agrees with the ledger');
  if (!paths.length) { report.note('no build contracts under content/build-contracts/'); return report; }
  const roomIds = new Set(manifest.rooms.map((path) => readJson(path).id));
  const ledgerById = new Map(ledger.items.map((item) => [item.id, item]));
  const seen = new Set();
  let gates = 0;
  let assets = 0;
  for (const path of paths) {
    const contract = typeof path === 'string' ? readJson(path) : path.data;
    const where = typeof path === 'string' ? path : path.path;
    if (contract.schema !== CONTRACT_SCHEMA) {
      report.fail(`${where}: schema ${contract.schema}; this validator reads schema ${CONTRACT_SCHEMA}`);
      continue;
    }
    if (seen.has(contract.id)) report.fail(`${where}: duplicate contract for ${contract.id}`);
    seen.add(contract.id);
    const item = ledgerById.get(contract.id);
    if (!item) report.fail(`${where}: ${contract.id} is not an item in content/build-ledger.json`);
    else if (item.kind !== 'room') report.fail(`${where}: ledger item ${contract.id} is a ${item.kind}, not a room`);
    if (item?.contract && item.contract !== where) {
      report.fail(`${where}: the ledger points ${contract.id} at ${item.contract}`);
    }
    if (!roomIds.has(contract.room)) report.fail(`${where}: room "${contract.room}" is not in the manifest`);
    if (!contract.benchmark && !Array.isArray(contract.authorities)) {
      report.fail(`${where}: no \`authorities\` (the documents the contract answers against)`);
    }
    for (const authority of contract.authorities ?? []) {
      const found = evidenceResolves(authority);
      if (!found.ok) report.fail(`${where}: authority ${found.why}`);
    }

    gateBlock(report, `${where}/preArtGate`, contract.preArtGate, PRE_ART_GATES);
    gateBlock(report, `${where}/liveGates`, contract.liveGates, LIVE_GATES);
    gates += PRE_ART_GATES.length + LIVE_GATES.length;

    // ---- lifecycle --------------------------------------------------------
    for (const asset of contract.lifecycle ?? []) {
      assets += 1;
      const at = `${where}/lifecycle/${asset.subject ?? '?'}`;
      if (!asset.subject) report.fail(`${at}: no subject`);
      if (!ASSET_CLASSES.includes(asset.class)) report.fail(`${at}: class "${asset.class}" is not one of ${ASSET_CLASSES.join(', ')}`);
      if (!LIFECYCLE_STAGES.includes(asset.stage)) { report.fail(`${at}: stage "${asset.stage}" is not one of ${LIFECYCLE_STAGES.join(', ')}`); continue; }
      if (asset.path) {
        if (!existsSync(resolve(ROOT, asset.path))) report.fail(`${at}: ${asset.path} does not exist`);
        const staged = asset.path.startsWith(STAGING);
        if (asset.stage === 'SHIPPING' && staged) {
          report.fail(`${at}: claims SHIPPING and lives under ${STAGING}. Promotion is a logged step, not a status.`);
        }
        if (CANDIDATE_STAGES.has(asset.stage) && !staged && !asset.path.startsWith('reference/')) {
          report.fail(`${at}: claims ${asset.stage} and lives at ${asset.path}, outside ${STAGING}. A candidate that `
            + 'is already in the shipping tree has been promoted without the step.');
        }
      } else if (asset.stage !== 'GENERATED' && asset.stage !== 'REJECTED') {
        report.fail(`${at}: ${asset.stage} with no path`);
      }
      if (asset.stage !== 'GENERATED' && !(asset.evidence ?? []).length) report.fail(`${at}: ${asset.stage} with no evidence`);
      for (const evidence of asset.evidence ?? []) {
        const found = evidenceResolves(evidence);
        if (!found.ok) report.fail(`${at}: evidence ${found.why}`);
      }
    }

    // ---- acceptance ---------------------------------------------------------
    const acceptance = contract.acceptance ?? {};
    const visual = acceptance.visual;
    if (!visual || !ACCEPTANCE_STATUSES.includes(visual.status)) {
      report.fail(`${where}/acceptance/visual: status must be one of ${ACCEPTANCE_STATUSES.join(', ')}`);
    } else {
      if (visual.status === 'OWNER-ACCEPTED' && (!visual.by || !visual.on)) report.fail(`${where}/acceptance/visual: OWNER-ACCEPTED names who and when`);
      if (item) {
        const ledgerSays = item.visual_accepted === true;
        const contractSays = visual.status === 'OWNER-ACCEPTED';
        if (ledgerSays !== contractSays) {
          report.fail(`${where}/acceptance/visual: says ${visual.status} and the ledger's visual_accepted is `
            + `${item.visual_accepted}. Tyler's field and the contract must agree; neither outruns the other.`);
        }
      }
      for (const evidence of visual.evidence ?? []) {
        const found = evidenceResolves(evidence);
        if (!found.ok) report.fail(`${where}/acceptance/visual: evidence ${found.why}`);
      }
    }
    const gameplay = acceptance.gameplay;
    if (!gameplay || typeof gameplay !== 'object' || !Object.keys(gameplay).length) {
      report.fail(`${where}/acceptance/gameplay: at least one scope (an act, a scene) with a status`);
    } else {
      for (const [scope, entry] of Object.entries(gameplay)) {
        const at = `${where}/acceptance/gameplay/${scope}`;
        if (!ACCEPTANCE_STATUSES.includes(entry.status)) report.fail(`${at}: status "${entry.status}"`);
        if (entry.status === 'OWNER-ACCEPTED' && (!entry.by || !entry.on || !(entry.evidence ?? []).length)) {
          report.fail(`${at}: OWNER-ACCEPTED names who, when and the evidence`);
        }
        for (const evidence of entry.evidence ?? []) {
          const found = evidenceResolves(evidence);
          if (!found.ok) report.fail(`${at}: evidence ${found.why}`);
        }
      }
    }
    const promotion = acceptance.promotion;
    if (!promotion || !PROMOTION_STATUSES.includes(promotion.status)) {
      report.fail(`${where}/acceptance/promotion: status must be one of ${PROMOTION_STATUSES.join(', ')}`);
    } else if (promotion.status === 'NOT-DONE') {
      // NOTHING STAGED MAY CLAIM SHIPPING while promotion is not done, and if
      // promotion is DONE nothing of the room's may still be staged at an
      // accepted stage. The lifecycle rule above catches the first; this is
      // the second half.
    } else if (promotion.status === 'DONE') {
      const staged = (contract.lifecycle ?? []).filter((asset) => asset.path?.startsWith(STAGING) && asset.stage !== 'REJECTED');
      if (staged.length) report.fail(`${where}/acceptance/promotion: DONE, and ${staged.length} asset(s) still live under ${STAGING}`);
    }

    // ---- later states ---------------------------------------------------------
    for (const later of contract.laterStates ?? []) {
      const at = `${where}/laterStates/${later.id ?? '?'}`;
      if (!later.id) report.fail(`${at}: no id`);
      if (!LATER_STATE_STATUSES.includes(later.status)) report.fail(`${at}: status "${later.status}" is not one of ${LATER_STATE_STATUSES.join(', ')}`);
      if (later.status !== 'NOT-APPLICABLE' && !(later.evidence ?? []).length) report.fail(`${at}: no evidence`);
      for (const evidence of later.evidence ?? []) {
        const found = evidenceResolves(evidence);
        if (!found.ok) report.fail(`${at}: evidence ${found.why}`);
      }
    }

    // ---- retrofit ------------------------------------------------------------
    for (const element of contract.retrofit ?? []) {
      const at = `${where}/retrofit/${element.subject ?? '?'}`;
      if (!element.subject) report.fail(`${at}: no subject`);
      if (!RETROFIT_CLASSES.includes(element.classification)) {
        report.fail(`${at}: classification "${element.classification}" is not one of ${RETROFIT_CLASSES.join(', ')}`);
        continue;
      }
      if (element.classification !== 'NOT-CLASSIFIED' && !(element.evidence ?? []).length) {
        report.fail(`${at}: ${element.classification} with no evidence`);
      }
      for (const evidence of element.evidence ?? []) {
        const found = evidenceResolves(evidence);
        if (!found.ok) report.fail(`${at}: evidence ${found.why}`);
      }
    }
  }
  report.note(`${seen.size} contract(s): ${gates} gate answers, ${assets} lifecycle rows`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
