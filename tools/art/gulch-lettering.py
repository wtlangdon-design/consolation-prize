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
  * THE GROG TENT (Room 51): "GROG", the sign its first LOOK reads, painted on the board over the flap.
  * THE TENTS (Room 51): "KNOCK", the sign its second LOOK reads, on the board hung on the guyed tent.
  * THE PLANK (Room 52): "GOLD ON THE PLANK", the plate its second LOOK reads, stamped on the brass in two lines.
  * THE BARRELS (Room 52): "WHISKEY" on the left and "FLOUR" on the right, as its second LOOK reads them, stencilled.
  * THE BOTTLES (Room 52): the prices its third LOOK says are chalked on the shelf, as rough chalk marks too small to
    read -- writing figures would be writing (CLAUDE.md). Its second LOOK's COGNAC is not lettered: in the shipping
    face, at its own size, the word is wider than any label on the shelf, and no label there could be read anyway.
  * THE NOTICE (Room 51): "CLAIM JUMPERS WILL BE SPOKEN TO.", the words of its first LOOK, "Underlined twice"; and
    under them "FIRMLY", its second LOOK's words, "in another hand": another ink, and a less tidy line.

Writes art/props/room-45-signpost.png, art/props/room-47-props-carving.png, art/props/room-49-cart-may.png,
art/props/room-51-grog.png, art/props/room-51-knock.png and art/props/room-51-notice.png, and prints each prop's place for the room's annotation.
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


def lettered(lines, ink, lead=1, scale=None):
    k = scale or SCALE
    rows = [np.kron(bits(t), np.ones((k, k), bool)) for t in lines]
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


