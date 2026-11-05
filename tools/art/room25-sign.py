"""THE SIGN: NO COLOR YET's lettering, in the game's own face. No image operation.

The plate's board is blank: the generator is told to draw no letters, because
it cannot spell. The words are the documents': the sign's name in doc 05 / doc
54 ("THE SIGN: NO COLOR YET") and its name line (doc 54: "doc 10's sign reads
N. PRATT"). Drawn in art/ui/font-5x7.json, the shipping bitmap face (errata
62), two plate pixels to a font pixel, ruled in three lines to fit the board
("the letters are ruled", doc 54). Pale paint, as his whitewashed stones, so it
reads at dusk; the YET is the freshest and brightest: "The YET has been
repainted more times than the rest" (doc 05), "The YET gleamed" (doc 49).

Writes art/props/room-25-sign.png and prints the prop's place.
"""
import json
import os
import re

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BOARD = (745, 186, 144, 92)     # the board on the plate, x y w h
SCALE = 2
INK = (118, 114, 118, 255)
FRESH = (176, 172, 164, 255)


def texts():
    examine = json.load(open(os.path.join(ROOT, 'content/examine/room-25.json')))
    name = [s['name'] for s in examine['subjects'] if s['name'].startswith('THE SIGN: ')][0]
    words = name.split(': ', 1)[1]
    d54 = open(os.path.join(ROOT, 'docs/54-batch-c.md')).read()
    who = re.search(r"doc 10's sign reads ([A-Z. ]+[A-Z])\.", d54).group(1)
    return who, words


def draw(line, font):
    adv, cols = font['advance'], []
    for ch in line:
        g = font['glyphs'][ch]
        w = font.get('advances', {}).get(ch, adv) if ch != ' ' else font['spaceAdvance']
        cols.append((g, w))
    width = sum(w for _, w in cols)
    out = np.zeros((font['height'], width), bool)
    x = 0
    for g, w in cols:
        for r, row in enumerate(g):
            for c, cell in enumerate(row):
                if cell == font['on']:
                    out[r, x + c] = True
        x += w
    return out


def main():
    font = json.load(open(os.path.join(ROOT, 'art/ui/font-5x7.json')))
    who, words = texts()
    head, tail = words.rsplit(' ', 1)
    lines = [(who, INK), (head, INK), (tail, FRESH)]
    bits = [(draw(t, font), c) for t, c in lines]
    lead = font['height'] * SCALE + 6
    w = max(b.shape[1] for b, _ in bits) * SCALE
    h = lead * len(bits) - 6
    img = np.zeros((h, w, 4), np.uint8)
    for i, (b, c) in enumerate(bits):
        big = np.kron(b, np.ones((SCALE, SCALE), bool))
        x = (w - big.shape[1]) // 2
        y = i * lead
        img[y:y + big.shape[0], x:x + big.shape[1]][big] = c
    Image.fromarray(img).save(os.path.join(ROOT, 'art/props/room-25-sign.png'))
    bx, by, bw, bh = BOARD
    base = by + (bh + h) // 2
    print(json.dumps({'lines': [t for t, _ in lines], 'frame': [0, 0, w, h], 'x': bx + bw // 2, 'y': base}))


if __name__ == '__main__':
    main()
