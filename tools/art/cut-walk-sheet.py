"""Cut a generated N-frame WALK sheet on magenta into a registered walk cycle.

Written for Deke Vessel's walk out of the Nugget (2026-11-01, Room 3 A3,
reference/room-03/deke-walk/brief.md). The key, despill, reduce and rim
steps are tools/art/cut-ambient-sheet.py's, unchanged. What differs is the
registration, because a walking figure's feet move:

  REGISTER ON THE HIPS, NOT THE FEET. cut-ambient-sheet.py aligns standing
  poses on their legs, which for a walk would drag the body back and forth
  with every stride. Here each frame is aligned horizontally on its TORSO
  (the rows from the shoulders to the hips, found by sliding the torso band
  against the first frame's and keeping the best overlap -- the swinging arm
  is a small part of that band and does not win), and vertically on its
  boots' lowest row, so the bounce the generator drew is kept and the
  sole stays on the floor.

  SIZE BY THE TALLEST FRAME. The passing pose -- legs under him -- is his
  standing height; it is reduced to <height>, the height his standing sheet
  draws him at, and every other frame by the same factor, so the stride
  frames are as much shorter as the generator drew them.

Usage: cut-walk-sheet.py <sheet.png> <height> <out.png>
Prints the frames and the registration as JSON.
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

# Each frame trimmed to its own figure.
figs = []
for a, b in runs:
    rows = np.nonzero(core[:, a:b + 1].any(1))[0]
    t, btm = rows.min(), rows.max()
    figs.append({'a': a, 'b': b, 'top': t, 'bottom': btm,
                 'mask': core[t:btm + 1, a:b + 1], 'rgb': im[t:btm + 1, a:b + 1]})
tallest = max(f['bottom'] - f['top'] + 1 for f in figs)

# Torso band, measured from the boots up so every frame's band is the same
# part of him: 55%-80% of the tallest figure's height above the sole is
# belt to shoulders.
def torso(f):
    m = f['mask']; h = m.shape[0]
    lo, hi = h - int(tallest * 0.80), h - int(tallest * 0.55)
    return m[max(0, lo):hi]

ref = torso(figs[0])
def best_shift(band):
    # Pad both to a common canvas and slide band across ref.
    hgt = min(ref.shape[0], band.shape[0])
    r, s = ref[-hgt:], band[-hgt:]
    best, bx = -1, 0
    for dx in range(-s.shape[1], r.shape[1]):
        x0r, x1r = max(0, dx), min(r.shape[1], dx + s.shape[1])
        if x1r <= x0r: continue
        overlap = (r[:, x0r:x1r] & s[:, x0r - dx:x1r - dx]).sum()
        if overlap > best: best, bx = overlap, dx
    return bx

sc = height / tallest
poses = []
for f in figs:
    dx = best_shift(torso(f))            # the frame's left edge, in frame 0's torso coordinates
    rgba = np.dstack([f['rgb'], f['mask'] * 255.0])
    w = max(1, round(rgba.shape[1] * sc)); h = max(1, round(rgba.shape[0] * sc))
    pre = rgba.copy(); pre[..., :3] *= pre[..., 3:4] / 255
    s = np.asarray(Image.fromarray(pre.astype(np.uint8), 'RGBA').resize((w, h), Image.BOX)).astype(float)
    al = s[..., 3:4]
    s[..., :3] = np.where(al > 0, s[..., :3] * 255 / np.maximum(al, 1), 0)
    s[..., 3] = np.where(s[..., 3] >= 128, 255, 0)
    poses.append((s, dx * sc))

# Torso centre of frame 0, so the frame's centre column -- the engine's x --
# is the middle of his body, not the middle of his stride.
ref_cols = np.nonzero(ref.any(0))[0]
torso_c = (ref_cols.min() + ref_cols.max()) / 2 * sc
left = max(torso_c - dx for _, dx in poses)               # room needed left of the torso centre
right = max(p.shape[1] - (torso_c - dx) for p, dx in poses)
half = int(np.ceil(max(left, right)))
W, H = 2 * half, max(p.shape[0] for p, _ in poses)
sheet = np.zeros((H + 4, len(poses) * (W + 2) + 2, 4))
frames = []
for i, (p, dx) in enumerate(poses):
    fx = 2 + i * (W + 2)
    ox = fx + half - round(torso_c - dx)
    oy = 2 + H - p.shape[0]                              # boots on the frame's bottom row
    region = sheet[oy:oy + p.shape[0], ox:ox + p.shape[1]]
    sheet[oy:oy + p.shape[0], ox:ox + p.shape[1]] = np.where(p[..., 3:4] > 0, p, region)
    frames.append([fx, 2, W, H])

A = sheet[..., 3] > 0
inner = binary_erosion(A)
lum = lambda c: c @ np.array([0.299, 0.587, 0.114])
for y, x in zip(*np.nonzero(A & ~inner)):
    m = inner[max(0, y - 2):y + 3, max(0, x - 2):x + 3]
    if not m.any(): continue
    med = np.median(sheet[max(0, y - 2):y + 3, max(0, x - 2):x + 3][m][:, :3], 0)
    if lum(sheet[y, x, :3]) > lum(med) + 12: sheet[y, x, :3] = med

Image.fromarray(np.round(sheet).astype(np.uint8), 'RGBA').save(out)
print(json.dumps({'frames': frames, 'figureHeight': height, 'frameHeight': H,
                  'heights': [p.shape[0] for p, _ in poses],
                  'torsoShift': [round(dx, 1) for _, dx in poses]}))
