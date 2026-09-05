#!/usr/bin/env node
/**
 * STAGING AND PROVENANCE. Every generated pixel has a paper trail, and
 * nothing reaches shipping art without somebody saying so.
 *
 * WHY THIS EXISTS AND WHAT IT IS ANSWERING. Room 1 took six chained
 * generations (doc 36 D5) and the record of which produced what lives in
 * prose in the issue list. Forty rooms of that is not a record, it is an
 * archaeology problem -- and the two specific accidents this project has
 * already had are exactly the ones a ledger prevents:
 *
 *   `npm run renders` would have overwritten Room 1's APPROVED generated
 *   plate, because a composer still declared that path. That needed a
 *   refusal list (tools/pixelart/superseded.py) written after the fact.
 *
 *   `f8699d3` regenerated every actor frame at a new size and did not re-run
 *   the record builder, so the engine drew the protagonist at a third of his
 *   size for a week and every check passed. Q34.
 *
 * Both are the same shape: an artefact changed and nothing recorded that it
 * had. So: every attempt is recorded before it is judged, every promotion is
 * recorded as a decision, and caps are enforced by the ledger rather than by
 * whoever is watching the spend.
 *
 * THE LEDGER IS NOT A SECOND MANIFEST AND HOLDS NO CREATIVE CONTENT. It holds
 * hashes, ids, model parameters, paths and outcomes. A prompt is recorded as a
 * FILE PATH and a hash wherever one was used, so the words stay in the docs --
 * which is CLAUDE.md's rule and the reason `extract-content.mjs` refuses lines
 * written into a staging table.
 *
 * Usage:
 *   node tools/art/staging.mjs record <ledger.json fragment>   (module API preferred)
 *   node tools/art/staging.mjs list [assetId]
 *   node tools/art/staging.mjs promote <assetId> <attempt> <shipping path>
 *   node tools/art/staging.mjs budget
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { ROOT } from '../lib/content.mjs';
import { hashFile, sha256 } from './openai-image.mjs';

export const LEDGER = 'art/staging/ledger.json';
export const CAPS = 'art/staging/caps.json';

/**
 * The defaults a missing caps file is created with.
 *
 * ATTEMPTS PER ASSET IS SIX BECAUSE ROOM 1 TOOK SIX. Doc 36 D5 says so in as
 * many words -- "Room 1 needs six generations, chained" -- so a cap below that
 * would refuse the one run we have real data for, and a cap far above it is
 * not a cap. It is a number to be argued with, in a file, rather than a
 * constant nobody can see.
 *
 * THE SPEND CAP IS IN WHATEVER UNIT THE API REPORTS and is deliberately not
 * converted into money here. An adapter that multiplies tokens by a price it
 * has hard-coded is an adapter that lies quietly the week the price changes.
 */
const DEFAULT_CAPS = {
  schema: 1,
  note: 'Attempt and spend ceilings, per asset and overall. Edited by a person, '
    + 'never by a tool. A run that reaches one of these stops and says which.',
  attemptsPerAsset: 6,
  attemptsTotal: 400,
  /** Total billed image tokens across the whole ledger, where the API says. */
  spendTokensTotal: 4000000,
  perAsset: {},
};

const EMPTY = {
  schema: 1,
  note: 'GENERATED ART PROVENANCE. One row per attempt. Holds hashes, ids and model '
    + 'parameters -- no credentials, and no line of the fiction: a prompt is recorded '
    + 'by file path and hash so the words stay in /docs.',
  attempts: [],
  promotions: [],
};

function read(path, fallback) {
  const full = resolve(ROOT, path);
  if (!existsSync(full)) return structuredClone(fallback);
  return JSON.parse(readFileSync(full, 'utf8'));
}

function write(path, data) {
  const full = resolve(ROOT, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, `${JSON.stringify(data, null, 1)}\n`);
}

export function ledger() { return read(LEDGER, EMPTY); }
export function caps() { return read(CAPS, DEFAULT_CAPS); }

/** Billed image tokens on a row, or 0 where the API reported nothing. */
function tokensOf(row) {
  const usage = row.usage;
  if (!usage) return 0;
  return usage.total_tokens ?? usage.output_tokens ?? 0;
}

/**
 * What an asset has spent so far, and whether another attempt is allowed.
 *
 * ASKED BEFORE THE CALL, NOT AFTER IT. A cap enforced on the way out is a cap
 * that is always exceeded by exactly one request, which is the request that
 * mattered.
 */
