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
 *    content/ui/duplicate-allowlist.json), or adding a `movementException`.
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
 * Locally: node tools/check-friction.mjs [base-ref]
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const event = process.env.GITHUB_EVENT_PATH ? JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')) : null;
if (process.env.GITHUB_EVENT_PATH && !event?.pull_request) {
  console.log('not a pull request -- nothing to read');
  process.exit(0);
}
const base = event?.pull_request ? `origin/${event.pull_request.base.ref}` : process.argv[2] ?? 'origin/main';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const LEDGER = 'proofs/check-friction.json';
const WINDOW_DAYS = 14;
const LIMIT = 3;

const files = git('diff', '--name-only', `${base}...HEAD`).split('\n').filter(Boolean);
const existedInBase = (file) => {
  try { git('cat-file', '-e', `${base}:${file}`); return true; } catch { return false; }
};
const isCheck = (file) => /^tests\/.+\.test\.(ts|mjs)$/.test(file) || /^tools\/check-.+\.mjs$/.test(file);
const EXCEPTION_FILES = ['proofs/played-pending.json', 'content/ui/duplicate-allowlist.json'];

// What this pull request loosens, by the check or list it loosens.
const loosened = new Set();
for (const file of files) {
  const diff = git('diff', '-U0', `${base}...HEAD`, '--', file);
  const added = diff.split('\n').filter((line) => line.startsWith('+') && !line.startsWith('+++'));
  const removed = diff.split('\n').filter((line) => line.startsWith('-') && !line.startsWith('---'));
  if (isCheck(file) && existedInBase(file)) {
    const numeric = (line) => /\d/.test(line.replace(/\/\/.*$/, ''));
    if (removed.some(numeric) && added.some(numeric)) loosened.add(file);
  }
  if (EXCEPTION_FILES.includes(file) && added.length > removed.length) loosened.add(file);
  if (file.startsWith('content/') && added.some((line) => /"movementException"/.test(line))) loosened.add('tests/movement.test.mjs');
}

const read = (ref) => {
  try { return JSON.parse(ref ? git('show', `${ref}:${LEDGER}`) : readFileSync(LEDGER, 'utf8')); } catch { return { entries: [] }; }
};
const before = read(base).entries ?? [];
const now = existsSync(LEDGER) ? read(null).entries ?? [] : [];
const recordedHere = now.slice(before.length);

const failures = [];
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
