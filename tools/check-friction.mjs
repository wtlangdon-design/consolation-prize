#!/usr/bin/env node
/**
 * A CHECK THAT KEEPS GETTING WORKED AROUND IS NOTICED THE DAY IT HAPPENS.
 *
 * Tyler, 2026-11-01: "Can't it be setup to recognize that it's slowing down
 * from too many unnecessary rules? Scheduled checks seem like the door would
 * be open to weeks of slowdowns before it checks." The twice-monthly review
 * stays as a backstop; this is the alarm. Run by CI on every pull request:
 *
 * 1. A PULL REQUEST THAT LOOSENS A CHECK RECORDS IT. Loosening is: changing a
 *    line with a number in it in a check or test that already existed
 *    (a threshold), adding to an exception list (proofs/played-pending.json,
 *    content/ui/duplicate-allowlist.json, errata 226's two in content/checks/),
 *    or adding a `movementException`.
 *    Such a pull request must add an entry to proofs/check-friction.json:
 *    { "check": "<file>", "date": "YYYY-MM-DD", "kind": "loosened",
 *      "why": "<what it misfired on>" }.
 *
 * 2. THREE LOOSENINGS OF ONE CHECK IN FOURTEEN DAYS IS FRICTION. The next
 *    pull request that touches it fails until somebody evaluates the check in
 *    that pull request -- TUNE it so it stops misfiring, or MERGE it with the
 *    check it duplicates -- and records `"kind": "reviewed"` with what was
 *    concluded. A check that should be RETIRED is not retired here: the
 *    review entry says so, and the twice-monthly review puts it to Tyler.
 *
 * TUNED BY THE CHECK REVIEW (2026-11-16, ruled by Tyler 2026-11-18: "do all four"). Most of its reviews concluded
 * "not a misfire: the design changed". Two of those kinds no longer count, and three lists it could not see now do:
 *  - An entry added to proofs/played-pending.json is not a loosening when it carries its reason: each one names
 *    what is not built yet, and tests/lessons.test.ts and tests/items.test.ts take it out when it is (the 2026-11-09
 *    review). One added without a reason fails here instead.
 *  - A line marked `// ratchet` whose numbers only go DOWN tightens its check, and is not a loosening (a cap lowered
 *    by each pass, as tests/no-parentheticals.test.mjs's was four times). Raised, it is one, as any number is.
 *  - Newly watched: a figure given its own ruled range in content/scale-anchors.json (`expect`, against
 *    tests/scale-vs-thad.test.mjs's 0.97-1.03), a tree or option added to tests/data/repeats-passed.json's
 *    `comicExempt` (tests/repeats.test.ts), and an obstacle given a `reachException` (tests/feet-clear.test.ts).
 *
 * Locally: node tools/check-friction.mjs [base-ref]
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const LEDGER = 'proofs/check-friction.json';
const WINDOW_DAYS = 14;
const LIMIT = 3;

export const isCheck = (file) => /^tests\/.+\.test\.(ts|mjs)$/.test(file) || /^tools\/check-.+\.mjs$/.test(file);
export const EXCEPTION_FILES = ['content/ui/duplicate-allowlist.json',
  // Errata 226's two allowlists: a line or a phrase added to either is let past its check.
  'content/checks/repeat-allowlist.json', 'content/checks/narration-allowlist.json'];
const PENDING = 'proofs/played-pending.json';
/** A reason is a sentence, not a placeholder. */
const REASON = 20;

/** Lines of a -U0 diff, hunk by hunk: what each hunk took out and put in, in order. */
function hunks(diff) {
  const out = [];
  for (const line of diff.split('\n')) {
    if (line.startsWith('@@')) out.push({ removed: [], added: [] });
    else if (!out.length || line.startsWith('+++') || line.startsWith('---')) continue;
    else if (line.startsWith('-')) out.at(-1).removed.push(line.slice(1));
    else if (line.startsWith('+')) out.at(-1).added.push(line.slice(1));
  }
  return out;
}

