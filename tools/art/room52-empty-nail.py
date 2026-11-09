"""The grog tent's empty nail (Room 52; doc 109, THE NAIL: "after G9, when the watch has gone with Vessel"). No image
operation.

The plate paints the watch on its chain from a nail in the ridgepole. After G9 it has gone with Vessel, and THE NAIL is
"An empty nail", so this patch, shown over the plate from G9, is the plate's own pixels with the watch and chain taken
away: the canvas from the stretch beside it that best continues its edges, the ridgepole from just beside the chain,
and the nail's head left in the pole.

    python3 tools/art/room52-empty-nail.py     # writes art/props/room-52-nail-empty.png and prints its place
"""
import json
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PLATE = os.path.join(ROOT, 'art/backgrounds/room-52-grog-tent.png')
X0, Y0, X1, Y1 = 1106, 0, 1174, 136      # the watch, its chain and a margin
POLE_BOTTOM = 24                          # the ridgepole's lower edge on the plate


def main():
    plate = np.array(Image.open(PLATE).convert('RGB')).astype(int)
    out = plate[Y0:Y1, X0:X1].copy()
    # The canvas under the pole: the source beside it whose pixels best continue the patch's own left, right and
    # bottom edges.
    ring = ([(y, X0 - 1) for y in range(POLE_BOTTOM, Y1)] + [(y, X1) for y in range(POLE_BOTTOM, Y1)]
            + [(Y1, x) for x in range(X0, X1)])
    best = None
    for dx in list(range(-220, -70, 2)) + list(range(72, 220, 2)):
        for dy in range(0, 60, 2):
            err = sum(int(np.abs(plate[y + dy, x - dx] - plate[y, x]).sum()) for y, x in ring)
            if best is None or err < best[0]:
                best = (err, dx, dy)
    _, dx, dy = best
    out[POLE_BOTTOM - Y0:] = plate[POLE_BOTTOM + dy:Y1 + dy, X0 - dx:X1 - dx]
    # The ridgepole: its own grain from just left of the chain, the same rows.
    out[:POLE_BOTTOM - Y0] = plate[Y0:POLE_BOTTOM, X0 - 70:X1 - 70]
    # The nail's head, where the chain hung.
    out[17:23, 1137 - X0:1142 - X0] = [62, 54, 46]
    out[17, 1137 - X0:1142 - X0] = [120, 110, 98]
    rgba = np.dstack([out.astype(np.uint8), np.full(out.shape[:2], 255, np.uint8)])
    path = 'art/props/room-52-nail-empty.png'
    Image.fromarray(rgba).save(os.path.join(ROOT, path))
    w, h = X1 - X0, Y1 - Y0
    print(json.dumps({'sheet': path, 'frame': [0, 0, w, h], 'x': X0 + w // 2, 'y': Y1}))


if __name__ == '__main__':
    main()
