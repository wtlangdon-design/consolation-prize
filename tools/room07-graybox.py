"""Room 7's graybox: ruling 22 steps 1-6, before any art (errata 22).

The claims registrar's office as masses only -- a value block, the walkable
band and the exit, the room's subjects (doc 05, doc 25, doc 19 section 2, doc
49) as silhouettes, Sump behind his counter, Thad at every depth and at the
counter, and the LEGIBILITY GATE run against it (rulings 16, 17c, 18a): every
surface Thad can stand in front of is measured, and each of his two anchors
reports its margin. The plan is what the plate is generated against, so a room
that would bury him is re-blocked here, not re-lit later.

Night, one visual state: Room 7 is off Lower Street, which inherits Main
Street's night (errata 43, 64a), and its lamps light the counter where the
paperwork is done. Every position here is a staging decision under the standing
delegation, recorded in errata 80.

Writes renders/room-07-graybox.png, renders/room-07-graybox-with-thad.png,
reference/room-07/layout-1536x1024.png and proofs/room-07/graybox.json.
"""
import json
import os

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1920, 864

THAD = os.path.join(ROOT, 'art/actors/thad-idle-right/idle-00.png')

# THE DEPTH: Room 5's interior numbers (a standing man of 470 at y 700, 0.69
# per row), sampled at this room's walk band. The counter is "a little too
# high to lean on" (doc 25): about 1.15 m against a 1.75 m man, so its face
# runs y 390-700 at the band's back edge.
FAR = (735, 494)
NEAR = (850, 573)

