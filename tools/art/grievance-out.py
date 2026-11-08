"""Grievance walks out of her stall (doc 54 B3: "Then she walks out of her stall"; errata 194).

Room-15 attempt 6 (reference/unacted-moments/grievance-prompt-01.txt) drew the half door swung open and
her two strides side-on, walking left; her front pose, whole, is her canonical sheet's (attempt 4). This
composes the four frames of `grievance_out`, a figure that draws nothing until the act:

  0  nothing (she is behind her door, in her own figure)
  1  the door open, the stall dark behind it, and her stepping out of it, facing us
  2  out, walking left, one stride
  3  further left, the other stride

Every frame is one canvas over the stall front, bottom-centred on the figure's (x, y). The open door and
the dark doorway are drawn in each of 1-3 over the plate's closed door; her own figure shows its empty
frame meanwhile (frame 5 of room-15-grievance.png, added here). Scaled as tools/art/room15-figures.py
scales her: her front pose is her full height, 360 behind the door, 372 a step in front of it.

Writes art/actors/room-15-grievance-out.png and appends the empty frame to room-15-grievance.png.
"""
import json, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-15')
PLATE = os.path.join(ROOT, 'art/backgrounds/room-15-livery.png')
L, R, T, B = 620, 1300, 230, 690               # the canvas, in room pixels; anchor (960, 690)
DOOR = (1050, 428, 1205, 607)                   # the half door's box on the plate (x0, y0, x1, y1)
HEIGHT = 372


def pieces(path, count, speck=60):
    src = np.asarray(Image.open(path).convert('RGB')).astype(int)
    key = (src[..., 0] > 150) & (src[..., 2] > 150) & (src[..., 1] < 110)
    labels, n = ndi.label(~key)
    sizes = ndi.sum(~key, labels, range(1, n + 1))
    keep = [i + 1 for i, s in enumerate(sizes) if s >= 4000]
    out = []
    for lab in sorted(keep, key=lambda i: np.where(labels == i)[1].min()):
        m = labels == lab
        m = ndi.binary_fill_holes(m) & ~key | m
        ys, xs = np.where(m)
        t, b, l, r = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        p = np.zeros((b - t, r - l, 4), np.uint8)
        p[..., :3] = src[t:b, l:r]; p[..., 3] = np.where(m[t:b, l:r], 255, 0)
        out.append(p)
    assert len(out) == count, f'{path}: expected {count} pieces, found {len(out)}'
    return out


def scale(p, s):
    pre = p.astype(np.float32); pre[..., :3] *= pre[..., 3:4] / 255
    w, h = max(1, round(p.shape[1] * s)), max(1, round(p.shape[0] * s))
    small = np.stack([np.asarray(Image.fromarray(pre[..., c], 'F').resize((w, h), Image.BOX)) for c in range(4)], -1)
    a = small[..., 3]
    rgb = np.where(a[..., None] > 1, small[..., :3] * 255 / np.maximum(a[..., None], 1), 0)
    out = np.dstack([np.clip(rgb, 0, 255), np.where(a >= 128, 255, 0)]).astype(np.uint8)
    rim = (out[..., 3] > 0) & ~ndi.binary_erosion(out[..., 3] > 0, iterations=2)
    c = out[..., :3].astype(int)
    cast = rim & ((c[..., 0] + c[..., 2]) / 2 - c[..., 1] > 24)
    for k in (0, 2):
        out[..., k] = np.where(cast, np.minimum(c[..., k], c[..., 1] + 24), out[..., k])
    out[..., 1] = np.where(out[..., 3] > 0, np.maximum(out[..., 1].astype(int), (c[..., 0] + c[..., 2]) // 2 - 28), out[..., 1]).clip(0, 255)
    out[out[..., 3] == 0] = 0
    return out


def lum(a):
    m = a[..., 3] > 0; c = a[..., :3].astype(float)
    return float((0.299 * c[..., 0] + 0.587 * c[..., 1] + 0.114 * c[..., 2])[m].mean())


def paste(canvas, p, x, bottom):
    """p's bottom-centre on room (x, bottom)."""
    cx, cy = x - L - p.shape[1] // 2, bottom - T - p.shape[0]
    a = p[..., 3:4] / 255.0
    region = canvas[cy:cy + p.shape[0], cx:cx + p.shape[1]]
    region[..., :3] = (p[..., :3] * a + region[..., :3] * (1 - a)).astype(np.uint8)
    region[..., 3] = np.maximum(region[..., 3], p[..., 3])


front = pieces(f'{S}/grievance-01/sheet.png', 5)[0]
door, walk1, walk2 = pieces(f'{S}/grievance-out-01/sheet.png', 3)
front = scale(front, HEIGHT / front.shape[0])
walks = [scale(w, HEIGHT * 0.97 / w.shape[0]) for w in (walk1, walk2)]
gain = lum(front) / lum(walks[0])                  # the side-on strides to her own front's value
for w in walks:
    w[..., :3] = np.clip(w[..., :3].astype(float) * gain, 0, 255).astype(np.uint8)
door = scale(door, (DOOR[3] - DOOR[1] + 18) / door.shape[0])

plate = np.asarray(Image.open(PLATE).convert('RGB')).astype(float)
x0, y0, x1, y1 = DOOR
# THE DOORWAY, DARK: the stall's own back wall and straw from just above the door, carried down and
# shaded toward the floor, so the opening reads as the inside of the stall it is.
above = plate[y0 - 60:y0, x0:x1]
rows = np.vstack([above] * (int(np.ceil((y1 - y0) / 60)) + 1))[: y1 - y0]
shade = np.linspace(0.55, 0.32, y1 - y0)[:, None, None]
inside = np.dstack([np.clip(rows * shade, 0, 255), np.full(rows.shape[:2], 255)]).astype(np.uint8)


def base():
    c = np.zeros((B - T, R - L, 4), np.uint8)
    c[y0 - T:y1 - T, x0 - L:x1 - L] = inside
    paste(c, door, x0 + door.shape[1] // 2 - 4, y1 + 10)
    return c


frames = [np.zeros((B - T, R - L, 4), np.uint8)]
f1 = base(); paste(f1, front, 1128, 676); frames.append(f1)
f2 = base(); paste(f2, walks[0], 1000, 680); frames.append(f2)
f3 = base(); paste(f3, walks[1], 880, 684); frames.append(f3)
W, H = R - L, B - T
sheet = np.zeros((H + 4, (W + 2) * len(frames) + 2, 4), np.uint8)
rects = []
for i, f in enumerate(frames):
    x = 2 + i * (W + 2); sheet[2:2 + H, x:x + W] = f; rects.append([x, 2, W, H])
Image.fromarray(sheet).save(os.path.join(ROOT, 'art/actors/room-15-grievance-out.png'))

# HER OWN FIGURE'S EMPTY FRAME, while she is out (frame 5).
own = os.path.join(ROOT, 'art/actors/room-15-grievance.png')
g = np.asarray(Image.open(own).convert('RGBA'))
npc = json.load(open(os.path.join(ROOT, 'content/ambient/grievance.json')))
fr = npc['sprite']['frames']
if len(fr) == 5:
    w, h = fr[0][2], fr[0][3]
    grown = np.zeros((g.shape[0], g.shape[1] + w + 2, 4), np.uint8); grown[:, :g.shape[1]] = g
    Image.fromarray(grown).save(own)
    fr.append([g.shape[1], 2, w, h])
print(json.dumps({'frames': rects, 'anchor': [(L + R) // 2, B], 'grievanceFrames': fr}))
