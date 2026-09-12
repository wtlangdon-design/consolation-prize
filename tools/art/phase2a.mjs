import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { ROOT } from '../lib/content.mjs';
import { runGates } from './gates.mjs';
import { edit, hashFile } from './openai-image.mjs';
import { assertRecordable, attachGates, budgetFor, record } from './staging.mjs';

/**
 * PHASE 2A CASTING (Tyler's authorization of 2026-09-06, doc 36 Q128).
 *
 * One subcommand per authorized character asset, each against its own sub-cap
 * in art/staging/caps.json. Every call transmits the room's full baseline --
 * A/B/C global, D the approved comparable, E the two approved CHARACTER
 * authorities (Winnie and the Room 1 casting master) -- because doc 38's first
 * lesson is that a character described in words and not shown a style comes
 * back photographic, twice.
 *
 *   node tools/art/phase2a.mjs pie-woman [n]
 *   node tools/art/phase2a.mjs letter-writer [n]
 *   node tools/art/phase2a.mjs map-seller [n]
 *   node tools/art/phase2a.mjs bar-stove-family [n]
 *   node tools/art/phase2a.mjs card-landing-family [n]
 *   node tools/art/phase2a.mjs card-players [n]
 *
 * WHY MAGENTA AND NOT A ROOM. Doc 38 R3: these have to be keyed out and the
 * cast belongs in dark wool, which green sits inside. The room rides along as
 * a reference so the palette and the light are right; it is not the canvas.
 *
 * NOTHING HERE PROMOTES and nothing sets visual_accepted. Every result is a
 * CANDIDATE under art/staging/, judged by Tyler in the live room -- which is
 * the Room 5 lesson this whole phase is built on: a beautiful casting sheet is
 * not acceptance.
 */
const PORTRAIT = '1024x1536';
const SHEET = '1536x1024';
const say = (line) => process.stdout.write(`${line}\n`);

const BASE = [
  'renders/room-01-in-engine-1920x1080.png',        // 1  A: Room 1 live -- what the game looks like
  'art/backgrounds/room-01-stage-road.png',         // 2  B: Room 1 plate
  'art/actors/thad-stand-front/stand-00.png',       // 3  C: Thad -- the ruler, never the subject
];
const STREET = [...BASE,
  'art/staging/room-02/street-candidate-03/candidate-plate.png',  // 4 the accepted street: palette and night
  'art/staging/room-05/winnie-02-counter/winnie-counter-sheet.png', // 5 E: the accepted character hand
  'reference/casting/room-01-casting-master.png',   // 6 E: rendering by example
  'art/backgrounds/room-05-assay-office.png',       // 7 D: the visual-language target
];
const NUGGET = [...BASE,
  'art/staging/room-03/corrected-03/plate-cold-dirt.png',          // 4 the accepted saloon
  'art/staging/room-05/winnie-02-counter/winnie-counter-sheet.png', // 5 E
  'reference/casting/room-01-casting-master.png',   // 6 E
  'art/backgrounds/room-05-assay-office.png',       // 7 D
];

function guard(assetId) {
  const budget = budgetFor(assetId);
  say(`budget ${assetId}: ${budget.attempts}/${budget.allowedAttempts} attempt(s), `
    + `${budget.spentTokens} billed token(s) so far, ok=${budget.ok}`);
  if (!budget.ok) {
    for (const reason of budget.reasons) say(`  x ${reason}`);
    throw new Error(`AT CAP for ${assetId}. Tyler's sub-cap, not raised autonomously.`);
  }
  return budget;
}

