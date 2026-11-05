"""A night plate's brightness lift: one gain, pixel by pixel. No image operation.

Tyler, 2026-11-05: Rooms 23 and 25 read darker than the approved night rooms
(the night road, Boot Hill, the back alley), so each is lifted toward them.
Every pixel gains (gain - 1) times its own luminance on all three channels,
clipped: brighter by its own light, its hue untouched -- multiplying the
channels instead stretched the night's purples past the key gate (red and
blue over green), which reads them as #FF00FF. No smoothing, no resampling,
no new colours between neighbours -- a pixel stays a pixel. The
gain is the room's, chosen to bring the lower half of the frame (where people
stand and things are clicked) to the approved rooms' level, and is written in
the room's frame.json beside the crop.

usage: python3 tools/art/plate-lift.py <in.png> <out.png> <gain>
"""
import json
import sys

import numpy as np
from PIL import Image


def ground(a):
    L = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
    g = L[int(L.shape[0] * 0.55):]
    return round(float(g.mean()), 1), round(float(np.percentile(g, 90)), 1)


def main():
    src, out, gain = sys.argv[1], sys.argv[2], float(sys.argv[3])
    img = Image.open(src)
    mode = img.mode
    img = img.convert('RGBA')
    a = np.asarray(img).astype(float)
    lifted = a.copy()
    L = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
    lifted[..., :3] = np.clip(np.rint(a[..., :3] + ((gain - 1) * L)[..., None]), 0, 255)
    # Saved in the derived plate's own mode: a plate has no alpha and no key.
    Image.fromarray(lifted.astype(np.uint8)).convert(mode).save(out)
    print(json.dumps({'gain': gain, 'groundBefore': ground(a), 'groundAfter': ground(lifted)}))


if __name__ == '__main__':
    main()
