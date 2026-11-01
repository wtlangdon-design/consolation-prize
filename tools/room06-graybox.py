"""Room 6's graybox: ruling 22 steps 1-6, before any art (errata 22).

The assay office's records room as masses only -- a value block, the walkable
band and the exit, doc 54's seventeen objects as silhouettes, Thad at every
depth, and the LEGIBILITY GATE run against it (rulings 16, 17c, 18a): every
surface Thad can stand in front of is measured, and each of his two anchors
reports its margin. The plan is what the plate is generated against, so a room
that would bury him is re-blocked here, not re-lit later.

Errata 31a is the room's lighting brief and is followed literally: keep the
dark field (shelves and upper room near v0.30), light the floor, a lamp at the
desk. The hour is Room 5's base, night (errata 64b: the room behind the counter
inherits the front room's state, and the front room is night). Every position
here is a staging decision under the standing delegation, recorded in errata 79.

Writes renders/room-06-graybox.png, renders/room-06-graybox-with-thad.png,
reference/room-06/layout-1536x1024.png and proofs/room-06/graybox.json.
"""
import json
import os

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1920, 864

THAD = os.path.join(ROOT, 'art/actors/thad-idle-right/idle-00.png')

# THE DEPTH: Room 5's own curve (reference/room-05/annotation.json), because
# this is the same building through one door: a standing man of 470 at y 700
# and 560 at y 830.
FAR = (700, 470)
NEAR = (830, 560)