async function cast({ assetId, subject, role, baselineRoom, promptFile, images, mask, out, size,
  note, derivedFrom }) {
  guard(assetId);
  // AND WOULD THE ROW BE ACCEPTED? The cap was always checked before the call
  // and the row never was, so a wrong role cost a whole operation four times.
  assertRecordable({ assetId, subject, role, operation: 'edit', model: 'gpt-image-2',
    ...(derivedFrom ? { derivedFrom } : {}) });
  mkdirSync(resolve(ROOT, out.slice(0, out.lastIndexOf('/'))), { recursive: true });
  for (const image of images) say(`  ref ${hashFile(image).slice(0, 12)}  ${image}`);
  if (mask) say(`  mask ${hashFile(mask).slice(0, 12)}  ${mask}`);
  const made = await edit({ promptFile, out, images, mask, size, baselineRoom,
    purpose: 'character' });
  say(`  wrote ${made.out}, ${made.bytes} bytes, sha ${made.outputHash.slice(0, 12)}`);
  say(`  transmitted: ${made.references.filter((r) => r.transmitted).length}/${made.references.length}`);
  // THE ROLE IS THE LEDGER'S, NOT A WORD OF OUR OWN. The first pie-woman call
  // passed "character", which is not one of the five, and record() refused it
  // AFTER the image had been generated and billed -- so an attempt was spent
  // and very nearly not written down. A single character is a
  // `canonical-design` (at most one per subject, which is the point); a
  // casting sheet of several is a `composition-master`, reference material
  // that is never shipped. And `subject` is the CHARACTER, not the room, or
  // the one-canonical-design-per-subject rule would count a whole street as
  // one person.
  const row = record({ ...made, assetId, subject, role, note,
    ...(derivedFrom ? { derivedFrom } : {}) });
  say(`  recorded as ${assetId} attempt ${row.attempt}`);
  const gates = runGates(made.out, { kind: 'plate', expect: size });
  attachGates(assetId, row.attempt, gates);
  say(`  gates: ${gates.passed ? 'PASS' : 'FAIL'}`);
  for (const line of gates.failures) say(`    x ${line}`);
  writeFileSync(resolve(ROOT, `${out.slice(0, out.lastIndexOf('/'))}/casting.json`),
    `${JSON.stringify({ assetId, attempt: row.attempt, promptFile, out, size,
      references: made.references.map((r) => ({ path: r.path, hash: r.hash })) }, null, 1)}\n`);
  return { made, row, gates };
}

const which = process.argv[2];
const n = process.argv[3] ?? '01';

