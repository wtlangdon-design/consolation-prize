"""The barrel's drink, finished. Doc 57 A3: once the swindle settles, Vessel
"finishes his drink, collects his hat, and leaves the Nugget." The barrel
beside him keeps standing (RoomFile.props); the glass on it is empty.

No image operation: the glass's whiskey -- the warm, saturated pixels inside
its outline -- is replaced by the glass's own dim neutral, keeping the rim
highlights, and the bottom row of liquid is left as the dregs.

Usage: empty-glass.py <barrel.png> <out.png> <x0> <y0> <x1> <y1>
  (the glass's interior box, in the sheet's pixels)
"""
import sys
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
x0, y0, x1, y1 = map(int, sys.argv[3:7])
a = np.asarray(Image.open(src).convert('RGBA')).astype(float)
box = a[y0:y1, x0:x1]
r, g, b, al = box[..., 0], box[..., 1], box[..., 2], box[..., 3]
liquid = (al > 0) & (r > g * 1.25) & (r > b * 1.6) & (g < r * 0.8)
rows = np.where(liquid.any(1))[0]
if rows.size:
    liquid[rows.max() - 1:, :] = False  # the dregs stay
lum = 0.299 * r + 0.587 * g + 0.114 * b
# Empty glass in lamplight: the interior's mean warmth, dimmed and evened,
# so it reads as glass with the room behind it rather than as a pattern.
v = np.full_like(lum, lum[liquid].mean() * 0.75 if liquid.any() else 0) * 0.8 + lum * 0.2
box[..., 0] = np.where(liquid, v * 1.18, r)
box[..., 1] = np.where(liquid, v * 0.98, g)
box[..., 2] = np.where(liquid, v * 0.72, b)
a[y0:y1, x0:x1] = box
Image.fromarray(np.clip(np.round(a), 0, 255).astype(np.uint8), 'RGBA').save(out)
print(f'{src} -> {out}: {int(liquid.sum())} pixels of whiskey drunk')
