"""Cut a multi-pose character sheet into frames that share a ground line.

WHY NOT cut-ambient.py FOUR TIMES. That tool scales one figure to a target
height, which is right for a single portrait and wrong for a sheet: the poses
differ in height ON PURPOSE -- a woman lifting a basket is not the same height
as a woman holding it -- and normalising each to the same number would erase
exactly the movement the sheet exists to provide, then add a bob that is not
in the drawing.

So: ONE scale factor for the whole sheet, taken from the first pose, and every
frame aligned on the sheet's own lowest foot row. The frames come out the same
canvas size with the figure sitting where it belongs, so the engine can swap
between them without anything jumping.

Poses are found as runs of non-key columns, so the sheet does not need to say
where they are.

Usage: python3 tools/rig/cut-sheet.py <sheet.png> <out_dir> <height_of_pose_1>
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_erosion

GROUND_GAMMA = 0.62

src, out_dir, target = sys.argv[1], Path(sys.argv[2]), int(sys.argv[3])
out_dir.mkdir(parents=True, exist_ok=True)

raw = np.array(Image.open(src).convert('RGB')).astype(float)
key = (raw[..., 0] > 150) & (raw[..., 2] > 150) & (raw[..., 1] < 110)

columns = (~key).any(axis=0)
runs, start = [], None
for x, filled in enumerate(columns):
    if filled and start is None:
        start = x
    elif not filled and start is not None:
        if x - start > 40:
            runs.append((start, x))
        start = None
if start is not None:
    runs.append((start, len(columns)))
if not runs:
    raise SystemExit(f'{src}: no poses found')

rows = np.where((~key).any(axis=1))[0]
ground = int(rows.max())                       # the sheet's own floor
first = ~key[:, runs[0][0]:runs[0][1]]
first_rows = np.where(first.any(axis=1))[0]
scale = target / (first_rows.max() - first_rows.min() + 1)

# One canvas for every frame: widest pose, tallest pose, feet on the floor.
width = max(e - s for s, e in runs)
height = ground - int(rows.min()) + 1

for index, (x0, x1) in enumerate(runs):
    piece = raw[:, x0:x1]
    cut = key[:, x0:x1]
    solid = binary_erosion(~cut, np.ones((3, 3)))
    alpha = np.where(~cut, 255.0, 0.0)
    alpha[(~cut) & (~solid)] = 170

    lum = 0.2126 * piece[..., 0] + 0.7152 * piece[..., 1] + 0.0722 * piece[..., 2]
    lifted = 255.0 * np.power(np.clip(lum, 0, 255) / 255.0, GROUND_GAMMA)
    gain = np.clip(np.where(lum > 1e-3, lifted / np.maximum(lum, 1e-3), 1.0), 1.0, 4.0)
    gain = np.minimum(gain, 255.0 / np.maximum(piece.max(axis=2), 1e-3))[..., None]
    piece = np.clip(piece * gain, 0, 255)

    # Pad to the shared canvas BEFORE scaling, so every frame keeps its place.
    canvas = np.zeros((raw.shape[0], width, 4))
    canvas[:, :x1 - x0, :3] = piece
    canvas[:, :x1 - x0, 3] = alpha
    canvas = canvas[int(rows.min()):ground + 1]

    W, H = max(1, round(width * scale)), max(1, round(height * scale))
    a = canvas[..., 3:] / 255.0
    pm = np.array(Image.fromarray((canvas[..., :3] * a).astype(np.uint8))
                  .resize((W, H), Image.LANCZOS)).astype(float)
    al = np.array(Image.fromarray(canvas[..., 3].astype(np.uint8))
                  .resize((W, H), Image.LANCZOS)).astype(float)
    col = np.clip(np.where(al[..., None] > 1, pm / np.maximum(al[..., None] / 255.0, 1e-3), 0), 0, 255)

    rr, gg, bb = col[..., 0], col[..., 1], col[..., 2]
    need = (al > 0) & (((rr + bb) / 2.0 - gg) > 6)
    factor = np.where(need, (2.0 * (gg + 4)) / np.maximum(rr + bb, 1e-6), 1.0)
    col[..., 0] = np.where(need, rr * factor, rr)
    col[..., 2] = np.where(need, bb * factor, bb)

    Image.fromarray(np.clip(np.dstack([col, al]), 0, 255).astype(np.uint8)) \
        .save(out_dir / f'pose-{index:02d}.png')

print(f'{out_dir}: {len(runs)} poses at {W}x{H}, one scale ({scale:.3f}), '
      f'feet aligned on the sheet floor')
