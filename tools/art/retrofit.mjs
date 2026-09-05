import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { ROOT } from '../lib/content.mjs';
import { deriveFixedRoomPlate } from './derive.mjs';
import { runGates } from './gates.mjs';
import { edit, hashFile } from './openai-image.mjs';
import { attachGates, budgetFor, record } from './staging.mjs';

/**
 * THE OPENING-SET RETROFIT'S PLATE CALLS (phase 1, Tyler's authorization of
 * 2026-09-05; doc 36 Q116). A task-specific driver like room05.mjs: one
 * subcommand per authorized operation against its own sub-cap, the baseline
 * references actually transmitted, the provenance row carrying its purpose
 * before the request leaves, and the technical gates run on what came back.
 *
 *   node tools/art/retrofit.mjs street-west [n]     Main Street, the west panel   (main-street-plate, cap 4)
 *   node tools/art/retrofit.mjs street-east [n]     Main Street, the east panel: an OUTPAINT that continues
 *                                                   the west panel's right part under a mask
 *   node tools/art/retrofit.mjs nugget [n]          the Nugget, the clean people-free plate (nugget-plate, cap 2)
 *
 * WHY TWO PANELS FOR THE STREET. Errata 63's transform yields one 1920x864
 * plate per operation and a street is wider than a window. The east panel is
 * generated on a canvas whose left 30% IS the west source (tools/art/
 * street-outpaint.py builds it), with a mask that lets the model paint only
 * the rest, so the seam is the model continuing its own picture rather than
 * two pictures asked to agree. The derived panels overlap by the same 30% and
 * the stitch (street-stitch.py) keeps the west panel's pixels through the
 * overlap and the east panel's beyond it.
 *
 * WHY THE NUGGET IS AN EDIT OF ITS OWN PLATE. Tyler's goal is the same
 * authored location with the people gone and the finish changed; an edit
 * keeps the composition by construction, the way Room 5's night plate kept
 * the day's.
 *
 * Nothing here promotes, and nothing here sets visual_accepted. Every plate
 * that comes out of this file is a CANDIDATE under art/staging/.
 */

const SIZE = '1536x1024';
const say = (line) => process.stdout.write(`${line}\n`);

// THE RENDERING ANCHOR FIRST, THEN THE GLOBAL BASELINE, THEN THE ROOM'S OWN
// ANCESTRY AND THE VISUAL-LANGUAGE TARGET, THEN THAD AS THE RULER. The order
// is what the prompts number.
const STREET_REFS = [
  'reference/casting/room-01-casting-master.png',   // 1 the approved rendering by example
  'renders/room-01-in-engine-1920x1080.png',        // 2 A: Room 1 live -- the exterior night, as played
  'art/backgrounds/room-01-stage-road.png',         // 3 B: Room 1 plate -- exterior mood authority
  'art/backgrounds/room-02-main-street.png',        // 4 the current street: geography, night, the saloon exception
  'art/backgrounds/room-05-assay-office.png',       // 5 D: the owner-approved visual-language target (night)
  'art/actors/thad-stand-front/stand-00.png',       // 6 C: Thad, the scale ruler
];
const NUGGET_REFS = [
  'art/backgrounds/room-03-nugget.png',             // 1 the image being edited: the composition to keep
  'art/backgrounds/room-05-assay-office.png',       // 2 D: the finish and the light to change to
  'reference/casting/room-01-casting-master.png',   // 3 the approved rendering by example
  'renders/room-01-in-engine-1920x1080.png',        // 4 A
  'art/backgrounds/room-01-stage-road.png',         // 5 B
  'art/actors/thad-stand-front/stand-00.png',       // 6 C: Thad, the scale ruler
];

function guard(assetId) {
  const budget = budgetFor(assetId);
  say(`budget ${assetId}: ${budget.attempts}/${budget.allowedAttempts} attempt(s), `
    + `${budget.spentTokens} billed token(s) so far, ok=${budget.ok}`);
  if (!budget.ok) {
    for (const reason of budget.reasons) say(`  x ${reason}`);
    throw new Error(`AT CAP for ${assetId}. Tyler's sub-cap, not raised autonomously.`);
  }
}

async function call({ assetId, subject, baselineRoom, promptFile, images, mask, out, derived, extra = {} }) {
  guard(assetId);
  mkdirSync(resolve(ROOT, out.slice(0, out.lastIndexOf('/'))), { recursive: true });
  for (const image of images) say(`  ref ${hashFile(image).slice(0, 12)}  ${image}`);
  if (mask) say(`  mask ${hashFile(mask).slice(0, 12)}  ${mask}`);
  const made = await edit({ promptFile, out, images, mask, size: SIZE, baselineRoom, purpose: 'plate' });
  say(`  wrote ${made.out}, ${made.bytes} bytes, sha ${made.outputHash.slice(0, 12)}`);
  say(`  transmitted: ${made.references.filter((r) => r.transmitted).length}/${made.references.length}`);
  const row = record({ ...made, assetId, subject, role: 'plate', ...extra });
  say(`  recorded as ${assetId} attempt ${row.attempt}`);
  const gates = runGates(made.out, { kind: 'plate', expect: SIZE });
  attachGates(assetId, row.attempt, gates);
  say(`  gates: ${gates.passed ? 'PASS' : 'FAIL'}`);
  for (const line of gates.failures) say(`    x ${line}`);
  // ERRATA 63'S DERIVATION, the same crop and the same named kernel Room 5
  // shipped through, recorded beside the source.
  mkdirSync(resolve(ROOT, derived.slice(0, derived.lastIndexOf('/'))), { recursive: true });
  const plate = deriveFixedRoomPlate({ source: made.out, out: derived });
  writeFileSync(resolve(ROOT, `${derived.slice(0, derived.lastIndexOf('/'))}/derivation.json`),
    `${JSON.stringify({ ...plate, ledger: { assetId, attempt: row.attempt } }, null, 1)}\n`);
  say(`  derived ${derived} (${JSON.stringify(plate).slice(0, 160)}...)`);
  return { made, row, gates, plate };
}

