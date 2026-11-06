"""Cut one row of a cast-unify sheet into an ambient character's sheet.

Tyler, 2026-11-06 (task: one artist, one game): characters are redrawn
together, a row each, four poses on magenta (reference/cast-unify-NN.txt).
This splits the sheet into its rows by the magenta between them, cuts the
chosen row with tools/art/cut-ambient-sheet.py (key, despill, legs registered,
premultiplied resize to the height the character is drawn at, rim fix), and
inserts a derived one-pixel breath after the rest pose, so the sheet keeps
the layout every ambient record already uses: 0 rest, 1 breath, 2-4 actions.

Usage: cast-unify-cut.py <sheet.png> <row> <height> <out.png>
Prints the frames as JSON.
"""
import json
import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
src, row, height, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
im = np.asarray(Image.open(src).convert('RGB')).astype(float)
dist = np.sqrt((im[..., 0] - 255) ** 2 + im[..., 1] ** 2 + (im[..., 2] - 255) ** 2)
busy = (dist >= 120).sum(1) > 3
bands, start = [], None
for y, on in enumerate(busy):
    if on and start is None:
        start = y
    if not on and start is not None:
        if y - start > 40:
            bands.append((start, y))
        start = None
if start is not None:
    bands.append((start, len(busy)))
y0, y1 = bands[row]
with tempfile.TemporaryDirectory() as tmp:
    part = os.path.join(tmp, 'row.png')
    Image.fromarray(np.asarray(Image.open(src).convert('RGB'))[max(0, y0 - 4):y1 + 4]).save(part)
    cut = os.path.join(tmp, 'cut.png')
    info = json.loads(subprocess.check_output([sys.executable, os.path.join(ROOT, 'tools/art/cut-ambient-sheet.py'), part, str(height), cut]))
    sheet = np.asarray(Image.open(cut).convert('RGBA'))
frames = info['frames']
rest = sheet[frames[0][1]:frames[0][1] + frames[0][3], frames[0][0]:frames[0][0] + frames[0][2]].copy()
waist = rest.shape[0] * 55 // 100
breath = rest.copy()
breath[:waist - 1] = rest[1:waist]
breath[waist - 1] = rest[waist]
cells = [rest, breath] + [sheet[f[1]:f[1] + f[3], f[0]:f[0] + f[2]] for f in frames[1:]]
w, h = cells[0].shape[1], cells[0].shape[0]
outsheet = np.zeros((h + 4, len(cells) * (w + 2) + 2, 4), np.uint8)
rects = []
for i, c in enumerate(cells):
    x = 2 + i * (w + 2)
    outsheet[2:2 + h, x:x + w] = c
    rects.append([x, 2, w, h])
Image.fromarray(outsheet).save(out)
print(json.dumps({'frames': rects, 'rows': len(bands), 'height': height}))
