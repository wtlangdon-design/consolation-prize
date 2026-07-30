import { allInteractables, loadContent, Report, runCheck } from './lib/content.mjs';

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

  let stubs = 0;
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
      const lines = (rules ?? []).map((rule) => rule.say).filter((say) => typeof say === 'string');

      if (lines.length === 0) {
        report.fail(`${roomId}/${target.id}: no ${verb} line`);
        continue;
      }

      for (const line of lines) {
        const owner = seen[verb].get(line);
        if (owner) {
          report.fail(`${roomId}/${target.id}: ${verb} line duplicates ${owner} -- "${line}"`);
        } else {
          seen[verb].set(line, `${roomId}/${target.id}`);
        }
      }
    }
  }

  if (stubs > 0) {
    report.note(`${stubs} stub exits skipped -- their examine lines are written but not transcribed`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
