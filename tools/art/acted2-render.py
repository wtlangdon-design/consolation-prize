"""Acted directions, the second pass: every new pose beside Thad, in its room, at game size. No image operation.

Each figure is drawn as tools/art/beside-thad.py draws its rest frame -- at the scale and the spot it printed for that
figure (its frame-0 cell drawn W x H at x,y; Thad N tall at tx,y) -- and each new frame in its place, one panel a
frame. Writes renders/acted-directions-2-beside-thad.png.
"""
import json, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda p: os.path.join(ROOT, p)
# key: (record, first new frame, cell drawn height in the room, x, y, Thad's height there, Thad's x) -- beside-thad.py's print
SPOTS = {} if os.environ.get('ACTED3') else {
    'pratt': ('content/ambient/pratt.json', 7, 387, 1450, 716, 383, 1032),
    'pratt-jump': ('content/ambient/pratt-jump.json', 6, 429, 560, 762, 399, 201),
    'rule-keeper': ('content/ambient/gulch-rule-keeper.json', 7, 370, 672, 731, 398, 352),
    'lookout': ('content/ambient/gulch-lookout.json', 5, 322, 1560, 640, 322, 1394),
    'deacon': ('content/ambient/gulch-deacon.json', 6, 426, 1202, 714, 385, 902),
    'winnie': ('content/ambient/winnie.json', 5, 168, 1045, 387, 253, 840),
    'ozymandia': ('content/ambient/ozymandia.json', 7, 219, 966, 500, 272, 738),
    'frame': ('content/ambient/frame.json', 7, 521, 1379, 717, 502, 1110),
    'deke': ('content/ambient/deke-vessel.json', 6, 428, 1046, 815, 428, 746),
    'letter-writer': ('content/ambient/letter-writer.json', 5, 320, 1295, 775, 306, 1134),
    'panner': ('content/ambient/gulch-panner.json', 6, 408, 1790, 690, 376, 1561),
}
# Thad's strips, in a room where each is played: (strip, frames, room, x, y, Thad's man there, his figure height on the canvas)
STRIPS = {} if os.environ.get('ACTED3') else {
    'thad-back': ('art/actors/thad-acted2-back.png', 'mine_line', 620, 655, 377, 627),
    'thad-right': ('art/actors/thad-acted2-right.png', 'ozymandias_tent', 440, 800, None, 626),
}


if os.environ.get('ACTED3'):                       # tools/art/acted3-render.py: the third pass's street people
    SPOTS.update({
        'letter-writer': ('content/ambient/letter-writer.json', 6, 235, 1295, 775, 224, 1166),
        'man-leaving': ('content/ambient/man-leaving-tomorrow.json', 6, 154, 2810, 712, 152, 2688),
        'bell-ringer': ('content/ambient/bell-ringer.json', 5, 195, 929, 700, 187, 798),
        'map-seller': ('content/ambient/map-seller.json', 5, 142, 3185, 668, 136, 3087),
    })


def main():
    thad = Image.open(R('art/actors/thad-stand-front/stand-00.png')).convert('RGBA'); thad = thad.crop(thad.getbbox())
    rooms = {json.load(open(R(p)))['id']: json.load(open(R(p))) for p in json.load(open(R('content/manifest.json')))['rooms']}
    rows = []
    for key, (rec_p, first, dh, x, y, th, tx) in SPOTS.items():
        rec = json.load(open(R(rec_p))); s = rec['sprite']
        sheet = Image.open(R(s['sheet'])).convert('RGBA')
        cpath = R(f"art/staging/acted-directions-{'3' if os.environ.get('ACTED3') else '2'}/{key}/cut.json")
        if not os.path.exists(cpath):
            continue
        cut = json.load(open(cpath))[key]['newFrames']
        if key in ('panner', 'bell-ringer', 'map-seller'):    # redrawn whole: the new rest frame first, then the poses
            cut = [s['frames'][0]] + cut
        cell_h = s['frames'][0][3]
        k = dh / cell_h
        plate = Image.open(R(rooms[rec['room']]['background'])).convert('RGBA')
        T = thad.resize((round(thad.width * th / thad.height), th), Image.NEAREST)
        panels = []
        for fx, fy, fw, fh in cut:
            f = sheet.crop((fx, fy, fx + fw, fy + fh))
            f = f.resize((round(fw * k), round(fh * k)), Image.NEAREST)
            im = plate.copy()
            im.alpha_composite(T, (tx - T.width // 2, y - T.height + 1))
            im.alpha_composite(f, (x - f.width // 2, y - f.height + 1))
            x0 = max(0, min(tx, x) - 260); x1 = min(plate.width, max(tx, x) + 260)
            y0 = max(0, y - max(th, f.height) - 40); y1 = min(plate.height, y + 30)
            panels.append(im.crop((x0, y0, x1, y1)).convert('RGB'))
        Hh = 360
        panels = [p.resize((round(p.width * Hh / p.height), Hh), Image.NEAREST) for p in panels]
        row = Image.new('RGB', (sum(p.width for p in panels) + 8 * (len(panels) - 1), Hh), (0, 0, 0)); xx = 0
        for p in panels:
            row.paste(p, (xx, 0)); xx += p.width + 8
        rows.append(row)
    for key, (path, room_id, x, y, man, fig) in STRIPS.items():
        if not os.path.exists(R(path)):
            continue
        strip = Image.open(R(path)).convert('RGBA')
        room = rooms[room_id]
        if man is None:
            ns = {'__file__': R('tools/art/beside-thad.py')}
            src = open(ns['__file__']).read(); exec(src[:src.index('def main')], ns)
            man = ns['curve_man'](room, x, y)
        stand = Image.open(R(f"art/actors/{'thad-idle-back' if 'back' in key else 'thad-idle-right'}/idle-00.png")).convert('RGBA')
        cw = stand.width; n = strip.width // cw; k = man / fig
        plate = Image.open(R(room['background'])).convert('RGBA')
        panels = []
        bx0, _, bx1, by1 = strip.crop((0, 0, cw, strip.height)).getbbox()      # frame 0: his feet and his middle
        ax, ay = round((bx0 + bx1) / 2 * k), round(by1 * k)
        for i in range(n):
            f = strip.crop((i * cw, 0, (i + 1) * cw, strip.height))
            f = f.resize((round(f.width * k), round(f.height * k)), Image.NEAREST)
            im = plate.copy(); im.alpha_composite(f, (x - ax, y - ay))
            x0 = max(0, x - 330); x1 = min(plate.width, x + 330); y0 = max(0, y - round(man) - 60); y1 = min(plate.height, y + 30)
            panels.append(im.crop((x0, y0, x1, y1)).convert('RGB'))
        Hh = 360
        panels = [p.resize((round(p.width * Hh / p.height), Hh), Image.NEAREST) for p in panels]
        row = Image.new('RGB', (sum(p.width for p in panels) + 8 * (len(panels) - 1), Hh), (0, 0, 0)); xx = 0
        for p in panels:
            row.paste(p, (xx, 0)); xx += p.width + 8
        rows.append(row)
    W = max(r.width for r in rows); out = Image.new('RGB', (W, sum(r.height + 12 for r in rows)), (0, 0, 0)); yy = 0
    for r in rows:
        out.paste(r, (0, yy)); yy += r.height + 12
    name = 'acted-directions-3-street-beside-thad' if os.environ.get('ACTED3') else 'acted-directions-2-beside-thad'
    out.save(R(f'renders/{name}.png'))
    print(f'wrote renders/{name}.png', out.size)


main()
