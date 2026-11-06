"""The man on the ladder at the town sign (doc 48 S7 beat 3: "the sign -- POP. 2,000
AND CLIMBING -- being repainted upward by a man on a ladder, who nods").

Room 36's fourth operation drew him on one sheet beside the hero for scale
(art/staging/room-36/coach-stop-dawn/painter-sheet.png): the hero, then the
townsman up a step-ladder three ways -- brush raised, brush lower, his head
turned over his shoulder in a nod. This cuts the sheet at one scale, and:

  * THE LADDER IS LENGTHENED. At the sign's depth a man is 254 px and the board
    hangs with its number line at y~462; the ladder as drawn put his brush at
    y~541, below the board. Its steps were drawn 18 px apart at that size -- a
    child's ladder -- so the gaps between steps are widened (each step keeps its
    thickness) until the brush reaches the numbers: about 40 px apart, a man's
    step.
  * A DIP IS DERIVED for the nod: the turned head moved down two art pixels.

  * THE STROKE IS DERIVED: the drawn second pose dropped the brush below the
    board, so frame 1 is frame 0 with the raised arm two art pixels lower.

Frames: 0 brush raised, 1 the dab (the two alternate: he paints), 2 head
turned, 3 head turned and dipped. `figureHeight` is the HERO's height on the
same sheet -- a man's height in its pixels -- so the engine draws him at the
room's man where the ladder stands. Snapped to one level (errata 112).

Usage: sign-painter.py   (writes art/actors/ambient-sign-painter.png; prints the frames)
"""
import json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SHEET = os.path.join(ROOT, 'art/staging/room-36/coach-stop-dawn/painter-sheet.png')
OUT = os.path.join(ROOT, 'art/actors/ambient-sign-painter.png')
MAN_AT_LADDER = 254      # Room 1's curve at the ladder's feet (812): content/rooms/stage-road.json
GROUND = 812             # where the ladder stands
BRUSH_TO = 462           # the board's number line, POP. ... 2,000 (y 455-473 on the plate)
LADDER_TOP = 740         # first row below his boots on the cut sheet: the top step and down
N = 115                  # a man in art pixels (errata 112)
ARM_BELOW, ARM_LEFT_OF = 190, 236   # the raised arm on the cut sheet: above his shoulder, left of his cap

with tempfile.TemporaryDirectory() as tmp:
    out = os.path.join(tmp, 'r.png')
    info = json.loads(subprocess.check_output([sys.executable, os.path.join(ROOT, 'tools/art/cast-unify-cut.py'),
                                               SHEET, '0', '1000', out, '--grid', '1']))
    im = Image.open(out).convert('RGBA')
    fr = info['frames']; fr = [fr[0]] + fr[2:]          # the cutter inserts a breath after the first pose
    cuts = [np.asarray(im.crop((x, y, x + w, y + h))).copy() for x, y, w, h in fr]

alpha = lambda a: a[..., 3] > 128
rows = lambda a: np.nonzero(alpha(a).any(1))[0]
hero = cuts[0]; man = rows(hero)[-1] - rows(hero)[0] + 1     # a man's height on this sheet
k = MAN_AT_LADDER / man                                       # room px per sheet px
painters = cuts[1:]
bottom = rows(painters[0])[-1]
need = (GROUND - BRUSH_TO) / k                                 # sheet px from the ladder's feet to the brush
have = bottom - min(rows(p)[0] for p in painters[:2])
extra = int(round(need - have))

# The steps: rows in the ladder much wider than its legs. They keep their thickness; the gaps stretch.
ladder = alpha(painters[0])[LADDER_TOP:bottom + 1]
width = ladder.sum(1)
step = width > np.median(width) * 1.25
gaps = int((~step).sum())
reps = np.ones(len(step))
reps[~step] = 1 + extra / gaps
src_rows = []
acc = 0.0
for r, n in enumerate(reps):
    acc += n
    while len(src_rows) < round(acc): src_rows.append(r)

def lengthen(a):
    top = a[:LADDER_TOP]
    low = a[LADDER_TOP:bottom + 1][src_rows]
    return np.concatenate([top, low], 0)

frames = [lengthen(p) for p in painters]
# THE STROKE IS A DAB. The second drawn pose dropped the brush about 49 px -- below the board's bottom edge,
# painting the air -- so the stroke is derived instead: the raised arm and brush (above the shoulder, left of
# his cap) two art pixels lower, the same hand on the same numbers.
b = man / N
d = int(round(2 * b))
raised = frames[0]
arm = np.zeros(raised.shape[:2], bool)
arm[:ARM_BELOW, :ARM_LEFT_OF] = alpha(raised)[:ARM_BELOW, :ARM_LEFT_OF]
dab = raised.copy()
dab[arm] = 0
moved = np.zeros_like(raised); moved[d:][arm[:-d]] = raised[:-d][arm[:-d]]
dab[moved[..., 3] > 128] = moved[moved[..., 3] > 128]
frames[1] = dab
# The dip: the turned head (crown to chin) two art pixels lower, over his collar.
nod = frames[2].copy()
head = rows(nod)[0]
chin = head + int(round(man * 0.15))
dip = nod.copy()
dip[head:head + d] = 0
dip[head + d:chin + d] = nod[head:chin]
frames.append(dip)

H = max(f.shape[0] for f in frames); W = max(f.shape[1] for f in frames)
sheet = Image.new('RGBA', (len(frames) * (W + 2) + 2, H + 4), (0, 0, 0, 0))
boxes = []
for i, f in enumerate(frames):
    x = 2 + i * (W + 2); y = 2 + H - f.shape[0]
    sheet.alpha_composite(Image.fromarray(f), (x, y))
    boxes.append([x, 2, W, H])
sheet.save(OUT)
subprocess.check_call([sys.executable, os.path.join(ROOT, 'tools/art/one-level.py'), '--only', 'ambient-sign-painter'],
                      stdout=subprocess.DEVNULL)
print(json.dumps({'sheet': os.path.relpath(OUT, ROOT), 'frames': boxes, 'figureHeight': int(man),
                  'lengthenedBy': extra, 'stepGapScale': round(1 + extra / gaps, 2),
                  'brushAt': round(GROUND - (H - min(rows(f)[0] for f in frames[:2])) * k)}))
