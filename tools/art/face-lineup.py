"""Face line-up: every figure's head at game size (its room's scale), Thad first, wrapped rows.

Usage: face-lineup.py <jobs.json from tools/art/figure-audit-sheets.mjs> <out.png>
"""
import json, sys
from PIL import Image, ImageDraw
jobs = json.load(open(sys.argv[1])); out = sys.argv[2]
tiles = []
def head(img, frac=0.3):
    bb = img.getbbox(); img = img.crop(bb)
    return img.crop((0, 0, img.width, max(1, int(img.height * frac))))
t = Image.open('art/actors/thad-stand-front/stand-00.png').convert('RGBA')
fig = json.load(open('art/actors/thad-stand-front/rig.json'))['figure'][1]
for room_man in (340,):
    s = room_man / fig; h = head(t); tiles.append((f'THAD at man {room_man}', h.resize((max(1, round(h.width * s)), max(1, round(h.height * s))), Image.LANCZOS if s < 1 else Image.NEAREST)))
seen = set()
for j in jobs:
    k = (j['id'], j['room'])
    if k in seen: continue
    seen.add(k)
    im = Image.open(j['sheet']).convert('RGBA'); x, y, w, h = j['frame']
    f = im.crop((x, y, x + w, y + h))
    if not f.getbbox(): continue
    hd = head(f); s = j['scale']
    hd = hd.resize((max(1, round(hd.width * s)), max(1, round(hd.height * s))), Image.NEAREST if s >= 1 else Image.BOX)
    tiles.append((f"{j['id']}/{j['room']} man {j['man']}", hd))
W = 2400; pad = 6; rows = []; row = []; rw = 0
for lab, im in tiles:
    if rw + im.width + pad > W and row: rows.append(row); row = []; rw = 0
    row.append((lab, im)); rw += max(im.width, 200) + pad
rows.append(row)
H = sum(max(i.height for _, i in r) + 22 for r in rows)
c = Image.new('RGB', (W, H), (24, 25, 30)); d = ImageDraw.Draw(c); yy = 0
for r in rows:
    xx = 0
    for lab, im in r:
        c.paste((38, 40, 48), (xx, yy, xx + max(im.width, 200), yy + 20 + im.height))
        c.paste(im, (xx, yy + 18), im); d.text((xx + 2, yy + 2), lab, fill=(240, 220, 90))
        xx += max(im.width, 200) + pad
    yy += max(i.height for _, i in r) + 22
c.save(out); print(c.size)
