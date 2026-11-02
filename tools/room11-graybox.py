"""Room 11's graybox: ruling 22 steps 1-6, before any art (errata 22).

Fanshawe's office as masses only -- a value block, the walkable band and the
door, doc 54's twelve subjects as silhouettes, Fanshawe behind his desk, Thad
at every depth, and the LEGIBILITY GATE run against it (rulings 16, 17c, 18a).

Night, one visual state: the office is off the lobby on Main Street, whose
base state is night (errata 64a), and the dinner (A10) is at night (doc 57).
Fanshawe is absent on the funeral day (errata 68 D) -- a figure, not a plate.
The dinner's laid desk and the handkerchief's absence after it are props from
one edit (errata 84). Every position is a staging decision under the standing
delegation, recorded in errata 84.

Writes renders/room-11-graybox.png, renders/room-11-graybox-with-thad.png,
reference/room-11/layout-1536x1024.png and proofs/room-11/graybox.json.
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

# SURFACES (step 1). Errata 17b: deep leather, gilt, red -- the only saturated
# interior in the game. Night: a lamp on the desk, the fire's glow on the safe.
SURFACES = [
    ('ceiling shadow', (0, 0, 1920, 60), 36),
    ('walls, red damask', (0, 60, 1920, 630), 70),
    ('floor, Turkey carpet', (0, 690, 1920, 174), 84),
]
OBJECTS = [
    ('THE DOOR', (30, 150, 180, 540), 60, 'behind'),
    ('THE WINDOW', (240, 60, 240, 500), 56, 'behind'),
    ('THE MAP WALL', (520, 90, 380, 330), 92, 'behind'),
    ('THE CHAIRS', (500, 470, 420, 220), 62, 'behind'),
    ('THE PORTRAIT', (960, 30, 280, 380), 66, 'behind'),
    ('THE SABRE', (1260, 120, 160, 70), 94, 'behind'),
    ("FANSHAWE'S DESK", (940, 450, 440, 240), 58, 'behind'),
    ('THE HANDKERCHIEF', (980, 440, 60, 24), 94, 'behind'),
    ('THE SUBMISSION LOG', (1260, 432, 90, 30), 90, 'behind'),
    ('THE LEDGERS', (1440, 110, 260, 330), 64, 'behind'),
    ('THE STOCK PORTRAIT DRAWER', (1440, 470, 260, 220), 60, 'behind'),
    ('THE DECANTER', (1480, 380, 60, 90), 92, 'behind'),
    ('THE SAFE', (1730, 200, 190, 490), 56, 'behind'),
    ('COLONEL FANSHAWE (behind the desk)', (1110, 220, 130, 230), 60, 'behind'),
]
BOTTLE_ROWS = []
MARKS = {'entrance': (300, 780, 'right'), 'talk_fanshawe': (1020, 790, 'right')}
WALK = (220, 740, 1500, 110)
HEAD_AREA = int((FAR[1] * 0.13) ** 2) * 2
EXIT = ('THE DOOR', 'company_lobby')


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
    # The desk lamp: a pool on the floor before the desk.
    yy, xx = np.mgrid[0:H, 0:W]
    pool = np.clip(1 - (((xx - 1150) / 900) ** 2 + ((yy - 780) / 200) ** 2), 0, 1) * 10
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
    plate.save(os.path.join(ROOT, 'renders/room-11-graybox.png'))

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
    surfaces = [s for s in surfaces if not s['surface'].startswith('COLONEL FANSHAWE')]

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
    figures = [(450, FAR[0], False), (1100, 790, False), (1500, FAR[0], True),
               (300, 770, False), (800, NEAR[0], False), (1450, NEAR[0], True)]
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
    comp.save(os.path.join(ROOT, 'renders/room-11-graybox-with-thad.png'))

    # THE LAYOUT the composition master is generated against: the graybox
    # with Thad, in the 20:9 safe region of a 1536x1024 canvas (derive.mjs's
    # crop x 8, y 170, 1520x684), margins a flat lighter grey.
    # ONE Thad, at his talk mark before the desk: the scale anchor
    # and the style standard. Six would be painted as six people.
    one = plate.convert('RGB')
    comp_all = comp
    comp = one
    dd = ImageDraw.Draw(comp)
    put(1020, 790)
    for name, (x, y, w, h), v, where in OBJECTS:
        if where == 'front':
            dd.rectangle([x, y, x + w, y + h], fill=(v, v, v))
    comp = comp_all
    lay = Image.new('RGB', (1536, 1024), (150, 150, 150))
    lay.paste(one.resize((1520, 684), Image.LANCZOS), (8, 170))
    os.makedirs(os.path.join(ROOT, 'reference/room-11'), exist_ok=True)
    lay.save(os.path.join(ROOT, 'reference/room-11/layout-1536x1024.png'))

    worst = [s for s in surfaces if s['verdict'] in ('weak', 'FAIL')]
    out = {
        'room': 11,
        'note': "Ruling 22 steps 1-6 for Fanshawe's office, written by tools/room11-graybox.py before any "
                'image operation. Positions and values are the plan the plate is generated against (errata 84).',
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
                         'is behind it, and Fanshawe is cut at his desk by his own posture, so no plane is needed.',
        'surfaces': surfaces,
        'legibilityGate': 'PASS' if not worst else 'REVIEW',
        'weakOrFailing': worst,
    }
    os.makedirs(os.path.join(ROOT, 'proofs/room-11'), exist_ok=True)
    with open(os.path.join(ROOT, 'proofs/room-11/graybox.json'), 'w') as f:
        json.dump(out, f, indent=1)
        f.write('\n')
    print(json.dumps({k: out[k] for k in ('thadAnchors', 'legibilityGate')}, indent=1))
    for s in surfaces:
        print(f"  {s['verdict']:6} {s['surface']:38} p10 {s['p10']:5} p90 {s['p90']:5}  dark {s['darkAnchorMargin']:6} light {s['lightAnchorMargin']:6}")


if __name__ == '__main__':
    main()
