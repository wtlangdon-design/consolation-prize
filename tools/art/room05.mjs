import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { ROOT } from '../lib/content.mjs';
import { runGates } from './gates.mjs';
import { edit, hashFile } from './openai-image.mjs';
import { attachGates, budgetFor, record } from './staging.mjs';

/**
 * THE ROOM 5 PILOT'S ART CALLS. A task-specific driver, not a framework: each
 * subcommand is one authorized operation against one sub-cap, with the
 * references the baseline requires actually transmitted, the provenance row
 * carrying its role, and the technical gates run on what came back.
 *
 *   node tools/art/room05.mjs master           composition/casting master   (cap 2)
 *   node tools/art/room05.mjs winnie           canonical Winnie             (cap 3, shared)
 *   node tools/art/room05.mjs winnie-sheet     her work poses, from the canonical
 *   node tools/art/room05.mjs plate            the clean plate, from the master (cap 2)
 *   node tools/art/room05.mjs night            the NIGHT plate, edited from the DAY source (reserve, cap 1)
 *
 * Nothing here promotes, and nothing here sets visual_accepted.
 */

const ROOM = 'room-05-assay-office';
const OUT = 'art/staging/room-05';
const SIZE = '1536x1024';
const say = (line) => process.stdout.write(`${line}\n`);

