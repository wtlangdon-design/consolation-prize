"""The dinner's two places, laid where the two men sit, on room-11 attempt 9's table. No image operation.

Tyler, 2026-11-08: "the place settings are setup in the wrong places for their dinner". Attempts 8 and 9 were
asked to lay one place before each man -- the second with every object's box drawn in -- and both laid the two
places side by side along the near edge, facing the room, where nobody sits. Their cloth is right (plain linen,
hanging to the carpet), so Tyler chose "New cloth, move by hand": this moves attempt 9's own pixels.

- the covered dish, from in front of Fanshawe to the near left of the table;
- the left place (fork, plate, knife), mirrored so his fork is at his left hand, to the far side of the table
  directly in front of Fanshawe, beside his glass;
- the right place to Thad's end: the plate at the end, the fork and the knife turned to lie along the table
  (a quarter turn, tines away from him, halved in depth), the fork on the near side, the knife on the far.

What is moved is each box's pixels that differ from the cloth (or, above the cloth, the wall), holes filled so a
plate keeps its middle. Where something leaves the cloth, the cloth is put back from the cloth around it (its
local median, with the grain of a clean patch of the same rows); where it leaves the wall, the wall comes from
the plate source, which is the same camera.

THE DINNER'S PIXELS. Attempt 9 redrew the whole room, so its wall and carpet differ from the plate's a little
everywhere, and "where it differs" is no longer the dinner. The dinner is the cloth -- the one large light shape
from the table's far edge down, holes filled -- and, above the cloth, each object standing on it: within its own
box, the pixels that differ from the plate, joined to the cloth or large. The plate's chair at the table's end
and its lamp stay the plate's where the cloth does not cover them.

Writes art/staging/room-11/dinner-03/relaid.png (1536x1024) and art/staging/room-11/dinner-03/dinner-1536.png
(the dinner's pixels, transparent elsewhere), which tools/art/room11-props.py places on the plate.
"""
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-11')
SOURCE = f'{S}/dinner-03/source.png'
WALL = f'{S}/plate-01/composite-source.png'
OUT = f'{S}/dinner-03/relaid.png'
DINNER = f'{S}/dinner-03/dinner-1536.png'
PLATE = f'{S}/plate-01/source.png'
AREA = (630, 480, 1115, 765)       # the table and everything on it (1536 source pixels)
# The bottle is dark glass against a dark wall, darker than its mouldings in places, so neither a difference nor
# a darkness finds its neck: its outline, read off attempt 9's pixels, row by row (y0, y1, x0, x1).
BOTTLE = (864, 508, 894, 592)
BOTTLE_SHAPE = [(514, 538, 875, 882), (538, 540, 871, 887), (540, 544, 869, 889), (544, 590, 867, 890)]
# The objects standing above the cloth's far edge, each in its own box (x0, y0, x1, y1).
STANDING = [(724, 492, 756, 566), (759, 530, 788, 566), (894, 494, 926, 592),
            (926, 486, 972, 584), (976, 530, 1004, 582), (682, 552, 772, 610), (780, 555, 870, 592), BOTTLE]
BACK = 562                         # the cloth's far edge (1536 source rows)
TOP = (650, BACK, 1092, 607)       # the table top: x0, y0, x1, y1
CLOTH = 45                         # summed difference from the cloth's local median: an object

# name, box (x0, y0, x1, y1), offset (dx, dy), how it is laid ('as', 'mirror', 'turn')
MOVES = [
    ('dish',        (786, 534, 866, 581), (-101, 24), 'as'),
    ('his place',   (751, 581, 856, 608), (12, -21), 'mirror'),
    ('thad knife',  (1016, 581, 1038, 608), (-4, -18), 'turn'),
    ('thad plate',  (951, 581, 1019, 606), (46, -7), 'as'),
    ('thad fork',   (933, 582, 952, 608), (72, 16), 'turn'),
]
SINGLE = ('dish', 'thad plate')
# Stamped again over what is laid beside or behind it: it stands in front.
ON_TOP = [('bottle', (866, 512, 891, 589)), ('glass', (762, 534, 785, 580))]


