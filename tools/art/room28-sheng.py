"""AH-LAM SHENG at his ironing board, keyed from room-28 operation 3. No image op.

Doc 54: "He is ironing." Behind his board, three-quarter, facing left: rest,
breath, a look up, the iron pushed and drawn back, the iron lifted to check
its heat, the shirt folded, and a dry point made to whoever is at the board --
his talk frame. The board, the shirt and the iron are his: drawn in one piece
with him, so the plate has none. Graded into the laundry's night firelight.

Cut per cell, every frame on one rect aligned on the board's legs and his
shoes, as tools/art/room26-panner.py does it.

Writes art/staging/room-28/sheng/sheng.png and .json, and renders/room-28-sheng.png.
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HEIGHT = 307         # Room 28's curve at y 690 is 323; he is slight (0.95)
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-28')
KEY = 90
GAP = 2
AT = (1177, 690)     # behind his board, before the stove, where the master stood him
NIGHT = (0.92, 0.86, 0.78)   # the coppers' firelight, warm, a little dimmed


def cells(src, mask):
    rows = np.where(mask.any(1))[0]
    cut = int(np.argmax(np.diff(rows)))
    bands = [(rows[0], rows[cut] + 1), (rows[cut + 1], rows[-1] + 1)]
    out = []
    for y0, y1 in bands:
        band = mask[y0:y1]
        cols = np.where(band.any(0))[0]
        gaps = sorted(np.argsort(np.diff(cols))[::-1][:3])
        starts = [cols[0]] + [cols[i + 1] for i in gaps]
        ends = [cols[i] + 1 for i in gaps] + [cols[-1] + 1]
        row = []
        for x0, x1 in zip(starts, ends):
            ys = np.where(band[:, x0:x1].any(1))[0]
            t, b = y0 + ys[0], y0 + ys[-1] + 1
            mm = ndi.binary_erosion(mask[t:b, x0:x1], iterations=1)
            c = src[t:b, x0:x1].copy()
            cast = (c[..., 0] + c[..., 2]) / 2 - c[..., 1] > 24
            for ch in (0, 2):
                c[..., ch] = np.where(cast, np.minimum(c[..., ch], c[..., 1] + 24), c[..., ch])
            rgba = np.zeros((b - t, x1 - x0, 4), np.uint8)
            rgba[..., :3] = np.clip(c, 0, 255)
            rgba[..., 3] = np.where(mm, 255, 0)
            row.append(rgba)
        out.append(row)
    return out


def scaled(rgba, scale):
    img = Image.fromarray(rgba)
    s = np.asarray(img.resize((max(1, round(img.width * scale)), max(1, round(img.height * scale))), Image.LANCZOS)).copy()
    s[..., 3] = np.where(s[..., 3] >= 128, 255, 0)
    return s


def tint(rgba, t):
    out = rgba.copy()
    c = np.clip(rgba[..., :3].astype(float) * np.array(t), 0, 255).astype(int)
    dark = (np.abs(c[..., 0] - c[..., 2]) <= 1) & (c[..., 0] - c[..., 1] >= 8) & (c[..., 0] < 48)
    c[..., 0] = np.where(dark, c[..., 0] + 4, c[..., 0])
    out[..., :3] = np.clip(c, 0, 255).astype(np.uint8)
    return out


def heel(t):
    cols = np.where((t[-8:, :, 3] > 0).any(0))[0]
    return int(cols.max()) if len(cols) else t.shape[1] // 2


def main():
    src = np.asarray(Image.open(f'{S}/sheng-01/sheet.png').convert('RGB')).astype(int)
    mask = ndi.binary_opening((np.minimum(src[..., 0], src[..., 2]) - src[..., 1]) < KEY, iterations=1)
    poses, swirl = cells(src, mask)
    k = HEIGHT / poses[0].shape[0]
    tiles = [tint(scaled(f, k), NIGHT) for f in poses + swirl]
    a = max(heel(t) for t in tiles)
    w = a + max(t.shape[1] - heel(t) for t in tiles)
    h = max(t.shape[0] for t in tiles)
    out = np.zeros((h + 2 * GAP, len(tiles) * (w + GAP) + GAP, 4), np.uint8)
    rects = []
    for i, t in enumerate(tiles):
        x = GAP + i * (w + GAP) + a - heel(t)
        out[GAP + h - t.shape[0]:GAP + h, x:x + t.shape[1]] = t
        rects.append([GAP + i * (w + GAP), GAP, w, h])
    os.makedirs(f'{S}/sheng', exist_ok=True)
    Image.fromarray(out).save(f'{S}/sheng/sheng.png')
    record = {'sheet': 'art/staging/room-28/sheng/sheng.png', 'frames': rects, 'height': HEIGHT,
              'frameNames': ['rest', 'breath', 'look', 'stroke', 'return', 'inspect', 'fold', 'talk'],
              'anchor': {'x': AT[0], 'y': AT[1]}, 'source': 'room-28 attempt 3 (art/staging/room-28/sheng-01/sheet.png)'}
    json.dump(record, open(f'{S}/sheng/sheng.json', 'w'), indent=1, default=int)
    plate = Image.open(os.path.join(ROOT, 'art/backgrounds/room-28-laundry.png')).convert('RGBA')
    fr = rects[0]
    plate.alpha_composite(Image.fromarray(out).crop((fr[0], fr[1], fr[0] + fr[2], fr[1] + fr[3])), (AT[0] - fr[2] // 2, AT[1] - fr[3] + 1))
    plate.convert('RGB').save(os.path.join(ROOT, 'renders/room-28-sheng.png'))
    print(json.dumps({'frames': rects}))


if __name__ == '__main__':
    main()
