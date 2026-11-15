"""Deke's glass, in his hand, the colours of the glass on the barrel (errata 329).

Tyler, 2026-11-15: "The color of the beer mug on the barrel is different from its color when Deke picks it up to
drink it. They need to match." The barrel's glass (art/props/room-03-barrel.png) is whiskey-amber in a dark,
gold-rimmed glass. In his hand (art/actors/deke-vessel.png, frames 6 and 7: the glass at his chest, the glass raised)
the same glass was drawn pale pink and cream. No image operation: every pale, cool pixel of the held glass (inside
the glass's box in each frame, opaque, brighter than his coat and bluer than his skin) takes the colour the barrel's
glass has at the same rank of brightness. His hand and his coat are not touched.

Idempotent: a pixel once recoloured is gold or amber, no longer cool, and is not picked again.

  python3 tools/art/deke-glass-match.py [--write]
"""
import json
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda p: os.path.join(ROOT, p)
SHEET, BARREL, RECORD = 'art/actors/deke-vessel.png', 'art/props/room-03-barrel.png', 'content/ambient/deke-vessel.json'
# The glass in each held frame, frame-relative (x0, x1, y0, y1): the rim and the side the hand leaves showing.
HELD = {6: (68, 106, 80, 120), 7: (55, 93, 36, 76)}
# The glass on the barrel, above the barrel's own lid.
ON_BARREL = (45, 76, 0, 31)
LUM = np.array([0.299, 0.587, 0.114])


def cool(px):
    r, b, a = px[..., 0], px[..., 2], px[..., 3]
    return (a > 128) & (px[..., :3] @ LUM > 75) & (b > 0.5 * r)


def main():
    write = '--write' in sys.argv
    sheet = np.asarray(Image.open(R(SHEET)).convert('RGBA')).astype(int)
    barrel = np.asarray(Image.open(R(BARREL)).convert('RGBA')).astype(int)
    x0, x1, y0, y1 = ON_BARREL
    glass = barrel[y0:y1, x0:x1]
    palette = glass[glass[..., 3] > 128][:, :3]
    palette = palette[np.argsort(palette @ LUM)]
    frames = json.load(open(R(RECORD)))['sprite']['frames']
    out = sheet.copy()
    changed = 0
    for index, (gx0, gx1, gy0, gy1) in HELD.items():
        fx, fy, _, _ = frames[index]
        region = out[fy + gy0:fy + gy1, fx + gx0:fx + gx1]
        pick = cool(region)
        if not pick.any():
            continue
        lums = region[..., :3][pick] @ LUM
        ranks = np.argsort(np.argsort(lums)) / max(1, len(lums) - 1)
        region[..., :3][pick] = palette[np.round(ranks * (len(palette) - 1)).astype(int)]
        changed += int(pick.sum())
    print(json.dumps({'recoloured': changed, 'paletteFrom': BARREL, 'frames': sorted(HELD)}))
    if write and changed:
        Image.fromarray(out.astype(np.uint8)).save(R(SHEET))


if __name__ == '__main__':
    main()
