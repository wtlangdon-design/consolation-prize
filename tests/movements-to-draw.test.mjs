// The running list of movements still to draw (errata 287).
//
// Tyler, 2026-11-11: "make a running list of new character movements that
// need to be created to bring the new dialogue to life". Doc 95 sorts every
// shown stage direction; class B is physical and waits on a pose. The list
// is reference/acted-directions-3/brief.md, which the image session draws
// from. A B row the list does not carry would never be drawn, and a row the
// list carries that is no longer B would be drawn twice. The counts line at
// the head of doc 95's table drifted silently once (it read B 0 with five B
// rows under it), so it is held to the table too.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const doc95 = readFileSync('docs/95-acted-directions.md', 'utf8');
const list = readFileSync('reference/acted-directions-3/brief.md', 'utf8');

const rows = [...doc95.matchAll(/^\| (\d+) \| ([ABC]) \| ([^|]*) \|/gm)]
  .map(m => ({ n: Number(m[1]), cls: m[2], who: m[3].trim() }));

test('doc 95 has a table to read', () => {
  assert.ok(rows.length > 50, `read ${rows.length} rows`); // a parse check: the table shrinks as directions are spoken (doc 130)
});

test('every class B row is on the running list, under its figure', () => {
  const listed = new Set([...list.matchAll(/\*\*Row (\d+)\*\*/g)].map(m => Number(m[1])));
  for (const r of rows.filter(r => r.cls === 'B')) {
    assert.ok(listed.has(r.n), `doc 95 row ${r.n} (${r.who}) is B and is not on reference/acted-directions-3/brief.md`);
    const section = list.split(/^### /m).find(s => s.includes(`**Row ${r.n}**`));
    assert.ok(section.startsWith('`' + r.who + '`'), `row ${r.n} is listed under the wrong figure (wants ${r.who})`);
  }
});

test('every row on the running list is still class B', () => {
  const byN = new Map(rows.map(r => [r.n, r]));
  for (const m of list.matchAll(/\*\*Row (\d+)\*\*/g)) {
    const r = byN.get(Number(m[1]));
    assert.ok(r, `the list names row ${m[1]}, which doc 95 does not have`);
    assert.equal(r.cls, 'B', `row ${r.n} is ${r.cls} in doc 95: drawn and wired rows come off the list`);
  }
});

test("doc 95's counts line agrees with its table", () => {
  const m = doc95.match(/Counts: \*\*A (\d+) · B (\d+) · C (\d+)\*\* — (\d+) directions/);
  assert.ok(m, 'doc 95 has no counts line');
  const count = c => rows.filter(r => r.cls === c).length;
  assert.deepEqual(
    { A: Number(m[1]), B: Number(m[2]), C: Number(m[3]), all: Number(m[4]) },
    { A: count('A'), B: count('B'), C: count('C'), all: rows.length },
  );
});
