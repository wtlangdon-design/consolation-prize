"""The schoolhouse's counted things, composed from the room's own pixels (errata 183). No image operation here.

Doc 105 counts them: "Fourteen desks" and "Fourteen hooks. They counted." room-41's masters drew sixteen desks and
five hooks, then twenty-one and seven; doc 55 section 8 says a generator will not reliably change a count after the
fact, and to compose from what the operations made when the cap would be spent on a miss. So:

  * room-41 operation 3 (the plate) removed every desk, and THE DESK is cut from composition master 02 by
    SUBTRACTION against that plate (aligned by ALIGN, measured on the window, the board and the door): its
    right-hand front-row desk, whose top and apron are whole and whose legs and stretcher are kept only where they
    differ from the bare floor (the desks behind showed between its legs);
  * FOURTEEN copies are laid in two rows of seven (ROWS), the back row smaller and higher with depth, back to front
    so the near row stands in front;
  * THE HOOKS: the plate's rail of seven hooks is copied once beneath itself, a plank's height down (RAIL, RAIL_DY):
    two rails of seven, fourteen hooks.

Writes art/staging/room-41/plate-01/source-composed.png, from which tools/art/interiors-plate.mjs derives the plate.
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-41')
ALIGN = (-1, 1)                      # plate pixel (x + dx, y + dy) is master pixel (x, y)
DESK = (1017, 568, 1114, 688)        # the right-hand front desk in master 02: x0 y0 x1 y1
APRON = 612                          # rows above this are its top and apron, kept whole
LEGS = [(1024, 1035), (1098, 1110)]  # its two front legs, kept whole: plain posts too dark to subtract from the floor
STRETCHER = (652, 664)               # the bar between its legs, kept whole between them
THRESHOLD = 30
# Two rows of seven: (bottom row in the source, x of the first desk's left edge, spacing, scale).
ROWS = [(640, 330, 108, 0.86), (690, 260, 126, 1.0)]
RAIL = (186, 330, 372, 364)          # the rail and its seven hooks in the plate: x0 y0 x1 y1
RAIL_DY = 46


def main():
    M = np.asarray(Image.open(os.path.join(S, 'composition-master-02.png')).convert('RGB')).astype(int)
    P = np.asarray(Image.open(os.path.join(S, 'plate-01/source.png')).convert('RGB')).astype(int)
    dx, dy = ALIGN
    x0, y0, x1, y1 = DESK
    m = M[y0:y1, x0:x1]
    p = P[y0 + dy:y1 + dy, x0 + dx:x1 + dx]
    diff = np.abs(m - p).sum(-1) > THRESHOLD
    keep = np.zeros(diff.shape, bool)
    keep[:APRON - y0] = True                                   # top and apron, whole
    for a, b in LEGS:
        keep[APRON - y0:, a - x0:b - x0] = True
    keep[STRETCHER[0] - y0:STRETCHER[1] - y0, LEGS[0][1] - x0:LEGS[1][0] - x0] = True
    # trim the top/apron block to the desk's own outline: drop columns where the master equals the plate there
    top = diff[:APRON - y0]
    cols = np.where(top.any(0))[0]
    keep[:, :cols.min()] = False
    keep[:, cols.max() + 1:] = False
    rows = np.where(top.any(1))[0]
    keep[:rows.min()] = False
    desk = np.zeros(m.shape[:2] + (4,), np.uint8)
    desk[keep, :3] = m[keep]
    desk[keep, 3] = 255
    desk = Image.fromarray(desk)
    desk = desk.crop(desk.getbbox())
    desk.save(os.path.join(S, 'plate-01/desk.png'))
    base = P.astype(float)
    # A CONTACT SHADOW under each desk, so it stands on the boards rather than over them: the floor darkened a
    # little in a low band under its feet (doc 55 section 8: nothing floating in the middle of the room).
    for bottom, left, step, scale in ROWS:
        w = round(desk.width * scale)
        for i in range(7):
            x = left + i * step
            base[bottom - 6:bottom + 4, x + 2:x + w - 2] *= 0.72
    out = Image.fromarray(base.clip(0, 255).astype(np.uint8)).convert('RGBA')
    placed = []
    for bottom, left, step, scale in ROWS:                     # back row first
        d = desk.resize((round(desk.width * scale), round(desk.height * scale)), Image.NEAREST)
        for i in range(7):
            x = left + i * step
            out.alpha_composite(d, (x, bottom - d.height))
            placed.append([x, bottom - d.height, d.width, d.height])
    rx0, ry0, rx1, ry1 = RAIL
    rail = out.crop((rx0, ry0, rx1, ry1))
    out.paste(rail, (rx0, ry0 + RAIL_DY))
    out.convert('RGB').save(os.path.join(S, 'plate-01/source-composed.png'))
    print(json.dumps({'desk': list(desk.size), 'desks': len(placed), 'placed': placed, 'hooks rails': 2}))


if __name__ == '__main__':
    main()
