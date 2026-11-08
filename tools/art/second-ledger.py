"""The second ledger's art (reference/second-ledger/brief.md, errata 181): Winnie's retrieval, and the loose board lifted.

  python3 tools/art/second-ledger.py winnie
      cuts art/staging/room-05/second-ledger/sheet-01.png (room-05-second-ledger operation 1: Winnie painted over the
      in-game Thad from her counter face, errata 144's method) into art/actors/winnie-second-ledger.png at Room 5's
      height where the board is (the man is 518 there; she stands 0.95 of him), snapped to one level (errata 112),
      and writes its frames to art/staging/room-05/second-ledger/winnie-second-ledger.json:
        0 standing, hands folded, looking down · 1 breath (derived) · 2 kneeling, hands at the board's end ·
        3 crouched, one arm reaching down under the boards · 4 standing, the small green cloth ledger open in her
        hands · 5 standing, the ledger closed against her chest.
  python3 tools/art/second-ledger.py board
      the floorboard's third state, LIFTED, from the plate's own pixels, as tools/pixelart/floorboard.py derived
      `rest` and `pressed` (the same plank, x 462-745, between the same fitted seams): the plank raised at its right
      end and hinged at its left, its near edge's end grain showing dark under it, and the space where it lay a
      dark hollow. Night from the shipping plate (the base image, as `rest`'s is), day from the day plate.
      Writes art/objects/room-05/board-lifted.png and art/staging/room-05/floorboard/board-lifted.png.

No image operation here. `rest` and `pressed` are owner-accepted and frozen, and are not touched.
"""
import json
import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STAGE = os.path.join(ROOT, 'art/staging/room-05/second-ledger')
MAN, STATURE = 518, 0.95
OUT = os.path.join(ROOT, 'art/actors/winnie-second-ledger.png')
NAMES = ['standing', 'breath', 'kneel-lift', 'reach', 'ledger-open', 'ledger-closed']

src = open(os.path.join(ROOT, 'tools/art/one-level.py')).read()
ns = {'__file__': os.path.join(ROOT, 'tools/art/one-level.py')}
exec(src[src.index('import json'):src.index('def man_at')], ns)
snap = ns['snap']


def cut(height, tmp):
    out = os.path.join(tmp, f'c{height}.png')
    info = json.loads(subprocess.check_output([sys.executable, os.path.join(ROOT, 'tools/art/cast-unify-cut.py'),
                                               os.path.join(STAGE, 'sheet-01.png'), '0', str(height), out, '--grid', '1'],
                                              cwd=ROOT).decode())
    img = Image.open(out).convert('RGBA')
    return img, info['frames']


def standing(img, frame):
    x, y, w, h = frame
    a = np.asarray(img)[y:y + h, x:x + w, 3] > 128
    return int(a.any(1).sum())


def winnie():
    target = round(MAN * STATURE)
    with tempfile.TemporaryDirectory() as tmp:
        img, fr = cut(400, tmp)
        height = round(400 * target / standing(img, fr[0]))
        img, fr = cut(height, tmp)
    a = np.asarray(img).copy()
    b = MAN / 115.0
    for x, y, w, h in fr:
        a[y:y + h, x:x + w] = snap(a[y:y + h, x:x + w].copy(), b)
    Image.fromarray(a).save(OUT)
    got = standing(Image.fromarray(a), fr[0])
    record = {'sheet': os.path.relpath(OUT, ROOT), 'frames': fr, 'frameNames': NAMES[:len(fr)],
              'figureHeight': got, 'stature': STATURE, 'posture': 'standing',
              'man': MAN, 'note': 'Room 5 at the loose board (x 462-745, y ~770): the room\'s man is 518; she stands 0.95 of him, '
                                  'crown to sole. Frame 1 is a breath the cutter derives from frame 0. The kneeling and reaching '
                                  'frames stand on the same sole line as the standing ones.',
              'source': 'room-05-second-ledger attempt 1 (art/staging/room-05/second-ledger/sheet-01.png)'}
    json.dump(record, open(os.path.join(STAGE, 'winnie-second-ledger.json'), 'w'), indent=1)
    print(json.dumps({k: record[k] for k in ('sheet', 'frames', 'figureHeight')}))


# The plank, as tools/pixelart/floorboard.py fitted it on the day plate.
X0, X1 = 462, 745
TOP = (0.0209, 731.9)
BOT = (0.0452, 757.3)
LIFT = (3, 30)              # rows raised at the hinge (left) and at the free end (right)


def seam(fit, x):
    return int(round(fit[0] * x + fit[1]))


def lifted(plate_path):
    plate = np.asarray(Image.open(os.path.join(ROOT, plate_path)).convert('RGB')).astype(float)
    H, W = plate.shape[:2]
    out = np.zeros((H, W, 4))
    for x in range(X0, X1 + 1):
        top, bot = seam(TOP, x) + 1, seam(BOT, x) - 1
        col = plate[top:bot + 1, x].copy()
        t = (x - X0) / (X1 - X0)
        lift = int(round(LIFT[0] + (LIFT[1] - LIFT[0]) * t))
        # THE HOLLOW where the plank lay: the seam's own colour, nearly black, a shade lighter at its far edge.
        seam_colour = plate[bot + 1:bot + 3, x].mean(0)
        n = bot - top + 1
        for i in range(n):
            out[top + i, x, :3] = seam_colour * (0.10 + 0.12 * (1 - i / max(1, n - 1)))
            out[top + i, x, 3] = 255
        # THE PLANK raised, foreshortened a little as it tilts up toward the viewer's eye.
        k = max(0.6, 1 - 0.35 * t)
        rows = max(2, int(round(n * k)))
        face = np.asarray(Image.fromarray(col[None].astype(np.uint8).repeat(1, 0).transpose(1, 0, 2)).resize((1, rows), Image.NEAREST)).transpose(1, 0, 2)[0]
        ft = top - lift
        out[ft:ft + rows, x, :3] = face
        out[ft:ft + rows, x, 3] = 255
        # ITS NEAR EDGE: the board's thickness showing under its face, the end grain darker.
        edge = max(2, int(round(lift * 0.18)))
        out[ft + rows:ft + rows + edge, x, :3] = col[-1] * 0.55
        out[ft + rows:ft + rows + edge, x, 3] = 255
    for x in (X1 - 1, X1):                                    # the free end's grain, as `rest`'s
        m = out[:, x, 3] > 0
        out[m, x, :3] *= 0.85
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGBA')


def board():
    night = lifted('art/backgrounds/room-05-assay-office.png')
    day = lifted('art/staging/room-05/plate-02/candidate-1920x864.png')
    night.save(os.path.join(ROOT, 'art/objects/room-05/board-lifted.png'))
    day.save(os.path.join(ROOT, 'art/staging/room-05/floorboard/board-lifted.png'))
    print('art/objects/room-05/board-lifted.png', night.getbbox())


if __name__ == '__main__':
    {'winnie': winnie, 'board': board}[sys.argv[1]]()
