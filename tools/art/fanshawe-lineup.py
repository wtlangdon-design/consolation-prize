"""Colonel Fanshawe from every scene, lined up at one man (Tyler, 2026-11-17: "Line up fanshawe from every scene and make
sure they all match"). No image operation.

Each sheet's rest frame is drawn as the game draws it -- scaled by its record's figureHeight to the man where he stands,
or 1:1 for the desk sheets, whose man is the room's at the desk -- and then all of them to one man, M px, beside Thad's
standing frame at the same man. The desk busts are hung from a standing man's crown line. His face (the topmost skin
blob) is measured: its width per man is the check, since the same man's head must be the same size everywhere.

  python3 tools/art/fanshawe-lineup.py [--frames FILE]   writes renders/fanshawe-lineup.png, prints the face widths

--frames takes a JSON {record-or-job: [x, y, w, h]} for sheets whose new frames the records do not have yet.
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda p: os.path.join(ROOT, p)
bt = {'__file__': R('tools/art/beside-thad.py')}
src = open(bt['__file__']).read(); exec(src[:src.index('def main')], bt)
M = 300
DESK_MAN = {'fanshawe-office': 4.09 * 115}
SHEETS = [  # label, record, spriteWhen index, room file
    ('duel (Main St)', 'duel-fanshawe', None, 'main-street'),
    ('office', 'fanshawe', None, 'fanshawe-office'),
    ('office, dinner', 'fanshawe', 0, 'fanshawe-office'),
    ('memorial (Boot Hill)', 'memorial-fanshawe', None, 'boot-hill'),
    ('wreath (Main St)', 'wreath-fanshawe', None, 'main-street'),
]


def face_width(a):
    al = a[..., 3] > 128
    skin = (a[..., 0] > 110) & (a[..., 0] - a[..., 2] > 35) & al
    # the face: the topmost skin blob of a face's size (a speck between wreath flowers is not one), measured on its
    # widest rows above the moustache -- rows where it is at least half its own widest, in its upper half
    lab, n = ndi.label(skin); fig = al.sum(); best = None
    for i in range(1, n + 1):
        m = lab == i; ys, xs = np.nonzero(m)
        if len(ys) < 0.004 * fig or xs.max() - xs.min() < 6 or ys.max() - ys.min() < 6: continue
        if best is None or ys.min() < best[0]: best = (ys.min(), m)
    if best is None: return 0
    m = best[1]; ys = np.nonzero(m.any(1))[0]
    upper = m[ys[0]:ys[0] + max(2, (ys[-1] - ys[0]) // 2)]
    return int(max(r.sum() for r in upper))


def main():
    over = json.load(open(sys.argv[sys.argv.index('--frames') + 1])) if '--frames' in sys.argv else {}
    cells, report = [], {}
    for label, rid, when, room_id in SHEETS:
        rec = json.load(open(R(f'content/ambient/{rid}.json')))
        sp = rec['sprite'] if when is None else {**rec['sprite'], **rec['spriteWhen'][when]['sprite']}
        key = rid if when is None else f'{rid}#{when}'
        fx, fy, w, h = over.get(key, sp['frames'][0])
        room = bt['load'](f'content/rooms/{room_id}.json')
        man = bt['curve_man'](room, rec['x'], rec['y'])
        if sp.get('figureHeight') is None and rec.get('posture') == 'behind-counter':
            # A desk figure: the room's curve at his `y` (the desk's back edge, 304 in the office) is a far floor that
            # does not hold the desk -- shrunk to it he sat behind it like a child. The desk stands nearly at Thad's
            # depth, and its man is the one the one-level test reads for him (block 4.09 x 115 = 470).
            man = DESK_MAN.get(room_id, man)
        fh = sp.get('figureHeight')
        k = M / fh if fh else M / man
        a = np.asarray(Image.open(R(sp['sheet'])).convert('RGBA'))[fy:fy + h, fx:fx + w].astype(int)
        report[label] = round(face_width(a) * k, 1)
        im = Image.fromarray(a.astype(np.uint8)); im = im.resize((max(1, round(w * k)), max(1, round(h * k))), Image.NEAREST)
        cells.append((label, im.crop(im.getbbox()), fh is None))
    thad = bt['load']('content/actors/thad.json')
    st = next(cl for cl in thad['clips'] if cl['id'] == 'stand' and cl['facing'] == 'front' and not cl.get('state'))
    t = Image.open(R(st['frames'][0])).convert('RGBA'); kt = M / st['figureHeight']
    ta = np.asarray(t).astype(int); report['Thad'] = round(face_width(ta) * kt, 1)
    t = t.resize((round(t.width * kt), round(t.height * kt)), Image.NEAREST); cells.insert(0, ('Thad', t.crop(t.getbbox()), False))
    base = M + 70; W = sum(c[1].width for c in cells) + 30 * len(cells) + 30
    o = Image.new('RGBA', (W, base + 60), (70, 70, 74, 255)); d = ImageDraw.Draw(o); fnt = ImageFont.load_default(size=16)
    d.line([(0, base), (W, base)], fill=(140, 140, 140, 255)); d.line([(0, base - M), (W, base - M)], fill=(110, 110, 110, 255))
    x = 20
    for label, f, bust in cells:
        o.alpha_composite(f, (x, base - M if bust else base - f.height))
        d.text((x, base + 8), label, fill=(230, 230, 230, 255), font=fnt)
        d.text((x, base + 28), f'face {report[label]}', fill=(200, 200, 200, 255), font=fnt)
        x += f.width + 30
    o.convert('RGB').save(R('renders/fanshawe-lineup.png'))
    print(json.dumps({'faceWidthAtMan': M, **report}))


if __name__ == '__main__':
    main()
