import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { Report, ROOT, readJson, loadContent } from './lib/content.mjs';
import { readPng } from './lib/png.mjs';

/**
 * A rig record describes the frames sitting beside it.
 *
 * THE CLASS OF BUG THIS EXISTS FOR REACHED A PLAY-THROUGH FOUR TIMES, and
 * every instance had the same shape: art was regenerated at a new size and a
 * record that measured the old art was left alone. Every check passed, because
 * every check compared records with records. Nothing opened a PNG and asked
 * whether the number was true of it.
 *
 *   - a walk declared 526 where the frames were 624: the engine drew him 19%
 *     too large with his feet ninety-eight rows above the ground
 *   - a head overlay declared the body's OLD figure height, 389 against 447,
 *     so it scaled by a different factor from the body it composites into --
 *     1.149x too large, displaced by the same factor, and three separate rect
 *     fixes were then computed inside a coordinate space that no longer existed
 *
 * The second is the more expensive kind. A wrong number that nothing depends on
 * is inert; a wrong number that three later corrections are measured AGAINST
 * makes every one of them wrong in a way that looks like progress.
 */
const ACTORS = 'art/actors';

/**
 * How far a limb may reach below the sole line, as a share of figure height.
 *
 * MEASURED ACROSS EVERY CLIP IN THE REPOSITORY RATHER THAN CHOSEN. Thirty-five
 * of thirty-nine body clips sit at exactly 1.000. The four that do not are the
 * head-on walks and recoils, where a leg swinging toward the camera drops below
 * the soles: 1.042, 1.042, 1.040 and 1.056. The bound is 1.08, which clears the
 * largest real case by a little over one percent of figure height and still
 * fails the 1.186 that shipped.
 *
 * NOT AN INVENTED METRIC (R5b2): the number comes from the distribution, the
 * distribution is printed in the notes below on every run, and if a new clip
 * legitimately reaches further the failure names it and the number moves once,
 * visibly, rather than the check being loosened until it is quiet.
 */
const BELOW_SOLE = 1.08;

function framesOf(dir) {
  return readdirSync(resolve(ROOT, ACTORS, dir))
    .filter((name) => name.endsWith('.png')).sort()
    .map((name) => readPng(readFileSync(resolve(ROOT, ACTORS, dir, name))));
}

