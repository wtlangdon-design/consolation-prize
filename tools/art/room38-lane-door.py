"""The photographer's door on the Lane (errata 183): the brief puts Room 38's way in at "the door beside the
photographer's window", and the Lane's plate painted the front as one wide two-part window with no door. No image
operation here.

room-38 operation 4 (reference/room-38/prompts/lane-door-01.txt) edited a close-up of the Lane's plate (CROP, at
1.796x) under a mask over the window's narrow right-hand pane, turning it into a glazed shop door to the ground with
its lamp still behind the glass and a step on the mud. The edit re-laid the whole close-up, so only BOX -- the door,
its frame and its step -- is taken back down to plate pixels and pasted into art/backgrounds/room-44-the-lane.png;
the portrait window and everything else are the plate's own pixels.

Usage: python3 tools/art/room38-lane-door.py [--write]   (without --write, writes the candidate beside the source)
"""
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STAGE = os.path.join(ROOT, 'art/staging/room-38/lane-door')
PLATE = os.path.join(ROOT, 'art/backgrounds/room-44-the-lane.png')
CROP = (250, 150, 855, 570)
BOX = (700, 340, 812, 640)              # the door, its frame and its step; the mud below stays the plate's


def main(write):
    x, y, w, h = CROP
    edit = Image.open(os.path.join(STAGE, 'source.png')).convert('RGB').resize((w, h), Image.BOX)
    plate = Image.open(PLATE).convert('RGB')
    if not os.path.exists(os.path.join(STAGE, 'plate-before.png')):
        plate.save(os.path.join(STAGE, 'plate-before.png'))
    else:
        plate = Image.open(os.path.join(STAGE, 'plate-before.png')).convert('RGB')
    x0, y0, x1, y1 = BOX
    plate.paste(edit.crop((x0 - x, y0 - y, x1 - x, y1 - y)), (x0, y0))
    plate.save(os.path.join(STAGE, 'candidate.png'))
    if write:
        plate.save(PLATE)
        print('wrote', os.path.relpath(PLATE, ROOT))
    print(os.path.relpath(os.path.join(STAGE, 'candidate.png'), ROOT))


if __name__ == '__main__':
    main('--write' in sys.argv)