def main():
    src = np.asarray(Image.open(SOURCE).convert('RGB')).astype(int)
    wall = np.asarray(Image.open(WALL).convert('RGB')).astype(int)
    lum = 0.3 * src[..., 0] + 0.59 * src[..., 1] + 0.11 * src[..., 2]
    x0, y0, x1, y1 = TOP
    H, W = src.shape[:2]

    # The cloth's local median, twice, so the objects drop out of it.
    obj = np.zeros((H, W), bool)
    obj[y0:y1, x0:x1] = lum[y0:y1, x0:x1] < 120
    cloth = np.zeros((H, W, 3))
    for _ in range(2):
        for y in range(y0, y1):
            for x in range(x0, x1):
                ys = slice(max(y0, y - 3), min(y1, y + 4)); xs = slice(max(x0, x - 16), min(x1, x + 17))
                ok = ~obj[ys, xs] & (lum[ys, xs] > 120)
                cloth[y, x] = np.median(src[ys, xs][ok], axis=0) if ok.sum() > 5 else cloth[y, x - 1]
        obj[y0:y1, x0:x1] = np.abs(src[y0:y1, x0:x1] - cloth[y0:y1, x0:x1]).sum(2) > CLOTH
    obj[:BACK] = np.abs(src[:BACK] - wall[:BACK]).sum(2) > 60

    def lift(box):
        bx0, by0, bx1, by1 = box
        m = ndi.binary_fill_holes(ndi.binary_closing(obj[by0:by1, bx0:bx1], iterations=1))
        return m, src[by0:by1, bx0:bx1].copy()

    lifted = [(name, box, off, how, *lift(box)) for name, box, off, how in MOVES]
    # A single object is its one largest piece: a neighbour's tine caught in its box stays where it was.
    for k, (name, box, off, how, m, pix) in enumerate(lifted):
        if name in SINGLE:
            lab, n = ndi.label(m)
            if n > 1:
                m = lab == 1 + int(np.argmax(ndi.sum(m, lab, range(1, n + 1))))
                lifted[k] = (name, box, off, how, m, pix)
    kept = [(name, box, *lift(box)) for name, box in ON_TOP]

    out = src.copy()
    gone = np.zeros((H, W), bool)
    for _, (bx0, by0, bx1, by1), _, _, m, _ in lifted:
        gone[by0:by1, bx0:bx1] |= ndi.binary_dilation(m, iterations=1)
    clean = ~ndi.binary_dilation(obj | gone, iterations=2)
    for y, x in zip(*np.nonzero(gone)):
        if y < BACK:
            out[y, x] = wall[y, x]
            continue
        for step in (29, -29, 58, -58, 87, -87, 116, -116):
            sx = x + step
            if x0 <= sx < x1 and clean[y, sx]:
                out[y, x] = np.clip(cloth[y, x] + src[y, sx] - cloth[y, sx], 0, 255)
                break
        else:
            out[y, x] = cloth[y, x]

    for name, (bx0, by0, bx1, by1), (dx, dy), how, m, pix in lifted:
        if how == 'mirror':
            m = m[:, ::-1]; pix = pix[:, ::-1]
        if how == 'turn':
            m = np.rot90(m, 1); pix = np.rot90(pix, 1)
            rows = range(0, m.shape[0] - 1, 2)
            pix = np.array([np.where(m[r][:, None], pix[r], pix[r + 1]) for r in rows])
            m = np.array([m[r] | m[r + 1] for r in rows])
        ty, tx = by0 + dy, bx0 + dx
        h, w = m.shape
        region = out[ty:ty + h, tx:tx + w]
        region[m] = pix[m]
    for name, (bx0, by0, bx1, by1), m, pix in kept:
        region = out[by0:by1, bx0:bx1]
        region[m] = pix[m]

    Image.fromarray(out.astype(np.uint8)).save(OUT)

    plate = np.asarray(Image.open(PLATE).convert('RGB')).astype(int)
    olum = 0.3 * out[..., 0] + 0.59 * out[..., 1] + 0.11 * out[..., 2]
    ax0, ay0, ax1, ay1 = AREA
    cloth_shape = np.zeros((H, W), bool)
    cloth_shape[BACK - 4:ay1, ax0:ax1] = olum[BACK - 4:ay1, ax0:ax1] > 95
    lab, n = ndi.label(cloth_shape)
    cloth_shape = lab == 1 + int(np.argmax(ndi.sum(cloth_shape, lab, range(1, n + 1))))
    cloth_shape = ndi.binary_fill_holes(ndi.binary_closing(cloth_shape, iterations=2))
    d = np.abs(plate - out).sum(2)
    standing = np.zeros((H, W), bool)
    for bx0, by0, bx1, by1 in STANDING:
        sub = ndi.binary_opening(d[by0:by1, bx0:bx1] > 60, iterations=1) | (d[by0:by1, bx0:bx1] > 120)
        if (bx0, by0, bx1, by1) == BOTTLE:
            for ry0, ry1, rx0, rx1 in BOTTLE_SHAPE:
                sub[ry0 - by0:ry1 - by0, rx0 - bx0:rx1 - bx0] = True
        lab, n = ndi.label(ndi.binary_dilation(sub, iterations=1))
        keep = np.zeros_like(sub)
        for k in range(1, n + 1):
            c = lab == k
            if c[-3:].any() or c.sum() > 80:
                keep |= c & sub
        standing[by0:by1, bx0:bx1] |= ndi.binary_fill_holes(keep)
    m = cloth_shape | standing
    rgba = np.zeros((H, W, 4), np.uint8)
    rgba[..., :3] = out
    rgba[..., 3] = np.where(m, 255, 0)
    Image.fromarray(rgba).save(DINNER)
    print({'wrote': [os.path.relpath(OUT, ROOT), os.path.relpath(DINNER, ROOT)], 'pixels': int(m.sum())})


if __name__ == '__main__':
    main()
