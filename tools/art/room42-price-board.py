"""THE PRICE BOARD's lettering, in the game's own face (errata 183). No image operation.

The plate's board is blank: the generator is told to draw no letters, because it cannot spell (as Room 25's sign,
tools/art/room25-sign.py). The words are the documents': THE PRICE BOARD's first LOOK in doc 105, "SHAVE 2 BITS.
TOOTH 4 BITS. LIMB $1.", read from content/examine/room-42.json, each price on two lines (the trade, then its
price) to fit the board's inner panel (x 495-608, y 108-278) at two plate pixels to a font pixel. Pale paint on the
dark board, dimmed to the lamp's reach at the left wall. LIMB ends above the scratch the plate paints low on the
board, which the board's third LOOK is about ("Someone has scratched a name under LIMB").

Writes art/props/room-42-price-board.png and prints the prop's place.
"""
import json
import os
import re

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PANEL = (495, 108, 113, 170)        # the board's inner panel on the plate, x y w h
TOP = 116                           # the first line's top, clear of the frame
SCALE = 2
INK = (150, 140, 118, 255)


def words():
    examine = json.load(open(os.path.join(ROOT, 'content/examine/room-42.json')))
    look = [s for s in examine['subjects'] if s['name'] == 'THE PRICE BOARD'][0]['LOOK_AT'][0]
    prices = re.findall(r'([A-Z]+) ([0-9$]+(?: BITS)?)\.', look)
    if len(prices) != 3:
        raise SystemExit(f'THE PRICE BOARD: expected three prices in "{look}"')
    return [part for pair in prices for part in pair]


def draw(line, font):
    cols = []
    for ch in line:
        g = font['glyphs'][ch]
        w = font.get('advances', {}).get(ch, font['advance']) if ch != ' ' else font['spaceAdvance']
        cols.append((g, w))
    out = np.zeros((font['height'], sum(w for _, w in cols)), bool)
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
    lines = words()
    bits = [draw(t, font) for t in lines]
    lead = font['height'] * SCALE + 5
    w = max(b.shape[1] for b in bits) * SCALE
    h = lead * len(bits) - 5
    if w > PANEL[2] or TOP + h > PANEL[1] + PANEL[3]:
        raise SystemExit(f'the words ({w} x {h}) do not fit the panel {PANEL}')
    img = np.zeros((h, w, 4), np.uint8)
    for i, b in enumerate(bits):
        big = np.kron(b, np.ones((SCALE, SCALE), bool))
        img[i * lead:i * lead + big.shape[0], (w - big.shape[1]) // 2:(w - big.shape[1]) // 2 + big.shape[1]][big] = INK
    Image.fromarray(img).save(os.path.join(ROOT, 'art/props/room-42-price-board.png'))
    print(json.dumps({'lines': lines, 'frame': [0, 0, w, h], 'x': PANEL[0] + PANEL[2] // 2, 'y': TOP + h}))


if __name__ == '__main__':
    main()
