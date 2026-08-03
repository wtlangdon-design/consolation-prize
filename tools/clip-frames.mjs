import { readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

import { ROOT } from './lib/content.mjs';

/**
 * What a clip's frames are, as bytes. Three questions, one measurement.
 *
 *     node tools/clip-frames.mjs                 # every clip
 *     node tools/clip-frames.mjs thad-walk       # the ones whose name matches
 *
 * DELIBERATELY NOT A CHECK. It reports; it does not fail. Two of the three
 * questions below currently have answers nobody has ruled on -- Thad's four
 * walks still ping-pong, and sixteen clips are still padded pending Q80 -- so
 * a check would be a standing red, which is R5j. This is the thing to run
 * BEFORE art lands, and the checks are what run after somebody has ruled.
 *
 * THE MIRROR. `frame[i] === frame[n-1-i]` means the second half is the first
 * played backwards, so the same leg leads every step: one swings out and comes
 * back and the other never passes it. Reported from watching as "galloping".
 * It is the walk question, and it needs eight frames to be visible -- a
 * four-frame cycle cannot mirror in the way that matters.
 *
 * THE LOOP. `frame[0] === frame[n-1]` in a clip that RETURNS to its rest state
 * is not a defect, it is the return -- but in a walk it means the cycle spends
 * two of its frames on one picture. The question this answers for a new
 * STANDING pose is the one clause two of check-clip-agreement cannot: a new
 * stand IS the idle for its facing, so there is nothing to compare it against,
 * and the only thing left to ask is whether it closes on itself.
 *
 * THE PADDING. Distinct pictures against declared frames. A six-frame clip
 * with two pictures is a two-frame clip with padding, and that is what the
 * breath transform produced at every size until the amplitude floor landed.
 */
const ACTORS = 'art/actors';

function framesOf(dir) {
  return readdirSync(resolve(ROOT, ACTORS, dir))
    .filter((name) => name.endsWith('.png')).sort()
    .map((name) => createHash('sha256')
      .update(readFileSync(resolve(ROOT, ACTORS, dir, name))).digest('hex').slice(0, 8));
}

const filter = process.argv[2] ?? '';
const dirs = readdirSync(resolve(ROOT, ACTORS), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.includes(filter))
  .map((entry) => entry.name).sort();

let mirrored = 0;
let looped = 0;
let padded = 0;
for (const dir of dirs) {
  const hashes = framesOf(dir);
  const n = hashes.length;
  if (n === 0) continue;
  const distinct = new Set(hashes).size;

  // A MIRROR NEEDS AT LEAST SIX FRAMES TO MEAN ANYTHING. With four, i and
  // n-1-i coincide or sit adjacent, and a cycle that happens to repeat a
  // picture would be reported as a ping-pong it is not.
  //
  // AND THE INDEX IS `n - i`, NOT `n - 1 - i`, which is how this first
  // reported 0 mirrored on four clips already measured at 1=7, 2=6, 3=5. A
  // ping-pong of eight goes 0 1 2 3 4 3 2 1: it turns round at the LAST frame
  // and comes back to frame 1, never to frame 0, because frame 0 is where the
  // next cycle starts. Reflecting about n-1-i is the mirror of a sequence that
  // ends where it began, which is a different animation.
  //
  // Caught only because the answer was already known. A formula that returns
  // "nothing wrong" is the one nobody re-derives.
  const pairs = [];
  if (n >= 6) {
    for (let i = 1; i < n - i; i += 1) {
      if (hashes[i] === hashes[n - i]) pairs.push(`${i}=${n - i}`);
    }
  }
  const loops = n > 1 && hashes[0] === hashes[n - 1];
  const isPadded = n >= 4 && distinct < 3;
  if (pairs.length) mirrored += 1;
  if (loops) looped += 1;
  if (isPadded) padded += 1;

  const flags = [
    pairs.length ? `MIRROR ${pairs.join(' ')}` : '',
    loops ? 'loops (frame 0 = frame last)' : '',
    isPadded ? `PADDED ${distinct} of ${n}` : '',
  ].filter(Boolean).join('  ');
  console.log(`${dir.padEnd(32)} ${String(n).padStart(2)}f  ${String(distinct).padStart(2)} distinct`
    + (flags ? `   ${flags}` : ''));
}

console.log(`\n${dirs.length} clip(s): ${mirrored} mirrored, ${looped} closing on frame 0, `
  + `${padded} padded to fewer than three pictures`);
