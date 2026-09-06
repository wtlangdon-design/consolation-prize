import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { ROOT } from '../lib/content.mjs';
import { runGates } from './gates.mjs';
import { edit, hashFile } from './openai-image.mjs';
import { attachGates, budgetFor, record } from './staging.mjs';

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

async function cast({ assetId, subject, role, baselineRoom, promptFile, images, out, size, note }) {
  guard(assetId);
  mkdirSync(resolve(ROOT, out.slice(0, out.lastIndexOf('/'))), { recursive: true });
  for (const image of images) say(`  ref ${hashFile(image).slice(0, 12)}  ${image}`);
  const made = await edit({ promptFile, out, images, size, baselineRoom, purpose: 'character' });
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
  const row = record({ ...made, assetId, subject, role, note });
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
  'card-landing-family': {
    assetId: 'nugget-card-landing-family', subject: 'nugget-card-landing-family',
    role: 'composition-master', baselineRoom: 'room-03-nugget',
    promptFile: `proofs/room-03/prompts/card-landing-family-${n}.txt`, images: NUGGET, size: SHEET,
    out: `art/staging/room-03/cast-card-landing-${n}/source.png`,
    banner: '\nTHE NUGGET · CARD AND LANDING FAMILY -- five distinct men on one sheet, on magenta\n',
    note: 'PHASE 2A CASTING: four card players and the landing man on one family sheet, all drawn standing and whole so a seated pose can be derived from a complete figure. Character art only; 0 environment operations.',
  },
};

const job = JOBS[which];
if (!job) {
  say(`usage: node tools/art/phase2a.mjs <${Object.keys(JOBS).join('|')}> [n]`);
  process.exit(2);
}
say(job.banner);
await cast(job);
