import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
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

async function call({ assetId, subject, baselineRoom, promptFile, images, mask, out, derived, extra = {}, size = SIZE, deriveFn = null }) {
  guard(assetId);
  mkdirSync(resolve(ROOT, out.slice(0, out.lastIndexOf('/'))), { recursive: true });
  for (const image of images) say(`  ref ${hashFile(image).slice(0, 12)}  ${image}`);
  if (mask) say(`  mask ${hashFile(mask).slice(0, 12)}  ${mask}`);
  const made = await edit({ promptFile, out, images, mask, size, baselineRoom, purpose: 'plate' });
  say(`  wrote ${made.out}, ${made.bytes} bytes, sha ${made.outputHash.slice(0, 12)}`);
  say(`  transmitted: ${made.references.filter((r) => r.transmitted).length}/${made.references.length}`);
  const row = record({ ...made, assetId, subject, role: 'plate', ...extra });
  say(`  recorded as ${assetId} attempt ${row.attempt}`);
  const gates = runGates(made.out, { kind: 'plate', expect: size });
  attachGates(assetId, row.attempt, gates);
  say(`  gates: ${gates.passed ? 'PASS' : 'FAIL'}`);
  for (const line of gates.failures) say(`    x ${line}`);
  // ERRATA 63'S DERIVATION, the same crop and the same named kernel Room 5
  // shipped through, recorded beside the source.
  mkdirSync(resolve(ROOT, derived.slice(0, derived.lastIndexOf('/'))), { recursive: true });
  // A LOCAL CANVAS (Phase 1.5D) is not an errata-63 plate source: its result
  // is scaled back into the plate by the prep record, not cropped by the
  // fixed-room transform, so `deriveFn` says how.
  const plate = deriveFn ? deriveFn(made.out, derived) : deriveFixedRoomPlate({ source: made.out, out: derived });
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
} else if (which === 'street-trough') {
  // PHASE 1.5B: the trough as local prop art, painted in context inside a
  // mask over a source canvas BUILT from the accepted plate
  // (art/staging/room-02/trough-01/trough-op.json). Only the masked region
  // of the derived result is taken, and only the trough's silhouette from it.
  say('\nMAIN STREET · THE TROUGH -- local prop art in context, under a mask\n');
  await call({
    assetId: 'main-street-trough', subject: 'room-02-main-street', baselineRoom: 'room-02-main-street',
    promptFile: `proofs/room-02/prompts/trough-${n}.txt`,
    images: [`art/staging/room-02/trough-${n}/edit-canvas.png`, ...STREET_REFS],   // the baseline's A/B/C/D, Thad as the ruler included
    mask: `art/staging/room-02/trough-${n}/edit-mask.png`,
    out: `art/staging/room-02/trough-source-${n}.png`,
    derived: `art/staging/room-02/trough-${n}/window-1920x864.png`,
    extra: { editedFrom: `art/staging/room-02/trough-${n}/edit-canvas.png`, maskRecord: `art/staging/room-02/trough-${n}/trough-op.json`,
      note: 'OPENING-SET RETROFIT PHASE 1.5B: the water trough as local prop art in the accepted street; owner finding 1 (the Phase 1.5 trough read as pasted, jagged, old and electric blue). The owner-authorized 1 of 1.' },
  });
} else if (which === 'street-board' || which === 'street-trough-local') {
  // PHASE 1.5D: one local, centred 1024x1024 canvas per subject; the derived
  // file is the canvas's plate window scaled back to 1:1 (the composite into
  // the companion is tools/retrofit/phase15d-integrate.py).
  const isBoard = which === 'street-board';
  const dir = isBoard ? 'art/staging/room-02/board-01' : 'art/staging/room-02/trough-02';
  const op = JSON.parse(readFileSync(resolve(ROOT, `${dir}/${isBoard ? 'board' : 'trough'}-op.json`), 'utf8'));
  say(isBoard ? '\nMAIN STREET · THE NOTICE BOARD -- a local centred canvas, one operation\n' : '\nMAIN STREET · THE TROUGH -- a local centred canvas, the 1.5C trough as reference, one operation\n');
  await call({
    assetId: isBoard ? 'main-street-board' : 'main-street-trough', subject: 'room-02-main-street', baselineRoom: 'room-02-main-street',
    promptFile: isBoard ? 'proofs/room-02/prompts/board-01.txt' : 'proofs/room-02/prompts/trough-02.txt',
    images: [`${dir}/edit-canvas.png`, ...(isBoard ? [] : [`${dir}/object-reference.png`]), ...STREET_REFS],
    mask: `${dir}/edit-mask.png`, size: '1024x1024',
    out: `${dir}/result-1024.png`, derived: `${dir}/local-1to1.png`,
    deriveFn: (source, outPath) => {
      // the canvas's plate window, scaled back to plate scale, as the record says
      const [x0, y0, x1, y1] = op.region; const [ax, ay] = op.at; const k = op.scale;
      const w = Math.round((x1 - x0) * k), h = Math.round((y1 - y0) * k);
      execFileSync('python3', ['-c', `from PIL import Image; im=Image.open('${source}').crop((${ax},${ay},${ax + w},${ay + h})).resize((${x1 - x0},${y1 - y0}), Image.LANCZOS); im.save('${outPath}')`], { cwd: ROOT });
      return { transform: 'phase15d-local-window', region: op.region, scale: k, at: op.at, out: outPath };
    },
    extra: { editedFrom: `${dir}/edit-canvas.png`, maskRecord: `${dir}/${isBoard ? 'board' : 'trough'}-op.json`,
      note: isBoard ? 'OPENING-SET RETROFIT PHASE 1.5D: the notice board framed around the existing papers on a local centred canvas. The owner-authorized 1 of 1.' : 'OPENING-SET RETROFIT PHASE 1.5D: the trough on a local centred canvas with the 1.5C object as reference. The owner-authorized 1 of 1 for this phase.' },
  });
} else if (which === 'street-repair') {
  // PHASE 1.5E: one local structural repair per region (a: board / storefront /
  // church; b: trough + east rail), each on a centred 1024 canvas; the derived
  // file is the canvas's plate window scaled back to 1:1, and the masked zone
  // becomes PLATE in tools/retrofit/phase15e-integrate.py.
  const region = n === 'b' ? 'b' : 'a';
  const dir = `art/staging/room-02/repair-${region}`;
  const op = JSON.parse(readFileSync(resolve(ROOT, `${dir}/repair-op.json`), 'utf8'));
  say(region === 'a' ? '\nMAIN STREET · REGION A -- the board, the storefront porch end and the church wall repaired as one structure\n' : '\nMAIN STREET · REGION B -- the trough and the east hitching rail authored together as one scene\n');
  await call({
    assetId: `main-street-repair-${region}`, subject: 'room-02-main-street', baselineRoom: 'room-02-main-street',
    promptFile: `proofs/room-02/prompts/repair-${region}.txt`,
    images: [`${dir}/edit-canvas.png`, ...(region === 'b' ? [`${dir}/object-reference.png`] : []), ...STREET_REFS],
    mask: `${dir}/edit-mask.png`, size: '1024x1024',
    out: `${dir}/result-1024.png`, derived: `${dir}/local-1to1.png`,
    deriveFn: (source, outPath) => {
      const [x0, y0, x1, y1] = op.region; const [ax, ay] = op.at; const k = op.scale;
      const w = Math.round((x1 - x0) * k), h = Math.round((y1 - y0) * k);
      execFileSync('python3', ['-c', `from PIL import Image; im=Image.open('${source}').crop((${ax},${ay},${ax + w},${ay + h})).resize((${x1 - x0},${y1 - y0}), Image.LANCZOS); im.save('${outPath}')`], { cwd: ROOT });
      return { transform: 'phase15e-local-window', region: op.region, scale: k, at: op.at, out: outPath };
    },
    extra: { editedFrom: `${dir}/edit-canvas.png`, maskRecord: `${dir}/repair-op.json`,
      note: region === 'a' ? 'OPENING-SET RETROFIT PHASE 1.5E: REGION A structural repair -- the notice board freestanding and clear of the storefront porch, the church\'s lower wall continued, the porch end finished; the masked zone becomes plate. The owner-authorized 1 of 1.' : 'OPENING-SET RETROFIT PHASE 1.5E: REGION B structural repair -- the water trough and the east hitching rail painted together as one scene; the masked zone becomes plate. The owner-authorized 1 of 1.' },
  });
} else if (which === 'street-chapel') {
  // PHASE 1.5F: the one conditional chapel-front repair, on a local canvas
  // with the chapel centred; the masked zone becomes plate and the frozen
  // notice board is composited back by its own silhouette
  // (tools/retrofit/phase15f-chapel-integrate.py).
  const dir = 'art/staging/room-02/chapel-01';
  const op = JSON.parse(readFileSync(resolve(ROOT, `${dir}/chapel-op.json`), 'utf8'));
  say('\nMAIN STREET · THE CHAPEL FRONT -- a door, steps and a base for a facade that has none\n');
  await call({
    assetId: 'main-street-chapel', subject: 'room-02-main-street', baselineRoom: 'room-02-main-street',
    promptFile: 'proofs/room-02/prompts/chapel-01.txt',
    images: [`${dir}/edit-canvas.png`, ...STREET_REFS],
    mask: `${dir}/edit-mask.png`, size: '1024x1024',
    out: `${dir}/result-1024.png`, derived: `${dir}/local-1to1.png`,
    deriveFn: (source, outPath) => {
      const [x0, y0, x1, y1] = op.region; const [ax, ay] = op.at; const k = op.scale;
      const w = Math.round((x1 - x0) * k), h = Math.round((y1 - y0) * k);
      execFileSync('python3', ['-c', `from PIL import Image; im=Image.open('${source}').crop((${ax},${ay},${ax + w},${ay + h})).resize((${x1 - x0},${y1 - y0}), Image.LANCZOS); im.save('${outPath}')`], { cwd: ROOT });
      return { transform: 'phase15f-local-window', region: op.region, scale: k, at: op.at, out: outPath };
    },
    extra: { editedFrom: `${dir}/edit-canvas.png`, maskRecord: `${dir}/chapel-op.json`,
      note: 'OPENING-SET RETROFIT PHASE 1.5F: the chapel front given a door, steps, a base and small windows -- the facade carried no architecture at all. The owner-authorized conditional 1 of 1.' },
  });
} else if (which === 'street-integrate') {
  // PHASE 1.5C: the board and the trough painted INTO the street, in context,
  // under one mask over the plate window (integrate-01/integrate-op.json).
  say('\nMAIN STREET · BOARD + TROUGH -- painted into the street, under one mask\n');
  await call({
    assetId: 'main-street-plate-integration', subject: 'room-02-main-street', baselineRoom: 'room-02-main-street',
    promptFile: `proofs/room-02/prompts/integrate-${n}.txt`,
    images: [`art/staging/room-02/integrate-${n}/edit-canvas.png`, ...STREET_REFS],
    mask: `art/staging/room-02/integrate-${n}/edit-mask.png`,
    out: `art/staging/room-02/integrate-source-${n}.png`,
    derived: `art/staging/room-02/integrate-${n}/window-1920x864.png`,
    extra: { editedFrom: `art/staging/room-02/integrate-${n}/edit-canvas.png`, maskRecord: `art/staging/room-02/integrate-${n}/integrate-op.json`,
      note: 'OPENING-SET RETROFIT PHASE 1.5C (owner review of 1.5B failed): the notice board structure and the water trough painted into the accepted street in context; the masked regions become plate. The owner-directed 1 of 1.' },
  });
} else if (which === 'nugget-floor' && n === '03') {
  // PHASE 1.5C: the whole public floor, no holes, no box restore.
  say('\nTHE NUGGET · DIRT FLOOR, ONE FLOOR -- the whole public floor, under a mask with no holes\n');
  await call({
    assetId: 'nugget-floor', subject: 'room-03-nugget', baselineRoom: 'room-03-nugget',
    promptFile: 'proofs/room-03/prompts/dirt-floor-03.txt',
    images: ['art/staging/room-03/floor-source-02.png', ...NUGGET_REFS.slice(1)],
    mask: 'art/staging/room-03/floor-03/edit-mask.png',
    out: 'art/staging/room-03/floor-source-03.png',
    derived: 'art/staging/room-03/floor-03/candidate-1920x864.png',
    extra: { editedFrom: 'art/staging/room-03/floor-source-02.png', maskRecord: 'art/staging/room-03/floor-03/floor-op.json',
      note: 'OPENING-SET RETROFIT PHASE 1.5C (owner review of 1.5B failed): one continuous dirt floor, the whole public floor under a mask with no furniture holes, no rectangular restore afterwards. The owner-directed 3 of 3.' },
  });
} else if (which === 'nugget-floor' && n === '02') {
  // PHASE 1.5B: the whole public floor, on top of the floor-01 result.
  say('\nTHE NUGGET · DIRT FLOOR, COMPLETED -- the whole public floor, under a mask\n');
  await call({
    assetId: 'nugget-floor', subject: 'room-03-nugget', baselineRoom: 'room-03-nugget',
    promptFile: 'proofs/room-03/prompts/dirt-floor-02.txt',
    images: ['art/staging/room-03/floor-source-01.png', ...NUGGET_REFS.slice(1)],
    mask: 'art/staging/room-03/floor-02/edit-mask.png',
    out: 'art/staging/room-03/floor-source-02.png',
    derived: 'art/staging/room-03/floor-02/candidate-1920x864.png',
    extra: { editedFrom: 'art/staging/room-03/floor-source-01.png', maskRecord: 'art/staging/room-03/floor-02/floor-op.json',
      note: 'OPENING-SET RETROFIT PHASE 1.5B: the public saloon floor completed as dirt (owner finding 3: the Phase 1.5 mask stopped at the far wall\'s foot in front of the furniture). The owner re-authorized remaining Nugget operation, 2 of 2.' },
  });
} else if (which === 'nugget-floor') {
  // PHASE 1.5, THE ONE AUTHORIZED FLOOR OPERATION: the clean plate's source
  // edited under a mask that frees only the main saloon floor (art/staging/
  // room-03/floor-01/floor-op.json records the mask, the polygon, the intended
  // unchanged regions and why the deterministic attempt was not enough).
  say('\nTHE NUGGET · DIRT FLOOR -- the plank floor re-materialised as compacted earth, under a mask\n');
  await call({
    assetId: 'nugget-floor', subject: 'room-03-nugget', baselineRoom: 'room-03-nugget',
    promptFile: `proofs/room-03/prompts/dirt-floor-${n}.txt`,
    images: ['art/staging/room-03/clean-plate-source-02.png', ...NUGGET_REFS.slice(1)],
    mask: 'art/staging/room-03/floor-01/edit-mask.png',
    out: `art/staging/room-03/floor-source-${n}.png`,
    derived: `art/staging/room-03/floor-${n}/candidate-1920x864.png`,
    extra: { editedFrom: 'art/staging/room-03/clean-plate-source-02.png', maskRecord: 'art/staging/room-03/floor-01/floor-op.json',
      note: 'OPENING-SET RETROFIT PHASE 1.5: canon correction -- the Nugget has a DIRT floor (doc 05, doc 16). Masked to the main floor only; furniture inside the mask restored from the source afterwards. The owner-authorized 1 of 1 for the floor.' },
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
