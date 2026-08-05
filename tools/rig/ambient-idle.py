"""A derived idle cycle for a standing ambient figure, at portrait scale.

WHY AT PORTRAIT SCALE. The sprite is 132 pixels tall and nothing can be
derived from it -- a one-pixel change is the smallest move available and it is
already too small to see, which is the defect this replaces. The portrait is
1619 and a two-degree sway there is fourteen pixels of shoulder, which survives
the reduction as real movement.

WHAT IT DERIVES, AND WHAT IT DOES NOT. A weight shift: the figure leans a
degree or two about its own hem while the feet stay put, and the head counters
slightly, which is what a standing body does when it is waiting. It cannot
turn, lift, point or resettle a basket -- rotating a flat sprite far enough to
read as a gesture reads as BENDING, and at 132px a bend looks like a fault.
Those are idle BREAKS and they want drawn frames.

Usage: python3 tools/rig/ambient-idle.py <portrait.png> <out_dir> <height> [--frames 6]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

# A slow figure-of-eight of weight, not a metronome: a person waiting does not
# sway symmetrically. Degrees about the hem.
SWAY = [0.0, 0.55, 0.9, 1.0, 0.75, 0.2, -0.35, -0.8, -1.0, -0.7, -0.25, 0.1]
DEGREES = 1.6
HEAD_COUNTER = 0.35     # the head lags the body, which is what keeps it upright

src, out_dir, height = sys.argv[1], Path(sys.argv[2]), int(sys.argv[3])
frames = int(sys.argv[sys.argv.index('--frames') + 1]) if '--frames' in sys.argv else len(SWAY)
out_dir.mkdir(parents=True, exist_ok=True)

# KEY FIRST, ROTATE SECOND. The portrait is still on magenta -- the cut lives
# in cut-ambient.py and this tool went straight to rotating, which produced a
# sway of the magenta rectangle along with the woman inside it. Doc 38's order
# holds here too: cut, erode to a soft rim, then everything else, and despill
# last after the reduction.
from scipy.ndimage import binary_erosion

raw = np.array(Image.open(src).convert('RGB')).astype(float)
key = (raw[..., 0] > 150) & (raw[..., 2] > 150) & (raw[..., 1] < 110)
ys_k, xs_k = np.where(~key)
x0, x1, y0, y1 = xs_k.min() - 2, xs_k.max() + 3, ys_k.min() - 2, ys_k.max() + 3
sub = raw[y0:y1, x0:x1]
cut = key[y0:y1, x0:x1]
solid = binary_erosion(~cut, np.ones((3, 3)))
alpha = np.where(~cut, 255.0, 0.0)
alpha[(~cut) & (~solid)] = 170
a = np.dstack([sub, alpha])
H, W = a.shape[:2]
opaque = a[..., 3] > 16

# THE PIVOT IS THE HIPS, NOT THE HEM, and the first version got this wrong in
# a way worth recording. Taking the widest sustained row put the pivot at row
# 1535 of 1536 -- the floor -- because a floor-length skirt IS widest where it
# meets the ground. Rotating the whole figure about its own feet does not read
# as shifting weight; it reads as a tree going over.
#
# A body sways above the hips over legs that stay planted, which is the same
# geometry character.py's recoil and strain use. 0.58 of the way down the
# figure is the waist on every one of these portraits.
rows_all = np.nonzero(opaque.any(axis=1))[0]
top, floor = rows_all.min(), rows_all.max()
hem = int(top + (floor - top) * 0.58)

# The shoulder line, for the head's counter-rotation.
shoulder = top + int((hem - top) * 0.28)


def rotate(layer, degrees, pivot_y, pivot_x):
    if abs(degrees) < 1e-4:
        return layer
    image = Image.fromarray(layer.astype(np.uint8))
    return np.array(image.rotate(degrees, resample=Image.BICUBIC,
                                 center=(pivot_x, pivot_y))).astype(float)


centre = float(np.nonzero(opaque.any(axis=0))[0].mean())
step = len(SWAY) / frames
for index in range(frames):
    t = SWAY[int(index * step) % len(SWAY)]
    frame = a.copy()
    body = frame.copy()
    body[hem:] = 0
    body = rotate(body, DEGREES * t, hem, centre)
    head = body.copy()
    head[shoulder:] = 0
    head = rotate(head, -DEGREES * t * HEAD_COUNTER, shoulder, centre)
    body[:shoulder] = 0
    merged = np.where(head[..., 3:] > 0, head, body)
    merged[hem:] = a[hem:]                       # feet and ground line never move
    scale = height / H
    width = max(1, round(W * scale))
    alpha = merged[..., 3:] / 255.0
    premultiplied = Image.fromarray((merged[..., :3] * alpha).astype(np.uint8))
    small = np.array(premultiplied.resize((width, height), Image.LANCZOS)).astype(float)
    small_alpha = np.array(Image.fromarray(merged[..., 3].astype(np.uint8))
                           .resize((width, height), Image.LANCZOS)).astype(float)
    colour = np.where(small_alpha[..., None] > 1,
                      small / np.maximum(small_alpha[..., None] / 255.0, 1e-3), 0)
    result = np.dstack([np.clip(colour, 0, 255), small_alpha])
    # Despill last, after the reduction, per doc 38.
    rr, gg, bb = result[..., 0], result[..., 1], result[..., 2]
    need = (result[..., 3] > 0) & (((rr + bb) / 2.0 - gg) > 6)
    factor = np.where(need, (2.0 * (gg + 4)) / np.maximum(rr + bb, 1e-6), 1.0)
    result[..., 0] = np.where(need, rr * factor, rr)
    result[..., 2] = np.where(need, bb * factor, bb)
    Image.fromarray(np.clip(result, 0, 255).astype(np.uint8)).save(out_dir / f'idle-{index:02d}.png')

print(f'{out_dir}: {frames} frames, sway +-{DEGREES} deg about row {hem} of {H}, '
      f'head counters {HEAD_COUNTER}, output {height}px')
