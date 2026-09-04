#!/usr/bin/env node
/**
 * TECHNICAL ADMISSIBILITY GATES FOR GENERATED ART. Nothing more than that.
 *
 * READ THIS BEFORE ADDING A GATE. Every measurement here answers a question
 * with a right answer: how many pixels wide, is the figure touching the edge,
 * is there magenta left in it, did the edit stay inside the rectangle it was
 * asked to stay inside. NONE of them answers whether the picture is good, and
 * no future one may.
 *
 * THERE IS NO ART QUALITY SCORE AND THERE WILL NOT BE ONE. This project has
 * already run that experiment: doc 46 part three records that "the four
 * acceptance metrics Claude invented" were wrong, that the strain went
 * sink -> profile -> rock because a render beat reasoning three times in one
 * evening, and that "no check measures whether a plate is good." A texture
 * density number, a stylistic distance, a contrast similarity -- each is an
 * aesthetic opinion wearing a decimal point, and the moment one gates a build
 * it starts deciding what the game looks like. If such a metric ever rejects
 * art Tyler has approved, THE METRIC IS WRONG. That is not a policy, it is
 * what the evidence would mean.
 *
 * ONLY TYLER SETS visual_accepted. Nothing in this file writes it.
 *
 * REUSE, NOT REINVENTION. Where a validator already proves a fact, the gate
 * calls it rather than measuring again:
 *
 *   key colour trapped inside a figure   check-residual-key
 *   magenta fringe on visible pixels     check-key-fringe
 *   a mover baked into a plate           tools/room-gate.mjs, section 2
 *   an asset the runtime actually loaded the four-panel proof, not this file
 *
 * The gates that are new here are the ones nothing measured: dimensions and
 * alpha expectations, clipping at the frame edge, edit isolation, and variant
 * continuity.
 *
 * Usage:
 *   node tools/art/gates.mjs <image> --kind plate --expect 1920x864
 *   node tools/art/gates.mjs <image> --kind sprite
 *   node tools/art/gates.mjs <edited> --kind edit --source <before> --region x,y,w,h
 *   node tools/art/gates.mjs <variant> --kind variant --against <base> --changed x,y,w,h
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { ROOT } from '../lib/content.mjs';
import { readPng } from '../lib/png.mjs';

/**
 * How magenta a pixel is: `(r + b) / 2 - g`. Lifted from check-key-fringe
 * rather than re-derived, including its threshold of 30, which sits in a
 * MEASURED gap -- real art's worst is 22 (the coach's maroon paintwork) and
 * the key fringe's worst was 127. A second copy of this number would agree
 * today and drift the first time either moved.
 */
const FRINGE = 30;
const FRINGE_VISIBLE_ALPHA = 32;

/** A pixel counts as opaque for silhouette work above this. */
const SOLID = 16;

export function load(path) {
  return readPng(readFileSync(resolve(ROOT, path)));
}

/** The tight bounding box of everything above `alpha`, or null if nothing is. */
export function opaqueBounds(png, alpha = SOLID) {
  let minX = png.width; let minY = png.height; let maxX = -1; let maxY = -1;
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      if (png.pixels[(y * png.width + x) * 4 + 3] <= alpha) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1,
    right: maxX, bottom: maxY };
}

/* ------------------------------------------------------- 1. DIMENSIONS */

/**
 * Dimensions, colour type and the alpha expectation for what this asset IS.
 *
 * A PLATE THAT CARRIES ALPHA AND A SPRITE THAT DOES NOT ARE BOTH FAULTS, and
 * they are the opposite fault, so one gate cannot be written without knowing
 * which kind of thing it is looking at. A plate with a transparent region is a
 * hole in the room; a sprite with no transparent region is a rectangle of
 * background pasted over the room -- which is precisely how the Nugget shipped
 * with six bar men instead of three.
 */
