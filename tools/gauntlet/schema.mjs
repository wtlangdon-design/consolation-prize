import { readJson } from '../lib/content.mjs';

/**
 * The gauntlet script's schema, as a validator. Doc 44 part one.
 *
 * ONE DEFINITION, USED TWICE: by `tools/check-gauntlet-script.mjs`, which
 * runs in `npm run validate` and never opens a browser, and by the harness,
 * which does. A schema written down in prose and enforced in two places is
 * two schemas, and they drift.
 *
 * IT REPORTS EVERY FAULT IT FINDS, not the first. Somebody is writing this
 * file by hand from a prose document, and a validator that stops at the first
 * mistake turns one editing pass into eight.
 *
 * WHAT IT DELIBERATELY DOES NOT CHECK: any coordinate, height, facing or clip
 * against the content. Doc 44's third honesty -- a script generated from, or
 * validated against, the staging table would be the staging table compared
 * with itself, and would pass whatever the staging said. R5i. The structural
 * agreement is which beats exist, in what order, under what control; the
 * numbers are the independent half and stay independent.
 *
 * WITH ONE EXCEPTION, AND THE DISTINCTION IS THE POINT: a click's `on` names
 * a hotspot and takes its rect from the room. That is NOT an assertion, it is
 * AIM -- the harness standing in for a hand, and a hand finds the lamp by
 * looking at it. Every mark the script asserts stays a number a person wrote
 * down. R5k, and doc 44 part one says the same in longer form.
 */

const FACINGS = ['left', 'right', 'front', 'back'];
const CONTROLS = ['none', 'player', 'menu'];
const WHEN_KEYS = ['enter', 'leave', 'clip', 'settled', 'line', 'seconds'];
const ENTRY_FIELDS = ['at', 'tol', 'facing', 'clip', 'height', 'moving', 'present'];
const INPUT_KINDS = ['choose', 'click', 'wait'];

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isPoint = (value) => Array.isArray(value) && value.length === 2
  && value.every((n) => typeof n === 'number' && Number.isFinite(n));

/**
 * Every target in a room, by id, read from the room JSON.
 *
 * FROM THE CONTENT AND NOT FROM THE ENGINE, deliberately. Asking the running
 * game where its lamp is would click exactly where the engine believes the
 * lamp to be, and would therefore pass however wrong that belief was -- a
 * mechanism agreeing with itself, R5i. Reading the room's own JSON with a
 * different parser means a click that misses is a real disagreement between
 * the content and what the game does with it.
 */
function roomTargets(roomId) {
  const manifest = readJson('content/manifest.json');
  for (const path of manifest.rooms) {
    const room = readJson(path);
    if (room.id !== roomId) continue;
    return new Map([...(room.exits ?? []), ...(room.hotspots ?? [])]
      .map((target) => [target.id, target]));
  }
  return null;
}

/**
 * Where a `click` action lands, in play-area coordinates.
 *
 * `at: [x, y]` is a literal. `on: "<target id>"` is the centre of that
 * target's rect in the script's room -- R5k, a coordinate derived from the
 * thing it describes rather than restated beside it. Returns
 * { point } or { error }.
 */
export function clickPoint(script, action) {
  if (action.at) return { point: action.at };
  const targets = roomTargets(script.room);
  if (!targets) return { error: `no room "${script.room}" in the manifest` };
  const target = targets.get(action.on);
  if (!target) {
    return { error: `no target "${action.on}" in room "${script.room}". `
      + `It holds: ${[...targets.keys()].join(', ')}` };
  }
  const [x, y, w, h] = target.rect;
  return { point: [Math.round(x + w / 2), Math.round(y + h / 2)] };
}

/**
 * Validates a script, on its own and against the sequence it scripts.
 *
 * `sequence` is the parsed `content/sequences/<id>.json`. Pass null to check
 * the file's shape alone -- which is what an editor would want, and is not
 * enough for CI.
 *
 * Returns { errors, warnings, coverage }. Errors fail; warnings are printed
 * and do not. `coverage` is what the run must announce: a script that checks
 * two beats of eleven must say so in the same breath as it says it passed.
 */
