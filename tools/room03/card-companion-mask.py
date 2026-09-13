#!/usr/bin/env python3
"""
THE REMOVAL MASK FOR THE CARD CLUSTER'S PEOPLE-FREE COMPANION.

WHY A COMPANION AT ALL, after three attempts to split the master by rule. The
master cannot be decomposed into its objects by any deterministic pixel rule,
and that is not a guess -- it is measured three ways:

  slats against coat     hue 26-35 everywhere; chair back luminance 21.6 vs
                         coat 27.8; three horizontal profiles oscillating 4-43
                         against 7-40; R-B overlapping wherever they touch
  arms against tabletop  skin R-B 74.3 against wood 67.4; cream sleeve
                         luminance 90 against wood 60; the bottle, which must
                         STAY with the table, sits at luminance 46 against the
                         wood's 50
  everything             one warm light, one value family, by design

So the man-on-his-chair split passes its recomposition gate and still leaves
the four men's FOREARMS, HANDS AND CARDS in the table layer -- which is exactly
the set of pixels sec.15 says has to animate.

ERRATA 53 CONDITION 2 IS THE PROJECT'S OWN ANSWER and `openai-image.mjs` quotes
it: "ask the generator for the same scene without the object, quantise both, and
the layer is a difference between two images." Sec.14 authorises it in as many
words -- "if a hidden area cannot be reconstructed cleanly, use an authorised
refinement operation on the NEW cluster rather than importing incompatible old
scenery".

WHAT THE MASK PROTECTS, AND WHY THAT IS THE WHOLE DESIGN. Alpha 0 is editable.
The centre of the tabletop is held back -- unmasked -- so the bottle, the cups,
the chips and the ABANDONED FIFTH-PLACE HAND come back byte-identical and the
table's own perspective is not re-invented but completed from what the endpoint
can still see. Everything else is free: the four men, their chairs, their arms
where they cross the rim, and the ring of tabletop under those arms.

REGISTRATION IS MEASURED AFTERWARDS, on the protected core, and a drift there
is a STOP rather than something to work around.

    python3 tools/room03/card-companion-mask.py [--preview]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'art/staging/room-03/clean-card-01/source.png'
OUT = ROOT / 'art/staging/room-03/clean-card-01'

TABLE = dict(cx=718, cy=496, a=436, b=168)
KEEP = 0.60                      # the protected core, as a fraction of the ellipse
HAND = (612, 540, 878, 636)      # the abandoned fifth-place hand, protected outright
BOTTLE = (766, 300, 844, 462)    # it stands above the core's band, so it is named
# AND THE TWO NEAR MEN'S HANDS ARE CUT BACK OUT OF THE CORE. The first mask
# protected the tabletop core at 0.74 and the near-left man's fan of cards sits
# inside it -- so he would have come back holding them in the people-free
# companion, the difference would not have marked his hand as his, and the one
# thing this operation exists to recover would have been the one thing it lost.
FREE = [(374, 396, 536, 552), (1004, 396, 1166, 552)]


def main():
    rgb = np.asarray(Image.open(SRC).convert('RGB')).astype(np.uint8)
    h, w = rgb.shape[:2]
    keep = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(keep)
    cx, cy, a, b = TABLE['cx'], TABLE['cy'], TABLE['a'], TABLE['b']
    d.ellipse([cx - a * KEEP, cy - b * KEEP, cx + a * KEEP, cy + b * KEEP], fill=255)
    d.rectangle(list(HAND), fill=255)
    d.rectangle(list(BOTTLE), fill=255)
    for box in FREE:
        d.rectangle(list(box), fill=0)
    protect = np.asarray(keep) > 0

    alpha = np.where(protect, 255, 0).astype(np.uint8)
    mask = np.zeros((h, w, 4), np.uint8)
    mask[:, :, :3] = rgb
    mask[:, :, 3] = alpha
    free = float((alpha == 0).mean())

    if '--preview' in sys.argv:
        lit = np.clip((rgb.astype(float) / 255) ** 0.5 * 255, 0, 255)
        lit[~protect] = lit[~protect] * 0.42 + np.array([255, 70, 70]) * 0.58
        out = ROOT / 'proofs/room-03/clean-sheet/card-companion-mask.png'
        Image.fromarray(lit.astype('uint8')).save(out)
        print(f'wrote {out}   RED = free to repaint, clear = held back exactly')
        print(f'  free {free * 100:.1f}% of the canvas')
        print(f'  protected: ellipse {KEEP} of the table, the bottle {BOTTLE}, '
              f'the abandoned hand {HAND}')
        print(f'  freed back out of it: the two near hands {FREE}')
        return

    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / 'companion-mask.png'
    Image.fromarray(mask).save(path)
    print(f'wrote {path}  free {free * 100:.1f}%')


if __name__ == '__main__':
    main()
