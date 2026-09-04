import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { browser } from '../lib/chromium.mjs';

import { readJson, ROOT } from '../lib/content.mjs';
import { clickPoint, validateScript } from './schema.mjs';

/**
 * THE GAUNTLET. Doc 44.
 *
 * Plays the opening in a browser and compares what the game does against what
 * a person wrote down that it should do. A failure names the beat, the mover,
 * and what differed.
 *
 * TWO RUNS, NOT ONE, AND THAT IS R5h. An instrument can change the system, not
 * only report on it -- BODY_ONE_OWNER was dismissed on the theory that the
 * harness had perturbed the timing, and it had not, but it could have. So the
 * opening is played twice: once with the per-frame watch armed and the probe
 * being read twenty times a second, and once with neither. Every beat's
 * measured duration must agree between them. A timing that only holds while
 * it is being measured is not a timing.
 *
 * THE NEGATIVES COME FROM INSIDE THE DRAW LOOP. `engine/dev/Watch.ts` records
 * a violation the moment it happens; this drains the log. Polling could not
 * do it: the black figure lived in the first second and a half of a new game,
 * and the play-through that failed to see it was one that waited for the game
 * to be ready -- exactly the apparatus that cannot observe a first-frame
 * fault.
 *
 * `--smoke` is the other half: the BUILT artifact, screencast from
 * navigation, no state assertions at all, because `import.meta.env.DEV`
 * strips the probe from production. It catches a build that does not boot,
 * which is the one class of fault only the artifact has.
 */

const SAMPLE_MS = 50;
const BOOT_TIMEOUT_MS = 45_000;
// Fixed and out of the way of anything a person has open, with --strictPort so
// a clash fails loudly instead of landing on a port nobody is watching.
const DEV_PORT = 5199;
const PREVIEW_PORT = 4199;

const args = process.argv.slice(2);
const SMOKE = args.includes('--smoke');
const KEEP = args.includes('--keep-open');

const NATIVE = { width: 1920, height: 864 };
const WINDOW = { width: 1920, height: 1080 };

main().then((code) => process.exit(code), (error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});

async function main() {
  if (SMOKE) return smoke();

  const scripts = readdirSync(resolve(ROOT, 'tools/gauntlet'))
    .filter((name) => name.endsWith('.json'));
  let failed = 0;
  for (const name of scripts) {
    const script = readJson(`tools/gauntlet/${name}`);
    const sequence = readJson(`content/sequences/${script.sequence}.json`);
    const { errors, coverage } = validateScript(script, sequence);
    if (errors.length) {
      console.log(`FAIL  ${name} is not a valid script:`);
      for (const message of errors) console.log(`      x ${message}`);
      failed += 1;
      continue;
    }
    if (await runScript(name, script, coverage)) continue;
    failed += 1;
  }
  console.log('');
  console.log(failed === 0 ? 'GAUNTLET: green.' : `GAUNTLET: ${failed} script(s) failed.`);
  return failed === 0 ? 0 : 1;
}

/* ------------------------------------------------------------------ server */

/**
 * `npm run dev`, or `npm run preview` for the built artifact.
 *
 * A FIXED PORT, POLLED -- NOT THE SERVER'S OWN OUTPUT, PARSED.
 *
 * THIS IS WHY THE GAUNTLET NEVER ONCE RAN IN CI. It used to read the URL out
 * of vite's banner with a regex. GitHub Actions sets CI=true, vite then emits
 * colour, and it BOLDS THE PORT:
 *
 *     http://localhost:\x1b[1m5173\x1b[22m/
 *
 * so the escape sequence sits between the colon and the digits and
 * `:\d+` can never match. Locally CI is unset, vite emits no colour, the URL
 * is contiguous and the regex matches every time. Ten consecutive CI runs
 * failed in thirty seconds with "dev did not print a URL" while every local
 * run was green -- which is exactly what checks.yml's own header describes and
 * exists to prevent, reproduced one job over.
 *
 * Asking the SERVER whether it is up removes the parse entirely. Nothing about
 * how vite decorates its banner can break it, and `--strictPort` makes it fail
 * loudly rather than quietly landing somewhere else.
 *
 * AND IT KEEPS WHAT THE SERVER SAID. The old failure reported only that no URL
 * appeared, so diagnosing it needed the run log, the job id and three tool
 * calls. This prints the output, which is where the answer was the whole time.
 */
