"""Room 4's Sowerby, cut from operation 3 by subtraction. No image operation.

Operation 3 was an edit of the room as it stands -- plate, judges, Deke and
Thad at game size -- asked to add Reverend Sowerby and change nothing else
(errata 75 puts him in Room 4's duels: "Sowerby holds the pencil"). Derived
with the room's crop and differenced against that same base, so he is
registered to the plate and drawn in the room's light.

HIS COAT IS DARK ON DARK. Black cloth against a dark slate barely differs, so
a single threshold finds his face, collar, hands and edges and leaves the coat
between them out. The mask is therefore his outline, filled: a low threshold,
closed and hole-filled inside his own box (x 628-756, y 74 to the table top),
minus judge 1, who sits in front of his right side.

Writes art/staging/room-04/sowerby/sowerby.png (two frames: rest, breath) and
sowerby.json.
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-04')
BOX = (628, 74, 756, 330)      # his own region; the table top is the bottom
THRESHOLD = 18
GAP = 2

m = np.asarray(Image.open(f'{S}/sowerby-01/derived-1920x864.png').convert('RGBA')).astype(int)
p = np.asarray(Image.open(f'{S}/sowerby-01/base-1920x864.png').convert('RGBA')).astype(int)
x0, y0, x1, y1 = BOX
diff = np.abs(m[..., :3] - p[..., :3]).sum(2)
mask = np.zeros(diff.shape, bool)
mask[y0:y1, x0:x1] = diff[y0:y1, x0:x1] > THRESHOLD
mask = ndi.binary_closing(mask, iterations=5)
mask = ndi.binary_fill_holes(mask)
mask = ndi.binary_opening(mask, iterations=2)
labels, count = ndi.label(mask)
sizes = ndi.sum(mask, labels, range(1, count + 1))
mask = labels == (int(np.argmax(sizes)) + 1)
mask = ndi.binary_fill_holes(mask)
# Judge 1 is in front of him: wherever judge 1 is drawn, it is judge 1.
judges = json.load(open(f'{S}/judges/judges.json'))['judges']
j1 = judges[0]
sheet = np.asarray(Image.open(os.path.join(ROOT, j1['staged'])).convert('RGBA'))
fx, fy, fw, fh = j1['frames'][0]
left, top = j1['anchor']['x'] - fw // 2, j1['anchor']['y'] - fh + 1
judge_alpha = np.zeros(mask.shape, bool)
judge_alpha[top:top + fh, left:left + fw] = sheet[fy:fy + fh, fx:fx + fw, 3] > 0
mask &= ~judge_alpha
# And Thad, standing in front at his mark in the base: the edit redrew his hair a
# few pixels differently, and a sliver of it must not become part of Sowerby.
thad = Image.open(os.path.join(ROOT, 'art/actors/thad-idle-right/idle-00.png')).convert('RGBA')
thad = thad.crop(thad.getbbox())
TH = 530
thad = np.asarray(thad.resize((round(thad.width * TH / thad.height), TH), Image.BOX))
tx, ty = 800 - thad.shape[1] // 2, 760 - TH + 1
thad_alpha = np.zeros(mask.shape, bool)
thad_alpha[ty:ty + TH, tx:tx + thad.shape[1]] = thad[..., 3] > 0
mask &= ~ndi.binary_dilation(thad_alpha, iterations=4)
labels, count = ndi.label(mask)
sizes = ndi.sum(mask, labels, range(1, count + 1))
mask = labels == (int(np.argmax(sizes)) + 1)
mask[y1:, :] = False
# THE RIM IS TRIMMED TO WHAT REALLY CHANGED. Filling his outline also took in
# slate around his head, where the edit redrew the chalk a little: near his
# edge (within 6 px), a pixel stays only if it differs from the base by more
# than the redrawn chalk does.
rim = mask & ~ndi.binary_erosion(mask, iterations=6)
mask &= ~(rim & (diff <= 40))
mask = ndi.binary_opening(mask, iterations=1)
labels, count = ndi.label(mask)
sizes = ndi.sum(mask, labels, range(1, count + 1))
mask = ndi.binary_fill_holes(labels == (int(np.argmax(sizes)) + 1))
ys, xs = np.where(mask)
t, b, l, r = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
rgba = m[t:b, l:r].copy()
rgba[..., 3] = np.where(mask[t:b, l:r], 255, 0)
frame0 = rgba.astype(np.uint8)
frame1 = frame0.copy()
hem = frame0.shape[0] - 1
frame1[:hem] = np.roll(frame0[:hem], -1, axis=0)
frame1[hem - 1:hem] = frame0[hem - 1:hem]
h, w = frame0.shape[:2]
out = np.zeros((h + 2 * GAP, 2 * w + 3 * GAP, 4), np.uint8)
out[GAP:GAP + h, GAP:GAP + w] = frame0
out[GAP:GAP + h, 2 * GAP + w:2 * GAP + 2 * w] = frame1
os.makedirs(f'{S}/sowerby', exist_ok=True)
Image.fromarray(out).save(f'{S}/sowerby/sowerby.png')
rec = {'sheet': 'art/staging/room-04/sowerby/sowerby.png',
       'frames': [[GAP, GAP, int(w), int(h)], [2 * GAP + w, GAP, int(w), int(h)]],
       'anchor': {'x': int(l + w // 2), 'y': int(b - 1)}, 'bbox': [int(l), int(t), int(w), int(h)],
       'pixels': int(mask.sum()), 'box': list(BOX), 'threshold': THRESHOLD,
       'source': 'room-04 attempt 3 (art/staging/room-04/sowerby-01/source.png), derived with the room crop'}
json.dump(rec, open(f'{S}/sowerby/sowerby.json', 'w'), indent=1)
print(json.dumps({k: rec[k] for k in ('bbox', 'anchor', 'pixels')}))
