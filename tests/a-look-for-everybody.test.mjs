/**
 * A LOOK FOR EVERYBODY (errata 344; Tyler, 2026-11-15: "Approve all").
 *
 * The Act I playtest found LOOK AT on nearly everyone answered with the one line written for a person nobody had
 * written for ("A person! I've decided to be polite about it."). Every named person in Act I's rooms now has a look
 * of their own: in their tree's examine layer, or in the room's `peopleResponses`. A ratchet: a person goes on the
 * list when written for, and may not fall back again. Proved against the defect: on main before errata 344 every
 * name here fails.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const json = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const all = (dir) => readdirSync(new URL(`../${dir}/`, import.meta.url)).filter((name) => name.endsWith('.json')).map((name) => json(`${dir}/${name}`));
const rooms = new Map(all('content/rooms').filter((room) => room.id).map((room) => [room.id, room]));
const trees = new Map(all('content/dialogue').filter((tree) => tree.id).map((tree) => [tree.id, tree]));
const people = new Map(all('content/ambient').map((one) => [one.id, one]));

const WRITTEN = ['pie_woman', 'map_seller', 'man_leaving_tomorrow', 'hob', 'dogs_owner', 'letter_writer', 'bell_ringer', 'message_boy', 'card_sharp',
  'fiddler', 'one_strike_man', 'nugget_bar1', 'nugget_bar2', 'nugget_bar3', 'fanshawe', 'lobby_clerk', 'frame', 'sump', 'winnie', 'livery_man', 'ozymandia',
  'pratt', 'boundary_a', 'boundary_b', 'storekeeper', 'nugget_barman', 'nugget_pianist',
  // Errata 354: Acts II to IV and the Lane.
  'sheng', 'sowerby', 'room_04_judge_1', 'room_04_judge_2', 'room_04_judge_3', 'frame_stood_back', 'pratt_registrar', 'winnie_at_board',
  'winnie_registrar', 'funeral_undertaker', 'prosperity_ozymandia', 'duel_fanshawe', 'duel_sowerby', 'duel_judge_1', 'duel_judge_2', 'duel_judge_3',
  'duel_town_left', 'duel_town_right', 'barber', 'photographer', 'boarding_a', 'boarding_b', 'grievance_out', 'washout_grievance'];

test('everybody written for answers LOOK AT in their own words, where they first stand', () => {
  const stock = new Set(json('content/ui/verb-fallbacks.json').people.LOOK_AT);
  for (const id of WRITTEN) {
    const person = people.get(id);
    assert.ok(person, `${id} is a person`);
    const own = [...(trees.get(person.tree)?.examine?.LOOK_AT ?? []), ...(rooms.get(person.room)?.peopleResponses?.[id]?.LOOK_AT ?? [])];
    assert.ok(own.length, `${id} (${person.name}) has a LOOK of their own in ${person.room}`);
    for (const rule of own) assert.ok(!stock.has(rule.say), `${id} does not say the stock line`);
  }
});

test('the men at the bar can be spoken to', () => {
  for (const id of ['nugget_bar1', 'nugget_bar2', 'nugget_bar3']) assert.ok(rooms.get('nugget').peopleResponses[id].TALK_TO?.length, `${id} answers TALK TO`);
});