// THE ROOM 1 CASTING MASTER GOES FIRST. Tyler rejected master-01 for its
// rendering; the sheet that defines the approved rendering by example is the
// primary image on every call from here, and the prompt names it as such.
const BASELINE = [
  'reference/casting/room-01-casting-master.png',
  'renders/room-01-in-engine-1920x1080.png',
  'art/backgrounds/room-01-stage-road.png',
  'art/actors/thad-stand-front/stand-00.png',
  'art/backgrounds/room-03-nugget.png',
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

async function call({ assetId, subject, role, promptFile, images, out, purpose, extra = {},
  kind = 'plate', derivedFrom }) {
  guard(assetId);
  mkdirSync(resolve(ROOT, OUT), { recursive: true });
  for (const image of images) say(`  ref ${hashFile(image).slice(0, 12)}  ${image}`);
  const made = await edit({
    promptFile, out, images, size: SIZE, baselineRoom: ROOM, purpose,
  });
  say(`  wrote ${made.out}, ${made.bytes} bytes, sha ${made.outputHash.slice(0, 12)}`);
  say(`  transmitted: ${made.references.filter((r) => r.transmitted).length}/${made.references.length}`
    + (made.baseline?.pendingAcknowledged ? `  (E pending, acknowledged for ${purpose})` : ''));
  const row = record({ ...made, assetId, subject, role, ...(derivedFrom ? { derivedFrom } : {}), ...extra });
  say(`  recorded as ${assetId} attempt ${row.attempt}, role ${row.role}`);
  const gates = runGates(made.out, { kind, expect: SIZE });
  attachGates(assetId, row.attempt, gates);
  say(`  gates: ${gates.passed ? 'PASS' : 'FAIL'}`);
  for (const line of gates.failures) say(`    x ${line}`);
  return { made, row, gates };
}

const which = process.argv[2];
const arg = process.argv[3];

if (which === 'master') {
  say('\nROOM 5 · COMPOSITION / CASTING MASTER -- never a shipping plate\n');
  await call({
    assetId: 'room-05-composition-master', subject: 'room-05-assay-office',
    role: 'composition-master', purpose: 'composition-master',
    promptFile: `proofs/room-05/prompts/composition-master-${arg ?? '01'}.txt`,
    images: BASELINE, out: `${OUT}/composition-master-${arg ?? '01'}.png`,
  });
} else if (which === 'winnie') {
  if (!arg) throw new Error('winnie needs the master path as its argument');
  say('\nWINNIE · CANONICAL DESIGN -- one, from the master\n');
  await call({
    assetId: 'winnie', subject: 'winnie', role: 'canonical-design', purpose: 'character',
    // ONE CALL, THREE POSES. The rest pose is her canonical design; the two
    // work poses are drawn in the same generation, which is the strongest
    // form of "derived from the canonical" there is -- one pass, one person.
    // Master-02 first: it is what she is being pointed at in.
    promptFile: `proofs/room-05/prompts/winnie-sheet-${process.argv[4] ?? '02'}.txt`,
    images: [arg, ...BASELINE],
    out: `${OUT}/winnie-canonical-${process.argv[4] ?? '02'}.png`, kind: 'plate',
  });
} else if (which === 'winnie-sheet') {
  const canonical = arg;
  const attempt = Number(process.argv[4]);
  if (!canonical || !attempt) throw new Error('winnie-sheet needs <canonical path> <its attempt number>');
  say('\nWINNIE · WORK POSES -- derived from the canonical design\n');
  await call({
    assetId: 'winnie', subject: 'winnie', role: 'derived-state', purpose: 'character',
    derivedFrom: attempt,
    promptFile: 'proofs/room-05/prompts/winnie-sheet.txt',
    // THE CANONICAL FIRST -- it is the image being edited -- then the master,
    // which is slot E and is what the guard refused this call without. The
    // refusal cost nothing: it fired before any request left the machine.
    images: [canonical, 'art/staging/room-05/composition-master-01.png', ...BASELINE],
    out: `${OUT}/winnie-sheet-${process.argv[5] ?? '01'}.png`, kind: 'plate',
  });
} else if (which === 'plate') {
  if (!arg) throw new Error('plate needs the master path as its argument');
  say('\nROOM 5 · CLEAN PLATE SOURCE -- from the master, people and movers removed\n');
  await call({
    assetId: 'room-05-plate', subject: 'room-05-assay-office', role: 'plate', purpose: 'plate',
    promptFile: `proofs/room-05/prompts/clean-plate-${process.argv[4] ?? '02'}.txt`,
    images: [arg, ...BASELINE], out: `${OUT}/plate-source-${process.argv[4] ?? '02'}.png`,
  });
} else if (which === 'night') {
  // THE FINAL PILOT OPERATION. Tyler's night pass: the accepted DAY source is
  // the image being edited (first), and every approved night ancestor goes
  // with it -- Room 1's live frame and plate, the signed-off Main Street
  // night plate, the Nugget (the approved night interior), Thad, and the
  // baseline's own E slots. One call against the reserve sub-cap; a second
  // is refused by the cap, not by discretion.
  say('\nROOM 5 · NIGHT PLATE SOURCE -- the DAY source relit, nothing moved\n');
  await call({
    assetId: 'room-05-reserve', subject: 'room-05-assay-office', role: 'plate', purpose: 'plate',
    promptFile: `proofs/room-05/prompts/night-plate-${arg ?? '01'}.txt`,
    images: [
      'art/staging/room-05/plate-source-02.png',        // the DAY source: composition and geometry authority
      'reference/casting/room-01-casting-master.png',   // E: the rendering anchor
      'renders/room-01-in-engine-1920x1080.png',        // A: Room 1 night, live
      'art/backgrounds/room-01-stage-road.png',         // B: Room 1 night plate
      'art/backgrounds/room-02-main-street.png',        // the signed-off Main Street NIGHT plate (errata 64)
      'art/backgrounds/room-03-nugget.png',             // D: the approved night interior
      'art/actors/thad-stand-front/stand-00.png',       // C: Thad
      'art/staging/room-05/composition-master-02.png',  // E: Winnie's casting master
    ],
    out: `${OUT}/plate-source-03-night.png`,
    extra: { state: 'night', editedFrom: 'art/staging/room-05/plate-source-02.png',
      note: 'ROOM 5 NIGHT VISUAL CANDIDATE source. Errata 64: Room 1 night -> Main Street night -> Room 5 night. An edit of the accepted DAY source, lighting only; the DAY candidate stays as ROOM 5 - DAY VISUAL CANDIDATE.' },
  });
} else if (which === 'lamp') {
  // POST-PILOT OWNER VISUAL REVISION, +1. Tyler's ruling: a small period oil
  // work lamp over the ledger is canon. Acquired IN CONTEXT -- the night
  // source is the image being edited so the lamp arrives in the room's own
  // perspective, scale and light -- and then EXTRACTED as a separate prop; the
  // edited room is not a replacement plate. Recorded under its own asset and
  // cap, apart from the pilot's 8/8.
  say('\nROOM 5 · HANGING WORK LAMP -- acquired in the night room, to be cut out as a prop\n');
  await call({
    assetId: 'room-05-lamp', subject: 'hanging-lamp', role: 'canonical-design', purpose: 'plate',
    promptFile: `proofs/room-05/prompts/hanging-lamp-${arg ?? '01'}.txt`,
    images: [
      'art/staging/room-05/plate-source-03-night.png',  // the NIGHT source: the image being edited, geometry authority
      'art/staging/room-05/plate-source-02.png',        // the DAY source: the same room, the lamp must fit both
      'reference/casting/room-01-casting-master.png',   // E: the rendering anchor
      'renders/room-01-in-engine-1920x1080.png',        // A: Room 1 night, live
      'art/backgrounds/room-01-stage-road.png',         // B: Room 1 night plate (Hob's carried lamp is the approved lamp vocabulary)
      'art/backgrounds/room-02-main-street.png',        // the signed-off Main Street NIGHT plate (its lanterns)
      'art/backgrounds/room-03-nugget.png',             // D: the approved night interior (its lamps)
      'art/actors/thad-stand-front/stand-00.png',       // C: Thad, for scale
      'art/staging/room-05/composition-master-02.png',  // E: Winnie's casting master, for her scale at the counter
    ],
    out: `${OUT}/lamp-source-01.png`,
    extra: { state: 'night', editedFrom: 'art/staging/room-05/plate-source-03-night.png', accounting: 'POST-PILOT OWNER VISUAL REVISION — +1 IMAGE OPERATION (pilot stays 8/8)',
      note: 'THE HANGING WORK LAMP, owner-ruled canon: one small plain period oil lamp hung from the brass cage over the ledger. This image exists to be cut: the lamp is extracted as a separate RGBA prop drawn over the unchanged DAY and NIGHT plates; the edited room itself is not a plate.' },
  });
} else {
  say('usage: room05.mjs master | winnie <master> | winnie-sheet <canonical> <attempt> | plate <master> | night | lamp');
  process.exit(2);
}
