"""Frame, stood back: his two frames and one thing to do while he waits (errata 253; errata 77).

press-pull operation 2 drew him stood back with his arms folded: a rest frame and its breath
(art/actors/room-09-frame-stood-back.png, two cells of 201 x 506). Every visible character does something deliberate
at least every 30 seconds (errata 77), and there is no image operation to spend on one, so the third frame is one he
already has: frame 3 of his own sheet (art/actors/room-09-frame-master.png), taking a note with the pencil from behind
his ear, set on the same sole row in a cell of the same size. No pixel of any frame is changed.

    python3 tools/art/press-pull-stood-sheet.py
"""
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STOOD = os.path.join(ROOT, 'art/actors/room-09-frame-stood-back.png')
MASTER = os.path.join(ROOT, 'art/actors/room-09-frame-master.png')
OUT = os.path.join(ROOT, 'art/actors/room-09-frame-stood-back-idles.png')
CELL = (201, 506)
NOTE = (611, 2, 201, 502)  # frame 3 of his master: taking a quote in his notebook

stood = Image.open(STOOD).convert('RGBA')
master = Image.open(MASTER).convert('RGBA')
cells = [stood.crop((2, 2, 2 + CELL[0], 2 + CELL[1])), stood.crop((205, 2, 205 + CELL[0], 2 + CELL[1]))]
note = Image.new('RGBA', CELL, (0, 0, 0, 0))
x, y, w, h = NOTE
note.paste(master.crop((x, y, x + w, y + h)), (0, CELL[1] - h))
cells.append(note)
sheet = Image.new('RGBA', (2 + len(cells) * (CELL[0] + 2), CELL[1] + 4), (0, 0, 0, 0))
for i, cell in enumerate(cells):
    sheet.paste(cell, (2 + i * (CELL[0] + 2), 2))
sheet.save(OUT)
print(os.path.relpath(OUT, ROOT), sheet.size, [[2 + i * (CELL[0] + 2), 2, CELL[0], CELL[1]] for i in range(len(cells))])
