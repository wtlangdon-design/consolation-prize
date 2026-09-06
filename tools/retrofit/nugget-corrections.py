"""PHASE 1.5 -- THE NUGGET'S CANON CORRECTIONS, DETERMINISTIC FIRST (doc 36 Q117).

Two things the accepted clean plate (art/staging/room-03/clean-plate-02) gets
wrong against the writing, corrected here without an image operation where
that can be made convincing:

  STOVE   the fire is baked into the plate, and doc 16's third LISTEN says it
          has gone out. The fire pixels inside the firebox door are EXTRACTED
          as a lit-state overlay (alpha), and the base plate gets a cold
          firebox in the stove's own iron. Lit = base + overlay; out = base.
  FLOOR   the plate paints continuous planks; the chandelier's joke is brass
          and crystal over a DIRT floor (doc 05, doc 16). The main floor is
          re-materialised as compacted earth: the plate's own lighting kept
          (a wide low-pass of the floor), the plank seams closed, an earth
          grain laid over it, and every piece of furniture standing on the
          floor restored from the original pixels by mask, so nothing but the
          floor changes -- provably, since the furniture is the original.

    python3 tools/retrofit/nugget-corrections.py [--no-floor]

Writes art/staging/room-03/corrected-01/: plate-cold-dirt.png (the corrected
base), stove-fire-overlay.png (lit state), the masks, and derivation.json.
"""
import hashlib, json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
SRC = 'art/staging/room-03/clean-plate-02/candidate-1920x864.png'
OUT = 'art/staging/room-03/corrected-01'
os.makedirs(OUT, exist_ok=True)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
src = Image.open(SRC).convert('RGB')
A = np.array(src).astype(float)
H, W = A.shape[:2]
record = {'schema': 1, 'note': __doc__.strip(), 'source': {SRC: sha(SRC)}, 'imageOperations': 0}

# ---- STOVE ---------------------------------------------------------------
FIREBOX = (1070, 312, 1108, 356)          # the door opening, generous
x0, y0, x1, y1 = FIREBOX
win = A[y0:y1, x0:x1]
r, g, b = win[..., 0], win[..., 1], win[..., 2]
lum = win.mean(-1)
warm = (r > 110) & (r > b * 1.5) & (lum > 80)
# soften: alpha from how far past the threshold the pixel is
alpha = np.clip((r - 100) / 60, 0, 1) * warm
fire = np.zeros((H, W, 4), dtype='uint8')
fire[y0:y1, x0:x1, :3] = win.astype('uint8')
fire[y0:y1, x0:x1, 3] = (alpha * 255).astype('uint8')
Image.fromarray(fire, 'RGBA').save(f'{OUT}/stove-fire-overlay.png')
# The cold firebox: the stove's own iron, sampled from the body beside the door,
# laid where the fire was, darker toward the centre (an empty box is a hole).
iron = A[318:350, 1058:1068].reshape(-1, 3)
cold = A.copy()
rng = np.random.default_rng(3)
for yy in range(y0, y1):
    for xx in range(x0, x1):
        a = alpha[yy - y0, xx - x0]
        if a <= 0:
            continue
        base = iron[rng.integers(len(iron))] * 0.72
        cold[yy, xx] = cold[yy, xx] * (1 - a) + base * a
record['stove'] = {'firebox': list(FIREBOX), 'firePixels': int(warm.sum()), 'overlay': f'{OUT}/stove-fire-overlay.png'}

