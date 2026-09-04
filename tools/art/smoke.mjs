#!/usr/bin/env node
/**
 * THE LIVE API SMOKE TEST. It exists to prove the real autonomous art path
 * works end to end, and it is not for making game art.
 *
 * WHAT IT PROVES, IN ORDER: that a generation reaches the API and lands under
 * `art/staging/`; that an EDIT can take an approved shipping image as a
 * reference without being able to write over it; that both are recorded with
 * their prompts, references, hashes, model and usage; that the attempt and
 * spend caps are read before the call rather than after it; that the technical
 * gates run on what came back; and that nothing is promoted.
 *
 * IT IS DELIBERATELY SMALL AND DELIBERATELY NOT A ROOM. A plate at the play
 * area's size costs real money and produces something somebody will be tempted
 * to look at as art. The prompt below asks for a flat grey test card, at the
 * smallest square the API takes, because the only question is whether the pipe
 * is connected.
 *
 * THE KEY COMES FROM THE ENVIRONMENT AND IS NEVER PRINTED. Not into the
 * ledger, not into a log line, not into an error: `openai-image.mjs` keeps it
 * out of every record it writes and this file never reads it at all.
 *
 * Usage: OPENAI_API_KEY=... node tools/art/smoke.mjs
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { ROOT } from '../lib/content.mjs';
import { edit, generate, hashFile, model } from './openai-image.mjs';
import { attachGates, budgetFor, promote, record } from './staging.mjs';
import { runGates } from './gates.mjs';

const ASSET = 'smoke-test-card';
const OUT = 'art/staging/smoke';
/**
 * A REFERENCE THE PROJECT ALREADY APPROVED, and the point of using one is that
 * it is the shape the real pipeline has: errata 53 condition 2 and doc 36 D4
 * make every mover a DIFFERENCE between two generations of the same scene, so
 * an edit that cannot see the plate it is a companion to is not a companion.
 * This one is read, hashed and sent; it is never written to.
 */
const REFERENCE = 'art/backgrounds/room-01-stage-road.png';

const say = (line) => console.log(line);

async function main() {
  say(`\nmodel: ${model()}  (OPENAI_IMAGE_MODEL overrides; the default is gpt-image-2)`);
  const before = budgetFor(ASSET);
  say(`budget before: ${before.attempts}/${before.allowedAttempts} attempt(s), `
    + `${before.spentTokens} billed token(s), ok=${before.ok}`);
  if (!before.ok) {
    say('AT CAP. The caps are read before the call, not after it -- a cap enforced on the way '
      + 'out is a cap that is always exceeded by exactly one request, which is the request '
      + 'that mattered.');
    for (const reason of before.reasons) say(`  x ${reason}`);
    return 1;
  }
  mkdirSync(resolve(ROOT, OUT), { recursive: true });

  /* ---- 1 · GENERATE ----------------------------------------------------- */
  say('\n1 · generate');
  const made = await generate({
    prompt: 'A flat neutral grey test card. A single thin white horizontal line across the '
      + 'middle. No text, no lettering, no objects, no texture.',
    out: `${OUT}/generate-01.png`,
    size: '1024x1024',
  });
  say(`   wrote ${made.out}, ${made.bytes} bytes, sha ${made.outputHash.slice(0, 12)}`);
  const genRow = record({ ...made, assetId: ASSET, subject: 'api-smoke-test' });
  say(`   recorded as ${genRow.assetId} attempt ${genRow.attempt}`);
  const genGates = runGates(made.out, { kind: 'plate', expect: '1024x1024' });
  attachGates(ASSET, genRow.attempt, genGates);
  say(`   gates: ${genGates.passed ? 'PASS' : 'FAIL'}`);
  for (const line of genGates.failures) say(`     x ${line}`);

  /* ---- 2 · EDIT, FROM AN APPROVED SHIPPING REFERENCE --------------------- */
  say('\n2 · edit, with an approved shipping plate as the reference');
  const referenceHash = hashFile(REFERENCE);
  say(`   reference ${REFERENCE} sha ${referenceHash.slice(0, 12)} -- read only`);
  const edited = await edit({
    prompt: 'Return this scene with the sky replaced by flat neutral grey. Change nothing else.',
    out: `${OUT}/edit-01.png`,
    images: [REFERENCE],
    size: '1024x1024',
  });
  say(`   wrote ${edited.out}, ${edited.bytes} bytes, sha ${edited.outputHash.slice(0, 12)}`);
  const editRow = record({ ...edited, assetId: ASSET, subject: 'api-smoke-test' });
  say(`   recorded as attempt ${editRow.attempt}, source ${String(edited.sourcePath)}`);
  const editGates = runGates(edited.out, { kind: 'plate' });
  attachGates(ASSET, editRow.attempt, editGates);
  say(`   gates: ${editGates.passed ? 'PASS' : 'FAIL'}`);
  for (const line of editGates.failures) say(`     x ${line}`);

  /* ---- 3 · NOTHING IS PROMOTED, AND IT REFUSES ---------------------------- */
  say('\n3 · promotion, which must refuse');
  try {
    promote(ASSET, genRow.attempt, 'art/backgrounds/room-01-stage-road.png');
    say('   NOT REFUSED -- THIS IS A FAILURE');
    return 1;
  } catch (error) {
    say(`   refused: ${error.message.split('.')[0]}`);
  }

  /* ---- 4 · THE REFERENCE IS UNTOUCHED ------------------------------------ */
  const after = hashFile(REFERENCE);
  say(`\n4 · reference after the run: sha ${after.slice(0, 12)} `
    + `${after === referenceHash ? '-- unchanged' : '-- CHANGED, WHICH IS A FAILURE'}`);
  if (after !== referenceHash) return 1;

  const budget = budgetFor(ASSET);
  say(`\nbudget after: ${budget.attempts}/${budget.allowedAttempts} attempt(s), `
    + `${budget.spentTokens} billed token(s)`);
  say('\nSMOKE: the autonomous art path is connected. Nothing was promoted and no shipping '
    + 'asset was written.\n');
  return 0;
}

main().then((code) => process.exit(code), (error) => {
  // THE MESSAGE, NOT THE REQUEST. An adapter that dumps "the request" wholesale
  // for debugging is how a key reaches a log.
  console.error(`\nSMOKE FAILED: ${error.message}\n`);
  process.exit(1);
});