async function serve(mode, port) {
  const child = spawn('npm', ['run', mode, '--', '--port', String(port), '--strictPort'],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  let said = '';
  const keep = (chunk) => { said += String(chunk); };
  child.stdout.on('data', keep);
  child.stderr.on('data', keep);

  let exited = null;
  child.on('exit', (code) => { exited = code; });

  const url = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + BOOT_TIMEOUT_MS;
  for (;;) {
    if (exited !== null) {
      throw new Error(`${mode} exited with ${exited}\n--- what it said ---\n${said}`);
    }
    try {
      const answer = await fetch(`${url}/`, { signal: AbortSignal.timeout(2000) });
      if (answer.ok) break;
    } catch { /* not listening yet */ }
    if (Date.now() > deadline) {
      child.kill('SIGTERM');
      throw new Error(`${mode} never answered on ${url} within ${BOOT_TIMEOUT_MS}ms`
        + `\n--- what it said ---\n${said}`);
    }
    await new Promise((wake) => setTimeout(wake, 250));
  }
  return { url, stop: () => child.kill('SIGTERM') };
}

/* -------------------------------------------------------------- the script */

async function runScript(name, script, coverage) {
  const server = await serve('dev', DEV_PORT);
  const engine = await browser();
  try {
    console.log(`\n=== ${name} -- ${coverage.checked} of ${coverage.total} beats assert something`);
    // NO SILENT CAPS. What is not covered is printed before the result, not
    // after it, so a reader meets the limits before they meet the verdict.
    for (const line of coverage.unscripted) console.log(`    not checked -- ${line}`);

    const armed = await play(engine, server.url, script, true);
    report(armed);

    // R5h: the same run without the instrument, for the timings alone.
    console.log('    --- again, with no instrument in the loop (R5h)');
    const bare = await play(engine, server.url, script, false);
    const drift = timingDrift(armed, bare, script);
    for (const line of drift.lines) console.log(line);

    const ok = armed.failures.length === 0 && armed.violations.length === 0 && drift.ok;
    console.log(ok ? `PASS  ${name}` : `FAIL  ${name}`);
    return ok;
  } finally {
    if (!KEEP) await engine.close();
    server.stop();
  }
}

/**
 * One play-through.
 *
 * `armed` switches the per-frame watch and the probe on. When it is false the
 * run drives the same inputs, samples nothing but the beat boundary, and
 * exists only to time the beats without an instrument in the loop.
 */
async function play(engine, url, script, armed) {
  const page = await engine.newPage({ viewport: WINDOW });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error.message)));
  page.on('console', (message) => {
    if (message.type() === 'error') pageErrors.push(message.text());
  });

  // ARMED BEFORE NAVIGATION FINISHES, not after the scene is up. The whole
  // point of recording inside the draw loop is to catch the frames nobody has
  // ever seen, and a harness that arms after boot is one that waits for the
  // game to be ready.
  await page.addInitScript((config) => {
    const install = () => {
      const handle = window.__gauntlet;
      if (!handle) return false;
      if (config) handle.arm(config);
      else handle.disarm();
      return true;
    };
    if (!install()) {
      const timer = setInterval(() => { if (install()) clearInterval(timer); }, 4);
    }
  }, armed ? { band: script.band, bandExempt: script.bandExempt ?? [] } : null);

  await page.goto(url);

  const state = {
    failures: [],
    violations: [],
    pageErrors,
    beats: new Map(),
    fired: new Set(),
    missed: [],
    timings: [],
    // Beats whose end THIS HARNESS caused. See timingDrift.
    driven: new Set(),
  };
  await sample(page, script, state, armed);

  // A BEAT NEVER ENTERED HAS MARKS NEVER FIRED, and `checkLeaving` cannot see
  // them because it runs on a boundary that never happened. Swept here so a
  // run that ends early cannot report clean on the beats it never reached.
  if (armed) {
    for (const beat of script.beats) {
      for (const [index, mark] of (beat.marks ?? []).entries()) {
        if (state.fired.has(`${beat.beat}#${index}`)) continue;
        if (state.missed.some((miss) => miss.beat === beat.beat && miss.mark === index)) continue;
        state.missed.push({ beat: beat.beat, mark: index, note: mark.note,
          when: JSON.stringify(mark.when) });
      }
    }
  }

  const log = armed ? await page.evaluate(() => window.__gauntlet?.violations() ?? null) : null;
  if (log) {
    state.violations = log.violations;
    state.droppedViolations = log.dropped;
    state.violationCounts = log.counts;
  }
  await page.close();
  return state;
}

