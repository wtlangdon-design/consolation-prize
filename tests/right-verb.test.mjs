/**
 * THE RIGHT VERB, AT THE RIGHT TIME (errata 351; the Acts II to IV review). What a script can hold of it:
 *
 * 1. The trials wait for the man who sets them: the livery man's tune and the assayer's Act II list open once the
 *    registrar has named the documents, and the last step of Trial Three once the ninety days have been heard.
 * 2. A funeral can be asked for by a player working Trial Three alone.
 * 3. The right thing held out to the right person opens that person's business: no stock refusal.
 * 4. The plate answers as the line of mourners does; the animal halfway out is taken by PICK UP as by USE.
 * 5. A scene said once is said once.
 * 6. In a dialogue, an italic quotation is the other speaker's.
 * 7. A line the documents write in two halves is built with both.
 *
 * Proved against the defect: each assertion below failed on main before errata 351.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const json = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const tree = (name) => json(`content/dialogue/${name}.json`);
const option = (name, node, id) => tree(name).nodes[node].options.find((one) => one.id === id);
const room = (name) => json(`content/rooms/${name}.json`);
const hotspot = (name, id) => room(name).hotspots.find((one) => one.id === id);

test('the trials wait for the documents to be named', () => {
  assert.equal(option('livery-man', 'LIV_A1', 'livery_man6').when?.T_SUMP_DOCUMENTS_HEARD, true);
  assert.equal(tree('winnie').entries.find((one) => one.node === 'WIN_B1').when.T_SUMP_DOCUMENTS_HEARD, true);
  assert.equal(option('pratt', 'PRA_D6', 'pratt5').when?.T_NINETY_DAYS, true);
});

test('Trial Three can book its own funeral', () => {
  const ask = option('sowerby', 'SOW_A1', 'sowerby5');
  assert.deepEqual(ask.whenAny, [{ T_FANSHAWE_FUNERALS: true }, { T_SHENG_TASK: true }]);
  assert.equal(ask.when.T_FANSHAWE_FUNERALS, undefined);
});

test('a hand-over opens the business it is for', () => {
  const { pairs, alsoAt } = json('content/combinations.json');
  const opens = (item, target) => pairs.find((one) => one.item === item && one.target === target && one.opens)?.opensNode;
  for (const letter of ['a', 'b', 'd']) assert.equal(opens(`document_${letter}`, 'sump'), 'SUM_B1');
  assert.equal(opens('linen_money', 'sheng'), 'SHE_D1');
  assert.equal(opens('filing_fee', 'ozymandia'), 'OZY_A1');
  assert.equal(opens('sample', 'winnie'), 'WIN_F1');
  const stands = (at) => alsoAt.find((one) => one.room === 'claims_registrar' && one.at === at && one.as === 'counter')?.items ?? [];
  for (const item of ['death_certificate', 'document_c', 'sample']) assert.ok(stands('sump').includes(item), `${item} handed to the registrar is laid on his counter`);
  assert.ok(stands('winnie_registrar').includes('sample'));
});

test('the plate answers as the line does, and PICK UP takes what USE takes', () => {
  const plate = hotspot('boot-hill', 'collection_plate').responses;
  const line = hotspot('boot-hill', 'town_coming_down').responses.USE;
  const taking = line.find((one) => one.set?.T_HOLDS_PLATE);
  assert.ok(taking, 'the line has the case that takes the plate');
  for (const verb of ['USE', 'PICK_UP']) assert.ok(plate[verb].some((one) => one.say === taking.say && one.set?.T_HOLDS_PLATE), `${verb} on the plate takes it`);
  const animal = hotspot('prosperity', 'raccoon').responses;
  const caught = animal.USE.find((one) => one.set?.T_RACCOON_IN_COAT);
  assert.ok(animal.PICK_UP.some((one) => one.say === caught.say && one.set?.T_RACCOON_IN_COAT));
  assert.equal(room('listening-chamber').listening.tapItem, 'tuning_fork');
});

test('three scenes are said once, and giving up waits for an argument', () => {
  assert.equal(tree('winnie').nodes.WIN_C1.openingOnce, 'T_WIN_C1_HEARD');
  assert.equal(tree('frame').nodes.FRA_E1.openingOnce, 'T_FRA_E1_HEARD');
  assert.equal(tree('hob').nodes.HOB_E6.openingOnce, 'T_HOB_E6_HEARD');
  assert.deepEqual(option('winnie', 'WIN_C1', 'winnie4').afterAny, ['winnie1', 'winnie2', 'winnie3']);
});

test('an italic quotation in a reply is the other speaker\'s', () => {
  const stopped = option('winnie', 'WIN_B1', 'winnie3').exchange.find((one) => /stopped writing/.test(one.line));
  assert.equal(stopped.speaker, 'thad');
  const back = option('sump', 'SUM_B1', 'sump1c').exchange.find((one) => /on the back/.test(one.line));
  assert.equal(back.speaker, 'thad');
});

test('the dawn says the dog was found only if he was', () => {
  for (const id of ['posted_notices', 'dog']) {
    const rules = hotspot('main-street-dawn', id).responses.LOOK_AT;
    assert.equal(rules.length, 2, `${id} has both halves`);
    assert.equal(rules[0].when.T_BILL_FOUND, true);
    assert.notDeepEqual(rules[0].repeat, rules[1].repeat);
  }
  const ledger = json('content/items/company-ledger.json').responses.OPEN;
  assert.equal(ledger[0].when.T_LEDGER_CRACKED, false, 'the unbroken ledger answers OPEN with its own trouble');
});
