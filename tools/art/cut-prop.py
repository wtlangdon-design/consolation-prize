"""Cut one generated prop on magenta into a room prop sheet.

Written for the Nugget's whiskey barrel (Tyler, 2026-11-01,
reference/room-03/barrel/brief.md). The keying, despill and rim pass are
tools/art/cut-ambient-sheet.py's, unchanged, so a prop's edge is cut exactly
as a character's is:

  1. KEY: anything within 120 of pure magenta is background; specks dropped.
  2. EDGE: the outermost ring is magenta-blended, so it is eroded; what is
     left is despilled (magenta excess pulled out of R and B).
  3. TRIM to the object.
  4. REDUCE ONCE: premultiplied BOX resize (doc 38 R4), alpha hardened. The
     height given is the height of the object's MAIN BODY -- from the row
     named by --body-top (the barrel's rim, not the glass on it) to its base
     -- so what sits on top adds to the sheet without changing the body's
     size.
  5. RIM: an outline pixel noticeably lighter than the pixels inside it takes
     their median -- the generator's soft edge reads as a halo on a dark plate.

Usage: cut-prop.py <source.png> <body-height> <body-top-row-in-source> <out.png>
Prints the frame as JSON.
"""
import json, sys
import numpy as np
from PIL import Image
from scipy.ndimage import binary_erosion, label

src, body_height, body_top, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
im = np.asarray(Image.open(src).convert('RGB')).astype(float)
dist = np.sqrt((im[..., 0] - 255) ** 2 + im[..., 1] ** 2 + (im[..., 2] - 255) ** 2)
fg = dist >= 120
lab, n = label(fg)
sizes = np.bincount(lab.ravel())
fg &= np.isin(lab, [i for i in range(1, n + 1) if sizes[i] > 400])
core = binary_erosion(fg, iterations=1)
ring = core & ~binary_erosion(core, iterations=3)
excess = np.clip(np.minimum(im[..., 0], im[..., 2]) - im[..., 1], 0, None) * ring
im[..., 0] -= excess * 0.85
im[..., 2] -= excess * 0.85
im = np.clip(im, 0, 255)

ys, xs = np.nonzero(core)
top, bottom, left, right = ys.min(), ys.max(), xs.min(), xs.max()
rgba = np.dstack([im[top:bottom + 1, left:right + 1], core[top:bottom + 1, left:right + 1] * 255.0])
sc = body_height / (bottom - body_top + 1)
w, h = max(1, round(rgba.shape[1] * sc)), max(1, round(rgba.shape[0] * sc))
pre = rgba.copy(); pre[..., :3] *= pre[..., 3:4] / 255
s = np.asarray(Image.fromarray(pre.astype(np.uint8), 'RGBA').resize((w, h), Image.BOX)).astype(float)
al = s[..., 3:4]
s[..., :3] = np.where(al > 0, s[..., :3] * 255 / np.maximum(al, 1), 0)
s[..., 3] = np.where(s[..., 3] >= 128, 255, 0)

A = s[..., 3] > 0
inner = binary_erosion(A)
lum = lambda c: c @ np.array([0.299, 0.587, 0.114])
for y, x in zip(*np.nonzero(A & ~inner)):
    m = inner[max(0, y - 2):y + 3, max(0, x - 2):x + 3]
    if not m.any(): continue
    med = np.median(s[max(0, y - 2):y + 3, max(0, x - 2):x + 3][m][:, :3], 0)
    if lum(s[y, x, :3]) > lum(med) + 12: s[y, x, :3] = med
s[..., :3] *= A[..., None]

# Trim the rows/columns the hardened alpha left empty.
ys, xs = np.nonzero(A)
s = s[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
Image.fromarray(np.round(s).astype(np.uint8), 'RGBA').save(out)
print(json.dumps({'frame': [0, 0, s.shape[1], s.shape[0]], 'scale': round(sc, 4),
                  'bodyTopInSheet': round((body_top - top) * sc) - int(ys.min())}))