/**
 * The sampling loop: read the probe, notice beat changes, fire marks.
 *
 * Frame-accurate for the negatives and sample-accurate for the positives, and
 * doc 44 says which is which. A mark fires on the first SAMPLE at which its
 * condition holds, so an expectation about a state that exists for less than
 * one sample interval is one this cannot see. That is a real limit of the
 * positive half and the reason the negative half is not built this way.
 */
async function sample(page, script, state, armed) {
  const byBeat = new Map(script.beats.map((beat) => [beat.beat, beat]));
  const stop = script.until;
  let previous = null;
  let previousSegment = null;
  let enteredAt = 0;
  let lastClips = new Map();
  let moved = new Set();
  const driven = state.driven;
  /** The input script in flight, if one is. Kept so the run can await it. */
  let driving = null;
  const started = Date.now();
  const deadline = started + 180_000;

  for (;;) {
    if (Date.now() > deadline) {
      state.failures.push({ beat: previous ?? '-', who: '-', field: 'run',
        expected: `to reach beat ${stop?.beat ?? '?'}`, got: 'a 180s timeout', note: '' });
      return;
    }
    const frame = await page.evaluate(() => window.__gauntlet?.probe() ?? null);
    if (!frame) {
      await page.waitForTimeout(SAMPLE_MS);
      continue;
    }
    const now = (Date.now() - started) / 1000;

    if (frame.beat !== previous) {
      if (previous !== null) {
        const held = now - enteredAt;
        state.beats.set(previous, held);
        // Printed as it happens, not collected: a harness that says nothing
        // for three minutes and then reports a timeout tells you only that it
        // timed out. This says where it got to.
        console.log(`    ${armed ? 'with' : 'without'} · beat ${previous} `
          + `held ${held.toFixed(2)}s`);
        const spec = byBeat.get(previous);
        if (spec) {
          checkLeaving(spec, state, held, script);
          if (armed) fireMarks(spec, 'leave', frame, state, script, now - enteredAt);
        }
        if (stop && stop.beat === previous && stop.on === 'leave') {
          await driving;
          return;
        }
      }
      previous = frame.beat;
      enteredAt = now;
      lastClips = new Map();
      moved = new Set();
      const spec = frame.beat !== null ? byBeat.get(frame.beat) : undefined;
      if (spec && armed) fireMarks(spec, 'enter', frame, state, script, 0);
      if (stop && stop.beat === frame.beat && stop.on === 'enter') {
        await driving;
        return;
      }
      // An observable beat with its own input drives it here; an unobservable
      // one is driven by its segment above. `driven` stops a beat that is
      // both from being played twice.
      if (spec?.input?.length && !driven.has(spec.beat)) {
        driven.add(spec.beat);
        // ERRORS RECORDED, NOT SWALLOWED. This used to `.catch(() => {})`,
        // so an input script that threw halfway left the run looking merely
        // quiet -- the same silence the option-not-on-the-list skip had.
        driving = drive(page, spec.input, script, spec.beat, state).catch((error) => {
          state.failures.push({ beat: spec.beat, who: '-', field: 'input',
            expected: 'the input script to run', got: String(error.message ?? error),
            note: '' });
        });
      }
    }

    // A BEAT WAITING FOR THE PLAYER DRIVES ITS OWN INPUT, and it has to,
    // because a held beat is no longer reported as playing.
    //
    // `CarriedBeats.current` used to return a beat that was armed and holding
    // on its `awaitFlag`, so the harness saw "beat 9" the moment the carrier
    // armed it and fired beat 9's input -- which clicks the lamp, which writes
    // T_HOB_SPOKEN, which is what releases the hold. It worked by accident:
    // the beat was reported as playing before it had dispatched a single step,
    // which is not what doc 44 says `beat` means and made a correct wait
    // indistinguishable from a hang.
    //
    // Reporting it honestly deadlocked this: beat 9 could not enter until the
    // lamp was clicked, and the lamp could not be clicked until beat 9
    // entered. The fix is not to go back to the imprecise report -- it is to
    // notice that A BEAT WAITING FOR THE PLAYER IS EXACTLY WHEN THE PLAYER'S
    // INPUT IS WANTED, which is what `waitingBeat` says and `beat` never did.
    if (frame.waitingBeat) {
      const held = byBeat.get(frame.waitingBeat);
      if (held?.input?.length && !driven.has(held.beat)) {
        driven.add(held.beat);
        driving = drive(page, held.input, script, held.beat, state).catch((error) => {
          state.failures.push({ beat: held.beat, who: '-', field: 'input',
            expected: 'the input script to run', got: String(error.message ?? error),
            note: '' });
        });
      }
    }

    // A SEGMENT DRIVES ITS OWN INPUT, BECAUSE A BEAT MAY NOT BE OBSERVABLE.
    // The driver's tree carries beats 4, 5 and 6 and no runner holds any of
    // them, so `frame.beat` is null for the whole conversation. Watching for
    // beat 4 to appear meant waiting for something that never happens: the
    // first run of this harness sat through its own 180s deadline at beat 3.
    const segmentId = frame.segment ? frame.segment.beats.join(',') : null;
    if (segmentId !== previousSegment) {
      previousSegment = segmentId;
      for (const id of frame.segment?.beats ?? []) {
        const owner = byBeat.get(id);
        if (owner?.input?.length && !driven.has(id)) {
          driven.add(id);
          // NOT AWAITED, AND THAT IS THE FIX FOR A BEAT NOBODY SAW. The last
          // action of the driver's tree is a three-second wait, and beat 6b --
          // the coach's whole departure -- plays inside it. Awaiting the input
          // script stopped the sampler for its entire length, so the harness
          // was blind for exactly as long as it had told itself to be patient.
          // Playwright serialises calls on a page, so the two interleave
          // safely.
          driving = drive(page, owner.input, script, id, state).catch((error) => {
            state.failures.push({ beat: id, who: '-', field: 'input',
              expected: 'the input script to run', got: String(error.message ?? error),
              note: '' });
          });
          break;
        }
      }
    }

    const spec = frame.beat !== null ? byBeat.get(frame.beat) : undefined;
    if (spec && armed) {
      const elapsed = now - enteredAt;
      for (const [who, mover] of Object.entries(frame.movers)) {
        const was = lastClips.get(who);
        if (was !== mover.clip) {
          lastClips.set(who, mover.clip);
          fireMarks(spec, 'clip', frame, state, script, elapsed, { who, clip: mover.clip });
        }
        if (mover.moving) moved.add(who);
        else if (moved.has(who)) {
          moved.delete(who);
          fireMarks(spec, 'settled', frame, state, script, elapsed, { who });
        }
      }
      if (frame.says) fireMarks(spec, 'says', frame, state, script, elapsed);
      fireMarks(spec, 'seconds', frame, state, script, elapsed);
    }

    // The opening is over and nothing named it as the end: stop rather than
    // spin. `until` should have caught this, so it is reported.
    if (frame.handedOver && frame.beat === null && Date.now() - started > 5_000
      && !stop) return;

    await page.waitForTimeout(SAMPLE_MS);
  }
}