const JOBS = {
  'pie-woman': {
    assetId: 'street-pie-woman', subject: 'pie-woman', role: 'canonical-design',
    baselineRoom: 'room-02-main-street',
    promptFile: `proofs/room-02/prompts/pie-woman-${n}.txt`, images: STREET, size: PORTRAIT,
    out: `art/staging/room-02/cast-pie-woman-${n}/source.png`,
    banner: '\nMAIN STREET · THE PIE WOMAN -- recast, whole figure on magenta\n',
    note: 'PHASE 2A CASTING: the pie woman, definite recast. Her shipped sheet drew her 157 px tall in a street where a man at her depth is 271, and she was staged behind the hitching rail on ground the frozen front-only rule has taken away. Character art only; 0 environment operations.',
  },
  'letter-writer': {
    assetId: 'street-letter-writer', subject: 'letter-writer', role: 'canonical-design',
    baselineRoom: 'room-02-main-street',
    promptFile: `proofs/room-02/prompts/letter-writer-${n}.txt`, images: STREET, size: PORTRAIT,
    out: `art/staging/room-02/cast-letter-writer-${n}/source.png`,
    banner: '\nMAIN STREET · THE LETTER-WRITER -- recast, with his work station, on magenta\n',
    note: 'PHASE 2A CASTING: the letter-writer and his station in one operation, because the premise has to read in a still frame and a man with no table is just a man. Character art only; 0 environment operations.',
  },
  'map-seller': {
    assetId: 'street-map-seller', subject: 'map-seller', role: 'canonical-design',
    baselineRoom: 'room-02-main-street',
    promptFile: `proofs/room-02/prompts/map-seller-${n}.txt`, images: STREET, size: PORTRAIT,
    out: `art/staging/room-02/cast-map-seller-${n}/source.png`,
    banner: '\nMAIN STREET · THE MAP SELLER -- recast, whole figure on magenta\n',
    note: 'PHASE 2A CASTING: the map seller, the CONDITIONAL recast. The audit said keep; that was judged while he was two thirds of his proper size. Enlarged to 231 px beside Thad the sheet reads as what it is -- a 150 px source upscaled 1.54x. Character art only; 0 environment operations.',
  },
  'bar-stove-family': {
    assetId: 'nugget-bar-stove-family', subject: 'nugget-bar-stove-family',
    role: 'composition-master', baselineRoom: 'room-03-nugget',
    promptFile: `proofs/room-03/prompts/bar-stove-family-${n}.txt`, images: NUGGET, size: SHEET,
    out: `art/staging/room-03/cast-bar-stove-${n}/source.png`,
    banner: '\nTHE NUGGET · BAR AND STOVE FAMILY -- four distinct men on one sheet, on magenta\n',
    note: 'PHASE 2A CASTING: three bar patrons and the stove man on one family sheet. The stove man is a story anchor -- the man who has not taken his coat off -- and not bar patron #4. Character art only; 0 environment operations.',
  },
  // ---- ROOM 3 ARCHITECTURAL RESET, CARD-PLAYER FEASIBILITY GATE -----------
  //
  // Tyler, 2026-09-12: the seven patrons baked into the Room 3 plate were never
  // the right architecture, and the four card players are the gate because the
  // near seats need views the old cast never had. ONE round.
  //
  // WHAT IS DIFFERENT FROM card-landing-family, WHICH SPENT TWO OPERATIONS AND
  // COULD NOT BE STAGED. That sheet was drawn from a written description of the
  // room, so all four men came back facing the camera -- and a round table's
  // near seats need men seen from BEHIND, which no placement, scale or occlusion
  // can produce from a front view (Q133). This call does not describe the room:
  // the accepted card table itself is reference 1 and is the image being edited,
  // so the four identities, the four poses and the two back views are SHOWN and
  // not asked for. Reference 2 is that earlier sheet, present only as the OUTPUT
  // FORMAT it did get right -- seated men, complete, on flat magenta -- because
  // it is the same four archetypes and cannot bleed a stranger into the cast.
  'card-players': {
    assetId: 'nugget-card-players', subject: 'nugget-card-players',
    role: 'composition-master', baselineRoom: 'room-03-nugget',
    promptFile: `proofs/room-03/prompts/card-players-${n}.txt`,
    images: [
      'art/staging/room-03/cast-card-players-01/locked-composition.png', // 1 THE LAW
      'art/staging/room-03/cast-card-landing-02/source.png',             // 2 the format
      'art/actors/thad-stand-front/stand-00.png',                        // 3 the hand
      'art/staging/room-05/winnie-02-counter/winnie-counter-sheet.png',  // 4 the hand
      'art/staging/room-03/corrected-03/plate-cold-dirt.png',            // 5 palette and light
      'reference/casting/room-01-casting-master.png',                    // 6 rendering by example
      // 7-9 THE GLOBAL BASELINE, which this room's art calls must transmit and
      // which the prompt does not number: naming a reference in provenance is
      // not supplying it to the model, and the baseline guard says so before
      // the call rather than after it. Appended, so references 1-6 stay exactly
      // the ones the prompt names.
      'renders/room-01-in-engine-1920x1080.png',                         // 7 A
      'art/backgrounds/room-01-stage-road.png',                          // 8 B
      'art/backgrounds/room-05-assay-office.png',                        // 9 D
    ],
    size: SHEET,
    out: `art/staging/room-03/cast-card-players-${n}/source.png`,
    banner: '\nTHE NUGGET · THE FOUR CARD PLAYERS -- feasibility gate, seat-correct views, on magenta\n',
    note: 'ROOM 3 ARCHITECTURAL RESET, CARD-PLAYER FEASIBILITY GATE: the four card-table players '
      + 'as independently separable runtime actors, in the seat-correct orientations the locked '
      + 'composition already has -- two of the four seen from behind. The accepted card table is '
      + 'transmitted as the image being edited so the composition is shown and not described. '
      + 'Character art only; 0 environment operations. ONE round, no retry.',
  },
  'card-landing-family': {
    assetId: 'nugget-card-landing-family', subject: 'nugget-card-landing-family',
    role: 'composition-master', baselineRoom: 'room-03-nugget',
    promptFile: `proofs/room-03/prompts/card-landing-family-${n}.txt`, images: NUGGET, size: SHEET,
    out: `art/staging/room-03/cast-card-landing-${n}/source.png`,
    banner: '\nTHE NUGGET · CARD AND LANDING FAMILY -- five distinct men on one sheet, on magenta\n',
    note: 'PHASE 2A CASTING: four card players and the landing man on one family sheet, all drawn standing and whole so a seated pose can be derived from a complete figure. Character art only; 0 environment operations.',
  },
};

