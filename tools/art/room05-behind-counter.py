"""What Winnie walks behind on her way out from her counter (errata 270): art/masks/room-05-plane-2.png.

  python3 tools/art/room05-behind-counter.py

Room 5's plane 1 is the cage's posts, which is all a woman standing still at her window is ever behind. Walking to
the counter's far end she passes behind the counter itself, the open book on it, the bell jar and the hanging lamp.
This writes the plane she is drawn through for that leg (AmbientExit.behind), from the plate's own pixels:

  - plane 1, as it is;
  - the counter: everything from its top's back edge (y 388) down, x 692-1497;
  - the open book: the paper and cover standing above that edge;
  - the bell jar: its brass (the scales, the base, the knob) whole, and its glass as glass -- she shows through it;
  - the hanging lamp, from its own overlay.

No image operation. Nobody else in the room is drawn through this plane.
"""
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PLATE = os.path.join(ROOT, 'art/backgrounds/room-05-assay-office.png')
PLANE1 = os.path.join(ROOT, 'art/masks/room-05-plane-1.png')
LAMP = os.path.join(ROOT, 'art/objects/room-05/hanging-lamp-overlay.png')
OUT = os.path.join(ROOT, 'art/masks/room-05-plane-2.png')
GLASS = 96   # of 255: how much of her the glass takes


def main():
    plate = np.asarray(Image.open(PLATE).convert('RGB')).astype(int)
    h, w, _ = plate.shape
    alpha = np.asarray(Image.open(PLANE1).convert('RGBA'))[..., 3].astype(int).copy()
    yy, xx = np.mgrid[0:h, 0:w]
    r, g, b = plate[..., 0], plate[..., 1], plate[..., 2]
    # The counter, from its top's back edge down.
    alpha[(xx >= 692) & (xx <= 1497) & (yy >= 388) & (yy <= 712)] = 255
    # The open book standing above that edge: paper (light) and cover (warm), not the dark wall behind.
    book = (xx >= 950) & (xx <= 1165) & (yy >= 368) & (yy < 388) & ((np.maximum(np.maximum(r, g), b) > 78) | (r - b > 18))
    alpha[book] = 255
    # The bell jar: a dome on a brass base.
    cx, top, bottom, half = 1301, 196, 396, 61
    dome = (yy >= top) & (yy <= bottom) & (np.abs(xx - cx) <= half)
    dome &= (yy >= top + half) | ((xx - cx) ** 2 + (yy - (top + half)) ** 2 <= half ** 2)
    alpha[dome] = np.maximum(alpha[dome], GLASS)
    brass = dome & (r - b > 24) & (r > 70)
    alpha[brass] = 255
    alpha[(yy >= 376) & (yy <= 396) & (np.abs(xx - cx) <= 68)] = 255                      # its base
    # The hanging lamp, in front of her at the window.
    if os.path.exists(LAMP):
        lamp = np.asarray(Image.open(LAMP).convert('RGBA'))[..., 3]
        if lamp.shape == alpha.shape:
            alpha = np.maximum(alpha, lamp)
    out = np.zeros((h, w, 4), np.uint8)
    out[..., 3] = np.clip(alpha, 0, 255)
    Image.fromarray(out).save(OUT, optimize=True)
    print('wrote', os.path.relpath(OUT, ROOT), int((alpha > 0).sum()), 'pixels')


if __name__ == '__main__':
    main()