/** Runs a beat's input list against the page. `beat` and `state` are for reporting. */
async function drive(page, input, script, beat, state) {
  for (const action of input) {
    if (action.do === 'wait') {
      await page.waitForTimeout(action.seconds * 1000);
      continue;
    }
    if (action.do === 'click') {
      // `on` READS THE RECT; `at` RESTATES ONE. Beat 9's click was the literal
      // centre of the lamp as it stood two moves of Hob ago, and when he moved
      // it landed on nothing, wrote no flag, and held the beat to its 180s
      // deadline -- twice, one merge apart. The rect is the thing; the number
      // beside it was a copy, and a copy of something that moves goes wrong
      // silently. R5k.
      const { point, error } = clickPoint(script, action);
      if (error) throw new Error(`input: ${error}`);
      await clickPlayArea(page, point[0], point[1]);
      continue;
    }
    // A LINE ON SCREEN TAKES THE CLICK BEFORE THE OPTION LIST DOES, and it
    // must: the player has to see "Hotel's five." land before "I have four."
    // does. So a queued response is flushed first, one click each, or the
    // click meant to choose an option is spent advancing a line and the
    // conversation never moves. Bounded, so a queue that will not drain
    // reports rather than spins.
    for (let guard = 0; guard < 12; guard += 1) {
      const queued = await page.evaluate(() => window.__gauntlet?.probe()?.pending ?? 0);
      if (queued === 0) break;
      await clickPlayArea(page, NATIVE.width / 2, NATIVE.height / 2);
      await page.waitForTimeout(120);
    }

    // A SELECTION IS NOW PERFORMED, SO THE LIST IS NOT ALWAYS THERE. Doc 30
    // step 2 hides the choices while an exchange plays and takes their
    // hitboxes with them, which is the whole point -- a click meant for the
    // next question can no longer land on the answer to the last one.
    //
    // THIS IS WHAT THE HARNESS HAD TO LEARN, and the first run after the
    // change is what taught it: every click after the first found no row,
    // `continue`d, and the run timed out at 180s having never left the tree.
    // `options` cannot answer it either -- what changed is whether the rows
    // are on SCREEN, not whether the runner would list them.
    //
    // It skips the click rather than advancing it: doc 30 4.2 gives a click
    // during an exchange to the utterance, and a harness that clicked through
    // one would be testing the skip path every time instead of the
    // performance.
    for (let guard = 0; guard < 400; guard += 1) {
      const busy = await page.evaluate(() => window.__gauntlet?.probe()?.performing === true);
      if (!busy) break;
      await page.waitForTimeout(120);
    }

    // AN INDEX INTO WHAT IS ON THE LIST NOW, and the list can grow. Errata 37
    // is revoked so nothing is ever removed and a used row dims and stays --
    // but the stage driver's EXIT is gated on the other three having been
    // asked, so his list is three rows and then four. An index is still stable
    // under both, because nothing reorders and nothing disappears; a text
    // match would not be, and would also put dialogue in this file.
    //
    // WHICH MAKES THE INPUT'S ORDER LOAD-BEARING. Choosing 4 before 1, 2 and 3
    // asks for a row that is not there yet.
    const box = await page.evaluate((index) => {
      const scene = window.__game?.scene.getScene('game');
      const options = scene?.state?.dialogue?.presentOptions?.() ?? [];
      if (options.length < index) return null;
      const boxes = scene.view.dialogueHitboxes(options);
      const hit = boxes[index - 1];
      return hit ? { y: hit.y + hit.height / 2 } : null;
    }, action.option);
    // A SKIPPED CHOICE IS REPORTED, NOT SWALLOWED. This used to `continue` in
    // silence, so an input asking for a row that is not on the list produced a
    // run that simply did less -- and with a gated option that is the exact
    // shape of the mistake: the tree never closes, the beats after it never
    // arrive, and the report says nothing about why.
    if (!box) {
      state.timings.push(`beat ${beat}: option ${action.option} was not on the list -- `
        + 'the click was skipped. A gated option needs the ones that open it asked first');
      continue;
    }
    await clickPlayArea(page, NATIVE.width / 2, box.y);
  }
}

