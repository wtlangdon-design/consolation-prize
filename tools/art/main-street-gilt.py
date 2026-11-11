"""The Company's sign with fresh gilt, on the redrawn street (errata 276). No image operation.

Act III's state of THE COMPANY SIGN (doc 05 Part Two-B: "Fresh gilt on the lettering") is a full-plate overlay drawn
over Room 2's plate. It was cut from the street before the redraw, and its board is the old board: on the redrawn
street the old board stood out past the new one. This lays the gilt on the redrawn board instead: inside the old
overlay's box, the new plate's lettering (its warm, light pixels) is lifted to the old overlay's gilt (the board itself is left as drawn: tinting it bled onto the facade), so the sign reads as the same sign, newly painted.

    python3 tools/art/main-street-gilt.py
"""
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PLATE = os.path.join(ROOT, 'art/backgrounds/room-02-main-street.png')
OLD = os.path.join(ROOT, 'reference/night-streets/originals/company-sign-gilt-overlay.png')
OUT = os.path.join(ROOT, 'art/objects/room-02/company-sign-gilt-overlay.png')


def main():
    old = np.asarray(Image.open(OLD).convert('RGBA')).astype(float)
    plate = np.asarray(Image.open(PLATE).convert('RGB')).astype(float)
    ys, xs = np.nonzero(old[..., 3] > 0)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    region = plate[y0:y1, x0:x1]
    lum = region.mean(2)
    warm = region[..., 0] - region[..., 2]
    letters = (lum > np.percentile(lum, 78)) & (warm > 18)
    oldr = old[y0:y1, x0:x1]
    oa = oldr[..., 3] > 0
    gilt = np.percentile(oldr[oa][:, :3], 95, axis=0)
    out = np.zeros((plate.shape[0], plate.shape[1], 4), np.uint8)
    o = out[y0:y1, x0:x1]
    # Gilt: the letter's own shading kept, its colour moved to the gilt's.
    shade = np.clip(lum / max(1.0, lum[letters].max()), 0.55, 1)[..., None]
    o[letters, :3] = np.clip(gilt * shade, 0, 255)[letters]
    o[letters, 3] = 255
    Image.fromarray(out).save(OUT, optimize=True)
    print('wrote', os.path.relpath(OUT, ROOT), int(letters.sum()), 'letter pixels')


if __name__ == '__main__':
    main()
