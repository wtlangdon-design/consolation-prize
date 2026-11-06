"""Duel Three's judges' table and Reverend, from the redrawn cast. No image operation.

Tyler, 2026-11-06 (one artist, one game): "They're the exact same person in
different colors of clothes. Also they have legs of people who don't match the
top half of the body." The first rebuild seated three copies of one judge at a
table cut from room-02's master, whose legs under it were the master's own
judges'. Operations 6 and 7 drew the three judges as three different men, and drew them
WHOLE at one table -- chairs, table legs and each man's own legs and boots
(reference/cast-unify-07.txt, row 2). That row is this sheet: 0 rest, 1 breath,
2-4 each judge moving within his own third above the tabletop (a lean to confer,
a nod, a glance), all three at once and differently, so the group's action is a
tenth of it (errata 77). The Reverend on the porch is his redrawn pencil sheet.

Writes art/actors/room-02-duel-table.png and room-02-duel-sowerby.png; prints frames.
"""
import json
import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SHEET = os.path.join(ROOT, 'art/staging/cast-unify/batch-07/sheet.png')
ROW = 1
TALL = 300
GAP = 2
out = {}

im = np.asarray(Image.open(SHEET).convert('RGB')).astype(float)
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
y0, y1 = bands[ROW]
with tempfile.TemporaryDirectory() as tmp:
    part = os.path.join(tmp, 'row.png')
    Image.fromarray(np.asarray(Image.open(SHEET).convert('RGB'))[max(0, y0 - 4):y1 + 4]).save(part)
    cut = os.path.join(tmp, 'cut.png')
    info = json.loads(subprocess.check_output([sys.executable, os.path.join(ROOT, 'tools/art/cut-ambient-sheet.py'), part, str(TALL), cut]))
    sheet = np.asarray(Image.open(cut).convert('RGBA'))
if len(info['frames']) != 1:
    raise SystemExit(f'the table row cut into {len(info["frames"])} pieces, not one')
x, y, w, h = info['frames'][0]
group = sheet[y:y + h, x:x + w].copy()
widths = (group[..., 3] > 0).sum(1)
top = int(np.argmax(widths))                 # the tabletop: the plank is the widest thing in it
cols = np.nonzero((group[..., 3] > 0)[top])[0]
left, right = int(cols.min()), int(cols.max())
third = (right - left) / 3
spans = [(int(left + third * k), int(left + third * (k + 1))) for k in range(3)]


def lean(a, pivot, crown_dx, span):
    outp = a.copy()
    c0, c1 = span
    seg = a[:, c0:c1].copy()
    new = seg.copy()
    for yy in range(pivot):
        dx = int(round(crown_dx * (pivot - yy) / pivot))
        r = np.zeros_like(seg[yy])
        if dx > 0:
            r[dx:] = seg[yy, :-dx]
        elif dx < 0:
            r[:dx] = seg[yy, -dx:]
        else:
            r = seg[yy]
        new[yy] = r
    hole = (new[..., 3] == 0) & (seg[..., 3] > 0)
    new[hole] = seg[hole]
    outp[:, c0:c1] = new
    return outp


def nod(a, line, depth, span):
    outp = a.copy()
    c0, c1 = span
    for yy in range(line + 1):
        s = yy - int(round(depth * (line - yy) / max(1, line)))
        outp[yy, c0:c1] = a[s, c0:c1] if s >= 0 else 0
    return outp


chin = int(top * 0.45)
breath = group.copy()
breath[:top - 1] = group[1:top]
breath[top - 1] = group[top]
f2 = nod(lean(lean(group, top, 9, spans[0]), top, -7, spans[2]), chin, 6, spans[1])
f3 = lean(nod(lean(group, top, -8, spans[1]), chin, 6, spans[0]), top, 8, spans[2])
f4 = nod(lean(nod(group, chin, 6, spans[2]), top, 7, spans[0]), chin, 5, spans[1])
frames = [group, breath, f2, f3, f4]
outsheet = np.zeros((h + 2 * GAP, len(frames) * (w + GAP) + GAP, 4), np.uint8)
rects = []
for i, f in enumerate(frames):
    fx = GAP + i * (w + GAP)
    outsheet[GAP:GAP + h, fx:fx + w] = f
    rects.append([fx, GAP, int(w), int(h)])
Image.fromarray(outsheet).save(os.path.join(ROOT, 'art/actors/room-02-duel-table.png'))
# Seated, the group's head-to-floor is about 0.72 of a standing man: the engine
# draws it so (figureHeight is the standing man this drawing implies).
out['table'] = rects
out['tableFigureHeight'] = int(round(h / 0.72))

sow = subprocess.check_output([sys.executable, os.path.join(ROOT, 'tools/art/cast-unify-cut.py'),
                               os.path.join(ROOT, 'art/staging/cast-unify/batch-04/sheet.png'), '1', '188',
                               os.path.join(ROOT, 'art/actors/room-02-duel-sowerby.png')])
out['sowerby'] = json.loads(sow)['frames']
print(json.dumps(out))
