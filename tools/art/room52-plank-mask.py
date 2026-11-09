"""The grog tent's one occlusion plane (Room 52): the plank and the two barrels under it, which stand in front of the
Deacon behind the bar (doc 109; the brief: "behind the plank"). No image operation.

Rectangles read off the promoted plate (art/backgrounds/room-52-grog-tent.png): the plank 780-1625 x 512-575, the
barrels 798-965 and 1425-1600 x 570-765. The third barrel, the rule-keeper's, stands in front of nobody. Under the
plank between the barrels is open, so the Deacon's legs show there, as a man's would.

    python3 tools/art/room52-plank-mask.py     # writes art/masks/room-52-plane-1.png
"""
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RECTS = [(780, 512, 1625, 575), (798, 570, 965, 765), (1425, 570, 1600, 765)]

mask = np.zeros((864, 1920, 4), np.uint8)
for x0, y0, x1, y1 in RECTS:
    mask[y0:y1, x0:x1] = 255
Image.fromarray(mask).save(os.path.join(ROOT, 'art/masks/room-52-plane-1.png'))
print('art/masks/room-52-plane-1.png')
