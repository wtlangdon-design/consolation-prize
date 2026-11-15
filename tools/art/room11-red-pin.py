"""The Colonel's map wall: the one red pin, moved from the map to the frame (errata 341). No image operation.

Errata 340 keeps Claim One back until Sump reads it out, and the map wall's line before the filing says there is one
red pin "and it isn't in the map. It's stuck in the frame." The plate drew it in the middle of the map. This lifts the
pin's head off the map, lays the map's own paper from 14 px to its left over where it was, and sets the head on the
frame's right rail. Run once: it refuses if the pin is no longer on the map.
"""
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PLATE = os.path.join(ROOT, 'art/backgrounds/room-11-fanshawe-office.png')


def main():
    plate = Image.open(PLATE).convert('RGB')
    px = plate.load()
    pin = {(x, y): px[x, y] for x in range(724, 738) for y in range(181, 191) if px[x, y][0] >= 0x83 and px[x, y][1] < 0x50}
    assert len(pin) >= 20, 'the red pin is not on the map: this has been run already'
    for y in range(180, 193):
        for x in range(724, 738):
            px[x, y] = px[x - 14, y + 1]
    for (x, y), colour in pin.items():
        px[871 + x - 730, 236 + y - 185] = colour
    for dx in (-1, 0, 1):
        r, g, b = px[871 + dx, 241]
        px[871 + dx, 241] = (r // 2, g // 2, b // 2)
    plate.save(PLATE)
    print('moved', len(pin), 'px of pin to the frame')


if __name__ == '__main__':
    main()
