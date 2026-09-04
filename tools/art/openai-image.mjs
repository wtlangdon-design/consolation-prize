/**
 * THE IMAGE API, AS AN ADAPTER AND NOTHING ELSE.
 *
 * Doc 46 part one names art generation as the thing that cannot be automated:
 * "ChatGPT generates; Tyler's eye judges. No check measures whether a plate is
 * good." That is unchanged and this file does not touch it. What it changes is
 * WHO PRESSES THE BUTTON -- the loop of writing a prompt, waiting, downloading
 * a PNG and putting it somewhere is the part a person should not be doing by
 * hand forty rooms in a row.
 *
 * SO THE RULES THIS FILE KEEPS ARE ABOUT CUSTODY, NOT QUALITY:
 *
 * 1. THE KEY COMES FROM THE ENVIRONMENT AND IS NEVER WRITTEN ANYWHERE. Not
 *    into the ledger, not into a log line, not into an error message. The
 *    provenance record carries the model and the parameters and no credential.
 *
 * 2. IT CANNOT WRITE INTO SHIPPING ART. Every output lands under
 *    `art/staging/`, and a refusal names the path rather than helpfully
 *    choosing another one. Promotion out of staging is a separate, explicit,
 *    logged act -- `tools/art/staging.mjs promote` -- because "the generator
 *    overwrote the approved plate" is a mistake with no undo that is not a
 *    git revert, and errata 54 exists partly because a plate Tyler approved
 *    was nearly regenerated out from under him. `tools/pixelart/superseded.py`
 *    is the same defence one layer over.
 *
 * 3. IT REFUSES RATHER THAN GUESSES. No default output path, no invented
 *    prompt, no silent model substitution, no retry that changes the request.
 *
 * WHAT IT DELIBERATELY DOES NOT DO: decide whether to generate, decide how
 * many attempts are reasonable, or decide whether the result is any good.
 * Those live in `staging.mjs` (caps and provenance), in `gates.mjs`
 * (technical admissibility) and in Tyler (everything else).
 *
 * Usage, as a module:
 *     import { generate, edit } from './openai-image.mjs';
 *     await generate({ prompt, out: 'art/staging/room-04/attempt-01.png', size });
 *     await edit({ prompt, out, images: ['art/staging/.../base.png'], mask });
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';

import { ROOT } from '../lib/content.mjs';

/**
 * The one directory anything generated may be written to.
 *
 * A PREFIX TEST, ON THE RESOLVED PATH, so `art/staging/../backgrounds/x.png`
 * is refused. A check that tests the string it was handed rather than the path
 * that string resolves to is a check that is one `..` from useless.
 */
export const STAGING_ROOT = 'art/staging';

/** Default model. Overridden by OPENAI_IMAGE_MODEL, never by an argument. */
const DEFAULT_MODEL = 'gpt-image-2';

const ENDPOINT = 'https://api.openai.com/v1/images';

/**
 * Imported lazily inside the two call paths, not at module load.
 *
 * `baseline.mjs` reads `reference/global-baseline.json` and hashes five files
 * to answer a question no `generate` call without a room even asks. Paying
 * that on every import of the adapter -- including by `gates.mjs`, which never
 * makes a request -- would be a cost with no reader.
 */
async function baselineModule() { return import('./baseline.mjs'); }

export function model() {
  return process.env.OPENAI_IMAGE_MODEL || DEFAULT_MODEL;
}

/** Whether this environment routes outbound HTTPS through a proxy. */
export function proxied() {
  return Boolean(process.env.HTTPS_PROXY || process.env.https_proxy);
}

/**
 * The key, or a refusal that says how to supply it.
 *
 * READ AT CALL TIME, not at import. A module-level read makes every tool that
 * imports this one fail on a machine with no key, including the gates, which
 * do not need one.
 */
function key() {
  const found = process.env.OPENAI_API_KEY;
  if (!found) {
    throw new Error('OPENAI_API_KEY is not set. Export it in the shell that runs this; '
      + 'it is never read from a file, never written to the ledger, and never printed.');
  }
  return found;
}

