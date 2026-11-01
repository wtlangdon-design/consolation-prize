"""Cut a generated N-pose sheet on magenta into an ambient character's frames.

Written for Deke Vessel (2026-10-31) and kept general, because every new
character from the generator arrives the same way: poses side by side on
#FF00FF, boots on one baseline.

  1. KEY: anything within 120 of pure magenta is background; specks dropped.
  2. EDGE: the outermost ring is magenta-blended, so it is eroded; what is
     left is despilled (magenta excess pulled out of R and B).
  3. REGISTER: each pose is aligned on its LEGS (the lowest 27% of the
     figure), so the feet do not jitter when the pose changes.
  4. REDUCE: premultiplied BOX resize to the room curve's height at his feet
     (doc 38 R4 -- premultiply before every resize), alpha hardened.
  5. RIM: an outline pixel noticeably lighter than the pixels inside it takes
     their median -- the generator's soft edge reads as a halo on a dark plate.

Usage: cut-ambient-sheet.py <sheet.png> <height> <out.png>
Prints the frames and the leg anchor as JSON.
"""
import json, sys
import numpy as np
from PIL import Image
from scipy.ndimage import binary_erosion, label

src, height, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
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

cols = core.sum(0) > 3
runs, start = [], None
for x, on in enumerate(cols):
    if on and start is None: start = x
    if not on and start is not None: runs.append((start, x - 1)); start = None
if start is not None: runs.append((start, len(cols) - 1))
rows = np.nonzero(core.any(1))[0]
top, bottom = rows.min(), rows.max()
tall = bottom - top + 1
legs_from = bottom - int(tall * 0.27)

poses = []
for a, b in runs:
    rgba = np.dstack([im[top:bottom + 1, a:b + 1], core[top:bottom + 1, a:b + 1] * 255.0])
    legs = np.nonzero(core[legs_from:bottom + 1, a:b + 1].any(0))[0]
    lx = (legs.min() + legs.max()) / 2
    sc = height / tall
    w, h = max(1, round(rgba.shape[1] * sc)), height
    pre = rgba.copy(); pre[..., :3] *= pre[..., 3:4] / 255
    s = np.asarray(Image.fromarray(pre.astype(np.uint8), 'RGBA').resize((w, h), Image.BOX)).astype(float)
    al = s[..., 3:4]
    s[..., :3] = np.where(al > 0, s[..., :3] * 255 / np.maximum(al, 1), 0)
    s[..., 3] = np.where(s[..., 3] >= 128, 255, 0)
    poses.append((s, lx * sc))

left = max(lx for _, lx in poses)
right = max(p.shape[1] - lx for p, lx in poses)
W, L = int(np.ceil(left + right)), int(np.ceil(left))
sheet = np.zeros((height + 4, len(poses) * (W + 2) + 2, 4))
frames = []
for i, (p, lx) in enumerate(poses):
    fx = 2 + i * (W + 2); ox = fx + round(L - lx)
    sheet[2:2 + height, ox:ox + p.shape[1]] = np.where(p[..., 3:4] > 0, p, sheet[2:2 + height, ox:ox + p.shape[1]])
    frames.append([fx, 2, W, height])

A = sheet[..., 3] > 0
inner = binary_erosion(A)
lum = lambda c: c @ np.array([0.299, 0.587, 0.114])
for y, x in zip(*np.nonzero(A & ~inner)):
    m = inner[max(0, y - 2):y + 3, max(0, x - 2):x + 3]
    if not m.any(): continue
    med = np.median(sheet[max(0, y - 2):y + 3, max(0, x - 2):x + 3][m][:, :3], 0)
    if lum(sheet[y, x, :3]) > lum(med) + 12: sheet[y, x, :3] = med

Image.fromarray(np.round(sheet).astype(np.uint8), 'RGBA').save(out)
print(json.dumps({'poses': len(poses), 'frames': frames, 'legsAt': L, 'width': W, 'height': height}))
