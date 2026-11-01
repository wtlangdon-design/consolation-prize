"""Room 4's back row, given something to do. No image operation.

Tyler, 2026-11-01: "the four men in the back are completely stationary." Each
had a two-frame idle -- rest, and a one-pixel breath every 4.5 to 7 seconds --
and at the size a phone draws the room, one pixel every few seconds is no
movement at all. Ruling 20: no person in a room is ever static.

So each gets the idle Winnie and Deke have: a slow breath that never stops,
and every so often one BREAK, drawn from a pool, so nobody repeats a routine
(types.ts `breaks`). The break frames are derived from the figure's own rest
frame, the way Winnie's moving hand is (Room 5 frames.json): a part of him is
moved a few whole pixels, and nothing is repainted. A pixel the part vacates
becomes transparent, so the plate behind -- the wall or the chalkboard he was
cut against -- shows there, which is what would.

  judges   0 rest · 1 breath · 2 lean left · 3 lean right · 4 sit up
  Sowerby  0 rest · 1 breath · 2 pencil raised · 3 lean to the judges · 4 lean back

A LEAN, NOT A MOVED HEAD. The first version moved the head as a block and tore
the figure wherever the block's edge crossed a hat brim or a shoulder -- a
see-through slit beside the face. A lean shears him instead: each row above a
pivot moves sideways in proportion to its height, LEAN px at the crown and
nothing at the pivot, so neighbouring rows never differ by more than a pixel
and nothing parts. The judges pivot at the table top, where their hands rest;
Sowerby at his hips, so his boots stay where they stand. Frames are padded PAD
px either side so a lean is never clipped, and padded equally so his
bottom-centre anchor does not move.

THE PENCIL ARM is every column right of the coat's widest point at mid-torso,
above the elbow; it lifts on a ramp, nothing at the shoulder and ARM_LIFT px
at the hand, so the sleeve never parts.

Writes art/staging/room-04/idles/<id>.png (five frames, side by side) and
idles.json (frames and the idle timing per figure).
"""
import json
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'art/staging/room-04/idles')
GAP = 2
LEAN = 3
SIT_UP = 2
ARM_LIFT = 3
PAD = 4

FIGURES = {
    # id: the ambient file, and its timing: breath rate, phase, seconds between breaks
    'room_04_judge_1': ('content/ambient/room-04-judge-1.json', 0.22, 0.10, 8.0),
    'room_04_judge_2': ('content/ambient/room-04-judge-2.json', 0.19, 0.55, 11.0),
    'room_04_judge_3': ('content/ambient/room-04-judge-3.json', 0.25, 0.80, 7.0),
    'sowerby': ('content/ambient/sowerby.json', 0.20, 0.35, 9.0),
}
JUDGE_BREAKS = [[2, 2, 2, 2, 2, 2, 2], [3, 3, 3, 3, 3, 3, 3], [4, 4, 0, 4, 4]]
SOWERBY_BREAKS = [[2, 0, 2, 0, 2, 2], [3, 3, 3, 3, 3, 3, 3], [4, 4, 0, 4, 4], [2, 2, 2, 0, 3, 3, 3]]


def pad(a):
    """PAD transparent px either side."""
    return np.pad(a, ((0, 0), (PAD, PAD), (0, 0)))


def lean(a, pivot, crown_dx):
    """Shear the rows above `pivot`: crown_dx px at row 0, nothing at the pivot."""
    out = np.zeros_like(a)
    out[pivot:] = a[pivot:]
    for y in range(pivot):
        dx = int(round(crown_dx * (pivot - y) / pivot))
        row = a[y]
        if dx > 0:
            out[y, dx:] = row[:-dx]
        elif dx < 0:
            out[y, :dx] = row[-dx:]
        else:
            out[y] = row
    return out


def sit_up(a, pivot, dy):
    """Everything above the pivot lifted dy px; the pivot row itself stays."""
    out = a.copy()
    out[: pivot - dy] = a[dy:pivot]
    out[pivot - dy:pivot] = a[pivot - dy:pivot]
    return out


def lift_arm(a):
    """Sowerby's forearm and hand, lifted on a ramp from the coat's edge."""
    h, w = a.shape[:2]
    torso = a[int(h * 0.40):int(h * 0.60), :, 3] > 0
    coat_edge = int(np.where(torso.any(0))[0].max()) + 1
    elbow = int(h * 0.42)
    hand = int(np.where((a[:elbow, :, 3] > 0).any(0))[0].max())
    out = a.copy()
    for x in range(coat_edge, hand + 1):
        d = int(round(ARM_LIFT * (x - coat_edge + 1) / (hand - coat_edge + 1)))
        if d == 0:
            continue
        col = a[:elbow, x].copy()
        out[:elbow, x] = 0
        out[0:elbow - d, x] = col[d:elbow]
    return out


os.makedirs(OUT, exist_ok=True)
record = {}
for fid, (path, rate, phase, every) in FIGURES.items():
    amb = json.load(open(os.path.join(ROOT, path)))
    sp = amb['sprite']
    sheet = np.asarray(Image.open(os.path.join(ROOT, sp['sheet'])).convert('RGBA'))
    (x0, y0, w, h), (x1, y1, _, _) = sp['frames'][0], sp['frames'][1]
    rest = sheet[y0:y0 + h, x0:x0 + w]
    breath = sheet[y1:y1 + h, x1:x1 + w]
    rest, breath = pad(rest), pad(breath)
    w = rest.shape[1]
    if fid == 'sowerby':
        hips = int(h * 0.5)
        frames = [rest, breath, lift_arm(rest), lean(rest, hips, LEAN), lean(rest, hips, -2)]
        breaks = SOWERBY_BREAKS
    else:
        frames = [rest, breath, lean(rest, h - 1, -LEAN), lean(rest, h - 1, LEAN), sit_up(rest, h - 1, SIT_UP)]
        breaks = JUDGE_BREAKS
    out = np.zeros((h + 2 * GAP, len(frames) * (w + GAP) + GAP, 4), np.uint8)
    rects = []
    for i, f in enumerate(frames):
        x = GAP + i * (w + GAP)
        out[GAP:GAP + h, x:x + w] = f
        rects.append([x, GAP, int(w), int(h)])
    staged = os.path.join(OUT, f'{fid}.png')
    Image.fromarray(out).save(staged)
    record[fid] = {'ambient': path, 'staged': os.path.relpath(staged, ROOT), 'shipping': sp['sheet'],
                   'frames': rects, 'rate': rate, 'phase': phase,
                   'breakEvery': every, 'breaks': breaks}
    print(fid, w, h)
json.dump(record, open(os.path.join(OUT, 'idles.json'), 'w'), indent=1)
