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
