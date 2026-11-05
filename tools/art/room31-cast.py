"""Room 31's cast and props, cut from the composition master by subtraction. No image operation.

Doc 36 D4 and errata 53, as Room 4's judges were cut (tools/art/room04-judges.py):
operation 1 painted the funeral with everyone at it; operation 2 is the same hill
with nobody, no mule, no hearse and no coffin. Both are derived with the same crop
and resampler, so a pixel where they differ, inside a figure's box, is that figure
-- in the master's own colours, registered to the plate by construction.

  the undertaker      beside the coffin (doc 57 E7 has him speak there)
  Sowerby             officiating behind the grave, a finger raised
  the mourners        the town, one group (they stand close and overlap)
  Hob                 THE ONE WHO KNOWS, at the back with his hat in his hand
  Grievance           the mule, in the hearse harness
  the hearse          a prop, with the coffin on its trestles in front of it:
                      drawn by day, gone by night

Thad stands in the master for scale and is not cut.

MOVEMENT (errata 77). Every figure gets a rest frame and actions derived from it,
the way tools/rig/room04-idles.py derives Room 4's back row: parts move whole
pixels and nothing is repainted. A LEAN shears every row above a pivot sideways
in proportion to its height; a NOD resamples the rows above a line downward. The
mourners' actions are a few of them shifting their weight at once (errata 78's
"one man shifting his weight is enough to stop it being a photograph"), and
Sowerby's are his whole body rocking with the sermon.

Writes art/actors/room-31-<who>.png, art/props/room-31-<what>.png and
art/staging/room-31/cast/cast.json (sheets, frames and anchors in plate pixels).
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-31')
MASTER = f'{S}/composition-master-01-1920x864.png'
PLATE = f'{S}/plate-01/candidate-1920x864.png'
SMOOTH = 7
THRESHOLD = 60      # averaged summed |RGB|; the grass's resampling noise stays under it
CLOSE = 3
GAP = 2

# Boxes in plate pixels, read off the difference mask (renders/room-31-cast-cut.png).
BOXES = {
    'thad': (690, 440, 800, 864),
    'mule': (0, 150, 255, 700),
    'hearse': (150, 120, 572, 735),
    'undertaker': (552, 255, 690, 612),
    'sowerby': (752, 168, 900, 505),
    'mourners': (1232, 280, 1755, 668),
    'hob': (1770, 225, 1915, 608),
}
# Who owns a pixel two boxes share. Thad first, so nothing takes his head (he
# stands in front of Sowerby's feet in the master) -- he is cut only to be left
# out. The mule owns everything left of x 255: her rump stands in front of the
# hearse's nose there, and the difference cannot tell the two apart, so the
# strip of hearse inside her box is hers and never moves (her actions move her
# head only). THE HEARSE AND THE COFFIN ARE ONE PROP: they are drawn together by
# day and gone together by night, so the line between them never has to be cut.
ORDER = ['thad', 'mule', 'hearse', 'undertaker', 'sowerby', 'mourners', 'hob']

m = np.asarray(Image.open(MASTER).convert('RGB')).astype(np.uint8)
p = np.asarray(Image.open(PLATE).convert('RGB')).astype(np.uint8)
diff = ndi.uniform_filter(np.abs(m.astype(int) - p.astype(int)).sum(2).astype(float), SMOOTH)
raw = diff > THRESHOLD
owned = np.zeros(raw.shape, bool)


def body(name):
    x0, y0, x1, y1 = BOXES[name]
    box = np.zeros(raw.shape, bool)
    box[y0:y1, x0:x1] = True
    mk = ndi.binary_closing(raw & box, iterations=CLOSE) & box
    mk = ndi.binary_fill_holes(mk)
    lab, n = ndi.label(mk)
    if n == 0:
        raise SystemExit(f'{name}: nothing in its box')
    sizes = ndi.sum(mk, lab, range(1, n + 1))
    keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= max(800, sizes.max() * 0.04)])
    return keep & ~owned


masks = {}
for name in ORDER:
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
    """Shear the rows above `pivot` (in `cols` only): crown_dx px at row 0, nothing at the pivot."""
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
    # Inside a column window the rest of the group shows through where he left.
    if cols:
        hole = (new[..., 3] == 0) & (seg[..., 3] > 0)
        new[hole] = seg[hole]
    out[:, c0:c1] = new
    return out


def nod(a, line, depth, cols=None):
    """The rows above `line` (in `cols` only) resampled down: depth px at row 0, nothing at the line."""
    out = a.copy()
    c0, c1 = cols if cols else (0, a.shape[1])
    for y in range(line + 1):
        src = y - int(round(depth * (line - y) / max(1, line)))
        out[y, c0:c1] = a[src, c0:c1] if src >= 0 else 0
    return out


def breath(a, waist):
    """Everything above `waist` up one pixel: the smallest change, for between actions."""
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


def pad(a, px):
    return np.pad(a, ((0, 0), (px, px), (0, 0)))


record = {'note': 'Cut by tools/art/room31-cast.py from operation 1 minus operation 2 (crop x 8, y 200, 1520x684).',
          'figures': {}, 'props': {}}
os.makedirs(f'{S}/cast', exist_ok=True)

PAD = 12
figures = {}
a, bb = rgba(masks['undertaker'])
a = pad(a, PAD); h = a.shape[0]
figures['undertaker'] = (bb, [a, breath(a, h * 55 // 100), lean(a, h * 80 // 100, -6), nod(a, h * 22 // 100, 5),
                              lean(a, h * 80 // 100, 5)],
                         '0 rest, hands folded · 1 breath · 2 a lean toward the coffin · 3 a nod · 4 a lean back')
a, bb = rgba(masks['sowerby'])
a = pad(a, PAD); h = a.shape[0]
figures['sowerby'] = (bb, [a, breath(a, h * 55 // 100), lean(a, h * 78 // 100, 7), lean(a, h * 78 // 100, -7),
                           nod(a, h * 25 // 100, 5)],
                      '0 rest, a finger raised · 1 breath · 2 rocks forward with the sermon · 3 rocks back · 4 a nod')
a, bb = rgba(masks['hob'])
a = pad(a, PAD); h = a.shape[0]
figures['hob'] = (bb, [a, breath(a, h * 55 // 100), lean(a, h * 80 // 100, 6), nod(a, h * 20 // 100, 6)],
                  '0 rest, hat in hand · 1 breath · 2 his weight shifts · 3 his head goes down')
a, bb = rgba(masks['mule'])
a = pad(a, PAD); h = a.shape[0]
w = a.shape[1]
head = (0, PAD + 125)
figures['grievance'] = (bb, [a, nod(a, h * 30 // 100, 3, head), nod(a, h * 62 // 100, 14, head),
                             lean(a, h * 62 // 100, -8, head)],
                        '0 rest, in the hearse harness · 1 an ear goes back · 2 her head goes down · '
                        '3 her head turns away from the hill')
a, bb = rgba(masks['mourners'])
a = pad(a, PAD); h, w = a.shape[:2]
# The group's columns, read off the cut: who shifts in which action.
thirds = [(0, w * 30 // 100), (w * 30 // 100, w * 62 // 100), (w * 62 // 100, w)]
f2 = lean(lean(a, h * 85 // 100, 6, thirds[0]), h * 85 // 100, -6, thirds[2])
f3 = nod(lean(a, h * 85 // 100, -6, thirds[1]), h * 25 // 100, 6, thirds[0])
f4 = lean(nod(a, h * 25 // 100, 6, thirds[2]), h * 85 // 100, 6, thirds[1])
figures['mourners'] = (bb, [a, breath(a, h * 50 // 100), f2, f3, f4],
                       '0 rest, hats held · 1 breath · 2-4 a few of them shifting their weight, a different few each time')

for name, (bb, frames, note) in figures.items():
    out, rects = sheet(frames)
    path = f'art/actors/room-31-{name}.png'
    Image.fromarray(out).save(os.path.join(ROOT, path))
    x0, y0, x1, y1 = bb
    record['figures'][name] = {'sheet': path, 'frames': rects, 'x': (x0 + x1) // 2, 'y': y1,
                               'figureHeight': y1 - y0, 'box': list(bb), 'frameNote': note}

# THE NAME PLATE (doc 05: "THADDEUS GRUB, it says"; doc 54: "It will be on the
# lid, over my face"). The master drew handles and no plate, so one is laid on the
# propped lid here, in the handles' own brass: a blank plate, because no picture
# carries readable text. Plate pixels, on the lid's face right of the mule's strip.
PLATE_AT = (262, 556, 30, 15)
handles = m[(masks['hearse']) & (m[..., 0].astype(int) > 190) & (m[..., 1].astype(int) > 140) & (m[..., 2].astype(int) < 70)]
brass = np.median(handles, axis=0).astype(np.uint8) if len(handles) else np.array([200, 160, 50], np.uint8)
px, py, pw, ph = PLATE_AT
m[py:py + ph, px:px + pw] = (brass.astype(int) * 0.55).astype(np.uint8)
m[py + 3:py + ph - 3, px + 3:px + pw - 3] = brass
m[py + 3:py + 5, px + 3:px + pw - 3] = np.minimum(255, brass.astype(int) + 45).astype(np.uint8)
record['namePlate'] = {'rect': list(PLATE_AT), 'brass': brass.tolist()}

for name in ('hearse',):
    a, bb = rgba(masks[name])
    path = f'art/props/room-31-{name}.png'
    Image.fromarray(a).save(os.path.join(ROOT, path))
    x0, y0, x1, y1 = bb
    record['props'][name] = {'sheet': path, 'frame': [0, 0, x1 - x0, y1 - y0], 'x': (x0 + x1) // 2, 'y': y1,
                             'box': list(bb)}

# The cut, for a person to check: every mask over the master, in its own tint.
vis = m.copy().astype(float)
tints = [(255, 80, 80), (80, 255, 80), (80, 80, 255), (255, 255, 80), (255, 80, 255), (80, 255, 255), (255, 160, 60)]
for (name, mk), t in zip([(k, v) for k, v in masks.items() if k != 'thad'], tints):
    vis[mk] = vis[mk] * 0.5 + np.array(t) * 0.5
Image.fromarray(vis.astype(np.uint8)).save(os.path.join(ROOT, 'renders/room-31-cast-cut.png'))
with open(f'{S}/cast/cast.json', 'w') as f:
    json.dump(record, f, indent=1)
    f.write('\n')
for k, v in {**record['figures'], **record['props']}.items():
    print(k, v['box'], 'x', v['x'], 'y', v['y'], v.get('figureHeight', ''))