const code = (line) => line.replace(/\/\/.*$/, '');
const numeric = (line) => /\d/.test(code(line));
const numbers = (line) => (code(line).match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
const shape = (line) => code(line).replace(/\d+(?:\.\d+)?/g, '#').trim();

/**
 * Does a check's diff loosen it? A numeric line taken out and a numeric line put in, as before -- except where every
 * such pair is a `// ratchet` line, the same but for its numbers, whose numbers all went down.
 */
export function checkLoosened(diff) {
  const all = hunks(diff);
  const removed = all.flatMap((hunk) => hunk.removed).filter(numeric);
  const added = all.flatMap((hunk) => hunk.added).filter(numeric);
  if (!removed.length || !added.length) return false;
  for (const hunk of all) {
    const out = hunk.removed.filter(numeric);
    const put = hunk.added.filter(numeric);
    if (!out.length && !put.length) continue;
    if (out.length !== put.length) return true;
    for (let i = 0; i < out.length; i += 1) {
      const was = out[i];
      const now = put[i];
      if (!/\/\/.*\bratchet\b/i.test(now) || shape(was) !== shape(now)) return true;
      const before = numbers(was);
      const after = numbers(now);
      // A line newly marked may not move in the same change: the mark is only believed once it has been reviewed.
      const marked = /\/\/.*\bratchet\b/i.test(was);
      if (after.some((value, at) => (marked ? value > before[at] : value !== before[at]))) return true;
    }
  }
  return false;
}

/** Entries added to played-pending without a reason. */
export function pendingWithoutReason(before, after) {
  const missing = [];
  for (const kind of ['puzzles', 'items']) {
    for (const [id, why] of Object.entries(after?.[kind] ?? {})) {
      if (id in (before?.[kind] ?? {})) continue;
      if (typeof why !== 'string' || why.trim().length < REASON) missing.push(`${kind}.${id}`);
    }
  }
  return missing;
}

const ruledRanges = (anchors) => new Set((anchors?.figures ?? []).filter((figure) => figure.expect)
  .map((figure) => `${figure.figure}:${JSON.stringify(figure.expect)}`));
const exempt = (passed) => new Set([...(passed?.comicExempt?.trees ?? []).map((t) => `tree:${t}`),
  ...(passed?.comicExempt?.options ?? []).map((o) => `option:${o}`)]);
const grew = (before, after) => [...after].some((one) => !before.has(one));

/**
 * What a pull request loosens, by the check or list it loosens.
 * `diffOf(file)` is its -U0 diff; `inBase(file)` whether it existed; `json(file, base)` the file parsed, at base or
 * now (null if absent).
 */
export function findLoosenings(files, { diffOf, inBase, json }) {
  const loosened = new Set();
  const problems = [];
  for (const file of files) {
    const diff = diffOf(file);
    const added = diff.split('\n').filter((line) => line.startsWith('+') && !line.startsWith('+++'));
    const removed = diff.split('\n').filter((line) => line.startsWith('-') && !line.startsWith('---'));
    if (isCheck(file) && inBase(file) && checkLoosened(diff)) loosened.add(file);
    if (EXCEPTION_FILES.includes(file) && added.length > removed.length) loosened.add(file);
    if (file === PENDING) {
      for (const id of pendingWithoutReason(json(file, true), json(file, false))) {
        problems.push(`${PENDING} ${id} is added without its reason -- say what is not built yet, so the entry can come out when it is.`);
      }
    }
    if (file.startsWith('content/') && added.some((line) => /"movementException"/.test(line))) loosened.add('tests/movement.test.mjs');
    if (/^(content|reference)\//.test(file) && added.some((line) => /"reachException"/.test(line))) loosened.add('tests/feet-clear.test.ts');
    if (file === 'content/scale-anchors.json' && grew(ruledRanges(json(file, true)), ruledRanges(json(file, false)))) {
      loosened.add('tests/scale-vs-thad.test.mjs');
    }
    if (file === 'tests/data/repeats-passed.json' && grew(exempt(json(file, true)), exempt(json(file, false)))) {
      loosened.add('tests/repeats.test.ts');
    }
  }
  return { loosened, problems };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const event = process.env.GITHUB_EVENT_PATH ? JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')) : null;
  if (process.env.GITHUB_EVENT_PATH && !event?.pull_request) {
    console.log('not a pull request -- nothing to read');
    process.exit(0);
  }
  const base = event?.pull_request ? `origin/${event.pull_request.base.ref}` : process.argv[2] ?? 'origin/main';
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 });

  const files = git('diff', '--name-only', `${base}...HEAD`).split('\n').filter(Boolean);
  const inBase = (file) => {
    try { git('cat-file', '-e', `${base}:${file}`); return true; } catch { return false; }
  };
  const json = (file, atBase) => {
    try { return JSON.parse(atBase ? git('show', `${base}:${file}`) : readFileSync(file, 'utf8')); } catch { return null; }
  };
  const { loosened, problems } = findLoosenings(files, { diffOf: (file) => git('diff', '-U0', `${base}...HEAD`, '--', file), inBase, json });

  const read = (ref) => {
    try { return JSON.parse(ref ? git('show', `${ref}:${LEDGER}`) : readFileSync(LEDGER, 'utf8')); } catch { return { entries: [] }; }
  };
  const before = read(base).entries ?? [];
  const now = existsSync(LEDGER) ? read(null).entries ?? [] : [];
  const recordedHere = now.slice(before.length);

  const failures = [...problems];
  for (const check of loosened) {
    if (check === LEDGER) continue;
    if (!recordedHere.some((entry) => entry.check === check && entry.kind === 'loosened')) {
      failures.push(`${check} is loosened here and ${LEDGER} has no "loosened" entry for it -- record what it misfired on.`);
    }
  }

  // Friction: a check loosened LIMIT times in WINDOW_DAYS since it was last reviewed.
  const cutoff = Date.now() - WINDOW_DAYS * 86400000;
  const byCheck = new Map();
  for (const entry of now) {
    if (!byCheck.has(entry.check)) byCheck.set(entry.check, []);
    byCheck.get(entry.check).push(entry);
  }
  for (const [check, entries] of byCheck) {
    const lastReview = entries.map((entry, index) => (entry.kind === 'reviewed' ? index : -1)).reduce((a, b) => Math.max(a, b), -1);
    const recent = entries.slice(lastReview + 1)
      .filter((entry) => entry.kind === 'loosened' && Date.parse(entry.date) >= cutoff);
    if (recent.length >= LIMIT) {
      failures.push(`${check} has been loosened ${recent.length} times in ${WINDOW_DAYS} days without a review. `
        + 'In this pull request, TUNE it so it stops misfiring or MERGE it with the check it duplicates, and add '
        + `{"check": "${check}", "kind": "reviewed", "date": ..., "why": "<what you concluded>"} to ${LEDGER}. `
        + 'If it should be retired, say so in that entry; the twice-monthly review puts it to Tyler.');
    }
  }

  console.log(`changed files: ${files.length}; loosened here: ${[...loosened].join(', ') || 'none'}; ledger entries: ${now.length}`);
  if (failures.length) {
    console.log(['', 'CHECK FRICTION (CLAUDE.md, "Checks that get in the way are noticed at once"):', ...failures.map((f) => `  - ${f}`)].join('\n'));
    process.exit(1);
  }
  console.log('ok');
}
