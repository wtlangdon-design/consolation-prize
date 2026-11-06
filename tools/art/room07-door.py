"""The registrar's street door, open (room-07 attempt 5): the doorway's view cut from the generated corner and
fitted into the plate's door frame in perspective, as art/props/room-07-street-door-open.png. Drawn by the
engine while Pratt goes out by it (content/ambient/pratt-registrar.json exit.door; errata 102 L).

Usage: room07-door.py
"""
import os
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
gen = Image.open(os.path.join(ROOT, 'art/staging/room-07/street-door-open-01.png')).convert('RGBA')
SRC = [(38, 20), (196, 20), (196, 1090), (38, 1090)]   # the open doorway in the generated corner
DST = [(32, 65), (161, 97), (161, 746), (32, 800)]     # the plate's door leaf, in perspective on the left wall
x0, y0 = min(p[0] for p in DST), min(p[1] for p in DST)
x1, y1 = max(p[0] for p in DST) + 1, max(p[1] for p in DST) + 1
d = [(x - x0, y - y0) for x, y in DST]
A, B = [], []
for (xo, yo), (xs, ys) in zip(d, SRC):
    A.append([xo, yo, 1, 0, 0, 0, -xs * xo, -xs * yo]); B.append(xs)
    A.append([0, 0, 0, xo, yo, 1, -ys * xo, -ys * yo]); B.append(ys)
coef = np.linalg.solve(np.array(A, float), np.array(B, float))
ov = gen.transform((x1 - x0, y1 - y0), Image.PERSPECTIVE, tuple(coef), Image.NEAREST)
mask = Image.new('L', ov.size, 0); ImageDraw.Draw(mask).polygon(d, fill=255)
a = np.asarray(ov).copy(); a[..., 3] = np.asarray(mask)
Image.fromarray(a).save(os.path.join(ROOT, 'art/props/room-07-street-door-open.png'))
print('art/props/room-07-street-door-open.png', ov.size, 'at', x0, y0)
