#!/usr/bin/env python3
"""STEP B OF THE ROOM 3 RECOMPOSITION: put the man back, and nothing else.

Tyler, 2026-09-12: "A moved person must consist of the person, their clothing /
accessories, and only legitimately local effects such as a newly authored
contact shadow. ZERO pixels from the person's previous environment may travel
with the person."

THE EXTRACTION IS A MATTE AGAINST THE ROOM, NOT A POLYGON. Step A rebuilt the
bar and the floor he was standing in front of, so for the first time there is a
picture of what is BEHIND him. Subtracting it is what a tight silhouette
actually is: every pixel that differs from the reconstructed room is him, every
pixel that matches it is the room, and no authored outline has to guess where
his coat ends. The authored polygon survives only as a bound -- nothing outside
it can be him -- which is the one thing it is reliable for.

WHAT THAT FIXES. The 82-row translation carried a rectangle of his old
surroundings with him: bar panel, plinth, kick-board and floor, feathered around
his whole outline, because the outline was cut loose on purpose. That halo is
the defect the owner rejected, and a matte cannot produce it: a pixel of bar
that the reconstruction also draws as bar subtracts to zero and is not carried.

CONTACT IS AUTHORED HERE, not inherited. Two soft ellipses under the boots at
the position his grounding was accepted at -- the same two the grounding used,
because that grounding is owner-accepted and this pass must not move him.
"""
import hashlib, json, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter, binary_fill_holes, label

EMPTY = 'art/staging/room-03/rebuild-04/plate-room-03-empty.png'
PRE   = 'art/staging/room-03/rebuild-01/plate-room-03-rebuilt.png'
OUT   = 'art/staging/room-03/rebuild-04/'
SHIFT = 82

BOUND = [
    (1682, 220), (1688, 210), (1700, 203), (1722, 199), (1748, 202), (1762, 210),
    (1772, 222), (1774, 233), (1762, 241), (1754, 250), (1754, 276), (1772, 287),
    (1797, 304), (1807, 340), (1812, 400), (1810, 472), (1802, 532), (1797, 580),
    (1780, 602), (1777, 650), (1793, 672), (1798, 690), (1792, 704), (1745, 709),
    (1712, 703), (1707, 690), (1702, 702), (1660, 711), (1638, 708), (1633, 694),
    (1646, 678), (1650, 650), (1646, 600), (1628, 584), (1621, 520), (1619, 430),
    (1626, 378), (1638, 330), (1653, 300), (1670, 287), (1686, 276), (1684, 248),
]
ERODE  = 5.0              # inside this, certainly him
DILATE = 2.0              # outside this, certainly not
T_EDGE = 30.0             # in between, he differs from the rebuilt room by this
BOOTS = [((1675, 700 + SHIFT), 40, 9), ((1748, 695 + SHIFT), 46, 10)]
SHADE = 0.45


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def main():
    os.makedirs(OUT, exist_ok=True)
    B = np.asarray(Image.open(EMPTY).convert('RGB')).astype(np.float32)
    P = np.asarray(Image.open(PRE).convert('RGB')).astype(np.float32)
    H, W, _ = P.shape

    m = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m).polygon(BOUND, fill=255)
    # THE EDGE IS DECIDED AGAINST THE RECONSTRUCTED ROOM, inside a band around
    # the authored outline. Two things were tried first and each failed in a way
    # worth keeping:
    #
    #   a pure difference matte  held his face, his shirt and his mug and DROPPED
    #     most of the man, because his coat is the same brown as the bar to
    #     within a few levels. A figure has to differ from its background for
    #     that to work and this one does not.
    #   a per-row edge snap      wandered onto the bottles behind his hat and the
    #     panel beside his arm, because the strongest step near his outline is
    #     not always his outline.
    #
    # So the authored polygon supplies what it is reliable for -- a region that
    # certainly contains him and a region that certainly does not -- and only the
    # few pixels between the two are decided, by asking whether the plate there
    # differs from the room step A reconstructed behind him. Inside the eroded
    # core nothing can be dropped; outside the dilated bound nothing can be
    # carried; and the boundary itself lands on his coat rather than a polygon
    # authored around it.
    poly = (np.asarray(m) > 127).astype(np.float32)
    core = gaussian_filter(poly, ERODE) > 0.80
    outer = gaussian_filter(poly, DILATE) > 0.12
    d = np.abs(P - B).max(2)
    alpha = core | (outer & (d > T_EDGE))
    alpha = binary_fill_holes(alpha)
    lab, _ = label(alpha)
    sizes = np.bincount(lab.ravel()); sizes[0] = 0
    alpha = np.isin(lab, np.nonzero(sizes >= 400)[0]).astype(np.float32)
    alpha = np.clip(gaussian_filter(alpha, 0.6), 0, 1)

    man = np.zeros_like(P); man[SHIFT:] = P[:-SHIFT]
    a = np.zeros_like(alpha); a[SHIFT:] = alpha[:-SHIFT]

    out = B * (1 - a[:, :, None]) + man * a[:, :, None]

    yy, xx = np.mgrid[0:H, 0:W]
    cs = np.zeros((H, W), np.float32)
    for (cx, cy), rx, ry in BOOTS:
        q = ((xx - cx) / float(rx)) ** 2 + ((yy - cy + 3) / float(ry)) ** 2
        cs = np.maximum(cs, np.clip(1.0 - q, 0, 1))
    cs = gaussian_filter(cs, 2.0) * SHADE * (1 - a)
    out *= (1 - cs[:, :, None])

    img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
    dst = OUT + 'plate-room-03-recomposed.png'

    if '--alpha' in sys.argv:
        # THE EXTRACTION, LOOKED AT BEFORE IT IS USED. His pixels on a flat
        # field, and the matte itself, both at gameplay scale.
        box = (1600, 180, 1830, 800)
        cut = np.zeros_like(P); cut[:] = np.array([40, 46, 60])
        cut = cut * (1 - alpha[:, :, None]) + P * alpha[:, :, None]
        s1 = Image.fromarray(np.clip(cut, 0, 255).astype(np.uint8)).crop(box)
        s2 = Image.fromarray((np.clip(alpha, 0, 1) * 255).astype(np.uint8)).crop(box).convert('RGB')
        o = Image.new('RGB', (s1.width * 2 + 8, s1.height), (16, 14, 12))
        o.paste(s1, (0, 0)); o.paste(s2, (s1.width + 8, 0))
        o.save('/tmp/alpha.png'); print('wrote /tmp/alpha.png  alpha px %d' % (alpha > 0.5).sum())
        return

    img.save(dst)
    rec = {
        'schema': 1,
        'note': 'The foreground bar patron matted against the reconstructed empty room and '
                'composited back 82 rows lower, with authored contact shadows. No pixel of '
                'his old surroundings travels with him. No image operation.',
        'background': EMPTY, 'backgroundSha256': sha(EMPTY),
        'actorSource': PRE, 'actorSourceSha256': sha(PRE),
        'shiftRows': SHIFT, 'silhouette': {'erode': ERODE, 'dilate': DILATE, 'edgeThreshold': T_EDGE,
                                           'authoredPoints': len(BOUND)},
        'contactShadows': [[list(c), rx, ry] for c, rx, ry in BOOTS],
        'actorPixels': int((alpha > 0.5).sum()),
        'out': dst,
    }
    rec['outSha256'] = sha(dst)
    json.dump(rec, open(OUT + 'recompose.json', 'w'), indent=1)
    print(json.dumps({k: v for k, v in rec.items() if k != 'note'}, indent=1))


main()
