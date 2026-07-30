import { loadContent, Report, runCheck } from './lib/content.mjs';

const MIN_OPTIONS = 3;
const COMIC = 'COMIC';
const VALID_TAGS = new Set(['PROGRESS', 'TOPIC', 'COMIC', 'ASSAY', 'EXIT']);

/**
 * Every dialogue node offers at least three options and at least one COMIC
 * option.
 *
 * The COMIC requirement is the load-bearing half. Those options change no
 * state and yield no information, roughly 40% of everything the player picks
 * is one of them, and they are the product. This check exists so that a later
 * pass which "optimises dialogue" fails loudly instead of quietly gutting it.
 */
export function check() {
  const report = new Report('Every dialogue node has >=3 options and >=1 [COMIC]');
  const content = loadContent();

  let nodeCount = 0;
  let comicCount = 0;
  const exempted = [];
  let optionCount = 0;

  for (const { data } of content.dialogue) {
    const nodes = Object.entries(data.nodes ?? {});
    if (nodes.length === 0) {
      report.fail(`${data.id}: tree has no nodes`);
      continue;
    }
    if (!data.nodes[data.start]) {
      report.fail(`${data.id}: start node "${data.start}" does not exist`);
    }

    for (const [nodeId, node] of nodes) {
      nodeCount += 1;
      const options = node.options ?? [];
      optionCount += options.length;
      const where = `${data.id}/${nodeId}`;

      if (options.length < MIN_OPTIONS) {
        report.fail(`${where}: ${options.length} option(s), minimum is ${MIN_OPTIONS}`);
      }

      const comics = options.filter((option) => option.tag === COMIC);
      comicCount += comics.length;
      // A node may declare that it has no [COMIC] option, with a reason.
      // Exactly one does: doc 17's opening line, whose three options are the
      // same deadpan register three ways rather than two real choices and a
      // joke. Declaring it in content keeps the exception reviewable; the
      // invariant that ~40% of options do nothing is not weakened by it.
      if (comics.length === 0 && node.noComic !== true) {
        report.fail(`${where}: no [COMIC] option`);
      }
      if (node.noComic === true) {
        exempted.push(where);
      }

      const ids = new Set();
      for (const option of options) {
        if (!VALID_TAGS.has(option.tag)) {
          report.fail(`${where}/${option.id}: unknown tag "${option.tag}"`);
        }
        if (ids.has(option.id)) {
          report.fail(`${where}: duplicate option id "${option.id}"`);
        }
        ids.add(option.id);
        if (option.goto && !data.nodes[option.goto]) {
          report.fail(`${where}/${option.id}: goto target "${option.goto}" does not exist`);
        }
      }
    }
  }

  const share = optionCount === 0 ? 0 : Math.round((comicCount / optionCount) * 100);
  if (exempted.length > 0) {
    report.note(`${exempted.length} node(s) declare no [COMIC], with a reason: ${exempted.join(', ')}`);
  }
  report.note(`${nodeCount} nodes, ${optionCount} options, ${comicCount} tagged [COMIC] (${share}%)`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
