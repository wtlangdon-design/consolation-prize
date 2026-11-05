"""Room 27's graybox: ruling 22 steps 1-6, before any art (errata 22).

The abandoned claim row, up in the diggings, built new at errata 54's size: a
value block, the walkable path and the way back to the road, the merged
subjects as silhouettes, Thad at every depth, and the LEGIBILITY GATE.
Nobody else: "Nobody comes up here" (doc 08).

Night, the town's hour (errata 98). Left to right along THE PATH: eleven claim
markers, each before its hole (THE WORKINGS) -- EUREKA first, THE BLANK ONE
last, in doc 05's order; THE SLUICE FRAMES behind the row at the right; A BOOT
on the path. Every position is a staging decision under the standing
delegation, recorded in errata 99 C.

Writes renders/room-27-graybox.png, renders/room-27-graybox-with-thad.png,
reference/room-27/layout-1536x1024.png and proofs/room-27/graybox.json.
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
    ('night sky', (0, 0, 1920, 200), 60),
    ('the worked hillside', (0, 200, 1920, 420), 76),
    ('the path', (0, 620, 1920, 244), 92),
]
OBJECTS = [
    ('THE WAY BACK TO THE ROAD', (0, 520, 140, 330), 100, 'behind'),
    ('THE SLUICE FRAMES', (1300, 300, 500, 150), 64, 'behind'),
    ('MARKER 1', (150, 470, 46, 150), 66, 'behind'),
    ('HOLE 1', (120, 560, 110, 50), 56, 'behind'),
    ('MARKER 2', (308, 470, 46, 150), 66, 'behind'),
    ('HOLE 2', (278, 560, 110, 50), 56, 'behind'),
    ('MARKER 3', (466, 470, 46, 150), 66, 'behind'),
    ('HOLE 3', (436, 560, 110, 50), 56, 'behind'),
    ('MARKER 4', (624, 470, 46, 150), 66, 'behind'),
    ('HOLE 4', (594, 560, 110, 50), 56, 'behind'),
    ('MARKER 5', (782, 470, 46, 150), 66, 'behind'),
    ('HOLE 5', (752, 560, 110, 50), 56, 'behind'),
    ('MARKER 6', (940, 470, 46, 150), 66, 'behind'),
    ('HOLE 6', (910, 560, 110, 50), 56, 'behind'),
    ('MARKER 7', (1098, 470, 46, 150), 66, 'behind'),
    ('HOLE 7', (1068, 560, 110, 50), 56, 'behind'),
    ('MARKER 8', (1256, 470, 46, 150), 66, 'behind'),
    ('HOLE 8', (1226, 560, 110, 50), 56, 'behind'),
    ('MARKER 9', (1414, 470, 46, 150), 66, 'behind'),
    ('HOLE 9', (1384, 560, 110, 50), 56, 'behind'),
    ('MARKER 10', (1572, 470, 46, 150), 66, 'behind'),
    ('HOLE 10', (1542, 560, 110, 50), 56, 'behind'),
    ('MARKER 11', (1730, 470, 46, 150), 66, 'behind'),
    ('HOLE 11', (1700, 560, 110, 50), 56, 'behind'),
    ('A BOOT', (980, 770, 50, 34), 56, 'behind'),
]
BOTTLE_ROWS = []
MARKS = {'entrance': (220, 790, 'right'), 'mid': (960, 780, 'right')}
WALK = (150, 690, 1740, 165)
HEAD_AREA = int((FAR[1] * 0.13) ** 2) * 2
EXIT = ('THE WAY BACK TO THE ROAD', 'claims_road')


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
    plate.save(os.path.join(ROOT, 'renders/room-27-graybox.png'))

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
    comp.save(os.path.join(ROOT, 'renders/room-27-graybox-with-thad.png'))

    # THE LAYOUT the composition master is generated against: the graybox
    # with Thad, in the 20:9 safe region of a 1536x1024 canvas (derive.mjs's
    # crop x 8, y 170, 1520x684), margins a flat lighter grey.
    # ONE Thad, at his stand: the scale anchor and the style standard. Six
    # would be painted as six people. Pratt is a grey man the master paints.
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
    os.makedirs(os.path.join(ROOT, 'reference/room-27'), exist_ok=True)
    lay.save(os.path.join(ROOT, 'reference/room-27/layout-1536x1024.png'))

    worst = [s for s in surfaces if s['verdict'] in ('weak', 'FAIL')]
    out = {
        'room': 27,
        'note': "Ruling 22 steps 1-6 for the claim row, written by tools/room27-graybox.py before any "
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
        'occlusionNote': 'Nothing stands nearer the camera than the walk band: the markers and their holes are '
                         'behind the path, so no plane is needed.',
        'surfaces': surfaces,
        'legibilityGate': 'PASS' if not worst else 'REVIEW',
        'weakOrFailing': worst,
    }
    os.makedirs(os.path.join(ROOT, 'proofs/room-27'), exist_ok=True)
    with open(os.path.join(ROOT, 'proofs/room-27/graybox.json'), 'w') as f:
        json.dump(out, f, indent=1)
        f.write('\n')
    print(json.dumps({k: out[k] for k in ('thadAnchors', 'legibilityGate')}, indent=1))
    for s in surfaces:
        print(f"  {s['verdict']:6} {s['surface']:38} p10 {s['p10']:5} p90 {s['p90']:5}  dark {s['darkAnchorMargin']:6} light {s['lightAnchorMargin']:6}")


if __name__ == '__main__':
    main()