/** The alpha's topmost and bottommost rows across every frame of a clip. */
function contentRows(frames) {
  let top = Infinity;
  let bottom = -1;
  for (const frame of frames) {
    for (let y = 0; y < frame.height; y += 1) {
      let any = false;
      for (let x = 0; x < frame.width; x += 1) {
        if (frame.pixels[(y * frame.width + x) * 4 + 3] > 128) { any = true; break; }
      }
      if (!any) continue;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }
  return bottom < 0 ? null : { top, bottom, height: bottom - top + 1 };
}

export function check() {
  const report = new Report('Every rig record describes the frames beside it');
  const dirs = readdirSync(resolve(ROOT, ACTORS), { withFileTypes: true })
    .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();

  let bodies = 0;
  let worst = { dir: null, ratio: 0 };
  const overlayRigs = new Map();

  for (const dir of dirs) {
    const rigPath = resolve(ROOT, ACTORS, dir, 'rig.json');
    if (!existsSync(rigPath)) {
      report.fail(`${dir}: has frames and no rig.json`);
      continue;
    }
    const rig = JSON.parse(readFileSync(rigPath, 'utf8'));
    const overlay = rig.kind === 'head-overlay' || rig.overlay_rect !== undefined;
    if (overlay) { overlayRigs.set(dir, rig); continue; }
    if (!Array.isArray(rig.figure)) {
      report.fail(`${dir}: rig.json declares no figure`);
      continue;
    }
    const frames = framesOf(dir);
    if (frames.length === 0) continue;
    const rows = contentRows(frames);
    if (!rows) {
      report.fail(`${dir}: every frame is fully transparent`);
      continue;
    }
    bodies += 1;
    const declared = rig.figure[1];

    // CLAUSE ONE: THE FIGURE'S TOP IS CANVAS ROW 0. The rig writes the keyed
    // figure at rows 0..figure-1 and pads below it, so this holds by
    // construction for everything the rig makes -- and it is the cheapest way
    // to catch a frame that was cropped, re-padded or hand-composited after
    // the record was written, because the anchor is measured DOWN from here.
    if (rows.top !== 0) {
      report.fail(`${dir}: the figure starts at row ${rows.top}, not row 0. The anchor is `
        + 'measured down from the canvas top, so every placement is off by that much');
    }

    // CLAUSE TWO: THE DECLARED HEIGHT IS TRUE OF THE PIXELS.
    const ratio = rows.height / declared;
    if (ratio > worst.ratio) worst = { dir, ratio };
    if (rows.height < declared) {
      report.fail(`${dir}: declares a ${declared}px figure and its frames hold only `
        + `${rows.height}px of it. The record is larger than the art, so he draws SHORT `
        + 'of the height the room asked for');
    } else if (ratio > BELOW_SOLE) {
      report.fail(`${dir}: declares ${declared}px and its frames run ${rows.height}px `
        + `(${ratio.toFixed(3)}x). A limb may reach below the soles -- the largest real `
        + `case in this repository is 1.056 -- but ${ratio.toFixed(3)} is a record `
        + 'measuring art that has been regenerated at another size');
    }
  }
  report.note(`${bodies} body clip(s) measured against their own pixels; `
    + `the furthest any limb reaches below its sole line is ${worst.ratio.toFixed(3)}x `
    + `figure height (${worst.dir}), against a bound of ${BELOW_SOLE}`);

  // CLAUSE THREE WAS "AN OVERLAY'S FIGURE HEIGHT EQUALS ITS BODY'S", AND IT IS
  // GONE BECAUSE THE MECHANISM IT GUARDED IS.
  //
  // It shipped, caught the live fault it was written for, and was superseded
  // within the hour by the better fix: `figureHeight` is removed from overlay
  // data entirely and `drawOverlays` takes the scale of the clip actually being
  // drawn. A body's figure height is PER CLIP -- the coach was 447 standing and
  // 224 walking -- so ONE number on the overlay could never have followed it,
  // and asserting the two agree only ever made one of the two clips right.
  //
  // KEPT AS A PARAGRAPH RATHER THAN DELETED, because the next person to see
  // this shape will reach for the same check. The lesson is that a check
  // defending an invariant somebody can delete is worth less than deleting the
  // field: this clause would have gone on passing forever against a number
  // nothing read (R5l), which is exactly the failure it was written to catch.
  const content = loadContent();
  // Every declared record, the protagonist included. `loadContent` exposes the
  // protagonist as `actor`; the rest are named in the manifest's `actors`.
  const records = (content.manifest.actors ?? [content.manifest.actor])
    .map((path) => readJson(path));
  const overlays = (content.manifest.overlays ?? []).map((path) => ({
    path, data: readJson(path),
  }));
  for (const { path, data } of overlays) {
    const body = records.find((record) => record.id === data.over);
    if (!body) {
      report.fail(`${path}: composites over "${data.over}", which is not a declared actor`);
      continue;
    }
    if (data.figureHeight !== undefined) {
      report.fail(`${path}: still declares figureHeight ${data.figureHeight}. It is VOID -- `
        + 'a body\'s figure height is per clip and drawOverlays takes the drawn clip\'s own '
        + 'scale, so a number here is read by nothing and will be believed by somebody');
    }
    // WHICH BODY CLIPS IT LANDS ON MUST NAME CLIPS THAT EXIST. `clips` is how an
    // overlay says it does not apply to art that already contains it -- the
    // departing coach is one drawn picture with its driver in it -- and a
    // misspelling there silently reinstates the second head.
    const declared = new Set(body.clips.map((clip) => clip.id));
    for (const id of data.clips ?? []) {
      if (declared.has(id)) continue;
      report.fail(`${path}: applies to body clip "${id}", which ${data.over} does not `
        + `declare. It has ${[...declared].sort().join(', ')}`);
    }
    report.note(`${path}: over ${data.over}, on `
      + `${data.clips ? `${data.clips.length} named clip(s)` : 'every clip'}`);
  }

  // CLAUSE FOUR: THE ART-SIDE RIG AND THE CONTENT-SIDE RECORD AGREE.
  //
  // An overlay has TWO records of the same facts -- `art/actors/<dir>/rig.json`
  // written by the art pipeline, and `content/actors/<id>.json` read by the
  // engine -- and nothing generates one from the other. One artefact holding
  // facts from two authors is R5n's fourth instance, and here the stale half is
  // the one the NEXT person will read: a rig still carrying the rect that put a
  // second driver on the coach roof will put him back the moment anybody
  // regenerates from it.
  for (const [dir, rig] of overlayRigs) {
    const record = overlays.find(({ data }) => data.id === rig.over
      || dir.startsWith(`${data.id}-`));
    if (!record) {
      report.note(`${dir}: an overlay rig with no content record -- nothing reads it`);
      continue;
    }
    const { path, data } = record;
    // THE FIGURE HEIGHTS ARE NO LONGER COMPARED. The record does not carry one
    // any more -- see clause three -- so the rig's `figure` is now provenance
    // only: it says which body space its rect was measured in. Asserting it
    // against a field that no longer exists is a check failing on correct work,
    // which is R5j and cost this file a red the hour the better fix landed.
    if (Array.isArray(rig.figure) && data.figureHeight !== undefined
      && rig.figure[1] !== data.figureHeight) {
      report.fail(`${dir}/rig.json says the body is ${rig.figure[1]}px and ${path} says `
        + `${data.figureHeight}px. The rig is what the next regeneration reads`);
    }
    if (Array.isArray(rig.overlay_rect) && Array.isArray(data.rect)
      && rig.overlay_rect.join() !== data.rect.join()) {
      report.fail(`${dir}/rig.json places it at [${rig.overlay_rect}] and ${path} at `
        + `[${data.rect}]. Two records of one measurement, and the rig is the one a `
        + 'regeneration would believe');
    }
  }
  report.note(`${overlayRigs.size} overlay rig(s) compared with their content record`);

  // CLAUSE FIVE: A CLIP THAT DECLARES `returns_to` BEGINS AND ENDS THERE.
  //
  // Doc 40's chore contract, in seven rig.json files' own words: "Frame 0 and
  // frame 4 ARE the stand frame, byte for byte, so the chore cannot pop on
  // either end." Written down, never asserted, and untrue of all seven the
  // moment `thad-stand-right` was replaced -- so every chore in the game cut to
  // a man nobody was standing as, on the way in and again on the way out.
  //
  // BYTE EQUALITY CANNOT BE THE TEST, though the contract is worded that way.
  // A chore is 526px of figure on a 390x547 canvas and the stand is 625px on
  // 648x690; those are source resolutions, not sizes, and the two files can
  // never be byte-equal. Worse, the two ENDS were byte-equal to each other
  // throughout the bug -- they were both the OLD stand -- so comparing them
  // with one another says nothing at all.
  //
  // SO IT COMPARES SILHOUETTES, each sampled on a 64x64 grid over its own
  // bounding box, which is scale-free and needs none of the seating arithmetic
  // the fix used (R5e: a check that reused it would be agreeing with it).
  // Measured: the seven at 57% before the fix and 100% after, against key poses
  // scoring 45-69%. The bound is 0.95 -- far above anything a key pose reaches
  // and far below what a correct end frame scores.
  const RETURNS_TO = 0.95;
  let returning = 0;
  for (const dir of dirs) {
    const rigPath = resolve(ROOT, ACTORS, dir, 'rig.json');
    if (!existsSync(rigPath)) continue;
    const rig = JSON.parse(readFileSync(rigPath, 'utf8'));
    if (!rig.returns_to) continue;
    const restDir = `${dir.split('-')[0]}-${rig.returns_to}-${rig.facing}`;
    if (!existsSync(resolve(ROOT, ACTORS, restDir))) {
      report.fail(`${dir}: returns_to "${rig.returns_to}" names ${restDir}, which does not exist`);
      continue;
    }
    const frames = framesOf(dir);
    const rest = framesOf(restDir)[0];
    if (frames.length < 2 || !rest) continue;
    returning += 1;
    for (const [where, frame] of [['first', frames[0]], ['last', frames[frames.length - 1]]]) {
      const share = silhouetteAgreement(frame, rest);
      if (share >= RETURNS_TO) continue;
      report.fail(`${dir}: its ${where} frame is ${(share * 100).toFixed(0)}% the silhouette `
        + `of ${restDir}, and its rig declares returns_to "${rig.returns_to}". A chore that `
        + 'does not begin and end in the pose the body is already holding POPS on that end');
    }
  }
  report.note(`${returning} clip(s) declaring returns_to checked against the pose they return to, `
    + `at ${RETURNS_TO * 100}% silhouette agreement`);

  // CLAUSE SIX: A RIG NAMES A SOURCE THAT IS STILL THERE.
  //
  // Seven records named a file under /tmp that had been gone for months, and
  // nothing noticed because nothing at runtime reads `source` -- it is pure
  // provenance, which is exactly the kind of field that rots in silence. It
  // cost an afternoon of archaeology to find that `thad-walk-right` came from
  // `reference/casting/thad-profile-right-approved.png` with a painted far-arm
  // mask, and the knee re-rig doc 36 Q93 asks for was blocked on that rather
  // than on anything to do with knees.
  //
  // A path outside the repository is the failure, not merely a missing file:
  // /tmp/thad.png could exist on somebody's machine this afternoon and be a
  // different picture tomorrow. So the rule is that the source lives HERE.
  let sourced = 0;
  for (const dir of readdirSync(resolve(ROOT, 'art/actors'))) {
    const rigPath = resolve(ROOT, 'art/actors', dir, 'rig.json');
    if (!existsSync(rigPath)) continue;
    const rig = readJson(`art/actors/${dir}/rig.json`);
    const source = rig?.source;
    if (!source) continue;
    sourced += 1;
    if (source.startsWith('/') || source.startsWith('..')) {
      report.fail(`art/actors/${dir}: its rig names the source "${source}", which is outside `
        + 'the repository. Nothing reads this field at runtime, so a path that stops being '
        + 'true stays wrong until somebody needs to re-rig -- and then it is archaeology. '
        + 'Point it at the file in reference/, and record the flags in `invocation`.');
      continue;
    }
    if (!existsSync(resolve(ROOT, source))) {
      report.fail(`art/actors/${dir}: its rig names the source "${source}" and no such file `
        + 'exists. The clip cannot be re-rigged from what its own record says.');
    }
  }
  report.note(`${sourced} rig(s) name a source, and every one of them is a file in this tree`);
  return report;
}

/**
 * How much two figures cover the same shape, independent of scale and canvas.
 *
 * Each silhouette is sampled on a grid over ITS OWN bounding box, so a 526px
 * figure and a 625px one are compared as pictures rather than as pixels. That
 * is what lets a chore frame be measured against the stand it declares without
 * reproducing the resampling and anchoring the fix used to put it there.
 */
function silhouetteAgreement(a, b, n = 64) {
  const grid = (png) => {
    let top = Infinity; let bottom = -1; let left = Infinity; let right = -1;
    const on = (x, y) => png.pixels[(y * png.width + x) * 4 + 3] > 128;
    for (let y = 0; y < png.height; y += 1) {
      for (let x = 0; x < png.width; x += 1) {
        if (!on(x, y)) continue;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
    if (bottom < 0) return null;
    const cells = new Uint8Array(n * n);
    for (let j = 0; j < n; j += 1) {
      for (let i = 0; i < n; i += 1) {
        const x = left + Math.floor(((right - left) * i) / (n - 1));
        const y = top + Math.floor(((bottom - top) * j) / (n - 1));
        cells[j * n + i] = on(x, y) ? 1 : 0;
      }
    }
    return cells;
  };
  const one = grid(a);
  const two = grid(b);
  if (!one || !two) return 0;
  let both = 0;
  let either = 0;
  for (let i = 0; i < one.length; i += 1) {
    if (one[i] && two[i]) both += 1;
    if (one[i] || two[i]) either += 1;
  }
  return either ? both / either : 1;
}
