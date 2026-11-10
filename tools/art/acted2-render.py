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
SPOTS = {
    'pratt': ('content/ambient/pratt.json', 7, 387, 1450, 716, 383, 1032),
    'pratt-jump': ('content/ambient/pratt-jump.json', 6, 429, 560, 762, 399, 201),
    'rule-keeper': ('content/ambient/gulch-rule-keeper.json', 7, 370, 672, 731, 398, 352),
    'lookout': ('content/ambient/gulch-lookout.json', 5, 322, 1560, 640, 322, 1394),
    'deacon': ('content/ambient/gulch-deacon.json', 6, 426, 1202, 714, 385, 902),
}


def main():
    thad = Image.open(R('art/actors/thad-stand-front/stand-00.png')).convert('RGBA'); thad = thad.crop(thad.getbbox())
    rooms = {json.load(open(R(p)))['id']: json.load(open(R(p))) for p in json.load(open(R('content/manifest.json')))['rooms']}
    rows = []
    for key, (rec_p, first, dh, x, y, th, tx) in SPOTS.items():
        rec = json.load(open(R(rec_p))); s = rec['sprite']
        sheet = Image.open(R(s['sheet'])).convert('RGBA')
        cut = json.load(open(R(f'art/staging/acted-directions-2/{key}/cut.json')))[key]['newFrames']
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
    W = max(r.width for r in rows); out = Image.new('RGB', (W, sum(r.height + 12 for r in rows)), (0, 0, 0)); yy = 0
    for r in rows:
        out.paste(r, (0, yy)); yy += r.height + 12
    out.save(R('renders/acted-directions-2-beside-thad.png'))
    print('wrote renders/acted-directions-2-beside-thad.png', out.size)


main()
