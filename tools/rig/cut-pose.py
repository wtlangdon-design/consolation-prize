"""Key a companion POSE of a furniture-and-people sprite.

The companion technique -- "the identical image with ONE change" -- turns out
to be surgical on a sprite as well as on a plate: asked for the card table with
one man leaning on his elbows, the table, the glasses, the bottle, the chairs
and the other three men came back with a mean difference of 0.00.

KEY THE RETURNED IMAGE ON ITS OWN. The first attempt carried the ORIGINAL
sprite's alpha, on the reasoning that the change is inside the silhouette. It
is not: a man who moves changes his outline, and this one gained 1764 pixels
and lost 672. Carrying the old alpha therefore hid every pixel he moved INTO
and showed raw magenta wherever he moved OUT of -- which is exactly what Tyler
saw, a pose half-detached from its body in a haze of pink.

Same cut as everything else: key, erode to a soft rim, despill last.

Usage: python3 tools/rig/cut-pose.py <pose.png> <out.png> [reference.png]
"""
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import binary_erosion

src, out = sys.argv[1], sys.argv[2]
reference = sys.argv[3] if len(sys.argv) > 3 else None

raw = np.array(Image.open(src).convert('RGB')).astype(float)
key = (raw[..., 0] > 150) & (raw[..., 2] > 150) & (raw[..., 1] < 110)
solid = binary_erosion(~key, np.ones((3, 3)))
alpha = np.where(~key, 255.0, 0.0)
alpha[(~key) & (~solid)] = 170

rgba = np.dstack([raw, alpha])
red, green, blue = rgba[..., 0], rgba[..., 1], rgba[..., 2]
spill = (alpha > 0) & (((red + blue) / 2 - green) > 6)
factor = np.where(spill, (2 * (green + 4)) / np.maximum(red + blue, 1e-6), 1.0)
rgba[..., 0] = np.where(spill, red * factor, red)
rgba[..., 2] = np.where(spill, blue * factor, blue)

Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8)).save(out)

report = f'{out}: {int((alpha > 128).sum())} opaque px'
if reference:
    base = np.array(Image.open(reference).convert('RGBA'))
    if base.shape[:2] == alpha.shape:
        # WHAT DID NOT MOVE, which is the whole claim being made. Compared over
        # pixels solid in BOTH, so a changed outline is not counted as drift.
        both = (base[..., 3] > 200) & (alpha > 200)
        drift = np.abs(rgba[..., :3] - base[..., :3].astype(float)).mean(axis=2)
        quiet = float((drift[both] < 12).sum()) / max(1, int(both.sum()))
        report += (f'; {100 * quiet:.1f}% of shared pixels unchanged '
                   f'(mean {drift[both].mean():.2f})')
print(report)