export function budgetFor(assetId) {
  const rows = ledger().attempts;
  const limits = caps();
  const mine = rows.filter((row) => row.assetId === assetId);
  const spent = rows.reduce((sum, row) => sum + tokensOf(row), 0);
  const allowedAttempts = limits.perAsset?.[assetId]?.attempts ?? limits.attemptsPerAsset;
  const reasons = [];
  if (mine.length >= allowedAttempts) {
    reasons.push(`${assetId} has ${mine.length} attempt(s) against a cap of ${allowedAttempts}. `
      + `Raise it deliberately in ${CAPS} or stop.`);
  }
  if (rows.length >= limits.attemptsTotal) {
    reasons.push(`${rows.length} attempt(s) across the whole ledger, cap ${limits.attemptsTotal}.`);
  }
  if (spent >= limits.spendTokensTotal) {
    reasons.push(`${spent} billed image token(s) recorded, cap ${limits.spendTokensTotal}.`);
  }
  return {
    ok: reasons.length === 0,
    reasons,
    attempts: mine.length,
    nextAttempt: mine.length + 1,
    allowedAttempts,
    spentTokens: spent,
  };
}

/**
 * Records one attempt. Returns the row as stored.
 *
 * RECORDED WHATEVER THE OUTCOME, INCLUDING A REFUSED GATE. A ledger that holds
 * only the successes answers "what does this room's art consist of" and cannot
 * answer "what did we already try and why did it not work", which is the
 * question the sixth generation of a room is asking.
 */
/**
 * THE COMPOSITION MASTER RULE. Tyler's ruling 9, and it is binding here rather
 * than only in prose, because a prose rule about generation is obeyed exactly
 * as often as somebody remembers it.
 *
 * For a room introducing a substantial new environment and/or new characters:
 *
 *   1. Load the approved global baseline references.
 *   2. Create ONE non-shipping composition/casting master holding the
 *      environment and representative cast together.
 *   3. Use that master as the local visual-identity reference.
 *   4. Acquire individual characters and objects using the master and the
 *      approved references.
 *   5. Create ONE canonical design per character or object.
 *   6. Derive further poses, animation states and visual states FROM that
 *      canonical design.
 *
 * WHAT IT FORBIDS, and each of these is a thing Room 1 taught:
 *
 *   - Generating a second pose of a character from prose. Two independent
 *     generations of "the same" person are two people, and the difference
 *     shows up as a flicker between frames that nobody can fix afterwards.
 *   - Generating before/after versions of one object as separate fresh
 *     images. The two states have to be the same object or the change reads
 *     as a cut.
 *   - Multiple supposedly identical character designs. There is one canonical
 *     design; everything else is derived from it.
 *
 * THE MASTER IS NEVER A SHIPPING PLATE. It is reference material, and
 * `promote` refuses it by role.
 *
 * Extends docs/38-character-pipeline.md.
 */
const ROLES = {
  'composition-master': 'the room and its representative cast together, as ONE picture. '
    + 'Reference material. Never shipped.',
  'canonical-design': 'the single canonical design of one character or object. At most one '
    + 'per subject.',
  'derived-state': 'a further pose, animation frame or visual state. Must name the canonical '
    + 'design it derives from.',
  plate: 'a room background.',
  other: 'anything the five above do not describe. Carries no composition-master obligation, '
    + 'and is not a way around one.',
};

function assertCompositionOrder(file, row) {
  const role = row.role ?? 'other';
  if (!(role in ROLES)) {
    throw new Error(`role "${role}" is not one of ${Object.keys(ROLES).join(', ')}`);
  }
  if (role === 'canonical-design') {
    const already = file.attempts.find((one) => one.role === 'canonical-design'
      && one.subject === row.subject && one.promoted);
    if (already) {
      throw new Error(`${row.subject} already has a promoted canonical design (attempt `
        + `${already.attempt}, ${already.out}). A second one is a second character wearing `
        + 'the same name. Derive a state from the first instead.');
    }
  }
  if (role === 'derived-state') {
    if (!row.derivedFrom) {
      throw new Error(`a derived-state must name the canonical design it derives from `
        + '(`derivedFrom`: the attempt number). A pose generated from prose is a different '
        + 'person than the one it is a pose of.');
    }
    const parent = file.attempts.find((one) => one.attempt === row.derivedFrom
      && one.subject === row.subject);
    if (!parent) {
      throw new Error(`derivedFrom ${row.derivedFrom} is not an attempt for ${row.subject}`);
    }
    if (parent.role !== 'canonical-design' && parent.role !== 'derived-state') {
      throw new Error(`derivedFrom ${row.derivedFrom} has role "${parent.role}" -- a state can `
        + 'only be derived from the canonical design or from another state of it');
    }
  }
}

