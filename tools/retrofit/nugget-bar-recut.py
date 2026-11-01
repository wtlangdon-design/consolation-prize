"""Re-cut the Nugget's three bar bands from reference/room-03/cast/bar-v2.png.

Tyler, 2026-10-31, on the deployed Nugget: the front-right drinker "is messed
up when he moved" and the middle man's "head disappears when he moves". Both
were cutting errors from August, not the drawing:

  * the bands were made to TILE by moving the bar1/bar2 seam to x 284, which
    is inside the middle man's head -- his turn starts at x 216 -- so the left
    of his head stayed in bar1's band and never moved;
  * every band stopped 153 rows down, and two of the three poses change lower
    than that (the middle man to row 175, the drinker to row 235), so their
    bodies below the cut stayed in the rest pose under a moving top half.

THE SHEET IS SOUND: each pose changes only its own man, in three separate
column runs with clear columns between (45-125, 219-336, 470-668).

REGISTRATION, MEASURED: each 779 px panel BOX-resized to 791 x 499, one row
up, then a per-channel affine grade fitted on the shipped bands -- 2.76 mean
abs. The plate's baked lower half fits less tightly (7.5), so:

  * every band's REST frame is the current screen, pixel for pixel (plate plus
    the old bands), so nothing changes when nobody moves;
  * a MOVING frame replaces only the pixels its pose changes, graded;
  * below row 145 everything within 4 px of a change is redrawn too, so the
    plate's slightly offset copy of a moved object cannot show at an edge;
  * a pixel the pose uncovers above row 145 is left transparent (the plate is
    the room behind); below it, it is the plate's own panelling mirrored about
    row 144, because rows 147-153 of the plate carry remnants of the baked mug.

Seams sit in the empty columns (172, 403). All three bands share y 601 and
height 245, so check-bands-tile still groups and checks them.

Usage: python3 tools/retrofit/nugget-bar-recut.py <git-rev-with-the-old-bands> <out-dir>
"""
import io, json, subprocess, sys
import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation

REV, OUT = sys.argv[1], sys.argv[2]
def at(path): return Image.open(io.BytesIO(subprocess.check_output(['git', 'show', f'{REV}:{path}'])))
def js(path): return json.loads(subprocess.check_output(['git', 'show', f'{REV}:{path}']))

X0, Y0, BW, BH, CUT = 1126, 357, 791, 245, 145
plate = np.asarray(at('art/backgrounds/room-03-nugget.png').convert('RGB')).astype(float)[Y0:Y0+BH, X0:X0+BW]
# THE OLD BANDS, EXACTLY: their edges carry partial alpha (1420 px), so the rest
# frame is their RGBA untouched rather than a flattened copy.
OLD = np.zeros((BH, BW, 4)); xo = 0
for f in ['bar1', 'bar2', 'bar3']:
    x, y, w, h = js(f'content/ambient/nugget-{f}.json')['sprite']['frames'][0]
    OLD[:h, xo:xo+w] = np.asarray(at(f'art/actors/nugget-{f}.png').convert('RGBA').crop((x, y, x+w, y+h))).astype(float)
    xo += w
A0 = OLD[..., 3] > 0
k_ = OLD[..., 3:4] / 255.0
C = OLD[..., :3] * k_ + plate * (1 - k_)          # the screen as it is drawn now
src = Image.open('reference/room-03/cast/bar-v2.png').convert('RGB')
R = [np.asarray(src.crop((x, 0, x+779, 494)).resize((791, 499), Image.BOX)).astype(float)[1:1+BH]
     for x in [12, 835, 1658, 2481]]
mag = lambda a: (a[..., 0] > 170) & (a[..., 1] < 100) & (a[..., 2] > 170)
m0 = mag(R[0])
def fit(r0, r1, c0, c1, banded):
    s = np.zeros_like(m0); s[r0:r1, c0:c1] = True; s &= ~m0
    if banded: s &= A0
    X = np.c_[R[0][s], np.ones(s.sum())]
    return np.linalg.lstsq(X, C[s], rcond=None)[0]
up, lo = fit(0, 150, 0, BW, True), fit(150, BH, 430, 720, False)
grade = lambda r, cf: np.clip(np.c_[r.reshape(-1, 3), np.ones(r.size // 3)] @ cf, 0, 255).reshape(r.shape)
t = np.clip((np.arange(BH)[:, None, None] - 140) / 20, 0, 1)
G = lambda r: grade(r, up) * (1 - t) + grade(r, lo) * t
wall = plate.copy()
for r in range(CUT, BH): wall[r] = plate[max(0, 2 * (CUT - 1) - r)]

record = {}
for name, (c0, c1, k) in {'bar1': (0, 172, 1), 'bar2': (172, 403, 2), 'bar3': (403, 791, 3)}.items():
    moved = np.abs(R[k] - R[0]).sum(2) > 6
    assert not moved[:, :c0].any() and not moved[:, c1:].any(), f'{name}: pose {k} changes outside its band'
    margin = binary_dilation(moved, iterations=4); margin[:CUT] = False
    ch = moved | margin; ch[:, :c0] = False; ch[:, c1:] = False
    mk = mag(R[k]); Gk = G(R[k]); fill = ch & ~mk; vac = ch & mk
    rest = OLD.copy(); move = rest.copy()
    move[..., :3][fill] = Gk[fill]; move[..., 3][fill] = 255
    hi = vac.copy(); hi[CUT:] = False; low = vac.copy(); low[:CUT] = False
    move[..., 3][hi] = 0; move[..., :3][low] = wall[low]; move[..., 3][low] = 255
    w = c1 - c0
    sheet = np.zeros((BH + 4, 2 * w + 6, 4), np.uint8)
    sheet[2:2+BH, 2:2+w] = np.round(rest[:, c0:c1]); sheet[2:2+BH, w+4:w+4+w] = np.round(move[:, c0:c1])
    Image.fromarray(sheet, 'RGBA').save(f'{OUT}/nugget-{name}.png')
    record[name] = {'x': X0 + c0 + w // 2, 'y': Y0 + BH - 1, 'frames': [[2, 2, w, BH], [w + 4, 2, w, BH]],
                    'changed': int(moved.sum()), 'lowestChangedRow': int(np.nonzero(moved.any(1))[0].max())}
print(json.dumps(record, indent=1))
