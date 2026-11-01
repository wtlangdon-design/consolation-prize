"""Room 4's three judges, cut from the composition master by subtraction. No image operation.

Doc 36 D4 and errata 53: "ask the generator for the same scene without the
object, quantise both, and the layer is a difference between two images."
Operation 1 painted the judges in the room beside Thad and Deke; operation 2
is the same picture with nobody in it. Both are derived with the same crop and
resampler, so a pixel where they differ, inside the judges' box, is a judge --
in the master's own colours, over the very chairs the plate shows, and
registered to the plate by construction.

Each judge becomes his own sprite with a two-frame idle (ruling 20; Tyler: no
person in a room is ever static): frame 1 lifts everything above the table
top by one pixel and leaves the table edge and below exactly where it was --
tools/rig/ambient-breath.py's breath, with the table top as the hem.

Writes art/staging/room-04/judges/judge-{1,2,3}.png (two frames side by side)
and judges.json (each judge's sheet, frames and anchor in plate pixels).
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-04')
MASTER = f'{S}/composition-master-01-1920x864.png'
PLATE = f'{S}/plate-01/unrepaired-1920x864.png'
# The judges' box in plate pixels, read off the mask (renders/room-04-judges-cut.png):
# below the lamp (y 168) and above the table top (y 334), and short of Deke,
# who stands in the master from x 1205 down. Their legs under the table differ
# from the plate's empty chairs only by noise, so the cut is the upper body
# and the plate's own table edge stays in front of them.
BOX = (730, 168, 1232, 334)
THRESHOLD = 40          # summed |RGB| difference; resampling noise sits under 25
GAP = 2                 # px between frames on the sheet
# Where the gaps between the three men fall, read off the same mask.
GAP_WINDOWS = [(880, 925), (1070, 1110)]

m = np.asarray(Image.open(MASTER).convert('RGBA')).astype(int)
p = np.asarray(Image.open(PLATE).convert('RGBA')).astype(int)
x0, y0, x1, y1 = BOX
diff = np.abs(m[..., :3] - p[..., :3]).sum(2)
mask = np.zeros(diff.shape, bool)
mask[y0:y1, x0:x1] = diff[y0:y1, x0:x1] > THRESHOLD
mask = ndi.binary_closing(mask, iterations=3)
mask = ndi.binary_fill_holes(mask)
mask = ndi.binary_opening(mask, iterations=1)
labels, count = ndi.label(mask)
sizes = ndi.sum(mask, labels, range(1, count + 1))
keep = [i + 1 for i, s in enumerate(sizes) if s >= 400]
column = mask.sum(axis=0)
splits = [lo + int(np.argmin(column[lo:hi])) for lo, hi in GAP_WINDOWS]
edges = [x0, splits[0], splits[1], x1]
table_top = y1
print('splits', splits, 'components', len(keep))

out = []
os.makedirs(f'{S}/judges', exist_ok=True)
for j in range(3):
    lo, hi = edges[j], edges[j + 1]
    own = np.zeros_like(mask)
    for label in keep:
        own |= labels == label
    own[:, :lo] = False
    own[:, hi:] = False
    ys, xs = np.where(own)
    t, b, l, r = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = m[t:b, l:r].copy()
    rgba[..., 3] = np.where(own[t:b, l:r], 255, 0)
    frame0 = rgba.astype(np.uint8)
    hem = table_top - t
    frame1 = frame0.copy()
    upper = frame1[:hem]
    frame1[:hem] = np.roll(upper, -1, axis=0)
    frame1[hem - 1:hem] = frame0[hem - 1:hem]
    h, w = frame0.shape[:2]
    sheet = np.zeros((h + 2 * GAP, 2 * w + 3 * GAP, 4), np.uint8)
    sheet[GAP:GAP + h, GAP:GAP + w] = frame0
    sheet[GAP:GAP + h, 2 * GAP + w:2 * GAP + 2 * w] = frame1
    path = f'{S}/judges/judge-{j + 1}.png'
    Image.fromarray(sheet).save(path)
    out.append({
        'judge': j + 1,
        'staged': os.path.relpath(path, ROOT),
        'frames': [[GAP, GAP, int(w), int(h)], [2 * GAP + w, GAP, int(w), int(h)]],
        'anchor': {'x': int(l + w // 2), 'y': int(b - 1)},
        'bbox': [int(l), int(t), int(w), int(h)],
        'pixels': int(own.sum()),
    })
json.dump({'tableTop': int(table_top), 'threshold': THRESHOLD, 'box': list(BOX), 'judges': out},
          open(f'{S}/judges/judges.json', 'w'), indent=1)
print(json.dumps({'tableTop': int(table_top), 'judges': [(o['bbox'], o['pixels']) for o in out]}))
