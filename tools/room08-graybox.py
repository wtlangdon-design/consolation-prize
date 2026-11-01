"""Room 8's graybox: ruling 22 steps 1-6, before any art (errata 22).

The registrar's archive as masses only -- a value block, the walkable band and
the exit, doc 54's fourteen subjects as silhouettes, Thad at every depth and at
the Mott file, and the LEGIBILITY GATE run against it (rulings 16, 17c, 18a): every
surface Thad can stand in front of is measured, and each of his two anchors
reports its margin. The plan is what the plate is generated against, so a room
that would bury him is re-blocked here, not re-lit later.

Night, one visual state, as Room 7 through its door (errata 81). The lamp
bracket by the door is the only light (doc 08). Every position here is a
staging decision under the standing delegation, recorded in errata 81.

Writes renders/room-08-graybox.png, renders/room-08-graybox-with-thad.png,
reference/room-08/layout-1536x1024.png and proofs/room-08/graybox.json.
"""
import json
import os

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1920, 864

THAD = os.path.join(ROOT, 'art/actors/thad-idle-right/idle-00.png')

# THE DEPTH: Room 7's (the same building, through Sump's sealed door): a
# standing man of 480 at y 752 and 547 at y 850.
FAR = (735, 468)
NEAR = (850, 547)

