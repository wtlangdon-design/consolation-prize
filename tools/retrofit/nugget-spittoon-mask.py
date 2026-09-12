#!/usr/bin/env python3
"""Cut the Nugget's one occlusion plane: the spittoon.

Phase 2A made the spittoon's OBSTACLE its base line rather than its silhouette,
because the whole drawn object stood in open dirt and cut the near floor in
two. That was right, and it left this: Thad may now walk BEHIND the spittoon,
and with no plane cut he draws over it -- a man standing at y 800 with a brass
spittoon at y 745-864 in front of him, and his shins on top of it.

THE MASK IS A 1-BIT STENCIL OVER THE PLATE'S OWN PIXELS AND IS NEVER DRAWN.
The brass is already in the background; the plane only says which of those
pixels win. So no object is duplicated and nothing shifts by a pixel.

AUTHORED, NOT THRESHOLDED, and the measurement is why: in the band around it
the spittoon runs luminance 19-84 against dirt at 31-51 and warmth 44-64
against 45-53. The two overlap almost completely -- the brass is lit by the
same lamps as the floor it stands on -- so any threshold that catches its body
catches half the dirt with it. The outline below is read off a gamma-lifted 5x
capture on a 10 px grid, the same way the trough's mask was cut in phase 1.5G,
and tools/retrofit/nugget-spittoon-mask.py --check draws it back over the art.
"""
import hashlib, json, os, sys
from PIL import Image, ImageDraw

PLATE = 'art/staging/room-03/rebuild-03/plate-room-03-rebuilt.png'
OUT   = 'art/masks/room-03-plane-1.png'
SIZE  = (1920, 864)

SPITTOON = [
    (1430, 760), (1452, 759), (1468, 762), (1482, 769), (1491, 778), (1493, 790),
    (1488, 799), (1486, 847), (1495, 855), (1495, 864),
    (1394, 864), (1394, 855), (1404, 847), (1402, 799),
    (1397, 790), (1398, 778), (1407, 769), (1419, 762),
]


def build():
    m = Image.new('RGBA', SIZE, (0, 0, 0, 0))
    ImageDraw.Draw(m).polygon(SPITTOON, fill=(0, 0, 0, 255))
    return m


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    m = build()
    if '--check' in sys.argv:
        plate = Image.open(PLATE).convert('RGB')
        over = plate.copy()
        tint = Image.new('RGB', SIZE, (255, 0, 140))
        over.paste(tint, (0, 0), m.split()[3].point(lambda v: v // 2))
        over.crop((1360, 730, 1530, 864)).resize((170 * 4, 134 * 4), Image.NEAREST) \
            .save('/tmp/spittoon-check.png')
        print('wrote /tmp/spittoon-check.png')
        return
    m.save(OUT)
    cover = sum(1 for px in m.getdata() if px[3] > 127)
    rec = {'mask': OUT, 'sha256': hashlib.sha256(open(OUT, 'rb').read()).hexdigest(),
           'size': list(SIZE), 'opaquePixels': cover, 'points': len(SPITTOON),
           'subject': 'the spittoon, and nothing else in this room occludes anybody'}
    print(json.dumps(rec, indent=1))


main()