# ---- FLOOR ---------------------------------------------------------------
FLOOR_POLY = [(40, 640), (300, 606), (500, 532), (720, 506), (1200, 508), (1250, 528), (1920, 836), (1920, 864), (40, 864)]
poly = Image.new('L', (W, H), 0)
ImageDraw.Draw(poly).polygon(FLOOR_POLY, fill=255)
inside = np.array(poly) > 0
if '--no-floor' not in sys.argv:
    # 1. what is floor: the plank colour is a warm mid brown whose hue and
    #    saturation are steady; furniture is darker, bluer (stool seats), or
    #    brass (the spittoon). Classify by distance from a smoothed local
    #    floor estimate taken on clearly-floor pixels.
    hsv = np.array(src.convert('HSV')).astype(float)
    hue, sat, val = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    plankish = inside & (hue > 10) & (hue < 40) & (sat > 60) & (val > 40)
    # a wide median of the value on plankish pixels gives the lighting field
    from scipy import ndimage
    est = np.zeros((H, W)); cnt = np.zeros((H, W))
    est[plankish] = val[plankish]; cnt[plankish] = 1
    k = 41
    est_s = ndimage.uniform_filter(est, k); cnt_s = ndimage.uniform_filter(cnt, k)
    local = est_s / np.maximum(cnt_s, 1e-6)
    floor = inside & plankish & (np.abs(val - local) < 38)
    # seams are thin and dark: close them
    floor = ndimage.binary_closing(floor, structure=np.ones((5, 5)))
    floor = ndimage.binary_opening(floor, structure=np.ones((3, 3)))
    floor &= inside
    # furniture = inside but not floor; dilate it by 1 so its edges survive
    furniture = inside & ~floor
    furniture = ndimage.binary_dilation(furniture, structure=np.ones((3, 3)))
    floor = inside & ~furniture
    Image.fromarray((floor * 255).astype('uint8')).save(f'{OUT}/floor-mask.png')
    Image.fromarray((furniture * 255).astype('uint8')).save(f'{OUT}/furniture-mask.png')

    # 2. the lighting field: a low-pass of the plate over floor pixels only
    #    (normalised so furniture does not bleed in), which keeps the stove
    #    pool, the door light and the depth falloff and drops the planks.
    blur = np.zeros_like(A); wsum = np.zeros((H, W))
    for c in range(3):
        blur[..., c] = ndimage.gaussian_filter(A[..., c] * floor, 9)
    wsum = ndimage.gaussian_filter(floor.astype(float), 9)
    lit = blur / np.maximum(wsum, 1e-6)[..., None]

    # 3. earth: a grain of three octaves, seeded; compacted, not muddy --
    #    amplitude small, and finer nearer the frame's foot with the depth.
    rng = np.random.default_rng(20260905)
    def octave(cell):
        gy, gx = H // cell + 2, W // cell + 2
        grid = rng.random((gy, gx))
        big = np.array(Image.fromarray((grid * 255).astype('uint8')).resize((gx * cell, gy * cell), Image.BILINEAR)).astype(float) / 255
        return big[:H, :W]
    grain = 0.55 * octave(48) + 0.3 * octave(16) + 0.15 * octave(5)
    grain = (grain - grain.mean()) / (grain.std() + 1e-6)
    specks = rng.random((H, W)) < 0.012
    # traffic: a soft dark path from the doors to the bar, worn
    path = np.zeros((H, W))
    yy, xx = np.mgrid[0:H, 0:W]
    for (ax, ay), (bx, by) in [((180, 760), (1100, 720)), ((1100, 720), (1500, 800)), ((700, 700), (760, 560))]:
        t = np.clip(((xx - ax) * (bx - ax) + (yy - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2 + 1e-6), 0, 1)
        d = np.hypot(xx - (ax + t * (bx - ax)), yy - (ay + t * (by - ay)))
        path = np.maximum(path, np.exp(-(d / 70) ** 2))
    earth = lit.copy()
    # toward earth: a touch less orange, a touch more grey-ochre
    earth[..., 0] *= 0.97; earth[..., 1] *= 0.99; earth[..., 2] *= 1.06
    mult = 1 + 0.085 * grain - 0.06 * path
    mult[specks] *= 0.78
    earth = np.clip(earth * mult[..., None], 0, 255)
    # 4. restore: floor pixels take the earth, everything else stays the plate
    result = cold.copy()
    result[floor] = earth[floor]
    # a 1px soft seam at furniture feet so the restore does not cut hard
    edge = ndimage.binary_dilation(furniture, structure=np.ones((3, 3))) & floor
    result[edge] = 0.5 * result[edge] + 0.5 * cold[edge]
    record['floor'] = {'polygon': FLOOR_POLY, 'floorPixels': int(floor.sum()), 'furniturePixelsRestored': int((furniture & inside).sum()),
                       'method': 'deterministic: low-pass lighting field + seeded three-octave earth grain + worn traffic paths + specks; furniture restored from the original by mask',
                       'masks': [f'{OUT}/floor-mask.png', f'{OUT}/furniture-mask.png']}
else:
    result = cold
out = f'{OUT}/plate-cold-dirt.png'
Image.fromarray(result.astype('uint8')).save(out)
record['output'] = {out: sha(out)}
# prove what changed: pixels outside the floor mask and the firebox
changed = np.abs(result - A).sum(-1) > 6
outside = changed & ~inside
outside[y0:y1, x0:x1] = False
record['changedOutsideFloorAndFirebox'] = int(outside.sum())
json.dump(record, open(f'{OUT}/derivation.json', 'w'), indent=1); open(f'{OUT}/derivation.json', 'a').write('\n')
print(json.dumps({k: v for k, v in record.items() if k in ('stove', 'changedOutsideFloorAndFirebox')}), record.get('floor', {}).get('floorPixels'))