export function dimensions(png, { kind, expect }) {
  const failures = [];
  const notes = [`${png.width}x${png.height}, ${png.hasAlpha ? 'RGBA' : 'RGB'}`];
  if (expect) {
    const [w, h] = expect.split('x').map(Number);
    if (png.width !== w || png.height !== h) {
      failures.push(`is ${png.width}x${png.height}, expected ${w}x${h}`);
    }
  }
  // COUNTED ONLY WHERE THE SOURCE HAD AN ALPHA CHANNEL. `readPng` normalises
  // everything to RGBA, so a colour-type-2 plate comes back with 255 in every
  // alpha byte -- bytes the reader wrote, not bytes the file held. Counting
  // those would report every plate as fully opaque, which is true, and every
  // SPRITE as fully opaque too, which is not.
  let transparent = 0;
  if (png.hasAlpha) {
    for (let at = 3; at < png.pixels.length; at += 4) if (png.pixels[at] <= SOLID) transparent += 1;
  }
  const share = transparent / (png.width * png.height);
  notes.push(`${(share * 100).toFixed(1)}% transparent`);
  if (kind === 'plate') {
    // A PLATE IS OPAQUE EVERYWHERE. Not "mostly": a room's background is what
    // is behind everything, and a transparent pixel in it is a pixel with
    // nothing behind it at all.
    if (transparent > 0) {
      failures.push(`${transparent} transparent pixel(s) in a PLATE. A plate is what is behind `
        + 'everything else; a hole in it has nothing behind it.');
    }
  } else if (kind === 'sprite') {
    if (!png.hasAlpha) failures.push('a SPRITE with no alpha channel at all');
    else if (share < 0.02) {
      failures.push(`only ${(share * 100).toFixed(1)}% of a SPRITE is transparent -- it is `
        + 'very likely a rectangle of background that was never keyed');
    }
  }
  return { name: 'DIMENSIONS / FORMAT / ALPHA', failures, notes };
}

/* --------------------------------------------------------- 2. CLIPPING */

/**
 * A figure touching the frame edge, which means it was cut off.
 *
 * SPRITES ONLY, AND THE REASON IS IN THE RIG. Doc 41: "Frames are
 * full-resolution RGBA on a padded canvas -- the padding exists so a swinging
 * limb is not clipped." So a sprite whose alpha reaches its own canvas edge
 * has lost the padding and, with it, whatever was outside. A PLATE is supposed
 * to run to its edges; asking this of one would fail every plate in the game.
 *
 * THE TOP EDGE IS EXEMPT, AND CALIBRATION IS WHY. Run against approved art
 * this gate rejected Thad, Hob and every rigged frame in the repository, on
 * the grounds that the figure touches row 0 -- which is exactly what
 * `check-rig-describes-frames` clause one REQUIRES: "the rig writes the keyed
 * figure at rows 0..figure-1 and pads below it", and the anchor is measured
 * down from the canvas top. A new gate that rejects art Tyler approved and a
 * shipped validator asserts is a wrong gate, and the fix is to remove the
 * rule, not to loosen it until the art squeaks through.
 *
 * So this asserts the three edges the padding is actually on: left, right and
 * bottom. The top belongs to check-rig-describes-frames and stays there --
 * two mechanisms owning one fact is how they come to disagree.
 */
export function clipping(png, { kind }) {
  const failures = [];
  const notes = [];
  if (kind !== 'sprite') {
    notes.push('not a sprite -- a plate is meant to reach its own edges, so nothing asserted');
    return { name: 'CLIPPING', failures, notes };
  }
  const box = opaqueBounds(png);
  if (!box) {
    failures.push('every pixel is transparent: there is no figure here at all');
    return { name: 'CLIPPING', failures, notes };
  }
  notes.push(`figure occupies ${box.x},${box.y} ${box.width}x${box.height} `
    + `of ${png.width}x${png.height}`);
  const touching = [];
  if (box.x === 0) touching.push('left');
  if (box.right === png.width - 1) touching.push('right');
  if (box.bottom === png.height - 1) touching.push('bottom');
  for (const edge of touching) {
    failures.push(`the figure reaches the ${edge} edge of its own canvas. The rig pads every `
      + 'frame so a swung limb is not clipped; a figure at the edge has lost that padding and '
      + 'whatever was beyond it.');
  }
  return { name: 'CLIPPING', failures, notes };
}

