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

  // --- reachability ------------------------------------------------------
  //
  // targetAt returns the FIRST target whose rect contains the point, so a
  // small target listed after a larger one that covers it can never be
  // clicked. The Nugget's framed portrait sits entirely inside the
  // chandelier's rect and is listed after it: six written lines no player
  // could ever reach, passing every check in the repo, because every check
  // asked whether the lines existed and none asked whether the hotspot did.
  //
  // THE ORDER HERE IS THE ENGINE'S, exits before hotspots, and getting that
  // backwards on the first attempt reported all four of Main Street's doors
  // as unreachable behind the false fronts -- which would have been a serious
  // bug if it were true and was entirely an artefact of the check.
  //
  // Only UNGATED earlier targets can occlude. A gated one is filtered out of
  // the list when its condition is false, so the coach and the coach-gone
  // hotspot of ruling 19a never coexist and neither hides the other. That
  // under-reports -- two differently-gated targets that happen to coexist are
  // missed -- and under-reporting is the right way for a build-failing check
  // to be wrong.
  //
  // Brute force over the rect. A room has a dozen targets in a 320x144 frame,
  // and being exactly right about this is worth more than being quick.
  for (const { data } of content.rooms) {
    const targets = [...(data.exits ?? []), ...(data.hotspots ?? [])];
    targets.forEach((target, index) => {
      const [x, y, w, h] = target.rect ?? [];
      if ([x, y, w, h].some((value) => typeof value !== 'number')) return;
      // A stateful target's bounds change with its state, so its rect is not
      // the whole of where it can be clicked; it is never treated as one that
      // hides something else.
      const occluders = targets.slice(0, index).filter(
        (other) => other.when === undefined && other.states === undefined,
      );
      let reachable = false;
      for (let py = y; py < y + h && !reachable; py += 1) {
        for (let px = x; px < x + w && !reachable; px += 1) {
          reachable = !occluders.some((other) => {
            const [ox, oy, ow, oh] = other.rect ?? [];
            return px >= ox && px < ox + ow && py >= oy && py < oy + oh;
          });
        }
      }
      if (!reachable) {
        const covering = occluders
          .filter((other) => {
            const [ox, oy, ow, oh] = other.rect ?? [];
            return ox <= x && oy <= y && ox + ow >= x + w && oy + oh >= y + h;
          })
          .map((other) => other.id);
        report.fail(`${data.id}/${target.id}: no point in its rect resolves to it -- `
          + `covered by ${covering.length ? covering.join(', ') : 'earlier targets'}`);
      }
    });
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
  // A node with no prompt and no declaration reached the font as `undefined`
  // and took the frame down. It was latent for as long as the tree carrying
  // it was in the manifest but wired to nobody, which is the worst way for a
  // crash to wait. Silence is allowed and has to be declared.
  for (const { path, data } of content.dialogue) {
    for (const [nodeId, node] of Object.entries(data.nodes ?? {})) {
      if (!node.prompt && node.noPrompt !== true) {
        report.fail(`${path}: ${data.id}/${nodeId} has no prompt and does not declare noPrompt`);
      }
      if (node.noPrompt === true && !node.exceptionReason) {
        report.fail(`${path}: ${data.id}/${nodeId} declares noPrompt with no reason`);
      }
    }
  }
  const beats = [];
  for (const { treeId, nodeId, node, option } of allDialogueOptions(content)) {
    if (option.say && option.exchange) {
      report.fail(`${treeId}/${nodeId}/${option.id}: has both a say and an exchange`);
    }
    if (option.beat && (option.say || option.exchange)) {
      report.fail(`${treeId}/${nodeId}/${option.id}: has both a beat and a line`);
    }
    if (option.tag !== 'EXIT' && !option.say && !option.repeat && !option.exchange
        && !option.beat) {
      // A node may declare that its options have no replies. The opening
      // line is the case that needs it: the options are what Thad says, and
      // doc 17 is explicit that nobody is listening. Declared in the content
      // with a reason, so the exception is reviewable rather than implicit.
      if (node.noReply !== true) {
        report.fail(`${treeId}/${nodeId}/${option.id}: no response line`);
      }
    }
    if (option.beat) beats.push(`${treeId}/${nodeId}/${option.id}: ${option.beat}`);
  }

  // An option whose response the document writes as a SCENE rather than a
  // line. Doc 27's Vessel option 6 is "(The swindle. Four dollars and the
  // watch for the deed.)" -- there is no line to say because nobody says
  // anything, and the item transfer that plays it is puzzle machinery. The
  // direction is carried into the data rather than dropped, and listed here
  // every run, because an option that shows the player nothing is otherwise
  // indistinguishable from an option somebody forgot to write.
  if (beats.length > 0) {
    report.note(`${beats.length} option(s) declare a beat rather than a line -- unbuilt`);
    for (const beat of beats) report.note(`  ${beat}`);
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
