"""A cyan-blue fringe taken off the graveside hearse (errata 358). No image operation.

The Act III review's art director measured a bright blue one-pixel fringe on the hearse's roof and finial and on the
mule's plume at the graveside: 16.7% and 14.8% of their edge pixels are cyan-blue, against under half a percent inside
any sheet. It is the key screen the generation was cut from. A pixel within six of the outside that is blue or cyan
(bluer than anything the night gives a black hearse) takes the colour of the nearest of the sheet's own pixels that
is not. No pixel is added or removed. Run once, on the sheets as generated.

    python3 tools/art/blue-fringe.py [--dry]
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# How far in from the outline the fringe reaches. The mule (art/actors/room-31-grievance.png) is not on the list: her
# plume's toss is her deliberate action (errata 77), and most of what changes between those frames is the blue fringe
# itself, so taking it off leaves her under the movement test's ten percent. She needs the toss redrawn first.
SHEETS = {'art/props/room-31-hearse.png': 6}
DRY = '--dry' in sys.argv


def fringe(px, reach):
    r, g, b, a = [px[..., k].astype(int) for k in range(4)]
    opaque = a > 0
    near_edge = opaque & ~ndimage.binary_erosion(opaque, structure=np.ones((3, 3)), iterations=reach)
    # Bluer than the night makes black: blue well above both red and green.
    blue = ((b - np.maximum(r, g) > 22) & (b > 55)) | ((b - r > 35) & (g - r > 25) & (b > 70))
    return opaque, near_edge & blue


def main():
    for rel, reach in SHEETS.items():
        path = os.path.join(ROOT, rel)
        px = np.asarray(Image.open(path).convert('RGBA')).copy()
        opaque, bad = fringe(px, reach)
        r, g, b = [px[..., k].astype(int) for k in range(3)]
        bluish = ((b - np.maximum(r, g) > 22) & (b > 55)) | ((b - r > 35) & (g - r > 25) & (b > 70))
        # Each fringe pixel takes the colour of the nearest of the sheet's own pixels that is not blue at all.
        source = opaque & ~bluish
        _, (iy, ix) = ndimage.distance_transform_edt(~source, return_indices=True)
        ys, xs = np.nonzero(bad)
        px[ys, xs, :3] = px[iy[ys, xs], ix[ys, xs], :3]
        print(rel, int(bad.sum()), 'fringe pixels')
        if not DRY:
            Image.fromarray(px, 'RGBA').save(path)


if __name__ == '__main__':
    main()
