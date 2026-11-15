// NO CLOCK IN THE DIALOGUE UNLESS THE STORY NEEDS IT (errata 332).
//
// Tyler, 2026-11-15: "Thad talks about '4 minutes' of the song being out of tune. I think we need to stop naming
// days/amounts of times/etc in the dialogue because a player stops to think 'Have I actually been playing for only 4
// mins'. Unless the day/time/etc is incredibly important for the story, we need all of that to be way more vague."
//
// Held here: no spoken line in the game names a count of minutes, hours, days or weeks, an hour of the clock, or a
// weekday as a day that has passed, unless it is listed below with the reason the story needs it. A new line that
// does fails, and says which.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import test from 'node:test';

const NUM = "(?:two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|ninety|hundred|\\d+)(?:[- ](?:one|two|three|four|five|six|seven|eight|nine))?";
export const CLOCK = new RegExp([
  `\\b${NUM}[- ](?:minute|hour|day|week|fortnight)s?\\b(?!['’]s? (?:walk|ride))`,
  "\\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\\s+o['’]clock\\b",
  "\\b(?:on|since|last|this past) (?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\\b",
].join('|'), 'i');

/** Where the story needs the number. Each is a piece of the line, and why. */
export const NEEDED = {
  'eleven minutes': "the watch runs eleven minutes fast: Thad's father's watch is a plot object (A3, B6, E9)",
  'Eleven minutes': "the watch runs eleven minutes fast (A3, B6, E9)",
  'nineteen minutes': 'the two clocks that disagree: a joke about clocks, not about how long he has played',
  'Nineteen minutes': 'the two clocks, again',
  'four minutes': "the coffin (E7, E8): the player is sealed in for that long, and Hob counts it (errata 52, 71)",
  'Four minutes, he said': 'the coffin (E7): Hob said how long, and the player is living it',
  'ten minutes a day': "the boilermen's break at the chair: a fact of their day, not of his",
  'The ten minutes': "the boilermen's break, again",
  'thirty days': 'the statute F5 turns on: a claim worked by its holder within thirty days, so Mott must come forward',
  'ninety days': 'the ninety-day rule is D1-D6: the number is the puzzle',
  'Six weeks': "the lost dog's story: how long he has been lost is the joke of where he was",
  'six weeks': "the lost dog's story, again",
  'six to ten weeks': 'a catalogue promise: delivery times are the joke',
  'four days': 'Grievance hired twelve years ago: backstory, how long Mott was gone (B2)',
  'Three weeks': 'the queue shortened: a joke on the eight months, not on his time',
  'Ninety days': 'the ninety-day rule (D1-D6), as Sump states it',
  'Six days of quiet': "the church's week before Sunday: a description of the building, not of his time",
};

const ROOT = new URL('../content/', import.meta.url);
const SKIP = /\/(checks|fixtures|puzzles|flags|build-contracts|staging)\/|candidate|manifest\.json$|speech-colours\.json$/;
const NOT_SPOKEN = new Set(['id', 'note', 'why', 'when', 'set', 'add', 'sheet', 'path', 'case', 'name', 'doc', 'source', 'see', 'tree', 'room', 'kind', 'clip', 'cue', 'reason']);

function* strings(value, key = '') {
  if (typeof value === 'string') { yield value; return; }
  if (Array.isArray(value)) { for (const one of value) yield* strings(one, key); return; }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (NOT_SPOKEN.has(k) || /Note$|note$|Why$|^_/.test(k)) continue;
      yield* strings(v, k);
    }
  }
}

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const url = new URL(name, dir);
    if (statSync(url).isDirectory()) return files(new URL(`${name}/`, dir));
    return name.endsWith('.json') && !SKIP.test(url.pathname) ? [url] : [];
  });
}

export function clocks(lines) {
  const found = [];
  for (const line of lines) {
    if (line.split(' ').length < 3) continue;
    const match = CLOCK.exec(line);
    if (!match) continue;
    if (Object.keys(NEEDED).some((piece) => line.includes(piece))) continue;
    found.push(`"${match[0]}" in: ${line.slice(0, 120)}`);
  }
  return [...new Set(found)];
}

test('no spoken line names a clock the story does not need', () => {
  const lines = files(ROOT).flatMap((url) => [...strings(JSON.parse(readFileSync(url, 'utf8')))]);
  assert.ok(lines.length > 5000, 'the game\'s lines were found');
  const found = clocks(lines);
  assert.deepEqual(found, [], 'say it vaguely ("a few minutes", "days", "the other night"), or list it in NEEDED with the reason');
});

test('the check catches the line Tyler stopped on', () => {
  assert.equal(clocks(['Four minutes. C-sharp has come home, and nobody in this room has looked up.']).length, 1);
  assert.equal(clocks(['They drank to my memory on Tuesday.']).length, 1);
  assert.equal(clocks(['It will be in print by four o\'clock.']).length, 1);
  assert.equal(clocks(['C-sharp has come home, and nobody in this room has looked up.']).length, 0);
});