/**
 * A click at play-area coordinates, through whatever letterboxing is in force.
 *
 * The canvas is FIT-scaled and centred, so a click computed against the native
 * frame lands somewhere else entirely on a window that is not exactly
 * 1920x1080. Converted here rather than assumed.
 */
async function clickPlayArea(page, x, y) {
  const at = await page.evaluate(({ px, py, nativeW }) => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scale = rect.width / nativeW;
    return { x: rect.left + px * scale, y: rect.top + py * scale };
  }, { px: x, py: y, nativeW: NATIVE.width });
  if (!at) return;
  await page.mouse.click(at.x, at.y);
}

/* ------------------------------------------------------------------- marks */

function fireMarks(spec, kind, frame, state, script, elapsed, detail = {}) {
  for (const [index, mark] of (spec.marks ?? []).entries()) {
    const id = `${spec.beat}#${index}`;
    if (state.fired.has(id)) continue;
    if (!matches(mark.when, kind, detail, elapsed)) continue;
    state.fired.add(id);
    compare(spec, index, mark, frame, state, script);
  }
}

function matches(when, kind, detail, elapsed) {
  if (when.enter !== undefined) return kind === 'enter';
  if (when.leave !== undefined) return kind === 'leave';
  if (when.clip !== undefined) {
    return kind === 'clip' && detail.who === when.who && detail.clip === when.clip;
  }
  if (when.settled !== undefined) return kind === 'settled' && detail.who === when.settled;
  if (when.line !== undefined) return kind === 'says';
  if (when.seconds !== undefined) return kind === 'seconds' && elapsed >= when.seconds;
  return false;
}

