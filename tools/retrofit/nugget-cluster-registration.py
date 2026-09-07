"""THE FURNITURE-REGISTRATION GATE (doc 36 Q134).

    python3 tools/retrofit/nugget-cluster-registration.py <card|bar>

Tyler's rule: before extracting ANY human from a returned composition, compare
the returned furniture against the canonical input crop. The composition fails
if the returned result materially changes the geometry the contacts depend on.
Minor changed pixels where hands and bodies cross the furniture are expected;
structural movement is not.

THIS RUNS BEFORE ANYTHING IS CUT OUT, and it is allowed to say no to a picture
that looks good. That is the whole point of it: the last four operations in
this project each produced something attractive, and what made two of them
unusable was geometry, not beauty.

THREE MEASUREMENTS, cheapest first.

1. THE KEPT REGION. The mask declared a region the endpoint was not asked to
   touch. If that region came back different, nothing else needs checking: the
   result is not an edit of this room, it is a new picture of a similar room.

2. BEST UNIFORM TRANSLATION. A composition that is merely offset can be
   registered by shifting it back, and Tyler allows that. This searches
   integer offsets for the one that best matches the kept region, and reports
   the residual. A large residual at every offset means the change is not a
   translation.

3. THE FURNITURE ITSELF. Structural landmarks -- the tabletop's own row, the
   counter's edge -- measured in the input and again in the output. This is
   what "the tabletop moved" means as a number.
"""
import json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
which = sys.argv[1] if len(sys.argv) > 1 else 'card'
SRC = json.load(open('art/staging/room-03/cluster-sources.json'))['clusters'][which]
DIR = os.path.dirname(SRC['canvas'])

canvas = np.asarray(Image.open(SRC['canvas']).convert('RGB')).astype(int)
result = np.asarray(Image.open(f'{DIR}/source.png').convert('RGB')).astype(int)
if canvas.shape != result.shape:
    print(f'SHAPE MISMATCH: sent {canvas.shape}, got {result.shape}')
    raise SystemExit(1)

# THE KEPT REGION IS READ FROM THE MASK ITSELF, not re-derived from a
# rectangle: the bar's free window is a sloped band that follows the counter,
# and a gate that measured a different shape from the one that was sent would
# be measuring nothing.
mask_alpha = np.asarray(Image.open(SRC['mask']).convert('RGBA'))[..., 3]
kept = mask_alpha > 127
print(f'{which}: canvas {canvas.shape[1]}x{canvas.shape[0]}, '
      f'kept region {kept.sum()} px ({100 * kept.mean():.1f}%)')


def grey(a):
    return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]


d = np.abs(canvas - result).max(axis=2)
print(f'\n1. THE KEPT REGION -- the endpoint was not asked to touch this')
print(f'   mean abs difference   {d[kept].mean():7.2f}   (0 would be untouched)')
print(f'   fraction over 16      {(d[kept] > 16).mean():7.3f}')
print(f'   fraction over 48      {(d[kept] > 48).mean():7.3f}')

# 2. Best uniform translation over the kept region.
a, b = grey(canvas), grey(result)
best = None
for dy in range(-24, 25, 2):
    for dx in range(-24, 25, 2):
        shifted = np.roll(np.roll(b, dy, 0), dx, 1)
        score = np.abs(a - shifted)[kept].mean()
        if best is None or score < best[0]:
            best = (score, dx, dy)
print(f'\n2. BEST UNIFORM TRANSLATION over the kept region')
print(f'   at rest (0,0)         {np.abs(a - b)[kept].mean():7.2f}')
print(f'   best offset           dx={best[1]:+d} dy={best[2]:+d} -> residual {best[0]:7.2f}')
print('   a translation would show a clear minimum well below the resting value')

# 3. The furniture's own landmarks.
print('\n3. THE FURNITURE ITSELF')
z = SRC['scale']
if which == 'card':
    # The tabletop is the brightest thing across the middle of the canvas: for
    # each column, the row of the brightest pixel in the band the table lives in.
    band = slice(int((358 - SRC['cropPlate'][1]) * z) - 60, int((412 - SRC['cropPlate'][1]) * z) + 60)
    cols = range(int(0.30 * canvas.shape[1]), int(0.70 * canvas.shape[1]), 8)
    for label, img in (('sent   ', a), ('got    ', b)):
        rows = [band.start + int(np.argmax(img[band, x])) for x in cols]
        print(f'   {label} tabletop bright row: median {int(np.median(rows))}, '
              f'spread {int(np.percentile(rows, 90) - np.percentile(rows, 10))}')
else:
    cols = range(int(0.15 * canvas.shape[1]), int(0.90 * canvas.shape[1]), 24)
    for label, img in (('sent   ', a), ('got    ', b)):
        rows = [int(np.argmax(img[:, x])) for x in cols]
        fit = np.polyfit(list(cols), rows, 1)
        print(f'   {label} counter bright row: slope {fit[0]:+.4f}/px, '
              f'intercept {fit[1]:7.1f}')

json.dump({'schema': 1, 'cluster': which,
           'note': 'the furniture-registration gate, run before any human was extracted',
           'keptRegionPx': int(kept.sum()),
           'keptMeanAbsDiff': round(float(d[kept].mean()), 2),
           'keptFractionOver16': round(float((d[kept] > 16).mean()), 4),
           'keptFractionOver48': round(float((d[kept] > 48).mean()), 4),
           'bestTranslation': {'dx': best[1], 'dy': best[2], 'residual': round(float(best[0]), 2),
                               'atRest': round(float(np.abs(a - b)[kept].mean()), 2)}},
          open(f'proofs/room-03/registration-{which}.json', 'w'), indent=1)
open(f'proofs/room-03/registration-{which}.json', 'a').write('\n')
print(f'\nproofs/room-03/registration-{which}.json')
