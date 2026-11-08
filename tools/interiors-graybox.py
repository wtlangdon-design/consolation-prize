"""The six interiors' grayboxes (reference/ancillary-interiors/brief.md, errata 183): ruling 22 steps 1-6, before
any art (errata 22), one room at a time, in Room 13's manner.

    python3 tools/interiors-graybox.py 42

A value block, the walkable band and the door, doc 105's subjects as silhouettes, the room's person where they
stand, Thad at every depth, and the LEGIBILITY GATE (rulings 16, 17c, 18a). Night, one visual state, as every
room the town reaches (errata 64a, 183). Every position is a staging decision under the standing delegation,
recorded in errata 183's build section.

Writes renders/room-NN-graybox.png, renders/room-NN-graybox-with-thad.png, reference/room-NN/layout-1536x1024.png
and proofs/room-NN/graybox.json.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1920, 864
THAD = os.path.join(ROOT, 'art/actors/thad-idle-right/idle-00.png')

# THE DEPTH: Room 5's interior numbers, as Room 13's: a standing man of 497 at y 740.
INTERIOR = {'far': (740, 497), 'near': (850, 573), 'from': "Room 5's interior numbers, as Room 13's (tools/room13-graybox.py)"}

ROOMS = {
    42: {
        'id': 'barbers', 'name': "THE BARBER'S",
        'what': "A one-room barber-surgeon's shop off the Lane, at night, lit by one lamp over the chair.",
        'depth': INTERIOR,
        'surfaces': [
            ('ceiling shadow', (0, 0, 1920, 60), 40),
            ('walls, dark plank', (0, 60, 1920, 630), 70),
            ('floor, worn boards', (0, 690, 1920, 174), 84),
        ],
        # name, rect, value, where. 'behind' stands behind the walk band.
        'objects': [
            ('THE DOOR TO THE LANE', (30, 150, 190, 540), 52, 'behind'),
            ('THE PRICE BOARD', (300, 110, 200, 150), 108, 'behind'),
            ('THE MIRROR', (790, 110, 250, 230), 104, 'behind'),
            ('THE CHAIR', (760, 390, 300, 300), 50, 'behind'),
            ('THE CHAIR (its bucket)', (1070, 600, 70, 90), 60, 'behind'),
            ('THE STROP', (690, 190, 50, 230), 92, 'behind'),
            ('THE JAR (on its shelf)', (1300, 220, 260, 120), 96, 'behind'),
            ('THE TRAY (on its stand)', (1300, 450, 260, 240), 58, 'behind'),
            ('THE BARBER (beside the chair)', (1140, 240, 140, 500), 56, 'behind'),
        ],
        'lamp': (900, 780, 700, 160),
        'marks': {'entrance': (260, 790, 'right'), 'talk_barber': (1420, 750, 'left')},
        'walk': (180, 740, 1600, 110),
        'exit': ('THE DOOR TO THE LANE', 'the_lane'),
        'layoutThad': (1420, 750),
        'figures': [(450, 740, False), (700, 800, False), (1500, 740, True), (260, 790, False), (900, 850, False),
                    (1650, 850, True)],
        'occlusionNote': 'Nothing stands nearer the camera than the walk band: the chair, the tray and the barber are all '
                         'behind it, so no plane is needed.',
        'lightSources': ['THE BARBER'],
    },
    38: {
        'id': 'photographers_studio', 'name': "THE PHOTOGRAPHER'S STUDIO",
        'what': "A portrait studio off the Lane, at night, lit by one lamp and the Lane's lamplight through its window.",
        'depth': INTERIOR,
        'surfaces': [
            ('ceiling shadow', (0, 0, 1920, 60), 40),
            ('walls, papered plank', (0, 60, 1920, 630), 74),
            ('floor, boards', (0, 690, 1920, 174), 86),
        ],
        'objects': [
            ('THE DOOR TO THE LANE', (30, 150, 170, 540), 52, 'behind'),
            ('THE WINDOW DISPLAY (the window, the easel)', (230, 140, 260, 470), 58, 'behind'),
            ('THE PAINTED BACKDROP', (530, 80, 420, 610), 96, 'behind'),
            ('THE SITTING CHAIR (and its table)', (610, 430, 240, 260), 54, 'behind'),
            ('THE HEADREST CLAMP', (870, 290, 50, 400), 46, 'behind'),
            ('THE CAMERA (on its tripod)', (1010, 330, 210, 360), 50, 'behind'),
            ('THE PHOTOGRAPHER (behind the camera)', (1250, 240, 140, 500), 56, 'behind'),
            ('THE CHEMICALS (on a shelf)', (1450, 140, 270, 140), 96, 'behind'),
            ('THE STOCK PORTRAIT BOX (on a table)', (1450, 430, 270, 260), 60, 'behind'),
            ('THE PRICE CARD', (1760, 220, 80, 110), 110, 'behind'),
        ],
        'lamp': (1120, 780, 760, 170),
        'marks': {'entrance': (260, 790, 'right'), 'talk_photographer': (1560, 750, 'left')},
        'walk': (180, 740, 1600, 110),
        'exit': ('THE DOOR TO THE LANE', 'the_lane'),
        'layoutThad': (1560, 750),
        'figures': [(450, 740, False), (700, 800, False), (1500, 740, True), (260, 790, False), (900, 850, False),
                    (1650, 850, True)],
        'occlusionNote': 'Nothing stands nearer the camera than the walk band: the chair, the camera on its tripod, the '
                         'table and the photographer are all behind it, so no plane is needed.',
        'lightSources': ['THE PHOTOGRAPHER'],
    },
    37: {
        'id': 'boarding_house_parlour', 'name': 'THE BOARDING HOUSE PARLOUR',
        'what': 'A startlingly civilised parlour, at night, lamp-lit and warm, with a fire in the grate.',
        'depth': INTERIOR,
        'surfaces': [
            ('ceiling shadow', (0, 0, 1920, 60), 40),
            ('walls, papered', (0, 60, 1920, 630), 76),
            ('floor, boards', (0, 690, 1920, 174), 84),
        ],
        'objects': [
            ('THE DOOR OUT', (20, 150, 160, 540), 52, 'behind'),
            ('THE STAIRS (the sign, the boots)', (190, 60, 290, 630), 58, 'behind'),
            ('THE PORTRAIT OF A QUEEN', (560, 100, 170, 210), 100, 'behind'),
            ('THE PIANO', (500, 380, 280, 310), 50, 'behind'),
            ('THE ANTIMACASSARS (the left chair)', (790, 440, 140, 250), 60, 'behind'),
            ('THE FIRE (grate, fender, scuttle)', (950, 300, 290, 390), 46, 'behind'),
            ('THE ANTIMACASSARS (the right chair)', (1260, 440, 140, 250), 60, 'behind'),
            ('THE TEA THINGS (on a table)', (1410, 500, 170, 190), 96, 'behind'),
            ('THE RUG', (700, 700, 640, 40), 70, 'behind'),
            ('THE WOMEN A AND B (standing together)', (1600, 260, 260, 480), 56, 'behind'),
        ],
        'lamp': (1100, 780, 800, 170),
        'marks': {'entrance': (240, 790, 'right'), 'talk_women': (1520, 750, 'right')},
        'walk': (160, 740, 1620, 110),
        'exit': ('THE DOOR OUT', 'town_map'),
        'layoutThad': (1520, 750),
        'figures': [(450, 740, False), (700, 800, False), (1300, 740, True), (240, 790, False), (900, 850, False),
                    (1650, 850, True)],
        'occlusionNote': 'Nothing stands nearer the camera than the walk band: the chairs, the fire, the tea table and '
                         'the two women are all behind it, so no plane is needed.',
        'lightSources': ['THE WOMEN', 'THE FIRE'],
    },
    39: {
        'id': 'bakehouse', 'name': 'THE BAKEHOUSE',
        'what': 'A small hot bakehouse at night, lit by its big brick oven, working.',
        'depth': INTERIOR,
        'surfaces': [
            ('ceiling shadow, rafters', (0, 0, 1920, 60), 40),
            ('walls, brick and plank', (0, 60, 1920, 630), 72),
            ('floor, floury boards', (0, 690, 1920, 174), 88),
        ],
        'objects': [
            ('THE DOOR OUT', (20, 150, 160, 540), 52, 'behind'),
            ('THE FLOUR (sacks to the rafters)', (200, 60, 300, 630), 104, 'behind'),
            ('THE OVEN (and its paddle)', (540, 110, 430, 580), 50, 'behind'),
            ('racks', (1000, 170, 180, 520), 60, 'behind'),
            ('THE TABLE (dough in rows)', (1190, 470, 420, 220), 98, 'behind'),
            ('THE BOY (at the table\'s far end, a tray)', (1620, 380, 110, 330), 56, 'behind'),
            ('THE BACK DOOR (propped open, the yard)', (1750, 130, 160, 560), 46, 'behind'),
        ],
        'lamp': (760, 790, 800, 170),
        'marks': {'entrance': (240, 790, 'right')},
        'walk': (160, 740, 1620, 110),
        'exit': ('THE DOOR OUT', 'town_map'),
        'layoutThad': (900, 790),
        'figures': [(450, 740, False), (700, 800, False), (1300, 740, True), (240, 790, False), (900, 850, False),
                    (1650, 850, True)],
        'occlusionNote': 'Nothing stands nearer the camera than the walk band: the oven, the table and the boy at its far '
                         'end are all behind it, so no plane is needed.',
        'lightSources': ['THE OVEN', 'THE BOY', 'THE BACK DOOR'],
    },
    40: {
        'id': 'empty_storefront', 'name': 'THE EMPTY STOREFRONT',
        'what': "An abandoned shop off the Lane at night, empty, lit only by the Lane's lamplight through the gaps in its boarded window.",
        'depth': INTERIOR,
        'surfaces': [
            ('ceiling shadow', (0, 0, 1920, 60), 36),
            ('walls, plank', (0, 60, 1920, 630), 66),
            ('floor, swept boards', (0, 690, 1920, 174), 84),
        ],
        'objects': [
            ('THE DOOR TO THE LANE', (20, 150, 170, 540), 50, 'behind'),
            ('THE WINDOW (boarded outside, tickets on the glass)', (230, 130, 300, 400), 58, 'behind'),
            ('bare shelves', (580, 90, 420, 330), 74, 'behind'),
            ('THE COUNTER', (620, 430, 480, 260), 54, 'behind'),
            ('THE SIGN (leaning on the wall)', (1160, 400, 320, 170), 98, 'behind'),
            ('THE BACK ROOM (the doorway, the crate, the calendar)', (1530, 110, 320, 580), 44, 'behind'),
            ('THE SWEPT FLOOR (the pile of sweepings)', (440, 640, 120, 50), 92, 'behind'),
        ],
        'lamp': (380, 780, 700, 160),
        'marks': {'entrance': (260, 790, 'right')},
        'walk': (180, 740, 1600, 110),
        'exit': ('THE DOOR TO THE LANE', 'the_lane'),
        'layoutThad': (1000, 790),
        'figures': [(450, 740, False), (700, 800, False), (1300, 740, True), (260, 790, False), (900, 850, False),
                    (1650, 850, True)],
        'occlusionNote': 'Nothing stands nearer the camera than the walk band, and nobody is in the room.',
        'lightSources': [],
    },
    41: {
        'id': 'schoolhouse', 'name': 'THE SCHOOLHOUSE',
        'what': 'A new one-room schoolhouse at night, never used, lit by what comes through its clean window.',
        'depth': INTERIOR,
        'surfaces': [
            ('ceiling shadow', (0, 0, 1920, 60), 40),
            ('walls, new plank', (0, 60, 1920, 630), 70),
            ('floor, new boards', (0, 690, 1920, 174), 84),
        ],
        'objects': [
            ('THE DOOR', (20, 150, 170, 540), 50, 'behind'),
            ('THE DOOR (its fourteen hooks, on a rail)', (210, 230, 360, 34), 96, 'behind'),
            ('THE WINDOW (the town far off)', (610, 110, 240, 290), 58, 'behind'),
        ] + [
            # FOURTEEN DESKS, two rows of seven, each its own block: doc 105 counts them, and the first master drew
            # sixteen from one block (doc 55 section 8: count the repeated things before anything else is spent).
            (f'THE DESKS (row {r + 1}, desk {c + 1})', (640 + c * 102 - r * 30, 470 + r * 100, 84, 120 + r * 20), 54, 'behind')
            for r in range(2) for c in range(7)
        ] + [
            ('THE BLACKBOARD (the chalk on its ledge)', (1380, 110, 380, 240), 40, 'behind'),
            ('THE BELL ON THE DESK (the teacher\'s desk)', (1420, 450, 260, 240), 62, 'behind'),
            ('THE STOVE (kettle, cup, scuttle)', (1730, 300, 170, 390), 46, 'behind'),
        ],
        'lamp': (550, 790, 700, 160),
        'marks': {'entrance': (300, 790, 'right')},
        'walk': (180, 740, 1600, 110),
        'exit': ('THE DOOR', 'town_map'),
        'layoutThad': (1000, 790),
        'figures': [(450, 740, False), (700, 800, False), (1300, 740, True), (300, 790, False), (900, 850, False),
                    (1650, 850, True)],
        'occlusionNote': 'Nothing stands nearer the camera than the walk band, and nobody is in the room.',
        'lightSources': [],
    },
}


def height_at(depth, y):
    (fy, fh), (ny, nh) = depth['far'], depth['near']
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


def build(n):
    r = ROOMS[n]
    depth = r['depth']
    far, near = depth['far'], depth['near']
    plate = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(plate)
    for _, (x, y, w, h), v in r['surfaces']:
        d.rectangle([x, y, x + w - 1, y + h - 1], fill=v)
    lx, ly, lw, lh = r['lamp']
    yy, xx = np.mgrid[0:H, 0:W]
    pool = np.clip(1 - (((xx - lx) / lw) ** 2 + ((yy - ly) / lh) ** 2), 0, 1) * 10
    base = np.asarray(plate).astype(float)
    base[680:] += pool[680:]
    plate = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(plate)
    for name, (x, y, w, h), v, where in r['objects']:
        if where != 'front':
            d.rectangle([x, y, x + w - 1, y + h - 1], fill=v)
    plate.save(os.path.join(ROOT, f'renders/room-{n}-graybox.png'))

    arr = np.asarray(plate).astype(float)
    dark, light = anchors(thad_sprite())
    head_top = int(far[0] - far[1])
    head_area = int((far[1] * 0.13) ** 2) * 2
    walk = r['walk']
    surfaces = []
    regions = [(nm, rc) for nm, rc, _ in r['surfaces']] + [(nm, rc) for nm, rc, _, w in r['objects'] if w == 'behind']
    wx0, wx1 = walk[0] - 120, walk[0] + walk[2] + 120
    for name, (x, y, w, h) in regions:
        y0, y1 = max(y, head_top), min(y + h, near[0])
        x0, x1 = max(x, wx0), min(x + w, wx1)
        if y1 <= y0 or x1 <= x0 or (x1 - x0) * (y1 - y0) < head_area:
            continue
        sample = arr[y0:y1, x0:x1].ravel()
        p10, p90 = float(np.percentile(sample, 10)), float(np.percentile(sample, 90))
        dm, lm = p10 - dark, light - p90
        best, other = max(dm, lm), min(dm, lm)
        verdict = ('strong' if best >= 25 and other >= 25 else 'weak' if best >= 25 and other < 15
                   else 'pass' if best >= 25 else 'FAIL')
        surfaces.append({'surface': name, 'p10': round(p10, 1), 'p90': round(p90, 1),
                         'darkAnchorMargin': round(dm, 1), 'lightAnchorMargin': round(lm, 1), 'verdict': verdict})
    surfaces = [s for s in surfaces if not any(s['surface'].startswith(p) for p in r['lightSources'])]

    sprite = thad_sprite()

    def put(img, x, y, flip=False):
        h = int(round(height_at(depth, y)))
        s = sprite.resize((max(1, round(sprite.width * h / sprite.height)), h), Image.BOX)
        if flip:
            s = s.transpose(Image.FLIP_LEFT_RIGHT)
        g = s.convert('LA').convert('RGBA')
        img.paste(g, (x - g.width // 2, y - h), g)

    comp = plate.convert('RGB')
    dd = ImageDraw.Draw(comp)
    for x, y, flip in sorted(r['figures'], key=lambda f: f[1]):
        put(comp, x, y, flip)
    wx, wy, ww, wh = walk
    dd.rectangle([wx, wy, wx + ww, wy + wh], outline=(90, 200, 90), width=3)
    for name, (x, y, _) in r['marks'].items():
        dd.ellipse([x - 8, y - 8, x + 8, y + 8], outline=(220, 180, 60), width=3)
    ex = [o for o in r['objects'] if o[0] == r['exit'][0]][0][1]
    dd.rectangle([ex[0], ex[1], ex[0] + ex[2], ex[1] + ex[3]], outline=(200, 90, 90), width=3)
    comp.save(os.path.join(ROOT, f'renders/room-{n}-graybox-with-thad.png'))

    # THE LAYOUT the composition master is generated against: the graybox with ONE Thad (six would be painted as
    # six people), in the 20:9 safe region of a 1536x1024 canvas (derive.mjs's crop x 8, y 170, 1520x684).
    one = plate.convert('RGB')
    put(one, *r['layoutThad'])
    lay = Image.new('RGB', (1536, 1024), (150, 150, 150))
    lay.paste(one.resize((1520, 684), Image.LANCZOS), (8, 170))
    os.makedirs(os.path.join(ROOT, f'reference/room-{n}'), exist_ok=True)
    lay.save(os.path.join(ROOT, f'reference/room-{n}/layout-1536x1024.png'))

    worst = [s for s in surfaces if s['verdict'] in ('weak', 'FAIL')]
    out = {
        'room': n,
        'note': f"Ruling 22 steps 1-6 for {r['name']}, written by tools/interiors-graybox.py before any image "
                'operation. Positions and values are the plan the plate is generated against (errata 183).',
        'what': r['what'],
        'thadAnchors': {'dark': round(dark, 1), 'light': round(light, 1), 'source': os.path.relpath(THAD, ROOT)},
        'depth': {'far': {'y': far[0], 'height': far[1]}, 'near': {'y': near[0], 'height': near[1]}, 'from': depth['from']},
        'walkable': list(walk),
        'exit': {'hotspot': r['exit'][0], 'to': r['exit'][1], 'rect': list(ex)},
        'marks': {k: {'x': v[0], 'y': v[1], 'facing': v[2]} for k, v in r['marks'].items()},
        'objects': [{'name': nm, 'rect': list(rc), 'where': w} for nm, rc, _, w in r['objects']],
        'occluders': [],
        'occlusionNote': r['occlusionNote'],
        'surfaces': surfaces,
        'legibilityGate': 'PASS' if not worst else 'REVIEW',
        'weakOrFailing': worst,
    }
    os.makedirs(os.path.join(ROOT, f'proofs/room-{n}'), exist_ok=True)
    with open(os.path.join(ROOT, f'proofs/room-{n}/graybox.json'), 'w') as f:
        json.dump(out, f, indent=1)
        f.write('\n')
    print(json.dumps({k: out[k] for k in ('thadAnchors', 'legibilityGate')}, indent=1))
    for s in surfaces:
        print(f"  {s['verdict']:6} {s['surface']:38} p10 {s['p10']:5} p90 {s['p90']:5}  "
              f"dark {s['darkAnchorMargin']:6} light {s['lightAnchorMargin']:6}")


if __name__ == '__main__':
    build(int(sys.argv[1]))
