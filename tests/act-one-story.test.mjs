/**
 * THE ACT ONE REVIEW, STORY FIXES (errata 339). Two things the review found that a script can hold:
 *
 * 1. A question that names the Liar's Assay was offered before anything in the game had named it. Each now waits
 *    until Thad has read the Nugget's handbill, or been called to Duel One, or lost it (the last is what keeps the
 *    questions open for good: the duel clears T_DUEL_ONE_CALLED).
 * 2. Main Street's doors refused a player who had talked to all three townspeople, because only one question each
 *    counted, and the refusal never said who was left. Any question to the pie woman or the man with the bag counts,
 *    and each refusal waits on one person and names them.
 *
 * Proved against the defect: with assayOnceKnown() removed from tools/extract-content.mjs the first test fails on
 * frame7; with `everyQuestionSets` removed from tools/town-barks.json the third fails on pie_woman2.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const json = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const trees = readdirSync(new URL('../content/dialogue/', import.meta.url)).filter((name) => name.endsWith('.json')).map((name) => json(`content/dialogue/${name}`));
const options = trees.flatMap((tree) => Object.values(tree.nodes ?? {}).flatMap((node) => (node.options ?? []).map((option) => ({ tree: tree.id, option }))));
const OPENERS = ['T_ASSAY_KNOWN', 'T_DUEL_ONE_CALLED', 'T_DUEL_ONE_LOST'];

test('no question names the Assay before Thad has heard of it', () => {
  const naming = options.filter(({ option }) => option.tag === 'ASSAY' && /\bAssay\b/.test(option.text ?? ''));
  assert.ok(naming.length >= 5, 'the Assay questions are read');
  for (const { tree, option } of naming) {
    const opened = (option.whenAny ?? []).flatMap((one) => Object.keys(one));
    // A question with a later gate of its own (Pratt's practice, offered from the pairs Thad already holds) is past this.
    if (opened.length && !opened.includes('T_ASSAY_KNOWN')) continue;
    assert.deepEqual(opened.sort(), [...OPENERS].sort(), `${tree}/${option.id} "${option.text}" waits for the handbill or the duel`);
  }
});

test('the handbill is what tells him, and losing Duel One is never undone', () => {
  const nugget = JSON.stringify(json('content/rooms/nugget.json'));
  assert.match(nugget, /"set":\{"T_ASSAY_KNOWN":true\}/, 'reading the handbill sets it');
  const everything = readdirSync(new URL('../content/', import.meta.url), { recursive: true }).filter((name) => String(name).endsWith('.json') && !String(name).includes('save-migrations'))
    .map((name) => readFileSync(new URL(`../content/${name}`, import.meta.url), 'utf8')).join('\n');
  assert.doesNotMatch(everything, /"T_DUEL_ONE_LOST":\s*false/, 'nothing clears T_DUEL_ONE_LOST, so the questions never close again');
});

test('any question to the pie woman or the man with the bag opens their share of the doors', () => {
  for (const [file, flag] of [['amb-pie-woman', 'T_TOLD_MONEY'], ['amb-man-leaving-tomorrow', 'T_TOLD_WHY']]) {
    const tree = json(`content/dialogue/${file}.json`);
    const asked = tree.nodes[tree.start].options.filter((option) => option.tag !== 'COMIC' && option.tag !== 'EXIT');
    assert.ok(asked.length >= 3);
    for (const option of asked) assert.equal(option.set?.[flag], true, `${file}/${option.id} counts`);
    for (const option of tree.nodes[tree.start].options.filter((one) => one.tag === 'COMIC')) assert.equal(option.set, undefined, `${file}/${option.id} is [COMIC] and changes nothing`);
  }
});

test('each refusal at a Main Street door waits on one person, and there is one for each', () => {
  const room = json('content/rooms/main-street.json');
  const refusals = [];
  const walk = (value) => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (!value || typeof value !== 'object') return;
    if (value.stays && typeof value.say === 'string' && value.say.startsWith('Not yet.')) refusals.push(value);
    Object.values(value).forEach(walk);
  };
  walk(room);
  const waits = (one) => ['T_MOTT_TOLD', 'T_TOLD_MONEY', 'T_TOLD_WHY'].filter((flag) => one.when?.[flag] === false);
  assert.ok(refusals.length >= 3);
  for (const one of refusals) assert.equal(waits(one).length, 1, `"${one.say}" waits on one person`);
  assert.equal(new Set(refusals.map((one) => waits(one)[0])).size, 3, 'all three are named somewhere');
});

/**
 * ERRATA 340: the turn, the dinner and the raccoon.
 * Proved against the defect: on the branch before these changes the first test fails on the map wall ("One is Claim
 * One."), the second on livery_man5 (it waited only for T_SEEN_PROSPERITY), the third on fanshawe6.
 */