export function validateScript(script, sequence) {
  const errors = [];
  const warnings = [];
  const at = (where, message) => errors.push(`${where}: ${message}`);

  if (!isObject(script)) {
    return { errors: ['the script is not an object'], warnings, coverage: null };
  }
  if (script.schema !== 1) at('schema', `must be 1, got ${JSON.stringify(script.schema)}`);
  for (const field of ['sequence', 'room', 'source']) {
    if (typeof script[field] !== 'string' || script[field].length === 0) {
      at(field, 'must be a non-empty string');
    }
  }
  // DOC 44 SAID THIS AND NOTHING ENFORCED IT: "room -- must equal
  // manifest.startRoom". It said `stage-road`, the file's stem, where the room
  // calls itself `stage_road`, and it had been wrong since the day it was
  // written. Nothing noticed because nothing read the field -- an unused value
  // is never wrong about anything. It became wrong the moment a click resolved
  // through it. R5k again: a restated identifier, drifting from the thing it
  // names, in silence.
  const startRoom = readJson('content/manifest.json').startRoom;
  if (typeof script.room === 'string' && script.room !== startRoom) {
    at('room', `is "${script.room}" and the manifest starts at "${startRoom}"`);
  }

  const defaults = script.defaults;
  if (!isObject(defaults)) {
    at('defaults', 'must be an object with position, height and slack');
  } else {
    for (const field of ['position', 'height', 'slack']) {
      if (typeof defaults[field] !== 'number' || !(defaults[field] >= 0)) {
        at(`defaults.${field}`, 'must be a number >= 0');
      }
    }
  }

  if (!isPoint(script.band)) {
    at('band', 'must be [topY, bottomY]');
  } else if (script.band[0] >= script.band[1]) {
    at('band', `top ${script.band[0]} is not above bottom ${script.band[1]}`);
  }
  if (script.bandExempt !== undefined
    && !(Array.isArray(script.bandExempt)
      && script.bandExempt.every((id) => typeof id === 'string'))) {
    at('bandExempt', 'must be an array of mover ids');
  }

  if (!isObject(script.until) || typeof script.until.beat !== 'string'
    || !['enter', 'leave'].includes(script.until.on)) {
    at('until', 'must be { beat: "<id>", on: "enter" | "leave" }');
  }

  if (!Array.isArray(script.beats) || script.beats.length === 0) {
    at('beats', 'must be a non-empty array');
    return { errors, warnings, coverage: null };
  }

  const declared = script.beats.map((beat) => beat?.beat);
  script.beats.forEach((beat, index) => {
    checkBeat(beat, `beats[${index}]`, errors, warnings, script);
  });

  // Structure against the content, and structure only.
  let checked = 0;
  let total = declared.length;
  if (sequence) {
    const authored = sequence.beats.map((beat) => beat.beat);
    total = authored.length;
    // ORDER AS WELL AS MEMBERSHIP. A script whose beats are the right set in
    // the wrong order would sample beat 7's marks during beat 6b and report
    // the difference as a defect in the game.
    if (declared.length !== authored.length
      || declared.some((id, index) => id !== authored[index])) {
      at('beats', 'do not match the sequence, in order.\n'
        + `      script:   ${declared.join(', ')}\n`
        + `      sequence: ${authored.join(', ')}\n`
        + '      Every authored beat must appear, in order. A beat with nothing to\n'
        + '      assert is present with an `unscripted` reason, never omitted.');
    }
    const controls = new Map(sequence.beats.map((beat) => [beat.beat, beat.control]));
    for (const beat of script.beats) {
      if (!isObject(beat)) continue;
      const authoredControl = controls.get(beat.beat);
      if (authoredControl !== undefined && beat.control !== authoredControl) {
        at(`beat ${beat.beat}`,
          `control is "${beat.control}" here and "${authoredControl}" in the sequence`);
      }
      // A staged `say` names a line by index; a mark's `when.line` names one
      // the same way, and an index with nothing behind it asserts on silence.
      const lines = (sequence.beats.find((b) => b.beat === beat.beat)?.lines ?? []).length;
      for (const [index, mark] of (beat.marks ?? []).entries()) {
        const wants = isObject(mark?.when) ? mark.when.line : undefined;
        if (typeof wants === 'number' && wants >= lines) {
          at(`beat ${beat.beat} mark ${index}`,
            `when.line ${wants} but the beat has ${lines} line(s)`);
        }
        if (mark?.says !== undefined && mark.says !== null && lines === 0) {
          at(`beat ${beat.beat} mark ${index}`,
            `says "${mark.says}" but the beat has no lines`);
        }
      }
      if (!beat.unscripted) checked += 1;
    }
    checkPlayerRuns(script, sequence, errors);

    // A BEAT THAT WAITS FOR THE PLAYER NEEDS THE PLAYER TO DO SOMETHING.
    //
    // `awaitFlag` holds a beat until a flag is written, and only an action can
    // write it -- so a script with no `input` on that beat holds forever and
    // the run dies on its own deadline three minutes later. That is what
    // happened the first time beat 9 became a response: the script was written
    // when the beat was on a clock, and nothing said it had stopped being.
    //
    // The run-level rule above does not cover it, because the run containing
    // `until` is exempt -- the harness stops there, so nothing has to get it
    // out. A held beat is the exception: it has to be got INTO.
    //
    // AND ONLY UP TO WHERE THE RUN STOPS. A beat past `until` is never
    // reached, so it can hold forever without costing anything -- and
    // requiring input for it would be requiring the harness to drive a scene
    // it has already stopped watching.
    const stopsAfter = isObject(script.until)
      ? sequence.beats.findIndex((beat) => beat.beat === script.until.beat) : -1;
    for (const [index, beat] of sequence.beats.entries()) {
      if (!beat.awaitFlag) continue;
      if (stopsAfter >= 0 && index > stopsAfter) continue;
      const scripted = script.beats.find((entry) => isObject(entry) && entry.beat === beat.beat);
      if (Array.isArray(scripted?.input) && scripted.input.length > 0) continue;
      at(`beat ${beat.beat}`,
        `waits on ${beat.awaitFlag} and the script gives it no \`input\`. A held beat needs `
        + 'an action to release it, or the run waits until its own deadline.');
    }
  } else {
    checked = script.beats.filter((beat) => isObject(beat) && !beat.unscripted).length;
  }

  const unscripted = script.beats
    .filter((beat) => isObject(beat) && beat.unscripted)
    .map((beat) => `beat ${beat.beat}: ${beat.unscripted}`);
  if (checked === 0) {
    warnings.push('NO BEAT IN THIS SCRIPT ASSERTS ANYTHING. Every one is `unscripted`.');
  }

  return { errors, warnings, coverage: { checked, total, unscripted } };
}