# SURFACES (step 1): name, rect, planned luminance. Errata 17b/30f's identity
# is pale institutional wood, paper and dust, pulled to mid value.
SURFACES = [
    ('ceiling shadow', (0, 0, 1920, 80), 40),
    ('public wall, pale plank', (0, 80, 900, 600), 96),
    ('partition, pale wood and glass', (900, 80, 1020, 310), 88),
    ('right wall, behind the counter', (1880, 80, 40, 620), 80),
    ('floor, worn boards', (0, 680, 1920, 184), 90),  # re-blocked: night floor
]
OBJECTS = [
    ('THE STREET DOOR', (40, 140, 200, 540), 64, 'behind'),
    ('THE WINDOW', (290, 130, 250, 220), 50, 'behind'),
    ('THE BENCH', (270, 520, 330, 140), 70, 'behind'),
    ('THE MAP OF CLAIMS', (620, 120, 240, 200), 96, 'behind'),  # re-blocked: old paper at night
    ('THE FORMS RACK', (640, 360, 200, 300), 74, 'behind'),
    ("SUMP'S CLOCK", (990, 110, 110, 110), 140, 'behind'),
    ('THE SEALED ARCHIVE DOOR', (1650, 90, 190, 300), 58, 'behind'),
    ('THE STATUTE (posted)', (1570, 150, 60, 150), 150, 'behind'),
    ('REGISTRAR SUMP (behind the counter)', (1160, 190, 160, 200), 60, 'behind'),
    ('THE COUNTER', (900, 390, 980, 310), 78, 'behind'),
    ('THE LEDGER', (1150, 372, 190, 24), 160, 'behind'),
    ("SUMP'S PEN", (1350, 370, 40, 20), 40, 'behind'),
    ('THE COUNTER BELL', (1040, 368, 36, 24), 170, 'behind'),
    ('FORM 12-C (THE STACK)', (1450, 370, 80, 22), 180, 'behind'),
    ('THE STATUTE BOOK', (1580, 366, 80, 26), 60, 'behind'),
    ('THE NUMBER SPINDLE', (915, 320, 40, 70), 150, 'behind'),
    ('THE TWO LINES (FILING sign)', (1000, 560, 70, 170), 120, 'floor'),
    ('THE TWO LINES (INQUIRIES sign)', (1500, 560, 70, 170), 120, 'floor'),
    ('THE TWO LINES (ropes)', (980, 700, 640, 30), 90, 'floor'),
]
BOTTLE_ROWS = []
MARKS = {'entrance': (300, 770, 'right'), 'talk_sump': (1040, 775, 'right')}
WALK = (240, 735, 1600, 115)   # x, y, w, h -- in front of the counter, the ropes and the bench
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
    # The counter's lamps: a pool on the floor in front of Sump's window.
    yy, xx = np.mgrid[0:H, 0:W]
    pool = np.clip(1 - (((xx - 1240) / 820) ** 2 + ((yy - 780) / 200) ** 2), 0, 1) * 10
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
    plate.save(os.path.join(ROOT, 'renders/room-07-graybox.png'))

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
    surfaces = [s for s in surfaces if not s['surface'].startswith('REGISTRAR SUMP')]

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
    figures = [(450, FAR[0], False), (1040, 775, False), (1700, FAR[0], True),
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
    comp.save(os.path.join(ROOT, 'renders/room-07-graybox-with-thad.png'))

    # THE LAYOUT the composition master is generated against: the graybox
    # with Thad, in the 20:9 safe region of a 1536x1024 canvas (derive.mjs's
    # crop x 8, y 170, 1520x684), margins a flat lighter grey.
    # ONE Thad, at the counter in front of Sump's window: the scale anchor
    # and the style standard. Six would be painted as six people.
    one = plate.convert('RGB')
    comp_all = comp
    comp = one
    dd = ImageDraw.Draw(comp)
    put(1040, 775)
    for name, (x, y, w, h), v, where in OBJECTS:
        if where == 'front':
            dd.rectangle([x, y, x + w, y + h], fill=(v, v, v))
    comp = comp_all
    lay = Image.new('RGB', (1536, 1024), (150, 150, 150))
    lay.paste(one.resize((1520, 684), Image.LANCZOS), (8, 170))
    os.makedirs(os.path.join(ROOT, 'reference/room-07'), exist_ok=True)
    lay.save(os.path.join(ROOT, 'reference/room-07/layout-1536x1024.png'))

    worst = [s for s in surfaces if s['verdict'] in ('weak', 'FAIL')]
    out = {
        'room': 7,
        'note': 'Ruling 22 steps 1-6 for the claims registrar, written by tools/room07-graybox.py before any '
                'image operation. Positions and values are the plan the plate is generated against (errata 80).',
        'thadAnchors': {'dark': round(dark, 1), 'light': round(light, 1),
                        'source': os.path.relpath(THAD, ROOT)},
        'depth': {'far': {'y': FAR[0], 'height': FAR[1]}, 'near': {'y': NEAR[0], 'height': NEAR[1]},
                  'from': "Room 5's interior numbers (reference/room-05/annotation.json)"},
        'walkable': WALK,
        'exit': {'hotspot': EXIT[0], 'to': EXIT[1], 'rect': list(ex)},
        'marks': {k: {'x': v[0], 'y': v[1], 'facing': v[2]} for k, v in MARKS.items()},
        'objects': [{'name': n, 'rect': list(r), 'where': w} for n, r, _, w in OBJECTS],
        'occluders': [],
        'occlusionNote': 'Nothing stands nearer the camera than the walk band: the counter, the queue ropes and '
                         'the bench are all behind it, so no plane is needed. Sump stands behind the counter and is '
                         'drawn cut at its top, as Winnie is (posture behind-counter).',
        'surfaces': surfaces,
        'legibilityGate': 'PASS' if not worst else 'REVIEW',
        'weakOrFailing': worst,
    }
    os.makedirs(os.path.join(ROOT, 'proofs/room-07'), exist_ok=True)
    with open(os.path.join(ROOT, 'proofs/room-07/graybox.json'), 'w') as f:
        json.dump(out, f, indent=1)
        f.write('\n')
    print(json.dumps({k: out[k] for k in ('thadAnchors', 'legibilityGate')}, indent=1))
    for s in surfaces:
        print(f"  {s['verdict']:6} {s['surface']:38} p10 {s['p10']:5} p90 {s['p90']:5}  dark {s['darkAnchorMargin']:6} light {s['lightAnchorMargin']:6}")


if __name__ == '__main__':
    main()
