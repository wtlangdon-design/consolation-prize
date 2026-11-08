"""The square's corner closed on the district map (errata 163 A6). No image operation.

Tyler, 2026-11-07, of the L map's small gap between the long row's last front and the Nugget: asked whether
it could be fixed "without losing the general look we've created", and told it is a move, not a redraw:
"Sure". The east arm (the Nugget, the hotel, the assay office and the ground they stand on, x 640-742,
y 362-578) moves 24 px west, onto the gap's own ground; the strip it leaves is the ground just east of it,
the same rows and the same light, cross-faded over a few pixels at its edges so no line shows.

  python3 tools/art/town-map-corner.py [--write]
writes art/staging/town-map/corner-01/candidate.png, and with --write the shipping map.
"""
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MAP = os.path.join(ROOT, 'art/backgrounds/room-00-town-map.png')
X0, X1, Y0, Y1, DX, FADE = 640, 742, 362, 578, 24, 5


def main(write):
    a = np.asarray(Image.open(MAP).convert('RGB')).astype(float)
    b = a.copy()
    b[Y0:Y1, X0 - DX:X1 - DX] = a[Y0:Y1, X0:X1]
    strip = a[Y0:Y1, X1:X1 + DX]
    # Weight of the strip against what was there: 1 inside, falling to 0 over FADE px at its east, top and bottom.
    h, w = strip.shape[:2]
    wx = np.ones(w)
    for i in range(FADE):
        wx[w - 1 - i] = (i + 1) / (FADE + 1)
    wy = np.ones(h)
    for i in range(FADE):
        wy[i] = wy[h - 1 - i] = (i + 1) / (FADE + 1)
    k = np.minimum.outer(wy, wx)[..., None]
    b[Y0:Y1, X1 - DX:X1] = strip * k + a[Y0:Y1, X1 - DX:X1] * (1 - k)
    out = Image.fromarray(np.clip(b, 0, 255).astype(np.uint8))
    stage = os.path.join(ROOT, 'art/staging/town-map/corner-01')
    os.makedirs(stage, exist_ok=True)
    out.save(os.path.join(stage, 'candidate.png'))
    print(os.path.relpath(os.path.join(stage, 'candidate.png'), ROOT))
    if write:
        out.save(MAP)
        print('promoted', os.path.relpath(MAP, ROOT))


if __name__ == '__main__':
    main('--write' in sys.argv)
