"""The grog tent's empty peg (Room 52; doc 109, THE FIDDLE: after G5 "He takes the fiddle down and plays it"). No image
operation.

The plate paints the fiddle on its peg. When the rule-keeper plays it (G5's scene; RUL_G1's "Play me something") it is
under his chin, so the peg is shown empty while he is on a playing frame, or there would be two fiddles. The patch is the plate's own pixels: the
canvas from the clean canvas just left of it, the pole from its own unbroken run below, and the peg's stub left standing.

    python3 tools/art/room52-empty-peg.py      # writes art/props/room-52-peg.png (two frames) and prints its place
"""
import json
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PLATE = os.path.join(ROOT, 'art/backgrounds/room-52-grog-tent.png')
X0, Y0, X1, Y1 = 495, 182, 586, 430        # the fiddle and its bow, with a margin
POLE = 567                                  # the pole's left edge on the plate


def main():
    plate = np.array(Image.open(PLATE).convert('RGB')).astype(int)
    h, w = Y1 - Y0, X1 - X0
    # THE CANVAS: the stretch of the plate, left of the pole and clear of the fiddle and the flap, whose pixels best
    # continue the patch's own left, top and bottom edges (the folds run on the diagonal, so a fixed shift does not).
    cw = POLE - X0
    ring = [(y, X0 - 1) for y in range(Y0, Y1)] + [(Y0 - 1, x) for x in range(X0, POLE)] + [(Y1, x) for x in range(X0, POLE)]
    best = None
    # Wholly left of the fiddle (from x 501) and right of the flap's curtain (to x 400), in rows the curtain does not reach.
    for dy in range(-120, 41, 2):
        for dx in range(67, 96):
            if Y0 + dy - 1 < 0 or X0 - dx - 1 < 400:
                continue
            err = sum(int(np.abs(plate[y + dy, x - dx] - plate[y, x]).sum()) for y, x in ring)
            if best is None or err < best[0]:
                best = (err, dx, dy)
    _, dx, dy = best
    out = plate[Y0:Y1, X0:X1].copy()
    out[:, :cw] = plate[Y0 + dy:Y1 + dy, X0 - dx:POLE - dx]
    # THE POLE: its own clean run above the fiddle (rows 30-180), mirrored back and forth down it so no seam shows.
    for y in range(Y0, Y1):
        k = (y - Y0) % 300
        out[y - Y0, cw:] = plate[180 - (k if k < 150 else 300 - k) - 1, POLE:X1]
    # The left edge blended into the plate over four columns, so no seam shows.
    for k in range(4):
        a = (k + 1) / 5
        out[:, k] = (a * out[:, k] + (1 - a) * plate[Y0:Y1, X0 + k]).astype(int)
    out = out.astype(np.uint8)
    # The peg: a short dark stub standing out of the pole, where the fiddle hung by its scroll.
    stub = np.array([74, 48, 28], np.uint8)
    top = np.array([118, 82, 50], np.uint8)
    out[222 - Y0:229 - Y0, 552 - X0:POLE + 4 - X0] = stub
    out[222 - Y0, 552 - X0:POLE + 4 - X0] = top
    # TWO FRAMES, side by side: 0 the plate's own fiddle on its peg, 1 the peg empty. The rule-keeper's sprite carries it
    # as a prop (Room 5's ink stand): frame 1 while he is on a playing frame, frame 0 otherwise.
    w, h = X1 - X0, Y1 - Y0
    whole = plate[Y0:Y1, X0:X1].astype(np.uint8)
    sheet = np.concatenate([whole, np.zeros((h, 2, 3), np.uint8), out], axis=1)
    alpha = np.full(sheet.shape[:2], 255, np.uint8)
    alpha[:, w:w + 2] = 0
    path = 'art/props/room-52-peg.png'
    Image.fromarray(np.dstack([sheet, alpha])).save(os.path.join(ROOT, path))
    print(json.dumps({'sheet': path, 'frames': [[0, 0, w, h], [w + 2, 0, w, h]], 'x': X0 + w // 2, 'y': Y1}))


if __name__ == '__main__':
    main()
