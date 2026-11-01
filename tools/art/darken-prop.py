"""Darken a graded prop so it sits in its room.

Tyler, 2026-11-01, on the Nugget's whiskey barrel: "It's too bright. Please
darken it so it fits in better." Graded to the bar front it matched that
surface's mean (39 against 38) and still read bright beside the stools and
Deke: it was lit evenly top to bottom, where everything standing on that
floor falls into shadow toward its base. So two things, both darkening:

  1. BRIGHTNESS: every opaque pixel times BRIGHTNESS.
  2. FALLOFF: a further multiply ramping from 1 at the top of the sheet to
     BASE at the bottom row, the shade a thing standing on the floor gathers
     round its foot.

Alpha is untouched, so the edge the cut made is the edge that ships.

Usage: darken-prop.py <graded.png> <out.png> <brightness> <base>
"""
import sys
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
brightness, base = float(sys.argv[3]), float(sys.argv[4])
a = np.asarray(Image.open(src).convert('RGBA')).astype(float)
h = a.shape[0]
ramp = (1 - (1 - base) * (np.arange(h) / max(1, h - 1)))[:, None, None]
a[..., :3] = np.clip(a[..., :3] * brightness * ramp, 0, 255)
Image.fromarray(np.round(a).astype(np.uint8), 'RGBA').save(out)
print(f'{src} -> {out}: brightness {brightness}, base {base}')
