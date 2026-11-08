"""The hitching horses at dawn, for Room 36 (errata 178). No image operation.

Room 36's plate is Room 2's pixels under the morning's light
(tools/art/room36-dawn.py). The horses are a sprite, not plate, so they are
relit the same way: by the ratio of the dawn plate to the night plate over the
ground the group stands on (its drawn rect in the near mud, pixels bright
enough to divide by), one median per channel. The night sheet is already on
the cast's grid (tools/art/one-level.py), and a per-channel multiply keeps it there.

usage: python3 tools/art/hitching-post-dawn.py
"""
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
NIGHT = 'art/backgrounds/room-02-main-street.png'
DAWN = 'art/backgrounds/room-36-main-street-dawn.png'
SHEET = 'art/actors/room-02-horses.png'
OUT = 'art/actors/room-36-horses-dawn.png'
GROUND = (slice(586, 858), slice(1333, 1757))   # the group's drawn rect at 1545,850


def main():
    night = np.asarray(Image.open(os.path.join(ROOT, NIGHT)).convert('RGB')).astype(float)[GROUND].reshape(-1, 3)
    dawn = np.asarray(Image.open(os.path.join(ROOT, DAWN)).convert('RGB')).astype(float)[GROUND].reshape(-1, 3)
    lit = night.sum(1) > 60
    ratio = np.median(dawn[lit] / np.maximum(night[lit], 1), axis=0)
    sheet = np.asarray(Image.open(os.path.join(ROOT, SHEET)).convert('RGBA')).astype(float)
    out = sheet.copy()
    out[..., :3] = np.clip(sheet[..., :3] * ratio, 0, 255)
    Image.fromarray(out.round().astype(np.uint8), 'RGBA').save(os.path.join(ROOT, OUT))
    print(OUT, 'ratio', ratio.round(3))


if __name__ == '__main__':
    main()
