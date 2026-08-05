"""Cut one figure from a magenta casting generation, at plate scale.

Doc 38's order, and every step is there because skipping it cost a pass:

  cut -> erode one pixel to a soft rim -> LIFT -> PREMULTIPLY -> resize ->
  unpremultiply -> DESPILL

TWO ORDERING RULES, BOTH LEARNED THE HARD WAY. The despill comes AFTER the
lift, because lifting a despilled sprite multiplies whatever magenta the
despill left into a visible purple ring -- that was the dog. And the alpha is
PREMULTIPLIED BEFORE RESIZING, because the resampler otherwise averages the
magenta background into every edge pixel and a despill afterwards is fighting
the filter rather than the residue: the letter-writer came out at a worst
residual of 170 that way, and 6 this way.

Usage: python3 tools/rig/cut-ambient.py <magenta.png> <out.png> [sheet_width]
"""
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import binary_erosion

PLATE_WIDTH = 3700
GROUND_GAMMA = 0.62      # Room 2's, matching lift-shadows

src, out = sys.argv[1], sys.argv[2]
sheet = float(sys.argv[3]) if len(sys.argv) > 3 else 2048.0
K = PLATE_WIDTH / sheet

a = np.array(Image.open(src).convert('RGB')).astype(float)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
key = (r > 150) & (b > 150) & (g < 110)
ys, xs = np.where(~key)
x0, x1, y0, y1 = xs.min() - 2, xs.max() + 3, ys.min() - 2, ys.max() + 3
sub = a[y0:y1, x0:x1].copy()
k = key[y0:y1, x0:x1]

solid = binary_erosion(~k, np.ones((3, 3)))
alpha = np.where(~k, 255.0, 0.0)
alpha[(~k) & (~solid)] = 170

lum = 0.2126 * sub[..., 0] + 0.7152 * sub[..., 1] + 0.0722 * sub[..., 2]
lifted = 255.0 * np.power(np.clip(lum, 0, 255) / 255.0, GROUND_GAMMA)
gain = np.clip(np.where(lum > 1e-3, lifted / np.maximum(lum, 1e-3), 1.0), 1.0, 4.0)
gain = np.minimum(gain, 255.0 / np.maximum(sub.max(axis=2), 1e-3))[..., None]
sub = np.clip(sub * gain, 0, 255)

width, height = round(sub.shape[1] * K), round(sub.shape[0] * K)
premultiplied = sub * (alpha[..., None] / 255.0)
pm = np.array(Image.fromarray(premultiplied.astype(np.uint8))
              .resize((width, height), Image.LANCZOS)).astype(float)
al = np.array(Image.fromarray(alpha.astype(np.uint8))
              .resize((width, height), Image.LANCZOS)).astype(float)
col = np.clip(np.where(al[..., None] > 1, pm / np.maximum(al[..., None] / 255.0, 1e-3), 0), 0, 255)

rr, gg, bb = col[..., 0], col[..., 1], col[..., 2]
need = (al > 0) & (((rr + bb) / 2.0 - gg) > 6)
scale = np.where(need, (2.0 * (gg + 4)) / np.maximum(rr + bb, 1e-6), 1.0)
col[..., 0] = np.where(need, rr * scale, rr)
col[..., 2] = np.where(need, bb * scale, bb)

result = np.dstack([col, al])
Image.fromarray(np.clip(result, 0, 255).astype(np.uint8)).save(out)
spill = (result[..., 0] + result[..., 2]) / 2 - result[..., 1]
print(f'{out}: {width}x{height}, worst residual magenta {int(spill[result[..., 3] > 0].max())}')
