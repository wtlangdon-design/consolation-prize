"""PHASE 1.5D -- INTEGRATE THE LOCAL RESULTS AS THE OBJECTS' STATE IMAGES (doc 36 Q120).

    python3 tools/retrofit/phase15d-integrate.py board
    python3 tools/retrofit/phase15d-integrate.py trough

Each local operation's masked zone, scaled back to 1:1 by the driver, becomes
a full-frame RGBA companion over the UNCHANGED plate: the zone's pixels with
an alpha that is 1 inside and feathers to 0 over the last 8 px inside the
zone's edge, so the seam falls in the model's own repainted wall or mud, which
matches the plate it was painted from. The plate file is not touched.

  board   -> companions-02/notices-board.png (ORDINARY) and notices-funeral.png
             (the same board with the aged funeral sheet from Phase 1.5B)
  trough  -> companions-02/water-trough.png (FILLED); the plane-1 occlusion
             mask is a separate authored silhouette, trough-plane-1.png
"""
import hashlib, json, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
OUT = 'art/staging/room-02/companions-02'
os.makedirs(OUT, exist_ok=True)
W, H = 3610, 864


def companion(op_dir, op_name, feather=8):
    op = json.load(open(f'{op_dir}/{op_name}-op.json'))
    x0, y0, x1, y1 = op['region']; zx0, zy0, zx1, zy1 = op['zonePlate']
    loc = np.array(Image.open(f'{op_dir}/local-1to1.png').convert('RGB'))
    layer = np.zeros((H, W, 4), dtype='uint8')
    zone = np.zeros((zy1 - zy0, zx1 - zx0), bool); zone[:] = True
    dist = ndimage.distance_transform_edt(np.pad(zone, 1))[1:-1, 1:-1]
    alpha = np.clip(dist / feather, 0, 1)
    layer[zy0:zy1, zx0:zx1, :3] = loc[zy0 - y0:zy1 - y0, zx0 - x0:zx1 - x0]
    layer[zy0:zy1, zx0:zx1, 3] = (alpha * 255).astype('uint8')
    return layer, op


def aged_sheet():
    """The Phase 1.5B deterministic paper treatment of the authored clean sheet."""
    SHEET = 'art/objects/room-02/posted-notices-act3.png'
    sheet = Image.open(SHEET).convert('RGBA')
    sheet = sheet.resize((round(sheet.width * 1.15), round(sheet.height * 1.15)), Image.LANCZOS)   # smaller than 1.5B: the other papers stay visible round it
    sa = np.array(sheet).astype(float); rng = np.random.default_rng(20260906); h, w = sa.shape[:2]
    paper = np.array([214, 196, 158], float); tone = sa[..., :3] / 255.0
    sa[..., :3] = paper * (0.55 + 0.45 * tone.mean(-1, keepdims=True))
    fibre = rng.normal(0, 1, (h, w)); fibre = (fibre + np.roll(fibre, 1, 1) + np.roll(fibre, 1, 0)) / 3
    sa[..., :3] *= (1 + 0.035 * fibre)[..., None]
    yy, xx = np.mgrid[0:h, 0:w]; edge = np.minimum(np.minimum(xx, w - 1 - xx), np.minimum(yy, h - 1 - yy)); wear = np.clip(edge / 6.0, 0, 1)
    sa[..., :3] *= (0.78 + 0.22 * wear)[..., None]
    for row, wid, dark in [(14, 0.62, 0.40), (24, 0.5, 0.40)] + [(38 + 7 * i, 0.72, 0.28) for i in range(8)]:
        if row + 3 >= h: break
        a0 = int(w * (1 - wid) / 2); a1 = int(w * (1 + wid) / 2); seg = sa[row:row + 3, a0:a1, :3]; breaks = rng.random(a1 - a0) > 0.18; seg[:, breaks] *= (1 - dark)
    sa[..., :3] *= 0.56; sa[..., 3] = sa[..., 3] * (0.85 + 0.15 * wear)
    return Image.fromarray(np.clip(sa, 0, 255).astype('uint8'), 'RGBA')


which = sys.argv[1]
if which == 'board':
    layer, op = companion('art/staging/room-02/board-01', 'board')
    board = Image.fromarray(layer, 'RGBA'); board.save(f'{OUT}/notices-board.png')
    # THE BOARD'S FACE, read off the result: frame 1632-1755 x 400-520; the sheet pinned centre-top
    FACE = (1640, 406, 1748, 514)
    fun = board.copy(); sheet = aged_sheet()
    sx = (FACE[0] + FACE[2]) // 2 - sheet.width // 2; sy = FACE[1] + 10
    shadow = Image.new('RGBA', (sheet.width + 6, sheet.height + 6), (0, 0, 0, 0)); ImageDraw.Draw(shadow).rectangle([3, 3, sheet.width + 2, sheet.height + 2], fill=(0, 0, 0, 90))
    fun.alpha_composite(shadow, (sx, sy)); fun.alpha_composite(sheet, (sx, sy))
    d = ImageDraw.Draw(fun); d.ellipse([sx + sheet.width // 2 - 3, sy + 3, sx + sheet.width // 2 + 3, sy + 9], fill=(70, 52, 34, 255))
    fun.save(f'{OUT}/notices-funeral.png')
    rec = {'schema': 1, 'note': __doc__.strip(), 'op': op['purpose'], 'inputs': {f'art/staging/room-02/board-01/local-1to1.png': sha('art/staging/room-02/board-01/local-1to1.png')}, 'outputs': {f'{OUT}/notices-board.png': sha(f'{OUT}/notices-board.png'), f'{OUT}/notices-funeral.png': sha(f'{OUT}/notices-funeral.png')}, 'boardFace': list(FACE), 'sheetAt': [sx, sy], 'feather': 8}
    json.dump(rec, open(f'{OUT}/board-integrate.json', 'w'), indent=1); open(f'{OUT}/board-integrate.json', 'a').write('\n'); print('board integrated', FACE)
elif which == 'trough':
    layer, op = companion('art/staging/room-02/trough-02', 'trough')
    Image.fromarray(layer, 'RGBA').save(f'{OUT}/water-trough.png')
    poly = json.load(open('art/staging/room-02/trough-02/silhouette.json'))['polygon']
    mask = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(mask).polygon([tuple(p) for p in poly], fill=(255, 255, 255, 255))
    mask.save(f'{OUT}/trough-plane-1.png')
    rec = {'schema': 1, 'note': __doc__.strip(), 'op': op['purpose'], 'inputs': {'art/staging/room-02/trough-02/local-1to1.png': sha('art/staging/room-02/trough-02/local-1to1.png')}, 'outputs': {f'{OUT}/water-trough.png': sha(f'{OUT}/water-trough.png'), f'{OUT}/trough-plane-1.png': sha(f'{OUT}/trough-plane-1.png')}, 'silhouette': poly, 'feather': 8}
    json.dump(rec, open(f'{OUT}/trough-integrate.json', 'w'), indent=1); open(f'{OUT}/trough-integrate.json', 'a').write('\n'); print('trough integrated')
