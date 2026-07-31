import { loadContent, Report, runCheck } from './lib/content.mjs';

/**
 * Errata ruling 26 point 2: every inventory row must fit the panel, and no
 * two rows may draw the same thing.
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
 * "fits" means fits rather than "is under some character count".
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
  const report = new Report('Inventory names fit the panel and stay distinct (ruling 26)');
  const content = loadContent();
  const items = content.items ?? [];

  if (items.length === 0) {
    report.note('no items declared yet');
    return report;
  }

  const panel = content.panel;
  // Two pixels of padding at the left of a row, and the same at the right so
  // a name never touches the scroll arrows.
  const room = panel.inventory.width - 4;
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

  report.note(`${items.length} item(s); the panel row holds ${room}px, `
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
