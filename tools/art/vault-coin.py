"""The Company's strongbox holds coin, not gold (errata 357). No image operation.

The vault plate drew two stacks of gold ingots in the strongbox; the box's lines say coin, sorted by denomination, and
the ledger shelf says the Company has never once traded in gold. The stacks are turned to silver: the gold pixels in
the box's opening keep their light and lose their colour, a little cooled. Run once; a box already silver is left.
"""
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PLATE = os.path.join(ROOT, 'art/backgrounds/room-35-company-vault.png')
BOX = (1020, 590, 1135, 626)  # the stacks inside the open strongbox, plate pixels


def main():
    im = Image.open(PLATE).convert('RGB')
    px = np.asarray(im).astype(float)
    x0, y0, x1, y1 = BOX
    region = px[y0:y1, x0:x1]
    r, g, b = region[..., 0], region[..., 1], region[..., 2]
    gold = (r > 55) & (r - b > 32) & (g - b > 14)
    if not gold.any():
        print('already silver')
        return
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    silver = np.stack([lum * 0.96, lum * 1.0, lum * 1.06], axis=-1)
    region[gold] = np.clip(silver[gold] * 1.08, 0, 255)
    px[y0:y1, x0:x1] = region
    Image.fromarray(px.astype(np.uint8), 'RGB').save(PLATE)
    print('silvered', int(gold.sum()), 'pixels')


if __name__ == '__main__':
    main()
