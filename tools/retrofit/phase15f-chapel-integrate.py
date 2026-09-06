"""PHASE 1.5F -- THE CHAPEL REPAIR BECOMES PLATE, THE BOARD STAYS FROZEN (doc 36 Q122).

    python3 tools/retrofit/phase15f-chapel-integrate.py

The chapel operation's masked zone is composited into the plate, in place, with
its edge feathered over 8 px inside the zone. Then the NOTICE BOARD -- frozen
art by Tyler's ruling -- is put back exactly as it stands: its own pixels, cut
from the plate as it was before this phase by the wood-hue silhouette that
separates warm board timber from the cool clapboard behind it, dilated by one
pixel and composited over the result.

THE MODEL PAINTED ITS OWN BOARD inside the mask (it was asked to ignore the
one that is there, and could not). Where that painted board falls outside the
frozen board's silhouette -- below the real frame, between the real posts and
along the right edge -- it is covered with the chapel's own wall, cloned from
the band of siding the model painted immediately left of the board at the same
rows, which carries the same clapboard courses, the same base line and the same
night value. The door, the steps, the windows and the siding the operation was
spent on are untouched by that cover: it starts right of x 1615, clear of them.
"""
import hashlib, json, os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
PLATE = 'art/staging/room-02/street-candidate-03/candidate-plate.png'
BEFORE = 'art/staging/room-02/chapel-01/plate-before.png'   # the plate as Phase 1.5E left it; this script is re-runnable from it
OP = 'art/staging/room-02/chapel-01/chapel-op.json'
LOCAL = 'art/staging/room-02/chapel-01/local-1to1.png'
BOARD_BOX = (1560, 392, 1760, 604)      # everything the board and its posts can occupy
CLEAN_FROM_X = 1615                     # right of the door and its steps
CLONE_BAND = (1546, 1568)               # the model's own PLAIN siding, between the left window and the door
FEATHER = 8
# THE THREE PLACES THE MODEL'S OWN BOARD SURVIVED the silhouette restore, read
# off the integrated plate at 6x: a stub of its cap right of the real frame, the
# bright edge of its lower rail under the real one, and its right post standing
# on the storefront. The first two are covered with the chapel's own siding; the
# third is not chapel at all, so everything from the real board's right edge
# outward is simply the plate as Phase 1.5E left it.
COVER_RECTS = [(1716, 438, 1728, 462), (1614, 502, 1720, 520)]
PLATE_RIGHT_OF = 1728

op = json.load(open(OP))
before = np.array(Image.open(BEFORE).convert('RGB'))
plate_before_sha = sha(BEFORE)
loc = np.array(Image.open(LOCAL).convert('RGB')).astype(float)
rx0, ry0, rx1, ry1 = op['region']
zx0, zy0, zx1, zy1 = op['zonePlate']

# 1. the repair, feathered into the plate
out = before.astype(float).copy()
zone = np.ones((zy1 - zy0, zx1 - zx0), bool)
alpha = np.clip(ndimage.distance_transform_edt(np.pad(zone, 1))[1:-1, 1:-1] / FEATHER, 0, 1)[..., None]
patch = loc[zy0 - ry0:zy1 - ry0, zx0 - rx0:zx1 - rx0]
out[zy0:zy1, zx0:zx1] = patch * alpha + out[zy0:zy1, zx0:zx1] * (1 - alpha)


def wood(arr, box):
    """The warm timber of the board against the cool clapboard behind it."""
    sub = arr[box[1]:box[3], box[0]:box[2]].astype(int)
    m = sub[..., 0] > sub[..., 2] + 4
    m = ndimage.binary_closing(m, np.ones((3, 3)))
    return ndimage.binary_opening(m, np.ones((2, 2)))


frozen = wood(before, BOARD_BOX)
label, n = ndimage.label(frozen)
sizes = ndimage.sum(frozen, label, range(1, n + 1))
frozen = np.isin(label, [i + 1 for i, s in enumerate(sizes) if s >= 40])
painted = wood(out.astype('uint8'), BOARD_BOX)

# 2. cover what the model painted as a board outside the real one, right of the door
cover = painted & ~ndimage.binary_dilation(frozen, np.ones((7, 7)))
cover[:, :CLEAN_FROM_X - BOARD_BOX[0]] = False
cover = ndimage.binary_dilation(cover, np.ones((3, 3)))
# SIDING IS HORIZONTAL COURSES, so the fill is the ROW MEDIAN of that band:
# it reproduces each course's own value and carries no feature to repeat.
courses = np.median(out[:, CLONE_BAND[0]:CLONE_BAND[1]], axis=1)
ys, xs = np.where(cover)
for y, x in zip(ys, xs):
    out[BOARD_BOX[1] + y, BOARD_BOX[0] + x] = courses[BOARD_BOX[1] + y]

# 2b. the authored covers, and the plate itself right of the board
for rx0, ry0, rx1, ry1 in COVER_RECTS:
    for y in range(ry0, ry1):
        out[y, rx0:rx1] = courses[y]
out[zy0:zy1, PLATE_RIGHT_OF:] = before[zy0:zy1, PLATE_RIGHT_OF:]

# 3. the frozen board back on top, exactly as it stands
keep = ndimage.binary_dilation(frozen, np.ones((3, 3)))
region_before = before[BOARD_BOX[1]:BOARD_BOX[3], BOARD_BOX[0]:BOARD_BOX[2]].astype(float)
region_out = out[BOARD_BOX[1]:BOARD_BOX[3], BOARD_BOX[0]:BOARD_BOX[2]]
region_out[keep] = region_before[keep]
out[BOARD_BOX[1]:BOARD_BOX[3], BOARD_BOX[0]:BOARD_BOX[2]] = region_out

Image.fromarray(np.clip(out, 0, 255).astype('uint8'), 'RGB').save(PLATE)
record = {'schema': 1, 'note': __doc__.strip(), 'op': op['purpose'],
          'inputs': {LOCAL: sha(LOCAL), 'plateBefore': plate_before_sha},
          'zonePlate': list(op['zonePlate']), 'feather': FEATHER,
          'boardRestore': {'box': list(BOARD_BOX), 'method': 'wood-hue silhouette of the frozen board, dilated 1px, from the plate before this phase',
                           'pixels': int(keep.sum())},
          'paintedBoardCover': {'from': list(CLONE_BAND), 'fill': 'per-row median of the band (the siding is horizontal courses)', 'rightOfX': CLEAN_FROM_X, 'pixels': int(cover.sum()),
                                'authoredRects': [list(r) for r in COVER_RECTS],
                                'plateKeptRightOfX': PLATE_RIGHT_OF},
          'output': {PLATE: sha(PLATE)}}
json.dump(record, open('art/staging/room-02/chapel-01/chapel-integrate.json', 'w'), indent=1)
open('art/staging/room-02/chapel-01/chapel-integrate.json', 'a').write('\n')
print(f'chapel integrated; board restored {int(keep.sum())} px, painted-board cover {int(cover.sum())} px')
