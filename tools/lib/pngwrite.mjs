import { deflateSync } from 'node:zlib';

/**
 * A minimal PNG writer, the counterpart to `readPng`.
 *
 * Written rather than depended on. The derivation in `tools/art/derive.mjs`
 * has to record the EXACT resampling algorithm in provenance, and "whatever
 * Pillow 11 does" or "whatever this Chromium build's canvas does" is not that
 * -- neither is pinned, neither is in the tree, and Pillow is not installed in
 * this container at all, so the pixel pipeline's own Python cannot run here.
 * Sixty lines that are read and versioned beat a dependency that answers
 * differently on a different machine.
 *
 * Deliberately narrow, in the same spirit as the reader: 8-bit, RGB or RGBA,
 * non-interlaced, one IDAT. No palette, no interlace, no ancillary chunks.
 */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(bytes) {
  let c = -1;
  for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, body) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
  return Buffer.concat([head, body, crc]);
}

/**
 * @param {{width:number,height:number,pixels:Uint8Array}} image RGBA, 4 bytes per pixel
 * @param {{alpha?:boolean}} options `alpha:false` writes colour type 2
 */
export function writePng({ width, height, pixels }, { alpha = true } = {}) {
  const channels = alpha ? 4 : 3;
  // FILTER TYPE 0 ON EVERY ROW, and that is a deliberate choice, not laziness.
  // An adaptive filter would compress better and would make the output depend
  // on a heuristic. The derived plate's hash goes into provenance and is
  // compared against later, so every byte of it has to come from a rule
  // somebody can read, not from whichever filter scored best on that row.
  const raw = Buffer.alloc((width * channels + 1) * height);
  let at = 0;
  for (let y = 0; y < height; y += 1) {
    raw[at] = 0;
    at += 1;
    for (let x = 0; x < width; x += 1) {
      const from = (y * width + x) * 4;
      raw[at] = pixels[from];
      raw[at + 1] = pixels[from + 1];
      raw[at + 2] = pixels[from + 2];
      if (alpha) raw[at + 3] = pixels[from + 3];
      at += channels;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = alpha ? 6 : 2;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    // Fixed level, so the same pixels always produce the same file.
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
