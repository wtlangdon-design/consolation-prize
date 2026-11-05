"""Room 35's graybox: ruling 22 steps 1-6, before any art (errata 22).

The Company vault (doc 20: off Fanshawe's office, Act IV), built new at errata
54's size: an iron room behind the great door, lit by an oil lamp on the floor
under a gas lamp that has never been lit. Sixteen subjects (doc 54) on its
walls, shelves and floor; nobody. A value block, the floor and the way back
out, the subjects as silhouettes, Thad at every depth, and the LEGIBILITY
GATE. Every position is a staging decision under the standing delegation,
recorded in errata 99 I.

Writes renders/room-35-graybox.png, renders/room-35-graybox-with-thad.png,
reference/room-35/layout-1536x1024.png and proofs/room-35/graybox.json.
"""
import json
import os

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1920, 864

THAD = os.path.join(ROOT, 'art/actors/thad-idle-right/idle-00.png')

FAR = (705, 300)
NEAR = (855, 400)

SURFACES = [
    ('the iron ceiling', (0, 0, 1920, 60), 52),
    ('the iron walls', (0, 60, 1920, 620), 66),
    ('the floor', (0, 680, 1920, 184), 86),
]
OBJECTS = [
    ('THE VAULT DOOR', (0, 60, 300, 640), 58, 'behind'),
    ('THE LEDGER SHELF', (320, 70, 340, 290), 74, 'behind'),
    ('THE GAS LAMP, FIXED', (700, 30, 80, 130), 96, 'behind'),
    ('THE DEED BOXES', (800, 110, 240, 240), 78, 'behind'),
    ('THE STOCK PORTRAIT BOXES', (1060, 130, 200, 220), 82, 'behind'),
    ('THE MAPS', (1280, 70, 180, 280), 72, 'behind'),
    ('THE MAP, PRIVATE', (1480, 60, 300, 260), 80, 'behind'),
    ('THE SEARCH FUND', (340, 400, 150, 160), 76, 'behind'),
    ('THE UNSOLD DEEDS', (520, 520, 180, 120), 82, 'behind'),
    ('THE STRONGBOX', (780, 450, 240, 190), 60, 'behind'),
    ("FANSHAWE'S PRIVATE DRAWER", (1060, 420, 170, 220), 70, 'behind'),
    ('THE CHAMPAGNE', (1250, 400, 60, 130), 64, 'behind'),
    ('THE SHARE CERTIFICATES', (1240, 560, 160, 90), 90, 'behind'),
    ("THE VISITOR'S CHAIR", (1430, 400, 200, 270), 62, 'behind'),
    ('THE ORIGINAL SUBSCRIPTION', (1660, 340, 200, 200), 84, 'behind'),
    ('THE CORRESPONDENCE FILE', (1660, 580, 170, 90), 78, 'behind'),
]
BOTTLE_ROWS = []
MARKS = {'entrance': (360, 790, 'right'), 'mid': (960, 780, 'right')}
WALK = (300, 700, 1560, 158)
HEAD_AREA = int((FAR[1] * 0.13) ** 2) * 2
EXIT = ('THE VAULT DOOR', 'fanshawe_office')


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
    for name, (x, y, w, h), v, where in OBJECTS:
        if where in ('front', 'figure'):
            continue
        d.rectangle([x, y, x + w - 1, y + h - 1], fill=v)
    for name, (x, y, w, h), v, where in OBJECTS:
        if where == 'light':
            d.ellipse([x, y, x + w, y + h], fill=v)
    for x, y, w, h in BOTTLE_ROWS:
        d.rectangle([x, y, x + w - 1, y + h - 1], fill=96)
    plate.save(os.path.join(ROOT, 'renders/room-35-graybox.png'))

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
    surfaces = [s for s in surfaces if not s['surface'].startswith('HOLE')]

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
    figures = [(450, FAR[0], False), (1000, 780, False), (1300, FAR[0], True),
               (220, 780, False), (800, NEAR[0], False), (1750, NEAR[0], True)]
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
    comp.save(os.path.join(ROOT, 'renders/room-35-graybox-with-thad.png'))

    # THE LAYOUT the composition master is generated against: the graybox
    # with Thad, in the 20:9 safe region of a 1536x1024 canvas (derive.mjs's
    # crop x 8, y 170, 1520x684), margins a flat lighter grey.
    # ONE Thad, at his stand: the scale anchor and the style standard. Six
    # would be painted as six people. 
    one = plate.convert('RGB')
    comp_all = comp
    comp = one
    dd = ImageDraw.Draw(comp)
    put(960, 780)
    for name, (x, y, w, h), v, where in OBJECTS:
        if where == 'front':
            dd.rectangle([x, y, x + w, y + h], fill=(v, v, v))
    comp = comp_all
    lay = Image.new('RGB', (1536, 1024), (150, 150, 150))
    lay.paste(one.resize((1520, 684), Image.LANCZOS), (8, 170))
    os.makedirs(os.path.join(ROOT, 'reference/room-35'), exist_ok=True)
    lay.save(os.path.join(ROOT, 'reference/room-35/layout-1536x1024.png'))

    worst = [s for s in surfaces if s['verdict'] in ('weak', 'FAIL')]
    out = {
        'room': 35,
        'note': "Ruling 22 steps 1-6 for the Company vault, written by tools/room35-graybox.py before any "
                'image operation. Positions and values are the plan the plate is generated against (errata 99).',
        'thadAnchors': {'dark': round(dark, 1), 'light': round(light, 1),
                        'source': os.path.relpath(THAD, ROOT)},
        'depth': {'far': {'y': FAR[0], 'height': FAR[1]}, 'near': {'y': NEAR[0], 'height': NEAR[1]},
                  'from': "Room 5's slope, a little smaller than Room 13's"},
        'walkable': WALK,
        'exit': {'hotspot': EXIT[0], 'to': EXIT[1], 'rect': list(ex)},
        'marks': {k: {'x': v[0], 'y': v[1], 'facing': v[2]} for k, v in MARKS.items()},
        'objects': [{'name': n, 'rect': list(r), 'where': w} for n, r, _, w in OBJECTS],
        'occluders': [],
        'occlusionNote': 'Nothing stands nearer the camera than the floor.',
        'surfaces': surfaces,
        'legibilityGate': 'PASS' if not worst else 'REVIEW',
        'weakOrFailing': worst,
    }
    os.makedirs(os.path.join(ROOT, 'proofs/room-35'), exist_ok=True)
    with open(os.path.join(ROOT, 'proofs/room-35/graybox.json'), 'w') as f:
        json.dump(out, f, indent=1)
        f.write('\n')
    print(json.dumps({k: out[k] for k in ('thadAnchors', 'legibilityGate')}, indent=1))
    for s in surfaces:
        print(f"  {s['verdict']:6} {s['surface']:38} p10 {s['p10']:5} p90 {s['p90']:5}  dark {s['darkAnchorMargin']:6} light {s['lightAnchorMargin']:6}")


if __name__ == '__main__':
    main()
