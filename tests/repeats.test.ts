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
 * fails. [COMIC] options, and an option that ends the conversation, are exempt -- a running gag like "Course you will." is meant to come back unchanged.
 */
const PASSED = [
  // Errata 170, Main Street.
  'amb_letter_writer', 'amb_pie_woman', 'amb_map_seller', 'amb_message_boy', 'amb_man_leaving_tomorrow', 'amb_boundary_men',
  // Errata 172, Room 1.
  'STAGE_DRIVER',
  // Errata 172, the Nugget.
  'DEKE_VESSEL:root', 'amb_card_sharp', 'amb_one_strike_man', 'amb_fiddler',
  // Errata 172, the assay office and the Clarion. Frame's funeral notice (frame6) is Act III's, rewritten with it.
  'WINNIE:WIN_A1', 'WINNIE:WIN_A2', 'FRAME:FRA_A1!frame6',
];

test('every question in a passed tree has an answer for being asked again, and it is a different one', async () => {
  const content = await loadContent(fsReader);
  const faults: string[] = [];
  // `TREE:node` passes one node only: Vessel's Act I root is rewritten, his Act II node is not yet.
  for (const entry of PASSED) {
    const [named, skipped] = entry.split('!') as [string, string | undefined];
    const [id, only] = named.split(':') as [string, string | undefined];
    const skip = new Set((skipped ?? '').split(',').filter(Boolean));
    const tree = content.dialogue.get(id);
    if (!tree) { faults.push(`${id}: no such tree`); continue; }
    for (const [nodeId, node] of Object.entries(tree.nodes)) {
      if (only && nodeId !== only) continue;
      for (const option of node.options) {
        if (option.tag !== 'TOPIC' && option.tag !== 'PROGRESS') continue;
        // An option that ends the scene (Vessel's "All right.", the swindle), or that is gone once taken, is
        // never asked twice; one a later act's pass will write is named after `!`.
        if (option.ends || option.afterUse === 'remove' || skip.has(option.id)) continue;
        const first = option.say ?? option.exchange?.find((line) => line.speaker !== content.actor.id)?.line;
        const again = option.repeats?.[0]?.say ?? option.repeat;
        if (!again) faults.push(`${id}: "${option.text}" has no answer for being asked again`);
        else if (again === first) faults.push(`${id}: "${option.text}" answers again word for word`);
      }
    }
  }
  assert.deepEqual(faults, []);
});
