#!/usr/bin/env python3
"""ROOM 5's PROUD FLOORBOARD, iteration 2: a real plank in the middle walking band, lifted unevenly.

    python3 tools/pixelart/floorboard.py

Tyler rejected iteration 1 (2026-09-05): a two-row lift on the plank against
the counter was invisible in play and only a foot hugging the desk reached it.
Iteration 2 moves the LOOSE BOARD to a plank the room's ordinary walking
already crosses -- the board in the middle band between the street door's step
and the joint at x~747, whose two seams the plate draws sloping gently with the
perspective -- and lifts it by ONE restrained step more, unevenly, as a loose
board actually sits: the right end a little higher than the left, a dark gap
under its near edge the height of the lift, the top lip a shade lighter, the
end grain a shade darker where it stands clear of the door's shadow.

No image model, no repaint: the plank's own pixels, read between its fitted
seam lines column by column, moved up by that column's lift, on a full-plate
RGBA over the unchanged plate, as the lamp's state image is. Two strengths for
the owner's eye -- A (moderate) and B (one step stronger) -- from each plate,
same plank, same bounds; PRESSED is the plank flush. The record beside the
images carries the bounds, the lifts and the hashes.
"""
import hashlib, json
from pathlib import Path
import numpy as np
from PIL import Image

OUT = Path('art/staging/room-05/floorboard')
PLATES = {
    'day': 'art/staging/room-05/plate-02/candidate-1920x864.png',
    'night': 'art/staging/room-05/plate-03-night-lift/candidate-1920x864.png',
}
# THE PLANK, read on the day plate: its top seam runs y = 0.0209x + 731.9 and its
# bottom seam y = 0.0452x + 757.3 (least squares over the seam dips, x 460-760),
# so it is ~41 rows tall at its left end and ~46 at its right; it begins where
# the floor comes out of the door step's shadow (x~462) and ends at the joint
# at x~745. Inside the middle walking band (y 743-787), which is the point.
X0, X1 = 462, 745
TOP = (0.0209, 731.9)
BOT = (0.0452, 757.3)
TREADS = [X0, 746, X1 - X0 + 1, 43]            # the rectangle the feet must cross: rows 746..788
# ITERATION 3 (Tyler, 2026-09-05): the face is the same old wood -- NO global
# brightening of the lifted plank; proudness comes from the edge: the dark gap
# under the near edge, at most a one-pixel restrained lip, a little unevenness.
#   lift    rows proud at the left end and at the right end
#   gap     the vacated rows under the near edge, as a fraction of the seam's own colour
#   lip     the top row's gain (1.0 = untouched); at most one pixel row, restrained
#   grain   the two end-grain columns' gain at the right end (1.0 = untouched)
TREATMENTS = {
    'a': dict(lift=(1, 2), gap=0.72, lip=1.00, grain=1.00),   # SUBTLE: edge only
    'b': dict(lift=(2, 3), gap=0.62, lip=1.06, grain=0.95),   # MEDIUM: the recommended balance
    'c': dict(lift=(2, 4), gap=0.52, lip=1.08, grain=0.90),   # UPPER LIMIT: clearly noticeable, the same wood
}
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()

def seam(fit, x):
    return int(round(fit[0] * x + fit[1]))

def build(plate_path, treat):
    plate = np.array(Image.open(plate_path).convert('RGB')).astype(float)
    H, W = plate.shape[:2]
    rest = np.zeros((H, W, 4)); pressed = np.zeros((H, W, 4))
    l0, l1 = treat['lift']
    for x in range(X0, X1 + 1):
        top, bot = seam(TOP, x) + 1, seam(BOT, x) - 1          # the plank's own rows, seams excluded
        lift = int(round(l0 + (l1 - l0) * (x - X0) / (X1 - X0)))
        col = plate[top:bot + 1, x].copy()
        # PRESSED: flush, the plate's own pixels
        pressed[top:bot + 1, x, :3] = col; pressed[top:bot + 1, x, 3] = 255
        # REST: the same pixels `lift` rows up, the vacated rows a dark gap
        rest[top - lift:bot + 1 - lift, x, :3] = col; rest[top - lift:bot + 1 - lift, x, 3] = 255
        if treat['lip'] != 1.0:
            rest[top - lift, x, :3] = np.clip(col[0] * treat['lip'], 0, 255)
        seam_colour = plate[bot + 1:bot + 3, x].mean(0)
        rest[bot + 1 - lift:bot + 1, x, :3] = seam_colour * treat['gap']; rest[bot + 1 - lift:bot + 1, x, 3] = 255
    # end grain at the right end, two columns, where the board stands clear of the door's shadow
    for x in (X1 - 1, X1):
        m = rest[:, x, 3] > 0; rest[m, x, :3] *= treat['grain']
    return rest, pressed

record = {'iteration': 3, 'plank': dict(x=X0, y=746, w=X1 - X0 + 1, h=43, cols=f'{X0}..{X1}', topSeam=f'y = {TOP[0]}x + {TOP[1]}', bottomSeam=f'y = {BOT[0]}x + {BOT[1]}', rowsAtLeftEnd=f'{seam(TOP, X0) + 1}..{seam(BOT, X0) - 1}', rowsAtRightEnd=f'{seam(TOP, X1) + 1}..{seam(BOT, X1) - 1}'),
          'tread': TREADS, 'treatments': TREATMENTS, 'plates': {}, 'images': {}}
OUT.mkdir(parents=True, exist_ok=True)
for name, plate_path in PLATES.items():
    suffix = '' if name == 'day' else '-night'
    for key, treat in TREATMENTS.items():
        rest, pressed = build(plate_path, treat)
        p = OUT / f'board-rest-{key}{suffix}.png'
        Image.fromarray(np.clip(rest, 0, 255).astype(np.uint8), 'RGBA').save(p, optimize=True)
        record['images'][f'rest-{key}-{name}'] = {'path': str(p), 'sha256': sha(p)}
        if key == 'b':
            q = OUT / f'board-pressed{suffix}.png'
            Image.fromarray(np.clip(pressed, 0, 255).astype(np.uint8), 'RGBA').save(q, optimize=True)
            record['images'][f'pressed-{name}'] = {'path': str(q), 'sha256': sha(q)}
    record['plates'][name] = {'path': plate_path, 'sha256': sha(plate_path)}
record['note'] = ('Iteration 2, derived from the accepted plates by tools/pixelart/floorboard.py; the plates are unchanged. '
                  'The middle-band plank between the door step and the joint at x~745, lifted unevenly (right end higher) with the gap '
                  'under its near edge; A moderate, B one step stronger; PRESSED flush. Same plank and bounds on both plates.')
(OUT / 'floorboard.json').write_text(json.dumps(record, indent=2))
print(json.dumps({k: v['sha256'][:12] for k, v in record['images'].items()}, indent=1)); print('tread', TREADS)
