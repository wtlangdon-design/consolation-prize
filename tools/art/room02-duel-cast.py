"""Duel Three's cast on Main Street (doc 57 F4), cut by subtraction. No image operation here.

Room-02 operation 1 painted the street by the assay office with Fanshawe in the
mud, the judges' table on the hotel porch with Sowerby beside it holding the
pencil, and the town at both sides (reference/room-02/prompts/duel-master-01.txt);
operation 2 is the same picture with nobody in it. Each figure is the master
minus the empty street, cut in its own box, as Room 31's cast was
(tools/art/room31-cast.py). Thad is cut only to be left out.

THE STREET IS ROOM 2'S. The figures are laid over the approved plate; the
operations' own streets are never shipped. The master was painted on a crop of
the street (x 2404-3700, all 864 rows) enlarged 1536/1296, so a master pixel
(xm, ym) is the street's (2404 + xm / K, ym / K). The master drew everyone a
little larger than Room 2's people; each sheet declares the height of its
people (`figureHeight`) and the engine draws it at the street's own depth curve.

Each figure moves (errata 77): a breath, and actions derived from the rest frame
-- a lean, a nod, a few of the crowd shifting their weight.

Writes art/actors/room-02-duel-<who>.png and art/staging/room-02/duel-cast/cast.json.

SUPERSEDED IN PART (Tyler, 2026-11-06, one artist, one game): Fanshawe, the town
and the Reverend are now the redrawn cast, and the table seats the redrawn
judges. After running this, run tools/art/cast-unify-duel.py and then
tools/art/cast-unify-duel-table.py, which rewrite those sheets; only the table
and chairs of this cut ship.
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-02')
MASTER = f'{S}/duel-01/master.png'
PLATE = f'{S}/duel-02/source.png'
K = 1536 / 1296
X0 = 2404
SMOOTH = 5
GAP = 2
PAD = 12

# Boxes in master pixels, read off the difference; who owns a shared pixel goes first.
# (box, threshold): the dark coats on the dark wall need a lower one.
BOXES = {
    'thad': ((962, 628, 1070, 898), 40),
    'fanshawe': ((436, 672, 556, 950), 40),
    'table': ((406, 578, 690, 732), 34),
    'sowerby': ((680, 526, 756, 714), 22),
    'town_left': ((18, 652, 354, 948), 40),
    'town_right': ((1174, 662, 1514, 968), 26),
}

m = np.asarray(Image.open(MASTER).convert('RGB')).astype(np.uint8)
p = np.asarray(Image.open(PLATE).convert('RGB')).astype(np.uint8)
diff = ndi.uniform_filter(np.abs(m.astype(int) - p.astype(int)).sum(2).astype(float), SMOOTH)
owned = np.zeros(diff.shape, bool)


def body(name):
    (x0, y0, x1, y1), threshold = BOXES[name]
    box = np.zeros(diff.shape, bool)
    box[y0:y1, x0:x1] = True
    mk = ndi.binary_closing((diff > threshold) & box, iterations=4) & box
    mk = ndi.binary_fill_holes(mk)
    lab, n = ndi.label(mk)
    if n == 0:
        raise SystemExit(f'{name}: nothing in its box')
    sizes = ndi.sum(mk, lab, range(1, n + 1))
    keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= max(150, sizes.max() * 0.05)])
    return ndi.binary_opening(keep, iterations=1) & ~owned


masks = {}
for name in BOXES:
    masks[name] = body(name)
    owned |= masks[name]


def rgba(mask):
    ys, xs = np.where(mask)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    a = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
    a[..., :3] = m[y0:y1, x0:x1]
    a[..., 3] = np.where(mask[y0:y1, x0:x1], 255, 0)
    return a, (int(x0), int(y0), int(x1), int(y1))


def lean(a, pivot, crown_dx, cols=None):
    out = a.copy()
    c0, c1 = cols if cols else (0, a.shape[1])
    seg = a[:, c0:c1].copy()
    new = seg.copy()
    for y in range(pivot):
        dx = int(round(crown_dx * (pivot - y) / pivot))
        row = np.zeros_like(seg[y])
        if dx > 0:
            row[dx:] = seg[y, :-dx]
        elif dx < 0:
            row[:dx] = seg[y, -dx:]
        else:
            row = seg[y]
        new[y] = row
    if cols:
        hole = (new[..., 3] == 0) & (seg[..., 3] > 0)
        new[hole] = seg[hole]
    out[:, c0:c1] = new
    return out


def nod(a, line, depth, cols=None):
    out = a.copy()
    c0, c1 = cols if cols else (0, a.shape[1])
    for y in range(line + 1):
        src = y - int(round(depth * (line - y) / max(1, line)))
        out[y, c0:c1] = a[src, c0:c1] if src >= 0 else 0
    return out


def breath(a, waist):
    out = a.copy()
    out[: waist - 1] = a[1:waist]
    out[waist - 1] = a[waist]
    return out


def sheet(frames):
    h = max(f.shape[0] for f in frames)
    w = max(f.shape[1] for f in frames)
    out = np.zeros((h + 2 * GAP, len(frames) * (w + GAP) + GAP, 4), np.uint8)
    rects = []
    for i, f in enumerate(frames):
        x = GAP + i * (w + GAP)
        out[GAP + h - f.shape[0]:GAP + h, x:x + f.shape[1]] = f
        rects.append([x, GAP, w, h])
    return out, rects


pad = lambda a: np.pad(a, ((0, 0), (PAD, PAD), (0, 0)))
figures = {}
for name in ('fanshawe', 'sowerby'):
    a, bb = rgba(masks[name]); a = pad(a); h = a.shape[0]
    big = 10 if name == 'fanshawe' else 6
    figures[name] = (bb, [a, breath(a, h * 55 // 100), lean(a, h * 80 // 100, big), nod(a, h * 22 // 100, big // 2 + 2),
                          lean(a, h * 80 // 100, -big)], '0 rest · 1 breath · 2 a lean · 3 a nod · 4 a lean back')
a, bb = rgba(masks['table']); a = pad(a); h, w = a.shape[:2]
quarters = [(w * k // 4, w * (k + 1) // 4) for k in range(4)]
figures['table'] = (bb, [a, breath(a, h * 45 // 100), nod(a, h * 45 // 100, 8, quarters[0]), nod(a, h * 45 // 100, 8, quarters[2]),
                         lean(nod(a, h * 45 // 100, 8, quarters[1]), h * 60 // 100, 6, quarters[3])],
                    '0 the judges at their table · 1 breath · 2-4 a judge or two nodding, a different one each time')
for name in ('town_left', 'town_right'):
    a, bb = rgba(masks[name]); a = pad(a); h, w = a.shape[:2]
    thirds = [(0, w * 34 // 100), (w * 34 // 100, w * 67 // 100), (w * 67 // 100, w)]
    figures[name] = (bb, [a, breath(a, h * 50 // 100),
                          lean(lean(a, h * 85 // 100, 10, thirds[0]), h * 85 // 100, -10, thirds[2]),
                          nod(lean(a, h * 85 // 100, -10, thirds[1]), h * 25 // 100, 8, thirds[0]),
                          lean(nod(a, h * 25 // 100, 8, thirds[2]), h * 85 // 100, 10, thirds[1])],
                     '0 rest, watching · 1 breath · 2-4 a few of them shifting their weight, a different few each time')

record = {'note': 'Cut by tools/art/room02-duel-cast.py from room-02 operation 1 minus operation 2; x, y in street pixels.',
          'scale': K, 'origin': X0, 'figures': {}}
os.makedirs(f'{S}/duel-cast', exist_ok=True)
for name, (bb, frames, note) in figures.items():
    out, rects = sheet(frames)
    path = f'art/actors/room-02-duel-{name.replace("_", "-")}.png'
    Image.fromarray(out).save(os.path.join(ROOT, path))
    x0, y0, x1, y1 = bb
    record['figures'][name] = {'sheet': path, 'frames': rects, 'x': round(X0 + (x0 + x1) / 2 / K), 'y': round(y1 / K),
                               'figureHeight': y1 - y0, 'box': list(bb), 'frameNote': note}
vis = m.copy().astype(float)
tints = [(255, 80, 80), (80, 255, 80), (80, 80, 255), (255, 255, 80), (255, 80, 255)]
for (name, mk), t in zip([(k, v) for k, v in masks.items() if k != 'thad'], tints):
    vis[mk] = vis[mk] * 0.5 + np.array(t) * 0.5
Image.fromarray(vis.astype(np.uint8)).save(os.path.join(ROOT, 'renders/room-02-duel-cast-cut.png'))
with open(f'{S}/duel-cast/cast.json', 'w') as f:
    json.dump(record, f, indent=1)
    f.write('\n')
for k, v in record['figures'].items():
    print(k, v['box'], 'x', v['x'], 'y', v['y'], v['figureHeight'])
