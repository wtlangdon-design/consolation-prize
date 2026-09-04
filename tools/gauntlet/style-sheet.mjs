import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { ROOT, readJson } from '../lib/content.mjs';
import { readPng } from '../lib/png.mjs';
import { writePng } from '../lib/pngwrite.mjs';

/**
 * THE STYLE CONTINUITY SHEET. Tyler's ruling 10 and 48: evidence, not a verdict.
 *
 * One tracked PNG that puts, at ACTUAL RUNTIME SCALE, side by side:
 *
 *   1. the approved Room 1 full live-runtime frame;
 *   2. the candidate Room 5 full live-runtime frame (panel B of its proof);
 *   3. approved Thad at the size the runtime draws him in Room 1;
 *   4. Winnie at the size the runtime draws her in Room 5;
 *   5. a 1:1 crop of Room 1's environment;
 *   6. a comparable 1:1 crop of Room 5's environment;
 *   7. the two figures enlarged 3x, nearest-neighbour, FOR INSPECTION ONLY.
 *
 * Nothing here scores anything. Nearest-neighbour is used only on the
 * diagnostic row and only because a blurred enlargement would hide exactly
 * the pixel structure a person is trying to compare; no production art is
 * touched by it.
 *
 *   node tools/gauntlet/style-sheet.mjs <room5 populated frame.png> <out.png>
 */

const [, , room5Frame, out] = process.argv;
if (!room5Frame || !out) { console.error('usage: style-sheet.mjs <room 5 live frame> <out.png>'); process.exit(2); }

const load = (p) => readPng(readFileSync(resolve(ROOT, p)));
const room1 = load('renders/room-01-in-engine-1920x1080.png');
const room5 = load(room5Frame);
const thadRec = readJson('content/actors/thad.json');
const stand = thadRec.clips.find((c) => c.id === 'stand' && c.facing === 'front');
const thadSrc = load(stand.frames[0]);
const winnieRec = readJson('content/ambient/winnie.json');
const winnieSheet = load(winnieRec.sprite.sheet);
const [wx, wy, ww, wh] = winnieRec.sprite.frames[0];

// Thad at runtime scale in Room 1: his stage-road mid-band height / figureHeight.
const thadRuntime = 240 / stand.figureHeight;

function blank(w, h) { const p = new Uint8Array(w * h * 4); for (let i = 0; i < p.length; i += 4) { p[i] = 24; p[i + 1] = 24; p[i + 2] = 28; p[i + 3] = 255; } return { width: w, height: h, pixels: p }; }
function blit(dst, src, dx, dy, sx = 0, sy = 0, sw = src.width, sh = src.height, scale = 1, nearest = true) {
  for (let y = 0; y < Math.round(sh * scale); y += 1) {
    for (let x = 0; x < Math.round(sw * scale); x += 1) {
      const px = sx + Math.floor(x / scale), py = sy + Math.floor(y / scale);
      if (px >= src.width || py >= src.height) continue;
      const si = (py * src.width + px) * 4;
      const a = src.pixels[si + 3] / 255;
      if (a === 0) continue;
      const tx = dx + x, ty = dy + y;
      if (tx < 0 || ty < 0 || tx >= dst.width || ty >= dst.height) continue;
      const di = (ty * dst.width + tx) * 4;
      dst.pixels[di] = Math.round(src.pixels[si] * a + dst.pixels[di] * (1 - a));
      dst.pixels[di + 1] = Math.round(src.pixels[si + 1] * a + dst.pixels[di + 1] * (1 - a));
      dst.pixels[di + 2] = Math.round(src.pixels[si + 2] * a + dst.pixels[di + 2] * (1 - a));
      dst.pixels[di + 3] = 255;
    }
  }
}
/** Ordinary box-filtered downscale for the full frames (a half-scale overview is not production art either, but it should not lie by aliasing). */
function half(src) {
  const w = Math.floor(src.width / 2), h = Math.floor(src.height / 2);
  const p = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) {
    for (let c = 0; c < 4; c += 1) {
      let s = 0;
      for (let dy = 0; dy < 2; dy += 1) for (let dx = 0; dx < 2; dx += 1) s += src.pixels[(((y * 2 + dy) * src.width) + (x * 2 + dx)) * 4 + c];
      p[(y * w + x) * 4 + c] = Math.round(s / 4);
    }
  }
  return { width: w, height: h, pixels: p };
}
function scaled(src, k) {
  // Thad's frame is drawn by the runtime through filtered resampling; Lanczos
  // is what tools/art/derive.mjs implements, and it is used here for the
  // runtime-scale figure so this sheet shows what the game shows.
  return resample(src, Math.round(src.width * k), Math.round(src.height * k));
}
import { resample } from '../art/derive.mjs';

