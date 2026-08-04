"""Map a plate's luminance distribution onto a reference plate's, hue untouched.

THE ACCEPT-TIME GRADE, and the whole of it. Room 2's east half arrived at
two-thirds of Room 1's brightness with the shadows crushed to murk; Tyler's
eye caught it and the fix is this one measured, reproducible function -- NOT
hand-correction, which D1 forbids. Percentile-to-percentile luma mapping,
gain clamped 0.8-2.6 so nothing blooms.

EVERY COMPANION GENERATION OF A GRADED PLATE PASSES THROUGH THE IDENTICAL
GRADE BEFORE SUBTRACTION. The door-open companions are differenced against
the graded master; grading one side of a subtraction and not the other
manufactures ghost edges everywhere the gain differs.

Usage: python3 tools/grade/match-levels.py <plate> <reference> <out>
"""
import sys
import numpy as np
from PIL import Image

def luma(a):
    return 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]

plate, ref, out = sys.argv[1:4]
a = np.array(Image.open(plate).convert('RGB')).astype(float)
r = np.array(Image.open(ref).convert('RGB')).astype(float)
ps = np.linspace(0, 100, 256)
la, lr = luma(a), luma(r)
mapped = np.interp(la, np.percentile(la, ps), np.percentile(lr, ps))
gain = np.clip(np.where(la > 1e-3, mapped / np.maximum(la, 1e-3), 1.0), 0.8, 2.6)[..., None]
Image.fromarray(np.clip(a * gain, 0, 255).astype(np.uint8)).save(out)
print(f"graded {plate} to {ref}'s levels -> {out}")
