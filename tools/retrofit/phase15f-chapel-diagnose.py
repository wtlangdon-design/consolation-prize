"""PHASE 1.5F -- THE CHAPEL, WITH THE NOTICE BOARD TAKEN OUT OF THE WAY (doc 36 Q122).

    python3 tools/retrofit/phase15f-chapel-diagnose.py

The brief requires the cause of the chapel's unrealistic front to be proven
before anything is repainted, with the board temporarily out of the picture.
The board is PLATE (Phase 1.5E), so it cannot be switched off: this clones the
church's own clapboard, from the wall immediately left of the board, across the
board's footprint. It is a DIAGNOSTIC, never a shipping state, and it is drawn
from the plate as Phase 1.5E left it (art/staging/room-02/chapel-01/
plate-before.png), so it shows what Tyler was looking at.

Writes renders/opening-set-retrofit/phase15f-chapel-diagnostic.webp: the room
as it was, the same view with the board cloned out, and the same view after the
repair -- so the answer to "is the chapel incomplete, or is the board merely in
front of it" can be read off one sheet.
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
BEFORE = 'art/staging/room-02/chapel-01/plate-before.png'
AFTER = 'art/staging/room-02/street-candidate-03/candidate-plate.png'
VIEW = (1400, 120, 1860, 620)
BOARD = (1598, 400, 1734, 600)
CLONE = (1556, 1596)
try:
    FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
    TITLE = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 21)
except Exception:
    FONT = TITLE = ImageFont.load_default()

before = np.array(Image.open(BEFORE).convert('RGB'))
hidden = before.copy()
strip = hidden[BOARD[1]:BOARD[3], CLONE[0]:CLONE[1]].copy()
for i, x in enumerate(range(BOARD[0], BOARD[2])):
    hidden[BOARD[1]:BOARD[3], x] = strip[:, i % strip.shape[1]]

panels = [(Image.fromarray(before).crop(VIEW), 'AS REVIEWED (Phase 1.5E): steeple, gable, and a wall that disappears behind the board'),
          (Image.fromarray(hidden).crop(VIEW), 'THE BOARD CLONED OUT (diagnostic only): no door, no window, no step, no plinth -- the facade carries no architecture at all'),
          (Image.open(AFTER).convert('RGB').crop(VIEW), 'AFTER the one authorized repair: door, lintel, steps, two windows, base; the frozen board back in front of it')]
k = 2
w, h = (VIEW[2] - VIEW[0]) * k, (VIEW[3] - VIEW[1]) * k
sheet = Image.new('RGB', (3 * w + 4 * 12, h + 52 + 46), (22, 22, 26))
d = ImageDraw.Draw(sheet)
d.text((12, 14), 'THE CHAPEL FRONT -- the diagnosis the repair was spent on (Phase 1.5F)', fill=(236, 236, 240), font=TITLE)
for i, (im, cap) in enumerate(panels):
    x = 12 + i * (w + 12)
    sheet.paste(im.resize((w, h), Image.NEAREST), (x, 52))
    for j, line in enumerate([cap[:64], cap[64:]]):
        d.text((x, 52 + h + 6 + j * 18), line, fill=(222, 222, 228), font=FONT)
sheet.save('renders/opening-set-retrofit/phase15f-chapel-diagnostic.webp', 'WEBP', quality=86, method=6)
print('renders/opening-set-retrofit/phase15f-chapel-diagnostic.webp', sheet.size)
