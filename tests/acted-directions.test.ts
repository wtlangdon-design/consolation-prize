import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { actOf, framesOf, heldThrough, performedLine, shownText } from '../engine/core/ActedDirections.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import type { AmbientFile, ContentBundle } from '../engine/core/types.ts';

/**
 * ACTED DIRECTIONS (doc 95; errata 141). Tyler, 2026-11-06, told that "a few
 * directions are still printed rather than acted, such as '(stamping)' during
 * the filing": "then let's do it? Lol". A physical direction a figure can act
 * is acted and not printed; narration stays printed; doc 95 decides which.
 *
 * What this holds, each proved by putting its defect back:
 * - every direction in the content is in doc 95's table, and every row is in the content;
 * - every acted (A) direction has a figure, in the room it is said in, that acts it, and nothing is printed;
 * - no waiting (B) or narration (C) direction is acted by anyone, and no figure acts words doc 95 did not give him.
 */

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const printed = (words: string) => `(${words})`;

interface Found { speaker: string; words: string; rooms: Set<string> | null; where: string }

/** Every direction the content shows, with the rooms it can be said in (null where no room is fixed). */
function directionsIn(content: ContentBundle): Found[] {
  const treeRooms = new Map<string, Set<string>>();
  const addRoom = (tree: string, room: string) => {
    if (!treeRooms.has(tree)) treeRooms.set(tree, new Set());
    treeRooms.get(tree)!.add(room);
  };
  for (const npc of content.ambient.values()) if (npc.tree) addRoom(npc.tree, npc.room);
  for (const room of content.rooms.values()) {
    const walk = (node: unknown): void => {
      if (Array.isArray(node)) { node.forEach(walk); return; }
      if (node && typeof node === 'object') {
        const dialogue = (node as { dialogue?: unknown }).dialogue;
        if (typeof dialogue === 'string') addRoom(dialogue, room.id);
        Object.values(node).forEach(walk);
      }
    };
    walk(room);
  }
  const out: Found[] = [];
  const collect = (node: unknown, rooms: Set<string> | null, where: string, owner: string): void => {
    if (Array.isArray(node)) { node.forEach((one) => collect(one, rooms, where, owner)); return; }
    if (!node || typeof node !== 'object') return;
    const record = node as Record<string, unknown>;
    if (record.direction === true) {
      const words = String(record.line ?? record.say).trim();
      const speaker = String(record.speaker ?? record.by ?? owner);
      out.push({ speaker, words, rooms, where });
    }
    for (const value of Object.values(record)) collect(value, rooms, where, owner);
  };
  for (const tree of content.dialogue.values()) {
    collect(tree.nodes, treeRooms.get(tree.id) ?? null, `dialogue ${tree.id}`, content.actor.id);
  }
  for (const pair of content.combinations.pairs) {
    collect(pair, new Set([pair.room]), `combination ${pair.item} on ${pair.target}`, content.actor.id);
  }
  for (const room of content.rooms.values()) collect(room, new Set([room.id]), `room ${room.id}`, content.actor.id);
  if (content.assay) collect(content.assay, null, 'the assay', content.actor.id);
  return out;
}

async function load() {
  const content = await loadContent(fsReader);
  const table = content.actedDirections;
  assert.ok(table, 'content/manifest.json names doc 95\'s acted directions');
  return { content, table, found: directionsIn(content), figures: [...content.ambient.values()] };
}

test('every direction the game shows is in doc 95, and every row of doc 95 is in the game', async () => {
  const { table, found } = await load();
  const key = (speaker: string, words: string) => `${speaker}::${words}`;
  const rows = new Map(table.directions.map((row) => [key(row.speaker, row.words), row]));
  for (const one of found) {
    assert.ok(rows.has(key(one.speaker, one.words)),
      `${one.where}: "${one.words}" (${one.speaker}) is not in doc 95's table, so nobody has decided whether it is acted`);
  }
  const shown = new Set(found.map((one) => key(one.speaker, one.words)));
  for (const row of table.directions) {
    assert.ok(shown.has(key(row.speaker, row.words)), `doc 95 row ${row.n}: "${row.words}" is not in the content`);
  }
  assert.equal(table.directions.length, found.length, 'one row for each direction');
});

