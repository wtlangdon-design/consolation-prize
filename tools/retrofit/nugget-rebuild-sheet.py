#!/usr/bin/env python3
"""Draw the Room 3 rebuild proof sheet from the numbers the proof asserted on.

Read by tools/retrofit/nugget-rebuild-proof.ts, which writes the json first and
then calls this: one set of measurements, two readers, so the picture cannot
drift from the assertions.
"""
import json, os
from PIL import Image, ImageDraw

os.chdir(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
s = json.load(open('proofs/room-03/rebuild-sheet.json'))
im = Image.open(s['plate']).convert('RGB')
d = ImageDraw.Draw(im, 'RGBA')

for n, one in enumerate(s['people'], 1):
    x, y, w, h = one['box']
    colour = (255, 214, 64) if one['kind'] == 'baked' else (96, 220, 255)
    d.rectangle([x, y, x+w, y+h], outline=colour, width=3)
    d.rectangle([x, y-20, x+30, y], fill=colour)
    d.text((x+9, y-16), str(n), fill=(0, 0, 0))
    sx, sy = one['seat']
    d.line([sx-7, sy, sx+7, sy], fill=colour, width=3)
    d.line([sx, sy-7, sx, sy+7], fill=colour, width=3)

px, py, pw, ph = s['piano']
d.rectangle([px, py, px+pw, py+ph], outline=(120, 255, 140), width=3)
d.text((px+6, py+6), 'PIANO -- EMPTY', fill=(120, 255, 140))

fx, fy, fw, fh = s['fifth']
d.rectangle([fx, fy, fx+fw, fy+fh], outline=(255, 120, 200), width=3)
d.text((fx-90, fy+fh+6), 'FIFTH PLACE -- EMPTY', fill=(255, 120, 200))
cx, cy, cw, ch = s['hand']
d.rectangle([cx-3, cy-3, cx+cw+3, cy+ch+3], outline=(255, 120, 200), width=3)
d.text((cx+cw+8, cy-14), 'ABANDONED HAND', fill=(255, 120, 200))

dx, dy, dw, dh = s['deke']
d.rectangle([dx, dy, dx+dw, dy+dh], outline=(180, 140, 255), width=3)
d.text((dx+4, dy+4), 'DEKE (Act II)', fill=(180, 140, 255))
rx, ry, rw, rh = s['raccoon']
d.rectangle([rx, ry, rx+rw, ry+rh], outline=(180, 140, 255), width=2)

for t in s['targets']:
    x, y = int(t['x']), int(t['y'])
    c = (255, 90, 90) if t['kind'] == 'exit' else (255, 255, 255)
    d.ellipse([x-5, y-5, x+5, y+5], outline=c, width=2)
ax, ay = s['arrival']
d.ellipse([ax-11, ay-11, ax+11, ay+11], outline=(255, 90, 90), width=4)
d.text((ax-26, ay+14), 'ARRIVAL', fill=(255, 90, 90))

im.save(s['out'], 'WEBP', quality=88, method=6)
print(f"  wrote {s['out']}  {os.path.getsize(s['out'])//1024} KB")
