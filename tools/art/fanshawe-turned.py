"""Fanshawe at the dinner, turned toward Thad (Tyler, 2026-11-08, of the dinner: "is the guy he's with not
looking at him at all?"; "One more op"). Room-11 attempt 7: his four dinner poses, waist-up, three-quarters to
his left, where Thad sits at the table's end. Cut to his own sheet's measure: the crown-to-cut height of his
rest frame, each pose centred on its body (the bottom rows), the cut row at the frame's foot; graded to his
own frames' value. Writes art/actors/room-11-fanshawe-turned.png and prints the frames.
"""
import json, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SHEET = os.path.join(ROOT, 'art/staging/room-11/fanshawe-turned-01/sheet.png')
OWN = os.path.join(ROOT, 'art/actors/room-11-fanshawe.png')
npc = json.load(open(os.path.join(ROOT, 'content/ambient/fanshawe.json')))
fx, fy, fw, fh = npc['sprite']['frames'][0]
own = np.asarray(Image.open(OWN).convert('RGBA'))[fy:fy + fh, fx:fx + fw]
rows = np.where((own[..., 3] > 0).any(1))[0]
HEIGHT = rows[-1] - rows[0] + 1

src = np.asarray(Image.open(SHEET).convert('RGB')).astype(int)
key = (src[..., 0] > 150) & (src[..., 2] > 150) & (src[..., 1] < 110)
labels, n = ndi.label(~key)
sizes = ndi.sum(~key, labels, range(1, n + 1))
keep = sorted([i + 1 for i, s in enumerate(sizes) if s >= 4000], key=lambda i: np.where(labels == i)[1].min())
assert len(keep) == 4, len(keep)
poses = []
for lab in keep:
    m = labels == lab
    ys, xs = np.where(m)
    t, b, l, r = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    p = np.zeros((b - t, r - l, 4), np.uint8); p[..., :3] = src[t:b, l:r]; p[..., 3] = np.where(m[t:b, l:r], 255, 0)
    poses.append(p)
s = HEIGHT / poses[0].shape[0]


def scale(p):
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
    c = out[..., :3].astype(int)
    out[..., 1] = np.where(out[..., 3] > 0, np.maximum(c[..., 1], (c[..., 0] + c[..., 2]) // 2 - 28), c[..., 1]).clip(0, 255)
    out[out[..., 3] == 0] = 0
    return out


def lum(a):
    m = a[..., 3] > 0; c = a[..., :3].astype(float)
    return float((0.299 * c[..., 0] + 0.587 * c[..., 1] + 0.114 * c[..., 2])[m].mean())


cut = [scale(p) for p in poses]
gain = lum(own) / lum(cut[0])
for c in cut:
    c[..., :3] = np.clip(c[..., :3].astype(float) * gain, 0, 255).astype(np.uint8)


def body(c):
    xs = np.where((c[-20:, :, 3] > 0).any(0))[0]
    return (xs.min() + xs.max()) / 2


# Centred on the body (the bottom rows), so the open hand reaches out to his left without moving him.
reach = max(max(body(c), c.shape[1] - body(c)) for c in cut)
W = int(np.ceil(2 * reach)) + 2
H = fh
out = np.zeros((H + 4, (W + 2) * len(cut) + 2, 4), np.uint8)
frames = []
for i, c in enumerate(cut):
    x = 2 + i * (W + 2)
    left = x + int(round(W / 2 - body(c)))
    out[2 + H - c.shape[0]:2 + H, left:left + c.shape[1]] = c
    frames.append([x, 2, W, H])
Image.fromarray(out).save(os.path.join(ROOT, 'art/actors/room-11-fanshawe-turned.png'))
print(json.dumps({'frames': frames, 'height': int(HEIGHT), 'gain': round(gain, 3)}))
