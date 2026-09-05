import assert from 'node:assert/strict';
import test from 'node:test';

import { readJson } from '../tools/lib/content.mjs';
import { check, evidenceResolves, PRE_ART_GATES } from '../tools/check-build-contracts.mjs';

/**
 * THE ROOM BUILD CONTRACT VALIDATOR, PROVED BY MUTATION. Each witness starts
 * from the real Room 5 contract (the benchmark) and breaks one thing; the
 * check must fail on that thing by name and on nothing else it did not
 * already fail on.
 */

const PATH = 'content/build-contracts/room-05-assay-office.json';
const load = () => ({ path: PATH, data: structuredClone(readJson(PATH)) });
const only = (report, pattern) => report.failures.filter((line) => pattern.test(line));

test('the four contracts pass', () => {
  const report = check();
  assert.deepEqual(report.failures, []);
});

test('an unknown gate status is refused', () => {
  const contract = load();
  contract.data.preArtGate.lighting.status = 'MOSTLY';
  const report = check([contract]);
  assert.equal(only(report, /preArtGate\/lighting: status "MOSTLY"/).length, 1);
});

test('every pre-art gate must be answered, NOT-RUN included', () => {
  const contract = load();
  delete contract.data.preArtGate.roomLife;
  const report = check([contract]);
  assert.equal(only(report, /preArtGate\/roomLife: not answered/).length, 1);
  assert.equal(PRE_ART_GATES.length, 9);
});

test('a PASS with no evidence is an opinion and fails', () => {
  const contract = load();
  contract.data.preArtGate.cluePerceptibility.evidence = [];
  const report = check([contract]);
  assert.equal(only(report, /cluePerceptibility: PASS with no evidence/).length, 1);
});

test('evidence must resolve: a missing file, an unresolvable heading', () => {
  const contract = load();
  contract.data.preArtGate.lighting.evidence = ['proofs/room-05/no-such-record.json', 'docs/36-issue-list.md::Q9999 · nothing'];
  const report = check([contract]);
  assert.equal(only(report, /lighting: evidence proofs\/room-05\/no-such-record\.json does not exist/).length, 1);
  assert.equal(only(report, /lighting: evidence .*Q9999/).length, 1);
  assert.equal(evidenceResolves('cmd:node tools/compile-room.mjs 5 --check').ok, true);
});

test('an accepted exception names its ruling', () => {
  const contract = load();
  delete contract.data.preArtGate.cast.exception;
  const report = check([contract]);
  assert.equal(only(report, /preArtGate\/cast: an accepted exception names the ruling/).length, 1);
});

test('nothing under art/staging/ may claim SHIPPING (accepted-work protection)', () => {
  const contract = load();
  // The DAY plate is the staged one after the promotion (ACCEPTED-NOT-SHIPPING);
  // the night plate now lives at its shipping path and cannot be this witness.
  const plate = contract.data.lifecycle.find((asset) => asset.subject.startsWith('DAY plate'));
  plate.stage = 'SHIPPING';
  const report = check([contract]);
  assert.equal(only(report, /DAY plate.*claims SHIPPING and lives under art\/staging\//).length, 1);
});

test('a candidate stage outside art/staging/ is a promotion without the step', () => {
  const contract = load();
  // The promoted night plate at art/backgrounds/ is the witness now.
  const shipping = contract.data.lifecycle.find((asset) => asset.path === 'art/backgrounds/room-05-assay-office.png');
  shipping.stage = 'CANDIDATE';
  const report = check([contract]);
  assert.equal(only(report, /claims CANDIDATE and lives at art\/backgrounds/).length, 1);
});

test('the contract may not outrun the ledger on visual acceptance, nor the ledger the contract', () => {
  const contract = load();
  contract.data.acceptance.visual.status = 'PENDING';
  const report = check([contract]);
  assert.equal(only(report, /acceptance\/visual: says PENDING and the ledger's visual_accepted is true/).length, 1);

  const ledger = structuredClone(readJson('content/build-ledger.json'));
  ledger.items.find((item) => item.id === 'room-05-assay-office').visual_accepted = false;
  const again = check([load()], ledger);
  assert.equal(only(again, /says OWNER-ACCEPTED and the ledger's visual_accepted is false/).length, 1);
});

test('an owner gameplay acceptance names who, when and the evidence', () => {
  const contract = load();
  delete contract.data.acceptance.gameplay.act1.on;
  const report = check([contract]);
  assert.equal(only(report, /gameplay\/act1: OWNER-ACCEPTED names who, when and the evidence/).length, 1);
});

test('promotion DONE with staged assets still in the tree is refused', () => {
  // Room 5 IS promoted now, so the witness is accepted work left behind under
  // staging: the DAY plate re-marked OWNER-VISUAL-ACCEPTED instead of
  // ACCEPTED-NOT-SHIPPING is exactly a file the promotion step never carried.
  const contract = load();
  assert.equal(contract.data.acceptance.promotion.status, 'DONE');
  contract.data.lifecycle.find((asset) => asset.subject.startsWith('DAY plate')).stage = 'OWNER-VISUAL-ACCEPTED';
  const report = check([contract]);
  assert.equal(only(report, /promotion: DONE, and \d+ asset\(s\) still live under art\/staging\//).length, 1);
});

test('later states and retrofit rows use the closed vocabularies', () => {
  const contract = load();
  contract.data.laterStates[0].status = 'DONE-ISH';
  contract.data.retrofit[0].classification = 'FINE';
  const report = check([contract]);
  assert.equal(only(report, /laterStates\/C5 \/ WIN_B2: status "DONE-ISH"/).length, 1);
  assert.equal(only(report, /retrofit\/DAY and NIGHT plates: classification "FINE"/).length, 1);
});