# SURFACES (step 1): name, rect, planned luminance. The dark field (31a).
SURFACES = [
    ('ceiling shadow', (0, 0, 1920, 90), 30),
    ('back wall, dark plaster and leather', (0, 90, 1920, 440), 74),
    ('wainscot', (0, 530, 1920, 110), 64),
    ('floor, lit boards', (0, 640, 1920, 224), 92),
]
# OBJECTS (step 3), doc 54's seventeen less the two errata 66 D / 69 D moved
# to Room 5: name, rect, luminance, behind Thad / floor / front.
OBJECTS = [
    ('THE DOOR TO THE ASSAY OFFICE', (60, 170, 220, 470), 56, 'behind'),
    ('THE SPARE APRON', (310, 260, 70, 200), 96, 'behind'),  # re-blocked: in the dark field by the door
    ('THE MAP OF CLAIMS', (410, 120, 280, 200), 96, 'behind'),  # re-blocked: damp paper, out of the lamp
    ('THE SHELF OF REFERENCE VOLUMES', (410, 345, 280, 70), 60, 'behind'),
    ('THE FILED CERTIFICATES', (410, 440, 300, 200), 54, 'behind'),
    ('THE STOVE (pipe)', (785, 0, 30, 420), 40, 'behind'),
    ('THE STOVE', (740, 420, 130, 220), 46, 'behind'),
    ('THE STOVE (kettle)', (770, 380, 70, 40), 96, 'behind'),
    ('HER TEA THINGS (stand)', (890, 520, 80, 120), 58, 'behind'),
    ('HER TEA THINGS', (890, 506, 80, 14), 140, 'behind'),
    ('THE BACK WINDOW', (1040, 70, 190, 150), 48, 'behind'),
    ('THE STOOL', (1000, 470, 50, 170), 50, 'behind'),
    ('THE REGISTER (high desk)', (1060, 430, 260, 210), 62, 'behind'),
    ('THE REGISTER OF ASSAYS', (1100, 408, 160, 24), 168, 'behind'),
    ('THE DESK LAMP', (1280, 352, 36, 78), 220, 'behind'),
    ('THE SAMPLE SHELF', (1350, 100, 280, 540), 58, 'behind'),
    ('THE SCALES CABINET', (1650, 280, 130, 360), 70, 'behind'),
    ('THE BENCH', (1790, 450, 130, 190), 60, 'behind'),
    ('THE ACID BOTTLES', (1790, 300, 130, 80), 70, 'behind'),
    ('THE CRUCIBLE', (1820, 400, 60, 50), 110, 'behind'),
    ('THE STAIN ON THE FLOOR', (700, 730, 260, 60), 80, 'floor'),
    ('THE STAIN ON THE FLOOR (mat)', (820, 722, 160, 64), 104, 'floor'),
    ('THE COT IN THE CORNER', (1580, 680, 340, 184), 52, 'front'),
]
# Bottle rows on the sample shelf: accents read against its dark frame.
BOTTLE_ROWS = [(1365, 130 + k * 100, 250, 44) for k in range(5)]
MARKS = {'entrance': (240, 760, 'right')}
WALK = (140, 700, 1400, 130)   # x, y, w, h -- stops short of the cot
HEAD_AREA = int((FAR[1] * 0.13) ** 2) * 2
EXIT = ('THE DOOR TO THE ASSAY OFFICE', 'assay_office')


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
    # 31a: light the floor. The desk lamp's pool, centred in front of the desk.
    yy, xx = np.mgrid[0:H, 0:W]
    pool = np.clip(1 - (((xx - 1100) / 760) ** 2 + ((yy - 770) / 200) ** 2), 0, 1) * 14
    base = np.asarray(plate).astype(float)
    base[640:] += pool[640:]
    plate = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(plate)
    for name, (x, y, w, h), v, where in OBJECTS:
        if where == 'front':
            continue
        d.rectangle([x, y, x + w - 1, y + h - 1], fill=v)
    for x, y, w, h in BOTTLE_ROWS:
        d.rectangle([x, y, x + w - 1, y + h - 1], fill=96)
    plate.save(os.path.join(ROOT, 'renders/room-06-graybox.png'))

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
    surfaces = [s for s in surfaces if s['surface'] not in ('THE DESK LAMP',)]

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
    figures = [(560, FAR[0], False), (1180, FAR[0], False), (1480, FAR[0], True),
               (240, 760, False), (900, NEAR[0], False), (1500, NEAR[0], True)]
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
    comp.save(os.path.join(ROOT, 'renders/room-06-graybox-with-thad.png'))

    # THE LAYOUT the composition master is generated against: the graybox
    # with Thad, in the 20:9 safe region of a 1536x1024 canvas (derive.mjs's
    # crop x 8, y 170, 1520x684), margins a flat lighter grey.
    # ONE Thad, mid-floor in front of the stove and the desk: the scale anchor
    # and the style standard. Six would be painted as six people.
    one = plate.convert('RGB')
    comp_all = comp
    comp = one
    dd = ImageDraw.Draw(comp)
    put(860, 790)
    for name, (x, y, w, h), v, where in OBJECTS:
        if where == 'front':
            dd.rectangle([x, y, x + w, y + h], fill=(v, v, v))
    comp = comp_all
    lay = Image.new('RGB', (1536, 1024), (150, 150, 150))
    lay.paste(one.resize((1520, 684), Image.LANCZOS), (8, 170))
    os.makedirs(os.path.join(ROOT, 'reference/room-06'), exist_ok=True)
    lay.save(os.path.join(ROOT, 'reference/room-06/layout-1536x1024.png'))

    worst = [s for s in surfaces if s['verdict'] in ('weak', 'FAIL')]
    out = {
        'room': 6,
        'note': 'Ruling 22 steps 1-6 for the assay records room, written by tools/room06-graybox.py before any '
                'image operation. Errata 31a is the lighting brief (dark field, lit floor, a lamp at the desk); '
                'positions and values are the plan the plate is generated against (errata 79).',
        'thadAnchors': {'dark': round(dark, 1), 'light': round(light, 1),
                        'source': os.path.relpath(THAD, ROOT)},
        'depth': {'far': {'y': FAR[0], 'height': FAR[1]}, 'near': {'y': NEAR[0], 'height': NEAR[1]},
                  'from': 'reference/room-05/annotation.json scaling (the same building)'},
        'walkable': WALK,
        'exit': {'hotspot': EXIT[0], 'to': EXIT[1], 'rect': list(ex)},
        'marks': {k: {'x': v[0], 'y': v[1], 'facing': v[2]} for k, v in MARKS.items()},
        'objects': [{'name': n, 'rect': list(r), 'where': w} for n, r, _, w in OBJECTS],
        'occluders': [],
        'occlusionNote': 'The cot is the only near object and the walk band stops short of it (x <= 1540), '
                         'so nothing can stand behind it and no plane is needed.',
        'surfaces': surfaces,
        'legibilityGate': 'PASS' if not worst else 'REVIEW',
        'weakOrFailing': worst,
    }
    os.makedirs(os.path.join(ROOT, 'proofs/room-06'), exist_ok=True)
    with open(os.path.join(ROOT, 'proofs/room-06/graybox.json'), 'w') as f:
        json.dump(out, f, indent=1)
        f.write('\n')
    print(json.dumps({k: out[k] for k in ('thadAnchors', 'legibilityGate')}, indent=1))
    for s in surfaces:
        print(f"  {s['verdict']:6} {s['surface']:38} p10 {s['p10']:5} p90 {s['p90']:5}  dark {s['darkAnchorMargin']:6} light {s['lightAnchorMargin']:6}")


if __name__ == '__main__':
    main()
