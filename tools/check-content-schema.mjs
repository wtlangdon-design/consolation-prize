import { allDialogueOptions, allInteractables, loadContent, Report, runCheck } from './lib/content.mjs';

const PLAY_WIDTH = 320;
const PLAY_HEIGHT = 144;
const EXPECTED_VERB_COUNT = 9;

/**
 * Structural validation of everything the manifest points at. A broken
 * reference should fail a validation pass rather than shipping silently and
 * surfacing as a blank room three acts later.
 */
export function check() {
  const report = new Report('Content structure and cross-references resolve');
  const content = loadContent();

  const roomIds = new Set(content.rooms.map(({ data }) => data.id));
  const dialogueIds = new Set(content.dialogue.map(({ data }) => data.id));
  const verbIds = new Set(content.verbs.verbs.map((verb) => verb.id));
  verbIds.add(content.verbs.walkVerb.id);

  // --- verbs -------------------------------------------------------------
  if (content.verbs.verbs.length !== EXPECTED_VERB_COUNT) {
    report.fail(`${content.verbs.verbs.length} verbs defined, the interface specifies ${EXPECTED_VERB_COUNT}`);
  }
  if (!verbIds.has(content.verbs.defaultVerb)) {
    report.fail(`defaultVerb "${content.verbs.defaultVerb}" is not a defined verb`);
  }
  const slots = new Set();
  for (const verb of content.verbs.verbs) {
    const slot = `${verb.col},${verb.row}`;
    if (slots.has(slot)) report.fail(`two verbs share panel slot ${slot}`);
    slots.add(slot);
    if (verb.col >= content.verbs.grid.cols || verb.row >= content.verbs.grid.rows) {
      report.fail(`verb "${verb.id}" sits outside the ${content.verbs.grid.cols}x${content.verbs.grid.rows} grid`);
    }
  }

  // --- rooms -------------------------------------------------------------
  if (!roomIds.has(content.manifest.startRoom)) {
    report.fail(`startRoom "${content.manifest.startRoom}" is not a defined room`);
  }

  const seenRoomIds = new Set();
  for (const { path, data } of content.rooms) {
    if (seenRoomIds.has(data.id)) report.fail(`${path}: duplicate room id "${data.id}"`);
    seenRoomIds.add(data.id);

    const localIds = new Set();
    for (const target of [...(data.hotspots ?? []), ...(data.exits ?? [])]) {
      if (localIds.has(target.id)) {
        report.fail(`${data.id}: duplicate target id "${target.id}"`);
      }
      localIds.add(target.id);
    }
  }

  // --- targets -----------------------------------------------------------
  for (const { roomId, kind, target } of allInteractables(content)) {
    const where = `${roomId}/${target.id}`;
    const [x, y, w, h] = target.rect ?? [];
    if ([x, y, w, h].some((value) => typeof value !== 'number')) {
      report.fail(`${where}: rect must be four numbers`);
    } else if (x < 0 || y < 0 || x + w > PLAY_WIDTH || y + h > PLAY_HEIGHT) {
      report.fail(`${where}: rect leaves the ${PLAY_WIDTH}x${PLAY_HEIGHT} play area`);
    }

    if (kind === 'exit' && !roomIds.has(target.to)) {
      report.fail(`${where}: exit leads to unknown room "${target.to}"`);
    }

    for (const [verb, rules] of Object.entries(target.responses ?? {})) {
      if (!verbIds.has(verb)) {
        report.fail(`${where}: response for unknown verb "${verb}"`);
      }
      if (!Array.isArray(rules)) {
        report.fail(`${where}/${verb}: responses must be an array of rules`);
        continue;
      }
      rules.forEach((rule, index) => {
        if (rule.dialogue && !dialogueIds.has(rule.dialogue)) {
          report.fail(`${where}/${verb}[${index}]: unknown dialogue tree "${rule.dialogue}"`);
        }
        if (rule.goto && !roomIds.has(rule.goto)) {
          report.fail(`${where}/${verb}[${index}]: unknown goto room "${rule.goto}"`);
        }
      });
      const unguarded = rules.findIndex((rule) => !rule.when);
      if (unguarded !== -1 && unguarded !== rules.length - 1) {
        report.fail(`${where}/${verb}: unguarded rule at index ${unguarded} makes later rules unreachable`);
      }
    }
  }

  // --- dialogue ----------------------------------------------------------
  for (const { treeId, nodeId, node, option } of allDialogueOptions(content)) {
    if (option.tag !== 'EXIT' && !option.say && !option.repeat) {
      // A node may declare that its options have no replies. The opening
      // line is the case that needs it: the options are what Thad says, and
      // doc 17 is explicit that nobody is listening. Declared in the content
      // with a reason, so the exception is reviewable rather than implicit.
      if (node.noReply !== true) {
        report.fail(`${treeId}/${nodeId}/${option.id}: no response line`);
      }
    }
  }

  // --- ui ----------------------------------------------------------------
  if (!content.ui.sentence.template.includes('{verb}') || !content.ui.sentence.template.includes('{target}')) {
    report.fail('ui.sentence.template must contain {verb} and {target}');
  }

  report.note(
    `${content.rooms.length} rooms, ${content.dialogue.length} trees, ` +
      `${allInteractables(content).length} targets, ${content.verbs.verbs.length} verbs`,
  );
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
