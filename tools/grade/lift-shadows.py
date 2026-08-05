"""Lift the dark end of a plate without touching the lamps.

Room 2 graded to Room 1's average and still read as unviewable on Tyler's
display at full brightness. The average was never the question: Room 1 spends
a third of its frame on lit sky and town lights, so the same MEAN buys it a
much brighter picture, while Room 2 is dark buildings over dark mud and the
walkable ground sat at median luminance 28.

A gamma curve on luminance, hue preserved, gain clamped. Gamma below 1 lifts
shadows hardest and highlights least, so lamps and windows keep their punch
instead of blooming, which a linear gain would not manage.

Usage: python3 tools/grade/lift-shadows.py <in> <gamma> <out>
"""
import sys
import numpy as np
from PIL import Image

src, gamma, out = sys.argv[1], float(sys.argv[2]), sys.argv[3]
a = np.array(Image.open(src).convert('RGB')).astype(float)
l = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
lifted = 255.0 * np.power(np.clip(l, 0, 255) / 255.0, gamma)
gain = np.clip(np.where(l > 1e-3, lifted / np.maximum(l, 1e-3), 1.0), 1.0, 4.0)
# NO CHANNEL MAY OVERFLOW. The first version clipped 22% of the frame at
# gamma 0.6, and the curve was not the culprit: a saturated lamp already at
# R=255 has no headroom for ANY multiplier, so the gain has to be capped per
# pixel by the channel closest to the ceiling. Shadows still get the full
# lift; the lamps simply keep what they have.
headroom = 255.0 / np.maximum(a.max(axis=2), 1e-3)
gain = np.minimum(gain, headroom)

# THE SKY IS NOT THE PROBLEM AND MUST NOT PAY FOR THE FIX. At gamma 0.68,
# 99.6% of saturating pixels were sky: a night sky lifted like a street goes
# milky and takes the stars with it. The lift ramps in from SKY_KEEP at the
# top of frame to full by SKY_FULL, so the street, the mud and the buildings
# get all of it and the sky keeps its night.
SKY_KEEP, SKY_FULL = 0.30, 380.0
H = a.shape[0]
ramp = SKY_KEEP + (1 - SKY_KEEP) * np.clip(np.arange(H) / SKY_FULL, 0, 1)
gain = (1.0 + (gain - 1.0) * ramp[:, None])[..., None]
res = np.clip(a * gain, 0, 255)
Image.fromarray(res.astype(np.uint8)).save(out)
gl = 0.2126 * res[..., 0] + 0.7152 * res[..., 1] + 0.0722 * res[..., 2]
print(f'gamma {gamma}: mean {l.mean():.1f} -> {gl.mean():.1f}, '
      f'ground median {np.median(l[600:]):.1f} -> {np.median(gl[600:]):.1f}, '
      f'clipped {100 * (res.max(axis=2) >= 255).mean():.2f}%')