/** One mark against one frame. Every difference, not the first. */
function compare(spec, index, mark, frame, state, script) {
  const fail = (who, field, expected, got, extra = '') => state.failures.push({
    beat: spec.beat, mark: index, note: mark.note, who, field, expected, got, extra,
  });

  const present = new Set(Object.keys(frame.movers));
  const named = new Set(Object.keys(mark.cast));
  for (const who of present) {
    if (!named.has(who)) fail(who, 'cast', 'not on screen', 'on screen');
  }
  for (const who of named) {
    if (!present.has(who)) fail(who, 'cast', 'on screen', 'not on screen');
  }

  for (const [who, want] of Object.entries(mark.cast)) {
    const got = frame.movers[who];
    if (!got) continue;
    if (want.at) {
      const tol = want.tol ?? script.defaults.position;
      const dx = Math.abs(got.at[0] - want.at[0]);
      const dy = Math.abs(got.at[1] - want.at[1]);
      if (dx > tol || dy > tol) {
        fail(who, 'at', `${want.at[0]}, ${want.at[1]}`, `${got.at[0]}, ${got.at[1]}`,
          `(delta ${Math.round(dx)}, ${Math.round(dy)} > tol ${tol})`);
      }
    }
    if (want.facing && want.facing !== got.facing) fail(who, 'facing', want.facing, got.facing);
    if (want.clip && want.clip !== got.clip) fail(who, 'clip', want.clip, got.clip);
    if (want.height !== undefined) {
      const tol = script.defaults.height;
      if (Math.abs(got.height - want.height) > tol) {
        fail(who, 'height', String(want.height), String(got.height), `(tol ${tol})`);
      }
    }
    if (want.moving !== undefined && want.moving !== got.moving) {
      fail(who, 'moving', String(want.moving), String(got.moving));
    }
  }

  for (const [id, want] of Object.entries(mark.overlays ?? {})) {
    const got = frame.overlays[id] ?? null;
    if (got !== want) {
      fail(id, 'overlay', want === null ? 'not drawn' : want,
        got === null ? 'not drawn' : got,
        frame.overlays[id] === undefined ? '(the engine reports no such overlay)' : '');
    }
  }

  if (mark.says !== undefined && mark.says !== frame.says) {
    fail(mark.says ?? '-', 'says', mark.says ?? 'no line', frame.says ?? 'no line');
  }
}

/** A beat that overran, and any mark of its that never fired. */
function checkLeaving(spec, state, held, script) {
  // A BEAT THAT STATES NO DURATION GETS NO CEILING. `seconds + slack` with no
  // seconds is `slack`, which handed every unstated beat a three-second limit
  // nobody wrote: beat 3 is two lines and holds 6.5s, beat 9 is a crossing and
  // three lines and holds 39s, and both were reported as overruns against a
  // number the script had never claimed. An assertion invented on the reader's
  // behalf is the same fault as a mark written from a stale table.
  //
  // What it does instead is TELL THE AUTHOR WHAT IT MEASURED, so the number
  // that goes into the script is one somebody watched rather than guessed.
  if (spec.within === undefined && spec.seconds === undefined) {
    state.timings.push(`beat ${spec.beat} held ${held.toFixed(2)}s -- no duration stated, `
      + 'so none was asserted');
    return;
  }
  const ceiling = spec.within ?? (spec.seconds + script.defaults.slack);
  if (ceiling > 0 && held > ceiling) {
    state.failures.push({ beat: spec.beat, who: '-', field: 'duration',
      expected: `<= ${ceiling}s`, got: `${held.toFixed(2)}s`, note: '' });
  }
  // A CEILING CATCHES A BEAT THAT WILL NOT END. NOTHING CAUGHT A BEAT THAT
  // STOPPED DOING ANYTHING, and that is the direction faults have actually
  // come from: beat 7 collapsed 2.14s to 0.12s when `stagingTakesTime` was
  // wrong, and beat 2 -- doc 17's "he climbs down, straightens his coat,
  // looks at the town", stated at ~8s -- now holds 0.87s and passed in
  // silence, because an eighth of its time is comfortably under the ceiling.
  //
  // REPORTED AND NOT ASSERTED, DELIBERATELY. Beat 2 is short for reasons
  // everybody knows: straighten-coat is unbuilt, the driver cannot climb
  // aboard, and main has since moved his walk into beat 3 on purpose. A floor
  // would go red on a tree whose incompleteness is not news, which is R5j --
  // and a red that everyone knows to ignore is worse than no red at all. So
  // it says what it measured, next to what the script claimed, and lets a
  // person decide whether a beat has gone hollow or is merely not finished.
  if (spec.seconds !== undefined && held < spec.seconds / 2) {
    state.timings.push(`beat ${spec.beat} held ${held.toFixed(2)}s against a stated `
      + `${spec.seconds}s -- not asserted, but that is ${Math.round(held / spec.seconds * 100)}% `
      + 'of the beat somebody wrote down');
  }
  for (const [index, mark] of (spec.marks ?? []).entries()) {
    if (state.fired.has(`${spec.beat}#${index}`)) continue;
    if (mark.when.leave !== undefined) continue;
    state.missed.push({ beat: spec.beat, mark: index, note: mark.note,
      when: JSON.stringify(mark.when) });
  }
}

