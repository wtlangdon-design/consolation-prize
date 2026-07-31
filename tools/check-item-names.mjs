import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { loadContent, Report, ROOT, runCheck } from './lib/content.mjs';
import { readPng, region } from './lib/png.mjs';

/**
 * Errata 26 point 2 and errata 29 condition 2: no two items may be
 * indistinguishable in the panel. The medium changed and the rule did not.
 *
 * THE SECOND HALF IS THE POINT. Form 12-C, Form 12-C (Amended) and Form 12-C
 * (Amended, Void) are three separate items and the joke in Act II is that
 * they are tellable apart. A computed truncation at the panel width renders
 * the second and third identically and deletes a running gag silently -- the
 * build would pass, the game would run, and a player would simply never
 * notice a joke that was written. So there is no truncation rule: an item
 * whose name does not fit carries a short name somebody wrote, and this
 * check is what stops two of them colliding.
 *
 * Width is measured through the same font JSON the engine draws with, so
 * "fits" means fits rather than "is under some character count". The names
 * still matter under ruling 29 because they are what the sentence line draws
 * on hover and on selection -- an icon is never the only identification.
 *
 * AND NOW THE ICONS. Ruling 29 keeps the uniqueness half and moves it: two
 * items rendering the same icon is the same silent failure as two drawing the
 * same row. The check reads the ACTUAL PNG rather than a hash the generator
 * wrote, because a generated hash only proves the generator agrees with
 * itself. Fully transparent pixels are ignored -- what is compared is what is
 * drawn.
 */
function measure(font, text) {
  const per = font.advances ?? {};
  let width = 0;
  for (const character of text) {
    if (character === ' ') {
      width += font.spaceAdvance ?? font.advance;
      continue;
    }
    width += per[character] ?? font.advance;
  }
  return width;
}

export function check() {
  const report = new Report('Inventory items are distinguishable, by name and by icon (26, 29)');
  const content = loadContent();
  const items = content.items ?? [];

  if (items.length === 0) {
    report.note('no items declared yet');
    return report;
  }

  const panel = content.panel;
  // Two pixels of padding at the left of a row, and the same at the right so
  // a name never touches the scroll arrows.
  // Ruling 29 moved the names out of the panel and into the sentence line,
  // so the width they must fit is the sentence's, not a grid cell's.
  const room = 320 - panel.sentence.x * 2;
  const drawn = new Map();
  let pending = 0;

  for (const { path, data } of items) {
    const label = data.short ?? data.name;
    const width = measure(content.font, label);
    if (width > room) {
      report.fail(`${data.id} (${path}): "${label}" is ${width}px and the panel holds ${room}px`
        + (data.short ? '' : ' -- give it a short name'));
    }
    if (drawn.has(label)) {
      report.fail(`${data.id} and ${drawn.get(label)} both draw as "${label}" -- `
        + 'two items the player cannot tell apart');
    }
    drawn.set(label, data.id);

    if (data.linesPending) pending += 1;
    else if (!data.responses?.LOOK_AT || !data.responses?.LISTEN_TO) {
      report.fail(`${data.id}: no LOOK or LISTEN, and not marked linesPending`);
    }
  }

  // Errata 29 condition 2.
  const table = content.itemIcons;
  if (table) {
    let sheet;
    try {
      sheet = readPng(readFileSync(resolve(ROOT, table.sheet)));
    } catch (error) {
      report.fail(`cannot read the icon sheet ${table.sheet}: ${error.message}`);
    }
    if (sheet) {
      const drawnIcons = new Map();
      for (const { data } of items) {
        if (data.fixture) continue;
        const cell = table.icons[data.id];
        if (!cell) {
          report.fail(`${data.id}: no icon -- errata 29 restores item art to scope`);
          continue;
        }
        const shape = region(sheet, cell);
        if (/^[.|]*$/.test(shape)) {
          report.fail(`${data.id}: its icon cell is empty`);
          continue;
        }
        if (drawnIcons.has(shape)) {
          report.fail(`${data.id} and ${drawnIcons.get(shape)} render the SAME ICON -- `
            + 'errata 29 condition 2. Two items a player cannot tell apart is a running gag '
            + 'dying silently: the build passes and the panel looks right');
          continue;
        }
        drawnIcons.set(shape, data.id);
      }
      report.note(`${drawnIcons.size} distinct icon(s) at ${table.cell[0]}x${table.cell[1]}`);
    }
  }

  report.note(`${items.length} item(s); the sentence line holds ${room}px, `
    + `about ${Math.floor(room / content.font.advance)} glyphs`);
  if (pending > 0) {
    report.note(`${pending} item(s) awaiting LOOK and LISTEN lines -- doc 15 lists ~40 `
      + 'inventory item lines as unwritten and these are among them');
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
