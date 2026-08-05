/**
 * EVERY AMBIENT CHARACTER A ROOM ASKS FOR IS ONE THE MANIFEST LOADS.
 *
 * The dog was cut, given an idle, placed, declared by the room, and did not
 * appear -- because the manifest listed three ambient files and he was the
 * fourth. Nothing failed. The room asked for `dog`, the loader had never heard
 * of him, and the street was quietly one character short while everyone
 * believed it was four.
 *
 * This is the third time in one day that something existed, was correct, and
 * was never reached: a check absent from CHECKS, a sprite absent from the
 * room, a character absent from the manifest. The pattern is always the same
 * -- two lists that must agree, kept by hand.
 */
import { Report, loadContent, readJson } from './lib/content.mjs';

export function check() {
  const report = new Report('Every ambient character a room asks for is loaded');
  const content = loadContent();
  const manifest = readJson('content/manifest.json');

  const loaded = new Map();
  for (const path of manifest.ambient ?? []) {
    const npc = readJson(path);
    loaded.set(npc.id, path);
  }

  let asked = 0;
  for (const { data: room } of content.rooms) {
    for (const id of room.ambient ?? []) {
      asked += 1;
      if (!loaded.has(id)) {
        report.fail(`${room.id} declares ambient "${id}", which the manifest does not load. `
          + `It loads: ${[...loaded.keys()].join(', ')}`);
      }
    }
  }

  // And the other direction: a character nobody has placed is a character who
  // is loaded, drawn nowhere, and paid for in boot time.
  const placed = new Set(content.rooms.flatMap(({ data }) => data.ambient ?? []));
  for (const [id, path] of loaded) {
    if (!placed.has(id)) report.fail(`${path} loads "${id}", which no room declares`);
  }

  report.note(`${asked} ambient placement(s) across ${content.rooms.length} room(s), `
    + `${loaded.size} character file(s) in the manifest`);
  return report;
}
