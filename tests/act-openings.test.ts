import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

/**
 * AN ACT THAT ENDS AT NIGHT IN SOMEBODY ELSE'S ROOM OPENS WITH A REASON (errata 175, doc 101; Tyler, 2026-11-07,
 * of Main Street: "I feel like he needs a little more direction"). Act II turned at a door after a dinner, put up its
 * card, and left Thad standing where the dinner was with nothing to want; the whole act is explained by the
 * registrar, and nothing sent him there. Act IV already opened with a line (errata 101 B). Each opening is
 * owed by a flag the act turn writes, and cleared when it has been said, so it is said once.
 */
interface Opening { room: string; say: string[]; due: string }
interface Flag { id: string; writtenBy?: string[] }

const cards = JSON.parse(readFileSync(new URL('../content/act-cards.json', import.meta.url), 'utf8')) as
  { cards: Record<string, string>; openings: Record<string, Opening> };
const flags = (JSON.parse(readFileSync(new URL('../content/flags/flags.json', import.meta.url), 'utf8')) as
  { flags: Flag[] }).flags;

test('the second act and the fourth open with a line, in a room, the morning after their turn', () => {
  for (const act of ['2', '4']) {
    const opening = cards.openings[act];
    assert.ok(opening, `act ${act} has no opening: the card goes down and he is left where the last act ended`);
    assert.ok(opening.say.length && opening.say.every((line) => line.trim().length > 0), `act ${act}'s opening says nothing`);
    assert.ok(cards.cards[act], `act ${act} opens but has no card`);
  }
});

test("every opening's flag is declared, written by its act turn, and cleared by the engine", () => {
  for (const [act, opening] of Object.entries(cards.openings)) {
    const flag = flags.find((f) => f.id === opening.due);
    assert.ok(flag, `act ${act}'s opening waits on ${opening.due}, which is not declared`);
    const writers = flag.writtenBy ?? [];
    assert.ok(writers.some((w) => !w.startsWith('engine:')), `nothing in the game ever owes act ${act}'s opening`);
    assert.ok(writers.some((w) => w.includes('openAct')), `act ${act}'s opening is never cleared, so it would be said again`);
  }
});

test('the place that turns the second act owes its opening when it sets the act', async () => {
  const { readdirSync } = await import('node:fs');
  const dir = new URL('../content/rooms/', import.meta.url);
  const turns: Record<string, unknown>[] = [];
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.json'))) {
    const room = JSON.parse(readFileSync(new URL(name, dir), 'utf8')) as
      { hotspots?: { transitScene?: { set?: Record<string, unknown> }[] }[]; exits?: { transitScene?: { set?: Record<string, unknown> }[] }[] };
    for (const spot of [...(room.hotspots ?? []), ...(room.exits ?? [])]) {
      for (const beat of spot.transitScene ?? []) if (beat.set?.ACT === 2) turns.push(beat.set);
    }
  }
  assert.equal(turns.length, 1, `the second act turns in ${turns.length} places`);
  assert.equal(turns[0][cards.openings['2'].due], true, 'the act turns without owing its opening');
});
