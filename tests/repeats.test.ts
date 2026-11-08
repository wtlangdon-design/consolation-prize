import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

/**
 * ASKED AGAIN, NOBODY SAYS THE SAME THING WORD FOR WORD (doc 04 rule 4; Tyler, 2026-11-07, of the message boy and
 * the pie woman: "both ignore him by saying their same phrase multiple times"). The game-wide audit found almost
 * every character replaying his first answer exactly. Each room's pass adds its trees here as it writes their
 * repeats, so the list only grows: a tree on it whose question has no repeat, or one that repeats the first answer,
 * fails. [COMIC] options are exempt -- a running gag like "Course you will." is meant to come back unchanged.
 */
const PASSED = [
  // Errata 170, Main Street.
  'amb_letter_writer', 'amb_pie_woman', 'amb_map_seller', 'amb_message_boy', 'amb_man_leaving_tomorrow', 'amb_boundary_men',
];

test('every question in a passed tree has an answer for being asked again, and it is a different one', async () => {
  const content = await loadContent(fsReader);
  const faults: string[] = [];
  for (const id of PASSED) {
    const tree = content.dialogue.get(id);
    if (!tree) { faults.push(`${id}: no such tree`); continue; }
    for (const node of Object.values(tree.nodes)) {
      for (const option of node.options) {
        if (option.tag !== 'TOPIC' && option.tag !== 'PROGRESS') continue;
        const first = option.say ?? option.exchange?.find((line) => line.speaker !== content.actor.id)?.line;
        const again = option.repeats?.[0]?.say ?? option.repeat;
        if (!again) faults.push(`${id}: "${option.text}" has no answer for being asked again`);
        else if (again === first) faults.push(`${id}: "${option.text}" answers again word for word`);
      }
    }
  }
  assert.deepEqual(faults, []);
});
