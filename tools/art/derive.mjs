import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

import { ROOT } from '../lib/content.mjs';
import { readPng } from '../lib/png.mjs';
import { writePng } from '../lib/pngwrite.mjs';

/**
 * SOURCE SIZE IS NOT SHIPPING SIZE. Errata 63, and it is provisional.
 *
 * Room dimensions are canonical and an image API does not get a vote on them:
 * a fixed room ships at 1920 x 864 and a scrolling room at its authored width
 * x 864. `gpt-image-2` returns 1536 x 1024 landscape and cannot return
 * 1920 x 864. The direction of accommodation is therefore fixed -- the source
 * is adapted to the room, never the room to the source -- and this module is
 * that adaptation, FOR THE ROOM 5 PILOT ONLY.
 *
 *   API source      1536 x 1024                    kept untouched
 *   crop            x 8, y 170, w 1520, h 684      exactly 20:9
 *   resample        1520 x 684  ->  1920 x 864     Lanczos-3, separable
 *
 * The prompt must place the playable composition inside a central 20:9 safe
 * region with expendable composition above and below, because the crop throws
 * 170 rows off the top and 170 off the bottom.
 *
 * WHAT THIS DELIBERATELY IS NOT. No AI upscaling, no sharpening, no
 * denoising, no recolouring, no contrast enhancement, and no second
 * generative pass whose purpose is reaching the shipping dimensions. It is
 * one ordinary filtered resample and nothing else, which is also why the
 * kernel is in this file rather than behind a library call: the provenance
 * row has to name the EXACT algorithm, and "whatever the installed Pillow
 * does" is not a name. Pillow is not installed in this container in any case.
 *
 * NEAREST-NEIGHBOUR IS SPECIFICALLY EXCLUDED. The old pipeline used it
 * because it was drawing 1-bit-ish pixel art into an indexed palette, and
 * errata 54 removed both. Point-sampling a painted plate up by 1.263 produces
 * a visible stair on every edge in the frame; that would be inheriting a
 * habit from a spec that no longer exists.
 *
 * IT IS PROVISIONAL AND ONE ROOM WIDE. Tyler's full-frame review of Room 5
 * decides whether this treatment is visually acceptable before Room 6. It
 * does not become a forty-room rule because the command executes.
 */

export const SOURCE_SIZE = { width: 1536, height: 1024 };
export const CROP = { x: 8, y: 170, width: 1520, height: 684 };
export const FIXED_ROOM = { width: 1920, height: 864 };

/** Named in provenance verbatim. Change the name if the kernel changes. */
export const RESAMPLER = 'lanczos3-separable-premultiplied-srgb-clamped';

const LOBE = 3;

function lanczos(x) {
  if (x === 0) return 1;
  const a = Math.abs(x);
  if (a >= LOBE) return 0;
  const pix = Math.PI * a;
  return (LOBE * Math.sin(pix) * Math.sin(pix / LOBE)) / (pix * pix);
}

/**
 * One axis of the separable filter, precomputed per destination sample.
 *
 * Weights are normalised so each output pixel's contributions sum to exactly
 * one; without that, a Lanczos kernel darkens or brightens the edges of the
 * frame, which would read as a lighting change nobody authored.
 */
function taps(sourceLength, destLength) {
  const scale = destLength / sourceLength;
  const support = scale >= 1 ? LOBE : LOBE / scale;
  const rows = [];
  for (let out = 0; out < destLength; out += 1) {
    const centre = (out + 0.5) / scale - 0.5;
    const first = Math.max(0, Math.ceil(centre - support));
    const last = Math.min(sourceLength - 1, Math.floor(centre + support));
    const indices = [];
    const weights = [];
    let total = 0;
    for (let at = first; at <= last; at += 1) {
      const weight = lanczos(scale >= 1 ? at - centre : (at - centre) * scale);
      if (weight === 0) continue;
      indices.push(at);
      weights.push(weight);
      total += weight;
    }
    for (let index = 0; index < weights.length; index += 1) weights[index] /= total;
    rows.push({ indices, weights });
  }
  return rows;
}

function crop(image, rect) {
  const out = new Uint8Array(rect.width * rect.height * 4);
  for (let y = 0; y < rect.height; y += 1) {
    const from = ((rect.y + y) * image.width + rect.x) * 4;
    out.set(image.pixels.subarray(from, from + rect.width * 4), y * rect.width * 4);
  }
  return { width: rect.width, height: rect.height, pixels: out };
}

/**
 * Separable Lanczos-3. Horizontal into a float buffer, then vertical.
 *
 * Colour is premultiplied by alpha before filtering and unpremultiplied
 * after. On a fully opaque plate that is a no-op; on anything with a key it
 * is the difference between a clean edge and a halo of whatever colour the
 * transparent pixels happened to carry.
 */