const W = 1940, H = 1080 + 40 + 500 + 40 + 560 + 60;
const sheet = blank(W, H);
// Row 1: the two full frames at half scale.
const r1 = half(room1), r5 = half(room5);
blit(sheet, r1, 10, 30); blit(sheet, r5, 20 + r1.width, 30);
// Row 2: figures at runtime scale, 1:1 environment crops.
const y2 = 30 + r1.height + 40;
const thadRt = scaled(thadSrc, thadRuntime);
const winnieRt = { width: ww, height: wh, pixels: new Uint8Array(ww * wh * 4) };
for (let y = 0; y < wh; y += 1) for (let x = 0; x < ww; x += 1) { const si = ((wy + y) * winnieSheet.width + (wx + x)) * 4; const di = (y * ww + x) * 4; winnieRt.pixels.set(winnieSheet.pixels.subarray(si, si + 4), di); }
blit(sheet, thadRt, 10, y2 + (500 - thadRt.height));
blit(sheet, winnieRt, 10 + thadRt.width + 20, y2 + (500 - winnieRt.height));
// 1:1 crops: Room 1 around the sign and fence at left; Room 5 around the counter's left end.
const cropW = 560, cropH = 480;
blit(sheet, room1, 700, y2, 60, 300, cropW, cropH);
blit(sheet, room5, 700 + cropW + 20, y2, 600, 250, cropW, cropH);
// Row 3: 3x nearest-neighbour diagnostic enlargements of the two figures' heads and hands.
const y3 = y2 + 500 + 40;
const tHead = { sx: Math.max(0, Math.floor(thadRt.width / 2) - 60), sy: 0, w: 120, h: 180 };
const wHead = { sx: Math.max(0, Math.floor(ww / 2) - 60), sy: 0, w: 120, h: 180 };
blit(sheet, thadRt, 10, y3, tHead.sx, tHead.sy, tHead.w, tHead.h, 3, true);
blit(sheet, winnieRt, 10 + 120 * 3 + 30, y3, wHead.sx, wHead.sy, wHead.w, wHead.h, 3, true);
blit(sheet, room1, 800, y3, 460, 560, 180, 180, 3, true);
blit(sheet, room5, 800 + 560, y3, 940, 380, 180, 180, 3, true);
mkdirSync(resolve(ROOT, out.split('/').slice(0, -1).join('/')), { recursive: true });
writeFileSync(resolve(ROOT, out), writePng(sheet, { alpha: false }));
const manifest = {
  schema: 1,
  note: 'STYLE CONTINUITY SHEET MANIFEST. Row 1: Room 1 approved full frame (left) and Room 5 candidate full frame (right), both at half scale. Row 2: Thad at Room 1 runtime scale, Winnie at Room 5 runtime scale, then 1:1 environment crops of Room 1 (x60,y300) and Room 5 (x600,y250). Row 3: 3x NEAREST-NEIGHBOUR enlargements, INSPECTION ONLY, never applied to production art. Evidence for Tyler; no tool judges it.',
  room1: { path: 'renders/room-01-in-engine-1920x1080.png', hash: createHash('sha256').update(readFileSync(resolve(ROOT, 'renders/room-01-in-engine-1920x1080.png'))).digest('hex') },
  room5: { path: room5Frame, hash: createHash('sha256').update(readFileSync(resolve(ROOT, room5Frame))).digest('hex') },
  thad: { path: stand.frames[0], runtimeScale: thadRuntime, drawnHeight: 240 },
  winnie: { sheet: winnieRec.sprite.sheet, frame: winnieRec.sprite.frames[0], drawnHeight: wh },
  suspected: [],
  at: new Date().toISOString(),
};
writeFileSync(resolve(ROOT, out.replace(/\.png$/, '.json')), `${JSON.stringify(manifest, null, 1)}\n`);
console.log(`${out}: ${W}x${H}; Thad drawn at ${thadRt.height}px, Winnie at ${wh}px`);
