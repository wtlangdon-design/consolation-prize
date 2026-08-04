"""Soften one over-dark horizontal rut to match the mud around it.

WELL-POSED, WHERE THE PHASE WELD WAS NOT. rut-weld tried to align chunked
texture and lost to noise twice. This is a different question with a real
answer: ONE known row is darker than the mud immediately above and below it,
by a deficit that can be measured per column, and the fix is to give that
luminance back on a feathered vertical profile. Nothing moves; only one
band's darkness changes.

Optionally tapers toward a seam so the rut does not die abruptly at a join.

Usage: soften-rut.py <img> <row> <out> [--amount 0.7] [--half 7] [--taper-at X]
"""
import sys
import numpy as np
from PIL import Image

img, row, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
args = sys.argv[4:]
def opt(name, default):
    return float(args[args.index(name) + 1]) if name in args else default
amount, half = opt('--amount', 0.7), int(opt('--half', 7))
taper_at = int(opt('--taper-at', -1))

a = np.array(Image.open(img).convert('RGB')).astype(float)
H, W = a.shape[:2]
lum = a.mean(axis=2)

# The local mud level: the median of two reference strips clear of the rut.
above = np.median(lum[row - 3 * half:row - half - 2], axis=0)
below = np.median(lum[row + half + 2:row + 3 * half], axis=0)
local = (above + below) / 2.0

ys = np.arange(row - half, row + half + 1)
prof = np.exp(-0.5 * ((ys - row) / (half / 2.0)) ** 2)[:, None]      # feathered band

deficit = np.clip(local[None, :] - lum[row - half:row + half + 1], 0, None)
lift = deficit * prof * amount

if taper_at >= 0:
    # Fade the correction toward the seam so the softening itself has no edge.
    x = np.arange(W)[None, :]
    lift = lift * np.clip(np.abs(x - taper_at) / 500.0, 0, 1) ** 0.5

scale = np.where(lum[row - half:row + half + 1] > 1,
                 1 + lift / np.maximum(lum[row - half:row + half + 1], 1), 1.0)
a[row - half:row + half + 1] *= scale[..., None]
Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(out)
print(f'softened row {row} of {img} (amount {amount}, half {half}) -> {out}')