/** Refuses any path that does not resolve inside `art/staging`. */
export function assertStaged(out) {
  const full = resolve(ROOT, out);
  const staging = resolve(ROOT, STAGING_ROOT);
  if (full !== staging && !full.startsWith(`${staging}/`)) {
    throw new Error(`refusing to write ${out}: generated art goes to ${STAGING_ROOT}/ and `
      + 'nothing else writes shipping art. Promote it with tools/art/staging.mjs promote, '
      + 'which records that somebody decided to.');
  }
  return full;
}

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function hashFile(path) {
  return sha256(readFileSync(resolve(ROOT, path)));
}

/**
 * One request, with the response body kept on failure.
 *
 * THE BODY IS THE DIAGNOSIS. An adapter that reports "the API returned 400"
 * and drops what the API said about why costs a round trip every time, and
 * this project has the same lesson written into `tools/gauntlet/run.mjs`:
 * the old dev-server failure "reported only that no URL appeared, so
 * diagnosing it needed the run log, the job id and three tool calls."
 */
async function post(path, body, headers = {}) {
  let answer;
  try {
    answer = await fetch(`${ENDPOINT}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key()}`, ...headers },
      body,
    });
  } catch (error) {
    // A TRANSPORT FAILURE IS NOT AN API FAILURE, and reporting it as one sends
    // whoever reads it to look at the request. This says which it was.
    throw new Error(`could not reach ${ENDPOINT}: ${error.message}. This is the network, not `
      + 'the API and not the key.');
  }
  const text = await answer.text();
  if (!answer.ok) {
    // FOUR THINGS ANSWER WITH A NUMBER AND THEY ARE NOT THE SAME FAULT.
    // Reporting one as another sends somebody to fix the wrong thing, and
    // this file has already done it once -- see the second branch.
    if (answer.status === 403 && /not in allowlist|egress/i.test(text)) {
      // IT IS THE PROXY TALKING, AND THAT DOES NOT MEAN THE HOST IS BLOCKED.
      //
      // Node's built-in `fetch` does not read HTTPS_PROXY. So on a machine
      // where curl reaches the API perfectly, a fetch bypasses the proxy, the
      // sandbox denies the direct connection, and the denial it returns is
      // word for word the one a genuinely un-allowlisted host gets.
      //
      // The first version of this message read that as "the host is not in
      // the allowlist" and told the operator to change the environment's
      // network settings. The host was allowed. The process was not using the
      // proxy. That is a client misconfiguration wearing an infrastructure
      // error's clothes, and the two are told apart here rather than guessed.
      if (proxied() && !process.env.NODE_USE_ENV_PROXY) {
        throw new Error("this process bypassed the proxy, so the sandbox refused the direct "
          + `connection to ${new URL(ENDPOINT).host}. The host may well be allowed: Node's `
          + 'built-in fetch does not read HTTPS_PROXY, which /root/.ccr/README.md states in '
          + 'as many words. Re-run with NODE_USE_ENV_PROXY=1 (Node >= 22.21). The key was '
          + `never sent.\n--- what the proxy said ---\n${text.slice(0, 400)}`);
      }
      throw new Error(`${new URL(ENDPOINT).host} is not in this environment's network egress `
        + 'allowlist, so no request left the machine. The key was never used and is not the '
        + 'problem. Add the host to the environment\'s network settings -- '
        + 'https://code.claude.com/docs/en/claude-code-on-the-web -- and run this again.'
        + `\n--- what the proxy said ---\n${text.slice(0, 600)}`);
    }
    // AUTHENTICATION, which is the key or the account and nothing else.
    if (answer.status === 401) {
      throw new Error('the API rejected the credential (401). This is OPENAI_API_KEY or the '
        + 'account behind it -- not the network, which answered, and not the request, which '
        + `was read.\n--- what it said ---\n${text.slice(0, 800)}`);
    }
    // BILLING, RATE LIMIT AND MODEL ACCESS, which are the account's state.
    if (answer.status === 429 || answer.status === 402
      || (answer.status === 403 && !/not in allowlist|egress/i.test(text))) {
      throw new Error(`the account cannot make this call right now (${answer.status}): a rate `
        + 'limit, a billing state, or no access to this model. The credential was accepted. '
        + `Model asked for: ${model()}.\n--- what it said ---\n${text.slice(0, 800)}`);
    }
    // 4xx THAT IS NOT ANY OF THOSE IS THIS FILE'S OWN FAULT: a parameter the
    // API does not take, a size it does not offer, a malformed multipart body.
    if (answer.status >= 400 && answer.status < 500) {
      throw new Error(`the request was malformed for ${model()} (${answer.status}). This is `
        + 'the adapter, not the key, the account or the network -- read what the API says is '
        + `wrong with it.\n--- what it said ---\n${text.slice(0, 2000)}`);
    }
    throw new Error(`image API ${answer.status} on ${path}\n--- what it said ---\n`
      + `${text.slice(0, 4000)}`);
  }
  return JSON.parse(text);
}

