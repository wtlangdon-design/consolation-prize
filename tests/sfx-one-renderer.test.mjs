/**
 * EVERY SOUND FILE HAS ONE RENDERER (errata 149). Tyler picked a new stamp and
 * a new eruption by ear; the scripts that made the old ones still wrote the
 * same files, so running them would have silently put back the sounds he
 * rejected ("The stamp doesn't sound like a stamp."). Each audio/sfx file may be
 * written by one tools/audio script only.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

test('no two audio scripts write the same sound file', () => {
  const writers = new Map();
  for (const name of readdirSync(resolve(ROOT, 'tools/audio')).filter((n) => n.endsWith('.py'))) {
    const code = readFileSync(resolve(ROOT, 'tools/audio', name), 'utf8')
      .split('\n').filter((line) => !line.trim().startsWith('#')).join('\n');
    const files = new Set([...code.matchAll(/save\(\s*['"]([\w.-]+\.wav)['"]/g)].map((m) => m[1]));
    for (const m of code.matchAll(/:\s*['"]([\w.-]+\.wav)['"]/g)) files.add(m[1]);
    for (const file of files) writers.set(file, [...(writers.get(file) ?? []), name]);
  }
  const twice = [...writers].filter(([, by]) => by.length > 1).map(([file, by]) => `${file}: ${by.join(', ')}`);
  assert.deepEqual(twice, [], 'a sound written by two scripts reverts whichever was chosen last');
  assert.deepEqual(writers.get('stamp.wav'), ['render-picked-sfx.py']);
  assert.deepEqual(writers.get('crowd-erupts.wav'), ['render-picked-sfx.py']);
});
