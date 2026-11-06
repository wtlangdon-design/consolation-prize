"""Duel Three's judges' table and Reverend, rebuilt from the redrawn cast. No image operation.

Tyler, 2026-11-06 (one artist, one game). The porch group was a subtraction cut
from room-02 operation 1 (tools/art/room02-duel-cast.py): four judges of the old
look, with scraps of wall and door-glow above them. Here the cut keeps only its
table and chairs -- everything above the tabletop goes -- and Room 4's three
redrawn judges (art/actors/room-04-judge-N.png, cast-unify operation 5) sit at
it, their hands on its edge. The group's frames are theirs: 0 rest, 1 breath,
2-4 all three at once, each a different action from his own sheet. The
Reverend on the porch is his redrawn pencil sheet (cast-unify operation 4).

Writes art/actors/room-02-duel-table.png and room-02-duel-sowerby.png; prints frames.
"""
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TABLE = os.path.join(ROOT, 'art/actors/room-02-duel-table.png')
GAP = 2
out = {}

amb = json.load(open(os.path.join(ROOT, 'content/ambient/duel-judges.json')))
fx, fy, fw, fh = amb['sprite']['frames'][0]
cut = np.asarray(Image.open(TABLE).convert('RGBA'))[fy:fy + fh, fx:fx + fw].copy()
alpha = cut[..., 3] > 0
widths = alpha.sum(1)
# THE TABLETOP: the seated judges and the chairs either side are as wide as the
# table, so width alone does not find it. Below the plank only the legs and
# chairs remain, and the width falls by about half: the plank's underside is
# the last wide row, and its top a plank's thickness above that.
wide = widths > widths.max() * 0.8
under = int(np.nonzero(wide)[0].max())
PLANK = 14
top = under - PLANK
table = cut.copy()
table[:top] = 0
# THE HOLE UNDER ITS LEFT END: the master stood Fanshawe in front of the porch,
# and his box owned the table legs his hat overlapped. The table and its chairs
# are near enough symmetric that the right end, mirrored, fills it.
below = np.zeros(table.shape[:2], bool)
below[top + 4:] = True
mirror = table[:, ::-1]
empty = (table[..., 3] == 0) & below & (mirror[..., 3] > 0)
cols = np.nonzero(empty.any(0))[0]
if len(cols):
    lo, hi = int(cols.min()), int(cols.max())
    span = np.zeros_like(empty)
    span[:, lo:hi + 1] = True
    fill = empty & span & (np.arange(table.shape[1])[None, :] < table.shape[1] // 2)
    table[fill] = mirror[fill]

judges = []
for n in (1, 2, 3):
    a = json.load(open(os.path.join(ROOT, f'content/ambient/room-04-judge-{n}.json')))
    sheet = np.asarray(Image.open(os.path.join(ROOT, a['sprite']['sheet'])).convert('RGBA'))
    judges.append([sheet[y:y + h, x:x + w] for x, y, w, h in a['sprite']['frames']])
# The judges as tall above the tabletop as the cut's were (its tallest column above the table).
old_top = int(np.nonzero(alpha.any(1))[0].min())
rise = top - old_top + 6
jh = judges[0][0].shape[0]
scale = rise / jh


def shrink(img):
    w, h = max(1, round(img.shape[1] * scale)), max(1, round(img.shape[0] * scale))
    return np.asarray(Image.fromarray(img).resize((w, h), Image.NEAREST))


H = max(fh, top + 6)
pad_top = max(0, rise - top)
canvas_h = H + pad_top


def compose(picks):
    canvas = np.zeros((canvas_h, fw, 4), np.uint8)
    slots = [fw * 0.27, fw * 0.5, fw * 0.73]
    for (n, f), cx in zip(enumerate(picks), slots):
        j = shrink(judges[n][f])
        x0 = int(round(cx - j.shape[1] / 2))
        y0 = pad_top + top + 6 - j.shape[0]
        x0c, x1c = max(0, x0), min(fw, x0 + j.shape[1])
        region = canvas[y0:y0 + j.shape[0], x0c:x1c]
        piece = j[:, x0c - x0:x1c - x0]
        canvas[y0:y0 + j.shape[0], x0c:x1c] = np.where(piece[..., 3:4] > 0, piece, region)
    t = np.zeros_like(canvas)
    t[pad_top:pad_top + fh] = table
    return np.where(t[..., 3:4] > 0, t, canvas)


# Each action moves all three, differently (one judge alone is too little of a
# group the table makes wide -- errata 77's tenth of the figure).
frames = [compose([0, 0, 0]), compose([1, 1, 1]), compose([2, 3, 5]), compose([5, 4, 2]), compose([4, 2, 3])]
sheet = np.zeros((canvas_h + 2 * GAP, len(frames) * (fw + GAP) + GAP, 4), np.uint8)
rects = []
for i, f in enumerate(frames):
    x = GAP + i * (fw + GAP)
    sheet[GAP:GAP + canvas_h, x:x + fw] = f
    rects.append([x, GAP, int(fw), int(canvas_h)])
Image.fromarray(sheet).save(TABLE)
out['table'] = rects

sow = subprocess.check_output([sys.executable, os.path.join(ROOT, 'tools/art/cast-unify-cut.py'),
                               os.path.join(ROOT, 'art/staging/cast-unify/batch-04/sheet.png'), '1', '188',
                               os.path.join(ROOT, 'art/actors/room-02-duel-sowerby.png')])
out['sowerby'] = json.loads(sow)['frames']
print(json.dumps(out))