/**
 * Every run of player-control beats can be got out of.
 *
 * A RUN, NOT A BEAT, because the unit the player acts on is the run. Errata
 * 30b makes doc 17's beats 4, 5 and 6 ONE dialogue tree: which of the three a
 * given option belongs to is not a fact the engine holds, so requiring input
 * on each of them would be requiring an answer to an unanswerable question.
 * Input on any beat of a run drives that run.
 *
 * The run containing the beat `until` names is exempt -- the harness stops
 * there, so nothing has to get it out.
 */
function checkPlayerRuns(script, sequence, errors) {
  const inputs = new Map(script.beats
    .filter((beat) => isObject(beat))
    .map((beat) => [beat.beat, Array.isArray(beat.input) && beat.input.length > 0]));
  const stopsAt = isObject(script.until) ? script.until.beat : null;
  let run = [];
  const finish = () => {
    if (run.length === 0) return;
    const ids = run.map((beat) => beat.beat);
    if (!ids.includes(stopsAt) && !ids.some((id) => inputs.get(id))) {
      errors.push(`beats ${ids.join(', ')}: a run under player control with no `
        + '`input` on any of them. The run would hang here.');
    }
    run = [];
  };
  for (const beat of sequence.beats) {
    if (beat.control === 'player') run.push(beat);
    else finish();
  }
  finish();
}

function checkBeat(beat, where, errors, warnings, script) {
  const at = (message) => errors.push(`${where}: ${message}`);
  if (!isObject(beat)) {
    at('must be an object');
    return;
  }
  if (typeof beat.beat !== 'string' || beat.beat.length === 0) at('beat must be a string id');
  if (!CONTROLS.includes(beat.control)) {
    at(`control must be one of ${CONTROLS.join(', ')}`);
  }
  for (const field of ['seconds', 'within']) {
    if (beat[field] !== undefined && !(typeof beat[field] === 'number' && beat[field] > 0)) {
      at(`${field} must be a positive number`);
    }
  }
  if (beat.unscripted !== undefined
    && (typeof beat.unscripted !== 'string' || beat.unscripted.length === 0)) {
    at('unscripted must be a non-empty reason. A beat is skipped out loud or not at all');
  }
  if (beat.unscripted && beat.marks?.length) {
    at('is both unscripted and carries marks. It is one or the other');
  }
  if (!beat.unscripted && !Array.isArray(beat.marks)) {
    at('must carry `marks`, or an `unscripted` reason saying why it carries none');
  }
  for (const [index, mark] of (beat.marks ?? []).entries()) {
    checkMark(mark, `${where}.marks[${index}]`, errors, warnings);
  }
  for (const [index, action] of (beat.input ?? []).entries()) {
    checkInput(action, `${where}.input[${index}]`, errors, script);
  }
}

