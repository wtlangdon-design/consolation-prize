"""Act III polish: the Reverend praying at Boot Hill's gate (reference/act3-polish/brief.md, picture 2; doc 110 section 2,
the hill's blessing).

Thad's line during the prayer says the Reverend's eyes are shut, and his figure showed them open
(renders/proofs/boot-hill-praying/). act3-hearse operation 5 (the cap raised 4 -> 5 for it, Tyler 2026-11-10) painted
him twice more on a template of his own shipping rest frame (errata 144's method): 1 as he is (the ruler), 2 eyes shut,
chin a little raised, his open hand lifted, 3 the same, his mouth open on a long word. Cut by
tools/art/act3-mourners-cut.py's steps (themselves tools/art/acted-poses.py's): the row cut where its first figure is
the shipping rest frame's height, each pose registered on the legs to it and then onto the shipping rest frame,
snapped to one level, despilled -- into their own sheet, frames the size of the shipping ones:

  art/actors/room-14-sowerby-praying.png: 0 praying, eyes shut, mouth closed · 1 the same, mouth open.

The main session wires them (frames appended to the gate's record, or a placement of their own).

Usage: act3-sowerby-praying-cut.py [--write]
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

def despill(a, tolerance=6):
    """Magenta left in thin pockets (between a wheel's spokes, inside a plume) that the cutter's own despill missed:
    red and blue standing above green TOGETHER is the key's signature (a blue-black lacquer has blue over green, but
    not red). Both are pulled down by that excess. Returns the frame and how many pixels were touched."""
    a = a.copy(); c = a[..., :3].astype(int)
    ex = np.minimum(c[..., 0], c[..., 2]) - c[..., 1]
    hit = (a[..., 3] > 0) & (ex > tolerance)
    c[..., 0] -= np.where(hit, ex, 0); c[..., 2] -= np.where(hit, ex, 0)
    a[..., :3] = np.clip(c, 0, 255).astype(np.uint8)
    return a, int(hit.sum())


def spill_left(a, tolerance=6):
    c = a[..., :3].astype(int)
    return int(((a[..., 3] > 0) & (np.minimum(c[..., 0], c[..., 2]) - c[..., 1] > tolerance)).sum())


REC = 'content/ambient/sowerby-gate.json'
OUT = os.path.join(ROOT, 'art/actors/room-14-sowerby-praying.png')
rec = read(REC); s = rec['sprite']
sheet = np.asarray(Image.open(os.path.join(ROOT, s['sheet'])).convert('RGBA'))
x, y, w, h = s['frames'][0]
rest_cell = sheet[y:y + h, x:x + w].copy()
target = int(rows(rest_cell)[-1] - rows(rest_cell)[0] + 1)
STAGING = os.path.join(ROOT, 'art/staging/act3-hearse/op-5/sheet.png')
with tempfile.TemporaryDirectory() as tmp:
    # cut_row reads art/staging/cast-unify/batch-NN/sheet.png; point a batch number at this operation's sheet
    link = os.path.join(ROOT, 'art/staging/cast-unify/batch-act3-sowerby')
    os.makedirs(link, exist_ok=True)
    Image.open(STAGING).save(os.path.join(link, 'sheet.png'))
    try:
        figs, cut_h, got = cut_row('act3-sowerby', 0, target, tmp)
    finally:
        os.unlink(os.path.join(link, 'sheet.png')); os.rmdir(link)
b = man(rec) / ns['N']
new = []
for pose in figs[1:3]:
    ox, oy = place(rest_cell, s['frames'][0], figs[0], pose, 'legs')
    cell = grow_and_paste((w, h), pose, ox, oy)
    new.append(snap(cell, b) if b > 1.05 else cell)
fixed = 0
for i, n in enumerate(new):
    new[i], k = despill(n); fixed += k
assert all(spill_left(n) == 0 for n in new), 'magenta survives the despill'
H2 = max(n.shape[0] for n in new); W2 = max(n.shape[1] for n in new)
out = np.zeros((H2 + 4, len(new) * (W2 + 2) + 2, 4), np.uint8)
rects = []
for i, n in enumerate(new):
    fx = 2 + i * (W2 + 2)
    out[2 + H2 - n.shape[0]:2 + H2, fx:fx + n.shape[1]] = n
    rects.append([fx, 2, W2, H2])
print(json.dumps({'despilled': fixed, 'restRows': target, 'cut': [cut_h, got], 'block': round(b, 2), 'frames': rects,
                  'shippingFrame': [w, h]}))
if '--write' in sys.argv:
    Image.fromarray(out).save(OUT)
