"""The Reverend at the plate, turned to the line (doc 115 II-1; errata 246). No image operation.

art/actors/room-14-sowerby-plate.png (act2-papers operation 3) draws him reaching and pulling to his left. On the
hill the line of mourners ends on his other side, so each cell is mirrored about its own centre, as
tools/art/mirror-cells.py does, and two frames are derived from the reach so that he moves while his hand is on the
plate (errata 77): a breath, and a haul, his weight going back from the plate with his feet where they were.

Cells of 290 x 314, laid out as every ambient sheet is ([2 + i*292, 2, 290, 314]):
  0 the plate in both hands · 1 breath · 2 a hand out, on the rim · 3 the plate held out at arm's length
  4 the hand out, a breath (derived) · 5 the hand out, hauling (derived)

    python3 tools/art/act2-collection-sheet.py [--write]

Then, because the two derived frames are sheared off the art grid:
    python3 tools/art/one-level.py --only room-14-sowerby-plate-right
"""
import os
import sys

from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'art/actors/room-14-sowerby-plate.png')
OUT = os.path.join(ROOT, 'art/actors/room-14-sowerby-plate-right.png')
W, H, N = 208, 314, 4   # the source sheet's cells
# HIS FEET WHERE THE SHEET HE STANDS IN AT THE GATE PUTS THEM. A figure is drawn with its cell's centre on his x. His
# shipping sheet (room-31-sowerby-master.png, cells of 182) has his feet 16 px right of its cell's centre, and the
# source sheet's four poses do not agree with each other about where his feet are (their spans' centres are 19 px
# apart). So each mirrored cell is set into a cell of 290 with the centre of its feet 16 px right of the centre, and
# he does not step sideways when the plate reaches Thad, or when he hauls on it.
OUT_W, FEET = 290, 16
KNEES = 250  # rows below this stay where they are: his feet do not move


def lean(cell, px):
    """Shear the figure above the knees by up to `px` pixels at the crown, away from the plate (screen left)."""
    out = Image.new('RGBA', cell.size, (0, 0, 0, 0))
    src, dst = cell.load(), out.load()
    for y in range(H):
        shift = round(px * max(0, KNEES - y) / KNEES)
        for x in range(OUT_W):
            nx = x - shift
            if 0 <= nx < OUT_W and src[x, y][3]:
                dst[nx, y] = src[x, y]
    return out


sheet = Image.open(SRC).convert('RGBA')
def feet_centre(cell):
    alpha = cell.getchannel('A')
    bottom = alpha.getbbox()[3]
    px = alpha.load()
    xs = [x for y in range(bottom - 6, bottom) for x in range(cell.width) if px[x, y] > 128]
    return (min(xs) + max(xs)) / 2


OFFSETS = []


def widened(cell):
    out = Image.new('RGBA', (OUT_W, H), (0, 0, 0, 0))
    at = round(OUT_W / 2 + FEET - feet_centre(cell))
    OFFSETS.append(at)
    out.paste(cell, (at, 0))
    return out


cells = [widened(ImageOps.mirror(sheet.crop((2 + i * (W + 2), 2, 2 + i * (W + 2) + W, 2 + H)))) for i in range(N)]
cells += [lean(cells[2], 1), lean(cells[2], 5)]
result = Image.new('RGBA', (2 + len(cells) * (OUT_W + 2), H + 4), (0, 0, 0, 0))
for i, cell in enumerate(cells):
    result.paste(cell, (2 + i * (OUT_W + 2), 2))
print(f'{len(cells)} cells of {OUT_W} x {H}; sheet {result.size}')
if '--write' in sys.argv:
    result.save(OUT)
    print(f'wrote {os.path.relpath(OUT, ROOT)}')

# THE PLATE BY ITSELF, for the line (art/props/room-14-collection-plate.png): the plate of cell 3, lifted off his
# hand. Where his fingers cover the rim, the plate's own pixels from the other side of its centre stand in.
PLATE = os.path.join(ROOT, 'art/props/room-14-collection-plate.png')
CX, CY, RX, RY = 159 + OFFSETS[3], 104, 34, 22
src = cells[3].load()
plate = Image.new('RGBA', (2 * RX + 1, 2 * RY + 1), (0, 0, 0, 0))
dst = plate.load()


def pewter(p):
    return p[3] > 0 and abs(p[0] - p[1]) < 24 and abs(p[1] - p[2]) < 30 and p[0] - p[2] < 22


for dy in range(-RY, RY + 1):
    for dx in range(-RX, RX + 1):
        if (dx / RX) ** 2 + (dy / RY) ** 2 > 1:
            continue
        here, there = src[CX + dx, CY + dy], src[CX - dx, CY + dy]
        got = here if pewter(here) else there if pewter(there) else None
        if got:
            # In the line it is in a widow's hands under the same moon, away from the gate's lamp: a little darker.
            dst[RX + dx, RY + dy] = (round(got[0] * 0.8), round(got[1] * 0.8), round(got[2] * 0.82), 255)
print(f'plate {plate.size}')
if '--write' in sys.argv:
    plate.save(PLATE)
    print(f'wrote {os.path.relpath(PLATE, ROOT)}')

# IN THE LINE, the plate is in a widow's hands, in front of the town's own picture (base line y 800). A room prop's base
# line is both its bottom row and its place in the depth order, so the plate is given empty rows down to y 806.
IN_LINE = os.path.join(ROOT, 'art/props/room-14-collection-plate-in-line.png')
tall = Image.new('RGBA', (plate.width, 195), (0, 0, 0, 0))
tall.paste(plate, (0, 0))

# THE COLONEL'S WREATH AT PIKE'S MARKER (doc 118 O-6): the wreath alone from his doorway sheet (frame 3), at the far
# boards' scale, and brought from Main Street's lamps into the hill's night with the grade his Duel Three sheet was
# given there (errata 242: a cool light, half the colour), a little darker for the back of the hill.
WREATH_SRC = os.path.join(ROOT, 'art/actors/room-02-fanshawe-wreath.png')
WREATH = os.path.join(ROOT, 'art/props/room-14-colonels-wreath.png')
wreath = Image.open(WREATH_SRC).convert('RGBA').crop((2 + 3 * 262, 2, 2 + 3 * 262 + 260, 400))
wreath = wreath.crop(wreath.getchannel('A').getbbox()).resize((70, 76), Image.NEAREST)
wp = wreath.load()
for y in range(wreath.height):
    for x in range(wreath.width):
        r, g, b, a = wp[x, y]
        if a < 255:
            wp[x, y] = (0, 0, 0, 0)
            continue
        lum = 0.299 * r + 0.587 * g + 0.114 * b
        r, g, b = (lum + (v - lum) * 0.5 for v in (r, g, b))
        wp[x, y] = (round(r * 0.72 * 0.8), round(g * 0.86 * 0.8), round(b * 0.8), 255)
if '--write' in sys.argv:
    tall.save(IN_LINE)
    wreath.save(WREATH)
    print(f'wrote {os.path.relpath(IN_LINE, ROOT)} and {os.path.relpath(WREATH, ROOT)}')
