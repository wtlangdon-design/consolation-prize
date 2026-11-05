"""Room 18's graybox: ruling 22 steps 1-6, before any art (errata 22).

The hotel lobby, rebuilt at errata 54's size (the 320x144 room is retired): a
value block, the walkable band, the street door and the stairs, the merged
subjects as silhouettes (thirteen), the clerk behind his desk, Thad at every
depth, and the LEGIBILITY GATE.

Night (errata 64a): lamps and the stove. The street door and the front window
at the left; the settee under the window and the spittoon; the painting and the
engraving; the parlor piano in its corner under a fern (doc 54: "the hotel calls
this corner the parlor"); the clerk's desk with the register and the bell, the
key rack and the clock behind it; the stove; the stairs up at the right, to
Room 19. Every position is a staging decision under the standing delegation,
recorded in errata 91.

Writes renders/room-18-graybox.png, renders/room-18-graybox-with-thad.png,
reference/room-18/layout-1536x1024.png and proofs/room-18/graybox.json.
"""
import json
import os

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1920, 864

THAD = os.path.join(ROOT, 'art/actors/thad-idle-right/idle-00.png')

# THE DEPTH: an interior like Room 16's: 440 at the band's far edge, 516 at
# its near (0.69 per row, Room 5's slope).
FAR = (745, 440)
NEAR = (855, 516)