export function record(row) {
  const required = ['assetId', 'subject', 'operation', 'model', 'out', 'outputHash'];
  const missing = required.filter((field) => row[field] === undefined || row[field] === null);
  if (missing.length) {
    throw new Error(`a ledger row needs ${missing.join(', ')} -- refusing to record a `
      + 'provenance entry that cannot answer what it is provenance FOR');
  }
  const file = ledger();
  assertCompositionOrder(file, row);
  const stored = {
    attempt: file.attempts.filter((one) => one.assetId === row.assetId).length + 1,
    role: row.role ?? 'other',
    ...row,
    gates: row.gates ?? null,
    promoted: false,
    recordedAt: new Date().toISOString(),
  };
  file.attempts.push(stored);
  write(LEDGER, file);
  return stored;
}

/** Attaches a gate result to an attempt that is already recorded. */
export function attachGates(assetId, attempt, gates) {
  const file = ledger();
  const row = file.attempts.find((one) => one.assetId === assetId && one.attempt === attempt);
  if (!row) throw new Error(`no attempt ${attempt} for ${assetId} in ${LEDGER}`);
  row.gates = gates;
  write(LEDGER, file);
  return row;
}

/**
 * Moves a staged file into shipping art, and records who decided.
 *
 * THREE REFUSALS, EACH FOR A THING THAT HAS ALREADY GONE WRONG SOMEWHERE:
 *
 *  - The staged file must still hash to what the ledger recorded. An asset
 *    edited after its gates ran is an asset whose gates describe a different
 *    file, which is Q34's shape exactly: the record and the art drifted and
 *    nothing compared them.
 *  - Its technical gates must have RUN and passed. Not "look fine" -- run.
 *  - `visual_accepted` must be true, and only a person sets it. Doc 46 part
 *    one: "Art quality. ChatGPT generates; Tyler's eye judges. No check
 *    measures whether a plate is good." No argument to this function, and no
 *    field a tool writes, can stand in for that.
 */
export function promote(assetId, attempt, shippingPath, { by } = {}) {
  const file = ledger();
  const row = file.attempts.find((one) => one.assetId === assetId && one.attempt === attempt);
  if (!row) throw new Error(`no attempt ${attempt} for ${assetId} in ${LEDGER}`);
  if (!existsSync(resolve(ROOT, row.out))) {
    throw new Error(`${row.out} is gone -- nothing to promote`);
  }
  const now = hashFile(row.out);
  if (now !== row.outputHash) {
    throw new Error(`${row.out} has changed since it was recorded (${row.outputHash.slice(0, 12)} `
      + `-> ${now.slice(0, 12)}). Its gate results describe a different file. Re-run the gates.`);
  }
  if (!row.gates?.passed) {
    throw new Error(`${assetId} attempt ${attempt} has no passing technical gate result. `
      + 'Run tools/art/gates.mjs against it first. Gates establish ADMISSIBILITY, not quality.');
  }
  if (row.role === 'composition-master') {
    throw new Error(`${assetId} attempt ${attempt} is a composition master. It exists so that `
      + 'the room and its cast are designed as one picture, and it is reference material by '
      + 'construction -- it is not composed, framed or sized as a plate. Derive what ships '
      + 'from it; do not ship it.');
  }
  if (row.visual_accepted !== true) {
    throw new Error(`${assetId} attempt ${attempt} is not visually accepted. Only Tyler sets `
      + 'visual_accepted. A technical gate says an asset is admissible; it says nothing about '
      + 'whether the picture is any good, and this tool will not pretend otherwise.');
  }
  const target = resolve(ROOT, shippingPath);
  const replacing = existsSync(target) ? hashFile(shippingPath) : null;
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(resolve(ROOT, row.out), target);
  row.promoted = true;
  file.promotions.push({
    assetId,
    attempt,
    from: row.out,
    to: shippingPath,
    hash: row.outputHash,
    // WHAT IT REPLACED, BY HASH. A promotion that overwrites an approved plate
    // and does not say what was there is a promotion nobody can undo except by
    // reading git and guessing which commit.
    replacedHash: replacing,
    by: by ?? process.env.USER ?? 'unattributed',
    at: new Date().toISOString(),
  });
  write(LEDGER, file);
  return file.promotions[file.promotions.length - 1];
}

