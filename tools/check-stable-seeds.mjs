import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Report } from './lib/content.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PIXELART = join(ROOT, 'tools/pixelart');

/**
 * No render may be seeded from Python's `hash()`.
 *
 * CPython salts string hashing per interpreter run unless PYTHONHASHSEED is
 * set. A generator seeded from `hash("stars")` therefore produces a different
 * sequence in every process, which means:
 *
 *   - `npm run renders` is not idempotent. Every pass rewrites every file it
 *     touches, so `git status` after a render is a wall of changed PNGs and
 *     the one that actually changed is invisible in it.
 *   - No render can be diffed against its predecessor, which is the entire
 *     working method of an art pipeline.
 *   - A "fix" and a reshuffle are indistinguishable in review.
 *
 * THIS HAS NOW BITTEN TWICE. `ambient_sprites.py` was the first and its
 * comment records the diagnosis; `room01/layout.py`'s `Ctx.stream` was the
 * second, found while building the Room 1 rebuild's own tooling and only
 * because a byte-identical re-render was needed to judge a change. Twice is a
 * pattern, and a pattern gets a check rather than a third comment.
 *
 * WHAT IS ALLOWED. Any hash that is arithmetic on integers: FNV-1a, crc32, the
 * xor-multiply-shift helpers in `terrain.py` and `rail.py`. Those are stable
 * across processes by construction, which is the whole requirement. The rule
 * is not "no hashing" -- it is "no hashing whose result the interpreter is
 * free to change between runs".
 */

//: Python's builtin, and only it. A local `_hash(x, y, salt)` is a different
//: identifier and is exactly the right thing to write instead, so the pattern
//: must not match one: the lookbehind rejects a leading word character or dot.
const BUILTIN_HASH = /(?<![\w.])hash\s*\(/;

//: Relying on the environment instead of on the code. It works until somebody
//: runs a script without it, which is every CI job and every new machine.
const ENV_RELIANCE = /PYTHONHASHSEED/;

function pythonFiles(directory) {
  const found = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) {
        if (entry !== '__pycache__') walk(path);
      } else if (entry.endsWith('.py')) {
        found.push(path);
      }
    }
  };
  walk(directory);
  return found;
}

export function check() {
  const report = new Report('Renders are seeded stably -- no hash() in the pipeline');
  const files = pythonFiles(PIXELART);

  if (files.length === 0) {
    report.fail('no pixel-art modules found -- the check is looking in the wrong place');
    return report;
  }

  let flagged = 0;
  for (const path of files) {
    const shown = relative(ROOT, path);
    const source = readFileSync(path, 'utf8');
    // Docstrings explain this rule at length -- layout.py's Ctx.stream spends a
    // paragraph on the exact call this pattern matches -- so they are blanked
    // rather than removed, keeping every newline so line numbers still point
    // at the code they name. Stripping them outright and scanning the original
    // reported the explanation as the offence, which is a check that fails on
    // its own documentation.
    const code = source
      .replace(/"""[\s\S]*?"""/g, (block) => block.replace(/[^\n]/g, ' '))
      .replace(/'''[\s\S]*?'''/g, (block) => block.replace(/[^\n]/g, ' '));

    code.split('\n').forEach((line, index) => {
      const stripped = line.replace(/#.*$/, '');
      if (BUILTIN_HASH.test(stripped)) {
        flagged += 1;
        report.fail(
          `${shown}:${index + 1} seeds from Python's hash(), which CPython salts ` +
            'per run -- use FNV-1a, crc32, or an integer mix instead',
        );
      }
    });

    if (ENV_RELIANCE.test(code)) {
      flagged += 1;
      report.fail(
        `${shown} relies on PYTHONHASHSEED -- stability belongs in the code, not ` +
          'in whoever remembered to export it',
      );
    }
  }

  report.note(`${files.length} pixel-art module(s) checked, ${flagged} flagged`);
  return report;
}
