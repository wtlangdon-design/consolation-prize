import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

/**
 * THE TOWN KEEPS ITS DATES (errata 176, doc 101 part two). The strike is twelve years old and the assayer has
 * kept her window for nine (doc 01): her second ledger's nineteen entries run from 1849 to this spring. The
 * records room said "Nineteen names, twelve years" in one LOOK and "Nine years of assays" in the next, and spread
 * the nineteen's dates "across twelve years". Its stool "announces him", in a room that is hers.
 *
 * The rooms that are hers, read here, may not give her a twelve-year tenure, and may not call her "him".
 */
const HER_ROOMS = ['assay-office', 'assay-records'];

function lines(room: string): string[] {
  const data = JSON.parse(readFileSync(new URL(`../content/rooms/${room}.json`, import.meta.url), 'utf8')) as
    { hotspots: { responses?: unknown }[] };
  const out: string[] = [];
  const walk = (value: unknown): void => {
    if (typeof value === 'string') out.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  for (const spot of data.hotspots) walk(spot.responses);
  return out;
}

test("the assayer's rooms count her nine years, not the strike's twelve", () => {
  for (const room of HER_ROOMS) {
    for (const line of lines(room)) {
      assert.doesNotMatch(line, /\btwelve years\b/i, `${room}: "${line}" gives her office the strike's age`);
    }
  }
});

test("the assayer's stool, cot and tea are hers", () => {
  for (const room of HER_ROOMS) {
    for (const line of lines(room)) {
      // A man may be named in her rooms (the nineteen, the Company); her own furniture may not announce one.
      assert.doesNotMatch(line, /\bannounces him\b|\bwaiting for him\b/i, `${room}: "${line}" makes the assayer a man`);
    }
  }
});

/**
 * THE HERO HAS BEEN IN TOWN DAYS, NOT MONTHS (errata 177). Doc 02 D gives nine days when the ninety-day
 * rule stops him in Act II, which is why Pratt's ninety days is "a flat lie". The funeral's mourners line said
 * "I have been in Consolation eleven weeks" -- seventy-seven days, which would have made the lie nearly true.
 * Doc 91 had already taken "eleven weeks" out of three lines; this was the fourth.
 */
test('no shipped room puts the hero in town for weeks on end', async () => {
  const { readdirSync } = await import('node:fs');
  const dir = new URL('../content/rooms/', import.meta.url);
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.json') && !n.includes('candidate'))) {
    const text = readFileSync(new URL(name, dir), 'utf8');
    // His own time here, said by him: "I have been … eleven weeks". A catalogue's "six to ten weeks" is not his.
    const found = text.match(/"[^"]*\b(?:I have been|I've been|Eleven weeks, and I)\b[^"]*\b(?:eight|nine|ten|eleven|twelve)? ?weeks\b[^"]*"/i);
    assert.equal(found, null, `${name}: ${found?.[0]} -- he has been in town about nine days by Act II (doc 02 D)`);
  }
});
