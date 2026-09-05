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
} else if (which === 'walk-cycle') {
  // THE AUTHORED WHOLE-BODY WALK CYCLE. Tyler's ruling after four cuts of
  // puppet-rigging and one intact-upper-body cut: the profile walk is made
  // from COMPLETE authored poses, cropped whole, never assembled from limbs.
  // One sheet of six sequential right-facing poses; the standing still is
  // the image edited, the other stills fix the same man from the other
  // views, the stride source goes last as a pose reference only.
  const n = process.argv[3] ?? '01';
  const assetId = 'thad-profile-walk-cycle-authoring';
  guard(assetId);
  mkdirSync(resolve(ROOT, OUT), { recursive: true });
  const refs = [...FAMILY_A, 'art/staging/thad/profile-stride-01.png'];
  for (const image of refs) say(`  ref ${hashFile(image).slice(0, 12)}  ${image}`);
  const made = await edit({
    promptFile: `proofs/thad/prompts/profile-walk-cycle-${n}.txt`, out: `${OUT}/profile-walk-cycle-${n}.png`,
    images: refs, size: '1536x1024', purpose: 'character',
  });
  say(`  wrote ${made.out}, ${made.bytes} bytes, sha ${made.outputHash.slice(0, 12)}`);
  const row = record({
    ...made, assetId, subject: 'thad', role: 'other',
    roleNote: 'A WALK-CYCLE SHEET of the approved Family-A identity: six complete sequential right-facing '
      + 'walking poses, to be cropped as whole runtime frames (tools/rig/cut-cycle-sheet.py) and never '
      + 'puppet-rigged. Owner-authorized, 1/1, separate from thad-profile-walk-continuity.',
    identityFamily: 'A', familyASources: FAMILY_A.map((path) => ({ path, hash: hashFile(path) })),
    poseReference: { path: 'art/staging/thad/profile-stride-01.png', hash: hashFile('art/staging/thad/profile-stride-01.png'), note: 'movement/pose reference only; Family A wins any conflict' },
    authorizedBy: 'Tyler, THAD PROFILE WALK -- AUTHORED WHOLE-BODY WALK-CYCLE PASS (2026-09-05)',
  });
  say(`  recorded as ${assetId} attempt ${row.attempt}, role ${row.role}`);
  const gates = runGates(made.out, { kind: 'plate', expect: '1536x1024' });
  attachGates(assetId, row.attempt, gates);
  say(`  gates: ${gates.passed ? 'PASS' : 'FAIL'}`);
  for (const line of gates.failures) say(`    x ${line}`);
} else if (which === 'opposite-half') {
  // THE MISSING OPPOSITE HALF OF THE AUTHORED GAIT. Tyler's diagnosis after
  // reviewing the three-frame cycle: profile-walk-cycle-01.png drew one half
  // of a walk twice (the same leg leading in poses 4-6), so the runtime
  // looped a half step and the arms read as scissoring at the reset. This
  // asks for about THREE complete right-facing poses that COMPLETE that
  // sheet -- far leg forward, near arm forward -- with the approved sheet
  // itself as the image edited, so the new figures are drawn as more moments
  // of the same sheet rather than a new interpretation. Cropped whole, as
  // before; the three existing frames stay untouched.
  const n = process.argv[3] ?? '01';
  const assetId = 'thad-profile-walk-opposite-half';
  guard(assetId);
  mkdirSync(resolve(ROOT, OUT), { recursive: true });
  const CYCLE = 'art/staging/thad/profile-walk-cycle-01.png';
  const refs = [CYCLE, ...FAMILY_A];
  for (const image of refs) say(`  ref ${hashFile(image).slice(0, 12)}  ${image}`);
  const made = await edit({
    promptFile: `proofs/thad/prompts/profile-walk-opposite-half-${n}.txt`, out: `${OUT}/profile-walk-opposite-half-${n}.png`,
    images: refs, size: '1536x1024', purpose: 'character',
  });
  say(`  wrote ${made.out}, ${made.bytes} bytes, sha ${made.outputHash.slice(0, 12)}`);
  const row = record({
    ...made, assetId, subject: 'thad', role: 'other',
    roleNote: 'THE OPPOSITE HALF of the authored profile walk: about three complete right-facing poses '
      + '(far leg forward, near arm forward) completing profile-walk-cycle-01.png, to be cropped as whole '
      + 'runtime frames (tools/rig/cut-cycle-sheet.py) and never puppet-rigged. Owner-authorized, 1/1, '
      + 'separate from thad-profile-walk-continuity and thad-profile-walk-cycle-authoring.',
    identityFamily: 'A', familyASources: FAMILY_A.map((path) => ({ path, hash: hashFile(path) })),
    movementFamilyAuthority: { path: CYCLE, hash: hashFile(CYCLE), note: 'the approved first-half sheet, transmitted first as the image edited: the movement family these poses complete' },
    authorizedBy: 'Tyler, THAD PROFILE WALK -- COMPLETE THE MISSING OPPOSITE HALF-CYCLE (2026-09-05)',
  });
  say(`  recorded as ${assetId} attempt ${row.attempt}, role ${row.role}`);
  const gates = runGates(made.out, { kind: 'plate', expect: '1536x1024' });
  attachGates(assetId, row.attempt, gates);
  say(`  gates: ${gates.passed ? 'PASS' : 'FAIL'}`);
  for (const line of gates.failures) say(`    x ${line}`);
} else {
  say('usage: node tools/art/thad.mjs stride [nn] | walk-cycle [nn] | opposite-half [nn]');
  process.exit(2);
}