/**
 * Writes the first image of a response and returns the provenance of the call.
 *
 * The return value is what `staging.mjs` records. It carries the model, the
 * parameters, the reference hashes and the output hash, and it carries no
 * credential -- which is stated here because the temptation to include "the
 * request" wholesale for debugging is exactly how a key reaches a log.
 */
function land(result, out, meta) {
  const first = result.data?.[0];
  if (!first?.b64_json) {
    throw new Error(`the API returned no image data for ${out}. `
      + `Keys present: ${Object.keys(first ?? {}).join(', ') || 'none'}`);
  }
  const bytes = Buffer.from(first.b64_json, 'base64');
  const full = assertStaged(out);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, bytes);
  return {
    ...meta,
    out,
    outputHash: sha256(bytes),
    bytes: bytes.length,
    // Usage where the API reports it. Absent is absent: a zero would read as
    // a measurement and this is the number a spending cap is enforced on.
    usage: result.usage ?? null,
    revisedPrompt: first.revised_prompt ?? null,
    at: new Date().toISOString(),
  };
}

/**
 * A prompt, or the file that holds one.
 *
 * THE PROMPT IS CONTENT'S NEIGHBOUR AND IS TREATED LIKE IT. Docs 12, 37 and 39
 * hold the generation briefs; a prompt typed into a shell argument exists
 * nowhere afterwards and cannot be re-run, compared or corrected. `promptFile`
 * is the form that leaves a trail, and the ledger records which was used.
 */
function promptOf({ prompt, promptFile }) {
  if (prompt && promptFile) {
    throw new Error('give a prompt or a promptFile, not both -- two sources of one string '
      + 'is the shape every drift in this project has had');
  }
  if (promptFile) return { text: readFileSync(resolve(ROOT, promptFile), 'utf8'), from: promptFile };
  if (prompt) return { text: prompt, from: 'inline' };
  throw new Error('no prompt and no promptFile. This refuses rather than inventing one.');
}

/**
 * Generate an image from a prompt alone.
 *
 * `size` is required and not defaulted. Errata 54 sets the play area at
 * 1920x864 and voided doc 35 section 6's "1600 x 720 exactly"; a default here
 * would be a fourth place that number lives, and the wrong one would be
 * invisible until a plate arrived at the wrong shape.
 */
export async function generate({ prompt, promptFile, out, size, quality, background,
  baselineRoom }) {
  // A ROOM-ART CALL CANNOT BE A GENERATION, and this is the enforcement.
  //
  // Tyler's ruling: where a call is expected to match the game's established
  // visual universe, the approved reference images must ACTUALLY be supplied
  // to the model. `/generations` transmits no images at all -- it takes a
  // prompt and nothing else -- so a room generated through it has, by
  // construction, no approved ancestry, however carefully the prompt describes
  // one. Prose is not a reference.
  if (baselineRoom) {
    throw new Error(`generate() cannot carry visual references: the generations endpoint `
      + `transmits a prompt and nothing else. Room art for ${baselineRoom} must go through `
      + 'edit(), which transmits the approved images themselves.');
  }
  const text = promptOf({ prompt, promptFile });
  if (!out) throw new Error('generate needs an explicit `out` path under art/staging/.');
  if (!size) throw new Error('generate needs an explicit `size` -- errata 54 sets the play '
    + 'area at 1920x864 and this refuses to guess which of a room\'s sizes you meant.');
  assertStaged(out);
  const body = {
    model: model(),
    prompt: text.text,
    size,
    n: 1,
    ...(quality ? { quality } : {}),
    ...(background ? { background } : {}),
  };
  const result = await post('/generations', JSON.stringify(body),
    { 'Content-Type': 'application/json' });
  return land(result, out, {
    operation: 'generate',
    model: body.model,
    parameters: { size, quality: quality ?? null, background: background ?? null },
    prompt: text.from === 'inline' ? text.text : null,
    promptFile: text.from === 'inline' ? null : text.from,
    promptHash: sha256(Buffer.from(text.text)),
    // Empty, and empty for a structural reason rather than an omission: the
    // generations endpoint has nowhere to put an image.
    references: [],
    baseline: null,
  });
}

