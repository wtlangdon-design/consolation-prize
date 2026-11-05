"""Room 12's graybox: ruling 22 steps 1-6, before any art (errata 22).

The Mercantile as masses only -- a value block, the walkable band and the
door, doc 54's twenty-four subjects as silhouettes, Thad at every depth, and
the LEGIBILITY GATE run against it (rulings 16, 17c, 18a).

Night, one visual state: the store is on Main Street, whose base state is
night (errata 64a). Nobody is drawn: the proprietor is in the back room (doc
49, THE CALICO). The catalogue is one thick book open on the counter, its five
written sections as paper slips standing up out of it and the order form loose
beside it (errata 85). Every position is a staging decision under the
standing delegation, recorded in errata 85.

Writes renders/room-12-graybox.png, renders/room-12-graybox-with-thad.png,
reference/room-12/layout-1536x1024.png and proofs/room-12/graybox.json.
"""
import json
import os

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1920, 864

THAD = os.path.join(ROOT, 'art/actors/thad-idle-right/idle-00.png')

# THE DEPTH: Room 5's interior numbers (a standing man of 470 at y 700, 0.69
# per row), sampled at this room's walk band.
FAR = (740, 497)
NEAR = (850, 573)

# SURFACES (step 1). The Mercantile's identity (errata 17b): warm, but broken
# up by fabric, tin and printed labels. Night: a hanging lamp over the counter.
SURFACES = [
    ('ceiling shadow', (0, 0, 1920, 50), 36),
    ('walls, plank and shelving', (0, 50, 1920, 640), 84),
    ('floor, worn boards', (0, 690, 1920, 174), 90),
]
OBJECTS = [
    ('THE STREET DOOR', (30, 150, 180, 540), 60, 'behind'),
    ('THE BOOTS', (230, 110, 150, 140), 70, 'behind'),
    ('THE PICKAXES', (230, 270, 150, 420), 64, 'behind'),
    ('THE SHOVELS', (390, 470, 110, 220), 70, 'behind'),
    ('THE PANS', (400, 60, 110, 390), 92, 'behind'),
    ('THE PRICE LIST', (560, 90, 220, 150), 94, 'behind'),
    ('THE STOVE', (560, 380, 150, 310), 56, 'behind'),
    ('THE DYNAMITE CRATE', (720, 600, 110, 90), 72, 'behind'),
    ('THE CALICO', (850, 500, 170, 190), 88, 'behind'),
    ('TINNED GOODS', (1060, 110, 300, 300), 76, 'behind'),
    ("DR. PURVIS'S TONIC", (1380, 160, 160, 140), 70, 'behind'),
    ('THE UNSOLD SCALES', (1560, 100, 200, 170), 90, 'behind'),
    ('THE LAMP OIL', (1560, 300, 180, 130), 66, 'behind'),
    ('THE COUNTER', (1040, 470, 640, 220), 60, 'behind'),
    ('THE SCALES', (1080, 400, 110, 70), 94, 'behind'),
    ('THE CREDIT LEDGER', (1210, 430, 120, 40), 90, 'behind'),
    ('THE CATALOGUE', (1350, 420, 160, 50), 88, 'behind'),
    ('THE CATALOGUE slips', (1350, 380, 160, 40), 94, 'behind'),
    ('THE CATALOGUE — ORDER FORM', (1520, 440, 70, 30), 94, 'behind'),
    ('THE PICKLE JAR', (1610, 360, 70, 110), 88, 'behind'),
    ('THE NAILS', (1700, 590, 100, 100), 64, 'behind'),
]
BOTTLE_ROWS = []
MARKS = {'entrance': (300, 790, 'right')}
WALK = (210, 740, 1670, 110)
HEAD_AREA = int((FAR[1] * 0.13) ** 2) * 2
EXIT = ('THE STREET DOOR', 'main_street')


def height_at(y):
    (fy, fh), (ny, nh) = FAR, NEAR
    return fh + (nh - fh) * (y - fy) / (ny - fy)


