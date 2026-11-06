/**
 * EVERY BARK THE TOWN WAS WRITTEN IS IN THE GAME (doc 07 Part Two; errata 109).
 *
 * One townsperson's file said doc 07 wrote him no barks while doc 07 wrote him
 * nine, and nothing noticed: an empty `barks` is a legal file. So every doc 07
 * section whose bark table is a single voice speaking must be read by the
 * extractor into some ambient file, which says so in its `barksNote`, and that
 * file's barks must be exactly what the extractor reads today.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const doc = readFileSync(resolve(ROOT, 'docs/07-ambient-layer.md'), 'utf8');

/** Headings of the doc 07 sections whose bark rows are one voice saying words. */
function singleVoiceSections(): string[] {
  const out: string[] = [];
  for (const section of doc.split('\n## ').slice(1)) {
    const heading = section.slice(0, section.indexOf('\n'));
    const at = section.indexOf('**Barks**');
    if (at < 0) continue;
    const rows = section.slice(at).split('\n').filter((row) => /^\| `R_[A-Z_]+` \|/.test(row));
    const twoVoices = rows.some((row) => /\*\*[AB]:\*\*/.test(row));
    const words = rows.filter((row) => /"[^"]*[A-Za-z][^"]*"/.test(row.replace(/\*\([^)]*\)\*/g, '')));
    if (rows.length && !twoVoices && words.length === rows.length) out.push(heading);
  }
  return out;
}

const ambients = readdirSync(resolve(ROOT, 'content/ambient')).map((file) =>
  JSON.parse(readFileSync(resolve(ROOT, 'content/ambient', file), 'utf8')) as { barks?: Record<string, string>; barksNote?: string });

const routing = JSON.parse(readFileSync(resolve(ROOT, 'tools/town-barks.json'), 'utf8')) as
  { extract: Record<string, string>; notPlaced: Record<string, string> };

test('every single-voice bark table in doc 07 is extracted into an ambient file, or recorded as not placed', () => {
  const sections = singleVoiceSections();
  assert.ok(sections.length >= 6, `found only ${sections.length} single-voice tables: the parse is broken`);
  const unrouted = sections.filter((heading) => !(heading in routing.extract) && !(heading in routing.notPlaced));
  assert.deepEqual(unrouted, [], 'doc 07 writes these barks and tools/town-barks.json routes them nowhere');
  const unread = Object.keys(routing.extract).filter((heading) =>
    !ambients.some((npc) => npc.barksNote?.includes(`(## ${heading})`) && Object.keys(npc.barks ?? {}).length > 0));
  assert.deepEqual(unread, [], 'routed to an ambient file that does not carry them: run node tools/extract-content.mjs');
  for (const heading of Object.keys(routing.notPlaced)) {
    assert.ok(sections.includes(heading), `"${heading}" is recorded as not placed but is no single-voice table in doc 07`);
  }
});

test('no ambient file claims doc 07 writes it nothing when doc 07 has its section', () => {
  for (const npc of ambients) {
    if (!/Doc 07 writes no barks/i.test(npc.barksNote ?? '')) continue;
    assert.equal(Object.keys(npc.barks ?? {}).length, 0, `${npc.barksNote}: but it has barks`);
  }
});

test('a bark said by two people names two people who stand in the same room (errata 110)', () => {
  const all = readdirSync(resolve(ROOT, 'content/ambient')).map((file) =>
    JSON.parse(readFileSync(resolve(ROOT, 'content/ambient', file), 'utf8')) as
      { id: string; room?: string; barkExchange?: Record<string, { speaker: string; line: string }[]> });
  const byId = new Map(all.map((npc) => [npc.id, npc]));
  const pairs = all.filter((npc) => npc.barkExchange);
  assert.ok(pairs.length > 0, 'no ambient carries a two-voice bark');
  for (const npc of pairs) {
    for (const [state, lines] of Object.entries(npc.barkExchange!)) {
      assert.ok(lines.length > 0, `${npc.id} ${state}: an empty exchange`);
      for (const { speaker } of lines) {
        const who = byId.get(speaker);
        assert.ok(who, `${npc.id} ${state}: no ambient "${speaker}"`);
        assert.equal(who.room, npc.room, `${npc.id} ${state}: ${speaker} stands in another room`);
      }
    }
  }
});

test('a figure waiting on its art is cast in no room (errata 110)', () => {
  const waiting = readdirSync(resolve(ROOT, 'content/ambient'))
    .map((file) => JSON.parse(readFileSync(resolve(ROOT, 'content/ambient', file), 'utf8')) as { id: string; awaitingArt?: string })
    .filter((npc) => npc.awaitingArt).map((npc) => npc.id);
  for (const file of readdirSync(resolve(ROOT, 'content/rooms'))) {
    const room = JSON.parse(readFileSync(resolve(ROOT, 'content/rooms', file), 'utf8')) as { id: string; ambient?: string[] };
    const cast = (room.ambient ?? []).filter((id) => waiting.includes(id));
    assert.deepEqual(cast, [], `${room.id} casts figures with no picture yet`);
  }
});
