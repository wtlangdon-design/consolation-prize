// A DIRECTION SHOWS WHAT IS SEEN; IT NEVER EXPLAINS HOW SOMEONE FEELS (errata 293).
//
// Tyler, 2026-11-11, playing Main Street: "I also don't like the (he lights up)
// sort of stage direction. I think most of the characters demeanors should come
// out in their dialogue and movements vs parenthetical explanations." A printed
// direction may say what someone does ("He grips it with both hands."). It may not
// say what they feel, mean or are like ("lights up like a lamp", "warmly", "He says
// it the way other men say 'measles'"): that is the line's job, or the pose's.
//
// Main Street was done first. PENDING lists the files still to do, each with what
// it still prints; the list only shrinks. A file on it that no longer prints one
// fails too, so the list cannot go stale.

import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';

const ROOT = new URL('../content/', import.meta.url);

// Words that explain a manner, a feeling or a meaning rather than show an action.
const EXPLAINS = /\b(warmly|warmth|genuine(?:ly)?|delight|puzzled|wounded|savou?rs?|toneless|hopefully|lights up|prices him|as if|as though|the way other|says it|means it|respectful|painful|beaming|brightens|dislikes|does not consider|exactly who|both men note|most dangerous)\b/i;

const PENDING = {
  // Row 168 of reference/acted-directions-3: the pose is to be drawn, and once acted it prints nothing (doc 95 rule 1).
  'dialogue/amb-bell-ringer.json': 1,
  'dialogue/fanshawe.json': 6,
  'dialogue/frame.json': 1,
  'dialogue/gulch-man-upstream.json': 1,
  'dialogue/ozymandia.json': 1,
  'dialogue/pratt-jump.json': 1,
  'dialogue/pratt.json': 5,
  'dialogue/sowerby.json': 3,
  'dialogue/sump.json': 1,
  'rooms/grog-tent.json': 1,
};

function files(dir, prefix = '') {
  const out = [];
  for (const name of readdirSync(new URL(dir, ROOT))) {
    const path = `${prefix}${name}`;
    if (statSync(new URL(`${dir}${name}`, ROOT)).isDirectory()) out.push(...files(`${dir}${name}/`, `${path}/`));
    else if (name.endsWith('.json')) out.push(path);
  }
  return out;
}

function explaining(value, found = []) {
  if (Array.isArray(value)) for (const each of value) explaining(each, found);
  else if (value && typeof value === 'object') {
    if (value.direction === true && typeof value.line === 'string' && EXPLAINS.test(value.line)) found.push(value.line);
    for (const each of Object.values(value)) explaining(each, found);
  }
  return found;
}

test('no printed direction explains a manner, outside the files still to do', () => {
  const now = {};
  for (const path of files('')) {
    const lines = [...new Set(explaining(JSON.parse(readFileSync(new URL(path, ROOT), 'utf8'))))];
    if (lines.length > 0) now[path] = lines;
  }
  for (const [path, lines] of Object.entries(now)) {
    assert.ok(path in PENDING, `${path} prints a direction that explains rather than shows: ${lines.map((line) => `"${line}"`).join(', ')}`);
    assert.ok(lines.length <= PENDING[path], `${path} prints more than it did: ${lines.join(' | ')}`);
  }
  for (const path of Object.keys(PENDING)) {
    assert.ok(path in now, `${path} is done: take it off PENDING in tests/directions-show.test.mjs`);
  }
});

test("Main Street's people show it in what they say", () => {
  for (const tree of ['amb-pie-woman', 'amb-map-seller', 'amb-man-leaving-tomorrow']) {
    const data = JSON.parse(readFileSync(new URL(`dialogue/${tree}.json`, ROOT), 'utf8'));
    assert.deepEqual(explaining(data), [], tree);
    assert.equal(data.nodes.root.opening, undefined, `${tree} opens on its greeting, not a description of its speaker`);
  }
});
