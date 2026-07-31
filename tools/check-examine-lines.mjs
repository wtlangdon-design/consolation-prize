import { allInteractables, loadContent, readJson, Report, runCheck } from './lib/content.mjs';

const LOOK = 'LOOK_AT';
const LISTEN = 'LISTEN_TO';

/**
 * Every hotspot carries a LOOK AT line and a LISTEN TO line, and no line is
 * reused anywhere in the game.
 *
 * The uniqueness half matters more than it looks: the examine layer is where
 * most of the charm lives, and a duplicated line is the one defect a player
 * always notices.
 */
export function check() {
  const report = new Report('Every hotspot has a distinct LOOK and LISTEN line');
  const content = loadContent();
  const targets = allInteractables(content);
  report.note(`checked ${targets.length} hotspots and exits across ${content.rooms.length} rooms`);

  const seen = { [LOOK]: new Map(), [LISTEN]: new Map() };

  // Deliberate repetitions, declared in content. Doc 13 note 1: the mud
  // answers the second LISTEN with the first LISTEN's exact words. A dedupe
  // pass would "fix" that and delete the joke.
  // Two kinds of entry. A `where` names one hotspot's one verb, which is
  // how a specific repetition is declared. A `where` of "*" declares that
  // the LINE ITSELF is doctrine wherever it appears -- which is what a bare
  // "Nothing." is: doc 05's LISTEN layer says most objects are silent, and
  // Thad's answer to a silent object is the same two syllables every time.
  // The allowlist already carried four separate entries for that one string
  // before doc 25 brought fourteen more, and enumerating them would have
  // been the check asking to be quietened rather than answered.
  const entries = readJson(content.manifest.duplicateAllowlist).allow ?? [];
  const allowlist = new Set(
    entries.filter((entry) => entry.where !== '*').map((entry) => `${entry.where}|${entry.line}`),
  );
  const doctrine = new Set(
    entries.filter((entry) => entry.where === '*').map((entry) => entry.line),
  );

  // Collected first, judged second, because judging as it goes made the
  // verdict depend on the order rooms happen to sit in the manifest.
  //
  // The single-pass version claimed a line for whichever target reached it
  // first and only compared later ones against that. So an ALLOWLISTED use
  // seen first would shield an unlisted use seen later: three whitelisted
  // "Nothing."s in the Nugget silently absorbed a fourth on the stage road,
  // and the check reported a uniqueness guarantee it was not making.
  let stubs = 0;
  let allowedHits = 0;
  for (const { roomId, target } of targets) {
    // A stub is a destination that exists so the exit works, with its examine
    // layer honestly absent rather than invented. Counted, not skipped
    // silently.
    if (target.stub) {
      stubs += 1;
      continue;
    }
    for (const verb of [LOOK, LISTEN]) {
      const rules = target.responses?.[verb];
      // Every line the player can be shown for this verb, first and repeats.
      const lines = (rules ?? [])
        .flatMap((rule) => [rule.say, ...(rule.repeat ?? [])])
        .filter((say) => typeof say === 'string');

      if (lines.length === 0) {
        report.fail(`${roomId}/${target.id}: no ${verb} line`);
        continue;
      }

      const where = `${roomId}/${target.id}`;
      for (const [index, line] of lines.entries()) {
        if (!seen[verb].has(line)) seen[verb].set(line, []);
        seen[verb].get(line).push({
          where,
          allowed: doctrine.has(line) || allowlist.has(`${where}/${verb}|${line}`),
          repeatOfOwnVariant: lines.indexOf(line) !== index,
        });
      }
    }
  }

  for (const verb of [LOOK, LISTEN]) {
    for (const [line, uses] of seen[verb]) {
      const owners = new Set(uses.map((use) => use.where));
      for (const use of uses) {
        if (use.allowed) {
          allowedHits += 1;
          continue;
        }
        if (use.repeatOfOwnVariant) {
          report.fail(`${use.where}: ${verb} repeats a line within its own variants -- "${line}"`);
        } else if (owners.size > 1) {
          const others = [...owners].filter((owner) => owner !== use.where).join(', ');
          report.fail(`${use.where}: ${verb} line duplicates ${others} -- "${line}"`);
        }
      }
    }
  }

  if (allowedHits > 0) {
    report.note(`${allowedHits} deliberate duplicate(s) whitelisted, not deduped`);
  }
  if (stubs > 0) {
    report.note(`${stubs} stub exits skipped -- their examine lines are written but not transcribed`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