/* ------------------------------------------- 3. KEY / EDGE CLEANLINESS */

/**
 * Magenta key surviving on visible pixels, and background trapped inside.
 *
 * BOTH MEASURES ARE THE SUITE'S OWN, and both are here rather than delegated
 * because the suite scans `art/actors` and `art/objects` and a staged file is
 * in neither. Same arithmetic, same thresholds, different subject.
 */
export function keyCleanliness(png, { kind }) {
  const failures = [];
  const notes = [];
  if (!png.hasAlpha) {
    notes.push('no alpha channel -- there is no key to have left behind');
    return { name: 'KEY / EDGE CLEANLINESS', failures, notes };
  }
  let worst = 0;
  let visible = 0;
  let trapped = 0;
  const { width, height, pixels } = png;
  const alphaAt = (x, y) => pixels[(y * width + x) * 4 + 3];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const at = (y * width + x) * 4;
      const r = pixels[at]; const g = pixels[at + 1];
      const b = pixels[at + 2]; const a = pixels[at + 3];
      if (a > FRINGE_VISIBLE_ALPHA) {
        const magenta = (r + b) / 2 - g;
        if (magenta > FRINGE) { visible += 1; if (magenta > worst) worst = magenta; }
      }
      // The coach's fault: background TRAPPED inside the figure, where thin
      // lines enclosed it. Interior only -- a rim never qualifies and every
      // keyed sprite has one.
      if (a > SOLID && Math.abs(r - b) <= 1 && r - g >= 8 && r < 40
        && x > 0 && y > 0 && x < width - 1 && y < height - 1
        && alphaAt(x - 1, y) > SOLID && alphaAt(x + 1, y) > SOLID
        && alphaAt(x, y - 1) > SOLID && alphaAt(x, y + 1) > SOLID) {
        trapped += 1;
      }
    }
  }
  notes.push(`worst magenta ${worst.toFixed(0)} of ${FRINGE} allowed; `
    + `${trapped} trapped key pixel(s)`);
  if (visible > 0) {
    failures.push(`${visible} visible pixel(s) carry the #FF00FF key, worst ${worst.toFixed(0)} `
      + `against ${FRINGE}. Despill: pull red and blue down to the green beside them, rather `
      + 'than deleting the pixel, which tears the edge.');
  }
  // 400 is check-residual-key's own tolerance: interior specks happen, a
  // trapped REGION is thousands.
  if (kind === 'sprite' && trapped > 400) {
    failures.push(`${trapped} interior pixel(s) are keyed background trapped inside the figure `
      + '-- the coach\'s purple wedge, which a flood fill from the edge can never reach');
  }
  return { name: 'KEY / EDGE CLEANLINESS', failures, notes };
}

/* ----------------------------------------------------- 5. EDIT ISOLATION */

/**
 * An edit stayed inside the region it declared.
 *
 * WHY THIS GATE IS THE ONE THE PIPELINE CANNOT DO WITHOUT. Errata 53 condition
 * 2 and doc 36 D4 make companion generation the way every mover is obtained:
 * the same scene with and without the object, differenced. That arithmetic is
 * only valid if the two images are otherwise IDENTICAL. A generator that also
 * moved a fence post four pixels puts the fence post into the mover's layer,
 * and the mover then carries a piece of the room around with it.
 *
 * THE TOLERANCE IS A PIXEL COUNT OUTSIDE THE REGION, NOT AN AVERAGE. An
 * average over a 1.6-megapixel plate hides a hundred changed pixels
 * completely, and a hundred changed pixels in the wrong place is exactly the
 * defect. `DRIFT` is per-channel and deliberately not zero: a re-encode can
 * move a channel by one.
 */
const DRIFT = 2;

