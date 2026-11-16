"""The claims road's mile post, lettered (errata 347). No image operation.

The Act I review's art director found the things Thad reads aloud in Act I drawn with nothing on them. The mile
post's two boards carried smudges; what they say is written (the claims road's mile post, LOOK), so it is painted on,
in a small face cut for boards this size (the game's 5 x 7 face does not fit them):

    THE CLAIMS 1 MI. on the board pointing up the road, fresh; TOWN 1 MI. on the board pointing back, peeling.

The town sign on the stage road was drafted the same way and Tyler kept it as drawn (2026-11-15: "Keep the original
Consolation sign"): the opening plate is not touched. Run once.

    python3 tools/art/sign-lettering.py [--out DIR]     # with --out, writes there and leaves the plate alone
"""
import os
import random
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GLYPHS = {
    'A': '010101111101101', 'B': '110101110101110', 'C': '011100100100011', 'D': '110101101101110',
    'E': '111100110100111', 'G': '011100101101011', 'H': '101101111101101', 'I': '111010010010111',
    'L': '100100100100111', 'M': '101111111101101', 'N': '110101101101101', 'O': '010101101101010',
    'P': '110101110100100', 'S': '011100010001110', 'T': '111010010010010', 'W': '101101111111101',
    '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '.': '000000000000010',
    ',': '000000000010100', ' ': '000000000000000',
}


def text_width(text, block):
    return (len(text) * 4 - 1) * block


def paint(px, text, x, y, block, colour, rng, wear=0.0, jitter=10):
    for index, char in enumerate(text):
        bits = GLYPHS[char]
        for n, bit in enumerate(bits):
            if bit != '1' or rng.random() < wear:
                continue
            gx, gy = x + (index * 4 + n % 3) * block, y + (n // 3) * block
            shade = rng.randint(-jitter, jitter)
            for dx in range(block):
                for dy in range(block):
                    under = px[gx + dx, gy + dy]
                    # Paint on wood: mostly the paint, a little of the board showing through.
                    px[gx + dx, gy + dy] = tuple(max(0, min(255, int(0.82 * (c + shade) + 0.18 * u))) for c, u in zip(colour, under))


def mile_post(plate):
    px = plate.load()
    rng = random.Random(348)
    fresh, old = (176, 180, 196), (96, 100, 116)
    paint(px, 'THE CLAIMS', 522, 417, 2, fresh, rng, jitter=8)
    paint(px, '1 MI.', 522, 433, 2, fresh, rng, jitter=8)
    paint(px, 'TOWN', 436, 484, 2, old, rng, wear=0.1, jitter=8)
    paint(px, '1 MI.', 436, 500, 2, old, rng, wear=0.1, jitter=8)


def main():
    out = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else None
    for name, letter in (('room-22-claims-road.png', mile_post),):
        path = os.path.join(ROOT, 'art/backgrounds', name)
        plate = Image.open(path).convert('RGB')
        letter(plate)
        plate.save(os.path.join(out, name) if out else path)
        print('lettered', name)


if __name__ == '__main__':
    main()
