"""Room 4's back row, given deliberate movement. No image operation.

Errata 35: nobody is ever perfectly still, and figures get deliberate actions
-- the driver "shifts a case, straightens, looks up the road" -- not only a
breath. Tyler, 2026-11-01, twice: first "the four men in the back are completely
stationary" (a one-pixel breath every few seconds), then, of the leans that
answered it, "Sowerby's arm needs to move up and down otherwise it looks like
he's frozen. And it would be better for the judges to move more than just
breathing."

So each has the idle Winnie and Deke have -- a breath that never stops, and
every few seconds one BREAK from a pool (types.ts `breaks`) -- and the breaks
are actions:

  judges   0 rest · 1 breath · 2 confer (lean to the neighbour) · 3 hands lifted
           (drumming on the table) · 4 nod · 5 glance the other way
  Sowerby  0 rest · 1 breath · 2 pencil hand lowered · 3 lowered further ·
           4 raised · 5 lean to the judges · 6 lean back

Every pose is derived from the man's own rest frame, the way Winnie's moving
hand is: parts of him move whole pixels, nothing is repainted, and no part is
moved in a way that opens a hole inside him. That rules out moving a block
(the first attempt moved the head as a rectangle and tore a see-through slit
beside it). What is used instead:

  A LEAN shears every row above a pivot sideways in proportion to its height,
  so neighbouring rows differ by at most a pixel. Judges pivot at the table
  top, where their hands rest; Sowerby at his hips, so his boots stay put.
  A NOD is the same idea vertically: the rows above the chin are resampled
  down, NOD px at the crown and nothing at the chin.
  THE HANDS rise by a smooth warp: each pixel is read from a little below
  itself, HANDS_UP px over the hands and nothing at the table top or a few
  pixels away from them, so the wrists stay on and nothing parts.
  THE FOREARM (Sowerby) is every pixel right of the coat's edge and above the
  elbow, turned about the corner of the joint it folds into -- the top when it
  lowers, the bottom when it rises -- so no wedge opens between sleeve and
  coat; the original sleeve stays under it within ELBOW_KEEP px of the lower
  corner.

The rest frames are read from the staged cuts, not the shipping sheets, so a
second run does not pad a padded frame. Frames are padded PAD px either side
so no movement is clipped, and equally so the bottom-centre anchors stay put.

Writes art/staging/room-04/idles/<id>.png and idles.json.
"""
import json
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-04')
OUT = os.path.join(S, 'idles')
GAP = 2
PAD = 6
CONFER = 5        # px at the crown
GLANCE = 3
NOD = 3
HANDS_UP = 4
TAPER = 8
ARM_DOWN = (8, 15)    # degrees, clockwise: the hand comes down
ARM_UP = 7
ELBOW_KEEP = 10
SWING_PAD = 28    # the lowered hand travels about 25 px right
LEAN_TO_JUDGES = 4


def judge_frames(n):
    return json.load(open(f'{S}/judges/judges.json'))['judges'][n - 1]['frames']


# id: ambient file, staged rest+breath sheet and its frames, which way the neighbour is (+1 right), timing
FIGURES = {
    'room_04_judge_1': ('content/ambient/room-04-judge-1.json', 'judges/judge-1.png', judge_frames(1), +1, 0.22, 0.10, 6.0),
    'room_04_judge_2': ('content/ambient/room-04-judge-2.json', 'judges/judge-2.png', judge_frames(2), -1, 0.19, 0.55, 7.5),
    'room_04_judge_3': ('content/ambient/room-04-judge-3.json', 'judges/judge-3.png', judge_frames(3), -1, 0.25, 0.80, 5.5),
    'sowerby': ('content/ambient/sowerby.json', 'sowerby/sowerby.png',
                json.load(open(f'{S}/sowerby/sowerby.json'))['frames'], +1, 0.20, 0.35, 4.0),
}
JUDGE_BREAKS = [[2, 2, 2, 2, 2, 2, 2, 2, 0],        # confers with his neighbour
                [3, 0, 3, 0, 3, 3, 0],              # drums his hands on the table
                [4, 4, 0, 4, 4, 0],                 # nods
                [5, 5, 5, 5, 5, 0]]                 # glances the other way
SOWERBY_BREAKS = [[2, 3, 3, 2, 0],                  # marks the air with the pencil
                  [2, 3, 2, 0, 2, 3, 2, 0],         # and again, twice
                  [4, 4, 0, 2, 0],                  # lifts it, brings it down
                  [5, 5, 5, 5, 5, 0, 2, 3, 2, 0],   # turns to the judges, then marks
                  [6, 6, 6, 0, 4, 0]]               # leans back, lifts the pencil


def pad(a, px=None):
    px = PAD if px is None else px
    return np.pad(a, ((0, 0), (px, px), (0, 0)))


def skin_of(a):
    r, g, b, al = (a[..., i].astype(int) for i in range(4))
    return (al > 0) & (r > 110) & (r > g + 15) & (g > b)


def lean(a, pivot, crown_dx):
    """Shear the rows above `pivot`: crown_dx px at row 0, nothing at the pivot."""
    out = np.zeros_like(a)
    out[pivot:] = a[pivot:]
    for y in range(pivot):
        dx = int(round(crown_dx * (pivot - y) / pivot))
        if dx > 0:
            out[y, dx:] = a[y, :-dx]
        elif dx < 0:
            out[y, :dx] = a[y, -dx:]
        else:
            out[y] = a[y]
    return out