/* ------------------------------------------------------------------ output */

function report(state) {
  for (const violation of state.violations) {
    console.log(`FAIL beat ${violation.beat ?? '-'} · frame ${violation.frame} `
      + `· ${violation.kind} · ${violation.who}`);
    console.log(`     ${violation.detail}`);
  }
  if (state.droppedViolations) {
    console.log(`     (${state.droppedViolations} further violation(s) counted and not kept)`);
  }
  // Printed before the failures: these are measurements offered to whoever is
  // writing the script, not complaints about the game.
  for (const line of state.timings) console.log(`     ${line}`);
  for (const miss of state.missed) {
    console.log(`FAIL beat ${miss.beat} · mark ${miss.mark} never fired`);
    console.log(`     when ${miss.when}`);
    console.log(`     note ${miss.note}`);
  }
  for (const failure of state.failures) {
    const head = failure.mark === undefined
      ? `FAIL beat ${failure.beat} · ${failure.who}`
      : `FAIL beat ${failure.beat} · mark ${failure.mark} "${failure.note}" · ${failure.who}`;
    console.log(head);
    console.log(`     ${String(failure.field).padEnd(9)} expected ${failure.expected}`
      + `   got ${failure.got} ${failure.extra ?? ''}`);
    // Doc 44's third honesty, at the moment it is needed: whoever reads this
    // is deciding whether the game is wrong or the script is, and the note is
    // the only thing on the page that helps them.
    if (failure.note) console.log(`     note      ${failure.note}`);
  }
  for (const error of state.pageErrors) console.log(`FAIL page error · ${error}`);
  state.failures.push(...state.pageErrors.map((message) => (
    { beat: '-', who: '-', field: 'page', expected: 'no error', got: message, note: '' })));
}

/**
 * R5h's four-way table, at the only place it is cheap to build.
 *
 * The instrument agreeing with itself proves nothing, so it is compared
 * against its own absence: every beat both runs measured must agree on how
 * long it took, within the same slack the beats themselves use.
 *
 * EXCEPT A BEAT THIS HARNESS ENDED ITSELF, and leaving those in made the
 * comparison a coin toss. Beat 9 holds on a flag that nothing writes until
 * the harness clicks the lamp, so its measured duration is the harness's own
 * latency in noticing the segment plus the game's response to a click. On one
 * tree it measured 42.7s, 43.9s, 32.7s and 34.2s -- and on a SECOND run of a
 * tree that had already passed, 32.8s armed against 37.0s bare, which is a
 * 4.2s drift and a failure. Nothing about the game changed between any of
 * them.
 *
 * That is not a timing that only holds while it is being measured. It is a
 * timing MANUFACTURED by the measurement, which is R5h's own subject pointed
 * at R5h: the apparatus is part of the system while it is attached, and here
 * the apparatus is most of what the number describes.
 *
 * A FLAKY RED IS R5j. It fails on correct work, at people who know it is
 * correct, and what it teaches them is that a red gauntlet can be re-run
 * until it goes away -- which is the end of the gauntlet as anything but
 * decoration. So driven beats are excluded from the drift comparison, and
 * PRINTED as excluded: their duration is still reported, because a beat that
 * stops ending at all is still worth seeing, and it is still held to its own
 * ceiling if the script states one.
 */
