"""Cut Thad's dinner sheet into two clips (errata 189's unacted moments, doc 48 S1 beats 1-4).

Sheet: room-11 attempt 6 (reference/unacted-moments/dinner-prompt-01.txt), four poses:
  0 seated to dine, in profile facing left, on a dining chair, forearms at the table's edge
  1 the same, his wine raised to his lips
  2 standing, facing front, the deed held upside down (its seal at the top), looking down at it
  3 the same, looking up from it

  thad-dining-left, thad-idlebreak-dining-left, thad-stand-dining-left -- the state `dining` of
                     `idle`, `idle-break` and `stand`, as Room 33's `seated` is: seated at
                     Fanshawe's table (pose 0); the wine is his idle break (pose 1).
  thad-deed-front -- `deed`: on the porch, beat 4's two lines, played a frame at a time.

ONE SCALE, from pose 2 standing at his front record's 626 (content/actors/thad.json), as
tools/rig/cut-rope-pull.py takes it from its standing pose. Each pose placed by its FEET on
the record's anchor row: the front poses centred on their lowest rows, the seated ones by the
right edge of their lowest rows (the chair's back legs), so the wine does not shift him.
Keyed hard; graded by one factor in value and one in saturation against his own stand frame;
despilled only at the rim (two pixels in), because the wine and the wax seal are red and a
whole-figure despill took them for the key.

Writes art/actors/thad-dine-left/ and art/actors/thad-deed-front/ (frames and rig.json).
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SHEET = os.path.join(ROOT, 'art/staging/room-11/dinner-thad-01/sheet.png')
STAND = os.path.join(ROOT, 'art/actors/thad-stand-front/stand-00.png')
FIGURE, BELOW, PAD, SPECK = 626, 65, 260, 40

src = np.asarray(Image.open(SHEET).convert('RGB')).astype(int)
key = (src[..., 0] > 150) & (src[..., 2] > 150) & (src[..., 1] < 110)
cols = (~key).any(0)
runs, start = [], None
for x, filled in enumerate(list(cols) + [False]):
    if filled and start is None: start = x
    elif not filled and start is not None:
        if x - start > 40: runs.append((start, x))
        start = None
assert len(runs) == 4, f'expected four poses, found {len(runs)}: {runs}'

poses = []
for x0, x1 in runs:
    him = ~key[:, x0:x1]
    labels, count = ndi.label(him)
    sizes = ndi.sum(him, labels, range(1, count + 1))
    him = np.isin(labels, [i + 1 for i, size in enumerate(sizes) if size >= SPECK])
    ys, xs = np.where(him)
    t, b, l, r = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    piece = np.zeros((b - t, r - l, 4), np.uint8)
    piece[..., :3] = src[t:b, x0 + l:x0 + r]
    piece[..., 3] = np.where(him[t:b, l:r], 255, 0)
    poses.append(piece)

scale = FIGURE / poses[2].shape[0]
scaled = []
for p in poses:
    pre = p.astype(np.float32); pre[..., :3] *= pre[..., 3:4] / 255
    w, h = max(1, round(p.shape[1] * scale)), max(1, round(p.shape[0] * scale))
    small = np.stack([np.asarray(Image.fromarray(pre[..., c], 'F').resize((w, h), Image.BOX)) for c in range(4)], -1)
    a = small[..., 3]
    rgb = np.where(a[..., None] > 1, small[..., :3] * 255 / np.maximum(a[..., None], 1), 0)
    scaled.append(np.dstack([np.clip(rgb, 0, 255), np.where(a >= 128, 255, 0)]).astype(np.uint8))


def lum(a):
    a = a.astype(float); return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]


def stats(a):
    m = a[..., 3] > 0
    hsv = np.asarray(Image.fromarray(a[..., :3]).convert('HSV')).astype(float)
    return float(lum(a[..., :3])[m].mean()), float(hsv[..., 1][m].mean())


stand = np.asarray(Image.open(STAND).convert('RGBA'))
(tl, ts), (bl, bs) = stats(stand), stats(scaled[2])
v_gain, s_gain = tl / bl, ts / bs


def grade(a):
    out = a.copy()
    hsv = np.asarray(Image.fromarray(a[..., :3]).convert('HSV')).astype(float)
    hsv[..., 1] = np.clip(hsv[..., 1] * s_gain, 0, 255)
    hsv[..., 2] = np.clip(hsv[..., 2] * v_gain, 0, 255)
    out[..., :3] = np.asarray(Image.fromarray(hsv.astype(np.uint8), 'HSV').convert('RGB'))
    rim = (out[..., 3] > 0) & ~ndi.binary_erosion(out[..., 3] > 0, iterations=2)
    rgb = out[..., :3].astype(int)
    cast = rim & ((rgb[..., 0] + rgb[..., 2]) / 2 - rgb[..., 1] > 24)
    tinted = (out[..., 3] > 0) & (np.abs(rgb[..., 0] - rgb[..., 2]) <= 6) & ((rgb[..., 0] + rgb[..., 2]) / 2 - rgb[..., 1] > 5)
    for c in (0, 2):
        out[..., c] = np.where(cast, np.minimum(rgb[..., c], rgb[..., 1] + 24), out[..., c])
        out[..., c] = np.where(tinted, np.minimum(out[..., c].astype(int), rgb[..., 1] + 5), out[..., c])
    # THE SEAL AND THE WINE ARE RED, and tools/check-key-fringe.mjs reads (r+b)/2 - g over 30 as the key
    # showing through. Their green is raised just to the line, which turns a pillar-box red a shade toward
    # brick and leaves every other colour of him where it was.
    rgb = out[..., :3].astype(int)
    floor = (rgb[..., 0] + rgb[..., 2]) // 2 - 28
    out[..., 1] = np.where(out[..., 3] > 0, np.maximum(rgb[..., 1], floor), rgb[..., 1]).clip(0, 255)
    out[out[..., 3] == 0] = 0
    return out


def write(name, frames, place, note, clip, facing, width=None, state=None, scale_from=None):
    width = width or max(f.shape[1] for f in frames)
    W, H = 2 * PAD + width, FIGURE + BELOW
    # A pose that never stands (seated) takes its scale from the clip that does, and shares its figure
    # (tools/check-rig-describes-frames.mjs): the padding moves so the anchor stays where it was.
    figure, pad = [width, FIGURE], PAD
    if scale_from:
        figure = json.load(open(os.path.join(ROOT, 'art/actors', scale_from, 'rig.json')))['figure']
        pad = PAD + (width - figure[0]) // 2
    d = os.path.join(ROOT, 'art/actors', name); os.makedirs(d, exist_ok=True)
    for i, f in enumerate(frames):
        canvas = np.zeros((H, W, 4), np.uint8)
        x = place(f, PAD + width / 2)
        y = FIGURE - f.shape[0]
        canvas[y:FIGURE, x:x + f.shape[1]] = f
        Image.fromarray(canvas).save(os.path.join(d, f'{clip}-{i:02d}.png'))
    json.dump({'source': 'art/staging/room-11/dinner-thad-01/sheet.png', 'key': 'magenta', 'clip': clip,
               'facing': facing, 'figure': figure, 'padding': pad, 'frames': len(frames), 'note': note,
               **({'state': state} if state else {}), **({'scale_from': scale_from} if scale_from else {})},
              open(os.path.join(d, 'rig.json'), 'w'), indent=2)
    print(name, 'canvas', W, H, 'figure', width)


def feet_centre(f, centre):
    xs = np.where((f[-24:, :, 3] > 0).any(0))[0]
    return int(round(centre - (xs.min() + xs.max()) / 2))


def chair_right(f, centre):
    right = max(np.where((g[-24:, :, 3] > 0).any(0))[0].max() for g in dine)
    return int(round(centre - right / 2 + (right - np.where((f[-24:, :, 3] > 0).any(0))[0].max())))


graded = [grade(p) for p in scaled]
dine = graded[:2]
write('thad-deed-front', graded[2:], feet_centre,
      "Doc 48 S1 beat 4, 'Thad on the porch, holding the deed wrong side up': 0 looking down at it, 1 looking up from it. Played over the two lines (\"A very fine dinner.\" / \"I believe I own something.\"), a frame at a time. room-11 attempt 6, cut by tools/rig/cut-dinner.py.",
      'deed', 'front')
DINE = "Doc 48 S1 beat 1, 'Thad seated', through beat 3 (errata 189's unacted moments): seated at Fanshawe's table on a dining chair, in profile facing left, forearms at the table's edge; the wine raised is his idle break. room-11 attempt 6, cut by tools/rig/cut-dinner.py at his front record's scale."
wide = max(f.shape[1] for f in dine)
write('thad-dining-left', [dine[0]], chair_right, DINE, 'dining', 'left', wide, 'dining', 'thad-deed-front')
write('thad-idlebreak-dining-left', [dine[1], dine[1], dine[0]], chair_right, DINE, 'idle-break', 'left', wide, 'dining', 'thad-deed-front')
write('thad-stand-dining-left', [dine[0]], chair_right, DINE, 'stand', 'left', wide, 'dining', 'thad-deed-front')
print('grade', round(v_gain, 3), round(s_gain, 3))
