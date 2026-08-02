import { openSync, readSync, closeSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { ROOT, Report } from './lib/content.mjs';

/**
 * Every clip's figure and anchor must fit inside the frames on disk.
 *
 * THE DEFECT THIS IS FOR SHIPPED, AND IT SHIPPED THROUGH A GREEN SUITE.
 * `f8699d3` rescaled `art/actors/` from 71.8 MB to 12.6 MB -- frames rewritten
 * at twice the drawn size instead of at source size, and each `rig.json`
 * updated to match. `content/actors/*.json` is GENERATED from those rig files
 * and was not regenerated, so the records went on declaring figure heights in
 * the old source space: 1637 against a frame 547 tall.
 *
 * `ActorSprite` scales by `height / figureHeight`. At three times too large a
 * divisor the protagonist drew at 88 px when the room handed the renderer 263,
 * and his soles landed 175 px above his own feet -- a third of his size,
 * floating at the fence. Every check passed. The record parsed, every frame
 * resolved on disk, every clip directory was declared, the boot lists
 * partitioned, the depth curve returned exactly the right number. Nothing
 * compared the record to the pictures.
 *
 * WHY THE ART AND NOT THE RIG. Asserting the record matches `rig.json` would
 * be asking the generator's own source whether the generator ran -- R5e, a
 * check that shares its subject's assumptions. The PNG header is a different
 * direction entirely: it is what the game will actually be handed at draw
 * time, and it does not care what anything intended.
 *
 * WHAT IS ASSERTED, AND WHY IT NEEDS NO TOLERANCE. A figure cannot be taller
 * than the canvas it is drawn on, and an anchor is a point ON that canvas.
 * Containment is exact, cannot false-positive, and this bug violated it by
 * threefold. A tighter test -- figure height against the frame's alpha extent
 * -- would need a tolerance and would be WRONG: a walk frame's alpha runs from
 * a swung arm to a trailing leg, measured here from 500 to 548 rows against a
 * 526 figure, and those are correct frames.
 */

/** Width and height from a PNG's IHDR, without decoding the image. */
function pngSize(path) {
  const fd = openSync(path, 'r');
  try {
    const head = Buffer.alloc(24);
    if (readSync(fd, head, 0, 24, 0) < 24) return null;
    if (head.toString('latin1', 1, 4) !== 'PNG') return null;
    return { width: head.readUInt32BE(16), height: head.readUInt32BE(20) };
  } finally {
    closeSync(fd);
  }
}

export function check() {
  const report = new Report("Every clip's figure and anchor fit inside its frames");
  const manifest = JSON.parse(readFileSync(resolve(ROOT, 'content/manifest.json'), 'utf8'));

  let clips = 0;
  let frames = 0;
  let smallest = Infinity;
  for (const path of manifest.actors ?? [manifest.actor]) {
    const record = JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
    for (const clip of record.clips ?? []) {
      clips += 1;
      const where = `${record.id} ${clip.id}/${clip.facing}`;
      for (const frame of clip.frames ?? []) {
        const size = pngSize(resolve(ROOT, frame));
        if (!size) {
          report.fail(`${where}: ${frame} is not a readable PNG`);
          continue;
        }
        frames += 1;
        if (clip.figureHeight > size.height) {
          report.fail(
            `${where} declares figureHeight ${clip.figureHeight} and ${frame} is only `
            + `${size.width}x${size.height}. ActorSprite scales by height/figureHeight, so `
            + `this draws the character ${(clip.figureHeight / size.height).toFixed(1)}x too `
            + `SMALL and lifts his soles off the ground by the same factor. The records are `
            + `generated -- re-run tools/build-actor-record.mjs.`,
          );
        } else {
          smallest = Math.min(smallest, size.height / clip.figureHeight);
        }
        const [ax, ay] = clip.anchor ?? [];
        if (ax > size.width || ay > size.height) {
          report.fail(
            `${where} anchors at [${ax}, ${ay}], which is outside ${frame} at `
            + `${size.width}x${size.height}. The anchor is a point ON the frame; off it, the `
            + `figure is placed by an offset that means nothing.`,
          );
        }
      }
    }
  }

  report.note(`${clips} clip(s), ${frames} frame(s) measured from their PNG headers`);
  if (Number.isFinite(smallest)) {
    report.note(`tightest frame is ${smallest.toFixed(2)}x its declared figure height`);
  }
  return report;
}
