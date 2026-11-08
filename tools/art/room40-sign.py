"""THE SIGN's lettering, in the game's own face (errata 183). No image operation.

The plate's sign is blank: the generator is told to draw no letters, because it cannot spell (as Room 25's sign and
Room 42's price board, tools/art/room42-price-board.py). The words are the documents': THE SIGN's first LOOK in doc 105
("HARDWARE & SUNDRIES. The paint is good."), read from content/examine/room-40.json -- the capitals before the first
full stop -- one word to a line to fit the sign's tall face (x 1245-1395, y 305-590) at two plate pixels to a font
pixel. Gold, as the LOOK and the brief say the sign is gold-edged and freshly painted.

Writes art/props/room-40-sign.png and prints the prop's place.
"""
import json
import os
import re

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FACE = (1245, 305, 150, 285)        # the sign's face on the plate, x y w h
SCALE = 2
INK = (196, 160, 84, 255)


def words():
    examine = json.load(open(os.path.join(ROOT, 'content/examine/room-40.json')))
    look = [s for s in examine['subjects'] if s['name'] == 'THE SIGN'][0]['LOOK_AT'][0]
    name = re.match(r'([A-Z& ]+)\.', look)
    if not name:
        raise SystemExit(f'THE SIGN: no name in capitals at the start of "{look}"')
    return name.group(1).split()


def draw(line, font):
    cols = []
    for ch in line:
        g = font['glyphs'][ch]
        w = font.get('advances', {}).get(ch, font['advance']) if ch != ' ' else font['spaceAdvance']
        cols.append((g, w))
    out = np.zeros((font['height'], sum(w for _, w in cols) - 1), bool)
    x = 0
    for g, w in cols:
        for r, row in enumerate(g):
            for c, cell in enumerate(row):
                if cell == font['on'] and x + c < out.shape[1]:
                    out[r, x + c] = True
        x += w
    return out


def main():
    font = json.load(open(os.path.join(ROOT, 'art/ui/font-5x7.json')))
    lines = words()
    bits = [draw(t, font) for t in lines]
    lead = font['height'] * SCALE + 6
    w = max(b.shape[1] for b in bits) * SCALE
    h = lead * len(bits) - 6
    if w > FACE[2] or h > FACE[3]:
        raise SystemExit(f'the words ({w} x {h}) do not fit the face {FACE}')
    img = np.zeros((h, w, 4), np.uint8)
    for i, b in enumerate(bits):
        big = np.kron(b, np.ones((SCALE, SCALE), bool))
        x = (w - big.shape[1]) // 2
        img[i * lead:i * lead + big.shape[0], x:x + big.shape[1]][big] = INK
    Image.fromarray(img).save(os.path.join(ROOT, 'art/props/room-40-sign.png'))
    top = FACE[1] + (FACE[3] - h) // 2 - 40           # a little above the middle, where a sign's name sits
    print(json.dumps({'lines': lines, 'frame': [0, 0, w, h], 'x': FACE[0] + FACE[2] // 2, 'y': top + h}))


if __name__ == '__main__':
    main()
