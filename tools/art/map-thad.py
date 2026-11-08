"""The map's Thad (errata 163): a token that walks the district's roads.

Derived from Thad's own walk cycle (art/actors/thad-walk-right) and his rest
pose (thad-idle-right/idle-00), so he is the same man in the same coat: each
frame cropped to the cycle's common box, reduced by area to TOKEN_H pixels
tall, its alpha made hard (no halo on the map), and given a one-pixel dark
outline so he reads against the dirt roads and the grass alike. Facing right;
the engine mirrors him to walk left.

Writes art/actors/map-thad.png and prints the frame rectangles for
content/rooms/town-map.json's `mapToken`.
"""
import glob
import json
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TOKEN_H = 30
OUTLINE = (30, 22, 16, 255)


def main():
    paths = sorted(glob.glob(os.path.join(ROOT, 'art/actors/thad-walk-right/walk-*.png')))
    paths.append(os.path.join(ROOT, 'art/actors/thad-idle-right/idle-00.png'))
    frames = [Image.open(p).convert('RGBA') for p in paths]
    boxes = [f.getbbox() for f in frames]
    box = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
    cells = []
    for frame in frames:
        crop = frame.crop(box)
        width = round(crop.width * TOKEN_H / crop.height)
        small = crop.resize((width, TOKEN_H), Image.BOX)
        px = small.load()
        for y in range(small.height):
            for x in range(small.width):
                r, g, b, a = px[x, y]
                px[x, y] = (r, g, b, 255) if a > 110 else (0, 0, 0, 0)
        cell = Image.new('RGBA', (width + 2, TOKEN_H + 2), (0, 0, 0, 0))
        mask = small.split()[3]
        for dx, dy in ((0, 1), (2, 1), (1, 0), (1, 2)):
            cell.paste(OUTLINE, (dx, dy), mask)
        cell.alpha_composite(small, (1, 1))
        cells.append(cell)
    w = max(c.width for c in cells)
    h = cells[0].height
    sheet = Image.new('RGBA', (2 + len(cells) * (w + 2), h + 4), (0, 0, 0, 0))
    rects = []
    for i, cell in enumerate(cells):
        x = 2 + i * (w + 2)
        sheet.alpha_composite(cell, (x + (w - cell.width) // 2, 2))
        rects.append([x, 2, w, h])
    out = os.path.join(ROOT, 'art/actors/map-thad.png')
    sheet.save(out)
    print(json.dumps({'sheet': 'art/actors/map-thad.png', 'frames': rects}))


if __name__ == '__main__':
    main()
