#!/usr/bin/env node
/**
 * THE FOUR-PANEL ROOM PROOF: full frames from the live runtime, with a
 * manifest that says what was true when each was taken.
 *
 * WHAT IT IS FOR, IN ONE SENTENCE. Doc 46 part three: "every serious defect
 * passed all 38 validators and was found by LOOKING" -- the stacked map
 * labels, the frozen wheels, the freeze after the first mud line, Room 1's
 * cast standing in Room 2, the coach's purple wedge. A machine cannot judge a
 * picture and can absolutely PRODUCE the looking, in one batch, before anybody
 * plays anything.
 *
 * FULL FRAME FIRST, AND THAT IS A RULE RATHER THAN A PREFERENCE. A crop, an
 * isolated sprite, the generated source image, a mockup, or a screenshot of
 * the wrong room proves nothing about a room, and this project has spent
 * sessions on arguments settled by the wrong evidence -- doc 36 Q50's black
 * figure was "2,064 pure-black pixels looked conclusive until the coach's own
 * art was found to hold 2,997 of them." Crops are for diagnosing what a full
 * frame already showed, afterwards.
 *
 * THE FOUR PANELS, AND WHY EACH EXISTS
 *
 *   A  BASE STATE -- the room with its cast suppressed. THIS IS THE ONLY FRAME
 *      IN WHICH A MOVER PAINTED INTO THE PLATE IS VISIBLE, because a painted
 *      dog stays when the real ones leave. Doc 35's dog was baked into Room 2
 *      and eight companion generations went by before anybody thought to ask.
 *      It also shows reconstruction holes: where a mover was subtracted and
 *      nothing was put behind it.
 *
 *   B  NORMAL POPULATED STATE -- the room as a player meets it. The composition
 *      question, and the one only Tyler can answer.
 *
 *   C  DEPTH / OCCLUSION STRESS -- the protagonist at the room's OWN authored
 *      far and near marks, and at its authored occlusion mark. Gates 8A-8D.
 *
 *   D  PRINCIPAL CHANGED STATE -- the room after its main state change, so a
 *      variant nobody has looked at since it was authored is looked at.
 *
 * AND IT FAILS RATHER THAN REPORTING. Wrong room, a state not reached, a route
 * that hangs, a missing panel, a missing actor, an unexpected asset hash, a
 * stub or fallback used, or a capture that does not correspond to the commit
 * it claims -- each ends the run non-zero. A proof that degrades into a
 * partial report is a proof whose green means "some of it worked".
 *
 * WHAT IT DOES NOT ESTABLISH: that the art is good, in style, funny, or
 * approved. Doc 44's first honesty, permanently. Only Tyler sets
 * visual_accepted.
 *
 * Usage: node tools/gauntlet/proof.mjs <room id> [--out proofs/<room>]
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

import { browser } from '../lib/chromium.mjs';
import { ROOT, readJson, roomWidth } from '../lib/content.mjs';
import { runRoute } from './route.mjs';

const PORT = 5198;
const WINDOW = { width: 1920, height: 1080 };
const NATIVE = { width: 1920, height: 1080 };

/**
 * How closely a rendered figure must match the room's own scale curve.
 *
 * FOUR PIXELS, AND IT IS A ROUNDING BUDGET RATHER THAN A TOLERANCE FOR BEING
 * WRONG. `heightIn` rounds to whole pixels, `ActorSprite.draw` rounds the
 * destination rect, and the silhouette measured out of a composed frame can
 * lose a row at each end to a resampled edge. Anything larger than that is the
 * curve and the drawing disagreeing, which is Q34 -- the protagonist drew at a
 * third of his size for a week and every check passed.
 */
const SCALE_TOLERANCE = 4;

/**
 * How far the rendered soles may sit from the authoritative feet position.
 *
 * THE SAME FOUR PIXELS, FOR THE SAME REASON, and this is the assertion Q34
 * needed: he "floated 175 px above his feet". Measured from the FRAME, not
 * from the projection -- reading the anchor arithmetic back would be that
 * arithmetic agreeing with itself.
 */
const FEET_TOLERANCE = 4;

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

function git(...args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
}

