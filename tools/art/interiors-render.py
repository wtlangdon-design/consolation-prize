"""A render of one of the six interiors with Thad in it, as the engine draws it (reference/ancillary-interiors/
brief.md: "A render of the room with Thad in it: pushed, and sent to Tyler"). No image operation.

    python3 tools/art/interiors-render.py 42

The room file's plate and props, each ambient person on its rest frame at the room's man where they stand, and
Thad (art/actors/thad-stand-front/stand-00.png) at the first person's talk spot -- or at the room's entrance where
nobody lives -- drawn at the room's depth there, NEAREST. Writes renders/room-NN-<id>-with-thad.png.
"""
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
IDS = {42: 'barbers', 38: 'photographers_studio', 37: 'boarding_house_parlour', 39: 'bakehouse', 40: 'empty_storefront',
       41: 'schoolhouse', 45: 'washout', 46: 'mine_adit', 47: 'mine_climb', 48: 'mine_two_rocks', 49: 'mine_line',
       50: 'ledge', 51: 'gulch_tents', 52: 'grog_tent'}
# WHERE THAD STANDS FOR THE PICTURE, where nobody lives and the entrance is at an edge (Fiddler's Gulch): on the floor,
# in the room's own walk band, clear of every figure.
STANDS = {45: (760, 812), 46: (760, 800), 47: (980, 790), 48: (1080, 790), 49: (720, 800), 50: (600, 600)}


def man(room, y):
    ann = json.load(open(os.path.join(ROOT, f'reference/room-{room}/annotation.json')))['scaling']
    (fy, fh), (ny, nh) = (ann['far']['y'], ann['far']['height']), (ann['near']['y'], ann['near']['height'])
    return fh + (nh - fh) * (y - fy) / (ny - fy)


def main(n):
    rid = IDS[n]
    room = [json.load(open(os.path.join(ROOT, p))) for p in json.load(open(os.path.join(ROOT, 'content/manifest.json')))['rooms']]
    room = [r for r in room if r['id'] == rid][0]
    img = Image.open(os.path.join(ROOT, room['background'])).convert('RGBA')
    for prop in room.get('props', []):
        x, y, w, h = prop['frame']
        sheet = Image.open(os.path.join(ROOT, prop['sheet'])).convert('RGBA').crop((x, y, x + w, y + h))
        img.alpha_composite(sheet, (prop['x'] - w // 2, prop['y'] - h))
    people = [json.load(open(os.path.join(ROOT, f'content/ambient/{a.replace("_", "-")}.json'))) for a in room.get('ambient', [])]
    stand = None
    for p in people:
        s = p['sprite']
        x, y, w, h = s['frames'][0]
        f = Image.open(os.path.join(ROOT, s['sheet'])).convert('RGBA').crop((x, y, x + w, y + h))
        f = f.crop(f.getbbox())
        k = man(n, p['y']) * s.get('stature', 1) / s['figureHeight']
        f = f.resize((round(f.width * k), round(f.height * k)), Image.NEAREST)
        img.alpha_composite(f, (p['x'] - f.width // 2, p['y'] - f.height))
        stand = stand or p.get('walkTo')
    tx, ty = STANDS.get(n) or ((stand['x'], stand['y']) if stand else tuple(room['entrance']))
    t = Image.open(os.path.join(ROOT, 'art/actors/thad-stand-front/stand-00.png')).convert('RGBA')
    t = t.crop(t.getbbox())
    h = round(man(n, ty))
    t = t.resize((round(t.width * h / t.height), h), Image.NEAREST)
    img.alpha_composite(t, (tx - t.width // 2, ty - h))
    out = os.path.join(ROOT, f'renders/room-{n}-{rid.replace("_", "-")}-with-thad.png')
    img.convert('RGB').save(out)
    print(os.path.relpath(out, ROOT))


if __name__ == '__main__':
    main(int(sys.argv[1]))
