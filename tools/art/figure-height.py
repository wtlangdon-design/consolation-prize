"""A standing figure's height for `sprite.figureHeight`: CROWN TO SOLE of its
rest frame, never hat to sole (2026-11-06: the duel Fanshawe's top hat, counted
as his height, drew the man under it about 11% short).

With --hat, the crown is found under the hat: the hat's brim is the widest row
in the top 18% of the figure, and the crown sits a little above it (4% of the
man). Without, the crown is the top drawn row.

Usage: figure-height.py <sheet.png> <frames.json> [--hat]
"""
import json, sys
import numpy as np
from PIL import Image

sheet, frames = sys.argv[1], json.load(open(sys.argv[2]))['frames']
x, y, w, h = frames[0]
m = np.asarray(Image.open(sheet).convert('RGBA'))[y:y + h, x:x + w, 3] > 128
rows = np.where(m.any(1))[0]; top, bot = int(rows[0]), int(rows[-1])
drawn = bot - top + 1
if '--hat' in sys.argv:
    wid = [int(m[r].sum()) for r in range(top, bot + 1)]
    brim = int(np.argmax(wid[:int(drawn * 0.18)]))
    man = int(round((drawn - brim) * 1.04))
else:
    man = drawn
print(json.dumps({'drawn': drawn, 'figureHeight': man}))
