/**
 * THE R3-PREF PEOPLE-FREE REPLICA DRIVER.
 *
 * Tyler, OWNER STRATEGY RESET (2026-09-13): stop decomposing R3-PREF and
 * recreate its visual result instead, people-free, as a candidate.
 *
 *   node tools/room03/pref-replica.mjs 01        the initial replica
 *   node tools/room03/pref-replica.mjs 02        the ONE conditional refinement
 *
 * WHAT IS DELIBERATELY REVERSED HERE, and it is the whole point of the reset.
 * The clean-sheet driver's governing rule was that the old plate is NOT a
 * reference -- "the endpoint reproduces the perspective it is shown" -- and
 * that rule produced a room Tyler rejected for being a different room. Section
 * 17 of this ruling reverses it in as many words: R3-PREF IS THE PRIMARY VISUAL
 * REFERENCE. Reproducing the perspective it is shown is now the requirement,
 * not the hazard.
 *
 * The global baseline still rides along, because the harness checks that every
 * required reference is actually in the form being posted rather than merely
 * named in provenance, and because the drawing vocabulary is still the game's
 * and not this one picture's.
 *
 * NOTHING HERE PROMOTES. The output lands under art/staging/, the shipping
 * room keeps pointing at R3-PREF, and Tyler judges the picture.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { ROOT } from '../lib/content.mjs';
import { runGates } from '../art/gates.mjs';
import { edit, hashFile } from '../art/openai-image.mjs';
import { assertRecordable, attachGates, budgetFor, record } from '../art/staging.mjs';

const ASSET = 'room-03-pref-replica-plate';
const SIZE = '1536x1024';           // 3:2, the nearest the endpoint has to 1920x864
const say = (line) => process.stdout.write(`${line}\n`);

/** Reference 1 is the room. Everything after it is context. */
const R3PREF = 'art/staging/room-03/rebuild-05/plate-room-03-repaired.png';
const PRIOR = 'art/staging/room-03/pref-replica-01/source.png';

/**
 * ATTEMPT 2 REFERENCES ITS OWN ATTEMPT 1 FIRST, and that is the difference
 * between a refinement and a re-roll. Section 19 authorises the second
 * operation only for a named, repairable defect, so the picture being repaired
 * has to be the thing the endpoint is looking at; pointing it back at R3-PREF
 * alone would ask for the whole room again and get a third room.
 */
const REFERENCES = [
  ...(process.argv[2] === '02' ? [PRIOR, R3PREF] : [R3PREF]),        // 1 THE ROOM, binding
  ...(process.argv[2] === '02' ? [] :
    ['art/staging/room-03/corrected-03/plate-cold-dirt.png']),       // 2 same room, no people, wrong bar/table
  'proofs/room-03/pref-replica/blocking-on-r3pref.png',              // 3 the blocking
  'art/actors/thad-stand-front/stand-00.png',                        // 4 the protagonist
  'art/staging/room-05/winnie-02-counter/winnie-counter-sheet.png',  // 5 another character
  'art/backgrounds/room-05-assay-office.png',                        // 6 visual-language authority
  'renders/room-01-in-engine-1920x1080.png',                         // 7 the game, live
  'reference/casting/room-01-casting-master.png',                    // 8 rendering by example
  'art/backgrounds/room-01-stage-road.png',                          // 9 baseline slot B
];

const n = process.argv[2] ?? '01';
const promptFile = `proofs/room-03/prompts/pref-replica-plate-${n}.txt`;
const out = `art/staging/room-03/pref-replica-${n}/source.png`;

const budget = budgetFor(ASSET);
say(`budget ${ASSET}: ${budget.attempts}/${budget.allowedAttempts} attempt(s), `
  + `${budget.spentTokens} billed token(s) so far, ok=${budget.ok}`);
if (!budget.ok) {
  for (const reason of budget.reasons) say(`  x ${reason}`);
  say(`\nAT CAP for ${ASSET}. Tyler's sub-cap of 2; it is not raised autonomously.`);
  process.exit(1);
}
if (n !== '01' && budget.attempts === 0) {
  say('refusing: attempt 02 is the CONDITIONAL refinement and attempt 01 has not run.');
  process.exit(2);
}

say('\nROOM 3 · R3-PREF PEOPLE-FREE REPLICA — the same room, repainted empty\n');
assertRecordable({ assetId: ASSET, subject: ASSET, role: 'plate',
  operation: 'edit', model: 'gpt-image-2' });
mkdirSync(resolve(ROOT, out.slice(0, out.lastIndexOf('/'))), { recursive: true });
for (const image of REFERENCES) say(`  ref ${hashFile(image).slice(0, 12)}  ${image}`);

const made = await edit({ promptFile, out, images: REFERENCES, size: SIZE,
  baselineRoom: 'room-03-nugget', purpose: 'room-art' });
say(`  wrote ${made.out}, ${made.bytes} bytes, sha ${made.outputHash.slice(0, 12)}`);
say(`  transmitted: ${made.references.filter((r) => r.transmitted).length}/${made.references.length}`);

const row = record({ ...made, assetId: ASSET, subject: ASSET, role: 'plate',
  note: ('R3-PREF PEOPLE-FREE REPLICA (Tyler, 2026-09-13). The asset truth audit proved no '
    + 'people-free R3-PREF exists anywhere in the repository or its history -- the card and bar '
    + 'furniture only ever arrived in the same generated images as the men -- so the room is '
    + 'recreated empty rather than decomposed. R3-PREF is reference 1 and binding: same camera, '
    + 'same bar trajectory, same card table, same stove depth, same darkness. Candidate only; '
    + 'nothing is promoted and the shipping room still points at R3-PREF.') });
say(`  recorded as ${ASSET} attempt ${row.attempt}`);

const gates = runGates(made.out, { kind: 'plate', expect: SIZE });
attachGates(ASSET, row.attempt, gates);
say(`  gates: ${gates.passed ? 'PASS' : 'FAIL'}`);
for (const line of gates.failures) say(`    x ${line}`);

writeFileSync(resolve(ROOT, `${out.slice(0, out.lastIndexOf('/'))}/casting.json`),
  `${JSON.stringify({ assetId: ASSET, attempt: row.attempt, promptFile, out, size: SIZE,
    blueprint: R3PREF, blueprintHash: hashFile(R3PREF),
    references: made.references.map((r) => ({ path: r.path, hash: r.hash })) }, null, 1)}\n`);
say('\nNOT PROMOTED. Candidate under art/staging/. Tyler judges the picture.');
