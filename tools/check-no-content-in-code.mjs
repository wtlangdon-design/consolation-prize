import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { listFiles, Report, ROOT, runCheck } from './lib/content.mjs';

/**
 * Enforces the one architecture rule: no content lives in code.
 *
 * Three separate tests, because "content" has three distinct failure modes:
 *  1. Fiction leaking into the engine -- character and place names.
 *  2. Prose leaking into the engine -- player-facing sentences as literals.
 *  3. Content being compiled in rather than loaded -- a JSON import.
 *
 * Comments are stripped first: a JSDoc block explaining an invariant is
 * documentation, not content. Developer-facing throw and console arguments
 * are also excluded -- they are never drawn to the screen.
 */

/**
 * Tokens from the fiction. Deliberately restricted to names that could not
 * plausibly be an engineering term, so this check has no false positives.
 * "Consolation" is absent on purpose: it is also the project name.
 */
const FICTION_TOKENS = [
  'Thaddeus',
  'Thad',
  'Grubb',
  'Fanshawe',
  'Absalom',
  'Winnie',
  'Obadiah',
  'Mott',
  'Sowerby',
  'Ozymandia',
  'Ignatius',
  'Cadwallader',
  'Sump',
  'Grievance',
  'Prosperity',
  'Clarion',
  'Nugget',
  'Deke',
  'Purvis',
  'Chapultepec',
  'Ah-Lam',
];

const MIN_PROSE_LENGTH = 25;
const MIN_PROSE_WORDS = 4;

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
}

function stripDeveloperMessages(source) {
  return source
    .replace(/Error\(([\s\S]*?)\)/g, 'Error()')
    .replace(/console\.\w+\(([\s\S]*?)\)/g, 'console.log()');
}

function stringLiterals(source) {
  const out = [];
  const pattern = /'([^'\\\n]*(?:\\.[^'\\\n]*)*)'|"([^"\\\n]*(?:\\.[^"\\\n]*)*)"|`([^`\\]*(?:\\.[^`\\]*)*)`/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    out.push(match[1] ?? match[2] ?? match[3] ?? '');
  }
  return out;
}

function looksLikeProse(text) {
  if (text.length < MIN_PROSE_LENGTH) return false;
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < MIN_PROSE_WORDS) return false;
  // Template placeholders and paths are structure, not prose.
  if (/^[\w./@-]+$/.test(text.trim())) return false;
  return true;
}

export function check() {
  const report = new Report('No content strings in any .ts file');
  const engineFiles = listFiles('engine', ['.ts']);
  const testFiles = listFiles('tests', ['.ts']);
  const files = [...engineFiles, ...testFiles];

  report.note(`scanned ${files.length} TypeScript files (${engineFiles.length} engine, ${testFiles.length} test)`);
  report.note('prose heuristic applies to engine/ only -- test names and assertion messages are developer text');

  for (const file of files) {
    const raw = readFileSync(resolve(ROOT, file), 'utf8');
    const code = stripDeveloperMessages(stripComments(raw));

    for (const token of FICTION_TOKENS) {
      const pattern = new RegExp(`\\b${token}\\b`, 'i');
      if (pattern.test(code)) {
        report.fail(`${file}: names the fiction ("${token}") -- the engine must not know Consolation`);
      }
    }

    if (engineFiles.includes(file)) {
      for (const literal of stringLiterals(code)) {
        if (looksLikeProse(literal)) {
          report.fail(`${file}: player-facing prose as a literal -- "${literal.slice(0, 48)}..."`);
        }
      }
    }

    if (/from\s+['"][^'"]*\/?content\/[^'"]*\.json['"]/.test(code)) {
      report.fail(`${file}: imports content JSON -- content must be loaded at runtime, not compiled in`);
    }
  }

  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
