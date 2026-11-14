// NOTHING IN PARENTHESES ON SCREEN (errata 308; doc 130).
//
// Tyler, 2026-11-14, told that Monkey Island printed nothing but what people say: "I don't like the parentheticals.
// Id prefer to find other ways to make all the parentheticals happen (dialogue, actions, movements, etc)".
//
// A direction is printed unless doc 95 makes it class A (acted, nothing printed). The pass goes room by room, a
// sample first: in the rooms it has done, nothing is printed, and across the game the count only ever goes down.

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const json = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const acted = new Set(json('content/acted-directions.json').directions.filter((row) => row.class === 'A').map((row) => row.words));

/** Every direction under a value, with the path it was found at. */
function directions(value, path, out) {
  if (Array.isArray(value)) value.forEach((one, index) => directions(one, `${path}[${index}]`, out));
  else if (value && typeof value === 'object') {
    if (value.direction === true) out.push({ path, words: value.line ?? value.say });
    for (const [key, one] of Object.entries(value)) directions(one, `${path}.${key}`, out);
  }
  return out;
}

const files = ['content/combinations.json', ...['dialogue', 'rooms', 'assay'].flatMap((dir) =>
  readdirSync(new URL(`../content/${dir}/`, import.meta.url)).filter((name) => name.endsWith('.json')).map((name) => `content/${dir}/${name}`))];
const printed = files.flatMap((file) => directions(json(file), file, [])).filter((one) => !acted.has(one.words));

// THE ROOMS DONE. Act I, from the swindle to the claim (the sample, doc 130 Part Three).
const DONE = [
  (one) => one.path.startsWith('content/dialogue/deke-vessel.json'),
  (one) => one.path.startsWith('content/dialogue/raccoon.json'),
  (one) => /content\/dialogue\/fanshawe\.json/.test(one.path) && /"FAN_A[12]"/.test(JSON.stringify(nodeAt(one.path))),
  (one) => /content\/dialogue\/pratt\.json/.test(one.path) && /"PRA_A1"/.test(JSON.stringify(nodeAt(one.path))),
  // Act I's dialogue pass (errata 310): the town's people met on the first day, whole.
  (one) => ['amb-barber', 'amb-boarding-women', 'amb-card-sharp', 'amb-dogs-owner', 'amb-fiddler', 'amb-message-boy',
    'amb-one-strike-man', 'amb-photographer', 'amb-pie-woman', 'amb-boundary-men', 'hotel-clerk', 'undertaker', 'stage-driver']
    .some((name) => one.path.startsWith(`content/dialogue/${name}.json`)),
  (one) => /content\/dialogue\/(hob|frame)\.json/.test(one.path) && /"(HOB|FRA)_A1"/.test(JSON.stringify(nodeAt(one.path))),
];
function nodeAt(path) {
  const [file, ...rest] = path.split(/\.(?=nodes)/);
  const id = /\.nodes\.([A-Za-z0-9_]+)/.exec(`.${rest.join('.')}`)?.[1];
  return id ? { id } : {};
}
const eggs = json('content/combinations.json').pairs.filter((pair) => pair.room === 'prosperity' && ['eggs', 'tonic'].includes(pair.item));

// The places a direction is printed across the game (one line can be printed in several), after the last room done.
// It may only go down; a pass lowers it.
const CAP = 117;

test('in the rooms done, nothing is printed in parentheses', () => {
  const left = printed.filter((one) => DONE.some((done) => done(one))).map((one) => `${one.path}: (${one.words})`);
  assert.deepEqual(left, [], 'printed');
  assert.deepEqual(directions(eggs, 'eggs', []).filter((one) => !acted.has(one.words)).map((one) => one.words), [], 'the eggs at the claim');
});

test('across the game, the printed directions only ever go down', () => {
  assert.ok(printed.length <= CAP, `${printed.length} directions are printed; the last pass left ${CAP}. A new one: ${printed.slice(-3).map((one) => one.words).join(' | ')}`);
});
