"""Room 16 while the séance sits: the tent's plate with the crystal ball's sliver behind the medium's hand filled in.

Errata 238 A: the séance group (content/ambient/seance-group.json) stands over the plate's own table, and "a sliver of
the crystal ball's left edge, about 15 px square, beside Ozymandia's right hand under the rod (x 928-943, y 466-481)"
showed through the gap between her hand, the rod and her sleeve. Tyler, 2026-11-09: "Fix all the things that are rough"
(errata 239). No placing of the group covers it: every offset within 24 px that hides the sliver uncovers more of the
ball, the box or the teapot elsewhere (measured on every frame of both sheets). So the tent has a plate for the séance,
chosen by state (RoomFile.plateWhen, as its dark state already is).

THE ONLY DIFFERENCE FROM THE SHIPPING PLATE is one small rectangle, the spec's `patch`, round that gap: each of its
pixels is the shipping plate's own pixel `shift` columns to its left, which is the same curtain at the same height,
clear of the ball and of the strong box. No image operation and nothing drawn: the plate's own curtain, moved. The dark
séance plate is this one dimmed (tools/art/room16-seance-dark.py), so run that after this.

    python3 tools/art/room16-seance-plate.py [--write]
    python3 tools/art/room16-seance-dark.py [--write]

tests/seance-polish.test.ts holds the result: the séance plates differ from the shipping plate only inside the patch,
and no pixel of the plate's ball, box or teapot shows past the group outside it.
"""
import json
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PLATE = os.path.join(ROOT, 'art/backgrounds/room-16-tent.png')
OUT = os.path.join(ROOT, 'art/backgrounds/room-16-tent-seance.png')
SPEC = os.path.join(ROOT, 'reference/room-16/seance-plate.json')

with open(SPEC, encoding='utf8') as handle:
    spec = json.load(handle)
x, y, w, h = spec['patch']
shift = spec['shift']

plate = np.asarray(Image.open(PLATE).convert('RGB'))
out = plate.copy()
out[y:y + h, x:x + w] = plate[y:y + h, x - shift:x - shift + w]
changed = int(np.any(out != plate, axis=2).sum())
print(f'{os.path.relpath(OUT, ROOT)}: {out.shape[1]}x{out.shape[0]}, patch {x},{y} {w}x{h} from {shift} px left, {changed} px changed')
if '--write' in sys.argv:
    Image.fromarray(out, 'RGB').save(OUT, optimize=True)
