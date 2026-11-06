"""Cut Thad's rope-pull sheet into the back-facing `reach` clip (Room 17's bell rope).

Brief: reference/room-17/rope-pull/brief.md. The sheet is thad-rope-pull attempt 1,
generated with NO rope (the image service refused any picture of a man gripping a
rope overhead as "violence, self-harm", twice; Tyler, 2026-11-06, chose "no rope in
the art": the church plate's own rope is drawn down to his fists in the engine).

WHY NOT tools/rig/cut-sheet.py, which the brief names. Two things it does are wrong
for this clip:
  - It takes its scale from POSE 1. Here pose 1 is the reach, arms up, taller than a
    standing man; scaled to 625 it would shrink him. The scale is taken from POSE 6,
    DONE, standing as in the reference, so he is 625 at the record's size like every
    other back-facing frame.
  - It lines poses up by the left edge of each pose's run of columns, so a pose with
    an elbow out would jump sideways. Each pose here is placed by its FEET: the centre
    of its lowest rows at x 370, its soles on the anchor row.

Thad's back frames are 740x690 with his soles at 625 and his crown at 0. Raised arms
reach far above the crown, so this clip's canvas is taller, and its anchor says where
the soles are on it (content/actors/thad.json: `anchor` per clip).

KEYING AND GRADE. The magenta key is cut hard (alpha 0 or 255, never a halo) and the
rim despilled to the key gate's own measure, (R+B)/2 - G under 30, pulling red and blue
down rather than deleting a pixel. The sheet came back a little lighter and more
saturated than Thad (pose 6: brightness 61.7, saturation 85.0 against his 54.0, 78.7 at
the rope's 469 px), so every frame is graded by one factor in value and one in
saturation, measured from pose 6 against his own back-facing stand frame.

Writes art/actors/thad-reach-back/reach-00..05.png and prints the clip's canvas, anchor
and the measurements before and after the grade.
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SHEET = os.path.join(ROOT, 'art/staging/thad-rope-pull/sheet-01.png')
OUT = os.path.join(ROOT, 'art/actors/thad-reach-back')
STAND = os.path.join(ROOT, 'art/actors/thad-stand-back/stand-00.png')
FIGURE = 625          # a standing Thad at the record's size (content/actors/thad.json)
WIDTH = 740           # the back-facing canvas width; feet centred at 370
BELOW = 65            # canvas rows under the soles, as on every back frame (690 - 625)
FEET_ROWS = 24        # the rows, from the soles up, whose centre places a pose
SPECK = 40            # non-key islands smaller than this are noise, not him

src = np.asarray(Image.open(SHEET).convert('RGB')).astype(int)
key = (src[..., 0] > 150) & (src[..., 2] > 150) & (src[..., 1] < 110)
cols = (~key).any(0)
runs, start = [], None
for x, filled in enumerate(cols):
    if filled and start is None:
        start = x
    elif not filled and start is not None:
        if x - start > 40:
            runs.append((start, x))
        start = None
assert len(runs) == 6, f'expected six poses, found {len(runs)}: {runs}'

poses = []
for x0, x1 in runs:
    # NOT hole-filled: the magenta his raised arms enclose over his head is
    # background, and filled it came out as a purple patch once despilled.
    # Specks of non-key under SPECK pixels are dropped instead.
    him = ~key[:, x0:x1]
    labels, count = ndi.label(him)
    sizes = ndi.sum(him, labels, range(1, count + 1))
    him = np.isin(labels, [i + 1 for i, size in enumerate(sizes) if size >= SPECK])
    ys, xs = np.where(him)
    t, b = ys.min(), ys.max() + 1
    piece = np.zeros((b - t, x1 - x0, 4), np.uint8)
    piece[..., :3] = src[t:b, x0:x1]
    piece[..., 3] = np.where(him[t:b], 255, 0)
    poses.append(piece)

scale = FIGURE / poses[5].shape[0]
scaled = []
for p in poses:
    img = Image.fromarray(p)
    w, h = max(1, round(img.width * scale)), max(1, round(img.height * scale))
    a = np.asarray(img.resize((w, h), Image.LANCZOS)).copy()
    a[..., 3] = np.where(a[..., 3] >= 128, 255, 0)
    scaled.append(a)


def lum(a):
    a = a.astype(float)
    return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]


def stats(a):
    m = a[..., 3] > 0
    inner = ndi.binary_erosion(m, iterations=2)
    l = lum(a[..., :3])
    dx = np.abs(np.diff(l, axis=1))[inner[:, 1:] & inner[:, :-1]]
    dy = np.abs(np.diff(l, axis=0))[inner[1:] & inner[:-1]]
    hsv = np.asarray(Image.fromarray(a[..., :3]).convert('HSV')).astype(float)
    return {'texture': round(float((dx.mean() + dy.mean()) / 2), 2), 'lum': round(float(l[m].mean()), 1),
            'sat': round(float(hsv[..., 1][m].mean()), 1)}


stand = np.asarray(Image.open(STAND).convert('RGBA'))
stand = stand[np.where(stand[..., 3].any(1))[0].min():]
target, before = stats(stand), stats(scaled[5])
v_gain = target['lum'] / before['lum']
s_gain = target['sat'] / before['sat']


def grade(a):
    out = a.copy()
    hsv = np.asarray(Image.fromarray(a[..., :3]).convert('HSV')).astype(float)
    hsv[..., 1] = np.clip(hsv[..., 1] * s_gain, 0, 255)
    hsv[..., 2] = np.clip(hsv[..., 2] * v_gain, 0, 255)
    out[..., :3] = np.asarray(Image.fromarray(hsv.astype(np.uint8), 'HSV').convert('RGB'))
    # Despill, to the key gate's measure.
    rgb = out[..., :3].astype(int)
    cast = (out[..., 3] > 0) & ((rgb[..., 0] + rgb[..., 2]) / 2 - rgb[..., 1] > 24)
    for c in (0, 2):
        out[..., c] = np.where(cast, np.minimum(rgb[..., c], rgb[..., 1] + 24), rgb[..., c])
    # AND THE KEY'S SIGNATURE, HOWEVER DARK: red and blue all but equal and well
    # above green -- the generator's dark outline blended with the magenta, (30, 6,
    # 30). The cast test above lets those through; tools/check-residual-key.mjs does
    # not, and Thad's own frames carry none.
    rgb = out[..., :3].astype(int)
    tinted = (out[..., 3] > 0) & (np.abs(rgb[..., 0] - rgb[..., 2]) <= 6) & ((rgb[..., 0] + rgb[..., 2]) / 2 - rgb[..., 1] > 5)
    for c in (0, 2):
        out[..., c] = np.where(tinted, np.minimum(rgb[..., c], rgb[..., 1] + 5), rgb[..., c])
    out[out[..., 3] == 0] = 0
    return out


graded = [grade(a) for a in scaled]
tallest = max(a.shape[0] for a in graded)
height = tallest + BELOW
sole = tallest
os.makedirs(OUT, exist_ok=True)
for i, a in enumerate(graded):
    h, w = a.shape[:2]
    feet = np.where((a[h - FEET_ROWS:, :, 3] > 0).any(0))[0]
    cx = int(round((feet.min() + feet.max()) / 2))
    canvas = np.zeros((height, WIDTH, 4), np.uint8)
    left, top = WIDTH // 2 - cx, sole - h
    x0, x1 = max(0, left), min(WIDTH, left + w)
    canvas[top:sole, x0:x1] = a[:, x0 - left:x1 - left]
    Image.fromarray(canvas).save(os.path.join(OUT, f'reach-{i:02d}.png'))

print(json.dumps({'canvas': [WIDTH, height], 'anchor': [WIDTH // 2, sole], 'figureHeight': FIGURE,
                  'scale': round(scale, 4), 'thad': target, 'pose6Before': before,
                  'pose6After': stats(graded[5]), 'gains': {'value': round(v_gain, 3), 'saturation': round(s_gain, 3)}}))