export function resample(image, width, height) {
  const across = taps(image.width, width);
  const down = taps(image.height, height);

  const middle = new Float64Array(width * image.height * 4);
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const { indices, weights } = across[x];
      let r = 0; let g = 0; let b = 0; let a = 0;
      for (let n = 0; n < indices.length; n += 1) {
        const at = (y * image.width + indices[n]) * 4;
        const weight = weights[n];
        const alpha = image.pixels[at + 3] / 255;
        r += image.pixels[at] * alpha * weight;
        g += image.pixels[at + 1] * alpha * weight;
        b += image.pixels[at + 2] * alpha * weight;
        a += image.pixels[at + 3] * weight;
      }
      const to = (y * width + x) * 4;
      middle[to] = r; middle[to + 1] = g; middle[to + 2] = b; middle[to + 3] = a;
    }
  }

  const out = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const { indices, weights } = down[y];
    for (let x = 0; x < width; x += 1) {
      let r = 0; let g = 0; let b = 0; let a = 0;
      for (let n = 0; n < indices.length; n += 1) {
        const at = (indices[n] * width + x) * 4;
        const weight = weights[n];
        r += middle[at] * weight;
        g += middle[at + 1] * weight;
        b += middle[at + 2] * weight;
        a += middle[at + 3] * weight;
      }
      const alpha = Math.min(255, Math.max(0, a));
      const scale = alpha > 0 ? 255 / alpha : 0;
      const to = (y * width + x) * 4;
      out[to] = clampByte(r * scale);
      out[to + 1] = clampByte(g * scale);
      out[to + 2] = clampByte(b * scale);
      out[to + 3] = clampByte(alpha);
    }
  }
  return { width, height, pixels: out };
}

/** Round half away from zero, then clamp. Stated because it is part of the algorithm. */
function clampByte(value) {
  const rounded = Math.floor(value + 0.5);
  return rounded < 0 ? 0 : rounded > 255 ? 255 : rounded;
}

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

/**
 * Derive a fixed-room shipping candidate from an API source.
 *
 * Refuses rather than adapting. A source that is not 1536 x 1024 is not the
 * thing this crop rectangle was authored against, and cropping it anyway
 * would silently take a different part of a different picture.
 *
 * @returns the provenance fragment. Both files are on disk when it returns.
 */
export function deriveFixedRoomPlate({ source, out, crop: rect = CROP, alpha = false }) {
  const sourceBytes = readFileSync(resolve(ROOT, source));
  const image = readPng(sourceBytes);

  if (image.width !== SOURCE_SIZE.width || image.height !== SOURCE_SIZE.height) {
    throw new Error(`${source} is ${image.width}x${image.height} and the crop rectangle was `
      + `authored against ${SOURCE_SIZE.width}x${SOURCE_SIZE.height}. Cropping it anyway `
      + 'would take a different part of a different picture. Errata 63.');
  }
  if (rect.x < 0 || rect.y < 0
    || rect.x + rect.width > image.width || rect.y + rect.height > image.height) {
    throw new Error(`the crop ${JSON.stringify(rect)} falls outside the source`);
  }
  const sourceRatio = rect.width / rect.height;
  const shipRatio = FIXED_ROOM.width / FIXED_ROOM.height;
  if (Math.abs(sourceRatio - shipRatio) > 1e-9) {
    throw new Error(`the crop is ${sourceRatio.toFixed(6)}:1 and a fixed room is `
      + `${shipRatio.toFixed(6)}:1. A non-matching crop would stretch the picture, which is a `
      + 'change to the art and not a change of size.');
  }

  const cropped = crop(image, rect);
  const derived = resample(cropped, FIXED_ROOM.width, FIXED_ROOM.height);
  const bytes = writePng(derived, { alpha: alpha && image.hasAlpha });

  const full = resolve(ROOT, out);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, bytes);

  return {
    transform: 'errata-63-fixed-room-source-acquisition',
    provisional: true,
    provisionalNote: 'ROOM 5 PILOT ONLY. Tyler\'s full-frame review decides whether this '
      + 'source-to-shipping treatment survives to Room 6. It is not a forty-room rule.',
    source: {
      path: relative(ROOT, resolve(ROOT, source)),
      hash: sha(sourceBytes),
      width: image.width,
      height: image.height,
      bytes: sourceBytes.length,
      kept: true,
    },
    crop: { ...rect, aspect: '20:9' },
    resample: {
      algorithm: RESAMPLER,
      lobes: LOBE,
      from: [rect.width, rect.height],
      to: [FIXED_ROOM.width, FIXED_ROOM.height],
      factor: FIXED_ROOM.width / rect.width,
      normalisedWeights: true,
      premultiplied: true,
      rounding: 'half-away-from-zero, clamped to 0..255',
      forbidden: ['nearest-neighbour', 'ai-upscale', 'sharpen', 'denoise', 'recolour',
        'contrast-enhancement', 'generative-second-pass'],
    },
    derived: {
      path: relative(ROOT, full),
      hash: sha(bytes),
      width: derived.width,
      height: derived.height,
      bytes: bytes.length,
      colourType: (alpha && image.hasAlpha) ? 6 : 2,
    },
  };
}
