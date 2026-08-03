import { readJson, Report } from './lib/content.mjs';

/**
 * No speaker's colour may be mistaken for the fallback, or for another
 * speaker's.
 *
 * THE FALLBACK CLAUSE IS THE ONE THAT WAS EARNED. Thad was #f4ecd8 and the
 * fallback ink is #efe7d7 -- five units apart in every channel, which is
 * nothing on screen. So a line that failed to find its speaker drew in Thad's
 * colour and was indistinguishable from a line that had found him, and the
 * driver's entire tree rendered as though Thad said it while looking perfectly
 * correct. Reported from a play-through as "the wrong line is coloured", which
 * is the only way it could ever have been noticed.
 *
 * A fallback that equals a real value is unfalsifiable by looking. This is the
 * check that makes it falsifiable without looking.
 *
 * THE PAIRWISE CLAUSE IS THE SAME ARGUMENT between two speakers: two
 * characters the player cannot tell apart is the failure the whole mechanism
 * exists to prevent, and it would arrive silently the day somebody picks a
 * fourth colour near a third.
 */
const MIN_DISTANCE = 24;

function rgb(hex) {
  const parsed = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  return parsed ? parsed.slice(1).map((pair) => parseInt(pair, 16)) : null;
}

/** Manhattan distance in RGB. Crude on purpose: this is a legibility floor. */
function apart(a, b) {
  return a.reduce((sum, value, at) => sum + Math.abs(value - b[at]), 0);
}

export function check() {
  const report = new Report('Every speaker colour is distinct from the fallback and from each other');
  const manifest = readJson('content/manifest.json');
  if (!manifest.speechColours) {
    report.note('no speech colours declared -- every line draws in the default ink');
    return report;
  }
  const file = readJson(manifest.speechColours);
  const palette = readJson(manifest.palette);
  const swatches = palette.swatches ?? palette.colours ?? palette.colors;
  const fallback = rgb(swatches[palette.roles.inkBright]);
  if (!fallback) {
    report.fail('the fallback role inkBright does not resolve to a colour');
    return report;
  }

  const declared = Object.entries(file.speakers ?? {});
  for (const [id, entry] of declared) {
    const value = rgb(entry.colour);
    if (!value) {
      report.fail(`${id}: "${entry.colour}" is not a #rrggbb colour`);
      continue;
    }
    const gap = apart(value, fallback);
    if (gap < MIN_DISTANCE) {
      report.fail(`${id}: ${entry.colour} is ${gap} from the fallback `
        + `${swatches[palette.roles.inkBright]} (needs ${MIN_DISTANCE}). A line that failed to `
        + 'find its speaker would be indistinguishable from one that found this one');
    }
  }
  for (let a = 0; a < declared.length; a += 1) {
    for (let b = a + 1; b < declared.length; b += 1) {
      const [oneId, one] = declared[a];
      const [twoId, two] = declared[b];
      const first = rgb(one.colour);
      const second = rgb(two.colour);
      if (!first || !second) continue;
      const gap = apart(first, second);
      if (gap < MIN_DISTANCE) {
        report.fail(`${oneId} and ${twoId} are ${gap} apart (needs ${MIN_DISTANCE}) -- `
          + 'two speakers the player cannot tell apart');
      }
    }
  }
  report.note(`${declared.length} speaker(s), fallback ${swatches[palette.roles.inkBright]}, `
    + `minimum separation ${MIN_DISTANCE}`);
  return report;
}