// ---- THE AUTHORIZED REFINEMENTS ------------------------------------------
//
// EACH IS AN EDIT OF ITS OWN FIRST ATTEMPT, never a fresh generation. Doc 38's
// first rule: two independent generations of "the same" person are two people,
// and the difference is a flicker nobody can fix afterwards. The sheet being
// corrected is images[0]; THAD'S RUNTIME FRAME IS images[1], because the fault
// being corrected is that these figures do not look drawn by the same hand as
// him, and the target has to be in front of the model, not described to it.
const REFINE = {
  'pie-woman': ['street-pie-woman', 'pie-woman', 'room-02', 'cast-pie-woman', PORTRAIT, STREET,
    'the pie woman'],
  'letter-writer': ['street-letter-writer', 'letter-writer', 'room-02', 'cast-letter-writer',
    PORTRAIT, STREET, 'the letter-writer and his station'],
  'map-seller': ['street-map-seller', 'map-seller', 'room-02', 'cast-map-seller', PORTRAIT, STREET,
    'the map seller'],
  'bar-stove-family': ['nugget-bar-stove-family', 'nugget-bar-stove-family', 'room-03',
    'cast-bar-stove', SHEET, NUGGET, 'the bar and stove family'],
  'card-landing-family': ['nugget-card-landing-family', 'nugget-card-landing-family', 'room-03',
    'cast-card-landing', SHEET, NUGGET, 'the card and landing family'],
};
for (const [key, [assetId, subject, room, dir, size, refs, what]] of Object.entries(REFINE)) {
  const roomDir = room === 'room-02' ? 'room-02' : 'room-03';
  const promptDir = room === 'room-02' ? 'proofs/room-02/prompts' : 'proofs/room-03/prompts';
  const stem = key === 'bar-stove-family' ? 'bar-stove-family'
    : key === 'card-landing-family' ? 'card-landing-family' : key;
  JOBS[`${key}-refine`] = {
    assetId, subject,
    // A SINGLE CHARACTER'S REDRAW IS A DERIVED STATE OF HIS CANONICAL DESIGN.
    // A FAMILY SHEET'S REDRAW IS ANOTHER CASTING SHEET: reference material,
    // never shipped, and a `derived-state` may only descend from a
    // canonical-design, which a composition-master is not.
    role: room === 'room-03' ? 'composition-master' : 'derived-state',
    ...(room === 'room-03' ? {} : { derivedFrom: 1 }),
    baselineRoom: room === 'room-02' ? 'room-02-main-street' : 'room-03-nugget',
    promptFile: `${promptDir}/${stem}-02.txt`,
    // THE SHEET FIRST (it is the image being edited), THAD SECOND. The prompt
    // says "reference 2 is Thad" and it has to be true: the whole correction
    // is measured against him, and a target buried at position four is a
    // target described rather than shown.
    images: [`art/staging/${roomDir}/${dir}-01/source.png`,
      'art/actors/thad-stand-front/stand-00.png',
      ...refs.filter((one) => one !== 'art/actors/thad-stand-front/stand-00.png')],
    size,
    out: `art/staging/${roomDir}/${dir}-02/source.png`,
    banner: `\nREFINEMENT · ${what.toUpperCase()} -- redrawn in Thad's hand, as an edit of attempt 1\n`,
    note: `PHASE 2A OWNER-REVIEW CORRECTION: ${what}, refinement 1 of 1, spent against a concrete `
      + 'defect Tyler named in the DEPLOYED rooms -- the new cast is drawn far finer than Thad and '
      + 'reads as painted illustration reduced into the game. An EDIT of attempt 1 so the same '
      + 'people come back, with Thad\'s own runtime frame transmitted as the detail target. '
      + '0 environment operations.',
  };
}

// ---- THE ONE OWNER-EXCEPTION OPERATION -------------------------------------
//
// Tyler, 2026-09-06, after reviewing the correction pass: exactly ONE more
// `nugget-bar-stove-family` operation, for `nugget_bar_2` and `nugget_bar_3`
// only, and keep the current Bar Patron 1 and Stove Man.
//
// IT IS MASKED, AND THAT IS THE POINT. "Do not reopen the accepted family
// members" written into a prompt is a request; the same thing written into a
// mask is a guarantee, because the endpoint returns the source pixels wherever
// the mask is opaque. The two accepted men cannot come back different even if
// the model would have drawn them differently -- which, on a sheet of four
// where two are being redrawn in a new vocabulary, it certainly would.
//
// The window and its clearances are built and asserted by
// tools/retrofit/phase2a-bar-fix-prep.py from the extraction record's own
// boxes, so the coordinates the figures were CUT at are the coordinates the
// mask is drawn from, rather than the same numbers typed a second time.
JOBS['bar-stove-family-fix'] = {
  assetId: 'nugget-bar-stove-family', subject: 'nugget-bar-stove-family',
  role: 'composition-master', baselineRoom: 'room-03-nugget',
  promptFile: 'proofs/room-03/prompts/bar-stove-family-03.txt',
  images: ['art/staging/room-03/cast-bar-stove-02/source.png',
    'art/actors/thad-stand-front/stand-00.png',
    ...NUGGET.filter((one) => one !== 'art/actors/thad-stand-front/stand-00.png')],
  mask: 'art/staging/room-03/cast-bar-stove-03/edit-mask.png',
  size: SHEET,
  out: 'art/staging/room-03/cast-bar-stove-03/source.png',
  banner: '\nOWNER EXCEPTION · BAR PATRONS 2 AND 3 ONLY -- masked edit of the -02 sheet\n',
  note: 'PHASE 2A FINAL VISUAL CORRECTION, the ONE operation Tyler authorized over the ceiling of '
    + '2 (making this category 4 billed operations, of which attempt 3 was the recorded accidental '
    + 're-run). MASKED so only nugget_bar_2 and nugget_bar_3 are in play: Bar Patron 1 and the '
    + 'Stove Man are outside the free window and come back as their own pixels. The defect is '
    + 'theirs alone -- at matched deployed figure height these two still carry continuous cheek '
    + 'gradients, individually drawn moustache hairs and catchlights in the eye against Thad\'s '
    + 'hard clumps and flat masses. 0 environment operations. If this does not solve it, the '
    + 'instruction is to stop and report, not to generate again.',
};

