import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { ROOT } from '../lib/content.mjs';
import { runGates } from './gates.mjs';
import { edit, hashFile } from './openai-image.mjs';
import { attachGates, budgetFor, record } from './staging.mjs';

/**
 * THAD'S OWNER-AUTHORIZED CHARACTER CALLS. A task-specific driver like
 * room05.mjs: one subcommand, one authorized operation against one sub-cap,
 * the approved Family-A references actually transmitted, the provenance row
 * carrying the reason, the technical gates run on what came back.
 *
 *   node tools/art/thad.mjs stride    the canonical profile stride source (thad-profile-walk-continuity, cap 1)
 *
 * NOT a room-art call, so no room baseline is required or claimed: the
 * references are the character's own approved stills (docs/52). Nothing here
 * promotes, nothing sets visual_accepted, and the output is reference/casting
 * material for the rig, never a runtime frame.
 */
const OUT = 'art/staging/thad';
const SIZE = '1024x1536';
const say = (line) => process.stdout.write(`${line}\n`);

// FAMILY A, AND ONLY FAMILY A. The standing profile still is the image being
// edited (first); the other three stills and the runtime stand frame fix the
// same man from the other views and at the size the game draws him. The
// earlier generations are deliberately NOT transmitted: they are the other
// drawing, and the whole point is not to get it back.
const FAMILY_A = [
  'reference/casting/thad-stand-right-src.png',   // the identity in profile: the image edited
  'reference/casting/thad-stand-front-src.png',   // the same man head-on
  'reference/casting/thad-stand-back-src.png',    // the same man from behind
  'reference/casting/thad-walk-front-src.png',    // the same man striding, head-on: the gait's shape
  'art/actors/thad-stand-front/stand-00.png',     // global baseline slot C: the approved current Thad, runtime frame
];

function guard(assetId) {
  const budget = budgetFor(assetId);
  say(`budget ${assetId}: ${budget.attempts}/${budget.allowedAttempts} attempt(s), ok=${budget.ok}`);
  if (!budget.ok) {
    for (const reason of budget.reasons) say(`  x ${reason}`);
    throw new Error(`AT CAP for ${assetId}. Tyler's sub-cap, not raised autonomously.`);
  }
}

const which = process.argv[2];
if (which === 'stride') {
  const n = process.argv[3] ?? '01';
  const assetId = 'thad-profile-walk-continuity';
  guard(assetId);
  mkdirSync(resolve(ROOT, OUT), { recursive: true });
  for (const image of FAMILY_A) say(`  ref ${hashFile(image).slice(0, 12)}  ${image}`);
  const made = await edit({
    promptFile: `proofs/thad/prompts/profile-stride-${n}.txt`, out: `${OUT}/profile-stride-${n}.png`,
    images: FAMILY_A, size: SIZE, purpose: 'character',
  });
  say(`  wrote ${made.out}, ${made.bytes} bytes, sha ${made.outputHash.slice(0, 12)}`);
  const row = record({
    ...made, assetId, subject: 'thad', role: 'other',
    roleNote: 'A profile STRIDE SOURCE for the rig -- a pose of the approved Family-A identity, whose '
      + 'canonical stills predate this ledger (reference/casting/thad-stand-*-src.png), so it is '
      + 'neither the canonical design nor a ledger-derived state. Owner-authorized, 1/1.',
    identityFamily: 'A', familyASources: FAMILY_A.map((path) => ({ path, hash: hashFile(path) })),
    authorizedBy: 'Tyler, THAD PROFILE WALK -- OWNER-AUTHORIZED GLOBAL CHARACTER ART REVISION (2026-09-05)',
  });
  say(`  recorded as ${assetId} attempt ${row.attempt}, role ${row.role}`);
  const gates = runGates(made.out, { kind: 'plate', expect: SIZE });
  attachGates(assetId, row.attempt, gates);
  say(`  gates: ${gates.passed ? 'PASS' : 'FAIL'}`);
  for (const line of gates.failures) say(`    x ${line}`);
} else {
  say('usage: node tools/art/thad.mjs stride [nn]');
  process.exit(2);
}
