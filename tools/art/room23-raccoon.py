"""Room 23's raccoons, keyed from room-23 operation 3. No image operation here.

THE RACCOON (doc 05: "He is in my hole. He was in my hole before it was my
hole"): sitting in the mouth of the hole, facing out -- rest, breath, his head
turned left, eating -- and four frames of his walk, for when the blanket turns
the hole cold and "he leaves at a walk" (doc 54, A5).

THE MEETING (doc 54, the bait: "Three more raccoons arrive from nowhere in
particular and settle in around the first"): three more of him, from the same
sheet, each its own shade, sitting either side of the hole's mouth; and the
three walking in, as one group, for their arrival.

Keyed off magenta as tools/art/room22-miners.py does it.

Writes art/staging/room-23/raccoon/{raccoon,meeting}.png and .json, and
renders/room-23-raccoons.png.
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-23')
PLATE = os.path.join(ROOT, 'art/backgrounds/room-23-prosperity.png')
KEY = 90
GAP = 2
SIT = 80           # his sitting height in the plate, at the hole's mouth (well up the hill)
MOUTH = (1180, 482)  # the centre of the hole's mouth, its floor
MEET = [(-100, 4, (1.1, 1.05, 0.95)), (100, 3, (0.85, 0.85, 0.9)), (170, 7, (1.0, 0.95, 0.9))]
NIGHT = (0.66, 0.68, 0.84)   # graded into the hillside's night (Tyler, 2026-11-05)


def frames_of(src, mask, y0, y1):
    band = mask[y0:y1]
    cols = np.where(band.any(0))[0]
    steps = np.diff(cols)
    cuts = sorted(np.argsort(steps)[::-1][:3])
    starts = [cols[0]] + [cols[i + 1] for i in cuts]
    ends = [cols[i] + 1 for i in cuts] + [cols[-1] + 1]
    out = []
    for x0, x1 in zip(starts, ends):
        m = band[:, x0:x1]
        ys = np.where(m.any(1))[0]
        t, b = y0 + ys[0], y0 + ys[-1] + 1
        mm = ndi.binary_erosion(mask[t:b, x0:x1], iterations=1)
        c = src[t:b, x0:x1].copy()
        cast = (c[..., 0] + c[..., 2]) / 2 - c[..., 1] > 24
        for ch in (0, 2):
            c[..., ch] = np.where(cast, np.minimum(c[..., ch], c[..., 1] + 24), c[..., ch])
        dark = (np.abs(c[..., 0] - c[..., 2]) <= 1) & (c[..., 0] - c[..., 1] >= 8) & (c[..., 0] < 40)
        c[..., 0] = np.where(dark, c[..., 0] + 3, c[..., 0])
        rgba = np.zeros((b - t, x1 - x0, 4), np.uint8)
        rgba[..., :3] = np.clip(c, 0, 255)
        rgba[..., 3] = np.where(mm, 255, 0)
        out.append(rgba)
    return out


def scaled(rgba, scale):
    img = Image.fromarray(rgba)
    s = np.asarray(img.resize((max(1, round(img.width * scale)), max(1, round(img.height * scale))), Image.LANCZOS)).copy()
    s[..., 3] = np.where(s[..., 3] >= 128, 255, 0)
    return s


def sheet(tiles, name, extra):
    w = max(t.shape[1] for t in tiles)
    h = max(t.shape[0] for t in tiles)
    out = np.zeros((h + 2 * GAP, len(tiles) * (w + GAP) + GAP, 4), np.uint8)
    rects = []
    for i, t in enumerate(tiles):
        x = GAP + i * (w + GAP) + (w - t.shape[1]) // 2
        out[GAP + h - t.shape[0]:GAP + h, x:x + t.shape[1]] = t
        rects.append([int(x), int(GAP + h - t.shape[0]), int(t.shape[1]), int(t.shape[0])])
    os.makedirs(f'{S}/raccoon', exist_ok=True)
    Image.fromarray(out).save(f'{S}/raccoon/{name}.png')
    record = {'sheet': f'art/staging/room-23/raccoon/{name}.png', 'frames': rects, **extra}
    json.dump(record, open(f'{S}/raccoon/{name}.json', 'w'), indent=1, default=int)
    return record


def tint(rgba, t):
    out = rgba.copy()
    out[..., :3] = np.clip(rgba[..., :3].astype(float) * np.array(t), 0, 255).astype(np.uint8)
    return out


def main():
    src = np.asarray(Image.open(f'{S}/raccoon-01/sheet.png').convert('RGB')).astype(int)
    key = np.minimum(src[..., 0], src[..., 2]) - src[..., 1]
    mask = ndi.binary_opening(key < KEY, iterations=1)
    rows = np.where(mask.any(1))[0]
    split = rows[np.where(np.diff(rows) > 20)[0][0]] + 1
    sit = frames_of(src, mask, rows[0], split)
    walk = frames_of(src, mask, split, rows[-1] + 1)
    k = SIT / max(f.shape[0] for f in sit)
    sit = [tint(scaled(f, k), NIGHT) for f in sit]
    walk = [tint(scaled(f, k), NIGHT) for f in walk]
    he = sheet(sit + walk, 'raccoon', {'sitHeight': SIT, 'walkHeight': max(f.shape[0] for f in walk),
                                       'frameNames': ['rest', 'breath', 'look', 'eat', 'walk 1', 'walk 2', 'walk 3', 'walk 4'],
                                       'anchor': {'x': MOUTH[0], 'y': MOUTH[1]},
                                       'source': 'room-23 attempt 3 (art/staging/room-23/raccoon-01/sheet.png)'})
    # THE MEETING: three more of him, sitting either side, never in step.
    W = 440
    groups = []
    for wear in ((0, 1, 2), (1, 0, 3), (2, 3, 0), (0, 2, 1), (3, 1, 1)):
        canvas = np.zeros((SIT + 20, W, 4), np.uint8)
        for (dx, dy, t), pose in zip(MEET, wear):
            f = tint(sit[pose], t)
            if dx < 0:
                f = f[:, ::-1].copy()
            x = W // 2 + dx - f.shape[1] // 2
            y = canvas.shape[0] - dy - f.shape[0]
            on = f[..., 3] > 0
            canvas[y:y + f.shape[0], x:x + f.shape[1]][on] = f[on]
        groups.append(canvas)
    group_walk = []
    for i in range(4):
        canvas = np.zeros((SIT, W, 4), np.uint8)
        for j, (dx, dy, t) in enumerate(MEET):
            f = tint(walk[(i + j) % 4], t)
            x = 40 + j * 120
            y = canvas.shape[0] - f.shape[0] - dy // 2
            on = f[..., 3] > 0
            canvas[y:y + f.shape[0], x:x + f.shape[1]][on] = f[on]
        group_walk.append(canvas)
    meet = sheet(groups + group_walk, 'meeting', {'frameNames': ['sitting 1', 'sitting 2', 'sitting 3', 'sitting 4', 'sitting 5',
                                                                  'walking 1', 'walking 2', 'walking 3', 'walking 4'],
                                                   'anchor': {'x': MOUTH[0], 'y': MOUTH[1] + 6},
                                                   'source': 'room-23 attempt 3, tinted and grouped'})
    plate = Image.open(PLATE).convert('RGBA')
    v = plate.copy()
    r = Image.open(f'{S}/raccoon/raccoon.png').convert('RGBA')
    fr = he['frames'][0]
    v.alpha_composite(r.crop((fr[0], fr[1], fr[0] + fr[2], fr[1] + fr[3])), (MOUTH[0] - fr[2] // 2, MOUTH[1] - fr[3]))
    m = Image.open(f'{S}/raccoon/meeting.png').convert('RGBA')
    fr = meet['frames'][0]
    v2 = v.copy()
    v2.alpha_composite(m.crop((fr[0], fr[1], fr[0] + fr[2], fr[1] + fr[3])), (MOUTH[0] - fr[2] // 2, MOUTH[1] + 6 - fr[3]))
    strip = Image.new('RGB', (1000, 800))
    strip.paste(v.crop((700, 230, 1700, 630)).convert('RGB'), (0, 0))
    strip.paste(v2.crop((700, 230, 1700, 630)).convert('RGB'), (0, 400))
    strip.save(os.path.join(ROOT, 'renders/room-23-raccoons.png'))
    print(json.dumps({'raccoon': {k: he[k] for k in ('sitHeight', 'walkHeight')}, 'meetingFrames': len(meet['frames'])}))


if __name__ == '__main__':
    main()
