"""Duel Three's judges at their table ON the hotel porch, cut by subtraction.

Tyler, 2026-11-06: "Just a random table random placed on the porch in a way
where it doesn't fit, it's hanging off edges". The table had been drawn
flat-on, on magenta, and laid on a porch seen at an angle: its front legs
stood past the porch's front edge and the judges' boots hung under it.

Cast-unify operation 25 (reference/cast-unify-23.txt) painted the three
judges and their table INTO the porch -- an edit of Room 2's own plate, the
porch crop enlarged to 1536x1024 -- so the table follows the porch's slope and
stands on its boards. The edit repainted the whole crop lightly (mean
difference 28 away from the judges), so the cut is what changed MOST: the
difference averaged over 5 px, over THRESH, closed, filled, the largest piece,
inside the box where the judges and table are. Its pixels are the edit's,
shrunk back to the plate's size, at the plate's own coordinates: the sheet is
drawn 1:1 where it was painted.

Each judge moves within his own span above the table (errata 77): a breath,
then a lean to confer, a nod, a glance -- different judges each time.

Writes art/actors/room-02-duel-porch-judges.png; prints the frames and the
record's x and y.
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
B = os.path.join(ROOT, 'art/staging/cast-unify/batch-23')
box = json.load(open(f'{B}/porch-crop.json'))['box']
W, H = box[2] - box[0], box[3] - box[1]
crop = np.asarray(Image.open(f'{B}/porch-crop.png').convert('RGB')).astype(float)
edit = np.asarray(Image.open(f'{B}/edit.png').convert('RGB').resize((W, H), Image.BOX)).astype(float)
REGION = (125, 185, 400, 352)          # crop x0, y0, x1, y1: the judges and the table
THRESH = 62

d = np.abs(edit - crop).sum(-1)
d = ndi.uniform_filter(d, 5)
m = np.zeros_like(d, bool)
x0, y0, x1, y1 = REGION
m[y0:y1, x0:x1] = d[y0:y1, x0:x1] > THRESH
m = ndi.binary_closing(m, iterations=3)
m = ndi.binary_fill_holes(m)
lab, n = ndi.label(m)
m = lab == (1 + int(np.argmax(ndi.sum(m, lab, range(1, n + 1)))))
m = ndi.binary_opening(m, iterations=1)
ys, xs = np.nonzero(m)
t, b, l, r = ys.min(), ys.max(), xs.min(), xs.max()
group = np.zeros((b - t + 1, r - l + 1, 4), np.uint8)
group[..., :3] = edit[t:b + 1, l:r + 1].round().astype(np.uint8)
group[..., 3] = m[t:b + 1, l:r + 1] * 255
h, w = group.shape[:2]

# The table: the rows where the group is widest and most solid. Judges are
# the three pieces above its top row; each moves within his own span.
cover = (group[..., 3] > 0).mean(1)
table_top = int(np.argmax(cover > 0.8))
above = group[:table_top, :, 3] > 0
# By their HEADS: the top third above the table (chair backs join their bodies).
top_rows = np.nonzero(above.any(1))[0]
heads = above[top_rows[0]:top_rows[0] + max(8, (table_top - top_rows[0]) // 3)]
cols = heads.any(0)
spans, s = [], None
for c, on in enumerate(cols):
    if on and s is None: s = c
    if (not on or c == w - 1) and s is not None:
        e = c if on else c - 1
        if e - s > 8: spans.append((s, e + 1))
        s = None
# A hat brim can come apart from its head: pieces within 6 px are one head.
merged = []
for sp in spans:
    if merged and sp[0] - merged[-1][1] <= 6: merged[-1] = (merged[-1][0], sp[1])
    else: merged.append(sp)
spans = merged
# A span is a head; widen each to the midpoints between heads so a judge's
# shoulders move with him.
if len(spans) == 3:
    mids = [(spans[0][1] + spans[1][0]) // 2, (spans[1][1] + spans[2][0]) // 2]
    spans = [(0, mids[0]), (mids[0], mids[1]), (mids[1], w)]
if len(spans) != 3: Image.fromarray(group).save("/tmp/claude-0/-home-user-consolation-prize/fe4eccca-9877-5440-8761-3a5060a65b57/scratchpad/pj-group.png"); raise SystemExit(f"spans {spans}")


# WHAT IS BEHIND A JUDGE IS THE PORCH. Where a lean or a nod moves him off a
# pixel, the plate's own wall shows there -- not his old pixel: the first cut
# filled it from the rest frame and every moving judge had two faces.
behind = np.zeros_like(group)
behind[..., :3] = crop[t:b + 1, l:r + 1].round().astype(np.uint8)
behind[..., 3] = group[..., 3]


def lean(a, pivot, crown_dx, span):
    out = a.copy(); c0, c1 = span; seg = a[:, c0:c1].copy(); new = seg.copy()
    for yy in range(pivot):
        dx = int(round(crown_dx * (pivot - yy) / pivot)); row = np.zeros_like(seg[yy])
        if dx > 0: row[dx:] = seg[yy, :-dx]
        elif dx < 0: row[:dx] = seg[yy, -dx:]
        else: row = seg[yy]
        new[yy] = row
    hole = (new[..., 3] == 0) & (seg[..., 3] > 0); new[hole] = behind[:, c0:c1][hole]
    out[:, c0:c1] = new; return out


def nod(a, line, depth, span):
    out = a.copy(); c0, c1 = span
    for yy in range(line + 1):
        src = yy - int(round(depth * (line - yy) / max(1, line)))
        row = a[src, c0:c1].copy() if src >= 0 else np.zeros_like(a[yy, c0:c1])
        gap = (row[..., 3] == 0) & (a[yy, c0:c1, 3] > 0)
        row[gap] = behind[yy, c0:c1][gap]
        out[yy, c0:c1] = row
    return out


chin = int(table_top * 0.5)
breath = group.copy(); breath[:table_top - 1] = group[1:table_top]; breath[table_top - 1] = group[table_top]
f2 = nod(lean(lean(group, table_top, 6, spans[0]), table_top, -5, spans[2]), chin, 4, spans[1])
f3 = lean(nod(lean(group, table_top, -6, spans[1]), chin, 4, spans[0]), table_top, 6, spans[2])
f4 = nod(lean(nod(group, chin, 4, spans[2]), table_top, 5, spans[0]), chin, 4, spans[1])
frames = [group, breath, f2, f3, f4]
GAP = 2
sheet = np.zeros((h + 2 * GAP, len(frames) * (w + GAP) + GAP, 4), np.uint8)
rects = []
for i, f in enumerate(frames):
    fx = GAP + i * (w + GAP); sheet[GAP:GAP + h, fx:fx + w] = f; rects.append([fx, GAP, int(w), int(h)])
Image.fromarray(sheet).save(os.path.join(ROOT, 'art/actors/room-02-duel-porch-judges.png'))
print(json.dumps({'frames': rects, 'x': int(box[0] + l + w // 2), 'y': int(box[1] + b), 'tableTop': table_top, 'spans': spans}))