const which = process.argv[2];
const n = process.argv[3] ?? '01';

if (which === 'street-west') {
  say('\nMAIN STREET · WEST PANEL -- a new plate at architectural scale, people-free\n');
  await call({
    assetId: 'main-street-plate', subject: 'room-02-main-street', baselineRoom: 'room-02-main-street',
    promptFile: `proofs/room-02/prompts/street-west-${n}.txt`, images: STREET_REFS,
    out: `art/staging/room-02/street-west-source-${n}.png`,
    derived: `art/staging/room-02/street-west-${n}/panel-1920x864.png`,
    extra: { panel: 'west', note: 'OPENING-SET RETROFIT PHASE 1: Main Street REGENERATE-CANDIDATE, west panel. The current plate stays shipping until Tyler accepts a candidate.' },
  });
} else if (which === 'street-east') {
  // THE OUTPAINT. street-outpaint.py has laid the west SOURCE's right 30% on
  // the left of a fresh 1536x1024 canvas and written the mask beside it; the
  // canvas is the image edited (first), the mask says where the model may
  // paint, and the west panel itself rides along as the picture to continue.
  const west = process.argv[4] ?? '01';
  say('\nMAIN STREET · EAST PANEL -- the street continued to the east under a mask\n');
  await call({
    assetId: 'main-street-plate', subject: 'room-02-main-street', baselineRoom: 'room-02-main-street',
    promptFile: `proofs/room-02/prompts/street-east-${n}.txt`,
    images: [`art/staging/room-02/street-east-${n}/outpaint-canvas.png`, ...STREET_REFS],
    mask: `art/staging/room-02/street-east-${n}/outpaint-mask.png`,
    out: `art/staging/room-02/street-east-source-${n}.png`,
    derived: `art/staging/room-02/street-east-${n}/panel-1920x864.png`,
    extra: { panel: 'east', continues: `art/staging/room-02/street-west-source-${west}.png`,
      note: 'OPENING-SET RETROFIT PHASE 1: Main Street REGENERATE-CANDIDATE, east panel, outpainted from the west source under a mask.' },
  });
} else if (which === 'nugget-refine') {
  // THE ONE REFINEMENT, against a concrete defect in the first: clean-plate-01
  // came back without the handbill and without the back-room door, both of
  // which the prompt asked to keep and both of which the room's writing
  // needs. The candidate SOURCE is the image edited under a mask that frees
  // only the two wall patches; everything else is asked to stay.
  const from = process.argv[4] ?? '01';
  say('\nTHE NUGGET · REFINEMENT -- the handbill and the back-room door, under a mask\n');
  await call({
    assetId: 'nugget-plate', subject: 'room-03-nugget', baselineRoom: 'room-03-nugget',
    promptFile: `proofs/room-03/prompts/clean-plate-${n}.txt`,
    images: [`art/staging/room-03/clean-plate-source-${from}.png`, ...NUGGET_REFS.slice(1)],
    mask: `art/staging/room-03/clean-plate-${n}/edit-mask.png`,
    out: `art/staging/room-03/clean-plate-source-${n}.png`,
    derived: `art/staging/room-03/clean-plate-${n}/candidate-1920x864.png`,
    extra: { editedFrom: `art/staging/room-03/clean-plate-source-${from}.png`,
      note: 'OPENING-SET RETROFIT PHASE 1: Nugget clean plate, refinement 2 of 2 -- the handbill and the back-room door restored under a mask; concrete defect in attempt 1.' },
  });
} else if (which === 'nugget') {
  say('\nTHE NUGGET · CLEAN PLATE -- the same room, nobody in it, in Room 5\'s finish\n');
  await call({
    assetId: 'nugget-plate', subject: 'room-03-nugget', baselineRoom: 'room-03-nugget',
    promptFile: `proofs/room-03/prompts/clean-plate-${n}.txt`, images: NUGGET_REFS,
    out: `art/staging/room-03/clean-plate-source-${n}.png`,
    derived: `art/staging/room-03/clean-plate-${n}/candidate-1920x864.png`,
    extra: { editedFrom: 'art/backgrounds/room-03-nugget.png',
      note: 'OPENING-SET RETROFIT PHASE 1: Nugget REGENERATE-CANDIDATE, the clean people-free plate, an edit of the shipping plate. The shipping plate stays until Tyler accepts a candidate.' },
  });
} else {
  say('usage: retrofit.mjs street-west [n] | street-east [n] [westN] | nugget [n]');
  process.exit(2);
}
