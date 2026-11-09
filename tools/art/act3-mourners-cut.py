"""Scene A's mourners, heads bowed (reference/act3-hearse/brief.md, operation 2; doc 110 section 2, the hill's
blessing: "The mourners bow their heads and shut their eyes").

act3-hearse operation 2 painted Room 31's seven mourners twice more on a template of their own shipping rest frame
(errata 144's method): 1 the group as it is (the ruler), 2 heads bowed, eyes shut, 3 the same with the young man in
spectacles peeking. Cut by tools/art/acted-poses.py's own steps -- the row cut where its first group is the
shipping rest frame's height, each pose registered on the legs to that group and then onto the shipping rest frame,
snapped to one level -- into their own sheet, frames the size of the shipping ones:

  art/actors/room-14-mourners-bowed.png: 0 heads bowed, eyes shut · 1 the same, one of them peeking.

At their existing drawn size; the room scales them. The main session wires them (an ambient placement in Room 14,
or frames appended to the Room 31 record).

Usage: act3-mourners-cut.py [--write]
"""
import json, os, sys, tempfile
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
src = open(os.path.join(ROOT, 'tools/art/acted-poses.py')).read()
ns = {'__file__': os.path.join(ROOT, 'tools/art/acted-poses.py')}
sys_argv, sys.argv = sys.argv, ['acted-poses.py']
exec(src[src.index('import json'):src.index('report = {}')], ns)
sys.argv = sys_argv
cut_row, place, grow_and_paste, snap, man, read, rows = (ns[k] for k in
    ('cut_row', 'place', 'grow_and_paste', 'snap', 'man', 'read', 'rows'))

REC = 'content/ambient/funeral-mourners.json'
OUT = os.path.join(ROOT, 'art/actors/room-14-mourners-bowed.png')
rec = read(REC); s = rec['sprite']
sheet = np.asarray(Image.open(os.path.join(ROOT, s['sheet'])).convert('RGBA'))
x, y, w, h = s['frames'][0]
rest_cell = sheet[y:y + h, x:x + w].copy()
target = int(rows(rest_cell)[-1] - rows(rest_cell)[0] + 1)
STAGING = os.path.join(ROOT, 'art/staging/act3-hearse/op-2/sheet.png')
with tempfile.TemporaryDirectory() as tmp:
    # cut_row reads art/staging/cast-unify/batch-NN/sheet.png; point a batch number at this operation's sheet
    link = os.path.join(ROOT, 'art/staging/cast-unify/batch-act3-mourners')
    os.makedirs(link, exist_ok=True)
    Image.open(STAGING).save(os.path.join(link, 'sheet.png'))
    try:
        figs, cut_h, got = cut_row('act3-mourners', 0, target, tmp)
    finally:
        os.unlink(os.path.join(link, 'sheet.png')); os.rmdir(link)
b = man(rec) / ns['N']
new = []
for pose in figs[1:3]:
    ox, oy = place(rest_cell, s['frames'][0], figs[0], pose, 'legs')
    cell = grow_and_paste((w, h), pose, ox, oy)
    new.append(snap(cell, b) if b > 1.05 else cell)
H2 = max(n.shape[0] for n in new); W2 = max(n.shape[1] for n in new)
out = np.zeros((H2 + 4, len(new) * (W2 + 2) + 2, 4), np.uint8)
rects = []
for i, n in enumerate(new):
    fx = 2 + i * (W2 + 2)
    out[2 + H2 - n.shape[0]:2 + H2, fx:fx + n.shape[1]] = n
    rects.append([fx, 2, W2, H2])
print(json.dumps({'restRows': target, 'cut': [cut_h, got], 'block': round(b, 2), 'frames': rects,
                  'shippingFrame': [w, h]}))
if '--write' in sys.argv:
    Image.fromarray(out).save(OUT)
