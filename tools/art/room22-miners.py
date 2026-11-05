"""Room 22's two crowds (doc 10: "the two crowd hotspots are the whole room"),
cut from room-22 operation 3 into one walk sheet. No image operation here.

THE MEN GOING OUT (top row, walking right, tools on their shoulders) and THE
MEN COMING BACK (bottom row, walking left, tools hanging): four frames of a
walk cycle each, every frame the whole group. Keyed off magenta, despilled,
each row's frames cut to one box with the boots on one baseline so the group
never jumps between frames. Drawn by the engine as a loop walker
(AmbientFile.loop, errata 95 E): scaled per frame from its own height.

Writes art/staging/room-22/miners/miners.png and .json, and
renders/room-22-miners.png.
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-22')
KEY = 90
GAP = 2


def main():
    src = np.asarray(Image.open(f'{S}/miners-01/sheet.png').convert('RGB')).astype(int)
    key = np.minimum(src[..., 0], src[..., 2]) - src[..., 1]
    mask = key < KEY
    mask = ndi.binary_opening(mask, iterations=1)
    rows_on = np.where(mask.any(1))[0]
    # The two rows: split at the widest empty band of rows.
    gaps = np.where(np.diff(rows_on) > 20)[0]
    split = rows_on[gaps[0]] + 1
    out = {}
    tiles = []
    for name, (y0, y1) in (('going_out', (rows_on[0], split)), ('coming_back', (split, rows_on[-1] + 1))):
        band = mask[y0:y1]
        cols = np.where(band.any(0))[0]
        # The four frames: split at the three widest runs of empty columns
        # (two frames nearly touch where a pick handle reaches out).
        steps = np.diff(cols)
        cgaps = sorted(np.argsort(steps)[::-1][:3])
        starts = [cols[0]] + [cols[i + 1] for i in cgaps]
        ends = [cols[i] + 1 for i in cgaps] + [cols[-1] + 1]
        if len(starts) != 4:
            raise SystemExit(f'{name}: expected four frames, found {len(starts)}')
        boxes = []
        for x0, x1 in zip(starts, ends):
            m = band[:, x0:x1]
            ys = np.where(m.any(1))[0]
            boxes.append((x0, x1, y0 + ys[0], y0 + ys[-1] + 1))
        width = max(b[1] - b[0] for b in boxes)
        height = max(b[3] - b[2] for b in boxes)
        frames = []
        for x0, x1, t, b in boxes:
            m = ndi.binary_erosion(mask[t:b, x0:x1], iterations=1)
            rgba = np.zeros((height, width, 4), np.uint8)
            px = rgba[height - (b - t):, (width - (x1 - x0)) // 2:(width - (x1 - x0)) // 2 + (x1 - x0)]
            c = src[t:b, x0:x1].copy()
            cast = (c[..., 0] + c[..., 2]) / 2 - c[..., 1] > 24
            for ch in (0, 2):
                c[..., ch] = np.where(cast, np.minimum(c[..., ch], c[..., 1] + 24), c[..., ch])
            # NEAR-BLACK PURPLES READ AS TRAPPED KEY (tools/check-residual-key.mjs,
            # as Room 16's veil did): their red warmed by 3 so R is not B.
            dark = (np.abs(c[..., 0] - c[..., 2]) <= 1) & (c[..., 0] - c[..., 1] >= 8) & (c[..., 0] < 40)
            c[..., 0] = np.where(dark, c[..., 0] + 3, c[..., 0])
            px[..., :3] = c
            px[..., 3] = np.where(m, 255, 0)
            frames.append(rgba)
        out[name] = {'frames': frames, 'height': height}
        tiles.extend(frames)
    # One sheet: the four going-out frames, then the four coming-back frames.
    w = max(t.shape[1] for t in tiles)
    h = max(t.shape[0] for t in tiles)
    sheet = np.zeros((h + 2 * GAP, len(tiles) * (w + GAP) + GAP, 4), np.uint8)
    rects = []
    for i, t in enumerate(tiles):
        x = GAP + i * (w + GAP)
        sheet[GAP + h - t.shape[0]:GAP + h, x:x + t.shape[1]] = t
        rects.append([x, GAP + h - t.shape[0], int(t.shape[1]), int(t.shape[0])])
    os.makedirs(f'{S}/miners', exist_ok=True)
    Image.fromarray(sheet).save(f'{S}/miners/miners.png')
    # A man's height in the sheet: the tallest group's drawn height (hat to boots).
    record = {'sheet': 'art/staging/room-22/miners/miners.png',
              'going_out': {'frames': rects[:4], 'figureHeight': out['going_out']['height'], 'drawnFacing': 'right'},
              'coming_back': {'frames': rects[4:], 'figureHeight': out['coming_back']['height'], 'drawnFacing': 'left'},
              'source': 'room-22 attempt 3 (art/staging/room-22/miners-01/sheet.png)'}
    json.dump(record, open(f'{S}/miners/miners.json', 'w'), indent=1, default=int)
    Image.fromarray(sheet).convert('RGBA').save(os.path.join(ROOT, 'renders/room-22-miners.png'))
    print(json.dumps({k: (v if k == 'sheet' else {kk: vv for kk, vv in v.items() if kk != 'frames'}) for k, v in record.items() if k != 'source'}, default=int))


if __name__ == '__main__':
    main()