export async function serve() {
  const child = spawn('npm', ['run', 'dev', '--', '--port', String(PORT), '--strictPort'],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  let said = '';
  child.stdout.on('data', (chunk) => { said += String(chunk); });
  child.stderr.on('data', (chunk) => { said += String(chunk); });
  let exited = null;
  child.on('exit', (code) => { exited = code; });
  const url = `http://127.0.0.1:${PORT}`;
  const deadline = Date.now() + 45_000;
  for (;;) {
    if (exited !== null) throw new Error(`dev exited with ${exited}\n${said}`);
    try {
      const answer = await fetch(`${url}/`, { signal: AbortSignal.timeout(2000) });
      if (answer.ok) break;
    } catch { /* not listening yet */ }
    if (Date.now() > deadline) {
      child.kill('SIGTERM');
      throw new Error(`dev never answered on ${url}\n${said}`);
    }
    await new Promise((wake) => setTimeout(wake, 250));
  }
  return { url, stop: () => child.kill('SIGTERM') };
}

/* ------------------------------------------------------- measuring a frame */

/** RGBA pixels of a PNG data URL, through the project's own reader. */
async function decode(dataUrl) {
  const { readPng } = await import('../lib/png.mjs');
  return readPng(Buffer.from(dataUrl.split(',')[1], 'base64'));
}

/**
 * The silhouette of whatever differs between two frames of the same room.
 *
 * THIS IS THE INDEPENDENT MEASUREMENT AND IT IS THE WHOLE POINT OF PANEL A.
 * The probe reports the rectangle the renderer computed; comparing that with a
 * height the harness derives from the same curve would be two copies of one
 * arithmetic agreeing (R5i). Differencing the populated frame against the
 * cast-suppressed frame measures the PIXELS -- what is actually on the screen
 * -- and that is a genuinely separate witness.
 *
 * Bounded to a search box so two figures in one frame do not merge into one
 * silhouette.
 */
function silhouette(populated, base, box, exclude = []) {
  let minX = box.x + box.width; let minY = box.y + box.height;
  let maxX = -1; let maxY = -1; let changed = 0;
  for (let y = box.y; y < box.y + box.height; y += 1) {
    if (y < 0 || y >= populated.height) continue;
    for (let x = box.x; x < box.x + box.width; x += 1) {
      if (x < 0 || x >= populated.width) continue;
      // A prop drawn beside the figure is measured on its own, not as her.
      if (exclude.some((e) => x >= e.x && x < e.x + e.width && y >= e.y && y < e.y + e.height)) continue;
      const at = (y * populated.width + x) * 4;
      const drift = Math.abs(populated.pixels[at] - base.pixels[at])
        + Math.abs(populated.pixels[at + 1] - base.pixels[at + 1])
        + Math.abs(populated.pixels[at + 2] - base.pixels[at + 2]);
      // 24 across three channels is eight levels a channel: above the noise a
      // lamp's flicker puts into a still frame, well below a figure.
      if (drift < 24) continue;
      changed += 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1,
    bottom: maxY, right: maxX, changed };
}

/* ------------------------------------------------------------- the marks */

/**
 * The room's OWN authored depth and occlusion marks. Gate 8C.
 *
 * NOT COORDINATES THIS TOOL CHOOSES, and the difference matters more than it
 * looks. A testing agent picking convenient points measures the curve where it
 * is comfortable and reports that as the room's behaviour; the room's extremes
 * are where a curve is wrong -- errata 28a put Room 2's scaling snap at the
 * boardwalk lip precisely because the extremes were what read badly.
 *
 * Taken from the walk boxes' own `scaleMode`, which is where the author wrote
 * them: `farY`/`nearY` ARE the authored extremes of that box.
 */
export function depthMarks(room) {
  const boxes = (room.walkBoxes ?? []).filter((box) => (box.points ?? []).length > 0);
  if (!boxes.length) return [];
  const extent = (box) => {
    const ys = box.points.map((point) => point.y);
    return { top: Math.min(...ys), bottom: Math.max(...ys) };
  };
  // THE ROOM'S EXTREMES, NOT EACH BOX'S. Every mud box in Room 2 carries the
  // same curve, so a mark per box would be one authored fact photographed
  // seven times while the band's actual back and front went untested.
  const far = boxes.reduce((best, box) => (extent(box).top < extent(best).top ? box : best));
  const near = boxes.reduce((best, box) => (extent(box).bottom > extent(best).bottom ? box : best));
  const marks = [];
  const add = (box, kind, y) => {
    if (marks.some((one) => one.y === y)) return;
    marks.push({ box: box.id, kind, y, xs: xSpanAt(box, y), expect: heightIn(box, y) });
  };
  // One row inside the band, because the boundary row itself is the edge of a
  // polygon and a point-in-polygon test is entitled to answer either way there.
  add(far, 'far', extent(far).top + 1);
  add(near, 'near', extent(near).bottom - 1);
  return marks;
}

/**
 * The x values inside `box` at row `y`, coarsely sampled.
 *
 * THE DEPTH AXIS IS THE AUTHORED ONE; X IS NOT. Gate 8C forbids a testing
 * agent choosing convenient DEPTHS, because a curve is wrong at its extremes
 * and comfortable in the middle. Which x along an authored row the figure
 * stands at is not a depth choice at all -- it is finding a spot on the floor
 * at a row the author fixed -- so the proof samples across the box and uses
 * the first the engine accepts, and records which.
 */
function xSpanAt(box, y) {
  const xs = box.points.map((point) => point.x);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const out = [];
  for (let at = 0; at <= 8; at += 1) {
    out.push(Math.round(left + ((right - left) * at) / 8));
  }
  // Middle outward: the centre of a quad is inside it far more often than a
  // corner is, and the first accepted sample is the one used.
  return out.sort((one, two) => Math.abs(one - (left + right) / 2)
    - Math.abs(two - (left + right) / 2));
}

/**
 * The room's own declared height at a row.
 *
 * DELIBERATELY THE WEAKER OF THE TWO WITNESSES, and it is here so the stronger
 * one has something to be compared against. This reads the same JSON the
 * engine reads, through different code, so agreement means the engine
 * implements the file -- useful, and short of proof, because both could be
 * describing a curve nobody wants. The strong witness is the SILHOUETTE
 * measured out of the composed frame, which is pixels rather than arithmetic.
 *
 * Kept in step with engine/core/WalkBoxes.ts heightIn by being three lines
 * long and saying so.
 */
function heightIn(box, y) {
  const mode = box.scaleMode;
  if (!mode) return null;
  if (mode.kind === 'fixed') return mode.height;
  if (mode.beyondY !== undefined && mode.beyondHeight !== undefined && y < mode.farY) {
    const up = mode.farY - mode.beyondY;
    if (up <= 0) return mode.beyondHeight;
    const walk = Math.max(0, Math.min(1, (y - mode.beyondY) / up));
    return Math.round(mode.beyondHeight + (mode.farHeight - mode.beyondHeight) * walk);
  }
  const span = mode.nearY - mode.farY;
  if (span === 0) return mode.nearHeight;
  const walk = Math.max(0, Math.min(1, (y - mode.farY) / span));
  return Math.round(mode.farHeight + (mode.nearHeight - mode.farHeight) * walk);
}

/**
 * Where the room says a figure should be occluded, and by what.
 *
 * A ROOM WITH NO `occlusionPlanes` HAS NO OCCLUSION TO PROVE, and the proof
 * says so rather than inventing a mark. Doc 35 section 4 asks "which objects
 * should occlude the actor" as a gate question; a room that has not answered
 * it has an authoring gap, not a test to run.
 */
export function occlusionMarks(room) {
  const planes = room.occlusionPlanes ?? [];
  if (!planes.length) return { marks: [], orphans: [], pending: [] };
  const orphans = [];
  const pending = [];
  for (const box of room.walkBoxes ?? []) {
    if (!box.clipPlane) continue;
    if (!planes.some((plane) => plane.level === box.clipPlane)) {
      orphans.push(`${box.id} declares clipPlane ${box.clipPlane} and this room's planes are `
        + `${planes.map((plane) => plane.level).join(', ')}`);
    }
  }
  // THE POINTS ARE THE AUTHOR'S, NOT THIS TOOL'S. Gate 8C's argument applied
  // one level down: a testing agent picking a spot to stand measures the room
  // where standing is convenient, and occlusion is wrong at the edges of a
  // mask rather than in the middle of one. `occlusionProofs` is written in the
  // annotation beside the clip planes themselves, so the point and the plane
  // it is meant to prove were decided together.
  const marks = [];
  for (const proof of room.occlusionProofs ?? []) {
    const plane = planes.find((candidate) => candidate.level === proof.expect);
    if (!plane) continue;
    if (plane.maskPending) {
      // NOT SKIPPED SILENTLY. A pending mask is one the renderer deliberately
      // does not use, so asserting that it occludes would fail on a decision
      // somebody made -- and omitting the point without saying so would let
      // the plane disappear from the record entirely.
      pending.push(`plane ${plane.level} (${plane.mask}) is maskPending, so the point at `
        + `${proof.at.join(',')} is not asserted: the renderer is skipping that mask on `
        + 'purpose while it is regenerated');
      continue;
    }
    const box = (room.walkBoxes ?? []).find((candidate) => {
      const xs = candidate.points.map((point) => point.x);
      const ys = candidate.points.map((point) => point.y);
      return proof.at[0] >= Math.min(...xs) && proof.at[0] <= Math.max(...xs)
        && proof.at[1] >= Math.min(...ys) && proof.at[1] <= Math.max(...ys);
    });
    marks.push({
      box: box?.id ?? proof.box ?? '?',
      level: proof.expect,
      mask: plane.mask,
      y: proof.at[1],
      // A SINGLE AUTHORED x, not a scan. `xSpanAt` exists because a depth mark
      // names a ROW and any point on it will do; an occlusion point names a
      // place, and sliding along the row to find one the engine accepts would
      // slide off the thing it is meant to be standing behind.
      xs: [proof.at[0]],
      note: proof.note ?? null,
    });
  }
  return { marks, orphans, pending };
}

/* ------------------------------------------------------------------- main */

async function main() {
  const roomId = process.argv[2];
  if (!roomId) {
    console.error('usage: proof.mjs <room id> [--out dir]');
    return 2;
  }
  // WHERE A PROOF LANDS, AND WHY IT IS SPLIT IN TWO. Tyler's policy: raw
  // full-resolution captures are TEST ARTIFACTS, not canonical renders, and
  // are reproducible by one command -- so they go in an ignored subdirectory
  // and the repository keeps the two things that carry the claims: the
  // manifest, and one compact four-panel sheet.
  //
  // The arithmetic behind it: a full 1920x1080 frame is ~2.9MB, a proof is
  // five or six of them, and forty rooms is roughly 700MB of blobs git deltas
  // badly, against a repository that is 279MB today.
  const outDir = process.argv.includes('--out')
    ? process.argv[process.argv.indexOf('--out') + 1] : `renders/proofs/${roomId.replace(/_/g, '-')}`;
  const rawDir = `${outDir}/raw-captures-ignored`;

  const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
  const commit = git('rev-parse', 'HEAD');
  const dirty = git('status', '--porcelain');
  // A CAPTURE FROM A DIRTY TREE DOES NOT CORRESPOND TO THE COMMIT IT NAMES,
  // and a proof whose frames and whose SHA describe different code is the one
  // kind of evidence that is worse than none: it is wrong and it is citable.
  // `--allow-dirty` exists because the tool has to be runnable while it is
  // being written, and it is RECORDED in the manifest rather than merely
  // permitted, so a proof taken that way says so wherever it is read.
  const allowDirty = process.argv.includes('--allow-dirty');
  // --state <name>: the room's authored visual state for this proof (errata
  // 64d), selected the way a candidate plate is -- by URL, for one page load.
  const visualState = process.argv.includes('--state')
    ? process.argv[process.argv.indexOf('--state') + 1] : null;

  // RULING 10: A STAGED CANDIDATE, LOADED INTO THE LIVE RUNTIME, BEFORE ANYONE
  // ACCEPTS IT.
  //
  //   npm run proof <room> --candidate art/backgrounds/x.png=art/staging/room-05/plate-03.png
  //
  // The override is a URL parameter and touches no file, so the tree the
  // manifest names is the tree the frames were taken from -- which is the
  // whole reason the mechanism is not a swap-in-place.
  //
  // A CANDIDATE IS NOT AN APPROVAL. Nothing below sets or implies
  // visual_accepted; the proof establishes technical admissibility of a
  // picture, and whether it is any good is Tyler's and only his.
  const candidates = [];
  for (let at = 0; at < process.argv.length; at += 1) {
    if (process.argv[at] !== '--candidate') continue;
    const raw = process.argv[at + 1];
    const split = raw ? raw.indexOf('=') : -1;
    if (split <= 0 || split === raw.length - 1) {
      console.error('--candidate needs from=to, e.g.\n'
        + '  --candidate art/backgrounds/room-05-assay-office.png=art/staging/room-05/plate-03.png');
      return 2;
    }
    const from = raw.slice(0, split);
    const to = raw.slice(split + 1);
    if (!to.startsWith('art/staging/')) {
      console.error(`--candidate may only point at a staged file and "${to}" is not under `
        + 'art/staging/. A candidate is by definition not shipping art, and promotion is the '
        + 'only route out of staging.');
      return 2;
    }
    if (!existsSync(resolve(ROOT, to))) {
      console.error(`--candidate names ${to}, which does not exist`);
      return 2;
    }
    candidates.push({ from, to, hash: sha(readFileSync(resolve(ROOT, to))) });
  }

  const manifest = readJson('content/manifest.json');
  const room = manifest.rooms.map((path) => readJson(path)).find((one) => one.id === roomId);
  if (!room) {
    console.error(`no room "${roomId}" in the manifest`);
    return 2;
  }
  const specPath = `proofs/spec/${roomId.replace(/_/g, '-')}.json`;
  if (!existsSync(resolve(ROOT, specPath))) {
    console.error(`\nno proof spec at ${specPath}.\n\n`
      + 'A proof needs to be told two things it cannot derive: how to GET to the room, and\n'
      + 'what its PRINCIPAL state change is. Both are authorship. Neither is guessed here --\n'
      + 'a proof that picked a state change for itself would photograph whichever one it\n'
      + 'found first and call it the room\'s main one.\n');
    return 2;
  }
  const spec = readJson(specPath);

  mkdirSync(resolve(ROOT, outDir), { recursive: true });
  mkdirSync(resolve(ROOT, rawDir), { recursive: true });
  const failures = [];
  const panels = [];
  const server = await serve();
  const engine = await browser();
  let page;
  try {
    page = await engine.newPage({ viewport: WINDOW });
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(String(error.message)));
    page.on('console', (message) => {
      if (message.type() === 'error') pageErrors.push(message.text());
    });
    // ARMED BEFORE NAVIGATION. The draw record is only kept while the watch is
    // on -- R5h, nobody pays for the instrument when nobody is reading it --
    // and a proof that armed after boot would photograph frames with no
    // record behind them.
    await page.addInitScript(() => {
      const install = () => {
        if (!window.__gauntlet) return false;
        window.__gauntlet.arm({});
        return true;
      };
      if (!install()) {
        const timer = setInterval(() => { if (install()) clearInterval(timer); }, 4);
      }
    });
    const query = [
      ...candidates.map((entry) => `candidate=${encodeURIComponent(`${entry.from}=${entry.to}`)}`),
      ...(visualState ? [`state=${encodeURIComponent(visualState)}`] : []),
    ].join('&');
    await page.goto(query ? `${server.url}/?${query}` : server.url);

    const probe = () => page.evaluate(() => window.__gauntlet?.probe() ?? null);
    /** Every frame taken, in order, for the one committed sheet. */
    const captures = [];
    const snap = async (name) => {
      const url = await page.evaluate(() => window.__gauntlet?.snapshot() ?? null);
      if (!url) throw new Error(`no frame captured for panel ${name}`);
      const bytes = Buffer.from(url.split(',')[1], 'base64');
      // THE RAW FRAME IS THE EVIDENCE AND IT IS NOT COMMITTED. Its hash goes
      // into proof.json, so a frame regenerated later can be compared against
      // the one the record describes -- which is what the hash is for and is
      // strictly more than a stored copy proves.
      writeFileSync(resolve(ROOT, rawDir, `${name}.png`), bytes);
      captures.push({ name, url });
      // `url` is handed back for differencing and is NEVER spread into the
      // manifest: three megabytes of base64 per panel turned proof.json into
      // an 11MB file nobody could open, which is a record that has stopped
      // being readable and has therefore stopped being a record.
      return { url, file: `raw-captures-ignored/${name}.png`, hash: sha(bytes) };
    };

    /** Everything true at the moment a panel was taken. */
    const state = async (name, extra = {}) => {
      const frame = await probe();
      if (!frame) throw new Error(`panel ${name}: the probe answered nothing`);
      if (frame.room !== roomId) {
        throw new Error(`panel ${name}: the game is in "${frame.room}", not "${roomId}". `
          + 'A capture from the wrong room is the one piece of evidence that looks exactly '
          + 'like the right one.');
      }
      const stubs = Object.entries(frame.movers)
        .filter(([, mover]) => mover.drawn !== 'sprite' || mover.fallback)
        .map(([id, mover]) => `${id}: ${mover.drawn}${mover.fallback ? ' (fallback pose)' : ''}`);
      const missing = frame.assets.filter((asset) => !asset.loaded).map((asset) => asset.path);
      return {
        panel: name,
        room: frame.room,
        clock: frame.clock,
        beat: frame.beat,
        control: frame.control,
        camera: frame.camera,
        flags: frame.flags,
        counters: frame.counters,
        inventory: frame.inventory,
        movers: frame.movers,
        // WHAT WAS ON THE SENTENCE LINE, and how many choices were up. A
        // panel taken after a LOOK carries the line it produced, which is how
        // a principal change that is a hotspot appearing gets its evidence.
        says: frame.says,
        options: frame.options,
        assets: frame.assets.map((asset) => ({
          ...asset,
          // HASHED ON DISK, BY THE HARNESS, AND HASHED AT `drawn` RATHER THAN
          // AT `path`. The browser reports which URL it actually resolved;
          // only this side can say what is in that file, and "the right path
          // holding the wrong bytes" is a stale asset. Under a ruling-10
          // candidate override the two differ, and the one that describes the
          // captured frame is the one that was drawn.
          hash: existsSync(resolve(ROOT, asset.drawn ?? asset.path))
            ? sha(readFileSync(resolve(ROOT, asset.drawn ?? asset.path)))
            : null,
        })),
        stubs,
        missingAssets: missing,
        controlWrites: await page.evaluate(() => window.__gauntlet?.controls.writes() ?? []),
        capturedAt: new Date().toISOString(),
        ...extra,
      };
    };

    /* ---- get there ------------------------------------------------------ */

    const routePath = spec.route ? `tools/gauntlet/routes/${spec.route}.json` : null;
    let routeLog = [];
    if (routePath && existsSync(resolve(ROOT, routePath))) {
      try {
        routeLog = await runRoute(page, readJson(routePath));
      } catch (error) {
        for (const line of error.routeLog ?? []) console.log(`    ${line}`);
        throw new Error(`the route to ${roomId} did not arrive: ${error.message}`);
      }
    } else {
      // NO ROUTE MEANS THE CONTROL, AND THE MANIFEST SAYS SO. Entering by
      // control is legitimate evidence about the room and is NOT evidence that
      // the room is reachable; conflating those is how a room nobody can walk
      // to gets photographed and signed off.
      const answer = await page.evaluate((id) => window.__gauntlet?.controls.enter(id),
        roomId);
      if (!answer?.ok) throw new Error(`could not enter ${roomId}: ${answer?.why}`);
      routeLog = [`entered ${roomId} by control -- NOT proof that a player can reach it`];
      await page.waitForTimeout(2500);
    }
    // Let deferred sheets arrive: a proof of a room whose people have not
    // loaded yet is a proof about the loader.
    await page.waitForTimeout(spec.settleMs ?? 3000);

    /* ---- PANEL B: normal populated --------------------------------------- */

    const panelBshot = await snap('panel-b-populated');
    const panelB = await state('B', { intent: 'normal populated state' });
    panels.push({ ...panelB, file: panelBshot.file, hash: panelBshot.hash });

    /* ---- PANEL A: base state, cast suppressed ---------------------------- */

    await page.evaluate(() => window.__gauntlet?.controls.cast(false));
    await page.waitForTimeout(600);
    const panelAshot = await snap('panel-a-base');
    const panelA = await state('A', { intent: 'base state, cast suppressed' });
    panels.push({ ...panelA, file: panelAshot.file, hash: panelAshot.hash });

    /* ---- AMBIENT FIGURES: drawn, and masked where they say they are ------ */
    //
    // Movers are measured at authored marks below. A room's AMBIENT people
    // never move, so they are measured where they stand, once, by the same
    // difference: panel B (populated) against panel A (cast suppressed) in
    // the box the sprite declares. Two assertions, both of which Room 5's
    // Winnie is the first to need: she DREW at all -- a sheet that did not
    // arrive draws nothing and looks like an empty room -- and, when she
    // declares an occlusion plane, the drawn part of her stops ABOVE her
    // feet, because the counter is in front of her. An ambient drawn to the
    // floor while claiming a plane is a mask that missed.
    const ambientFigures = [];
    {
      const populatedB = await decode(panelBshot.url);
      const baseA = await decode(panelAshot.url);
      const ambientIds = room.ambient ?? [];
      for (const path of manifest.ambient ?? []) {
        const npc = readJson(path);
        if (!ambientIds.includes(npc.id) || !npc.sprite?.frames?.length) continue;
        const [, , fw, fh] = npc.sprite.frames[0];
        const camera = panelB.camera ?? 0;
        const box = { x: Math.round(npc.x - fw / 2 - camera), y: npc.y - fh, width: fw, height: fh + 2 };
        // Her props stand where she stands; each is measured in its own box
        // and cut out of hers, so her lowest row is HER lowest row.
        const propBoxes = (npc.sprite.props ?? []).map((prop) => {
          const [, , pw, ph] = prop.frames[0];
          return { x: Math.round(prop.x - pw / 2 - camera), y: prop.y - ph + 1, width: pw, height: ph + 2 };
        });
        const seen = silhouette(populatedB, baseA, box, propBoxes);
        const record = { id: npc.id, feet: [npc.x, npc.y], sheet: npc.sprite.sheet,
          clipPlane: npc.clipPlane ?? null, box, seen };
        const contactSpec = spec?.ambientContact?.[npc.id];
        record.props = propBoxes.map((propBox, at) => {
          const prop = npc.sprite.props[at];
          const propSeen = silhouette(populatedB, baseA, propBox);
          const want = contactSpec?.props?.[at]?.lowestDrawnRowWithin;
          const out = { sheet: prop.sheet, at: [prop.x, prop.y], box: propBox, seen: propSeen, expected: want ?? null };
          if (!propSeen) failures.push(`ambient ${npc.id}: prop ${prop.sheet} drew nothing at ${prop.x},${prop.y}`);
          else if (want && (propSeen.bottom < want[0] || propSeen.bottom > want[1])) {
            failures.push(`ambient ${npc.id}: prop ${prop.sheet} lowest row y${propSeen.bottom} is outside its `
              + `contact band y${want[0]}-${want[1]} -- it is not standing on the surface`);
          } else if (propSeen) {
            console.log(`    ambient ${npc.id}: prop ${prop.sheet} drawn ${propSeen.width}x${propSeen.height}, `
              + `lowest row y${propSeen.bottom}${want ? ` inside y${want[0]}-${want[1]}` : ''}`);
          }
          return out;
        });
        if (!seen) {
          failures.push(`ambient ${npc.id}: nothing drew in its box at ${npc.x},${npc.y} -- the `
            + `sheet ${npc.sprite.sheet} did not arrive, or she stands off-camera`);
          ambientFigures.push({ kind: 'ambient', ...record });
          continue;
        }
        // A BEHIND-COUNTER SHEET HAS NO FEET. When the spec declares where the
        // figure RESTS -- the band of plate rows its lowest drawn pixel must
        // land in (the ledger's page, for Winnie's hands) -- that is the
        // assertion: drawn to the surface and not past it, which is both
        // "the hands are not floating" and "the skirt is not leaking" in one
        // number. The feet-clearance rule below stays for figures placed by
        // their feet behind a masking plane.
        const contact = spec?.ambientContact?.[npc.id];
        if (contact) {
          const [low, high] = contact.lowestDrawnRowWithin;
          record.contact = { expected: contact.lowestDrawnRowWithin, lowestDrawnRow: seen.bottom };
          if (seen.bottom < low || seen.bottom > high) {
            failures.push(`ambient ${npc.id}: lowest drawn row y${seen.bottom} is outside the declared `
              + `contact band y${low}-${high} (${contact.why ?? 'proofs/spec'}) -- floating above it or `
              + 'leaking below it');
          } else {
            console.log(`    ambient ${npc.id}: drawn ${seen.width}x${seen.height}, lowest row y${seen.bottom} `
              + `inside the contact band y${low}-${high}`);
          }
        } else if (npc.clipPlane) {
          const clearance = npc.y - seen.bottom;
          if (clearance < 8) {
            failures.push(`ambient ${npc.id}: declares clipPlane ${npc.clipPlane} and is drawn to `
              + `y${seen.bottom}, ${clearance}px from its feet at y${npc.y}. The plane did not mask `
              + 'it: the counter is behind her, not in front.');
          } else {
            record.maskedAbove = seen.bottom;
            console.log(`    ambient ${npc.id}: drawn ${seen.width}x${seen.height}, cut off at y${seen.bottom}, `
              + `${clearance}px above her feet -- plane ${npc.clipPlane} is masking`);
          }
        }
        ambientFigures.push({ kind: 'ambient', ...record });
      }
    }

    if (Object.keys(panelA.movers).length > 0) {
      const stillDrawn = Object.entries(panelA.movers)
        .filter(([, mover]) => mover.bounds !== null).map(([id]) => id);
      if (stillDrawn.length) {
        failures.push(`panel A: ${stillDrawn.join(', ')} still drew with the cast suppressed`);
      }
    }
    await page.evaluate(() => window.__gauntlet?.controls.cast(true));
    await page.waitForTimeout(600);

    /* ---- PANEL C: depth and occlusion stress ----------------------------- */

    const heroId = readJson(manifest.actor).id;

    /**
     * One capture and its OWN base, taken at the same camera.
     *
     * THE BASE FRAME CANNOT BE PANEL A's, AND THIS COST A REWRITE. Main Street
     * is 3700 across with the camera following, so standing the protagonist at
     * the far mark scrolls the view and every pixel of panel A is then over a
     * different part of the street. Differencing the two would report the whole
     * frame as changed and call it a silhouette 864px tall -- a number that
     * looks like a measurement, is nothing of the kind, and would have made the
     * scale gate agree with anything.
     *
     * So the cast is suppressed and restored around each mark, which costs two
     * captures per mark and buys a difference in which the only thing that
     * moved is the people.
     */
    const pairAt = async (name, hero, frame) => {
      const shot = await snap(name);
      await page.evaluate(() => window.__gauntlet?.controls.cast(false));
      await page.waitForTimeout(350);
      const bare = await page.evaluate(() => window.__gauntlet?.snapshot() ?? null);
      await page.evaluate(() => window.__gauntlet?.controls.cast(true));
      await page.waitForTimeout(350);
      if (!bare) return { shot, seen: null };
      const populated = await decode(shot.url);
      const base = await decode(bare);
      const bounds = hero?.bounds;
      // Bounded to a box around where the renderer says he is, so an ambient
      // figure standing nearby cannot join his silhouette.
      const search = bounds
        ? { x: bounds[0] - 20 - frame.camera, y: bounds[1] - 20,
          width: bounds[2] + 40, height: bounds[3] + 40 }
        : { x: 0, y: 0, width: populated.width, height: populated.height };
      return { shot, seen: silhouette(populated, base, search) };
    };

    const marks = depthMarks(room);
    const { marks: occluders, orphans, pending } = occlusionMarks(room);
    for (const line of orphans) {
      failures.push(`gate 8D: ${line}. Renderer.masked() looks a plane up by level and draws `
        + 'straight through when it finds none, so this room\'s masks load and occlude nobody.');
    }
    if (marks.length === 0) {
      failures.push(`${roomId} declares no walk box with a curve, so there are no AUTHORED `
        + 'depth extremes to test. Gate 8C forbids picking convenient ones instead.');
    }
    const measured = [];
    for (const mark of marks) {
      let placed = null;
      let usedX = null;
      for (const x of mark.xs) {
        placed = await page.evaluate(([px, py]) => window.__gauntlet?.controls.stand(px, py),
          [x, mark.y]);
        if (placed?.ok) { usedX = x; break; }
      }
      if (!placed?.ok) {
        failures.push(`panel C: no x along the authored ${mark.kind} row y${mark.y} of `
          + `${mark.box} is on the floor -- tried ${mark.xs.join(', ')}. ${placed?.why}`);
        continue;
      }
      mark.x = usedX;
      await page.waitForTimeout(400);
      const frame = await probe();
      const hero = frame.movers[heroId];
      if (!hero) { failures.push(`panel C: the protagonist is not among the movers`); continue; }
      const { shot, seen } = await pairAt(`panel-c-${mark.box}-${mark.kind}`, hero, frame);
      measured.push({
        mark, at: hero.at, reportedHeight: hero.height, expected: mark.expect,
        drawnFrom: hero.from, bounds: hero.bounds, order: hero.order,
        renderedHeight: seen?.height ?? null, renderedBottom: seen?.bottom ?? null,
        file: shot.file,
      });
      // 8A: the RENDERED height against the room's own curve.
      if (mark.expect !== null && Math.abs(hero.height - mark.expect) > SCALE_TOLERANCE) {
        failures.push(`gate 8A: at the authored ${mark.kind} mark of ${mark.box} `
          + `(${mark.x},${mark.y}) the runtime drew him ${hero.height}px against the room's `
          + `own curve saying ${mark.expect}px`);
      }
      if (seen && Math.abs(seen.height - hero.height) > hero.height * 0.25) {
        failures.push(`gate 8A: at ${mark.box}/${mark.kind} the runtime reports ${hero.height}px `
          + `and the FRAME shows a silhouette ${seen.height}px tall. The report and the picture `
          + 'disagree, which is the state Q34 shipped in for a week.');
      }
      // 8B: the rendered soles against the authoritative feet position.
      if (seen && Math.abs(seen.bottom - mark.y) > FEET_TOLERANCE) {
        failures.push(`gate 8B: his feet are authoritatively at y${mark.y} and the drawn `
          + `silhouette bottoms out at y${seen.bottom} -- ${Math.abs(seen.bottom - mark.y)}px `
          + 'of float. Q34 shipped 175px of exactly this.');
      }
      if (hero.drawn !== 'sprite' || hero.fallback) {
        failures.push(`gate 7: at ${mark.box}/${mark.kind} he drew as "${hero.drawn}"`
          + `${hero.fallback ? ' with a fallback pose' : ''}, not as the clip that was asked for`);
      }
    }
    // 8A: monotonic with depth, across the marks this room actually authored.
    const byY = [...measured].sort((one, two) => one.mark.y - two.mark.y);
    for (let at = 1; at < byY.length; at += 1) {
      if (byY[at].reportedHeight < byY[at - 1].reportedHeight) {
        failures.push(`gate 8A: height does not increase with depth -- y${byY[at - 1].mark.y} `
          + `drew ${byY[at - 1].reportedHeight}px and y${byY[at].mark.y}, nearer the camera, `
          + `drew ${byY[at].reportedHeight}px`);
      }
    }

    /* ---- 8D: occlusion order at an authored mark -------------------------- */

    const occlusion = [];
    for (const mark of occluders) {
      let placed = null;
      for (const x of mark.xs) {
        placed = await page.evaluate(([px, py]) => window.__gauntlet?.controls.stand(px, py),
          [x, mark.y]);
        if (placed?.ok) { mark.x = x; break; }
      }
      if (!placed?.ok) {
        failures.push(`panel C: no x along ${mark.box}'s occlusion row y${mark.y} is on the `
          + `floor -- tried ${mark.xs.join(', ')}. ${placed?.why}`);
        continue;
      }
      await page.waitForTimeout(400);
      const frame = await probe();
      const hero = frame.movers[heroId];
      const { shot, seen } = await pairAt(`panel-c-occlusion-${mark.box}`, hero, frame);
      const bounds = hero?.bounds;
      // GEOMETRIC OVERLAP FIRST. "He drew behind the trough" is not a claim
      // worth making at a spot where he and the trough do not share a pixel;
      // the mask would be doing nothing and the test would pass on nothing.
      const covered = bounds && seen
        ? 1 - (seen.changed / (seen.width * seen.height || 1)) : null;
      occlusion.push({
        mark, clipLevel: hero?.clipLevel ?? null, mask: mark.mask,
        reportedBounds: bounds, renderedSilhouette: seen, cutShare: covered, file: shot.file,
      });
      if (hero && hero.clipLevel !== mark.level) {
        failures.push(`gate 8D: standing in ${mark.box}, whose clipPlane is ${mark.level}, the `
          + `runtime drew him through plane ${hero.clipLevel}`);
      }
      if (!seen) {
        failures.push(`gate 8D: at ${mark.box}'s occlusion mark nothing differs from the base `
          + 'frame at all -- either he is not drawn or the mask erased him entirely');
      }
    }
    for (const line of pending) console.log(`    NOTE: ${roomId} ${line}`);
    if (occluders.length === 0 && orphans.length === 0 && pending.length === 0) {
      // NOT A FAILURE, AND SAID OUT LOUD RATHER THAN OMITTED. A room with no
      // occlusion planes has an authoring gap against doc 35 section 4; a
      // proof that quietly skipped the panel would let the gap travel.
      console.log(`    NOTE: ${roomId} declares no occlusionPlanes, so gate 8D asserted `
        + 'nothing. Doc 35 section 4 asks which objects should occlude the actor; this room '
        + 'has not answered.');
    }

    /* ---- PANEL D: principal changed state --------------------------------- */

    if (!spec.principalChange) {
      failures.push(`${specPath} declares no principalChange, so panel D cannot be taken. `
        + 'Which state change is a room\'s PRINCIPAL one is authorship, not a thing to guess.');
    } else {
      const change = spec.principalChange;
      // THE STATE MUST NOT ALREADY BE THE STATE. A panel D whose flag was
      // already set is panel B under another filename, and it is the panel
      // most likely to be believed without being looked at -- it shows a
      // plausible room and proves nothing about the change it is named after.
      for (const [flag, want] of Object.entries(change.flags ?? {})) {
        const already = typeof want === 'number' ? panelB.counters[flag] : panelB.flags.includes(flag);
        if (already === want) {
          failures.push(`panel D: ${flag} was ALREADY ${want} when panel B was taken, so the `
            + 'principal change has nothing to change. Either the route goes too far or this '
            + 'is not the room\'s principal change.');
        }
      }
      if (change.flags) {
        const answer = await page.evaluate((values) => window.__gauntlet?.controls.flags(values),
          change.flags);
        if (!answer?.ok) {
          failures.push(`panel D: the flag registry declares no ${answer?.refused.join(', ')}`);
        }
      }
      if (change.actions?.length) {
        try {
          routeLog.push(...await runRoute(page, { actions: change.actions }));
        } catch (error) {
          for (const line of error.routeLog ?? []) console.log(`    ${line}`);
          failures.push(`panel D: reaching the changed state failed -- ${error.message}`);
        }
      }
      await page.waitForTimeout(1200);
      const shot = await snap('panel-d-changed');
      const panelD = await state('D', { intent: `principal changed state: ${change.note ?? ''}` });
      panels.push({ ...panelD, file: shot.file, hash: shot.hash });
      // THE STATE MUST ACTUALLY BE REACHED. A panel D taken before the change
      // landed is panel B with a different filename, and it is the panel most
      // likely to be believed without being looked at.
      for (const [flag, want] of Object.entries(change.flags ?? {})) {
        const got = typeof want === 'number' ? panelD.counters[flag] : panelD.flags.includes(flag);
        if (got !== want) {
          failures.push(`panel D: ${flag} is ${got}, wanted ${want} -- the intended state was `
            + 'not reached and the frame is of the old one');
        }
      }
      // AN ACTION-DRIVEN CHANGE HAS TO HAVE CHANGED SOMETHING, and there is no
      // flag to check it by. A route can run every action, hit nothing, and
      // leave a panel D identical to panel B -- which is exactly the click
      // that "landed on nothing, wrote no flag, and held the beat to its 180s
      // deadline" in doc 36 Q67, one layer up. So: the flags, the inventory or
      // the frame itself must differ, and the manifest says which did.
      const declaredFlags = Object.keys(change.flags ?? {}).length;
      const declaredActions = (change.actions ?? []).length;
      if (declaredFlags === 0 && declaredActions === 0) {
        // A CHANGE THAT DECLARES NOTHING IS NOT A CHANGE. This has to be a
        // failure rather than a skip: panel D would otherwise be panel B with
        // the actor standing somewhere else, and the frame hash WOULD differ
        // -- because this harness moved him for panel C. A difference the
        // instrument caused is the one difference that proves nothing (R5h).
        failures.push(`panel D: ${specPath}'s principalChange declares neither flags nor `
          + 'actions, so nothing was done and nothing can have changed. Note what the change '
          + 'IS, and if it is not reachable today say that -- an unreachable change is a '
          + 'finding, and an undeclared one is a gap in the spec.');
      } else {
        // WHAT ACTUALLY MOVED, and the frame is deliberately not on the list.
        const flagsMoved = panelD.flags.join() !== panelB.flags.join();
        const countersMoved = JSON.stringify(panelD.counters) !== JSON.stringify(panelB.counters);
        const heldMoved = panelD.inventory.join() !== panelB.inventory.join();
        if (!flagsMoved && !countersMoved && !heldMoved) {
          failures.push('panel D: after the principal change ran, not one flag, counter or '
            + 'inventory item differs from panel B. The change went nowhere, and this is '
            + 'panel B twice under another filename.');
        }
        panelD.changedBy = [flagsMoved && 'flags', countersMoved && 'counters',
          heldMoved && 'inventory'].filter(Boolean).join(', ') || 'nothing';
      }
      // Written onto the RECORD, not onto a local the push already copied.
      const stored = panels[panels.length - 1];
      if (stored) stored.changedBy = panelD.changedBy ?? null;
    }

    for (const panel of panels) {
      if (panel.stubs.length) {
        failures.push(`panel ${panel.panel}: a stub or fallback drew -- ${panel.stubs.join('; ')}`);
      }
      if (panel.missingAssets.length) {
        failures.push(`panel ${panel.panel}: declared asset(s) never loaded -- `
          + panel.missingAssets.join(', '));
      }
      const expected = [room.background, room.foreground].filter(Boolean);
      for (const path of expected) {
        if (!panel.assets.some((asset) => asset.path === path)) {
          failures.push(`panel ${panel.panel}: the room declares ${path} and the runtime did `
            + 'not report it among its assets');
        }
      }
    }
    // RULING 10: THE RUN FAILS IF A REQUESTED CANDIDATE WAS NOT ACTUALLY DRAWN.
    //
    // Not warned about, not noted -- failed. The silent fallback is the thing
    // being designed against: a typo, a stale path, or a loader that quietly
    // reached for the shipping file would produce four beautiful frames of the
    // OLD picture, pass every other gate, and be filed as a proof of the
    // candidate. Nothing else in the manifest would contradict it.
    //
    // Asserted per panel, because a candidate that loaded for panel A and not
    // for panel D is exactly as wrong and much harder to see.
    for (const wanted of candidates) {
      for (const panel of panels) {
        const asset = panel.assets.find((entry) => entry.path === wanted.from);
        if (!asset) {
          failures.push(`panel ${panel.panel}: a candidate was requested for ${wanted.from} `
            + 'and the runtime does not report that asset at all');
          continue;
        }
        if (!asset.candidate || asset.drawn !== wanted.to) {
          failures.push(`panel ${panel.panel}: the candidate ${wanted.to} was requested for `
            + `${wanted.from} and the runtime drew ${asset.drawn ?? asset.path}. The proof `
            + 'refuses to fall back to shipping art silently.');
          continue;
        }
        if (!asset.loaded) {
          failures.push(`panel ${panel.panel}: the candidate ${wanted.to} was resolved and `
            + 'never loaded, so the room drew without it');
          continue;
        }
        if (asset.hash !== wanted.hash) {
          failures.push(`panel ${panel.panel}: ${wanted.to} hashed `
            + `${wanted.hash.slice(0, 12)} when the run began and `
            + `${String(asset.hash).slice(0, 12)} when the frame was taken -- it changed `
            + 'underneath the proof');
        }
      }
    }
    for (const error of pageErrors) failures.push(`page error: ${error}`);

    // EVERY PANEL, OR IT IS NOT A FOUR-PANEL PROOF. A run that quietly
    // produced three is a run whose green covers whichever one is missing.
    for (const wanted of ['A', 'B', 'D']) {
      if (!panels.some((panel) => panel.panel === wanted)) {
        failures.push(`panel ${wanted} was never captured`);
      }
    }
    if (measured.length === 0 && occlusion.length === 0) {
      failures.push('panel C captured nothing: no authored depth mark and no occlusion mark '
        + 'was reached, so the depth and occlusion gates asserted nothing at all');
    }
    if (dirty !== '' && !allowDirty) {
      failures.push(`the working tree is dirty, so these frames do not correspond to `
        + `${commit.slice(0, 8)}. Commit, or re-run with --allow-dirty, which records it.`);
    }

    /* ---- the manifest ----------------------------------------------------- */

    const record = {
      schema: 1,
      note: 'A FOUR-PANEL FULL-FRAME LIVE-RUNTIME PROOF. Technical admissibility only: '
        + 'nothing here says the art is good, in style, funny or approved. Only Tyler sets '
        + 'visual_accepted.',
      room: roomId,
      roomWidth: roomWidth(room),
      branch,
      commit,
      // A CAPTURE FROM A DIRTY TREE DOES NOT CORRESPOND TO ITS COMMIT, and
      // saying so is the difference between a record and a claim.
      workingTreeClean: dirty === '',
      dirtyAllowed: allowDirty,
      uncommitted: dirty ? dirty.split('\n') : [],
      // WHAT WAS ACTUALLY RENDERED, when it was not the shipping asset.
      // Empty on an ordinary proof, which is the common case and says so.
      visualState: visualState ?? null,
      candidates: candidates.map((entry) => ({
        declared: entry.from,
        rendered: entry.to,
        hash: entry.hash,
        note: 'A STAGED CANDIDATE, NOT AN APPROVAL. It passed the technical gates and it has '
          + 'been drawn by the real runtime. Whether it ships is Tyler\'s, and promotion is a '
          + 'separate, logged step.',
      })),
      route: spec.route ?? null,
      routeLog,
      depthMarks: measured,
      occlusion,
      // Ambient figures measured where they stand (drawn, and masked where
      // they declare a plane). Their own field: they are not walk-box marks.
      ambientFigures,
      panels,
      failures,
      passed: failures.length === 0,
      visual_accepted: false,
      visualAcceptedNote: 'Set by Tyler and by nobody else. A passing proof means the room is '
        + 'technically admissible, not that it is any good.',
      at: new Date().toISOString(),
    };
    // THE ONE COMMITTED PICTURE. Composed in the browser that took the frames,
    // because it is the only image encoder this project has and adding one for
    // proof compression would be a dependency bought to shrink a test artifact.
    const sheet = await contactSheet(page, captures);
    if (sheet) {
      writeFileSync(resolve(ROOT, outDir, `contact-sheet.${sheet.ext}`), sheet.bytes);
      record.contactSheet = { file: `contact-sheet.${sheet.ext}`, format: sheet.ext,
        bytes: sheet.bytes.length, panels: captures.length, scale: sheet.scale };
    } else {
      failures.push('the contact sheet could not be composed, so the one image this proof '
        + 'commits does not exist');
    }
    record.passed = failures.length === 0;
    record.failures = failures;
    writeFileSync(resolve(ROOT, outDir, 'proof.json'), `${JSON.stringify(record, null, 1)}\n`);
    writeFileSync(resolve(ROOT, outDir, 'index.html'), page1(record));

    console.log(`\n=== ${roomId} -- ${panels.length} panel(s), ${measured.length} depth mark(s), `
      + `${occlusion.length} occlusion mark(s)`);
    for (const line of routeLog) console.log(`    ${line}`);
    for (const line of failures) console.log(`FAIL ${line}`);
    console.log(`\nproof: ${outDir}/index.html`);
    console.log(failures.length === 0 ? `PASS  ${roomId} is technically admissible.`
      : `FAIL  ${roomId}: ${failures.length} failure(s).`);
    if (!record.workingTreeClean) {
      console.log('      ! the working tree was dirty, so these frames do not correspond to '
        + `${commit.slice(0, 8)}. Recorded in the manifest.`);
    }
    return failures.length === 0 ? 0 : 1;
  } finally {
    if (page) await page.close().catch(() => {});
    await engine.close();
    server.stop();
  }
}

/**
 * THE FOUR-PANEL SHEET: every complete frame, tiled, in one compact file.
 *
 * COMPOSED IN THE BROWSER THAT TOOK THE FRAMES. Chromium encodes WebP and JPEG
 * and this project already runs Chromium to capture anything at all, so the
 * sheet costs no dependency -- and buying an image library to compress a test
 * artefact would be paying a permanent price for a temporary file.
 *
 * DOWNSCALED, NEVER CROPPED, and the distinction is the whole rule. A crop of a
 * room proves nothing about the room: doc 36 Q50's black figure was decided by
 * 2,064 pixels that turned out to be beside the point. Every panel here is the
 * complete 1920x864 play area, at half scale, side by side -- so what a person
 * looks at is still the frame, and the raw captures behind it are one command
 * away when a detail needs a closer look.
 *
 * WebP FIRST, JPEG SECOND, and it tries rather than assumes: `toDataURL` for an
 * unsupported type silently returns a PNG, which would land a 12MB file under a
 * `.webp` name and look exactly like success.
 */
export async function contactSheet(page, captures) {
  if (!captures.length) return null;
  const SCALE = 0.5;
  const made = await page.evaluate(async ({ frames, scale }) => {
    const images = await Promise.all(frames.map(({ url }) => new Promise((done, fail) => {
      const image = new Image();
      image.onload = () => done(image);
      image.onerror = () => fail(new Error('a captured frame would not decode'));
      image.src = url;
    })));
    const cols = Math.min(2, images.length);
    const rows = Math.ceil(images.length / cols);
    const cellW = Math.round(images[0].width * scale);
    const cellH = Math.round(images[0].height * scale);
    const pad = 8;
    const label = 22;
    const canvas = document.createElement('canvas');
    canvas.width = cols * cellW + (cols + 1) * pad;
    canvas.height = rows * (cellH + label) + (rows + 1) * pad;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#14141a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    images.forEach((image, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = pad + col * (cellW + pad);
      const y = pad + row * (cellH + label + pad);
      ctx.fillStyle = '#e8e8ee';
      ctx.font = '15px system-ui, sans-serif';
      ctx.fillText(frames[index].name, x, y + 15);
      ctx.drawImage(image, x, y + label, cellW, cellH);
    });
    for (const [type, ext] of [['image/webp', 'webp'], ['image/jpeg', 'jpg']]) {
      const url = canvas.toDataURL(type, 0.9);
      // toDataURL FALLS BACK TO PNG SILENTLY for a type it cannot encode, so
      // the answer is checked rather than trusted: a 12MB PNG under a .webp
      // name is indistinguishable from success until somebody opens it.
      if (url.startsWith(`data:${type}`)) return { ext, url };
    }
    return null;
  }, { frames: captures, scale: SCALE });
  if (!made) return null;
  return { ext: made.ext, bytes: Buffer.from(made.url.split(',')[1], 'base64'), scale: SCALE };
}

