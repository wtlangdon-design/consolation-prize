"""The town sign and the mile post, lettered (errata 347). No image operation.

The Act I review's art director found the two things in Act I that Thad reads aloud drawn with nothing on them: the
town sign on the stage road was two blank planks, and the mile post's boards carried smudges. What they say is
written (doc 05, the town sign; the claims road's mile post), so it is painted on, in a small face cut for boards
this size (the game's 5 x 7 face does not fit either board):

    the town sign   CONSOLATION / POP. 200 (struck), three more struck past reading, 2,000 / AND CLIMBING, in
                    another hand and another paint
    the mile post   THE CLAIMS 1 MI. on the board pointing up the road, fresh; TOWN 1 MI. on the board pointing
                    back, peeling

The struck numbers between the first and the last are bars of paint and nothing more: no document says what they
were. Run once; each plate is lettered from its file as it stands.

    python3 tools/art/sign-lettering.py [--out DIR]     # with --out, writes there and leaves the plates alone
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


def strike(px, x, y, w, h, colour):
    for dx in range(w):
        for dy in range(h):
            under = px[x + dx, y + dy]
            px[x + dx, y + dy] = tuple(int(0.8 * c + 0.2 * u) for c, u in zip(colour, under))


def town_sign(plate):
    px = plate.load()
    rng = random.Random(347)
    dark = (38, 22, 12)
    # The top plank: the name, large.
    name = 'CONSOLATION'
    paint(px, name, 192 + (252 - text_width(name, 5)) // 2, 392, 5, dark, rng)
    # The lower plank: the count, struck and struck again.
    x, y = 196, 447
    paint(px, 'POP.', x, y, 3, dark, rng)
    x += text_width('POP.', 3) + 9
    paint(px, '200', x, y, 3, dark, rng, wear=0.1)
    strike(px, x - 3, y + 6, text_width('200', 3) + 6, 2, (90, 30, 20))
    x += text_width('200', 3) + 9
    for width in (18, 21, 24):          # three more, struck past reading
        strike(px, x, y + 3, width, 9, (70, 44, 26))
        strike(px, x - 3, y + 6, width + 6, 3, dark)
        x += width + 6
    paint(px, '2,000', x, y, 3, dark, rng)
    # In a different hand, added later: chalk white, lower, not quite level.
    paint(px, 'AND CLIMBING', 196 + 66, 470, 3, (206, 196, 172), rng)


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
    for name, letter in (('room-01-stage-road.png', town_sign), ('room-22-claims-road.png', mile_post)):
        path = os.path.join(ROOT, 'art/backgrounds', name)
        plate = Image.open(path).convert('RGB')
        letter(plate)
        plate.save(os.path.join(out, name) if out else path)
        print('lettered', name)


if __name__ == '__main__':
    main()
