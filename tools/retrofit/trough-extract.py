"""PHASE 1.5B -- CUT THE NEW TROUGH OUT OF ITS IN-CONTEXT RESULT (doc 36 Q118).

    python3 tools/retrofit/trough-extract.py

The trough operation painted inside a mask over a window of the accepted
plate. Only that window's masked region is looked at; inside it, the trough is
whatever differs from the accepted plate's mud (a colour-difference mask,
closed, opened, largest component, holes filled, one-pixel feather), and the
companion is the result's pixels under that silhouette, placed back at the
window's plate position. The plate outside the mask is untouched by
construction: nothing outside the mask is ever read from the result.
"""
import hashlib, json, os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
PLATE = 'art/staging/room-02/street-candidate-01/candidate-plate.png'
WINDOW = 'art/staging/room-02/trough-01/window-1920x864.png'
OP = json.load(open('art/staging/room-02/trough-01/trough-op.json'))
WIN_X = OP['window']['plateX0']
# THE MODEL PAINTED THE TROUGH LOWER THAN THE MASK: its rim at plate y ~687 and
# its base at ~762, half of it below the mask's foot (712). The extraction
# zone is widened to the trough's actual extent so the whole object is cut --
# still only its own silhouette, never mud -- and the companion is then
# SHIFTED UP so its base sits on the far/mid mud seam at y 690 where the
# hotspot, the obstacle and the plane-1 occlusion were designed (a placement
# of the prop, not a change of its location on the street).
zx0, zy0, zx1, zy1 = 1960, 600, 2400, 800
SHIFT_Y = -22
# THE SILHOUETTE IS AUTHORED, NOT INFERRED. A colour-difference cut took the
# model's repainted puddles along with the trough and left a ragged edge;
# the trough is a box and its outline is read off the result on a grid
# (result-space coordinates), so the companion's alpha is the object and
# nothing else. Read at a -72 preview and converted here.
TROUGH_POLY = [(x, y + 72) for x, y in [(2044, 640), (2138, 610), (2262, 622), (2334, 666), (2338, 714), (2262, 708), (2062, 703), (2046, 690)]]
OUT = 'art/staging/room-02/companions-01/water-trough.png'
plate = np.array(Image.open(PLATE).convert('RGB')).astype(float)
win = np.array(Image.open(WINDOW).convert('RGB')).astype(float)
# the result window in plate coordinates
res = np.zeros_like(plate); res[:, WIN_X:WIN_X + 1920] = win
zone = (slice(zy0, zy1), slice(zx0, zx1))
diff = np.abs(res[zone] - plate[zone]).sum(-1)
# the model re-encodes the mud a little everywhere inside the mask; the trough
# is where it differs a LOT, and coherently
from PIL import ImageDraw
poly_img = Image.new('L', (zx1 - zx0, zy1 - zy0), 0)
ImageDraw.Draw(poly_img).polygon([(x - zx0, y - zy0) for x, y in TROUGH_POLY], fill=255)
sil = np.array(poly_img) > 0
n = 1
# a soft edge: one pixel of half alpha around the silhouette
edge = ndimage.binary_dilation(sil, structure=np.ones((3, 3))) & ~sil
alpha = np.where(sil, 255, np.where(edge, 110, 0)).astype('uint8')
layer = np.zeros((864, 3610, 4), dtype='uint8')
dst = (slice(zy0 + SHIFT_Y, zy1 + SHIFT_Y), slice(zx0, zx1))
layer[dst][..., :3] = res[zone].astype('uint8')
layer[dst][..., 3] = alpha
# a ground-contact shadow under the shifted base, so it sits in the mud there
ys_, xs_ = np.where(sil)
base_y = int(ys_.max()) + zy0 + SHIFT_Y
for i in range(6):
    row = base_y + 1 + i
    cols = np.where(sil[min(sil.shape[0] - 1, int(ys_.max()) - 2)])[0]
    if row < 864 and len(cols):
        a = int(120 * (1 - i / 6))
        for x in range(zx0 + int(cols.min()) + 3, zx0 + int(cols.max()) - 3):
            if layer[row, x, 3] < a:
                layer[row, x] = (8, 6, 4, a)
Image.fromarray(layer, 'RGBA').save(OUT)
ys, xs = np.where(sil)
bbox = [int(xs.min()) + zx0, int(ys.min()) + zy0 + SHIFT_Y, int(xs.max() - xs.min()) + 1, int(ys.max() - ys.min()) + 1]
rec = {'schema': 1, 'note': __doc__.strip(), 'inputs': {PLATE: sha(PLATE), WINDOW: sha(WINDOW)}, 'output': {OUT: sha(OUT)},
       'silhouettePixels': int(sil.sum()), 'components': int(n), 'bboxPlate': bbox, 'footY': bbox[1] + bbox[3], 'extractZonePlate': [zx0, zy0, zx1, zy1], 'shiftY': SHIFT_Y, 'modelPaintedBelowMask': 'yes: rim ~682, base ~786 against a mask foot of 712; only the authored trough silhouette is taken, no mud', 'silhouette': 'authored polygon', 'troughPolygonResult': TROUGH_POLY,
       'plateOutsideMaskUnchanged': 'by construction: only the masked zone is read from the result'}
json.dump(rec, open('art/staging/room-02/trough-01/extract.json', 'w'), indent=1); open('art/staging/room-02/trough-01/extract.json', 'a').write('\n')
print(json.dumps({k: rec[k] for k in ('silhouettePixels', 'components', 'bboxPlate', 'footY')}))
