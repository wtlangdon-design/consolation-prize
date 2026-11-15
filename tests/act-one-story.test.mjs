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