def grog():
    words = re.search(r'a sign: ([A-Z]+)\.', look(51, 'THE GROG TENT', 0))
    if not words:
        raise SystemExit('THE GROG TENT: its first LOOK names no sign')
    img, _ = lettered([words.group(1)], (232, 214, 170, 255), scale=3)
    # The board over the flap: 721-832 x 94-130 on the plate.
    return save(img, 'room-51-grog', (721 + 832) // 2, 130 - (36 - img.shape[0]) // 2, fit=(105, 32))


def knock():
    words = re.search(r'sign on it: ([A-Z]+)\.', look(51, 'THE TENTS', 1))
    if not words:
        raise SystemExit('THE TENTS: its second LOOK names no sign')
    img, _ = lettered([words.group(1)], (232, 214, 170, 255))
    # The board on the guyed tent: 1239-1305 x 204-247.
    return save(img, 'room-51-knock', (1239 + 1305) // 2, 247 - (43 - img.shape[0]) // 2, fit=(62, 40))


def notice():
    words = re.search(r'stump: ([A-Z ]+\.) Underlined twice\.', look(51, 'THE NOTICE', 0))
    other = re.search(r'in another hand: ([A-Z]+)\.', look(51, 'THE NOTICE', 1))
    if not words or not other:
        raise SystemExit('THE NOTICE: its first two LOOKs no longer read the notice and FIRMLY')
    # Broken to the paper's width (45 px): one glyph is 5 px wide on a 6 px advance, at the face's own size.
    lines, line = [], ''
    for word in words.group(1).split():
        trial = f'{line} {word}'.strip()
        if len(trial) * FONT['advance'] - 1 > 44 and line:
            lines.append(line)
            line = word
        else:
            line = trial
    lines.append(line)
    ink = (52, 40, 30, 255)
    img, rows = lettered(lines, ink, scale=1)
    w = img.shape[1]
    # Underlined twice, under the whole notice, the width of its widest line.
    under = np.zeros((5, w, 4), np.uint8)
    under[1, :] = ink
    under[3, :] = ink
    # FIRMLY, in another hand: a red-brown pencil, each letter a pixel up or down from the last.
    pencil = (128, 52, 40, 255)
    fb = bits(other.group(1))
    hand = np.zeros((FONT['height'] + 2, w, 4), np.uint8)
    x0 = max(0, (w - fb.shape[1]) // 2 + 2)
    advance = FONT['advance']
    for i in range(len(other.group(1))):
        dy = 1 if i % 2 else 0
        glyph = fb[:, i * advance:(i + 1) * advance]
        for r, c in zip(*np.nonzero(glyph)):
            if x0 + i * advance + c < w:
                hand[1 + r + dy, x0 + i * advance + c] = pencil
    whole = np.concatenate([img, under, np.zeros((2, w, 4), np.uint8), hand])
    # The paper on the stump: 1330-1375 x 442-516; set from its top.
    top = 446
    return save(whole, 'room-51-notice', (1330 + 1375) // 2, top + whole.shape[0], fit=(45, 70))


def grog_plate():
    """The brass plate on the plank, drawn whole: the painted plate is 75 px between its screws and blurred letters of
    its own, and the shipping face's two lines at 2x are 104 px, so the words ran over the screws and onto the paint's
    smear (Tyler, 2026-11-09: "The writing on the plaque is really poorly put on there"). So the prop is the plate:
    a brass face sized to the words, in the painted plate's own colours (read from the plate), a rim, a lit top edge, a
    shadowed foot, a screw at each end clear of the words, and the words cut into it -- dark, with the brass catching
    light along the cut's lower edge. It covers the painted plate entirely."""
    words = re.search(r'screwed to it: ([A-Z ]+)\.', look(52, 'THE PLANK', 1))
    if not words:
        raise SystemExit('THE PLANK: its second LOOK names no plate')
    a, b = words.group(1).split(' ', 2)[:2], words.group(1).split(' ', 2)[2:]
    lines = [' '.join(a), ' '.join(b)]
    _, rows = lettered(lines, (0, 0, 0, 255), lead=2)
    rim, face, lit, foot = (47, 33, 15), (150, 104, 38), (190, 134, 52), (82, 56, 18)
    ink, catch = (58, 38, 12), (200, 150, 66)
    screw_w, gap, pad_y = 4, 5, 5
    tw = max(r.shape[1] for r in rows)
    th = sum(r.shape[0] for r in rows) + 2 * (len(rows) - 1)
    w = 2 + 2 * (gap + screw_w + gap) + tw
    h = 2 + 2 * pad_y + th
    img = np.zeros((h, w, 4), np.uint8)
    img[...] = (*face, 255)
    img[1:3, 1:-1, :3] = lit
    img[-3:-1, 1:-1, :3] = foot
    img[0, :, :3] = rim; img[-1, :, :3] = rim; img[:, 0, :3] = rim; img[:, -1, :3] = rim
    cy = h // 2 - 2
    for sx in (1 + gap, w - 1 - gap - screw_w):
        img[cy:cy + screw_w, sx:sx + screw_w, :3] = (90, 55, 12)
        img[cy:cy + 2, sx:sx + 2, :3] = (220, 163, 85)
    y = 1 + pad_y
    x0 = 1 + gap + screw_w + gap
    for r in rows:
        x = x0 + (tw - r.shape[1]) // 2
        cut = np.zeros((h, w), bool)
        cut[y:y + r.shape[0], x:x + r.shape[1]] = r
        below = np.zeros_like(cut)
        below[1:] = cut[:-1]
        img[below & ~cut, :3] = catch
        img[cut, :3] = ink
        y += r.shape[0] + 2
    # The painted plate: 1148-1260 x 538-575; the drawn one stands on its foot, centred on it, and covers it.
    if w < 1260 - 1148 or h < 575 - 538:
        raise SystemExit(f'room-52-plate: the drawn plate ({w} x {h}) does not cover the painted one')
    return save(img, 'room-52-plate', (1148 + 1260) // 2, 575, fit=(150, 48))


def barrel_words():
    words = re.findall(r'([A-Z]{4,}), says', look(52, 'THE BARRELS', 1))
    if len(words) != 2:
        raise SystemExit('THE BARRELS: its second LOOK no longer names two barrels')
    out = {}
    for word, (x0, x1) in zip(words, ((798, 965), (1425, 1600))):
        img, _ = lettered([word], (44, 30, 18, 255))
        out[word.lower()] = save(img, f'room-52-barrel-{word.lower()}', (x0 + x1) // 2, 668, fit=(150, 20))
    return out


def chalk():
    if 'chalked on the shelf' not in look(52, 'THE BOTTLES', 2):
        raise SystemExit('THE BOTTLES: its third LOOK no longer chalks the prices on the shelf')
    ink = (222, 214, 196, 255)
    rnd = np.random.default_rng(5203)
    w = 560
    img = np.zeros((10, w, 4), np.uint8)
    x = 6
    while x < w - 30:
        for dx in range(int(rnd.integers(2, 5))):
            hgt = int(rnd.integers(4, 8))
            img[1:1 + hgt, x + dx * 3:x + dx * 3 + 2] = ink
        x += int(rnd.integers(46, 70))
    # The shelf's front edge, under the bottles: x 925-1485, foot at y 386.
    return save(img, 'room-52-chalk', 1205, 386, fit=(600, 12))


if __name__ == '__main__':
    print(json.dumps({'signpost': signpost(), 'carving': carving(), 'cart': cart(),
                      'grog': grog(), 'knock': knock(), 'notice': notice(),
                      'plate': grog_plate(), 'barrels': barrel_words(), 'chalk': chalk()}, indent=1))