def chin(a):
    """The lowest skin row in the upper half, within the columns the crown spans."""
    h = a.shape[0]
    crown = np.where((a[: max(4, h * 6 // 100), :, 3] > 0).any(0))[0]
    cols = slice(max(0, int(crown.min()) - 2), int(crown.max()) + 3)
    return int(np.where(skin_of(a)[: h // 2, cols].any(1))[0].max())


def nod(a, depth):
    """The rows above the chin resampled down: depth px at the crown, nothing at the chin."""
    c = chin(a)
    out = a.copy()
    for y in range(c + 1):
        src = y - int(round(depth * (c - y) / c))
        out[y] = a[src] if src >= 0 else 0
    return out


def lift_hands(a, dy):
    """The hands lifted dy px by a smooth warp, so nothing parts.

    Every output pixel is read from a little below itself: dy px over the
    hands, tapering to nothing at the table top (the sprite's bottom row),
    TAPER rows above the hands and TAPER px either side of them. The sleeve
    between hands and table stretches up behind them and the torso just above
    gives way, so the hands rise with their wrists still on. (Moving the hands
    as a block left a slit under them, inside the figure -- the hands end at
    room y 300-324 and the sprite runs to the table top at 333; the review on
    #98 caught it.)"""
    h, w = a.shape[:2]
    skin = skin_of(a)
    skin[: h * 2 // 3] = False
    ys, xs = np.where(skin)
    y0, y1, x0, x1 = int(ys.min()), int(ys.max()), int(xs.min()), int(xs.max())
    yy = np.arange(h, dtype=float)
    wy = np.ones(h)
    wy[yy > y1] = (h - 1 - yy[yy > y1]) / max(1, h - 1 - y1)
    top = y0 - dy
    above = yy < top
    wy[above] = np.clip(1 - (top - yy[above]) / TAPER, 0, 1)
    xx = np.arange(w, dtype=float)
    wx = np.clip(1 - np.maximum(x0 - xx, xx - x1) / TAPER, 0, 1)
    wx[(xx >= x0) & (xx <= x1)] = 1
    d = dy * wy[:, None] * wx[None, :]
    src = np.clip(np.rint(yy[:, None] + d).astype(int), 0, h - 1)
    return a[src, np.arange(w)[None, :]]


def swing_forearm(a, degrees):
    """Sowerby's forearm and hand, rotated about the elbow (clockwise = down)."""
    h, w = a.shape[:2]
    body = a[int(h * 0.36):int(h * 0.44), :, 3] > 0
    coat_edge = int(np.where(body.any(0))[0].max()) + 1
    elbow_y = int(np.where(a[:, coat_edge:, 3].any(1))[0].max())
    # THE HINGE IS THE CORNER THE TURN FOLDS INTO. Lowering, it is the top of
    # the joint, where the sleeve's upper edge leaves the coat; raising, the
    # bottom. Hinged at the other corner, each opened a wedge between sleeve
    # and coat.
    hinge_y = int(np.where(a[:elbow_y + 1, coat_edge, 3] > 0)[0].min())
    piece = np.zeros_like(a)
    piece[:elbow_y + 1, coat_edge:] = a[:elbow_y + 1, coat_edge:]
    keep = a.copy()
    keep[:elbow_y + 1, coat_edge:] = 0
    yy, xx = np.mgrid[:h, :w]
    near = (yy - elbow_y) ** 2 + (xx - coat_edge) ** 2 <= ELBOW_KEEP ** 2
    keep[near] = a[near]
    turned = np.asarray(Image.fromarray(piece).rotate(-degrees, resample=Image.NEAREST,
                                                      center=(coat_edge, hinge_y if degrees > 0 else elbow_y)))
    return np.where(turned[..., 3:4] > 0, turned, keep)


os.makedirs(OUT, exist_ok=True)
record = {}
for fid, (path, staged_rest, rects, side, rate, phase, every) in FIGURES.items():
    sheet = np.asarray(Image.open(f'{S}/{staged_rest}').convert('RGBA'))
    (x0, y0, w, h), (x1, y1, _, _) = rects[0], rects[1]
    px = SWING_PAD if fid == 'sowerby' else PAD
    rest, breath = pad(sheet[y0:y0 + h, x0:x0 + w], px), pad(sheet[y1:y1 + h, x1:x1 + w], px)
    w = rest.shape[1]
    if fid == 'sowerby':
        hips = int(h * 0.5)
        frames = [rest, breath, swing_forearm(rest, ARM_DOWN[0]), swing_forearm(rest, ARM_DOWN[1]),
                  swing_forearm(rest, -ARM_UP), lean(rest, hips, LEAN_TO_JUDGES), lean(rest, hips, -3)]
        breaks = SOWERBY_BREAKS
    else:
        frames = [rest, breath, lean(rest, h - 1, side * CONFER), lift_hands(rest, HANDS_UP),
                  nod(rest, NOD), lean(rest, h - 1, -side * GLANCE)]
        breaks = JUDGE_BREAKS
    out = np.zeros((h + 2 * GAP, len(frames) * (w + GAP) + GAP, 4), np.uint8)
    frame_rects = []
    for i, f in enumerate(frames):
        x = GAP + i * (w + GAP)
        out[GAP:GAP + h, x:x + w] = f
        frame_rects.append([x, GAP, int(w), int(h)])
    staged = os.path.join(OUT, f'{fid}.png')
    Image.fromarray(out).save(staged)
    amb = json.load(open(os.path.join(ROOT, path)))
    record[fid] = {'ambient': path, 'from': f'art/staging/room-04/{staged_rest}', 'staged': os.path.relpath(staged, ROOT),
                   'shipping': amb['sprite']['sheet'], 'frames': frame_rects, 'rate': rate, 'phase': phase,
                   'breakEvery': every, 'breaks': breaks}
    print(fid, w, h, len(frames), 'frames')
json.dump(record, open(os.path.join(OUT, 'idles.json'), 'w'), indent=1)
