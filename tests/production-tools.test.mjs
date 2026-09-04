import assert from 'node:assert/strict';
import test from 'node:test';

import { CROP, FIXED_ROOM, resample, SOURCE_SIZE } from '../tools/art/derive.mjs';
import { readPng } from '../tools/lib/png.mjs';
import { resolveIssueRef } from '../tools/lib/issueref.mjs';
import { writePng } from '../tools/lib/pngwrite.mjs';

/**
 * THE TOOLS HALF OF THE PRODUCTION MACHINERY: qualified issue references, and
 * errata 63's source-acquisition transform.
 *
 * Plain ESM, because the tools are. See the note in `production.test.ts`.
 */

test('a bare Q id is refused, because docs/36 carries two Q-number series', () => {
  const bare = resolveIssueRef('Q16');
  assert.equal(bare.ok, false);
  assert.match(bare.why, /not a qualified reference/);

  // Q16 names two different issues, and that is exactly the ambiguity.
  const ambiguous = resolveIssueRef('docs/36-issue-list.md::Q16');
  assert.equal(ambiguous.ok, false);
  assert.match(ambiguous.why, /AMBIGUOUS/);
});

test('a qualified reference resolves, and survives a status suffix', () => {
  // The heading in the document reads "... — **FIXED**"; the reference does
  // not, and still resolves, because an exact-match-only rule would break
  // every reference the moment its issue was closed.
  const found = resolveIssueRef('docs/36-issue-list.md::Q16 · `check-item-names`');
  assert.equal(found.ok, true);
  assert.ok(found.line > 0);
});

test('an occurrence selector picks between identical headings', () => {
  const first = resolveIssueRef('docs/05-examine-layer.md::ROOM 5 — ASSAY OFFICE, FRONT#1');
  const second = resolveIssueRef('docs/05-examine-layer.md::ROOM 5 — ASSAY OFFICE, FRONT#2');
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.notEqual(first.line, second.line);

  const missing = resolveIssueRef('docs/05-examine-layer.md::ROOM 5 — ASSAY OFFICE, FRONT#9');
  assert.equal(missing.ok, false);
});

test('the errata 63 crop is exactly 20:9, as a fixed room is', () => {
  assert.equal(CROP.width / CROP.height, FIXED_ROOM.width / FIXED_ROOM.height);
  assert.equal(CROP.x + CROP.width <= SOURCE_SIZE.width, true);
  assert.equal(CROP.y + CROP.height <= SOURCE_SIZE.height, true);
});

test('the resampler is deterministic and preserves a flat field exactly', () => {
  const width = 40;
  const height = 18;
  const pixels = new Uint8Array(width * height * 4);
  for (let at = 0; at < pixels.length; at += 4) {
    pixels[at] = 130; pixels[at + 1] = 70; pixels[at + 2] = 200; pixels[at + 3] = 255;
  }
  const source = { width, height, pixels };
  const once = resample(source, 80, 36);
  const twice = resample(source, 80, 36);
  assert.deepEqual([...once.pixels], [...twice.pixels]);

  // A NORMALISED KERNEL MUST NOT CHANGE A CONSTANT. Un-normalised Lanczos
  // weights darken the edges of the frame, which would read as a lighting
  // change nobody authored.
  for (let at = 0; at < once.pixels.length; at += 4) {
    assert.equal(once.pixels[at], 130);
    assert.equal(once.pixels[at + 1], 70);
    assert.equal(once.pixels[at + 2], 200);
  }
});

test('the PNG writer round-trips through the project\'s own reader', () => {
  const width = 7;
  const height = 5;
  const pixels = new Uint8Array(width * height * 4);
  for (let at = 0; at < pixels.length; at += 4) {
    pixels[at] = at % 251; pixels[at + 1] = (at * 3) % 253;
    pixels[at + 2] = (at * 7) % 249; pixels[at + 3] = 255;
  }
  const read = readPng(writePng({ width, height, pixels }, { alpha: false }));
  assert.equal(read.width, width);
  assert.equal(read.height, height);
  assert.equal(read.hasAlpha, false);
  for (let at = 0; at < pixels.length; at += 4) {
    assert.equal(read.pixels[at], pixels[at]);
    assert.equal(read.pixels[at + 1], pixels[at + 1]);
    assert.equal(read.pixels[at + 2], pixels[at + 2]);
  }
});