test('every acted direction is acted by a figure in its room, and prints nothing', async () => {
  const { content, table, found } = await load();
  const acted = table.directions.filter((row) => row.class === 'A');
  assert.ok(acted.length > 0, 'doc 95 acts something');
  for (const row of acted) {
    const figures = (row.performedBy ?? []).map((id) => content.ambient.get(id));
    assert.ok(figures.length && figures.every(Boolean), `doc 95 row ${row.n}: "${row.words}" names no figure that exists`);
    const at = found.find((one) => one.speaker === row.speaker && one.words === row.words)!;
    for (const npc of figures as AmbientFile[]) {
      if (at.rooms) {
        assert.ok(at.rooms.has(npc.room),
          `doc 95 row ${row.n}: "${row.words}" is said in ${[...at.rooms].join(', ')}, and ${npc.id} stands in ${npc.room}`);
      }
      const act = npc.sprite?.performs?.[row.words];
      assert.ok(act, `${npc.id} does not perform "${row.words}"`);
      for (const frame of framesOf(act!)) assert.ok(frame < npc.sprite!.frames.length, `${npc.id} has no frame ${frame}`);
    }
    // In the room, as the scene performs it: beats, each held, none printed.
    const room = (figures[0] as AmbientFile).room;
    const present = [...content.ambient.values()].filter((npc) => npc.room === room);
    const lines = heldThrough(present, performedLine(present, { speaker: row.speaker, line: row.words, direction: true }, printed));
    assert.ok(lines.length >= 1);
    for (const line of lines) {
      assert.equal(shownText(line), '', `doc 95 row ${row.n}: "${row.words}" is acted and still printed`);
      assert.ok(line.silent && (line.rest ?? 0) > 0, 'an acted beat is held and cannot be clicked through');
      assert.ok(line.poses?.length, 'and someone holds a frame in it');
    }
    const total = lines.reduce((sum, line) => sum + (line.rest ?? 0), 0);
    assert.ok(Math.abs(total - (row.seconds ?? 0)) < 1e-9, `doc 95 row ${row.n} lasts its seconds`);
    if (row.cue) {
      assert.equal(lines[row.cue.frame - 1]?.cue, row.cue.id, `doc 95 row ${row.n}: the cue sounds on frame ${row.cue.frame}`);
      assert.ok(content.sounds?.cues[row.cue.id], `${row.cue.id} is a cue with a sound`);
    }
  }
});

test('no narration and no waiting direction is acted, and no figure acts what doc 95 did not give him', async () => {
  const { table, figures } = await load();
  for (const row of table.directions.filter((one) => one.class !== 'A')) {
    assert.equal(actOf(figures, row.words), null, `doc 95 row ${row.n} is class ${row.class}, and a figure acts "${row.words}"`);
    const lines = performedLine(figures, { speaker: row.speaker, line: row.words, direction: true }, printed);
    assert.deepEqual(lines.map(shownText), [printed(row.words)], `doc 95 row ${row.n} stays printed, as doc 58 prints it`);
  }
  const given = new Set(table.directions.filter((row) => row.class === 'A')
    .flatMap((row) => (row.performedBy ?? []).map((id) => `${id}::${row.words}`)));
  for (const npc of figures) {
    for (const words of Object.keys(npc.sprite?.performs ?? {})) {
      assert.ok(given.has(`${npc.id}::${words}`), `${npc.id} performs "${words}", which doc 95 does not give him`);
    }
  }
  // Invariant 7: HOB_C1 option 4 is presented exactly as the options around it.
  const hob = table.directions.find((row) => row.where.includes('HOB_C1 option 4'));
  assert.equal(hob?.class, 'C', 'HOB_C1 option 4\'s look is left printed, unmarked');
});

test('a frame held through speech is the speaker\'s own, and lasts until his next act (doc 95 Holds)', async () => {
  const { content, table, figures } = await load();
  const holding = table.directions.filter((row) => row.class === 'A' && row.holds !== undefined);
  for (const row of holding) {
    const performer = figures.find((npc) => npc.id === row.performedBy![0])!;
    const present = figures.filter((npc) => npc.room === performer.room);
    const lines = heldThrough(present, [
      ...performedLine(present, { speaker: row.speaker, line: row.words, direction: true }, printed),
      { speaker: row.speaker, line: 'a line said after it' },
      { speaker: content.actor.id, line: 'and his answer' },
    ]);
    const after = lines[lines.length - 2]!;
    assert.equal(shownText(after), 'a line said after it', 'the line is still printed');
    assert.deepEqual(after.poses, [{ id: performer.id, frame: row.holds }], `${performer.id} says it on frame ${row.holds}`);
    assert.equal(lines[lines.length - 1]!.poses, undefined, 'and nobody else is held');
  }
});
