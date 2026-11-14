"""The barrel with its glass lifted off (errata 307). Tyler, 2026-11-14: Deke "holds up a full glass of beer. He
doesn't take it off the barrel in front of him so it just kind of appears and disappears with the animation."

While Vessel holds his glass (frames 6 and 7), the barrel at his left is drawn without it (RoomProp.heldBy).
No image operation: above the barrel's top edge the glass's pixels go clear; below it, where the glass stood on
the lid, each row takes the lid's own pixels from beside the glass on the same row, so the planks and the rim
keep their rows.

Usage: lift-glass.py <barrel.png> <out.png> <x0> <x1> <y1> <shift>
  (the glass's columns x0..x1 and its foot row y1, in the sheet's pixels; shift: how far right the lid is copied from)
"""
import sys
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
x0, x1, y1, shift = map(int, sys.argv[3:7])
a = np.asarray(Image.open(src).convert('RGBA')).copy()
alpha = a[..., 3] > 0
for y in range(0, y1 + 1):
    # The barrel's top edge in this row: lid on both sides of the glass means the row is lid.
    left = alpha[y, max(0, x0 - 6):x0].any()
    right = alpha[y, x1 + 1:x1 + 7].any()
    if left and right:
        a[y, x0:x1 + 1] = a[y, x0 + shift:x1 + 1 + shift]
    else:
        a[y, x0:x1 + 1] = 0
Image.fromarray(a).save(out)
