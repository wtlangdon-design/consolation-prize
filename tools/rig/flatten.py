"""Flatten a rendered sprite toward the game's sprite idiom.

TYLER'S RULING: the flatter look is what the game wants. Thad and Hob read as
1990 adventure sprites; the new cast read as downsampled illustration, and
they stand next to each other.

THE DIFFERENCE IS CONTRAST, NOT DETAIL, which the measurement settled and the
eye did not. The new characters use FEWER luminance bands than Hob -- 16
against 19 -- and still look softer, because Hob's luminance spread is 36.7
and theirs is 27.0. He has darker darks, brighter brights and hard steps
between; they are mid-toned and gradual. So flattening EXPANDS contrast and
quantizes; it does not remove information.

Two operations, in this order:

  1. Expand luminance about the figure's own mid-point, to Hob's spread.
  2. Quantize to a fixed number of levels, so the steps are visible edges
     rather than gradients -- which is what makes a sprite read as drawn
     rather than rendered.

Hue and saturation are untouched. A flattened figure is the same person in
the same clothes under the same lamp.

Usage: python3 tools/rig/flatten.py <in.png> <out.png> [--levels 10] [--spread 36]
"""
import sys

import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
levels = int(sys.argv[sys.argv.index('--levels') + 1]) if '--levels' in sys.argv else 10
spread = float(sys.argv[sys.argv.index('--spread') + 1]) if '--spread' in sys.argv else 36.0

a = np.array(Image.open(src).convert('RGBA')).astype(float)
opaque = a[..., 3] > 128
if not opaque.any():
    raise SystemExit(f'{src}: nothing opaque to flatten')

rgb = a[..., :3]
lum = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
inside = lum[opaque]
centre, current = inside.mean(), inside.std()

# 1. Expand about the figure's own mid-point.
gain = spread / max(current, 1e-3)
wanted = np.clip((lum - centre) * gain + centre, 0, 255)

# 2. Quantize, so the steps are edges.
step = 255.0 / (levels - 1)
wanted = np.round(wanted / step) * step

# Apply as a per-pixel scale, which keeps hue and saturation exactly.
scale = np.where(lum > 1e-3, wanted / np.maximum(lum, 1e-3), 1.0)
scale = np.minimum(scale, 255.0 / np.maximum(rgb.max(axis=2), 1e-3))[..., None]
a[..., :3] = np.clip(rgb * scale, 0, 255)

Image.fromarray(a.astype(np.uint8)).save(out)
after = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])[opaque]
print(f'{out}: spread {current:.1f} -> {after.std():.1f} (Hob is 36.7), {levels} levels')

# WHAT THIS DOES NOT DO, MEASURED AND WATCHED. It brings contrast to Hob's --
# 27.2 to 35.1 against his 36.7 -- and the figure does read more graphically.
# It does not close the gap, because Hob's flatness is also SIMPLICITY OF
# FORM: fewer distinct shapes, larger areas of one colour, folds omitted
# rather than shaded. That is a drawing decision and no post-process invents
# it. The reliable fix is to generate the portrait in the flatter idiom, with
# Hob attached as the style reference -- the casting-sheet method pointed at
# style instead of at a character. This stays as the finishing pass after it.

# DO NOT RUN THIS AFTER DECIMATION. Expanding contrast multiplies LOCAL
# variance as well as global spread, so a figure that has just been
# area-averaged down -- the step that gives Thad his smooth surfaces -- comes
# back out noisier than it went in. Measured on the Nugget's card players:
# 14.41 before decimation, 11.32 after, and 13.74 after this tool ran on the
# decimated version. Thad is 6.09.
#
# The two fixes address different faults and pull opposite ways. Use this on a
# figure whose CONTRAST is wrong; use decimation on one whose SURFACES are
# noisy; do not use both.
