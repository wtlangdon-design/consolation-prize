"""The press, pulled: the three sheets in the Clarion at game size, beside Thad (style gate step 2's picture).

Every figure drawn as the engine draws a standing one: scaled so its rest height is the room's man at its feet
(tools/art/beside-thad.py's curve_man), bottom-centred on its x. Frame at the press (x 1379, y 717) folded-armed;
his walk laid out along his ~450 px path left to his back editions; Thad's haul at the press's left edge where Frame
stands now, and Thad's own standing frame at his talk spot (1120, 790) for the size. No image operation.

Writes renders/room-09-the-press-pulled-with-thad.png.
"""
import json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ns = {'__file__': os.path.join(ROOT, 'tools/art/beside-thad.py')}
src = open(ns['__file__']).read()
exec(src[:src.index('def main')], ns)
curve_man, load = ns['curve_man'], ns['load']
room = load('content/rooms/clarion.json')
plate = Image.open(os.path.join(ROOT, room['background'])).convert('RGBA')


def cells(path, rects):
    im = Image.open(os.path.join(ROOT, path)).convert('RGBA')
    return [im.crop((x, y, x + w, y + h)) for x, y, w, h in rects]


def draw(canvas, cell, rest_h, x, y):
    man = curve_man(room, x, y)
    k = man / rest_h
    c = cell.resize((max(1, round(cell.width * k)), max(1, round(cell.height * k))), Image.NEAREST)
    canvas.alpha_composite(c, (int(round(x - c.width / 2)), int(round(y - c.height + 1))))


def strip_rects(path, n):
    im = Image.open(os.path.join(ROOT, path)); W = im.width // n
    return [(i * W, 0, W, im.height) for i in range(n)]


def main():
    wim = Image.open(os.path.join(ROOT, 'art/actors/room-09-frame-walk.png'))
    cw = (wim.width - 2) // 6 - 2                 # six frames, 2 px apart, as the cut lays them out
    walk = cells('art/actors/room-09-frame-walk.png', [(2 + i * (cw + 2), 2, cw, 502) for i in range(6)])
    stood = cells('art/actors/room-09-frame-stood-back.png', [(2, 2, 201, 506)])
    haul = cells('art/actors/thad-haul-right.png', strip_rects('art/actors/thad-haul-right.png', 3))
    thad = Image.open(os.path.join(ROOT, 'art/actors/thad-idle-right/idle-00.png')).convert('RGBA')
    frame = json.load(open(os.path.join(ROOT, 'content/ambient/frame.json')))
    fx, fy = frame['x'], frame['y']
    a = plate.copy()                              # the walk along his path, and Thad standing to talk
    for i, c in enumerate(walk):
        draw(a, c, 502, fx - 40 - i * 80, fy)
    draw(a, thad, 626, 1120, 790)
    b = plate.copy()                              # the pull: Frame stood back, Thad at the bar where Frame stood
    draw(b, stood[0], 502, fx - 330, fy)
    draw(b, haul[1], 626, fx - 40, fy)
    c = plate.copy()
    for i, f in enumerate(haul):
        draw(c, f, 626, 700 + i * 300, 790)
    draw(c, thad, 626, 400, 790)
    out = Image.new('RGB', (1920, 864 * 3 + 32), (0, 0, 0))
    for i, im in enumerate((a, b, c)):
        out.paste(im.convert('RGB'), (0, i * (864 + 16)))
    out.save(os.path.join(ROOT, 'renders/room-09-the-press-pulled-with-thad.png'))
    print('wrote renders/room-09-the-press-pulled-with-thad.png', 'man at Frame', round(curve_man(room, fx, fy), 1),
          'at Thad', round(curve_man(room, 1120, 790), 1))


main()
