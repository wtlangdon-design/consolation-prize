/**
 * THE NEXT THING IS SAID (errata 352; the Acts II to IV review). The reviewers found moments where the player had done
 * what was asked and nothing said what came next, and right tries refused without a reason. What a script can hold:
 *
 * 1. The blank filing ends on what Thad now wants, and names the man he wants it from.
 * 2. The clause the act turns on is read out, not only concluded from.
 * 3. A question asked of the laundry's ledger is answered in words.
 * 4. The watch is seen coming back.
 * 5. Each stalled state of Act III's last door says what is missing; the assayer says why she will not hear it yet.
 * 6. Act IV's window is Act IV's: it says what the filing needs, and the book it cites can be read.
 * 7. A beaten man is not at his desk with last act's conversation.
 *
 * Proved against the defect: each assertion below failed on main before errata 352.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const json = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const tree = (name) => json(`content/dialogue/${name}.json`);
const option = (name, node, id) => tree(name).nodes[node].options.find((one) => one.id === id);
const hotspot = (name, id) => json(`content/rooms/${name}.json`).hotspots.find((one) => one.id === id);
const lines = (exchange) => exchange.map((one) => one.line).join(' ');

test('the blank filing ends on a want, and the clause is read out', () => {
  const viewing = option('sump', 'SUM_B1', 'sump1c').exchange;
  const last = viewing.at(-1);
  assert.equal(last.speaker, 'thad', 'the scene ends on him, not on the clerk');
  assert.match(last.line, /Colonel/);
  assert.match(lines(option('fanshawe', 'FAN_C1', 'fanshawe1').exchange), /shall not excavate/);
});

test('the ledger is read aloud, and the watch is handed back', () => {
  const reading = option('sheng', 'SHE_D1', 'sheng1a').exchange;
  assert.ok(reading.length >= 4, 'he reads, as he says he will');
  assert.match(lines(reading), /Pratt/);
  assert.match(lines(json('content/assay/assay.json').duels.duel_two.win), /runs fast/);
});

test('each stalled state of the archive door says what is missing', () => {
  const rules = hotspot('claims-registrar', 'sealed_archive_door').responses.OPEN;
  const states = [{ T_DECEASED: true, T_EXECUTOR_NAMED: false }, { T_EXECUTOR_NAMED: true, T_OBITUARY: false, T_FUNERAL_DONE: false },
    { T_EXECUTOR_NAMED: true, T_OBITUARY: true, T_FUNERAL_DONE: false }];
  for (const state of states) assert.ok(rules.some((rule) => JSON.stringify(rule.when) === JSON.stringify(state)), JSON.stringify(state));
  const early = option('winnie', 'WIN_B4', 'winnie5');
  assert.deepEqual(early.when, { T_NEED_TO_DIE: true, T_FUNERAL_BOOKED: false });
  const board = hotspot('undertaker', 'price_board').responses.LOOK_AT.map((rule) => rule.say).join(' ');
  assert.doesNotMatch(board, /lender/, 'the loan is gone (errata 237), and so is the clue that pointed at it');
});

test('in Act IV the window is Act IV\'s', () => {
  const { entries, nodes } = tree('sump');
  const order = entries.map((one) => one.node);
  assert.ok(order.indexOf('SUM_F0') > order.indexOf('SUM_F1') && order.indexOf('SUM_F0') < order.indexOf('SUM_E1'));
  assert.deepEqual(entries.find((one) => one.node === 'SUM_F0').when, { T_STRIKE_FOUND: true, T_FILED: false });
  assert.equal(nodes.SUM_F0.openingOnce, 'T_SUM_F0_HEARD');
  assert.ok(nodes.SUM_F0.options.some((one) => one.tag === 'COMIC'));
  const book = hotspot('claims-registrar', 'statute_book').responses.OPEN.find((rule) => rule.when?.T_STRIKE_FOUND);
  assert.match(book.say, /sub-section four/);
  assert.equal(json('content/ambient/fanshawe.json').when.T_FANSHAWE_BEATEN, false);
});
