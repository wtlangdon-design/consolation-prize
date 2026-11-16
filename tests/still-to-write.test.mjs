/**
 * WHAT WAS STILL TO WRITE (errata 354; Tyler, 2026-11-16: "Complete the \"still to write\" items."). What a script can
 * hold of it:
 *
 * 1. Every room the player can reach answers LISTEN with one bare "Nothing." at most (errata 343's rule, now game-wide).
 *    Three silences are designed and named here with the document that designs them.
 * 2. The way to the Gulch is said by the man who keeps the mule.
 * 3. The Colonel's Act II visit asks for what Act II is about, and its card is read; he hears of the death once.
 * 4. The assayer, having signed, does not refuse again.
 *
 * Proved against the defect: each assertion below failed on main before errata 354 (the first with twenty-five rooms).
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const json = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const tree = (name) => json(`content/dialogue/${name}.json`);

// Doc 05 Room 21: "Six hotspots, five of which LISTEN as 'Nothing.' ... the truest room in Consolation is the one that
// makes no sound." Doc 05 Room 14, THE NINETEEN: "Each LISTEN gives: 'Nothing.'" Doc 08 Room 27, the markers: "All
// eleven. The same word, eleven times." The candidate Nugget is not reachable (no exit leads to it).
const DESIGNED = { watchmans_shack: null, boot_hill: 'nineteen', claim_row: 'claim_marker_the_blank_one', nugget_candidate: null };

test('a room keeps one bare "Nothing." at most, outside the silences the documents design', () => {
  const over = [];
  for (const name of readdirSync(new URL('../content/rooms/', import.meta.url))) {
    const room = json(`content/rooms/${name}`);
    if (!room.id || !room.hotspots) continue;
    if (room.id in DESIGNED && DESIGNED[room.id] === null) continue;
    let bare = 0;
    for (const target of [...room.hotspots, ...(room.exits ?? [])]) {
      if (DESIGNED[room.id] === target.id) continue;
      for (const rule of target.responses?.LISTEN_TO ?? []) for (const line of [rule.say, ...(rule.repeat ?? [])]) if (line === 'Nothing.') bare += 1;
    }
    if (bare > 1) over.push(`${room.id}: ${bare}`);
  }
  assert.deepEqual(over, []);
});

test('the livery man says what goes to the Gulch', () => {
  const ask = tree('livery-man').nodes.LIV_A1.options.find((one) => /Gulch/.test(one.text));
  assert.deepEqual(ask?.when, { T_VESSEL_LOCATION: true, T_GULCH_TRIP: false });
});

test('the Colonel is asked for the filing, shows the card, and hears of the death once', () => {
  const { nodes, entries } = tree('fanshawe');
  assert.doesNotMatch(nodes.FAN_B1.options[0].text, /boundary/);
  assert.doesNotMatch(nodes.FAN_B2.opening.map((one) => one.line).join(' '), /card/);
  assert.ok(nodes.FAN_B2.options[0].exchange.some((one) => one.speaker === 'thad'), 'the card is read');
  const order = entries.map((one) => one.node);
  assert.ok(order.indexOf('FAN_E1') < order.indexOf('FAN_B1'));
  assert.equal(nodes.FAN_E1.openingOnce, 'T_FAN_E1_HEARD');
  const chairs = json('content/cutaways.json');
  const cut = (chairs.cutaways ?? chairs).find((one) => one.id === 'fanshawe_chairs');
  assert.equal(cut.when.T_DECEASED, false, 'the chairs are not counted over a dead man');
});

test('the assayer, having signed, does not refuse again', () => {
  const { entries, nodes } = tree('winnie');
  const order = entries.map((one) => one.node);
  assert.ok(order.indexOf('WIN_C2') < order.indexOf('WIN_C1'));
  assert.deepEqual(entries.find((one) => one.node === 'WIN_C2').when, { T_DEATH_CERTIFIED: true });
  assert.ok(nodes.WIN_C2.options.some((one) => one.tag === 'COMIC'));
});
