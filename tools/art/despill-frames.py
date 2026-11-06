"""Despill a clip's frames: no visible pixel keeps the magenta key
(tools/check-key-fringe.mjs: (r + b) / 2 - g over 30). Red and blue are pulled
down toward green by the excess, never deleted, so the edge does not tear.

Usage: despill-frames.py <clip dir> [...]
"""
import os, sys
import numpy as np
from PIL import Image

LINE = 24
n = 0
for d in sys.argv[1:]:
    for f in sorted(os.listdir(d)):
        if not f.endswith('.png'): continue
        p = os.path.join(d, f)
        a = np.asarray(Image.open(p).convert('RGBA')).astype(int)
        m = (a[..., 0] + a[..., 2]) / 2 - a[..., 1]
        hit = (a[..., 3] > 0) & (m > LINE)
        if hit.any():
            e = np.where(hit, m - LINE, 0)
            a[..., 0] = np.clip(a[..., 0] - e, 0, 255); a[..., 2] = np.clip(a[..., 2] - e, 0, 255)
            Image.fromarray(a.astype(np.uint8)).save(p); n += int(hit.sum())
print(f'despilled {n} pixel(s)')
