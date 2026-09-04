#!/usr/bin/env python3
"""Lift a night plate's WORK AREA a little, and let the stove bounce into it.

Tyler's lighting-balance correction on the Room 5 night candidate: the room
read as too dark for Winnie to be writing at the counter. Not a regrade of
the plate and not a new light: one feathered region around the counter and
the shelves is lifted by a modest factor, and the already-authored stove's
warmth is allowed to reach a little further into the left and central work
area. The exterior glazing is excluded so the night outside is untouched;
the corners fall off to no change, so the room stays a cold night with a
brighter place to work in.

Deterministic and hue-preserving: every pixel is scaled, never repainted.

    python3 tools/grade/lift-work-area.py <night.png> <out.png> <grade.json> [--lift 0.22] [--bounce 0.12]

Writes the graded plate and a record of every parameter, the source hash
and the output hash, with before/after mean luminance by region.
"""
import hashlib, json, sys
import numpy as np
from PIL import Image

src, out, rec = sys.argv[1:4]
def arg(name, default):
    return float(sys.argv[sys.argv.index(name) + 1]) if name in sys.argv else default
LIFT = arg('--lift', 0.22)        # peak multiplicative lift in the work area
BOUNCE = arg('--bounce', 0.12)    # peak stove bounce (luma gain) beside the stove

a = np.array(Image.open(src).convert('RGB')).astype(float)
H, W = a.shape[:2]
yy, xx = np.mgrid[0:H, 0:W].astype(float)

# THE WORK AREA: a raised-cosine window over the counter, the ledger, the
# shelves and the scales -- everything Winnie works with -- centred on the
# ledger. 1.0 inside the core, feathering to 0 well before the corners.
CENTRE = (1000.0, 380.0); CORE = (430.0, 260.0); FEATHER = (380.0, 300.0)
def window(v, c, core, feather):
    d = np.abs(v - c)
    t = np.clip((d - core) / feather, 0.0, 1.0)
    return 0.5 * (1.0 + np.cos(np.pi * t))
work = window(xx, CENTRE[0], CORE[0], FEATHER[0]) * window(yy, CENTRE[1], CORE[1], FEATHER[1])

# THE NIGHT OUTSIDE STAYS: the door's glazed panel and the window opening.
GLAZING = [(88, 30, 225, 350), (415, 0, 570, 380)]
for x0, y0, x1, y1 in GLAZING:
    work[y0:y1, x0:x1] = 0.0

# THE STOVE'S BOUNCE: a radial warm gain from the firebox, reaching into the
# left and central work area and no further. Its own body is left alone.
FIREBOX = (590.0, 515.0); REACH = 470.0
d = np.hypot(xx - FIREBOX[0], yy - FIREBOX[1])
bounce = BOUNCE * np.exp(-(d / REACH) ** 2)
bounce[430:680, 515:700] = 0.0            # the stove itself
for x0, y0, x1, y1 in GLAZING: bounce[y0:y1, x0:x1] = 0.0

gain = 1.0 + LIFT * work + bounce
graded = a * gain[..., None]
# warmth from the stove: a small push toward red/yellow where the bounce is
graded[..., 0] += bounce * a[..., 0] * 0.9
graded[..., 1] += bounce * a[..., 1] * 0.35
graded = np.clip(graded, 0, 255)
Image.fromarray(graded.astype(np.uint8)).save(out)

def lum(img):
    return 0.299 * img[..., 0] + 0.587 * img[..., 1] + 0.114 * img[..., 2]
REGIONS = {'winnie face': (1005, 230, 1065, 300), 'hands + ledger': (960, 370, 1150, 410), 'counter front': (700, 440, 1490, 700),
           'scales': (1228, 185, 1378, 395), 'bottles': (898, 84, 1364, 366), 'stove body': (520, 430, 695, 673),
           'floor centre': (700, 720, 1300, 860), 'ceiling corner TL': (0, 0, 300, 60), 'right corner': (1750, 0, 1920, 300),
           'window glass': (420, 0, 560, 370), 'door glass': (90, 40, 220, 340), 'bench': (1690, 535, 1920, 785)}
L0, L1 = lum(a), lum(graded)
rows = []
for k, (x0, y0, x1, y1) in REGIONS.items():
    b, af = float(L0[y0:y1, x0:x1].mean()), float(L1[y0:y1, x0:x1].mean())
    rows.append({'region': k, 'box': [x0, y0, x1, y1], 'before': round(b, 1), 'after': round(af, 1), 'liftPct': round(100 * (af / b - 1), 1) if b else None})
    print(f"{k:20s} {b:6.1f} -> {af:6.1f}  ({rows[-1]['liftPct']:+.1f}%)")
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
json.dump({'note': 'Deterministic work-area lift on the Room 5 night candidate (tools/grade/lift-work-area.py). Hue-preserving multiplicative gain in a raised-cosine window over the counter and shelves, plus the stove\'s radial warm bounce; exterior glazing excluded; corners unchanged. No pixel repainted, no light source added.',
           'source': {'path': src, 'sha256': sha(src)}, 'output': {'path': out, 'sha256': sha(out)},
           'parameters': {'lift': LIFT, 'bounce': BOUNCE, 'workWindow': {'centre': CENTRE, 'core': CORE, 'feather': FEATHER}, 'glazingExcluded': GLAZING,
                          'stove': {'firebox': FIREBOX, 'reach': REACH, 'bodyExcluded': [515, 430, 700, 680], 'warmth': {'r': 0.9, 'g': 0.35}}},
           'regions': rows}, open(rec, 'w'), indent=1)
