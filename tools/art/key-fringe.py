"""The key colour's fringe, taken off three figures' edges (errata 345). No image operation.

The Act I review's art director saw pink pixels on the outline of the bell-ringer and the map seller and a green
streak on the message boy's shin: what is left of the key colour the sheets were cut from. An edge pixel (within two
pixels of the figure's outside) that is pinker than anything the figure wears, or key green, takes the colour of the
figure's own pixels beside it. Nothing inside the figure is touched, and no pixel is added or removed.

    python3 tools/art/key-fringe.py [--dry]
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SHEETS = ['art/actors/room-43-bell-ringer.png', 'art/actors/message-boy.png', 'art/actors/ambient-map-seller-master.png']
DRY = '--dry' in sys.argv


def fringe(px):
    r, g, b, a = [px[..., k].astype(int) for k in range(4)]
    opaque = a > 0
    near_edge = opaque & ~ndimage.binary_erosion(opaque, structure=np.ones((3, 3)), iterations=2)
    pink = (r - g > 28) & (b >= g) & (r > 70)
    green = (g > r * 1.12) & (g > b * 1.3) & (g > 50)
    return opaque, (near_edge & pink) | (opaque & green)


def main():
    for rel in SHEETS:
        path = os.path.join(ROOT, rel)
        px = np.asarray(Image.open(path).convert('RGBA')).copy()
        opaque, bad = fringe(px)
        total = int(bad.sum())
        for _ in range(4):
            if not bad.any():
                break
            good = opaque & ~bad
            out = px.copy()
            for y, x in zip(*np.nonzero(bad)):
                y0, y1, x0, x1 = max(0, y - 1), y + 2, max(0, x - 1), x + 2
                near = good[y0:y1, x0:x1]
                if near.any():
                    out[y, x, :3] = np.median(px[y0:y1, x0:x1, :3][near], axis=0)
                    bad[y, x] = False
            px = out
        print(rel, total, 'fringe pixels,', int(bad.sum()), 'left')
        if not DRY:
            Image.fromarray(px, 'RGBA').save(path)


if __name__ == '__main__':
    main()
