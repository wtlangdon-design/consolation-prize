"""The empty storefront's door on the Lane (errata 183): Tyler, 2026-11-08, "Door beside the window" -- the Lane's
boarded storefront stays boarded, so doc 97's lines about it stay true, and a door is drawn beside its window. No
image operation here.

room-40 operation 3 (reference/room-40/prompts/lane-door-01.txt) edited a close-up of the Lane's plate (CROP, at
1.796x) under a mask over the right-hand part of the storefront's front, putting a plain shop door there and narrowing
the boarded window beside it. Only BOX -- the door, its frame, its step and the window's new right edge -- is taken
back down to plate pixels and pasted into art/backgrounds/room-44-the-lane.png.

Usage: python3 tools/art/room40-lane-door.py [--write]
"""
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STAGE = os.path.join(ROOT, 'art/staging/room-40/lane-door')
PLATE = os.path.join(ROOT, 'art/backgrounds/room-44-the-lane.png')
CROP = (1065, 150, 855, 570)
BOX = (1630, 330, 1748, 632)        # the door, its frame and step, and the window's new right edge; the mud stays the plate's


def main(write):
    x, y, w, h = CROP
    edit = Image.open(os.path.join(STAGE, 'source.png')).convert('RGB').resize((w, h), Image.BOX)
    before = os.path.join(STAGE, 'plate-before.png')
    if not os.path.exists(before):
        Image.open(PLATE).convert('RGB').save(before)
    plate = Image.open(before).convert('RGB')
    x0, y0, x1, y1 = BOX
    plate.paste(edit.crop((x0 - x, y0 - y, x1 - x, y1 - y)), (x0, y0))
    plate.save(os.path.join(STAGE, 'candidate.png'))
    if write:
        plate.save(PLATE)
        print('wrote', os.path.relpath(PLATE, ROOT))


if __name__ == '__main__':
    main('--write' in sys.argv)
