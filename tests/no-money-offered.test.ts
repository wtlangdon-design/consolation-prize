/**
 * NOBODY OFFERS MONEY HE HAS GIVEN AWAY (errata 322; doc 27, the hotel clerk).
 *
 * Tyler, 2026-11-14: "If thad buys the deed before getting a room, does that mean he no longer has money for a
 * room?" The room was never bought with money (A2 is the piano), but the clerk's option 3, "I have four. Could four
 * be persuaded?", was still offered and said after Deke had the four dollars (A3). It now says what he has, and the
 * way on (option 4, after option 3) is reached the same in both orders.
 *
 * Held here, in both orders: the menu, what Thad says, what the clerk answers, and that the piano is still offered.
 * And the engine half: a rephrased option speaks its own words, not the echo written for the old ones.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { echoOf } from '../engine/core/DialogueRunner.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const content = await loadContent(fsReader);
const TREE = 'HOTEL_CLERK';

function talk(swindled: boolean) {
  const state = new GameState(content, new MemoryStorage());
  if (swindled) {
    state.flags.set('T_SWINDLED', true);
    (state as unknown as { puzzles: Map<string, string> }).puzzles.set('A3', 'complete');
  }
  state.dialogue.start(TREE);
  return state;
}

const shown = (state: GameState, id: string) => state.dialogue.presentOptions().find((one) => one.option.id === id);

for (const swindled of [false, true]) {
  test(`${swindled ? 'after' : 'before'} the swindle, option 3 offers what he has, and option 4 follows it`, () => {
    const state = talk(swindled);
    state.dialogue.select('hotel_clerk2');
    const three = shown(state, 'hotel_clerk3');
    assert.ok(three, 'option 3 is offered after option 2');
    const money = swindled ? 'nothing' : 'four';
    assert.match(three.text, new RegExp(`^I have ${money}\\.$`), 'the menu');
    assert.match(echoOf(three), new RegExp(`Could ${money} be persuaded\\?$`), 'what he says');
    assert.equal(/four/i.test(echoOf(three)), !swindled, 'four dollars only while he has them');
    const reply = state.dialogue.select('hotel_clerk3');
    assert.match(JSON.stringify(reply), new RegExp(`you have ${swindled ? 'nothing' : 'four dollars'} and no room`), 'the clerk answers what was said');
    assert.ok(shown(state, 'hotel_clerk4'), 'and the piano is offered next, in either order');
  });
}

test('the clerk\'s tree as extracted: option 3 is said as it stands once A3 is complete, and still opens option 4', () => {
  const tree = content.dialogue.get(TREE)!;
  const options = Object.values(tree.nodes).flatMap((node) => node.options);
  const three = options.find((one) => one.id === 'hotel_clerk3')!;
  assert.equal(three.rephrase?.after, 'A3');
  assert.match(three.rephrase!.say, /nothing and no room/);
  const four = options.find((one) => one.id === 'hotel_clerk4')!;
  assert.deepEqual(four.after, ['hotel_clerk3'], 'the piano follows option 3 in either wording');
});

test('a rephrased option is said in its own words, not the echo written for the old ones', () => {
  const option = { id: 'x', text: 'I have four.', echo: 'I have four. Could four be persuaded?', rephrase: { after: 'A3', text: 'I have nothing.', echo: 'I have nothing. Could nothing be persuaded?', say: '' } } as never;
  assert.equal(echoOf({ option, text: 'I have nothing.' }), 'I have nothing. Could nothing be persuaded?');
  assert.equal(echoOf({ option, text: 'I have four.' }), 'I have four. Could four be persuaded?');
});
