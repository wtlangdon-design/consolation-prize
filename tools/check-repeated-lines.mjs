/**
 * NO JOKE IS TOLD WHOLE TWICE ON THE MAIN PATH (errata 226).
 *
 * The feel review of errata 221's playthrough found two jokes a player heard
 * in full on every visit: Sump's "circular… linear" opening and Frame's
 * "You're new!" (errata 224, 225). Both were found by a person reading a
 * transcript. This finds the next one mechanically.
 *
 * It plays the walkthrough the full-game test plays (tools/lib/main-path-lines.mjs),
 * writes down every line the screen shows -- openings, greetings, echoes,
 * replies, verb lines, arrival lines, barks, cut-aways -- and FAILS on any
 * line of six words or more that a player sees in full more than once, said
 * by anyone, Thad included. Under six words is a catchphrase or an answer
 * ("Mr. Grubbe.", "I have four."), and saying it twice is a voice, not a
 * repeat.
 *
 * WHAT IS NOT A REPEAT:
 *   - the universal exit pool (content/dialogue/exit-pool.json): it rotates by design (errata 167);
 *   - a [COMIC] option the walkthrough picked again, and its answer: a player
 *     who clicks a joke twice asked for it twice;
 *   - a line on content/checks/repeat-allowlist.json, each with a `why` that
 *     quotes the ruling that wants it said again.
 *
 * An allowlisted line that no longer repeats is reported, not failed, so the
 * fix that ends a repeat does not have to land with its own list edit.
 */
import { pathToFileURL } from 'node:url';

import { Report, readJson, runCheck } from './lib/content.mjs';
import { playMainPath } from './lib/main-path-lines.mjs';

export const ALLOWLIST_PATH = 'content/checks/repeat-allowlist.json';
export const MIN_WORDS = 6;
/** A `why` names the ruling it quotes: an errata entry, a document, or Tyler. */
export const RULING = /errata \d+|doc \d+|Tyler/i;

export const normalise = (text) => text.replace(/\s+/g, ' ').trim();
export const wordCount = (text) => normalise(text).split(' ').filter((word) => /[\p{L}\p{N}]/u.test(word)).length;

/**
 * The repeats in a transcript. `lines` are { text, speaker, kind, step, room,
 * tag?, reselected? } in play order; `exitPool` and `allowed` are line texts.
 * Returns one entry per repeated line, with every place it was seen.
 */
export function findRepeats(lines, { exitPool = [], allowed = [] } = {}) {
  const pool = new Set(exitPool.map(normalise));
  const allow = new Set(allowed.map(normalise));
  const seen = new Map();
  for (const line of lines) {
    const text = normalise(line.text);
    if (wordCount(text) < MIN_WORDS || pool.has(text)) continue;
    if (!seen.has(text)) seen.set(text, []);
    seen.get(text).push(line);
  }
  const out = [];
  for (const [text, where] of seen) {
    // A joke picked again is the player's own repeat.
    const counted = where.filter((line) => !(line.tag === 'COMIC' && line.reselected));
    if (counted.length < 2) continue;
    out.push({ text, allowed: allow.has(text), where: counted });
  }
  return out;
}

export function readAllowlist(path = ALLOWLIST_PATH) {
  return readJson(path).entries ?? [];
}

const place = (line) => `${line.step} ${line.room} (${line.kind}, ${line.speaker})`;

export async function check({ allowlist, mutate } = {}) {
  const report = new Report('No line of six words or more is seen whole twice on the main path');
  const entries = allowlist ?? readAllowlist();
  for (const entry of entries) {
    if (typeof entry.text !== 'string' || !entry.text.trim()) report.fail(`${ALLOWLIST_PATH}: an entry has no text`);
    if (typeof entry.why !== 'string' || !RULING.test(entry.why)) {
      report.fail(`${ALLOWLIST_PATH}: "${entry.text}" has no why quoting a ruling (an errata, a doc, or Tyler)`);
    }
  }
  const run = await playMainPath({ mutate });
  // THE PATH IS THE WALKTHROUGH'S, OR THE TRANSCRIPT IS OF SOMETHING ELSE.
  const fresh = run.breaks.filter((one) => !run.knownBreaks.includes(one.step));
  for (const one of fresh) report.fail(`the main path breaks at ${one.step}, which is not a known break: ${one.problem}`);

  const repeats = findRepeats(run.lines, { exitPool: run.exitPool, allowed: entries.map((one) => one.text ?? '') });
  for (const repeat of repeats.filter((one) => !one.allowed)) {
    report.fail(`seen ${repeat.where.length} times: "${repeat.text}" -- at ${repeat.where.map(place).join('; ')}`);
  }
  const allowed = repeats.filter((one) => one.allowed);
  const still = new Set(allowed.map((one) => one.text));
  for (const entry of entries) {
    if (typeof entry.text === 'string' && !still.has(normalise(entry.text))) {
      report.note(`allowlisted and no longer repeated, so it can come off the list: "${entry.text}"`);
    }
  }
  report.note(`${run.lines.length} line(s) seen on the walkthrough's ${new Set(run.lines.map((one) => one.step)).size} `
    + `speaking step(s); ${allowed.length} allowlisted repeat(s) still said twice or more`);
  return report;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exit(runCheck(await check()) ? 0 : 1);
}