const room = (file) => json(`content/rooms/${file}.json`);
const hotspot = (file, id) => room(file).hotspots.find((one) => one.id === id);
const answering = (rules, flags) => rules.find((rule) => Object.entries(rule.when ?? {}).every(([flag, want]) => (typeof want === 'object' ? true : (flags[flag] ?? false) === want)));

test('nothing tells him Prosperity lies beside Claim One before Sump reads it out', () => {
  const before = { T_BORDERS_MOTT: false };
  const wall = answering(hotspot('fanshawe-office', 'map_wall').responses.LOOK_AT, before);
  assert.doesNotMatch([wall.say, ...(wall.repeat ?? []), ...(wall.then ?? [])].join(' '), /Claim One|mine/i, 'the map wall keeps it back');
  const ledger = answering(hotspot('claims-registrar', 'ledger').responses.LOOK_AT, before);
  assert.doesNotMatch([ledger.say, ...(ledger.repeat ?? [])].join(' '), /Claim One/, 'the ledger keeps it back');
  assert.equal(hotspot('ozymandias-tent', 'claim_one').when?.T_BORDERS_MOTT, true, 'the survey map\'s Claim One waits for the filing');
  // And after it, the lines written for them are all there.
  const after = { T_BORDERS_MOTT: true };
  assert.match(JSON.stringify(answering(hotspot('fanshawe-office', 'map_wall').responses.LOOK_AT, after)), /Claim One/);
  assert.match(JSON.stringify(answering(hotspot('claims-registrar', 'ledger').responses.LOOK_AT, after)), /Claim One/);
});

test('the blanket is asked for after a failed try at the raccoon, and never because he listened to the hole', () => {
  const blanket = options.find(({ option }) => /borrow a blanket/.test(option.text ?? '')).option;
  assert.equal(blanket.when?.T_RACCOON_TRIED, true);
  const raccoon = hotspot('prosperity', 'raccoon');
  for (const verb of ['PICK_UP', 'PUSH', 'USE']) assert.equal(raccoon.responses[verb].at(-1).set?.T_RACCOON_TRIED, true, `${verb} on the raccoon is a try`);
  const tries = json('content/combinations.json').pairs.filter((pair) => pair.room === 'prosperity' && pair.target === 'hole' && ['eggs', 'tonic'].includes(pair.item))
    .flatMap((pair) => pair.rules.filter((rule) => rule.takes));
  assert.ok(tries.length >= 3);
  for (const rule of tries) assert.equal(rule.set?.T_RACCOON_TRIED, true, `"${rule.say}" is a try`);
  // Invariant 3 and doc 54 A5: the hole's LISTEN is one of the three lines nothing may mark. It writes nothing.
  for (const rule of hotspot('prosperity', 'hole').responses.LISTEN_TO) assert.equal(rule.set, undefined, `"${rule.say}" sets nothing`);
});

test('the dinner: the line that refuses the Colonel is said at the dish, and only there', () => {
  const dinner = trees.find((tree) => tree.nodes?.FAN_A2).nodes.FAN_A2;
  for (const option of dinner.options) assert.doesNotMatch(option.text, /work it myself/, `${option.id} does not say it`);
  assert.match(dinner.opening.map((one) => one.line).join(' '), /Claim One for a neighbor/, 'the Colonel says what he is after');
  const closing = hotspot('fanshawe-office', 'contract').responses.CLOSE.find((rule) => /work it myself/.test(rule.say ?? ''));
  assert.ok(closing, 'putting the cover back says it');
});
