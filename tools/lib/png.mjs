import { inflateSync } from 'node:zlib';

/**
 * A minimal PNG reader, so a check can look at pixels.
 *
 * Errata 29 moves the inventory to icons and keeps the uniqueness rule that
 * protected the Form 12-C gag: two items must not render the same icon. That
 * check is only worth having if it reads the actual image -- a hash written
 * out by the generator would only ever prove the generator agreed with
 * itself.
 *
 * Deliberately narrow. It reads 8-bit RGBA, non-interlaced, which is what
 * every sheet in this project is written as and what canvas.save_rgba
 * produces. Anything else throws rather than guessing, because a reader that
 * quietly mis-decodes is worse than no reader: it would compare two wrong
 * images and report them different.
 */
export function readPng(bytes) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let index = 0; index < signature.length; index += 1) {
    if (bytes[index] !== signature[index]) throw new Error('not a PNG');
  }

  let width = 0;
  let height = 0;
  const idat = [];
  let cursor = 8;
  while (cursor < bytes.length) {
    const length = bytes.readUInt32BE(cursor);
    const type = bytes.toString('ascii', cursor + 4, cursor + 8);
    const body = bytes.subarray(cursor + 8, cursor + 8 + length);
    if (type === 'IHDR') {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      const depth = body[8];
      const colour = body[9];
      const interlace = body[12];
      if (depth !== 8 || colour !== 6 || interlace !== 0) {
        throw new Error(`unsupported PNG: depth ${depth}, colour type ${colour}, interlace ${interlace}`);
      }
    } else if (type === 'IDAT') {
      idat.push(body);
    } else if (type === 'IEND') {
      break;
    }
    cursor += 12 + length;
  }

  const raw = inflateSync(Buffer.concat(idat));
  const bpp = 4;
  const stride = width * bpp;
  const pixels = Buffer.alloc(height * stride);

  // Undo the per-scanline filters. Five of them, and every one is needed:
  // an encoder picks per row and PIL uses most of them on a small sprite.
  for (let row = 0; row < height; row += 1) {
    const filter = raw[row * (stride + 1)];
    const from = row * (stride + 1) + 1;
    const to = row * stride;
    for (let index = 0; index < stride; index += 1) {
      const value = raw[from + index];
      const left = index >= bpp ? pixels[to + index - bpp] : 0;
      const up = row > 0 ? pixels[to - stride + index] : 0;
      const upLeft = row > 0 && index >= bpp ? pixels[to - stride + index - bpp] : 0;
      let out;
      if (filter === 0) out = value;
      else if (filter === 1) out = value + left;
      else if (filter === 2) out = value + up;
      else if (filter === 3) out = value + ((left + up) >> 1);
      else if (filter === 4) {
        const p = left + up - upLeft;
        const dl = Math.abs(p - left);
        const du = Math.abs(p - up);
        const dul = Math.abs(p - upLeft);
        out = value + (dl <= du && dl <= dul ? left : du <= dul ? up : upLeft);
      } else throw new Error(`unknown PNG filter ${filter}`);
      pixels[to + index] = out & 0xff;
    }
  }

  return { width, height, pixels };
}

/** The bytes of one rectangle, as a comparable string. */
export function region(image, [x, y, width, height]) {
  const out = [];
  for (let row = y; row < y + height; row += 1) {
    for (let column = x; column < x + width; column += 1) {
      const at = (row * image.width + column) * 4;
      const alpha = image.pixels[at + 3];
      // A fully transparent pixel's colour is not drawn, so it must not count
      // toward whether two icons look alike -- otherwise two identical icons
      // on different background bytes would read as different.
      out.push(alpha === 0 ? '.' : `${image.pixels[at]},${image.pixels[at + 1]},${image.pixels[at + 2]}`);
    }
  }
  return out.join('|');
}
