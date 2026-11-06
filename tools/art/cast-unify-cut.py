"""Cut one row of a cast-unify sheet into an ambient character's sheet.

Tyler, 2026-11-06 (task: one artist, one game): characters are redrawn
together, a row each, four poses on magenta (reference/cast-unify-NN.txt).
This splits the sheet into its rows by the magenta between them, cuts the
chosen row with tools/art/cut-ambient-sheet.py (key, despill, legs registered,
premultiplied resize to the height the character is drawn at, rim fix), and
inserts a derived one-pixel breath after the rest pose, so the sheet keeps
the layout every ambient record already uses: 0 rest, 1 breath, 2-4 actions.

Usage: cast-unify-cut.py <sheet.png> <row> <height> <out.png> [--grid N]
Prints the frames as JSON.

--grid N (errata 101 C, one pixel for everyone): before cutting, the row is
snapped to the square grid the generator drew it on -- N sheet pixels to the
art pixel, its phase found where the colour steps fall -- by a BOX reduction
and a NEAREST redraw, so the soft in-between pixels the generator leaves on
its grid are gone, as on the master.
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
grid = int(sys.argv[sys.argv.index('--grid') + 1]) if '--grid' in sys.argv else 0


POCKET = 80


def snap(rgb, n):
    """Snap an RGB image to its own n-pixel grid, at the phase its colour steps fall on.

    Interior blocks take their MEDIAN colour (a mean blends the outline into
    its neighbour). EDGE blocks -- any block within one block of the backdrop
    -- are where the generator's soft edge met the magenta, and a median there
    is a blend of figure and key that the keyer then keeps: the maroon and
    purple ring Tyler found on the Registrar's hair, ear and sleeve
    (2026-11-06). An edge block takes the median of its PURE figure pixels
    only (far from the key and not magenta-tinted), or, with fewer than a
    quarter of them, becomes backdrop. Every art pixel is then figure or
    backdrop, never between.
    """
    a = rgb.astype(float)
    # KEY CAUGHT INSIDE THE DRAWING: a pocket of backdrop enclosed by the figure
    # (between the undertaker's hands on his plane) keys as figure, being far
    # enough from #FF00FF, and shows pink. Any pixel more magenta than POCKET is
    # backdrop. Real purple sits well under it (Ozymandia's hair, 63).
    pocket = (a[..., 0] + a[..., 2]) / 2 - a[..., 1] > POCKET
    a[pocket] = (255, 0, 255)
    ex = np.abs(np.diff(a, axis=1)).sum(-1).sum(0)
    ey = np.abs(np.diff(a, axis=0)).sum(-1).sum(1)
    px = max(range(n), key=lambda p: ex[p::n].sum())
    py = max(range(n), key=lambda p: ey[p::n].sum())
    ox, oy = (px + 1) % n, (py + 1) % n
    H, W = a.shape[:2]
    out = a.copy()
    tw, th = (W - ox) // n, (H - oy) // n
    cells = a[oy:oy + th * n, ox:ox + tw * n].reshape(th, n, tw, n, 3).transpose(0, 2, 1, 3, 4).reshape(th, tw, n * n, 3)
    key_d = np.sqrt((cells[..., 0] - 255) ** 2 + cells[..., 1] ** 2 + (cells[..., 2] - 255) ** 2)
    tint = (cells[..., 0] + cells[..., 2]) / 2 - cells[..., 1]
    pure = (key_d >= 200) & (tint <= 25)
    backdrop = (key_d < 120).any(-1)
    # With --grid 1 (a sheet the generator drew on no clean grid) the drawing's
    # own pixels are kept and only the edge is cleaned, three pixels deep.
    reach = 1 if n >= 3 else 3
    near = backdrop.copy()
    for dy in range(-reach, reach + 1):
        for dx in range(-reach, reach + 1):
            near |= np.roll(np.roll(backdrop, dy, 0), dx, 1)
    col = np.median(cells, axis=2)
    for by, bx in zip(*np.where(near)):
        keep = pure[by, bx]
        col[by, bx] = np.median(cells[by, bx][keep], 0) if keep.sum() >= n * n / 4 else (255, 0, 255)
    out[oy:oy + th * n, ox:ox + tw * n] = np.repeat(np.repeat(col, n, 0), n, 1)
    return out.astype(np.uint8)
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
    rowimg = np.asarray(Image.open(src).convert('RGB'))[max(0, y0 - 4):y1 + 4]
    Image.fromarray(snap(rowimg, grid) if grid else rowimg).save(part)
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
