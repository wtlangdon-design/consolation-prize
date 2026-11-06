"""Re-register a waist-up figure's frames on the HEAD, and carry the rest frame's desk.

For a figure seen from the waist up behind a counter (cast-unify, Tyler
2026-11-06), the cutter's leg registration lands on the hands and whatever is
on the counter, and a raised arm or a book in some poses and not others swings
the whole figure sideways between frames. Here each frame is re-aligned so the
head -- the largest piece of the top quarter -- sits where the rest frame's
does; then, with --carry F, the rest frame's lowest F of rows (the ledger, the
desk things) fills wherever a frame has nothing, so it does not come and go.

--bottom: also shift each frame VERTICALLY so its lowest drawn row is the rest
frame's. For a figure whose hands (or the tool in them) rest on the counter, the
point of contact is the fixed thing, not the head: aligned on the head alone,
the undertaker's plane rose 8 px off his bench when he leaned in to push it
(2026-11-06).

Usage: bust-register.py <sheet.png> <frames.json> <out.png> [--carry 0.2 [--into 3,4]] [--bottom]
frames.json is the cutter's printed {"frames": [...]}; prints the new frames.
"""
import json
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

src, fjson, out = sys.argv[1], sys.argv[2], sys.argv[3]
carry = float(sys.argv[sys.argv.index('--carry') + 1]) if '--carry' in sys.argv else 0.0
# --into 3,4: carry only into these frames (a frame that lifts the book must not get a second one).
into = [int(v) for v in sys.argv[sys.argv.index('--into') + 1].split(',')] if '--into' in sys.argv else None
sheet = np.asarray(Image.open(src).convert('RGBA'))
frames = json.loads(open(fjson).read())['frames']
cells = [sheet[y:y + h, x:x + w].copy() for x, y, w, h in frames]


def head_x(cell):
    a = cell[..., 3] > 0
    rows = np.nonzero(a.any(1))[0]
    top = rows.min(); band = a.copy(); band[top + int((rows.max() - top) * 0.25):] = False
    lab, n = ndi.label(band)
    if n == 0:
        return cell.shape[1] / 2
    big = np.argmax(ndi.sum(band, lab, range(1, n + 1))) + 1
    xs = np.nonzero(lab == big)[1]
    return (xs.min() + xs.max()) / 2


bottom_align = '--bottom' in sys.argv


def bottom_row(cell):
    return int(np.nonzero((cell[..., 3] > 0).any(1))[0].max())


ref = head_x(cells[0])
ref_bottom = bottom_row(cells[0])
pad = 60
H, W = cells[0].shape[:2]
outs = []
for i, cell in enumerate(cells):
    dx = int(round(ref - head_x(cell)))
    canvas = np.zeros((H, W + 2 * pad, 4), np.uint8)
    if bottom_align:
        dy = ref_bottom - bottom_row(cell)
        moved = np.zeros_like(cell)
        if dy >= 0:
            moved[dy:] = cell[:H - dy]
        else:
            moved[:H + dy] = cell[-dy:]
        cell = moved
    canvas[:, pad + dx:pad + dx + W] = cell
    outs.append(canvas)
if carry > 0:
    base = outs[0]
    band = int(H * (1 - carry))
    for i, c in enumerate(outs):
        if i == 0 or (into is not None and i not in into):
            continue
        empty = c[band:, :, 3] == 0
        c[band:][empty] = base[band:][empty]
# trim the common empty margin
alpha = np.any([c[..., 3] > 0 for c in outs], axis=0)
cols = np.nonzero(alpha.any(0))[0]
x0, x1 = cols.min(), cols.max() + 1
outs = [c[:, x0:x1] for c in outs]
w = x1 - x0
result = np.zeros((H + 4, len(outs) * (w + 2) + 2, 4), np.uint8)
rects = []
for i, c in enumerate(outs):
    x = 2 + i * (w + 2)
    result[2:2 + H, x:x + w] = c
    rects.append([int(x), 2, int(w), int(H)])
Image.fromarray(result).save(out)
print(json.dumps({'frames': rects}))