/**
 * Edit one or more existing images.
 *
 * SEVERAL REFERENCES, BECAUSE THE PROJECT'S OWN METHOD NEEDS THEM. Doc 36 D4:
 * "movers are obtained by additive edit and subtraction" -- the same scene
 * generated with and without an object, differenced. Errata 53 condition 2
 * states it as a rule rather than an optimisation: "ask the generator for the
 * same scene without the object, quantise both, and the layer is a difference
 * between two images." A companion generation that cannot see the plate it is
 * a companion to is not a companion.
 *
 * EVERY REFERENCE IS HASHED INTO THE RECORD. An edit whose inputs are not
 * pinned cannot be reproduced, and "regenerate that one" is the most common
 * thing anybody asks of this pipeline.
 */
export async function edit({ prompt, promptFile, out, images, mask, size, quality,
  baselineRoom }) {
  const text = promptOf({ prompt, promptFile });
  if (!out) throw new Error('edit needs an explicit `out` path under art/staging/.');
  if (!images?.length) throw new Error('edit needs at least one reference image.');
  assertStaged(out);

  // THE BASELINE IS CHECKED AGAINST THE REQUEST, NOT AGAINST A PROMISE.
  //
  // `requireBaseline` refuses a room whose A-E are not all present, and then
  // this asserts that every required path is in the `images` list that is
  // about to be appended to the form. Recording "references: [...]" while
  // sending none was the failure worth designing against: the provenance row
  // would read exactly the same either way.
  let baseline = null;
  if (baselineRoom) {
    const { requireBaseline } = await baselineModule();
    const required = requireBaseline(baselineRoom);
    const sending = new Set(images);
    const absent = required.references.filter((reference) => !sending.has(reference.path));
    if (absent.length) {
      throw new Error(`the baseline for ${baselineRoom} requires images this call does not `
        + `transmit:\n${absent.map((r) => `  ${r.slot}  ${r.path}`).join('\n')}\n`
        + 'Naming a reference in provenance is not supplying it to the model.');
    }
    baseline = {
      room: baselineRoom,
      visualType: required.visualType,
      slots: required.references.map((reference) => ({
        slot: reference.slot,
        role: reference.role,
        path: reference.path,
        hash: reference.hash,
        transmitted: true,
      })),
    };
  }

  const form = new FormData();
  form.append('model', model());
  form.append('prompt', text.text);
  if (size) form.append('size', size);
  if (quality) form.append('quality', quality);
  const references = [];
  for (const path of images) {
    const full = resolve(ROOT, path);
    if (!existsSync(full)) throw new Error(`reference image does not exist: ${path}`);
    const bytes = readFileSync(full);
    // `transmitted` is written HERE, on the line that appends the bytes to
    // the form, so the flag and the act cannot come apart.
    references.push({ path, hash: sha256(bytes), transmitted: true });
    form.append('image[]', new Blob([bytes], { type: 'image/png' }), basename(path));
  }
  let maskRecord = null;
  if (mask) {
    const bytes = readFileSync(resolve(ROOT, mask));
    maskRecord = { path: mask, hash: sha256(bytes) };
    form.append('mask', new Blob([bytes], { type: 'image/png' }), basename(mask));
  }

  const result = await post('/edits', form);
  return land(result, out, {
    operation: 'edit',
    model: model(),
    parameters: { size: size ?? null, quality: quality ?? null },
    prompt: text.from === 'inline' ? text.text : null,
    promptFile: text.from === 'inline' ? null : text.from,
    promptHash: sha256(Buffer.from(text.text)),
    references,
    baseline,
    mask: maskRecord,
    // The source an edit-isolation gate measures drift against: the FIRST
    // reference, which is the image being edited. Named rather than left for
    // a reader to infer from an array's order.
    sourceHash: references[0]?.hash ?? null,
    sourcePath: references[0]?.path ?? null,
  });
}