export function editIsolation(png, { source, region, tolerance = 0 }) {
  const failures = [];
  const notes = [];
  const before = load(source);
  if (before.width !== png.width || before.height !== png.height) {
    failures.push(`the edit is ${png.width}x${png.height} and its source is `
      + `${before.width}x${before.height}: nothing can be compared`);
    return { name: 'EDIT ISOLATION', failures, notes };
  }
  const [rx, ry, rw, rh] = region.split(',').map(Number);
  let outside = 0;
  let inside = 0;
  let firstAt = null;
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const at = (y * png.width + x) * 4;
      let moved = false;
      for (let c = 0; c < 4; c += 1) {
        if (Math.abs((png.pixels[at + c] ?? 0) - (before.pixels[at + c] ?? 0)) > DRIFT) {
          moved = true;
          break;
        }
      }
      if (!moved) continue;
      const within = x >= rx && x < rx + rw && y >= ry && y < ry + rh;
      if (within) inside += 1;
      else { outside += 1; if (!firstAt) firstAt = [x, y]; }
    }
  }
  notes.push(`${inside} pixel(s) changed inside the declared region ${region}, `
    + `${outside} outside it (tolerance ${tolerance})`);
  if (inside === 0) {
    failures.push(`nothing changed inside ${region}. An edit that did not edit its own region `
      + 'is a request the model declined, not a result.');
  }
  if (outside > tolerance) {
    failures.push(`${outside} pixel(s) changed OUTSIDE the declared edit region, first at `
      + `${firstAt?.join(',')}. Companion generation differences two images to obtain a mover; `
      + 'anything else that moved between them ends up inside the mover.');
  }
  return { name: 'EDIT ISOLATION', failures, notes };
}

/* -------------------------------------------------- 6. VARIANT CONTINUITY */

/**
 * Two states of one room agree everywhere they are supposed to.
 *
 * Ruling 19a's paired gates and doc 22 item 9's state images are the same
 * shape: a sign repainted for Act III, a notice board with a funeral notice
 * added, a door that opens. What must NOT happen is the rest of the street
 * shifting between them, because the player walks from one act to the next and
 * a street that has quietly resettled reads as a different street.
 *
 * The inverse of `editIsolation` in intent and the same arithmetic: there, a
 * region that must change and a frame that must not; here, a frame that must
 * not change and a region allowed to.
 */
export function variantContinuity(png, { against, changed, tolerance = 0 }) {
  const region = changed;
  const result = editIsolation(png, { source: against, region, tolerance });
  return {
    name: 'VARIANT CONTINUITY',
    failures: result.failures.map((line) => line
      .replace('An edit that did not edit its own region', 'A variant identical to its base')
      .replace('changed OUTSIDE the declared edit region',
        'changed outside the region this variant is allowed to change')),
    notes: result.notes,
  };
}

/* ------------------------------------------------------- 4. PLATE CONTENT */

/**
 * What the ROOM GATE says must never be painted into this room's plate.
 *
 * DERIVED, NOT MEASURED, AND THE DISTINCTION IS HONEST RATHER THAN WEAK. No
 * pixel test can see that the shape at x1400 is a dog. What `tools/room-gate.mjs`
 * can do -- and already does, from doc 05, doc 49, doc 02's ledger and Part
 * Two-B's act variants -- is name every object that MUST NOT be plate, so the
 * gate here is a hard stop before a brief is written rather than a scan of a
 * finished image.
 *
 * So this returns the room gate's own sprite list as a REQUIREMENT ON THE
 * PROMPT, and the actual proof that no mover is baked in is panel A of the
 * four-panel proof: the room drawn live with its cast suppressed, where a
 * painted dog stays and a real one leaves. A pixel gate cannot do that and the
 * live frame does it by construction.
 */
