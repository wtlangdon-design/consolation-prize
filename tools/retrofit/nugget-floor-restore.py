"""PHASE 1.5 -- ASSEMBLE THE CORRECTED NUGGET BASE PLATE (doc 36 Q117).

    python3 tools/retrofit/nugget-floor-restore.py

Takes the accepted clean plate (clean-plate-02) as the base, lays the floor
operation's result (floor-01) over it ONLY where the floor mask says floor and
the source says "not furniture", puts the stove out (its fire lifted into a
lit-state overlay), and writes art/staging/room-03/corrected-01/
plate-cold-dirt.png with a byte-level record: every pixel outside the floor
mask is the accepted plate's own, and inside it every furniture pixel is the
accepted plate's own. Whatever the model did to a stool is undone.
"""
import hashlib, json, os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
SRC = 'art/staging/room-03/clean-plate-02/candidate-1920x864.png'
OP = 'art/staging/room-03/floor-01/candidate-1920x864.png'
MASK = 'art/staging/room-03/floor-01/floor-mask-plate.png'
OUT = 'art/staging/room-03/corrected-01'
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
A = np.array(Image.open(SRC).convert('RGB')).astype(float)
B = np.array(Image.open(OP).convert('RGB')).astype(float)
H, W = A.shape[:2]
inside = np.array(Image.open(MASK).convert('L')) > 127

# FURNITURE INSIDE THE FLOOR: the three stools, the spittoon, the piano stool
# and the chair feet -- classified inside their boxes as "not plank": the
# plank floor is a warm mid brown of steady hue; a stool seat is blue-grey, a
# leg is near-black, the spittoon is brass.
BOXES = {'stool_1': (1170, 490, 1285, 690), 'stool_2': (1320, 535, 1440, 750), 'stool_3': (1555, 610, 1710, 840),
         'spittoon': (1390, 755, 1500, 864), 'piano_stool': (630, 405, 725, 505), 'chair_feet': (710, 425, 1090, 520)}
hsv = np.array(Image.open(SRC).convert('HSV')).astype(float)
hue, sat, val = hsv[..., 0], hsv[..., 1], hsv[..., 2]
furniture = np.zeros((H, W), bool)
for name, (x0, y0, x1, y1) in BOXES.items():
    win = (slice(y0, y1), slice(x0, x1))
    plank = (hue[win] > 8) & (hue[win] < 42) & (sat[win] > 55) & (val[win] > 45) & (val[win] < 200)
    f = ~plank
    f = ndimage.binary_opening(f, structure=np.ones((2, 2)))
    f = ndimage.binary_closing(f, structure=np.ones((3, 3)))
    furniture[win] |= f
furniture &= inside
furniture = ndimage.binary_dilation(furniture, structure=np.ones((3, 3))) & inside
Image.fromarray((furniture * 255).astype('uint8')).save(f'{OUT}/furniture-restore-mask.png')

take = inside & ~furniture
result = A.copy()
result[take] = B[take]
# a soft 1px seam at the furniture feet
edge = ndimage.binary_dilation(furniture, structure=np.ones((3, 3))) & take
result[edge] = 0.5 * B[edge] + 0.5 * A[edge]

# THE STOVE OUT, the fire lifted (as tools/retrofit/nugget-corrections.py)
FIREBOX = (1070, 312, 1108, 356)
x0, y0, x1, y1 = FIREBOX
win = A[y0:y1, x0:x1]
r, b = win[..., 0], win[..., 2]
alpha = np.clip((r - 90) / 50, 0, 1) * ((r > 100) & (r > b * 1.35))
fire = np.zeros((H, W, 4), dtype='uint8')
fire[y0:y1, x0:x1, :3] = win.astype('uint8'); fire[y0:y1, x0:x1, 3] = (alpha * 255).astype('uint8')
Image.fromarray(fire, 'RGBA').save(f'{OUT}/stove-fire-overlay.png')
iron = A[318:350, 1058:1068].reshape(-1, 3)
rng = np.random.default_rng(3)
box = result[y0:y1, x0:x1]
# the whole aperture goes cold: any warmth inside the door is replaced with
# dark iron, so no ember glow survives in the OUT state
for yy in range(y1 - y0):
    for xx in range(x1 - x0):
        px = A[y0 + yy, x0 + xx]
        warmth = np.clip((px[0] - px[2]) / 60, 0, 1) if px[0] > 70 else 0
        if warmth > 0:
            base = iron[rng.integers(len(iron))] * 0.62
            box[yy, xx] = box[yy, xx] * (1 - warmth) + base * warmth
result[y0:y1, x0:x1] = box
# and the door's aperture itself -- the opening the fire showed through --
# is filled with dark iron whatever colour it was, so no ember survives
AX0, AY0, AX1, AY1 = 1078, 321, 1101, 352
for yy in range(AY0, AY1):
    for xx in range(AX0, AX1):
        result[yy, xx] = iron[rng.integers(len(iron))] * (0.42 + 0.08 * rng.random())

out = f'{OUT}/plate-cold-dirt.png'
Image.fromarray(np.clip(result, 0, 255).astype('uint8')).save(out)
changed = np.abs(result - A).sum(-1) > 6
outside = changed & ~inside; outside[y0:y1, x0:x1] = False
rec = {'schema': 1, 'note': __doc__.strip(), 'inputs': {SRC: sha(SRC), OP: sha(OP), MASK: sha(MASK)}, 'output': {out: sha(out)},
       'furnitureBoxes': BOXES, 'furniturePixelsRestored': int(furniture.sum()), 'floorPixelsTaken': int(take.sum()),
       'changedOutsideFloorAndFirebox': int(outside.sum()), 'changedInsideFurniture': int((changed & furniture).sum()),
       'stove': {'firebox': list(FIREBOX), 'overlay': f'{OUT}/stove-fire-overlay.png', 'firePixels': int((alpha > 0).sum())},
       'imageOperations': {'nugget-floor': 1, 'nugget-stove': 0},
       'modelDriftOutsideMaskUndone': int(((np.abs(B - A).sum(-1) > 6) & ~inside).sum())}
json.dump(rec, open(f'{OUT}/derivation.json', 'w'), indent=1); open(f'{OUT}/derivation.json', 'a').write('\n')
print(json.dumps({k: v for k, v in rec.items() if k not in ('note', 'inputs', 'furnitureBoxes')}))
