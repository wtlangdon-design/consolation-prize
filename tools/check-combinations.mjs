import { loadContent, Report, runCheck } from './lib/content.mjs';

/**
 * Doc 24's combination table, and its rule 4 in particular.
 *
 * RULE 4: no authored pair may exist without a written line. A combination
 * that should do something and has none is REPORTED as unwritten -- it never
 * quietly falls through to a pool, because a pool line standing in for a
 * missing pair is a gap that reads as finished content. That is the same
 * silent failure the item-name uniqueness check exists to prevent, one layer
 * up: the build passes, the game runs, and a player meets a shrug where a
 * puzzle was meant to be.
 *
 * Also checked, because each is invisible in the JSON:
 *
 *   a pair naming an item that does not exist;
 *   two pairs for the same item and target, where only the first can fire;
 *   an item pool of one, which cannot rotate and so repeats -- reported, not
 *   failed, because doc 24 writes one such pool on purpose;
 *   a pair whose target is not wired, which is REPORTED rather than failed,
 *   because two of Act I's five are in rooms nobody has built.
 */
export function check() {
  const report = new Report('Item combinations resolve, and every pair has a line (doc 24)');
  const content = loadContent();
  const table = content.combinations;

  if (!table) {
    report.fail('no combination table -- doc 06 specifies one and doc 24 writes it');
    return report;
  }

  const items = new Set((content.items ?? []).map(({ data }) => data.id));
  const trees = new Map((content.dialogue ?? []).map(({ data }) => [data.id, data]));
  const targets = new Map();
  for (const { data } of content.rooms) {
    targets.set(data.id, new Set([
      ...(data.hotspots ?? []).map((target) => target.id),
      ...(data.exits ?? []).map((target) => target.id),
      // AN AMBIENT CHARACTER IS A TARGET TOO: an item shown to a person
      // (errata 66 A). The room lists who is in it.
      ...(data.ambient ?? []),
    ]));
  }

  const seen = new Set();
  const pending = [];
  const single = [];
  let doing = 0;

  for (const pair of table.pairs) {
    const where = `${pair.item} on ${pair.room}/${pair.target}`;

    // Rule 4, and it is the reason this check exists.
    if (typeof pair.say !== 'string' || pair.say.trim() === '') {
      // A PAIR THAT OPENS A TREE has its line: the tree's authored opening,
      // performed by the action (errata 66 C). It must name the tree, the
      // puzzle it completes, and the tree must open on that puzzle.
      const tree = pair.opens ? trees.get(pair.opens) : null;
      const entry = tree?.entries?.find((one) => one.puzzle === pair.completes);
      if (!pair.opens || !pair.completes) {
        report.fail(`${where}: authored pair with no written line -- doc 24 rule 4. `
          + 'It must be written or removed, not left to fall through to a pool');
      } else if (!tree) report.fail(`${where}: opens "${pair.opens}", which is not a tree`);
      else if (!entry) report.fail(`${where}: opens ${pair.opens} on completing ${pair.completes}, but the tree has no entry gated on that puzzle`);
      else if (!tree.nodes?.[entry.node]?.opening?.length) report.fail(`${where}: ${pair.opens}/${entry.node} has no authored opening to stand as the pair's line`);
    }
    if (!items.has(pair.item)) {
      report.fail(`${where}: no such item`);
    }
    const key = `${pair.item}|${pair.room}|${pair.target}`;
    if (seen.has(key)) {
      report.fail(`${where}: declared twice -- only the first would ever fire`);
    }
    seen.add(key);
    if (pair.puzzle) doing += 1;

    const room = targets.get(pair.room);
    if (!room || !room.has(pair.target)) {
      pending.push(`${where}${pair.targetPending ? ` -- ${pair.targetPending}` : ''}`);
      // Not a failure. A pair whose line is written and whose target is not
      // built yet is the correct state for a game with 39 rooms outstanding;
      // what would be wrong is the reverse.
      if (!pair.targetPending) {
        report.fail(`${where}: target is not wired and the pair does not say why`);
      }
    }
  }

  for (const [item, pool] of Object.entries(table.itemPools)) {
    if (!items.has(item)) {
      report.fail(`item pool for "${item}": no such item`);
    }
    if (pool.length < 2) single.push(item);
  }
  if ((table.globalPool ?? []).length < 2) {
    report.fail('the global combination pool cannot rotate');
  }

  const pools = Object.values(table.itemPools).reduce((sum, pool) => sum + pool.length, 0);
  report.note(`${table.pairs.length} authored pair(s), ${doing} of them serving a puzzle`);
  report.note(`${Object.keys(table.itemPools).length} item pool(s), ${pools} lines, `
    + `${table.globalPool.length} global`);
  for (const line of pending) {
    report.note(`  written, target not built yet: ${line}`);
  }
  // NOT a failure. Doc 24 writes the letter exactly one line, and "I am not
  // opening it for this" is a complete refusal that does not want a variant.
  // A pool of one cannot rotate, so it repeats -- reported so the choice is
  // visible, because the same shape in a high-traffic pool would be a gap.
  if (single.length > 0) {
    report.note(`pool(s) of one line, which repeat rather than rotate: ${single.join(', ')}`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
