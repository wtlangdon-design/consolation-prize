"""PHASE 1.5C -- ONE DIRT FLOOR, NO BOX RESTORE (doc 36 Q119).

    python3 tools/retrofit/nugget-floor-final.py [--restore-tight]

corrected-03 = corrected-02 everywhere outside the floor-03 mask (the accepted
plate with the cold stove), and the floor-03 result everywhere inside it --
under and between the furniture too. Nothing is restored by rectangle. The
furniture inside the mask is CHECKED against the accepted plate on tight
silhouettes (strict colour classes, small pieces dropped, no dilation) and the
mean difference reported; with --restore-tight those silhouettes alone are
taken from the accepted plate with a one-pixel feather. The lit-state fire
overlay is unchanged from corrected-02.
"""
import hashlib, json, os, shutil, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
ACC = 'art/staging/room-03/clean-plate-02/candidate-1920x864.png'
BASE = 'art/staging/room-03/corrected-02/plate-cold-dirt.png'
OP = 'art/staging/room-03/floor-03/candidate-1920x864.png'
MASK = 'art/staging/room-03/floor-03/floor-mask-plate.png'
OUT = 'art/staging/room-03/corrected-03'
os.makedirs(OUT, exist_ok=True)
A = np.array(Image.open(ACC).convert('RGB')).astype(float)
B = np.array(Image.open(BASE).convert('RGB')).astype(float)
R = np.array(Image.open(OP).convert('RGB')).astype(float)
inside = np.array(Image.open(MASK).convert('L')) > 127
H, W = A.shape[:2]
# a 3 px feather at the mask edge so the seam sits inside repainted floor
dist = ndimage.distance_transform_edt(inside)
w = np.clip(dist / 3.0, 0, 1)[..., None]
result = B * (1 - w) + R * w

# TIGHT FURNITURE SILHOUETTES in the accepted plate, inside the mask: seats
# (blue-grey: low saturation or off-brown hue, mid value), dark wood (legs,
# pedestal, chair backs: low value), brass (the spittoon: yellow, bright).
hsv = np.array(Image.open(ACC).convert('HSV')).astype(float)
hue, sat, val = hsv[..., 0], hsv[..., 1], hsv[..., 2]
seat = ((sat < 60) | (hue > 120)) & (val > 35) & (val < 170)
dark = val < 52
brass = (hue > 25) & (hue < 60) & (sat > 90) & (val > 120)
cand = (seat | dark | brass) & inside
boxes = [(1170, 490, 1285, 690), (1320, 535, 1440, 750), (1555, 610, 1710, 840), (1390, 755, 1500, 864), (630, 405, 725, 505), (712, 335, 1090, 510)]
inbox = np.zeros((H, W), bool)
for x0, y0, x1, y1 in boxes: inbox[y0:y1, x0:x1] = True
cand &= inbox
cand = ndimage.binary_opening(cand, structure=np.ones((2, 2)))
labels, n = ndimage.label(cand)
sizes = ndimage.sum(cand, labels, range(1, n + 1)) if n else []
keep = np.zeros_like(cand)
for i, s in enumerate(sizes, 1):
    if s >= 60: keep |= labels == i
furniture = keep
diff_f = np.abs(R - A).sum(-1)[furniture]
report = {'furniturePixelsTight': int(furniture.sum()), 'meanDiffOnFurniture_modelVsAccepted': float(diff_f.mean()) if furniture.any() else None,
          'fractionOver30': float((diff_f > 30).mean()) if furniture.any() else None}
if '--restore-tight' in sys.argv:
    fw = np.clip(ndimage.distance_transform_edt(furniture) / 1.5, 0, 1)[..., None]
    result = result * (1 - fw) + A * fw
    report['restored'] = 'tight silhouettes, 1px feather'
elif '--restore-spittoon' in sys.argv:
    # THE ONE OBJECT THE MODEL MOVED: it erased the brass spittoon at its
    # place (1400-1492 x 762-864) and painted a plain bucket by the near
    # stool's legs instead (~1630-1720 x 800-864). The spittoon is a hotspot,
    # an obstacle and canon ("positioned optimistically far from anyone
    # sitting down"), so it comes back where it stands: its AUTHORED
    # silhouette, read off the accepted plate on a grid, with a one-pixel
    # feather -- tight, no box. The stray bucket is covered with the result's
    # own floor from beside it, feathered, so no second object remains.
    from PIL import ImageDraw
    SPITTOON = [(1400, 768), (1420, 762), (1470, 762), (1492, 770), (1492, 800), (1484, 806), (1484, 846), (1492, 852), (1492, 864), (1400, 864), (1400, 852), (1408, 846), (1408, 806), (1400, 800)]
    poly = Image.new('L', (W, H), 0); ImageDraw.Draw(poly).polygon(SPITTOON, fill=255)
    tight = np.array(poly) > 0
    fw = np.clip(ndimage.distance_transform_edt(tight) / 1.5, 0, 1)[..., None]
    result = result * (1 - fw) + A * fw
    STRAY = (1622, 796, 1726, 864)
    cover = np.zeros((H, W), bool); cover[STRAY[1]:STRAY[3], STRAY[0]:STRAY[2]] = True
    # only where the result differs from the accepted dirt-free floor... the
    # accepted plate has planks there, so the cover is the result's own floor
    # taken 110 px to the left (open floor between the stools), feathered 4 px
    src = np.roll(result, 110, axis=1)
    cw = np.clip(ndimage.distance_transform_edt(cover) / 4.0, 0, 1)[..., None]
    result = result * (1 - cw) + src * cw
    report['restored'] = f'the spittoon, authored silhouette ({int(tight.sum())} px) from the accepted plate, 1px feather; the stray bucket at {STRAY} covered with the floor beside it'
else:
    report['restored'] = 'nothing: the model\'s furniture stands'
Image.fromarray((furniture * 255).astype('uint8')).save(f'{OUT}/furniture-tight-mask.png')
out = f'{OUT}/plate-cold-dirt.png'
Image.fromarray(np.clip(result, 0, 255).astype('uint8')).save(out)
shutil.copy('art/staging/room-03/corrected-02/stove-fire-overlay.png', f'{OUT}/stove-fire-overlay.png')
changed = np.abs(result - B).sum(-1) > 6
rec = {'schema': 1, 'note': __doc__.strip(), 'inputs': {ACC: sha(ACC), BASE: sha(BASE), OP: sha(OP), MASK: sha(MASK)}, 'output': {out: sha(out), f'{OUT}/stove-fire-overlay.png': sha(f'{OUT}/stove-fire-overlay.png')},
       'changedOutsideMask': int((changed & ~inside).sum()), 'floorPixels': int(inside.sum()), 'furnitureCheck': report, 'imageOperations': {'nugget-floor': 3, 'nugget-stove': 0}}
json.dump(rec, open(f'{OUT}/derivation.json', 'w'), indent=1); open(f'{OUT}/derivation.json', 'a').write('\n')
print(json.dumps({k: rec[k] for k in ('changedOutsideMask', 'furnitureCheck')}))
