"""Grade a new figure to the people already approved beside him.

Tyler, 2026-10-31, on Deke Vessel in the Nugget: "Deke's coloring doesn't
match anything else around him." Measured, it did not: luminance 83 against
the bar men's 49, highlights 151 against 75, warmth 49 against 35. The bar
men are the room's approved, lit-in-place figures, so they are the target --
not the plate around his feet (match-local.py's target), which in this room
is lamplit floor and reads far brighter than a man standing on it.

Per channel, the figure's mean and spread are moved to the reference's, at
STRENGTH, so his own shading survives and only his light changes. Fully
opaque pixels only; alpha is untouched.

Usage: match-neighbours.py <sheet.png> <reference-pixels.npy> <out.png> [strength]
"""
import sys
import numpy as np
from PIL import Image

sheet_path, ref_path, out_path = sys.argv[1:4]
strength = float(sys.argv[4]) if len(sys.argv) > 4 else 0.9
a = np.asarray(Image.open(sheet_path).convert('RGBA')).astype(float)
ref = np.load(ref_path).astype(float)
m = a[..., 3] > 0
fig = a[..., :3][m]
mu_f, sd_f = fig.mean(0), fig.std(0)
mu_r, sd_r = ref.mean(0), ref.std(0)
graded = (fig - mu_f) * (sd_r / np.maximum(sd_f, 1e-6)) + mu_r
a[..., :3][m] = np.clip(fig + (graded - fig) * strength, 0, 255)
Image.fromarray(np.round(a).astype(np.uint8), 'RGBA').save(out_path)
print(f'{sheet_path}: mean {mu_f.round(1)} -> target {mu_r.round(1)}, strength {strength}')
