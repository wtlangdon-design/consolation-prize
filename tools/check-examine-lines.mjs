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
  const allowlist = new Set(
    (readJson(content.manifest.duplicateAllowlist).allow ?? []).map(
      (entry) => `${entry.where}|${entry.line}`,
    ),
  );

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

      const localSeen = new Set();
      for (const line of lines) {
        const allowed = allowlist.has(`${roomId}/${target.id}/${verb}|${line}`);
        if (allowed) {
          allowedHits += 1;
          localSeen.add(line);
          seen[verb].set(line, `${roomId}/${target.id}`);
          continue;
        }
        if (localSeen.has(line)) {
          report.fail(`${roomId}/${target.id}: ${verb} repeats a line within its own variants -- "${line}"`);
          continue;
        }
        localSeen.add(line);
        const owner = seen[verb].get(line);
        if (owner && owner !== `${roomId}/${target.id}`) {
          report.fail(`${roomId}/${target.id}: ${verb} line duplicates ${owner} -- "${line}"`);
        } else {
          seen[verb].set(line, `${roomId}/${target.id}`);
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