# SURFACES (step 1). Papered walls and dark wainscot under lamplight, held to
# mid-values where Thad stands; plank floor with a runner.
SURFACES = [
    ('ceiling, in shadow', (0, 0, 1920, 110), 40),
    ('walls, papered', (0, 110, 1920, 590), 84),
    ('floor, plank', (0, 700, 1920, 164), 90),
]
OBJECTS = [
    ('THE STREET DOOR', (20, 150, 200, 550), 58, 'behind'),
    ('THE FRONT WINDOW', (240, 160, 200, 320), 60, 'behind'),
    ('THE SETTEE', (260, 520, 260, 180), 62, 'behind'),
    ('THE SPITTOON', (540, 640, 60, 60), 70, 'behind'),
    ('THE PAINTING', (560, 200, 160, 120), 104, 'behind'),
    ('THE ENGRAVING', (740, 210, 120, 100), 104, 'behind'),
    ('THE PARLOR PIANO', (880, 420, 220, 280), 50, 'behind'),
    ('THE FERN', (900, 330, 100, 90), 64, 'behind'),
    ('THE KEY RACK', (1200, 220, 250, 160), 66, 'behind'),
    ('THE CLERK (behind the desk)', (1270, 290, 110, 210), 56, 'behind'),
    ('THE DESK', (1150, 480, 350, 220), 66, 'behind'),
    ('THE REGISTER', (1250, 470, 90, 30), 104, 'behind'),
    ("THE CLERK'S BELL", (1380, 465, 30, 30), 104, 'behind'),
    ('THE CLOCK', (1510, 180, 60, 140), 64, 'behind'),
    ('THE STOVE', (1580, 450, 100, 250), 46, 'behind'),
    ('THE STAIRS', (1700, 100, 220, 600), 70, 'behind'),
    ('A LAMP', (1120, 200, 40, 50), 210, 'light'),
]
BOTTLE_ROWS = []
MARKS = {'entrance': (300, 790, 'right'), 'talk_clerk': (1120, 790, 'right')}
WALK = (220, 745, 1660, 110)
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
    # The wall lamps: a pool on the floor before it.
    yy, xx = np.mgrid[0:H, 0:W]
    pool = np.clip(1 - (((xx - 1000) / 1000) ** 2 + ((yy - 780) / 200) ** 2), 0, 1) * 10
    base = np.asarray(plate).astype(float)
    base[680:] += pool[680:]
    plate = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(plate)
    for name, (x, y, w, h), v, where in OBJECTS:
        if where == 'front':
            continue
        d.rectangle([x, y, x + w - 1, y + h - 1], fill=v)
    for name, (x, y, w, h), v, where in OBJECTS:
        if where == 'light':
            d.ellipse([x, y, x + w, y + h], fill=v)
    for x, y, w, h in BOTTLE_ROWS:
        d.rectangle([x, y, x + w - 1, y + h - 1], fill=96)
    plate.save(os.path.join(ROOT, 'renders/room-18-graybox.png'))

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
    surfaces = [s for s in surfaces if not s['surface'].startswith('THE CLERK (')]

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
    figures = [(450, FAR[0], False), (1120, 790, False), (1600, FAR[0], True),
               (300, 790, False), (1250, NEAR[0], False), (1750, NEAR[0], True)]
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
    comp.save(os.path.join(ROOT, 'renders/room-18-graybox-with-thad.png'))

    # THE LAYOUT the composition master is generated against: the graybox
    # with Thad, in the 20:9 safe region of a 1536x1024 canvas (derive.mjs's
    # crop x 8, y 170, 1520x684), margins a flat lighter grey.
    # ONE Thad, at his talk mark before the table: the scale anchor
    # and the style standard. Six would be painted as six people.
    one = plate.convert('RGB')
    comp_all = comp
    comp = one
    dd = ImageDraw.Draw(comp)
    put(1120, 790)
    for name, (x, y, w, h), v, where in OBJECTS:
        if where == 'front':
            dd.rectangle([x, y, x + w, y + h], fill=(v, v, v))
    comp = comp_all
    lay = Image.new('RGB', (1536, 1024), (150, 150, 150))
    lay.paste(one.resize((1520, 684), Image.LANCZOS), (8, 170))
    os.makedirs(os.path.join(ROOT, 'reference/room-18'), exist_ok=True)
    lay.save(os.path.join(ROOT, 'reference/room-18/layout-1536x1024.png'))

    worst = [s for s in surfaces if s['verdict'] in ('weak', 'FAIL')]
    out = {
        'room': 18,
        'note': "Ruling 22 steps 1-6 for the hotel lobby, written by tools/room18-graybox.py before any "
                'image operation. Positions and values are the plan the plate is generated against (errata 91).',
        'thadAnchors': {'dark': round(dark, 1), 'light': round(light, 1),
                        'source': os.path.relpath(THAD, ROOT)},
        'depth': {'far': {'y': FAR[0], 'height': FAR[1]}, 'near': {'y': NEAR[0], 'height': NEAR[1]},
                  'from': "Room 5's slope, a little smaller than Room 13's"},
        'walkable': WALK,
        'exit': {'hotspot': EXIT[0], 'to': EXIT[1], 'rect': list(ex)},
        'marks': {k: {'x': v[0], 'y': v[1], 'facing': v[2]} for k, v in MARKS.items()},
        'objects': [{'name': n, 'rect': list(r), 'where': w} for n, r, _, w in OBJECTS],
        'occluders': [],
        'occlusionNote': 'Nothing stands nearer the camera than the walk band: the settee, the piano, the desk and '
                         'the stove are behind it, and the clerk is cut at his desk, so no plane is needed.',
        'surfaces': surfaces,
        'legibilityGate': 'PASS' if not worst else 'REVIEW',
        'weakOrFailing': worst,
    }
    os.makedirs(os.path.join(ROOT, 'proofs/room-18'), exist_ok=True)
    with open(os.path.join(ROOT, 'proofs/room-18/graybox.json'), 'w') as f:
        json.dump(out, f, indent=1)
        f.write('\n')
    print(json.dumps({k: out[k] for k in ('thadAnchors', 'legibilityGate')}, indent=1))
    for s in surfaces:
        print(f"  {s['verdict']:6} {s['surface']:38} p10 {s['p10']:5} p90 {s['p90']:5}  dark {s['darkAnchorMargin']:6} light {s['lightAnchorMargin']:6}")


if __name__ == '__main__':
    main()