/**
 * PROMOTE A DERIVED ASSET. What ships is rarely the ledger row's own output:
 * the row is the 1536x1024 API source, and the shipping plate is the errata
 * 63 derivation of it, the relit sheet is a deterministic pass over the cut
 * figure, the floorboard is the plate's own pixels lifted. `promote()` above
 * copies the row's `out` and would ship the wrong file for every one of them.
 *
 * So a derived promotion names the ACCEPTED ROW it descends from (which must
 * pass the same three refusals) and the derived file's own PROVENANCE record
 * -- the safe-frame, grade or frames JSON that says how it was made and from
 * what -- and records both. The derivation itself is not judged here: it was
 * proved when it was made, and it was what Tyler looked at when he accepted.
 */
export function promoteDerived({ assetId, attempt, derived, provenance, shippingPath, by, acceptedBy }) {
  const file = ledger();
  const row = file.attempts.find((one) => one.assetId === assetId && one.attempt === attempt);
  if (!row) throw new Error(`no attempt ${attempt} for ${assetId} in ${LEDGER}`);
  if (!row.gates?.passed) throw new Error(`${assetId} attempt ${attempt} has no passing technical gate result`);
  if (row.visual_accepted !== true) {
    throw new Error(`${assetId} attempt ${attempt} is not visually accepted. Only Tyler sets visual_accepted.`);
  }
  if (!existsSync(resolve(ROOT, derived))) throw new Error(`${derived} is gone -- nothing to promote`);
  if (!provenance || !existsSync(resolve(ROOT, provenance))) {
    throw new Error(`a derived promotion names the record of its derivation, and ${provenance} does not exist`);
  }
  const target = resolve(ROOT, shippingPath);
  const replacing = existsSync(target) ? hashFile(shippingPath) : null;
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(resolve(ROOT, derived), target);
  const promotion = {
    assetId, attempt, from: derived, derivedFrom: row.out, provenance, to: shippingPath,
    hash: hashFile(derived), sourceHash: row.outputHash, replacedHash: replacing,
    acceptedBy: acceptedBy ?? null, by: by ?? process.env.USER ?? 'unattributed', at: new Date().toISOString(),
  };
  file.promotions.push(promotion);
  write(LEDGER, file);
  return promotion;
}

/* ------------------------------------------------------------------- CLI */

if (import.meta.url === `file://${process.argv[1]}`) {
  const [command, ...rest] = process.argv.slice(2);
  const file = ledger();
  if (command === 'list') {
    const only = rest[0];
    const rows = only ? file.attempts.filter((one) => one.assetId === only) : file.attempts;
    for (const row of rows) {
      const gates = row.gates ? (row.gates.passed ? 'gates PASS' : 'gates FAIL') : 'gates not run';
      console.log(`${row.assetId} #${row.attempt}  ${row.operation}  ${row.model}  ${gates}  `
        + `${row.visual_accepted === true ? 'ACCEPTED' : 'not accepted'}  ${row.out}`);
    }
    console.log(`\n${rows.length} attempt(s), ${file.promotions.length} promotion(s).`);
  } else if (command === 'budget') {
    const limits = caps();
    const assets = [...new Set(file.attempts.map((one) => one.assetId))];
    console.log(`caps: ${limits.attemptsPerAsset}/asset, ${limits.attemptsTotal} total, `
      + `${limits.spendTokensTotal} billed token(s)`);
    for (const asset of assets) {
      const state = budgetFor(asset);
      console.log(`  ${asset}: ${state.attempts}/${state.allowedAttempts} attempt(s)`
        + `${state.ok ? '' : '  AT CAP'}`);
    }
    const spent = file.attempts.reduce((sum, row) => sum + tokensOf(row), 0);
    console.log(`  spent: ${spent} billed token(s) of ${limits.spendTokensTotal}`);
  } else if (command === 'promote') {
    const [assetId, attempt, target] = rest;
    console.log(JSON.stringify(promote(assetId, Number(attempt), target), null, 1));
  } else if (command === 'init') {
    if (!existsSync(resolve(ROOT, LEDGER))) write(LEDGER, EMPTY);
    if (!existsSync(resolve(ROOT, CAPS))) write(CAPS, DEFAULT_CAPS);
    console.log(`${LEDGER} and ${CAPS} are in place.`);
  } else {
    console.error('usage: staging.mjs init|list [assetId]|budget|promote <assetId> <attempt> <path>');
    process.exit(2);
  }
}

export { sha256 };