export function plateContent(_png, { room }) {
  const failures = [];
  const notes = [];
  if (!room) {
    notes.push('no --room given, so nothing was derived. Pass the doc 05 room number.');
    return { name: 'PLATE CONTENT', failures, notes };
  }
  notes.push(`run: node tools/room-gate.mjs ${room}`);
  notes.push('THE PROOF IS PANEL A, NOT A PIXEL SCAN. A dog painted into the plate and a dog '
    + 'drawn as a sprite are the same pixels in a still; they differ only when the cast is '
    + 'suppressed and one of them stays. tools/gauntlet/proof.mjs takes that frame.');
  return { name: 'PLATE CONTENT', failures, notes };
}

/* ------------------------------------------------------------------ runner */

/**
 * Runs the gates that apply to `kind` and returns one verdict.
 *
 * GATE 7 (live asset provenance) AND GATES 8A-8E (scale, feet, depth extremes,
 * occlusion order, full-frame) ARE NOT HERE, and that is not an omission. Every
 * one of them is a question about the RUNNING GAME -- which file the renderer
 * took, how tall the figure came out at an authored Y, which of two overlapping
 * figures won the sort -- and a file on disk cannot answer any of them. They
 * live in tools/gauntlet/proof.mjs, against a live frame, which is where doc
 * 46 part three's "render before judging" points.
 */
export function runGates(path, options) {
  let png;
  try {
    png = load(path);
  } catch (error) {
    // AN UNREADABLE INPUT IS A FAILURE, NOT A CRASH -- and naming the reason
    // matters, because one of the reasons is a live known state rather than a
    // corrupt file. Ten backgrounds in this repository are colour type 3,
    // 320x144, indexed: the presentation errata 54 voided, recorded as doc 36
    // Q17. `readPng` handles types 2 and 6 and refuses type 3 rather than
    // guessing at a palette, which is right. A gate that stack-traced on them
    // would look like a broken tool instead of a true report about the art.
    return {
      path,
      kind: options.kind ?? null,
      passed: false,
      gates: [],
      failures: [`UNREADABLE: ${error.message}. An indexed 320x144 plate is errata 54's `
        + 'voided presentation, not a corrupt file -- doc 36 Q17 lists what is still native.'],
      at: new Date().toISOString(),
    };
  }
  const gates = [
    dimensions(png, options),
    clipping(png, options),
    keyCleanliness(png, options),
    plateContent(png, options),
  ];
  if (options.source && options.region) gates.push(editIsolation(png, options));
  if (options.against && options.changed) gates.push(variantContinuity(png, options));
  const failures = gates.flatMap((gate) => gate.failures.map((line) => `${gate.name}: ${line}`));
  return {
    path,
    kind: options.kind ?? null,
    passed: failures.length === 0,
    gates,
    failures,
    at: new Date().toISOString(),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const path = args[0];
  if (!path) {
    console.error('usage: gates.mjs <image> --kind plate|sprite [--expect WxH] '
      + '[--source <before> --region x,y,w,h] [--against <base> --changed x,y,w,h] '
      + '[--tolerance N] [--room N]');
    process.exit(2);
  }
  const options = {};
  for (let at = 1; at < args.length; at += 2) {
    options[args[at].replace(/^--/, '')] = args[at + 1];
  }
  if (options.tolerance !== undefined) options.tolerance = Number(options.tolerance);
  const result = runGates(path, options);
  console.log(`\n${result.passed ? 'PASS' : 'FAIL'}  ${path}  (kind: ${result.kind ?? 'unstated'})`);
  for (const gate of result.gates) {
    console.log(`  ${gate.failures.length === 0 ? 'ok  ' : 'FAIL'} ${gate.name}`);
    for (const note of gate.notes) console.log(`         - ${note}`);
    for (const line of gate.failures) console.log(`         x ${line}`);
  }
  // A refusal before any gate ran has no gate to print it under, and dropping
  // it left the CLI printing a bare FAIL with no reason at all.
  if (result.gates.length === 0) for (const line of result.failures) console.log(`  x ${line}`);
  console.log('\nThese gates establish TECHNICAL ADMISSIBILITY ONLY. They do not say the art is '
    + 'good, in style, funny or approved. Only Tyler sets visual_accepted.\n');
  process.exit(result.passed ? 0 : 1);
}
