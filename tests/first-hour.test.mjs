// THE TOWN EXPLAINED, AND THE FIRST ERRAND NAMED (errata 309; doc 131).
//
// Tyler, 2026-11-14: "I feel like we're missing an overarching understanding of what's happening. What is
// consolation. Why are people there." And of the first puzzle, the hotel piano, which nothing pointed at: "Point at
// the hotel early". Monkey Island's opening ends its exposition in errands; ours does too, and a newcomer is never
// asked to know what nobody has told him.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const json = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const street = json('content/rooms/main-street.json');
const options = (file) => Object.values(json(`content/dialogue/${file}.json`).nodes).flatMap((node) => node.options);
const spoken = (option) => [option.say ?? '', ...(option.exchange ?? []).map((line) => line.line)].join(' ');

test("Thad's first sight of the town names the hotel and the dollar he is short", () => {
  const said = street.onEnter.say.join(' ');
  assert.equal(street.onEnter.sayOnce, 'T_SEEN_MAIN_STREET', 'said once, on arrival');
  assert.match(said, /hotel/i);
  assert.match(said, /a dollar more than I have/i);
});

test('the map seller says who Mott is before any question of Thad\'s assumes it', () => {
  const seller = options('amb-map-seller');
  const first = seller.find((option) => !option.after && option.tag !== 'EXIT');
  assert.match(first.text, /who'?s mott/i, 'his first question is who Mott is');
  assert.match(spoken(first), /twelve years/i);
  for (const option of seller.filter((one) => !one.after && one !== first)) {
    assert.ok(!/mott/i.test(option.text ?? ''), `"${option.text}" assumes Mott and can be asked first`);
  }
});

test('each of the three says its piece on its own, without a name only another has explained', () => {
  const pie = spoken(options('amb-pie-woman').find((option) => /money to be made/i.test(option.text)));
  assert.match(pie, /Company/);
  assert.ok(!/Mott/.test(pie), 'the pie woman can be met first');
  const leaving = spoken(options('amb-man-leaving-tomorrow').find((option) => /arrived/i.test(option.text)));
  assert.match(leaving, /gold/i);
  assert.ok(!/Mott/.test(leaving), 'the man leaving tomorrow can be met first');
});
