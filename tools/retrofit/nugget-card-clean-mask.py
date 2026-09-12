#!/usr/bin/env python3
"""
THE MASK FOR OPERATION 49: the four card players and their four chairs, and
nothing else.

WHY NOT MASK THE WHOLE CARD WINDOW. Tyler's §4: "GEOMETRY IS FROZEN ...
Reconstruct ONLY the pixels exposed by removing the four players/chairs." A
window-wide mask lets the endpoint redraw the accepted table, and the accepted
table is the one thing in this operation that must come back unchanged. Masking
only the men leaves the table's rim, apron, legs, cards and the abandoned
fifth-place hand VISIBLE in the reference, so the endpoint is completing a
curve it can see rather than inventing one it was described.

WHAT IS DELIBERATELY LEFT UNMASKED INSIDE THE GROUP. The empty fifth chair,
front centre. It is not a runtime element -- it is the fifth-place gag and it
stays in the environment -- so the mask keeps clear of x 880-990 below y 435.

The boxes are the room's own declared population where it has them, widened to
take each man's chair and his contact shadow. Alpha 0 is editable; that is the
convention every mask in this project already uses, and cluster-card-01's own
free window is 66.3% alpha-0 by the same rule.

    python3 tools/retrofit/nugget-card-clean-mask.py [--preview]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, gaussian_filter

ROOT = Path(__file__).resolve().parents[2]
PLATE = ROOT / 'art/staging/room-03/rebuild-04/plate-room-03-recomposed.png'
OUT = ROOT / 'art/staging/room-03/card-clean-01'

# The card cluster's own framing, so the round trip is the one already written
# down in cluster-sources.json: canvas (cx, cy) is plate (655 + cx//2, 110 + cy//2).
CROP = (655, 110, 1167, 622)
SCALE = 2

# Plate coordinates. Each man, his chair and his contact shadow.
#
# THE FAR PAIR STOP AT THE TABLE'S FAR RIM PLUS THEIR HANDS. card_2 and card_3
# sit BEHIND the table, so everything of them below the rim is already hidden by
# it -- freeing down to their chair height would hand the endpoint the whole
# tabletop for nothing. They are cut at y 405, which takes the held cards and
# the forearms resting on the surface and leaves the rest of the surface alone.
#
# The near pair's left and right edges are pulled in off the piano stool
# (x <= 715) and off the far side of the stove, so neither is freed by accident.
FIGURES = {
    'card_1': (712, 285, 890, 565),
    'card_2': (788, 238, 918, 405),
    'card_3': (928, 242, 1068, 405),
    'card_4': (985, 285, 1155, 565),
}
# TWO THINGS INSIDE THE GROUP THAT ARE NOT RUNTIME AND MUST SURVIVE VERBATIM.
# The empty fifth chair is the gag; the hand lying face-up in front of it is the
# player who is not there. Tyler's §4 names both, and an unmasked rect is the
# only way to preserve a thing EXACTLY rather than ask for it back.
FIFTH_CHAIR = (876, 430, 994, 624)
# MEASURED, NOT PLACED BY EYE. The two face-up cards lie at x 864-890, y
# 393-406; a first guess put this rect 50px right of them and the preview
# caught it, which is why the preview exists.
ABANDONED_HAND = (858, 388, 896, 410)
DILATE = 4


def build():
    x0, y0, x1, y1 = CROP
    w, h = (x1 - x0) * SCALE, (y1 - y0) * SCALE
    free = np.zeros((h, w), dtype=bool)
    for (fx0, fy0, fx1, fy1) in FIGURES.values():
        free[(fy0 - y0) * SCALE:(fy1 - y0) * SCALE,
             (fx0 - x0) * SCALE:(fx1 - x0) * SCALE] = True
    free = binary_dilation(free, np.ones((DILATE * 2 + 1, DILATE * 2 + 1)))
    # AND THE TWO KEEPS ARE PUT BACK AFTER THE DILATION rather than before it,
    # or the dilation would eat back into the very things they protect.
    for (cx0, cy0, cx1, cy1) in (FIFTH_CHAIR, ABANDONED_HAND):
        free[(cy0 - y0) * SCALE:(cy1 - y0) * SCALE,
             (cx0 - x0) * SCALE:(cx1 - x0) * SCALE] = False
    return free, (w, h)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    free, (w, h) = build()
    x0, y0, x1, y1 = CROP

    source = Image.open(PLATE).convert('RGB').crop(CROP).resize((w, h), Image.LANCZOS)
    source.save(OUT / 'source-canvas.png')

    mask = np.zeros((h, w, 4), dtype='uint8')
    mask[:, :, :3] = 255
    mask[:, :, 3] = np.where(free, 0, 255)
    Image.fromarray(mask).save(OUT / 'edit-mask.png')

    print(f'canvas {w}x{h}  free {free.mean() * 100:.1f}%  kept {(1 - free.mean()) * 100:.1f}%')
    print(f'round trip: canvas (cx, cy) is plate ({x0} + cx//{SCALE}, {y0} + cy//{SCALE})')

    if '--preview' in sys.argv:
        a = np.asarray(source).astype(float)
        lit = np.clip((a / 255.0) ** 0.38 * 255, 0, 255)
        edge = binary_dilation(free, np.ones((5, 5))) & ~free
        tint = lit.copy()
        tint[free] = tint[free] * 0.45 + np.array([255, 60, 60]) * 0.55
        tint[edge] = np.array([90, 230, 255])
        Image.fromarray(tint.astype('uint8')).save(OUT / 'mask-preview.png')
        print(f'preview {OUT / "mask-preview.png"}')


if __name__ == '__main__':
    main()
