"""Duel Three's Fanshawe and the town, from cast-unify operation 5. No image operation.

Tyler, 2026-11-06 (one artist, one game). Room-02 operations 1 and 2 staged the
duel and the cast was cut from them by subtraction (tools/art/room02-duel-cast.py);
the line-up showed the street's mud on their boots and a Fanshawe drawn from his
old look. Fanshawe (row 1) and six townspeople (row 2) were redrawn on magenta
in Thad's hand. Here the Colonel's four poses become his sheet, and the six are
composed into the two crowds at the street's ends -- three each, the left three
mirrored to face the middle of the street -- with the crowd's weight-shift
actions (a few of them leaning or nodding, a different few each time).
The judges' table and the Reverend on the porch stay the subtraction cut: they
are a few dozen pixels tall at that distance.

Writes art/actors/room-02-duel-{fanshawe,town-left,town-right}.png; prints frames.
"""
import json
import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SHEET = os.path.join(ROOT, 'art/staging/cast-unify/batch-05/sheet.png')
# The six of the town: operation 6, row 2 -- each a different person, none like
# the named cast (Tyler, 2026-11-06: "characters all need to look distinct").
TOWN = os.path.join(ROOT, 'art/staging/cast-unify/batch-06/sheet.png')
TOWN_ROW = 2
TALL = 280
GAP = 2
PAD = 12
out = {}

# THE COLONEL: rest, breath, a hand out, the watch, the hat.
fan = subprocess.check_output([sys.executable, os.path.join(ROOT, 'tools/art/cast-unify-cut.py'), SHEET, '0', str(TALL),
                               os.path.join(ROOT, 'art/actors/room-02-duel-fanshawe.png')])
out['fanshawe'] = json.loads(fan)['frames']

# THE SIX, cut on their legs at one height.
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
im = np.asarray(Image.open(TOWN).convert('RGB')).astype(float)
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
y0, y1 = bands[TOWN_ROW]
with tempfile.TemporaryDirectory() as tmp:
    part = os.path.join(tmp, 'row.png')
    Image.fromarray(np.asarray(Image.open(TOWN).convert('RGB'))[max(0, y0 - 4):y1 + 4]).save(part)
    cut = os.path.join(tmp, 'cut.png')
    info = json.loads(subprocess.check_output([sys.executable, os.path.join(ROOT, 'tools/art/cut-ambient-sheet.py'), part, str(TALL), cut]))
    row = np.asarray(Image.open(cut).convert('RGBA'))
people = []
for x, y, w, h in info['frames']:
    p = row[y:y + h, x:x + w]
    cols = np.nonzero((p[..., 3] > 0).any(0))[0]
    people.append(p[:, cols.min():cols.max() + 1])


def lean(a, pivot, crown_dx, cols=None):
    outp = a.copy()
    c0, c1 = cols if cols else (0, a.shape[1])
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


def nod(a, line, depth, cols):
    outp = a.copy()
    c0, c1 = cols
    for yy in range(line + 1):
        s = yy - int(round(depth * (line - yy) / max(1, line)))
        outp[yy, c0:c1] = a[s, c0:c1] if s >= 0 else 0
    return outp


def crowd(three, mirror):
    figs = [f[:, ::-1] if mirror else f for f in three]
    step = [0, int(figs[0].shape[1] * 0.78), int(figs[0].shape[1] * 0.78 + figs[1].shape[1] * 0.78)]
    drop = [0, 10, 4]
    W = step[2] + figs[2].shape[1] + 2 * PAD
    H = TALL + max(drop)
    canvas = np.zeros((H, W, 4), np.uint8)
    spans = []
    for f, sx, dy in sorted(zip(figs, step, drop), key=lambda t: t[2]):
        x0 = PAD + sx
        region = canvas[dy:dy + f.shape[0], x0:x0 + f.shape[1]]
        canvas[dy:dy + f.shape[0], x0:x0 + f.shape[1]] = np.where(f[..., 3:4] > 0, f, region)
    for f, sx in zip(figs, step):
        spans.append((PAD + sx, PAD + sx + f.shape[1]))
    h = canvas.shape[0]
    waist = h * 50 // 100
    breath = canvas.copy(); breath[:waist - 1] = canvas[1:waist]; breath[waist - 1] = canvas[waist]
    f2 = lean(lean(canvas, h * 85 // 100, 10, spans[0]), h * 85 // 100, -10, spans[2])
    f3 = nod(lean(canvas, h * 85 // 100, -10, spans[1]), h * 25 // 100, 8, spans[0])
    f4 = lean(nod(canvas, h * 25 // 100, 8, spans[2]), h * 85 // 100, 10, spans[1])
    frames = [canvas, breath, f2, f3, f4]
    sheet = np.zeros((h + 2 * GAP, len(frames) * (W + GAP) + GAP, 4), np.uint8)
    rects = []
    for i, f in enumerate(frames):
        x = GAP + i * (W + GAP)
        sheet[GAP:GAP + h, x:x + W] = f
        rects.append([x, GAP, int(W), int(h)])
    return sheet, rects


for name, idx, mirror in (('town-left', [0, 1, 2], True), ('town-right', [3, 4, 5], False)):
    sheet, rects = crowd([people[i] for i in idx], mirror)
    Image.fromarray(sheet).save(os.path.join(ROOT, f'art/actors/room-02-duel-{name}.png'))
    out[name] = rects
print(json.dumps(out))