# SURFACES (step 1). Doc 08: "the deep stacks stay dark"; the lamp lives in a
# bracket by the door. So errata 31a's answer again: keep the field dark, light
# the floor near the door, and keep the stacks a step above his dark mass.
SURFACES = [
    ('ceiling shadow', (0, 0, 1920, 90), 30),
    ('walls, old plaster', (0, 90, 1920, 600), 70),
    ('floor, dusty boards', (0, 690, 1920, 174), 88),
]
OBJECTS = [
    ('THE DOOR TO THE REGISTRAR\'S', (60, 160, 200, 530), 52, 'behind'),
    ('THE LAMP BRACKET', (280, 300, 60, 90), 200, 'behind'),
    ('THE UNCLAIMED CORRESPONDENCE', (380, 170, 200, 220), 60, 'behind'),
    ('THE STACKS', (620, 100, 900, 580), 58, 'behind'),
    ('THE DUST (the reached shelf)', (1100, 390, 360, 40), 84, 'behind'),
    ("CLAIM ONE'S BOX", (1180, 360, 80, 60), 100, 'behind'),
    ('THE TIMESHEET', (1320, 380, 110, 40), 96, 'behind'),
    ('THE FILING LADDER', (760, 100, 90, 590), 64, 'behind'),
    ('THE BARRED WINDOW', (1600, 120, 180, 170), 40, 'behind'),
    ('THE DAMP CORNER', (1560, 420, 330, 270), 54, 'behind'),
    ("THE CLERK'S DESK", (330, 500, 300, 190), 62, 'behind'),
    ('THE COUNTY SEAL', (520, 470, 60, 34), 140, 'behind'),
    ("THE EXECUTORS' LEDGER", (360, 476, 120, 24), 150, 'behind'),
    ('THE MOTT FILE', (980, 520, 200, 170), 76, 'behind'),
    ('THE CHAIR', (870, 560, 80, 130), 50, 'behind'),
]
BOTTLE_ROWS = []
MARKS = {'entrance': (300, 780, 'right'), 'mott_file': (900, 780, 'right')}
WALK = (220, 735, 1400, 115)
HEAD_AREA = int((FAR[1] * 0.13) ** 2) * 2
EXIT = ('THE DOOR TO THE REGISTRAR\'S', 'claims_registrar')


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
    # The lamp by the door: a pool on the floor near the door.
    yy, xx = np.mgrid[0:H, 0:W]
    pool = np.clip(1 - (((xx - 500) / 900) ** 2 + ((yy - 780) / 220) ** 2), 0, 1) * 14
    base = np.asarray(plate).astype(float)
    base[690:] += pool[690:]
    plate = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(plate)
    for name, (x, y, w, h), v, where in OBJECTS:
        if where == 'front':
            continue
        d.rectangle([x, y, x + w - 1, y + h - 1], fill=v)
    for x, y, w, h in BOTTLE_ROWS:
        d.rectangle([x, y, x + w - 1, y + h - 1], fill=96)
    plate.save(os.path.join(ROOT, 'renders/room-08-graybox.png'))

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
    surfaces = [s for s in surfaces if s['surface'] != 'THE LAMP BRACKET']

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
    figures = [(450, FAR[0], False), (900, 780, False), (1500, FAR[0], True),
               (300, 770, False), (800, NEAR[0], False), (1500, NEAR[0], True)]
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
    comp.save(os.path.join(ROOT, 'renders/room-08-graybox-with-thad.png'))

    # THE LAYOUT the composition master is generated against: the graybox
    # with Thad, in the 20:9 safe region of a 1536x1024 canvas (derive.mjs's
    # crop x 8, y 170, 1520x684), margins a flat lighter grey.
    # ONE Thad, mid-floor before the Mott file: the scale anchor
    # and the style standard. Six would be painted as six people.
    one = plate.convert('RGB')
    comp_all = comp
    comp = one
    dd = ImageDraw.Draw(comp)
    put(900, 780)
    for name, (x, y, w, h), v, where in OBJECTS:
        if where == 'front':
            dd.rectangle([x, y, x + w, y + h], fill=(v, v, v))
    comp = comp_all
    lay = Image.new('RGB', (1536, 1024), (150, 150, 150))
    lay.paste(one.resize((1520, 684), Image.LANCZOS), (8, 170))
    os.makedirs(os.path.join(ROOT, 'reference/room-08'), exist_ok=True)
    lay.save(os.path.join(ROOT, 'reference/room-08/layout-1536x1024.png'))

    worst = [s for s in surfaces if s['verdict'] in ('weak', 'FAIL')]
    out = {
        'room': 8,
        'note': 'Ruling 22 steps 1-6 for the registrar\'s archive, written by tools/room08-graybox.py before any '
                'image operation. Positions and values are the plan the plate is generated against (errata 81).',
        'thadAnchors': {'dark': round(dark, 1), 'light': round(light, 1),
                        'source': os.path.relpath(THAD, ROOT)},
        'depth': {'far': {'y': FAR[0], 'height': FAR[1]}, 'near': {'y': NEAR[0], 'height': NEAR[1]},
                  'from': "Room 7's curve (reference/room-07/annotation.json), the same building"},
        'walkable': WALK,
        'exit': {'hotspot': EXIT[0], 'to': EXIT[1], 'rect': list(ex)},
        'marks': {k: {'x': v[0], 'y': v[1], 'facing': v[2]} for k, v in MARKS.items()},
        'objects': [{'name': n, 'rect': list(r), 'where': w} for n, r, _, w in OBJECTS],
        'occluders': [],
        'occlusionNote': 'Nothing stands nearer the camera than the walk band: every piece of furniture is '
                         'behind it, so no plane is needed.',
        'surfaces': surfaces,
        'legibilityGate': 'PASS' if not worst else 'REVIEW',
        'weakOrFailing': worst,
    }
    os.makedirs(os.path.join(ROOT, 'proofs/room-08'), exist_ok=True)
    with open(os.path.join(ROOT, 'proofs/room-08/graybox.json'), 'w') as f:
        json.dump(out, f, indent=1)
        f.write('\n')
    print(json.dumps({k: out[k] for k in ('thadAnchors', 'legibilityGate')}, indent=1))
    for s in surfaces:
        print(f"  {s['verdict']:6} {s['surface']:38} p10 {s['p10']:5} p90 {s['p90']:5}  dark {s['darkAnchorMargin']:6} light {s['lightAnchorMargin']:6}")


if __name__ == '__main__':
    main()