function timingDrift(armed, bare, script) {
  const lines = [];
  let ok = true;
  // Q82, RULED: PROPORTIONAL WITH AN ABSOLUTE FLOOR. `defaults.slack` is 3
  // seconds and was chosen when beat 3 held 6.5s; it now holds about 12, so a
  // constant that was 46% of the beat became 25% of it without anybody
  // deciding that. And beat 3 now contains DISTANCE-DRIVEN MOTION, whose
  // wall-clock length is distance over speed times FRAME RATE -- so arming the
  // watch genuinely lengthens the walk, the error scales with the beat, and no
  // absolute tolerance can be right for it.
  //
  // AGAINST THE BARE MEASUREMENT, NOT THE ARMED ONE. The bare run is the
  // duration with no instrument in it, which is the thing the armed run is
  // supposed to reproduce. Taking the fraction of the ARMED number would grow
  // the tolerance in proportion to the error it is measuring, which is a
  // window that widens to admit whatever it finds.
  //
  // STRICTER, NOT LOOSER, WHERE IT MATTERS: at 25% this is tighter than 3s
  // absolute on every beat under 6 seconds -- beat 2 at 1.5s gets 1.5s rather
  // than 3 -- and it only relaxes on beats long enough for 3s to have been
  // meaningless.
  const floor = script.defaults.driftFloor ?? 1.5;
  const fraction = script.defaults.driftFraction ?? 0.25;
  const manufactured = [];
  for (const [beat, held] of armed.beats) {
    if (armed.driven.has(beat) || bare.driven.has(beat)) {
      manufactured.push(beat);
      continue;
    }
    const without = bare.beats.get(beat);
    if (without === undefined) {
      lines.push(`FAIL beat ${beat} was seen with the watch on and not with it off`);
      ok = false;
      continue;
    }
    const drift = Math.abs(held - without);
    const tolerance = Math.max(floor, fraction * without);
    if (drift > tolerance) {
      lines.push(`FAIL beat ${beat} took ${held.toFixed(2)}s with the instrument `
        + `and ${without.toFixed(2)}s without it (drift ${drift.toFixed(2)}s > `
        + `${tolerance.toFixed(2)}s: max of ${floor}s and ${fraction * 100}% of ${without.toFixed(2)}s)`);
      lines.push('     A timing that only holds while it is being measured is not a timing.');
      ok = false;
    }
  }
  // NO SILENT CAPS: what was left out of the comparison is named, with why.
  if (manufactured.length) {
    lines.push(`    R5h: beat(s) ${manufactured.join(', ')} not compared -- this harness `
      + 'ended them, so their duration is mostly its own latency, not the game\'s');
  }
  if (ok) {
    const compared = armed.beats.size - manufactured.length;
    lines.push(`    R5h: ${compared} beat(s) timed with and without the instrument, all `
      + `within max(${floor}s, ${fraction * 100}% of the bare measurement)`);
  }
  return { ok, lines };
}

/* ------------------------------------------------------------------- smoke */

/**
 * The built artifact, from navigation, with no state assertions at all.
 *
 * `import.meta.env.DEV` strips `__game` and the probe from production, so
 * there is nothing to read: what this can establish is that the thing boots,
 * throws nothing, and puts something other than one flat colour on screen.
 * That is the class of fault only the artifact has, and it is worth exactly
 * that much and no more.
 */
async function smoke() {
  const server = await serve('preview', PREVIEW_PORT);
  const engine = await browser();
  const failures = [];
  try {
    const page = await engine.newPage({ viewport: WINDOW });
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error.message)));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    const client = await page.context().newCDPSession(page);
    const shots = [];
    client.on('Page.screencastFrame', async (event) => {
      shots.push(event.data.length);
      await client.send('Page.screencastFrameAck', { sessionId: event.sessionId })
        .catch(() => {});
    });
    await client.send('Page.enable');
    await client.send('Page.startScreencast', { format: 'jpeg', quality: 40, everyNthFrame: 1 });

    await page.goto(server.url);
    await page.waitForTimeout(12_000);
    await client.send('Page.stopScreencast').catch(() => {});

    const canvas = await page.evaluate(() => {
      const found = document.querySelector('canvas');
      if (!found) return null;
      const context = found.getContext('2d') ?? null;
      return { width: found.width, height: found.height, has2d: context !== null };
    });

    if (!canvas) failures.push('no canvas on the page');
    else if (canvas.width < 320 || canvas.height < 200) {
      failures.push(`canvas is ${canvas.width}x${canvas.height}`);
    }
    if (shots.length < 4) failures.push(`only ${shots.length} frame(s) were presented`);
    // A JPEG of a flat colour compresses to almost nothing. This does not
    // claim the picture is right -- doc 44's first honesty -- only that
    // something was drawn.
    const biggest = Math.max(0, ...shots);
    if (biggest < 4_000) failures.push(`the largest frame was ${biggest} bytes: a flat screen`);
    for (const error of errors) failures.push(`page error: ${error}`);

    console.log(`SMOKE  ${shots.length} frame(s), largest ${biggest} bytes, `
      + `canvas ${canvas ? `${canvas.width}x${canvas.height}` : 'absent'}`);
    for (const failure of failures) console.log(`      x ${failure}`);
    console.log(failures.length === 0 ? 'PASS  built artifact boots' : 'FAIL  built artifact');
    await page.close();
  } finally {
    await engine.close();
    server.stop();
  }
  return failures.length === 0 ? 0 : 1;
}
