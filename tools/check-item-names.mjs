import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { allInteractables, loadContent, Report, ROOT, runCheck } from './lib/content.mjs';
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
/**
 * TYLER'S RULING, THE FONT: the existing bitmap face is retained. The play
 * area draws at GLYPH_SCALE 6 and the panel at PANEL_GLYPH_SCALE 4, and this
 * check must measure the ACTUAL runtime font in the ACTUAL UI region at the
 * ACTUAL 1920x1080 presentation. It previously did none of the three.
 *
 * WHAT IT USED TO DO, AND WHY IT WAS WRONG THREE WAYS. It compared an
 * UNSCALED glyph width against `320 - panel.sentence.x * 2`. The 320 was the
 * pre-errata-54 frame; `sentence.x` was 36, a value the x6 migration had
 * already moved into screen space; and the drawn width was never multiplied
 * by the scale the panel actually draws at. So it subtracted a 1920-space
 * inset from a 320-space width and compared the result to a 1x measurement.
 * Three errors, and they happened to point in opposite directions, which is
 * why nothing ever failed and nobody noticed.
 *
 * WHAT REPLACES IT IS NOT MERELY WIDER. Substituting 1920 for 320 would make
 * every conceivable label pass -- a vacuous assertion bought with a one-line
 * edit, which doc 51 named in as many words. So the measurement moved to what
 * the renderer DRAWS: `ui.sentence.itemTemplate` composed with the longest
 * verb label and the longest target name in the game, which is the longest
 * string the sentence line can ever be asked to hold. That is a tighter
 * assertion than the old one and it is measured in the real region.
 */

/** Glyph units, unscaled -- the same arithmetic `BitmapFont.measure` does. */
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

/**
 * The panel's glyph scale, and the frame's width.
 *
 * Duplicated from `engine/render/BitmapFont.ts` and `Screen.ts` rather than
 * imported because the validators are plain ESM and the engine is TypeScript.
 * `check-no-content-in-code` guards the direction that matters -- content out
 * of code -- and two integers travelling the other way are guarded by
 * `agreesWithEngine` below, which reads the .ts and fails if either drifts.
 */
const PANEL_GLYPH_SCALE = 4;
const FRAME_WIDTH = 1920;

/** Fails if the constants above stop matching the engine's. */
function agreesWithEngine(report) {
  const source = readFileSync(resolve(ROOT, 'engine/render/BitmapFont.ts'), 'utf8');
  const found = /export const PANEL_GLYPH_SCALE = (\d+);/.exec(source);
  if (!found) {
    report.fail('engine/render/BitmapFont.ts no longer declares PANEL_GLYPH_SCALE, so this '
      + 'check cannot know what the panel draws at');
    return false;
  }
  if (Number(found[1]) !== PANEL_GLYPH_SCALE) {
    report.fail(`the panel draws at ${found[1]}x and this check measures at `
      + `${PANEL_GLYPH_SCALE}x -- correct the constant here, not the engine`);
    return false;
  }
  const screen = readFileSync(resolve(ROOT, 'engine/render/Screen.ts'), 'utf8');
  const width = /export const NATIVE_WIDTH = (\d+);/.exec(screen);
  if (!width || Number(width[1]) !== FRAME_WIDTH) {
    report.fail(`the frame is ${width ? width[1] : 'undeclared'} wide and this check measures `
      + `against ${FRAME_WIDTH}`);
    return false;
  }
  return true;
}

/** The longest string the sentence line can be asked to draw for `label`. */
function worstSentence(content, label) {
  const ui = content.ui ?? {};
  const template = ui.sentence?.itemTemplate ?? '{verb} {item} on {target}';
  const verbs = [content.verbs?.walkVerb, ...(content.verbs?.verbs ?? [])]
    .filter(Boolean).map((verb) => verb.label);
  const longestVerb = verbs.sort((a, b) => measure(content.font, b) - measure(content.font, a))[0]
    ?? '';
  const targets = allInteractables(content)
    .map((entry) => entry.target?.name)
    .filter((name) => typeof name === 'string');
  const longestTarget = targets
    .sort((a, b) => measure(content.font, b) - measure(content.font, a))[0] ?? '';
  return {
    text: template
      .replace('{verb}', longestVerb)
      .replace('{item}', label)
      .replace('{target}', longestTarget),
    verb: longestVerb,
    target: longestTarget,
  };
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
  if (!agreesWithEngine(report)) return report;

  // THE REAL REGION. The sentence line is drawn by `Renderer.drawPanel` with
  // `this.panelFont` at `panel.sentence` -- x 36, y 872 -- which is inside the
  // 216-row verb panel, not in the play area. It is inset by the same amount
  // at the right, and nothing else occupies that row: the verb grid starts at
  // y 911 and the inventory arrows at x 1836 are below it. So the width it
  // holds is the frame's, less the inset twice, in SCREEN units.
  const room = FRAME_WIDTH - panel.sentence.x * 2;
  const drawn = new Map();
  let pending = 0;
  let worstWidth = 0;
  let worstOf = null;

  for (const { path, data } of items) {
    const label = data.short ?? data.name;
    // What the renderer actually draws, at the scale it actually draws it.
    const worst = worstSentence(content, label);
    const width = measure(content.font, worst.text) * PANEL_GLYPH_SCALE;
    if (width > worstWidth) { worstWidth = width; worstOf = { ...worst, id: data.id }; }
    if (width > room) {
      report.fail(`${data.id} (${path}): the sentence line would draw "${worst.text}" at `
        + `${width} units and it holds ${room}`
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

  report.note(`${items.length} item(s); the sentence line holds ${room} screen units at `
    + `PANEL_GLYPH_SCALE ${PANEL_GLYPH_SCALE}, about `
    + `${Math.floor(room / (content.font.advance * PANEL_GLYPH_SCALE))} glyphs`);
  if (worstOf) {
    report.note(`longest the line can ever draw: "${worstOf.text}" `
      + `(${worstWidth} of ${room} units, ${Math.round(100 * worstWidth / room)}%) -- `
      + `item ${worstOf.id} in the longest verb and the longest target name`);
  }
  if (pending > 0) {
    report.note(`${pending} item(s) awaiting LOOK and LISTEN lines -- doc 15 lists ~40 `
      + 'inventory item lines as unwritten and these are among them');
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
