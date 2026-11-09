"""Fiddler's Gulch's lettering, in the game's own face (reference/fiddlers-gulch/brief.md). No image operation.

The plates are generated blank, because the generator cannot spell (as Room 42's price board, tools/art/
room42-price-board.py). The words are the documents', read from the extracted examine lines:

  * THE SIGNPOST (Room 45): "FIDDLER'S GULCH 3 MI", the capitals of its first LOOK, on the plank's face in three lines,
    pale paint on the weathered board; and the 3 scratched out, as its third LOOK says ("Somebody has scratched out
    the 3 and written nothing in its place").
  * THE PROPS (Room 47): "SORRY", the last capitals of its first LOOK, carved low on the left prop; above it the
    initials and the date that LOOK names but never spells, carved too rough to read -- writing them would be
    writing (CLAUDE.md), so they are marks.
  * THE ORE CART (Room 49): "MAY", the capitals of its third LOOK, chalked on the cart's side.

Writes art/props/room-45-signpost.png, art/props/room-47-props-carving.png and art/props/room-49-cart-may.png, and
prints each prop's place for the room's annotation.
"""
import json
import os
import re

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FONT = json.load(open(os.path.join(ROOT, 'art/ui/font-5x7.json')))
SCALE = 2


def look(room, name, n):
    examine = json.load(open(os.path.join(ROOT, f'content/examine/room-{room}.json')))
    return [s for s in examine['subjects'] if s['name'] == name][0]['LOOK_AT'][n]


def bits(line):
    cols = []
    for ch in line:
        g = FONT['glyphs'][ch]
        w = FONT.get('advances', {}).get(ch, FONT['advance']) if ch != ' ' else FONT['spaceAdvance']
        cols.append((g, w))
    out = np.zeros((FONT['height'], sum(w for _, w in cols)), bool)
    x = 0
    for g, w in cols:
        for r, row in enumerate(g):
            for c, cell in enumerate(row):
                if cell == FONT['on']:
                    out[r, x + c] = True
        x += w
    return out


def lettered(lines, ink, lead=1):
    rows = [np.kron(bits(t), np.ones((SCALE, SCALE), bool)) for t in lines]
    w = max(r.shape[1] for r in rows)
    h = sum(r.shape[0] for r in rows) + lead * (len(rows) - 1)
    img = np.zeros((h, w, 4), np.uint8)
    y = 0
    for r in rows:
        x = (w - r.shape[1]) // 2
        img[y:y + r.shape[0], x:x + r.shape[1]][r] = ink
        y += r.shape[0] + lead
    return img, rows


def save(img, name, centre_x, foot_y, fit=None):
    h, w = img.shape[:2]
    if fit and (w > fit[0] or h > fit[1]):
        raise SystemExit(f'{name}: the words ({w} x {h}) do not fit {fit}')
    Image.fromarray(img).save(os.path.join(ROOT, f'art/props/{name}.png'))
    return {'sheet': f'art/props/{name}.png', 'frame': [0, 0, w, h], 'x': centre_x, 'y': foot_y}


def signpost():
    words = re.search(r"([A-Z][A-Z' ]+[A-Z]) (\d) (MI)", look(45, 'THE SIGNPOST', 0))
    if not words:
        raise SystemExit('THE SIGNPOST: no "NAME n MI" in its first LOOK')
    name, number, mi = words.groups()
    first, second = name.split(' ', 1)
    if 'scratched out the 3' not in look(45, 'THE SIGNPOST', 2):
        raise SystemExit('THE SIGNPOST: its third LOOK no longer scratches out the 3')
    img, rows = lettered([first, second, f'{number} {mi}'], (214, 198, 160, 255))
    # The 3 scratched out: hard strokes back and forth across it, two pixels thick, in a dark gouge, ragged past its
    # edges, so the figure is plainly struck through and nothing is written in its place.
    top = rows[0].shape[0] + rows[1].shape[0] + 2
    x0 = (img.shape[1] - rows[2].shape[1]) // 2
    gw = (FONT['advance'] - 1) * SCALE
    gouge = (70, 50, 32, 255)
    for k in range(4):
        y0, y1 = (top - 1, top + 14) if k % 2 == 0 else (top + 14, top - 1)
        for x in range(-2, gw + 2):
            y = round(y0 + (y1 - y0) * (x + 2) / (gw + 3)) + (k - 1)
            for dy in (0, 1):
                if 0 <= y + dy < img.shape[0] and 0 <= x0 + x < img.shape[1]:
                    img[y + dy, x0 + x] = gouge
    return save(img, 'room-45-signpost', 877 + 126 // 2, 510 + 45 - 1, fit=(126, 45))


def carving():
    if not look(47, 'THE PROPS', 0).rstrip('.').endswith('SORRY'):
        raise SystemExit('THE PROPS: its first LOOK no longer ends on SORRY')
    ink = (58, 38, 22, 255)
    img, rows = lettered(['SORRY'], ink)
    # The initials and the date the LOOK names, carved too rough to read: short gouges in two groups above.
    rnd = np.random.default_rng(4701)
    marks = np.zeros((26, img.shape[1], 4), np.uint8)
    for row, groups in ((2, 2), (15, 4)):
        x = 6
        for _ in range(groups):
            for dx in range(rnd.integers(3, 5)):
                h = int(rnd.integers(5, 9))
                marks[row:row + h, x + dx * 2:x + dx * 2 + 2] = ink
            x += 14
    whole = np.concatenate([marks, np.zeros((6, img.shape[1], 4), np.uint8), img])
    return save(whole, 'room-47-props-carving', 710, 590, fit=(70, 80))


def cart():
    words = re.search(r'chalked on it: ([A-Z]+)\.', look(49, 'THE ORE CART', 2))
    if not words:
        raise SystemExit('THE ORE CART: its third LOOK names no chalked word')
    img, _ = lettered([words.group(1)], (226, 222, 210, 255))
    return save(img, 'room-49-cart-may', 1040, 560, fit=(200, 120))


if __name__ == '__main__':
    print(json.dumps({'signpost': signpost(), 'carving': carving(), 'cart': cart()}, indent=1))
