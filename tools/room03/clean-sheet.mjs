/**
 * THE CLEAN-SHEET ROOM 3 GENERATION DRIVER.
 *
 * Tyler's clean-sheet reset (2026-09-13). Four authorised categories, each with
 * its own sub-cap in art/staging/caps.json, each a NEW category so the
 * historical rows keep saying what they said:
 *
 *   node tools/room03/clean-sheet.mjs card  [n]   max 2
 *   node tools/room03/clean-sheet.mjs bar   [n]   max 2
 *   node tools/room03/clean-sheet.mjs shell [n]   max 2
 *   node tools/room03/clean-sheet.mjs stove-landing [n]   max 1, expected 0
 *
 * WHAT IS DIFFERENT FROM EVERY EARLIER ROOM 3 CALL, and it is the whole reset:
 * the RETIRED PLATE IS NOT A REFERENCE. Not as a canvas, not as an edit base,
 * not as a palette sample. Section 18 allows the old room to be consulted for
 * mood and canonical content and forbids its pixels being carried into the new
 * one, and a reference image is the quietest way to carry them -- the endpoint
 * reproduces the perspective it is shown. The visual-language authority is
 * Room 5, which is what section 2 actually names.
 *
 * WHAT IS TRANSMITTED INSTEAD is the project's global baseline -- Room 1 live,
 * Thad, Room 5, Winnie, the Room 1 casting master -- plus THIS ROOM'S OWN
 * BLOCKING, which was drawn deterministically from the camera and spends no
 * operation.
 *
 * NOTHING HERE PROMOTES and nothing sets visual_accepted. Every result is a
 * candidate under art/staging/, decomposed and gated offline, and judged by
 * Tyler in the live room.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { ROOT } from '../lib/content.mjs';
import { runGates } from '../art/gates.mjs';
import { edit, hashFile } from '../art/openai-image.mjs';
import { assertRecordable, attachGates, budgetFor, record } from '../art/staging.mjs';

const SHEET = '1536x1024';
const SQUARE = '1024x1024';
const say = (line) => process.stdout.write(`${line}\n`);

/** The global baseline, in the order the prompts number them. */
const AUTHORITY = [
  'art/actors/thad-stand-front/stand-00.png',                       // 3 the ruler
  'art/staging/room-05/winnie-02-counter/winnie-counter-sheet.png', // 4 the character hand
  'art/backgrounds/room-05-assay-office.png',                       // 5 visual-language authority
  'renders/room-01-in-engine-1920x1080.png',                        // 6 the game, live
  'reference/casting/room-01-casting-master.png',                   // 7 rendering by example
  // 8 BASELINE SLOT B, and it is here because the harness refused the call
  // without it rather than because the prompt wanted it. requireBaseline
  // checks that every A-E reference is actually in the form being posted, not
  // merely named in provenance -- so a call that describes its authorities and
  // sends five of six is stopped before it is billed. It was.
  'art/backgrounds/room-01-stage-road.png',
];

