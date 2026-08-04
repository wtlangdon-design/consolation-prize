"""Weld the rut systems at a panorama seam so each rut continues through.

Both halves' ruts are horizontal stripes; at the seam their PHASE disagrees
by a few pixels, so lines break or double in the blend zone. This measures
the vertical offset that best aligns the two stripe patterns (bandpassed
luminance profiles, cross-correlated), then applies half of it to each side
as a vertical shear -- full strength at the seam, decaying linearly to zero
over REACH pixels -- confined to the ground band below GROUND_TOP with a
feathered onset so porch steps and building bases never move.

One measured, reproducible transform. Not hand-painting.

Usage: python3 tools/grade/rut-weld.py <panorama> <seam_x> <out>
"""
import sys
import numpy as np
from PIL import Image

GROUND_TOP = 640      # warp begins below this row
FEATHER = 40          # rows over which the warp fades in below GROUND_TOP
REACH = 420           # horizontal decay distance each side of the seam
WIN = 70              # columns sampled each side to build the stripe profiles
MAX_SHIFT = 16

src, seam, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
a = np.array(Image.open(src).convert('RGB')).astype(float)
H, W = a.shape[:2]

def profile(x0, x1):
    p = a[GROUND_TOP:H, x0:x1].mean(axis=(1, 2))
    return p - np.convolve(p, np.ones(31) / 31, mode='same')   # bandpass: keep the stripes

def profile_band(x0, x1, y0, y1):
    p = a[y0:y1, x0:x1].mean(axis=(1, 2))
    return p - np.convolve(p, np.ones(31) / 31, mode='same')

# RUT SPACING CHANGES WITH DEPTH, so one offset cannot fit all rows: the
# first weld left kinks. Three bands, each measured separately, smoothly
# interpolated between their centres.
BANDS = [(GROUND_TOP, 715), (715, 790), (790, H)]
deltas = []
for (b0, b1) in BANDS:
    wp = profile_band(seam - WIN - 10, seam - 10, b0, b1)
    ep = profile_band(seam + 10, seam + WIN + 10, b0, b1)
    best = (1e18, 0)
    for d in range(-MAX_SHIFT, MAX_SHIFT + 1):
        wa = wp[max(0, d):len(wp) + min(0, d)]
        ea = ep[max(0, -d):len(ep) + min(0, -d)]
        n = min(len(wa), len(ea))
        err = float(np.mean((wa[:n] - ea[:n]) ** 2))
        if err < best[0]:
            best = (err, d)
    deltas.append(best[1])
print(f'per-band rut phase offsets: {deltas}')
centres = np.array([(b0 + b1) / 2 for b0, b1 in BANDS])
delta_of_y = np.interp(np.arange(H), centres, np.array(deltas, float))[:, None]

ys = np.arange(H)[:, None].astype(float)
xs = np.arange(W)[None, :].astype(float)
lateral = np.clip(1.0 - np.abs(xs - seam) / REACH, 0, 1)
side = np.where(xs < seam, +0.5, -0.5)              # halves meet in the middle
onset = np.clip((ys - GROUND_TOP) / FEATHER, 0, 1)
shift = delta_of_y * side * lateral * onset          # px of vertical displacement, per row

yy = np.clip(ys + shift, 0, H - 1)
y0 = np.floor(yy).astype(int)
y1 = np.clip(y0 + 1, 0, H - 1)
t = (yy - y0)[..., None]
cols = np.arange(W)[None, :].repeat(H, 0)
welded = a[y0, cols] * (1 - t) + a[y1, cols] * t

# THE TONAL STEP: the two generations' mud disagrees in puddle brightness,
# and after the phase weld that step is what remains visible. A wide
# ground-only crossfade lets tone and texture trade over WELD_BLEND columns
# instead of the panorama's original 80.
WELD_BLEND = 260
half = WELD_BLEND // 2
x0b, x1b = seam - half, seam + half
left = welded[:, x0b - 1][:, None, :]
right = welded[:, x1b + 1][:, None, :]
tt = np.linspace(0, 1, x1b - x0b)[None, :, None]
lowL = np.convolve(welded[:, x0b - 40:x0b].mean(axis=(1, 2)), np.ones(9) / 9, 'same')[:, None]
lowR = np.convolve(welded[:, x1b:x1b + 40].mean(axis=(1, 2)), np.ones(9) / 9, 'same')[:, None]
corridor = welded[:, x0b:x1b]
lum = corridor.mean(axis=2, keepdims=True)
target = lowL[..., None] * (1 - tt) + lowR[..., None] * tt
local = np.convolve(lum[:, :, 0].mean(axis=1), np.ones(9) / 9, 'same')[:, None, None]
gain = np.clip(np.where(local > 1, target / np.maximum(local, 1), 1.0), 0.85, 1.18)
mask = (np.clip((np.arange(H)[:, None] - GROUND_TOP) / FEATHER, 0, 1))[..., None]
welded[:, x0b:x1b] = corridor * (gain * mask + (1 - mask))
Image.fromarray(np.clip(welded, 0, 255).astype(np.uint8)).save(out)
print(f'welded {src} -> {out}')
