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
        // WORDED FOR BOTH CASES, because the first reading of this was wrong.
        // "They depict different objects" is one explanation -- the luggage
        // flash -- and "one of them holds a pose throughout that the other
        // never takes" is the other, which is what Thad's profile break turned
        // out to be. The check cannot tell them apart and should not pretend
        // to: it reports the disagreement and clause two says whether the
        // clip at least starts and stops in the right place.
        report.fail(`${members[i]} and ${members[j]} disagree on ${differing} pixel(s) that `
          + `NEITHER of them animates, in ${box.join(',')}. Either they depict different things, `
          + 'or one holds a pose for its whole length that the other never takes');
      }
    }
  }

  // CLAUSE TWO: A CLIP THAT RETURNS TO THE IDLE BEGINS AND ENDS AT IT.
  //
  // Doc 22: "every chore must settle cleanly into a directional idle." Doc 40,
  // of the break: "it plays on a timer while idle and RETURNS TO IT." Returning
  // to a pose requires the last frame to BE that pose, and starting from it
  // requires the same of the first.
  //
  // THIS IS THE CLAUSE THAT SAYS WHAT CLAUSE ONE ONLY HINTED AT. Clause one
  // reported that Thad's hand sits in a different place in `idle` and
  // `idle-break`, and the obvious reading -- the two clips disagree about what
  // he looks like -- was WRONG. Doc 40 says the profile break is a shoulder
  // shrug, so a moving arm is the animation, not a defect. What is a defect is
  // that the profile breaks are ALREADY SHRUGGED in frame 0 and STILL SHRUGGED
  // in frame 11: they neither begin nor end where they must, so the arm
  // teleports on the way in and again on the way out.
  //
  // Head-on it is a glance rather than a shrug, and those two clips are
  // correct: `back` frame 0 is byte-identical to the idle base and `front` is
  // within 35 pixels of it. Two facings honour the contract and two do not,
  // which is why this is worth a clause rather than a note.
  const idleOf = new Map();
  for (const dir of loaded.keys()) {
    const parts = dir.split('-');
    if (parts[1] === 'idle' && parts.length === 3) idleOf.set(`${parts[0]}/${parts[2]}`, dir);
  }
  let settled = 0;
  for (const [dir, image] of loaded) {
    const parts = dir.split('-');
    const rest = idleOf.get(`${parts[0]}/${parts[parts.length - 1]}`);
    // Only clips doc 22 and doc 40 say return to the idle. `walk` does not
    // return to anything, `stand` IS the settled frame, and the idle is itself.
    if (!rest || rest === dir || parts[1] === 'walk' || parts[1] === 'stand') continue;
    const idle = loaded.get(rest);
    if (idle.width !== image.width || idle.height !== image.height) continue;
    const frames = framesOf(dir);
    settled += 1;
    for (const [where, frame] of [['first', frames[0]], ['last', frames[frames.length - 1]]]) {
      let differing = 0;
      for (let i = 0; i < image.width * image.height; i += 1) {
        const at = i * 4;
        if (frame.pixels[at + 3] === 0 && idle.data[at + 3] === 0) continue;
        if (frame.pixels[at] !== idle.data[at] || frame.pixels[at + 1] !== idle.data[at + 1]
          || frame.pixels[at + 2] !== idle.data[at + 2]
          || frame.pixels[at + 3] !== idle.data[at + 3]) differing += 1;
      }
      if (differing <= ALLOWED) continue;
      const said = `${dir}: its ${where} frame is ${differing} pixel(s) away from ${rest}'s `
        + `settled frame, so the body jumps on the way ${where === 'first' ? 'in' : 'out'}`;
      // ONLY THE BREAK IS ASSERTED. Doc 40 says of it, in those words, that it
      // "plays on a timer while idle and RETURNS TO IT" -- a clip that must
      // return has to end on the thing it returns to, and that is not an
      // interpretation. Doc 22's "every chore must settle cleanly into a
      // directional idle" is a statement about the ENGINE returning the body,
      // and whether a recoil's last frame must also BE the idle is a reading
      // of it rather than a quotation. All four recoils end far from the idle;
      // that is reported with its number and left to somebody watching it.
      if (parts[1] === 'idlebreak') {
        report.fail(`${said}. Doc 40: the break "plays on a timer while idle and returns to it"`);
      } else {
        report.note(`${said} -- reported, not asserted: doc 22's settle contract is about the `
          + 'engine handing the body back, and whether the clip must also end there is a reading');
      }
    }
  }
  report.note(`${settled} clip(s) checked for beginning and ending at their idle`);

  // CLAUSE THREE: A CLIP'S FRAMES ARE PICTURES, NOT PADDING.
  //
  // ASKED FOR AS "assert the frame count survives the downscale". IT CANNOT BE
  // ASKED THAT WAY FROM HERE, and the reason is worth more than the check:
  // THE DOWNSCALE STAGE IS NOT IN THIS REPOSITORY. `character.py` writes at
  // source resolution -- 869x1720 for the lookup source -- and the shipped
  // frames are 279x610. Nothing in tools/ resizes actor art. The step between
  // them exists only in somebody's hands, which makes it the one part of the
  // pipeline no check can reach and no reader can find.
  //
  // SO IT ASSERTS ON THE OUTPUT INSTEAD, which is stronger. Whatever the
  // downscale is and wherever it lives, the property that matters is a fact
  // about the shipped bytes: a six-frame clip must contain six frames' worth
  // of pictures. Measured on what ships, this holds however the art was made,
  // and it cannot be satisfied by a stage agreeing with itself (R5e).
  //
  // WHY THREE. Two distinct pictures is a step between two postures, not a
  // movement: at 2.4/s that is a pop every 1.7 seconds. Three is the fewest
  // that can rise and settle, and it is the number the amplitude floor in
  // `character.py` now guarantees -- so this is the downstream half of that
  // refusal, checking the artefact rather than the generator.
  let padded = 0;
  for (const dir of [...loaded.keys()].sort()) {
    const frames = framesOf(dir);
    if (frames.length < 4) continue;
    const seen = new Set(frames.map((frame) => {
      let hash = 2166136261;
      for (let i = 0; i < frame.pixels.length; i += 997) {
        hash = Math.imul(hash ^ frame.pixels[i], 16777619);
      }
      return `${hash}/${frame.pixels.length}`;
    }));
    padded += 1;
    if (seen.size >= 3) continue;
    report.fail(`${dir}: ${frames.length} frames but only ${seen.size} distinct picture(s). `
      + 'That is a two-frame clip with padding -- a step between postures rather than a '
      + 'movement. Three is the fewest that can rise and settle');
  }
  report.note(`${padded} clip(s) of four frames or more checked for distinct pictures`);

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
