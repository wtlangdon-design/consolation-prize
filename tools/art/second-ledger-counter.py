"""The second ledger lying on Winnie's counter (errata 181: Tyler's ruling on errata 66 E's after-state -- it stays
out; from T_SECOND_LEDGER on it lies on her counter for the rest of the game). No image operation here.

room-05-second-ledger operation 2 (reference/second-ledger/counter-02.txt) edited a close-up of the night plate's
counter (CROP, at 6.4x, art/staging/room-05/second-ledger/counter-input.png) under a mask over BOX, laying the small
green cloth ledger Winnie holds in art/actors/winnie-second-ledger.png frames 4-5, closed, between the grille's two
brass posts. The edit re-laid the whole close-up a little smoother, so only what it CHANGED inside BOX is kept: the
edit is taken back down to plate pixels, and inside BOOK (the re-laid post bases either side are left out) the
pixels unlike the edit's own counter top -- further than THRESHOLD (summed RGB) from its median round the book,
which is the cloth, the cream page edges and the dark outline -- closed and filled, become the prop. Cutting by
CHANGE took a lighter rectangle of the edit's smoothed counter with it. Everything else is the plate's own pixel, i.e. transparent.

THE COVER IS BROUGHT TO WINNIE'S GREEN. The edit drew the cloth at (37, 41, 26), darker than the same book in her
hands in the same room (frames 4-5: (60, 69, 32)); the brief is that it matches the one she holds, so the cover's
green pixels are scaled per channel to her book's mean. The cream page edges and the outline are the edit's.

Night: art/objects/room-05/second-ledger.png, a full-plate RGBA overlay over the shipping plate (the base image).
Day: art/staging/room-05/second-ledger/second-ledger-day.png, the same pixels relit by ONE gain per channel: the
median of day / night over the counter top round the book (RING). Relighting pixel by pixel amplified the dark
seams into orange specks.

Usage: python3 tools/art/second-ledger-counter.py
"""
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STAGE = os.path.join(ROOT, 'art/staging/room-05/second-ledger')
NIGHT = os.path.join(ROOT, 'art/backgrounds/room-05-assay-office.png')
DAY = os.path.join(ROOT, 'art/staging/room-05/plate-02/candidate-1920x864.png')
CROP = (700, 300, 240, 160)          # x, y, w, h in plate pixels; drawn at 6.4x
BOX = (765, 372, 880, 426)           # the mask: x0, y0, x1, y1 in plate pixels
BOOK = (793, 383, 847, 407)          # the book in the edit, plate pixels: what may be kept
RING = (760, 384, 890, 420)          # the counter top round it, for the day's gain
HELD = np.array([60, 69, 32.])       # her book's cloth in art/actors/winnie-second-ledger.png frames 4-5
THRESHOLD = 70


def main():
    x, y, w, h = CROP
    night = np.asarray(Image.open(NIGHT).convert('RGB')).astype(float)
    day = np.asarray(Image.open(DAY).convert('RGB')).astype(float)
    edit = np.asarray(Image.open(os.path.join(STAGE, 'counter-02.png')).convert('RGB').resize((w, h), Image.BOX)).astype(float)
    full = night.copy()
    full[y:y + h, x:x + w] = edit
    d = np.abs(full - night).sum(-1)
    inbox = np.zeros(d.shape, bool)
    x0, y0, x1, y1 = BOOK
    inbox[y0:y1, x0:x1] = True
    rx0, ry0, rx1, ry1 = RING
    ring = np.zeros(d.shape, bool)
    ring[ry0:ry1, rx0:rx1] = True
    ring &= ~ndi.binary_dilation(inbox, iterations=4) & (night.sum(-1) > 120)
    counter = np.median(full[ring], 0)
    keep = (np.abs(full - counter).sum(-1) > THRESHOLD) & inbox
    lab, n = ndi.label(keep)
    if n == 0:
        raise SystemExit('nothing changed inside the book')
    sizes = ndi.sum(keep, lab, range(1, n + 1))
    keep = lab == (1 + int(np.argmax(sizes)))             # the book and its shadow: the one large changed shape
    keep = ndi.binary_fill_holes(ndi.binary_closing(keep, iterations=2)) & inbox
    r, g, b = full[..., 0], full[..., 1], full[..., 2]
    cloth = keep & (g > r) & (g > b + 6)
    full[cloth] *= HELD / full[cloth].mean(0)
    gain = np.median(day[ring] / np.maximum(night[ring], 1), 0)

    def overlay(rgb):
        out = np.zeros(night.shape[:2] + (4,), np.uint8)
        out[keep, :3] = np.clip(rgb[keep], 0, 255).round().astype(np.uint8)
        out[keep, 3] = 255
        return Image.fromarray(out, 'RGBA')

    n_img = overlay(full)
    d_img = overlay(full * gain)
    n_img.save(os.path.join(ROOT, 'art/objects/room-05/second-ledger.png'))
    d_img.save(os.path.join(STAGE, 'second-ledger-day.png'))
    print('art/objects/room-05/second-ledger.png', n_img.getbbox(), int(keep.sum()), 'px', 'cloth', int(cloth.sum()), 'day gain', gain.round(3).tolist())


if __name__ == '__main__':
    main()
