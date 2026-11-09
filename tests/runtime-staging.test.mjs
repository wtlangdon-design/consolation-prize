import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { runtimeStagingPaths } from '../tools/lib/runtime-staging.mjs';

/**
 * THE SITE FITS IN A PAGES DEPLOY (errata 236). The build copied art/staging/ whole -- 1.3 GB of generations --
 * and the deploy, at 1.6 GB against GitHub Pages' 1 GB, timed out (run 42693542314). The build now copies only
 * the staged files the game's content names. These hold that the game's own staged files are still found, and
 * that what is shipped stays well under the limit.
 */
const root = new URL('..', import.meta.url).pathname;
const size = (path) => {
  const stat = statSync(path);
  if (!stat.isDirectory()) return stat.size;
  return readdirSync(path).reduce((sum, name) => sum + size(join(path, name)), 0);
};

test('the staged files the game loads are found', () => {
  const paths = runtimeStagingPaths(root);
  for (const needed of ['art/staging/room-05/floorboard/board-rest-c.png', 'art/staging/walk-c/diag-miners/up-0']) {
    assert.ok(paths.includes(needed), `${needed} is loaded by the game and would not be shipped`);
  }
});

test('what the build ships stays under 900 MB, so a Pages deploy (1 GB) does not time out', () => {
  const art = readdirSync(join(root, 'art')).filter((name) => name !== 'staging')
    .reduce((sum, name) => sum + size(join(root, 'art', name)), 0);
  const staged = runtimeStagingPaths(root).reduce((sum, path) => sum + size(join(root, path)), 0);
  const total = art + staged + size(join(root, 'audio')) + size(join(root, 'content'));
  assert.ok(total < 900e6, `the site would be ${(total / 1e6).toFixed(0)} MB`);
});

test('the build does not copy art/staging whole', () => {
  const config = readFileSync(join(root, 'vite.config.ts'), 'utf8');
  assert.match(config, /startsWith\('art\/staging'\)/, 'the copy no longer filters art/staging');
  assert.match(config, /runtimeStagingPaths/, 'the copy no longer adds back what the game loads');
});
