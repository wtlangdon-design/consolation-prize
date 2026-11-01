#!/usr/bin/env node
/**
 * EVERY CORRECTION CARRIES ITS LESSON -- checked by CI, so nobody has to.
 *
 * Tyler, 2026-11-01, on the rule that a fix is not finished until it brings
 * a check or a doc 55 section 8 row with it: "Ugh but I don't want to have
 * to do that" -- i.e. verify it himself. So a pull request is read here:
 *
 *   A pull request that FIXES something (its title or description quotes
 *   Tyler, or says fix, found, flagged, reported, corrected, wrong, too
 *   bright, too dark, too sharp ...) must, in the same pull request, change a
 *   test (tests/*.test.*), a check (tools/check-*.mjs) or doc 55 section 8.
 *   A pull request that fixes nothing says so in its description with a line
 *   `Lesson: none -- <why>` (a first build of a room, a build-log entry).
 *
 * Run by .github/workflows/checks.yml on pull requests only. Locally:
 *   node tools/check-lesson-carried.mjs <base-ref> "<title>" "<body>"
 * It reads the pull request from $GITHUB_EVENT_PATH when that is set.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const event = process.env.GITHUB_EVENT_PATH ? JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')) : null;
const pr = event?.pull_request;
if (process.env.GITHUB_EVENT_PATH && !pr) {
  console.log('not a pull request -- nothing to read');
  process.exit(0);
}
const base = pr ? `origin/${pr.base.ref}` : process.argv[2] ?? 'origin/main';
const title = pr ? pr.title ?? '' : process.argv[3] ?? '';
const body = pr ? pr.body ?? '' : process.argv[4] ?? '';
const text = `${title}\n${body}`;

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
const files = git('diff', '--name-only', `${base}...HEAD`).split('\n').filter(Boolean);

const FIX = /\bTyler\b[^\n]{0,40}:|\bfix(es|ed|ing)?\b|\bfound\b|\bflagged\b|\breported\b|\bcorrect(s|ed|ion)\b|\bwas wrong\b|\btoo (bright|dark|sharp|big|small)\b|\bbroke(n)?\b/i;
const optOut = /^\s*Lesson:\s*none\b\s*(--|—|-|:)\s*\S/im.test(body);
const isFix = FIX.test(text);

// Doc 55 section 8 counts only if an added line falls inside section 8.
function addsToSectionEight() {
  const path = 'docs/55-full-game-build.md';
  if (!files.includes(path)) return false;
  const now = readFileSync(path, 'utf8').split('\n');
  const start = now.findIndex((line) => /^## 8 · /.test(line));
  if (start < 0) return false;
  const next = now.findIndex((line, index) => index > start && /^## \d+ · /.test(line));
  const end = next < 0 ? now.length : next;
  const diff = git('diff', '-U0', `${base}...HEAD`, '--', path);
  for (const hunk of diff.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
    const from = Number(hunk[1]) - 1;
    const count = hunk[2] === undefined ? 1 : Number(hunk[2]);
    if (count > 0 && from < end && from + count > start) return true;
  }
  return false;
}

const carries = files.some((file) => /^tests\/.+\.test\.(ts|mjs)$/.test(file) || /^tools\/check-.+\.mjs$/.test(file))
  || addsToSectionEight();

console.log(`pull request: ${title}`);
console.log(`changed files: ${files.length}; reads as a fix: ${isFix}; carries a lesson: ${carries}; opted out: ${optOut}`);
if (!isFix || carries || optOut) {
  console.log('ok');
  process.exit(0);
}
console.log([
  '',
  'THIS PULL REQUEST FIXES SOMETHING AND CARRIES NO LESSON (CLAUDE.md, "Every correction carries its lesson").',
  'In this same pull request, do one of:',
  '  - add or extend a test (tests/*.test.ts) or check (tools/check-*.mjs) that fails on the defect,',
  '    proved by putting the defect back and watching it fail; or',
  '  - for a matter of taste, add a row to docs/55-full-game-build.md section 8',
  '    (what went wrong, where, and the process that worked); or',
  '  - if it fixes nothing, put a line in the description:  Lesson: none -- <why>',
].join('\n'));
process.exit(1);
