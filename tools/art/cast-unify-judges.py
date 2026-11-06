"""Room 4's three judges, from cast-unify operation 5's rest poses. No image operation.

Tyler, 2026-11-06 (one artist, one game). The judges were redrawn once each,
waist-up behind their table (reference/cast-unify-05.txt, row 3). Their actions
are derived from the new rest frame exactly as tools/rig/room04-idles.py derived
them from the old -- 0 rest, 1 breath, 2 confer, 3 hands lifted, 4 nod, 5 glance
-- using that file's own lean, nod and hand-lift. (That script is not re-run:
it would rebuild Sowerby from his old rest frame, and Sowerby is now drawn.)

Writes art/actors/room-04-judge-N.png and prints the frames.
"""
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import types

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Tyler, 2026-11-06: the first redraw made the three judges one face in three
# coats. Operation 6 drew three different men, and operation 7 replaced two of
# them who looked like the Registrar and the livery man; row 0 is theirs.
SHEET = os.path.join(ROOT, 'art/staging/cast-unify/batch-07/sheet.png')
ROW = 0
HEIGHT = 174

# THE DERIVATIONS, read from room04-idles.py without running its main loop.
src = open(os.path.join(ROOT, 'tools/rig/room04-idles.py')).read()
cut_at = src.index('os.makedirs(OUT, exist_ok=True)')
idle = types.ModuleType('idle')
idle.__dict__['__file__'] = os.path.join(ROOT, 'tools/rig/room04-idles.py')
body = src[:cut_at].replace("FIGURES = {", "FIGURES_UNUSED = {").replace("judge_frames(1)", "[]").replace("judge_frames(2)", "[]").replace("judge_frames(3)", "[]")
body = body.replace("json.load(open(f'{S}/sowerby/sowerby.json'))['frames']", "[]")
exec(compile(body, 'room04-idles', 'exec'), idle.__dict__)

im = np.asarray(Image.open(SHEET).convert('RGB')).astype(float)
dist = np.sqrt((im[..., 0] - 255) ** 2 + im[..., 1] ** 2 + (im[..., 2] - 255) ** 2)
busy = (dist >= 120).sum(1) > 3
bands, start = [], None
for y, on in enumerate(busy):
    if on and start is None:
        start = y
    if not on and start is not None:
        if y - start > 40:
            bands.append((start, y))
        start = None
y0, y1 = bands[ROW]
with tempfile.TemporaryDirectory() as tmp:
    part = os.path.join(tmp, 'row.png')
    Image.fromarray(np.asarray(Image.open(SHEET).convert('RGB'))[max(0, y0 - 4):y1 + 4]).save(part)
    cut = os.path.join(tmp, 'cut.png')
    info = json.loads(subprocess.check_output([sys.executable, os.path.join(ROOT, 'tools/art/cut-ambient-sheet.py'), part, str(HEIGHT), cut]))
    row = np.asarray(Image.open(cut).convert('RGBA'))

out = {}
SIDES = {1: +1, 2: -1, 3: -1}
for n, (x, y, w, h) in enumerate(info['frames'], start=1):
    rest = idle.pad(row[y:y + h, x:x + w].copy())
    a = rest[..., 3] > 0
    cols = np.nonzero(a.any(0))[0]
    rest = rest[:, max(0, cols.min() - idle.PAD):cols.max() + 1 + idle.PAD]
    hh, ww = rest.shape[:2]
    breath = rest.copy()
    waist = hh * 55 // 100
    breath[:waist - 1] = rest[1:waist]
    breath[waist - 1] = rest[waist]
    side = SIDES[n]
    frames = [rest, breath, idle.lean(rest, hh - 1, side * idle.CONFER), idle.lift_hands(rest, idle.HANDS_UP),
              idle.nod(rest, idle.NOD), idle.lean(rest, hh - 1, -side * idle.GLANCE)]
    sheet = np.zeros((hh + 4, len(frames) * (ww + 2) + 2, 4), np.uint8)
    rects = []
    for i, f in enumerate(frames):
        fx = 2 + i * (ww + 2)
        sheet[2:2 + hh, fx:fx + ww] = f
        rects.append([fx, 2, int(ww), int(hh)])
    Image.fromarray(sheet).save(os.path.join(ROOT, f'art/actors/room-04-judge-{n}.png'))
    out[f'room_04_judge_{n}'] = rects
print(json.dumps(out))
