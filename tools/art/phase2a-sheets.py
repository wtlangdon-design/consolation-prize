"""PHASE 2A: the cut figures become shipping sprite sheets (doc 36 Q128).

    python3 tools/art/phase2a-sheets.py

Each extracted figure is pre-scaled ONCE, here, to the height the room asks for
where that character stands, and the sheet records that height as
`figureHeight`. The engine then draws it at a scale of about 1.0 instead of
downscaling a 1200 px painting to 250 px on every frame -- which, with
`pixelArt: true` and nearest-neighbour sampling, is how a good painting becomes
a bad sprite. The scale stays live: if the room's curve changes, or the
character is restaged, the engine still gets it right, it is just no longer
exactly 1.

Premultiplied before the resize and the edge bled outward first, doc 38 R4:
transparent pixels are stored black, and any interpolation near an edge
averages colour toward it.

ONE FRAME EACH. Phase 2A is static staging. Idle beats, breaks and occupational
loops are Phase 2B's, after Tyler has accepted these faces in the room.
"""
import json, os
from PIL import Image
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)


def bleed(rgba, rounds=3):
    """Push edge colour outward under the transparent pixels before resizing."""
    arr = np.asarray(rgba).astype(np.int16).copy()
    for _ in range(rounds):
        a = arr[..., 3]
        empty = a == 0
        if not empty.any():
            break
        filled = ~empty
        acc = np.zeros(arr.shape[:2] + (3,), dtype=np.int32)
        count = np.zeros(arr.shape[:2], dtype=np.int32)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            src = np.roll(np.roll(filled, dy, 0), dx, 1)
            rgb = np.roll(np.roll(arr[..., :3], dy, 0), dx, 1)
            use = src & empty
            acc[use] += rgb[use]
            count[use] += 1
        take = empty & (count > 0)
        arr[..., :3][take] = (acc[take] // count[take][:, None])
    return Image.fromarray(arr.astype(np.uint8), 'RGBA')


def resize_to(path, target_h, out):
    im = Image.open(path).convert('RGBA')
    im = bleed(im)
    scale = target_h / im.height
    size = (max(1, round(im.width * scale)), max(1, round(im.height * scale)))
    r, g, b, a = im.split()
    black = Image.new('L', im.size, 0)
    pm = Image.merge('RGB', (Image.composite(r, black, a), Image.composite(g, black, a),
                             Image.composite(b, black, a))).resize(size, Image.LANCZOS)
    aa = a.resize(size, Image.LANCZOS)
    out_im = Image.new('RGBA', size)
    px, ap, op = pm.load(), aa.load(), out_im.load()
    for j in range(size[1]):
        for i in range(size[0]):
            al = ap[i, j]
            if al:
                cr, cg, cb = px[i, j]
                op[i, j] = (min(255, cr * 255 // al), min(255, cg * 255 // al),
                            min(255, cb * 255 // al), al)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    out_im.save(out)
    return out_im.size


def curve_height(curve, y):
    """The room's man-height at a row -- CLAMPED at both ends, exactly as
    WalkBoxes.heightIn does. The man on the landing stands at y 168, well above
    the far anchor at 506, and without the clamp the curve extrapolates him to
    a NEGATIVE height. The engine would have clamped and this would have
    quietly disagreed with it."""
    far, near = curve['far'], curve['near']
    span = near['y'] - far['y']
    if span == 0:
        return near['height']
    t = max(0.0, min(1.0, (y - far['y']) / span))
    return far['height'] + t * (near['height'] - far['height'])


made = {'schema': 1, 'note': 'PHASE 2A: the shipping sprite sheets, each pre-scaled once to the '
        'height its room asks for where the character stands. One frame each: static staging.',
        'sheets': []}

# ---- MAIN STREET ------------------------------------------------------------
street = json.load(open('reference/room-02-candidate/street-staging.json'))
room2 = json.load(open('content/rooms/main-street-candidate.json'))
c2 = next(b['scaleMode'] for b in room2['walkBoxes'] if b['scaleMode']['kind'] == 'curve')
curve2 = {'far': {'y': c2['farY'], 'height': c2['farHeight']},
          'near': {'y': c2['nearY'], 'height': c2['nearHeight']}}
CUTS = {
    'letter_writer': 'art/staging/room-02/cast-letter-writer-01/letter-writer.png',
    'pie_woman': 'art/staging/room-02/cast-pie-woman-01/pie-woman.png',
    'map_seller': 'art/staging/room-02/cast-map-seller-01/map-seller.png',
}
SHEETS = {
    'letter_writer': 'art/actors/cast-letter-writer.png',
    'pie_woman': 'art/actors/cast-pie-woman.png',
    'map_seller': 'art/actors/cast-map-seller.png',
}
print('MAIN STREET')
for who in street['characters']:
    target = round(curve_height(curve2, who['at'][1]) * who['stature'])
    size = resize_to(CUTS[who['id']], target, SHEETS[who['id']])
    print(f"  {who['id']:16s} -> {SHEETS[who['id']]}  {size[0]}x{size[1]}  figureHeight {target}")
    made['sheets'].append({'id': who['id'], 'room': 'main_street_candidate',
                           'sheet': SHEETS[who['id']], 'width': size[0], 'height': size[1],
                           'figureHeight': target, 'stature': who['stature'], 'at': who['at']})

# The letter-writer's station is a PROP of the room, not a person: it is scaled
# by the same curve at the same feet so the two belong together, and it has no
# stature of its own -- a table is not 0.96 of a man.
station_h = round(curve_height(curve2, 658) * 0.60)
size = resize_to('art/staging/room-02/cast-letter-writer-01/letter-writer-station.png',
                 station_h, 'art/actors/cast-letter-writer-station.png')
print(f"  {'station':16s} -> art/actors/cast-letter-writer-station.png  {size[0]}x{size[1]}")
made['sheets'].append({'id': 'letter_writer_station', 'room': 'main_street_candidate',
                       'sheet': 'art/actors/cast-letter-writer-station.png',
                       'width': size[0], 'height': size[1], 'figureHeight': station_h,
                       'note': 'A PROP, not a person. 0.60 of the room\'s man at the same feet: '
                               'the table\'s top sits at his hip and the satchel on the ground '
                               'beside it, which is how it was painted.'})

# ---- THE NUGGET -------------------------------------------------------------
nugget = json.load(open('reference/room-03-candidate/nugget-staging.json'))
print('\nTHE NUGGET')
for who in nugget['characters']:
    target = round(curve_height(nugget['curve'], who['at'][1]) * who['stature'])
    size = resize_to(who['cut'], target, who['sheet'])
    print(f"  {who['id']:20s} -> {who['sheet']}  {size[0]}x{size[1]}  figureHeight {target}")
    made['sheets'].append({'id': who['id'], 'room': 'nugget_candidate', 'sheet': who['sheet'],
                           'width': size[0], 'height': size[1], 'figureHeight': target,
                           'stature': who['stature'], 'at': who['at']})

json.dump(made, open('art/staging/phase2a-sheets.json', 'w'), indent=1)
print('\nart/staging/phase2a-sheets.json')