// ---- THE FINAL OWNER-EXCEPTION OPERATION -----------------------------------
//
// Tyler, 2026-09-06, after the masked family-sheet attempt was rejected: one
// more operation, and the last one authorized anywhere in Phase 2A.
//
// THE INPUT TOPOLOGY CHANGES AND THE ART DIRECTION DOES NOT. The previous
// attempt proved the prompt works and the method does not: the two men the
// model drew were drawn in the vocabulary that was asked for, but a large
// masked window over a four-man sheet read as permission to recompose, and
// two men who were outside it came back altered and absent. A mask can be
// misread; an absence cannot. So Bar Patron 1 and the Stove Man are not in
// this request at all -- the source holds only the two men being corrected,
// pasted at native resolution with a gap between them wider than either of
// them, built by tools/retrofit/phase2a-bar-pair-prep.py.
//
// AND NO ROOM 3 ENVIRONMENT ART GOES WITH IT. The saloon plate rode along on
// the family calls as a palette reference; here it is one more thing that
// could be read as a scene to put people back into. The baseline's own six
// (Room 1 live and plate, Thad, the Room 5 comparable, Winnie and the Room 1
// casting master) are all that is transmitted, and they satisfy it in full.
JOBS['bar-pair'] = {
  assetId: 'nugget-bar-stove-family', subject: 'nugget-bar-stove-family',
  role: 'composition-master', baselineRoom: 'room-03-nugget',
  promptFile: 'proofs/room-03/prompts/bar-pair-01.txt',
  images: ['art/staging/room-03/cast-bar-pair-01/pair-source.png',
    'art/actors/thad-stand-front/stand-00.png',
    'renders/room-01-in-engine-1920x1080.png',
    'art/backgrounds/room-01-stage-road.png',
    'art/backgrounds/room-05-assay-office.png',
    'art/staging/room-05/winnie-02-counter/winnie-counter-sheet.png',
    'reference/casting/room-01-casting-master.png'],
  size: SHEET,
  out: 'art/staging/room-03/cast-bar-pair-01/source.png',
  banner: '\nFINAL OPERATION · nugget_bar_2 AND nugget_bar_3 ALONE -- isolated pair, no mask\n',
  note: 'PHASE 2A FINAL AUTHORIZED IMAGE OPERATION (Tyler, 2026-09-06). The two near-camera bar '
    + 'men redrawn in Thad\'s feature vocabulary, from a source that contains ONLY them: the '
    + 'masked family-sheet method was rejected because the endpoint recomposed the scene, so the '
    + 'two men who must not change are absent from the request rather than protected inside it. '
    + 'Identity, clothing, pose, facing and held objects are held; only the drawing vocabulary '
    + 'changes. No Room 3 environment art transmitted. 0 environment operations. Nothing is '
    + 'integrated on the strength of this call alone -- each man is judged separately against his '
    + 'retained version, Thad at matched height, and the accepted controls.',
};

