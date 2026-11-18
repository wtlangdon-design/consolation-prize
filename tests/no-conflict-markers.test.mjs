import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

/**
 * NO FILE IS COMMITTED IN THE MIDDLE OF A MERGE (errata 260).
 *
 * On 2026-11-10 a merge that conflicted was committed with `git add -A` before it was resolved. Two documents were put
 * right at once; the image session's two records, art/staging/caps.json and art/staging/ledger.json, went to main with
 * the markers still in them and were not valid JSON for five merges, because nothing in the game reads them and no
 * check opened them. This opens everything: no tracked text file has a line that begins a conflict.
 */
/** What a conflict can never be written into. */
export const BINARY = ['png', 'webp', 'gif', 'jpg', 'jpeg', 'wav', 'mp3', 'ogg', 'ttf', 'otf', 'woff', 'woff2', 'npy'];

test('no tracked file carries a merge conflict marker', () => {
  let found = '';
  try {
    // Images, sounds and fonts are never opened: -I would read each one only to skip it, and they are 3,700 of the
    // repository's files and nearly all its bytes (the check review, 2026-11-18).
    found = execFileSync('git', ['grep', '-l', '-I', '-E', '^(<<<<<<< |>>>>>>> )', '--', '.', ':!tests/no-conflict-markers.test.mjs',
      ...BINARY.map((extension) => `:!*.${extension}`)],
      { cwd: new URL('..', import.meta.url), encoding: 'utf8' });
  } catch (error) {
    // git grep exits 1 when nothing matches, which is the pass.
    if (error.status !== 1) throw error;
  }
  assert.equal(found.trim(), '', 'resolve these, then commit');
});

test('the image session\'s two records are JSON, and every attempt logged is under a cap that names its asset', async () => {
  const { readFileSync } = await import('node:fs');
  const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
  const caps = read('art/staging/caps.json');
  const ledger = read('art/staging/ledger.json');
  assert.ok(Array.isArray(ledger.attempts) && ledger.attempts.length > 300);
  assert.ok(Object.keys(caps.perAsset).length > 50);
});

test('the files skipped are only ones a merge cannot leave markers in: no extension a text file uses', () => {
  const text = new Set(['json', 'md', 'ts', 'mjs', 'js', 'txt', 'py', 'html', 'yml', 'yaml', 'css', 'svg', 'csv', 'gitignore', 'keep']);
  assert.deepEqual(BINARY.filter((extension) => text.has(extension)), []);
  // And every extension the repository tracks is either skipped or opened on purpose: a new kind of file is decided.
  const tracked = execFileSync('git', ['ls-files'], { cwd: new URL('..', import.meta.url), encoding: 'utf8', maxBuffer: 64 << 20 })
    .split('\n').filter(Boolean).map((path) => path.split('/').pop().split('.').pop());
  assert.deepEqual([...new Set(tracked)].filter((extension) => !text.has(extension) && !BINARY.includes(extension)), []);
});
