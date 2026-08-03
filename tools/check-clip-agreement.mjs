import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Report, ROOT } from './lib/content.mjs';
import { readPng } from './lib/png.mjs';

/**
 * Two clips of one character agree about the parts neither of them animates.
 *
 * EVERY OTHER CHECK IN THIS SUITE ASKS ABOUT ONE ARTEFACT. Is this clip
 * declared, loaded, correctly sized, free of key fringe, drawn in a facing it
 * exists in. Not one of them compares two artefacts to each other -- and the
 * faults that reached a play-through were all relations rather than objects.
 *
 * THE LUGGAGE FLASH. `idle-break` was built before the case was painted off
 * the coach roof, so the coach alternated between an empty rack and a loaded
 * one as the break fired -- luggage appearing and vanishing on a timer.
 * Nothing failed. Both clips were well-formed, both were declared, both were
 * loaded, both were the right size. They simply disagreed about what the
 * object they depict looks like, and no check in the suite was capable of
 * having an opinion about that.
 *
 * THE RULE, and it is narrower than "the clips should look alike": a pixel
 * that MOVES inside a clip is that clip animating, which is the point of it.
 * A pixel that is STILL in both clips is the character's fixed appearance,
 * and the two must agree about it. So each clip is reduced to its static
 * image -- the pixels identical across all of its own frames -- and the
 * comparison happens only where both are static.
 *
 * That is what makes it quiet on correct work (R5j). Walk and idle animate
 * completely different regions and pass, because the disagreement is confined
 * to pixels one of them is deliberately moving.
 *
 * WHAT IT CANNOT SEE, stated rather than discovered later:
 *
 *   - Clips on DIFFERENT CANVAS SIZES are not compared. Aligning them needs
 *     the rig's anchor and figure box, and a comparison built on a second
 *     party's alignment would be agreeing with that party (R5i). Hob's idle
 *     is 1152x1430 and his walk is 437x549, so those two are never compared;
 *     the pairs that are compared are listed in the note.
 *   - It cannot see a clip that is WRONG IN THE SAME WAY as its siblings.
 *     If every clip had lost the luggage, all of them would agree.
 *   - It says nothing about whether the character is drawn WELL. That is a
 *     picture question and it belongs to a person looking at an overlay.
 */

const ACTORS = 'art/actors';
// A handful of pixels differing is anti-aliasing at a keyed edge, not a
// missing suitcase. The luggage rack is thousands.
const ALLOWED = 120;

/** Every frame of a clip, as raw RGBA. */
function framesOf(dir) {
  const files = readdirSync(resolve(ROOT, ACTORS, dir))
    .filter((name) => name.endsWith('.png')).sort();
  return files.map((name) => readPng(readFileSync(resolve(ROOT, ACTORS, dir, name))));
}

/**
 * The pixels a clip never changes, as a mask, plus the first frame's data.
 *
 * `still[i]` is true where every frame agrees. A one-frame clip is still
 * everywhere, which is correct: it animates nothing, so all of it is the
 * character's fixed appearance.
 */
function staticImage(frames) {
  const first = frames[0];
  const count = first.width * first.height;
  const still = new Uint8Array(count).fill(1);
  for (const frame of frames.slice(1)) {
    for (let i = 0; i < count; i += 1) {
      if (!still[i]) continue;
      const at = i * 4;
      if (frame.pixels[at] !== first.pixels[at] || frame.pixels[at + 1] !== first.pixels[at + 1]
        || frame.pixels[at + 2] !== first.pixels[at + 2]
        || frame.pixels[at + 3] !== first.pixels[at + 3]) still[i] = 0;
    }
  }
  return { still, data: first.pixels, width: first.width, height: first.height };
}

/** Where both are still, do they show the same thing? */
function disagreement(a, b) {
  const count = a.width * a.height;
  let differing = 0;
  let minX = a.width; let minY = a.height; let maxX = -1; let maxY = -1;
  for (let i = 0; i < count; i += 1) {
    if (!a.still[i] || !b.still[i]) continue;
    const at = i * 4;
    // Both fully transparent is agreement whatever the colour channels say --
    // a keyed-out pixel carries whatever the encoder left under it.
    if (a.data[at + 3] === 0 && b.data[at + 3] === 0) continue;
    if (a.data[at] === b.data[at] && a.data[at + 1] === b.data[at + 1]
      && a.data[at + 2] === b.data[at + 2] && a.data[at + 3] === b.data[at + 3]) continue;
    differing += 1;
    const x = i % a.width; const y = (i / a.width) | 0;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  return { differing, box: maxX < 0 ? null : [minX, minY, maxX - minX + 1, maxY - minY + 1] };
}

export function check() {
  const report = new Report('Two clips of one character agree about what they do not animate');
  const dirs = readdirSync(resolve(ROOT, ACTORS), { withFileTypes: true })
    .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();

  // Grouped by the character and the facing in the directory name, which is
  // how the rig names them: <actor>-<clip>-<facing>.
  const groups = new Map();
  const loaded = new Map();
  for (const dir of dirs) {
    const parts = dir.split('-');
    const actor = parts[0];
    const facing = parts[parts.length - 1];
    let frames;
    try {
      frames = framesOf(dir);
    } catch (error) {
      report.fail(`${dir}: could not be read -- ${error.message}`);
      continue;
    }
    if (frames.length === 0) continue;
    const image = staticImage(frames);
    loaded.set(dir, image);
    const key = `${actor}/${facing}/${image.width}x${image.height}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(dir);
  }

  let compared = 0;
  const uncompared = [];
  for (const [key, members] of groups) {
    if (members.length < 2) {
      uncompared.push(`${members[0]} (nothing else at ${key.split('/')[2]} to compare it with)`);
      continue;
    }
    for (let i = 0; i < members.length; i += 1) {
      for (let j = i + 1; j < members.length; j += 1) {
        compared += 1;
        const { differing, box } = disagreement(loaded.get(members[i]), loaded.get(members[j]));
        if (differing <= ALLOWED) continue;
        report.fail(`${members[i]} and ${members[j]} disagree on ${differing} pixel(s) that `
          + `NEITHER of them animates, in ${box.join(',')}. Both clips are well-formed and they `
          + 'depict different objects -- this is the luggage flash, whatever it is this time');
      }
    }
  }

  // NO SILENT CAPS. What was not compared is named, because a check that
  // covers half the art and reports a clean pass is worse than one that says
  // which half.
  report.note(`${compared} clip pair(s) compared across ${groups.size} group(s) of same actor, `
    + 'facing and canvas size');
  if (uncompared.length) {
    report.note(`not compared -- ${uncompared.length} clip(s) with no same-size sibling: `
      + uncompared.join('; '));
  }
  return report;
}
