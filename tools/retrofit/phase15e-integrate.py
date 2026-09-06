"""PHASE 1.5E -- THE LOCAL REPAIRS BECOME PLATE (doc 36 Q121).

    python3 tools/retrofit/phase15e-integrate.py a
    python3 tools/retrofit/phase15e-integrate.py b

Each region's masked zone, scaled back to 1:1 by the driver, is composited
INTO the plate -- a new plate file, art/staging/room-02/street-candidate-03/
candidate-plate.png -- with the zone's edge feathered over 8 px inside the
zone, so the seam falls in the model's own repainted wall or mud. `a` starts
from the accepted candidate-01 plate; `b` continues from the plate `a` wrote.
Nothing outside a zone is read from a result. The board's structure and its
ordinary papers are now environment; the Act III funeral sheet is the one
thing that changes and stays an overlay, cut here as a SHEET-ONLY full-frame
RGBA companion pinned to the new board's face (no board pixels in it). The
trough is environment; its occlusion is the room's plane-1 mask, authored
separately from the new geometry.
"""
import hashlib, json, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
SRC = 'art/staging/room-02/street-candidate-01/candidate-plate.png'
OUT = 'art/staging/room-02/street-candidate-03'
PLATE = f'{OUT}/candidate-plate.png'
W, H = 3610, 864


def composite_zone(base, op_dir, feather=8):
    op = json.load(open(f'{op_dir}/repair-op.json'))
    x0, y0, x1, y1 = op['region']; zx0, zy0, zx1, zy1 = op['zonePlate']
    loc = np.array(Image.open(f'{op_dir}/local-1to1.png').convert('RGB')).astype(float)
    zone = np.ones((zy1 - zy0, zx1 - zx0), bool)
    dist = ndimage.distance_transform_edt(np.pad(zone, 1))[1:-1, 1:-1]
    alpha = np.clip(dist / feather, 0, 1)[..., None]
    patch = loc[zy0 - y0:zy1 - y0, zx0 - x0:zx1 - x0]
    before = base[zy0:zy1, zx0:zx1].astype(float)
    base[zy0:zy1, zx0:zx1] = np.clip(patch * alpha + before * (1 - alpha), 0, 255).astype('uint8')
    return op


def aged_sheet(scale):
    """The Phase 1.5B deterministic paper treatment of the authored clean sheet (no wording invented)."""
    SHEET = 'art/objects/room-02/posted-notices-act3.png'
    sheet = Image.open(SHEET).convert('RGBA')
    sheet = sheet.resize((max(1, round(sheet.width * scale)), max(1, round(sheet.height * scale))), Image.LANCZOS)
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
rec_path = f'{OUT}/integrate.json'
rec = json.load(open(rec_path)) if os.path.exists(rec_path) else {'schema': 1, 'note': __doc__.strip(), 'source': {SRC: sha(SRC)}, 'steps': []}
if which == 'a':
    base = np.array(Image.open(SRC).convert('RGB'))
    op = composite_zone(base, 'art/staging/room-02/repair-a')
    Image.fromarray(base, 'RGB').save(PLATE)
    # THE NEW BOARD'S FACE, read off the result at 3x: frame x 1605-1727, y 412-507
    # (cap 412-428, posts to the boardwalk ~590); the inner face x 1612-1720, y 428-500.
    FACE = (1612, 428, 1720, 500)
    face_h = FACE[3] - FACE[1]
    raw = Image.open('art/objects/room-02/posted-notices-act3.png')
    scale = round(min(1.15, (face_h * 0.80) / raw.height), 3)
    sheet = aged_sheet(scale)
    sx = (FACE[0] + FACE[2]) // 2 - sheet.width // 2; sy = FACE[1] + 6
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    shadow = Image.new('RGBA', (sheet.width + 6, sheet.height + 6), (0, 0, 0, 0)); ImageDraw.Draw(shadow).rectangle([3, 3, sheet.width + 2, sheet.height + 2], fill=(0, 0, 0, 90))
    layer.alpha_composite(shadow, (sx, sy)); layer.alpha_composite(sheet, (sx, sy))
    ImageDraw.Draw(layer).ellipse([sx + sheet.width // 2 - 3, sy + 3, sx + sheet.width // 2 + 3, sy + 9], fill=(70, 52, 34, 255))
    layer.save(f'{OUT}/notices-funeral-sheet.png')
    rec['steps'] = [s for s in rec['steps'] if s['region'] != 'a'] + [{'region': 'a', 'op': op['purpose'], 'zonePlate': op['zonePlate'], 'feather': 8,
        'input': {'art/staging/room-02/repair-a/local-1to1.png': sha('art/staging/room-02/repair-a/local-1to1.png')},
        'boardFrame': [1605, 412, 1727, 507], 'boardFace': list(FACE), 'funeralSheet': {'path': f'{OUT}/notices-funeral-sheet.png', 'sha256': sha(f'{OUT}/notices-funeral-sheet.png'), 'scale': scale, 'at': [sx, sy], 'size': [sheet.width, sheet.height]}}]
    print('A integrated; sheet', sheet.size, 'at', (sx, sy), 'scale', scale)
elif which == 'b':
    base = np.array(Image.open(PLATE).convert('RGB'))
    op = composite_zone(base, 'art/staging/room-02/repair-b')
    Image.fromarray(base, 'RGB').save(PLATE)
    rec['steps'] = [s for s in rec['steps'] if s['region'] != 'b'] + [{'region': 'b', 'op': op['purpose'], 'zonePlate': op['zonePlate'], 'feather': 8,
        'input': {'art/staging/room-02/repair-b/local-1to1.png': sha('art/staging/room-02/repair-b/local-1to1.png')}}]
    print('B integrated')
rec['output'] = {PLATE: sha(PLATE)}
json.dump(rec, open(rec_path, 'w'), indent=1); open(rec_path, 'a').write('\n')
