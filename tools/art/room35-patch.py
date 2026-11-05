"""Room 35's plate, the two subjects operation 2 took away put back. No image operation.

Operation 2 removed Thad and put out the gas lamp as asked, and also took the
open book off the lectern (THE SEARCH FUND) and the bundle off the small table
(THE UNSOLD DEEDS), which it was not asked to touch. Neither overlaps Thad in
the master, so each is copied back from the master, one pixel down to sit on
the plate's grid (the plate came back one row lower than the master).

Writes art/staging/room-35/plate-01/patched.png.
"""
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-35')
REGIONS = {'the search fund, open on the lectern': (428, 468, 622, 566),
           'the unsold deeds, tied on the table': (606, 562, 698, 616)}
master = Image.open(f'{S}/composition-master-01.png').convert('RGB')
plate = Image.open(f'{S}/plate-01/source.png').convert('RGB')
for box in REGIONS.values():
    plate.paste(master.crop(box), (box[0], box[1] + 1))
plate.save(f'{S}/plate-01/patched.png')
print('patched', list(REGIONS))