def thad_sprite():
    img = Image.open(THAD).convert('RGBA')
    return img.crop(img.getbbox())


def anchors(img):
    a = np.asarray(img).astype(float)
    m = a[..., 3] > 200
    lum = (0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2])[m]
    s = np.sort(lum)
    return float(s[: int(len(s) * 0.4)].mean()), float(s[int(len(s) * 0.85):].mean())


def main():
    plate = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(plate)
    for _, (x, y, w, h), v in SURFACES:
        d.rectangle([x, y, x + w - 1, y + h - 1], fill=v)
    # The lamp over the counter: a pool on the floor before it.
    yy, xx = np.mgrid[0:H, 0:W]
    pool = np.clip(1 - (((xx - 1300) / 1000) ** 2 + ((yy - 780) / 200) ** 2), 0, 1) * 10
    base = np.asarray(plate).astype(float)
    base[680:] += pool[680:]
    plate = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(plate)
    for name, (x, y, w, h), v, where in OBJECTS:
        if where == 'front':
            continue
        d.rectangle([x, y, x + w - 1, y + h - 1], fill=v)
    for x, y, w, h in BOTTLE_ROWS:
        d.rectangle([x, y, x + w - 1, y + h - 1], fill=96)
    plate.save(os.path.join(ROOT, 'renders/room-12-graybox.png'))

    arr = np.asarray(plate).astype(float)
    dark, light = anchors(thad_sprite())
    head_top = int(FAR[0] - FAR[1])
    surfaces = []
    regions = [(n, r) for n, r, _ in SURFACES] + [(n, r) for n, r, _, where in OBJECTS if where == 'behind']
    # Only what lies behind the walk band's x-extent can be stood against.
    wx0, wx1 = WALK[0] - 120, WALK[0] + WALK[2] + 120
    for name, (x, y, w, h) in regions:
        y0, y1 = max(y, head_top), min(y + h, NEAR[0])
        x0, x1 = max(x, wx0), min(x + w, wx1)
        if y1 <= y0 or x1 <= x0 or (x1 - x0) * (y1 - y0) < HEAD_AREA:
            continue
        sample = arr[y0:y1, x0:x1].ravel()
        p10, p90 = float(np.percentile(sample, 10)), float(np.percentile(sample, 90))
        dark_margin = p10 - dark
        light_margin = light - p90
        best, other = max(dark_margin, light_margin), min(dark_margin, light_margin)
        verdict = ('strong' if best >= 25 and other >= 25 else 'weak' if best >= 25 and other < 15
                   else 'pass' if best >= 25 else 'FAIL')
        surfaces.append({'surface': name, 'p10': round(p10, 1), 'p90': round(p90, 1),
                         'darkAnchorMargin': round(dark_margin, 1), 'lightAnchorMargin': round(light_margin, 1),
                         'verdict': verdict})
    # Light sources excluded (ruling 18b).
    surfaces = [s for s in surfaces]

    comp = plate.convert('RGB')
    sprite = thad_sprite()
    dd = ImageDraw.Draw(comp)

    def put(x, y, flip=False):
        h = int(round(height_at(y)))
        s = sprite.resize((max(1, round(sprite.width * h / sprite.height)), h), Image.BOX)
        if flip:
            s = s.transpose(Image.FLIP_LEFT_RIGHT)
        g = s.convert('LA').convert('RGBA')
        comp.paste(g, (x - g.width // 2, y - h), g)
    # Thad at the far edge in front of each wall group, at the near edge, and
    # at the entrance: the six places a player will stand him.
    figures = [(450, FAR[0], False), (1000, 790, False), (1600, FAR[0], True),
               (300, 770, False), (800, NEAR[0], False), (1700, NEAR[0], True)]
    for x, y, flip in sorted(figures, key=lambda f: f[1]):
        put(x, y, flip)
    for name, (x, y, w, h), v, where in OBJECTS:
        if where == 'front':
            dd.rectangle([x, y, x + w, y + h], fill=(v, v, v))
    wx, wy, ww, wh = WALK
    dd.rectangle([wx, wy, wx + ww, wy + wh], outline=(90, 200, 90), width=3)
    for name, (x, y, _) in MARKS.items():
        dd.ellipse([x - 8, y - 8, x + 8, y + 8], outline=(220, 180, 60), width=3)
    ex = [o for o in OBJECTS if o[0] == EXIT[0]][0][1]
    dd.rectangle([ex[0], ex[1], ex[0] + ex[2], ex[1] + ex[3]], outline=(200, 90, 90), width=3)
    comp.save(os.path.join(ROOT, 'renders/room-12-graybox-with-thad.png'))

    # THE LAYOUT the composition master is generated against: the graybox
    # with Thad, in the 20:9 safe region of a 1536x1024 canvas (derive.mjs's
    # crop x 8, y 170, 1520x684), margins a flat lighter grey.
    # ONE Thad, in the middle of the floor, facing the counter: the scale anchor
    # and the style standard. Six would be painted as six people.
    one = plate.convert('RGB')
    comp_all = comp
    comp = one
    dd = ImageDraw.Draw(comp)
    put(1000, 790)
    for name, (x, y, w, h), v, where in OBJECTS:
        if where == 'front':
            dd.rectangle([x, y, x + w, y + h], fill=(v, v, v))
    comp = comp_all
    lay = Image.new('RGB', (1536, 1024), (150, 150, 150))
    lay.paste(one.resize((1520, 684), Image.LANCZOS), (8, 170))
    os.makedirs(os.path.join(ROOT, 'reference/room-12'), exist_ok=True)
    lay.save(os.path.join(ROOT, 'reference/room-12/layout-1536x1024.png'))

    worst = [s for s in surfaces if s['verdict'] in ('weak', 'FAIL')]
    out = {
        'room': 12,
        'note': 'Ruling 22 steps 1-6 for the Mercantile, written by tools/room12-graybox.py before any '
                'image operation. Positions and values are the plan the plate is generated against (errata 85).',
        'thadAnchors': {'dark': round(dark, 1), 'light': round(light, 1),
                        'source': os.path.relpath(THAD, ROOT)},
        'depth': {'far': {'y': FAR[0], 'height': FAR[1]}, 'near': {'y': NEAR[0], 'height': NEAR[1]},
                  'from': "Room 5's interior numbers (reference/room-05/annotation.json)"},
        'walkable': WALK,
        'exit': {'hotspot': EXIT[0], 'to': EXIT[1], 'rect': list(ex)},
        'marks': {k: {'x': v[0], 'y': v[1], 'facing': v[2]} for k, v in MARKS.items()},
        'objects': [{'name': n, 'rect': list(r), 'where': w} for n, r, _, w in OBJECTS],
        'occluders': [],
        'occlusionNote': 'Nothing stands nearer the camera than the walk band: every piece of furniture '
                         'is behind it, and nobody else is drawn, so no plane is needed.',
        'surfaces': surfaces,
        'legibilityGate': 'PASS' if not worst else 'REVIEW',
        'weakOrFailing': worst,
    }
    os.makedirs(os.path.join(ROOT, 'proofs/room-12'), exist_ok=True)
    with open(os.path.join(ROOT, 'proofs/room-12/graybox.json'), 'w') as f:
        json.dump(out, f, indent=1)
        f.write('\n')
    print(json.dumps({k: out[k] for k in ('thadAnchors', 'legibilityGate')}, indent=1))
    for s in surfaces:
        print(f"  {s['verdict']:6} {s['surface']:38} p10 {s['p10']:5} p90 {s['p90']:5}  dark {s['darkAnchorMargin']:6} light {s['lightAnchorMargin']:6}")


if __name__ == '__main__':
    main()