function checkMark(mark, where, errors, warnings) {
  const at = (message) => errors.push(`${where}: ${message}`);
  if (!isObject(mark)) {
    at('must be an object');
    return;
  }
  // The note is required, and doc 44's third honesty is the whole reason:
  // "measured" and "guess, nobody has looked" are treated identically by the
  // harness and very differently by whoever reads the failure.
  if (typeof mark.note !== 'string' || mark.note.length === 0) {
    at('needs a `note` saying where its numbers came from. '
      + 'A mark with no provenance is a guess asserted as a fact');
  }
  const when = mark.when;
  if (!isObject(when)) {
    at('needs a `when`');
  } else {
    const keys = Object.keys(when).filter((key) => key !== 'who');
    const known = keys.filter((key) => WHEN_KEYS.includes(key));
    if (keys.length !== 1 || known.length !== 1) {
      at(`when must have exactly one of ${WHEN_KEYS.join(', ')} (plus who for clip)`);
    } else if (when.clip !== undefined && typeof when.who !== 'string') {
      at('when.clip needs a `who`');
    } else if (when.seconds !== undefined) {
      warnings.push(`${where}: when.seconds depends on frame pacing and is the one `
        + 'form that can go flaky under CI. Prefer clip or settled');
    }
  }

  if (!isObject(mark.cast)) {
    at('needs a `cast`, which is exhaustive: every mover on screen, named');
    return;
  }
  for (const [who, entry] of Object.entries(mark.cast)) {
    const inner = `${where}.cast.${who}`;
    if (!isObject(entry)) {
      errors.push(`${inner}: must be an object`);
      continue;
    }
    const fields = Object.keys(entry);
    const unknown = fields.filter((field) => !ENTRY_FIELDS.includes(field));
    if (unknown.length) {
      errors.push(`${inner}: unknown field(s) ${unknown.join(', ')}`);
    }
    if (fields.length === 0) {
      errors.push(`${inner}: is empty. Assert something, or say {"present": true}`);
    }
    if (entry.at !== undefined && !isPoint(entry.at)) {
      errors.push(`${inner}.at: must be [x, y], the FEET anchor`);
    }
    if (entry.facing !== undefined && !FACINGS.includes(entry.facing)) {
      errors.push(`${inner}.facing: must be one of ${FACINGS.join(', ')}`);
    }
    for (const field of ['tol', 'height']) {
      if (entry[field] !== undefined && typeof entry[field] !== 'number') {
        errors.push(`${inner}.${field}: must be a number`);
      }
    }
    for (const field of ['moving', 'present']) {
      if (entry[field] !== undefined && typeof entry[field] !== 'boolean') {
        errors.push(`${inner}.${field}: must be true or false`);
      }
    }
    if (entry.clip !== undefined && typeof entry.clip !== 'string') {
      errors.push(`${inner}.clip: must be a clip id`);
    }
  }

  if (mark.overlays !== undefined) {
    if (!isObject(mark.overlays)) {
      at('overlays must be an object keyed by overlay id');
    } else {
      for (const [id, state] of Object.entries(mark.overlays)) {
        if (state !== null && typeof state !== 'string') {
          errors.push(`${where}.overlays.${id}: must be a state name or null`);
        }
      }
    }
  }
  if (mark.says !== undefined && mark.says !== null && typeof mark.says !== 'string') {
    at('says must be a speaker id or null. NEVER the words -- they live in doc 17');
  }
}

function checkInput(action, where, errors, script) {
  const at = (message) => errors.push(`${where}: ${message}`);
  if (!isObject(action) || !INPUT_KINDS.includes(action.do)) {
    at(`must be an object with do: ${INPUT_KINDS.join(' | ')}`);
    return;
  }
  if (action.do === 'choose'
    && !(Number.isInteger(action.option) && action.option >= 1)) {
    at('choose needs option: a 1-based index, as a player sees them');
  }
  if (action.do === 'click') {
    const named = typeof action.on === 'string' && action.on.length > 0;
    if (isPoint(action.at) === named) {
      at('click needs exactly one of `on`: a target id, or `at`: [x, y]. '
        + 'PREFER `on` -- a literal beside a rect goes stale the moment the rect '
        + 'moves, and says nothing when it does. R5k');
    } else if (named && script) {
      const { error } = clickPoint(script, action);
      if (error) at(`click on: ${error}`);
    }
  }
  if (action.do === 'wait' && !(typeof action.seconds === 'number' && action.seconds > 0)) {
    at('wait needs seconds: a positive number');
  }
}