const JOBS = {
  card: {
    assetId: 'nugget-clean-card-cluster', subject: 'nugget-clean-card-cluster',
    role: 'composition-master',
    guide: 'proofs/room-03/clean-sheet/card-cluster-guide.png',
    banner: '\nCLEAN-SHEET ROOM 3 · CARD CLUSTER MASTER -- table, four chairs, four seated men, on magenta\n',
    note: ('CLEAN-SHEET REBUILD sec.10: the card cluster authored as ONE coherent composition so the '
      + 'contacts are real -- hips on seats, knees under the table, the top crossing the far men and the '
      + 'near men in front of it -- and decomposed afterwards into a furniture base, four independent '
      + 'actors and occlusion. The two near seats are BACK VIEWS, which is the thing Q133 proved cannot '
      + 'be asked for in words. Nobody ships flattened into the table.'),
  },
  bar: {
    assetId: 'nugget-clean-bar-cluster', subject: 'nugget-clean-bar-cluster',
    role: 'composition-master',
    guide: 'proofs/room-03/clean-sheet/bar-cluster-guide.png',
    banner: '\nCLEAN-SHEET ROOM 3 · BAR CLUSTER MASTER -- the long counter and three patrons, on magenta\n',
    note: ('CLEAN-SHEET REBUILD sec.12: the bar cluster authored as ONE coherent composition -- the long '
      + 'mahogany counter running the room\'s depth, its back bar, stools and brass rail, and three men '
      + 'who are respectively seated, leaning and standing -- then decomposed into furniture, three '
      + 'independent actors and occlusion.'),
  },
  shell: {
    assetId: 'nugget-clean-room-shell', subject: 'nugget-clean-room-shell', role: 'plate',
    guide: 'proofs/room-03/clean-sheet/blocking.png',
    banner: '\nCLEAN-SHEET ROOM 3 · THE PEOPLE-FREE ROOM SHELL\n',
    note: ('CLEAN-SHEET REBUILD sec.11: the room the accepted clusters already stand in -- walls, dirt '
      + 'floor, windows, doors, piano, stove, stairs and landing, chandelier, mirror, practical light -- '
      + 'and NOT ONE PERSON IN IT. Built around fixed cluster geometry rather than the other way round.'),
  },
  'stove-landing': {
    assetId: 'nugget-clean-stove-landing', subject: 'nugget-clean-stove-landing',
    role: 'composition-master',
    guide: 'proofs/room-03/clean-sheet/blocking.png',
    banner: '\nCLEAN-SHEET ROOM 3 · STOVE MAN AND LANDING MAN -- one family sheet, on magenta\n',
    note: ('CLEAN-SHEET REBUILD sec.19/25D: the stove man and the landing man recast together, and ONLY '
      + 'because the audit of the existing accepted actors gave a concrete visual reason. Expected spend '
      + 'for this category was zero.'),
  },
};

const which = process.argv[2];
const n = process.argv[3] ?? '01';
const job = JOBS[which];
if (!job) {
  say('usage: clean-sheet.mjs card|bar|shell|stove-landing [n]');
  process.exit(2);
}

const budget = budgetFor(job.assetId);
say(`budget ${job.assetId}: ${budget.attempts}/${budget.allowedAttempts} attempt(s), `
  + `${budget.spentTokens} billed token(s) so far, ok=${budget.ok}`);
if (!budget.ok) {
  for (const reason of budget.reasons) say(`  x ${reason}`);
  say(`\nAT CAP for ${job.assetId}. Tyler's sub-cap; it is not raised autonomously.`);
  process.exit(1);
}

// THE BAR CLUSTER IS SQUARE, because its back bar rises behind the counter's
// near end to y 64 and a 3:2 box cut it off.
const size = which === 'bar' ? SQUARE : SHEET;
const promptFile = `proofs/room-03/prompts/clean-${which}-cluster-${n}.txt`;
const out = `art/staging/room-03/clean-${which}-${n}/source.png`;
const images = [job.guide, 'proofs/room-03/clean-sheet/blocking.png', ...AUTHORITY];

say(job.banner);
assertRecordable({ assetId: job.assetId, subject: job.subject, role: job.role,
  operation: 'edit', model: 'gpt-image-2' });
mkdirSync(resolve(ROOT, out.slice(0, out.lastIndexOf('/'))), { recursive: true });
for (const image of images) say(`  ref ${hashFile(image).slice(0, 12)}  ${image}`);

const made = await edit({ promptFile, out, images, size,
  baselineRoom: 'room-03-nugget', purpose: 'character' });
say(`  wrote ${made.out}, ${made.bytes} bytes, sha ${made.outputHash.slice(0, 12)}`);
say(`  transmitted: ${made.references.filter((r) => r.transmitted).length}/${made.references.length}`);

const row = record({ ...made, assetId: job.assetId, subject: job.subject, role: job.role,
  note: job.note });
say(`  recorded as ${job.assetId} attempt ${row.attempt}`);
const gates = runGates(made.out, { kind: 'plate', expect: size });
attachGates(job.assetId, row.attempt, gates);
say(`  gates: ${gates.passed ? 'PASS' : 'FAIL'}`);
for (const line of gates.failures) say(`    x ${line}`);
writeFileSync(resolve(ROOT, `${out.slice(0, out.lastIndexOf('/'))}/casting.json`),
  `${JSON.stringify({ assetId: job.assetId, attempt: row.attempt, promptFile, out, size,
    references: made.references.map((r) => ({ path: r.path, hash: r.hash })) }, null, 1)}\n`);
