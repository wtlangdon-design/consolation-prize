#!/usr/bin/env python3
"""THE BOUNDARY AS HE WALKS IT (doc 120 I-3; errata 251).

Four transparent overlays the size of the Company's map (art/backgrounds/room-16-company-map.png), each the survey's
line as far as the rod has gone: from the stake uphill; to the larger of the two rocks; along the line the rod
preferred; and home. Drawn by this script and nothing else: a line in the map's own 4 px grain, two cells wide, dashed, in her
purple ink (doc 57 A7: "writes in purple ink").

The points are the picture's own (reference/act1-dinner/handback.md): the stake at Claim Two's lower right corner, the
larger rock uphill of Claim One. The line keeps to open paper and crosses neither claim.

    python3 tools/art/survey-line.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
MAP = ROOT / 'art/backgrounds/room-16-company-map.png'
OUT = ROOT / 'art/props'
GRAIN = 4
# Leg ends, in the map's pixels. The first leg is drawn in two parts, as it is walked: uphill, then to the rock.
STAKE = (1140, 478)
UPHILL = (1164, 300)
ROCK = (932, 184)
PREFERRED = (1312, 152)
# To the larger rock by way of the open paper above the smaller one, which the survey does not go to.
LEGS = [[STAKE, UPHILL], [UPHILL, (1096, 196), (1004, 164), ROCK], [ROCK, (964, 120), (1150, 100), PREFERRED], [PREFERRED, (1292, 360), STAKE]]


# Her ink: doc 57 A7, "writes in purple ink". The line is hers, whoever held the rod.
INK = (92, 44, 118, 255)
# Two cells wide, so that it reads at the size the game is played at.
WIDE = 2


def cells(points):
    """Every grain cell the polyline passes through, in order."""
    out = []
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        steps = max(abs(x1 - x0), abs(y1 - y0)) // GRAIN
        for n in range(steps + 1):
            t = n / max(1, steps)
            cell = (round((x0 + (x1 - x0) * t) / GRAIN), round((y0 + (y1 - y0) * t) / GRAIN))
            if not out or out[-1] != cell:
                out.append(cell)
    return out


def main():
    base = Image.open(MAP)
    colour = INK
    drawn = []
    for n, leg in enumerate(LEGS, start=1):
        drawn.extend(cells(leg))
        sheet = Image.new('RGBA', base.size, (0, 0, 0, 0))
        for k, (cx, cy) in enumerate(drawn):
            if k % 7 in (4, 5, 6):  # a dash of four cells and a gap of three
                continue
            for dx in range(GRAIN * WIDE):
                for dy in range(GRAIN * WIDE):
                    x, y = cx * GRAIN + dx, cy * GRAIN + dy
                    if 0 <= x < base.width and 0 <= y < base.height:
                        sheet.putpixel((x, y), colour)
        path = OUT / f'room-16-survey-line-{n}.png'
        sheet.save(path)
        print(f'{path.relative_to(ROOT)}  {len(drawn)} cells')


if __name__ == '__main__':
    main()