/** The page a person actually looks at. */
function page1(record) {
  const cards = record.panels.map((panel) => `
  <figure>
    <img src="${panel.file}" alt="" onerror="this.replaceWith(Object.assign(
      document.createElement('p'), { className: 'gone', textContent:
      'raw capture not committed -- regenerate with: npm run proof ' + ${JSON.stringify(record.room)} }))">
    <figcaption><b>PANEL ${panel.panel} &mdash; ${panel.intent}</b>
      <span>room ${panel.room} &middot; camera ${panel.camera} &middot;
        flags ${panel.flags.join(' ') || 'none'} &middot;
        inventory ${panel.inventory.join(' ') || 'none'}</span>
      <span>${Object.entries(panel.movers).map(([id, mover]) =>
    `${id} @${mover.at.join(',')} ${mover.height}px ${mover.drawn}`).join(' &middot; ') || 'no movers'}</span>
    </figcaption>
  </figure>`).join('');
  const depth = record.depthMarks.map((one) => `
  <figure>
    <img src="${one.file}" alt="">
    <figcaption><b>PANEL C &mdash; ${one.mark.box} ${one.mark.kind}, authored y${one.mark.y}</b>
      <span>expected ${one.expected}px &middot; runtime ${one.reportedHeight}px &middot;
        silhouette ${one.renderedHeight ?? '-'}px, bottom y${one.renderedBottom ?? '-'}</span>
      <span>${one.drawnFrom ?? 'NO SPRITE FILE'}</span>
    </figcaption>
  </figure>`).join('');
  const occ = record.occlusion.map((one) => `
  <figure>
    <img src="${one.file}" alt="">
    <figcaption><b>PANEL C &mdash; occlusion, ${one.mark.box} plane ${one.mark.level}</b>
      <span>mask ${one.mask} &middot; drew through plane ${one.clipLevel}</span>
    </figcaption>
  </figure>`).join('');
  return `<!DOCTYPE html><meta charset="utf-8">
<title>${record.room} — room proof</title>
<style>
 body{background:#14141a;color:#e8e8ee;font:14px/1.5 system-ui,sans-serif;margin:0;padding:20px}
 h1{font-size:17px;margin:0 0 4px}
 p.lede{color:#9a9aae;margin:0 0 8px;max-width:64em}
 .verdict{font:13px ui-monospace,monospace;padding:8px 10px;border-radius:5px;margin:12px 0;
   background:${record.passed ? '#12331e' : '#3a1620'};border:1px solid ${record.passed ? '#2c6b40' : '#7a2c3c'}}
 figure{margin:0 0 22px}
 img{width:100%;display:block;border-radius:5px;border:1px solid #2c2c38}
 figcaption{padding:7px 2px;font-size:13px}
 figcaption span{display:block;color:#8a8a9e;font:11.5px ui-monospace,monospace}
 .sheet img{border-color:#4a6ea8}
 p.gone{color:#8a8a9e;font:12px ui-monospace,monospace;border:1px dashed #3a3a48;
   border-radius:5px;padding:14px;margin:0}
 code{color:#c9b58a}
</style>
<h1>${record.room} — four-panel live-runtime proof</h1>
<p class="lede">Every frame below is the full play area as the renderer drew it, in the running
game, at <code>${record.commit.slice(0, 8)}</code> on <code>${record.branch}</code>.
No crop, isolated sprite or source image appears here: those are for diagnosing what a full
frame has already shown.</p>
<p class="lede"><b>These panels establish technical admissibility only.</b> Nothing here says the
art is good, in style, funny or approved. Only Tyler sets <code>visual_accepted</code>.</p>
<figure class="sheet">
  <img src="${record.contactSheet ? record.contactSheet.file : ''}" alt="">
  <figcaption><b>THE COMMITTED SHEET</b><span>Every panel, complete, at
    ${record.contactSheet ? Math.round(record.contactSheet.scale * 100) : '-'}% &mdash;
    downscaled, never cropped. The full-resolution captures are reproducible test artifacts
    and are not in git; their hashes are below.</span></figcaption>
</figure>
<div class="verdict">${record.passed ? 'PASS — technically admissible'
    : `FAIL — ${record.failures.length} failure(s):\n  ${record.failures.join('\n  ')}`}${
  record.workingTreeClean ? '' : '\n\n! working tree was dirty: these frames do not correspond to the commit above.'}</div>
${cards}${depth}${occ}
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then((code) => process.exit(code), (error) => {
    console.error(error instanceof Error ? error.stack : String(error));
    process.exit(1);
  });
}