// ---- THE FURNITURE-REGISTERED CLUSTERS -------------------------------------
//
// Tyler, 2026-09-07, after accepting the Q133 diagnosis: author the
// furniture-dependent group as a coherent composition against the exact
// canonical furniture, then decompose it into runtime actors. Exactly one
// operation each and no retries.
//
// THE IMAGE BEING EDITED IS THE ROOM'S OWN PIXELS, at an integer x2 so the
// round trip back to the plate is exact (tools/retrofit/nugget-cluster-prep.py).
// The furniture is in the REQUEST as contact geometry and never in the output
// that ships: after the registration gate, only the people are extracted.
//
// The identity sheet rides as reference 2 rather than being pasted into the
// canvas, so nothing about the patrons' current -- rejected -- placement is
// suggested to the model as a layout. Thad is reference 3, as he has been all
// phase, and the baseline's A/B/D/E/E follow.
const CLUSTER_REFS = [
  'art/actors/thad-stand-front/stand-00.png',
  'renders/room-01-in-engine-1920x1080.png',
  'art/backgrounds/room-01-stage-road.png',
  'art/backgrounds/room-05-assay-office.png',
  'art/staging/room-05/winnie-02-counter/winnie-counter-sheet.png',
  'reference/casting/room-01-casting-master.png',
];
for (const [key, assetId, dir, size, what] of [
  ['cluster-card', 'nugget-card-furniture-cluster', 'cluster-card-01', '1024x1024',
    'four men seated at the canonical card table'],
  ['cluster-bar', 'nugget-bar-furniture-cluster', 'cluster-bar-01', SHEET,
    'three men using the canonical bar'],
]) {
  JOBS[key] = {
    assetId, subject: assetId, role: 'composition-master', baselineRoom: 'room-03-nugget',
    promptFile: `proofs/room-03/prompts/${dir}.txt`,
    images: [`art/staging/room-03/${dir}/furniture-canvas.png`,
      `art/staging/room-03/${dir}/identity.png`, ...CLUSTER_REFS],
    mask: `art/staging/room-03/${dir}/edit-mask.png`,
    size,
    out: `art/staging/room-03/${dir}/source.png`,
    banner: `\nFURNITURE-REGISTERED CLUSTER · ${what.toUpperCase()}\n`,
    note: `PHASE 2A FURNITURE-REGISTERED CLUSTER (Tyler, 2026-09-07, 1 of 1, no retries): ${what}, `
      + 'composed INTO the accepted plate\'s own pixels at an integer x2 so the round trip is '
      + 'exact. The furniture is contact geometry in the request and never ships: only the people '
      + 'are extracted, and the plate is never rewritten. Nothing is integrated on the strength of '
      + 'this call -- the returned furniture is compared against the canonical input first.',
  };
}

// ---- THE ROOM 3 BAR REBUILD -----------------------------------------------
//
// Tyler, 2026-09-11: the build decision is accepted, the Nugget freeze is
// withdrawn, the card cluster becomes canon and EXACTLY ONE operation rebuilds
// the bar quadrant with its three patrons on it. No retry.
//
// The canvas is the CARD-BAKED plate, so four accepted men ride inside the
// frame at their accepted size: the scale and the drawing language are in the
// picture, not only in the words. The free window is a RECTANGLE the counter
// enters and leaves through kept room -- the previous call's band left the
// counter free along its whole length and its slope reversed.
JOBS['bar-rebuild'] = {
  assetId: 'room-03-nugget', subject: 'room-03-nugget',
  role: 'composition-master', baselineRoom: 'room-03-nugget',
  promptFile: 'proofs/room-03/prompts/bar-rebuild-01.txt',
  images: ['art/staging/room-03/bar-rebuild-01/canvas.png',
    'art/staging/room-03/bar-rebuild-01/identity.png',
    ...CLUSTER_REFS,
    'art/staging/room-03/cluster-bar-01/source.png'],
  mask: 'art/staging/room-03/bar-rebuild-01/edit-mask.png',
  size: SHEET,
  out: 'art/staging/room-03/bar-rebuild-01/source.png',
  banner: '\nROOM 3 BAR REBUILD -- ONE OPERATION, NO RETRY\n',
  note: 'ROOM 3 REBUILD (Tyler, 2026-09-11, 1 of 1, no retries): the long diagonal bar, its '
    + 'back bar, three stools and the three accepted patrons registered to it, painted into the '
    + "card-baked plate's own pixels. The last reference is the REJECTED bar generation, carried "
    + 'as pose and contact authority only -- Tyler accepted it for that and rejected its '
    + 'architecture. Nothing is integrated on the strength of this call: the returned room is '
    + 'compared against the canonical input first.',
};

const job = JOBS[which];
if (!job) {
  say(`usage: node tools/art/phase2a.mjs <${Object.keys(JOBS).join('|')}> [n]`);
  process.exit(2);
}
say(job.banner);
await cast(job);
