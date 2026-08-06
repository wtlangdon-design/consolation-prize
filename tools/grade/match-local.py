"""Light a sprite by where it stands, not by a global grade.

TYLER'S OBSERVATION, AND IT MEASURED TRUE: generated sprites "look like they
jump out a bit". They do. Every one was graded and lifted with the same
numbers as the whole plate, and a plate's light is not the same everywhere
along it. The map seller stands at the dark east end of Main Street --
surrounding plate luminance 49, warmth +11 -- and was lit at luminance 111,
warmth +94, as though he were on the saloon porch. The pie woman, who IS on
the saloon porch, measured 76 against her surroundings' 71 and looked right.

So the fault was never that sprites have a look. It is that they were lit for
the wrong place.

This scales a sprite's luminance and its warmth toward the plate immediately
around where it will stand. PARTIALLY, at STRENGTH: a person under a lamp is
genuinely brighter than mud, and matching all the way would paint them into
the background as surely as painting them in. The aim is a figure lit by this
street's lamps, not a figure the same colour as this street.

Usage: match-local.py <sprite.png> <plate.png> <feetX> <feetY> <out.png> [strength]
"""
import sys

import numpy as np
from PIL import Image

STRENGTH = 0.7          # how far toward local light; 1.0 would erase the figure
RING = 30               # pixels of plate sampled around the figure

sprite_path, plate_path, fx, fy, out = sys.argv[1:6]
strength = float(sys.argv[6]) if len(sys.argv) > 6 else STRENGTH
fx, fy = int(fx), int(fy)

sprite = np.array(Image.open(sprite_path).convert('RGBA')).astype(float)
plate = np.array(Image.open(plate_path).convert('RGB')).astype(float)
h, w = sprite.shape[:2]
x0, y0 = fx - w // 2, fy - h

def luma(px):
    return 0.2126 * px[..., 0] + 0.7152 * px[..., 1] + 0.0722 * px[..., 2]

# The plate in a ring around the figure: what the light is doing THERE.
patches = [
    plate[max(0, y0 - RING):max(0, y0), max(0, x0):x0 + w],
    plate[fy:fy + RING, max(0, x0):x0 + w],
    plate[max(0, y0):fy, max(0, x0 - RING):max(0, x0)],
    plate[max(0, y0):fy, x0 + w:x0 + w + RING],
]
ring = np.concatenate([p.reshape(-1, 3) for p in patches if p.size])
if ring.size == 0:
    raise SystemExit(f'{sprite_path}: no plate around {fx},{fy} to sample')

opaque = sprite[..., 3] > 200
figure = sprite[opaque][:, :3]

want_luma = luma(ring).mean()
have_luma = luma(figure).mean()
gain = 1.0 + ((want_luma / max(have_luma, 1e-3)) - 1.0) * strength

want_warm = (ring[:, 0] - ring[:, 2]).mean()
have_warm = (figure[:, 0] - figure[:, 2]).mean()
shift = (want_warm - have_warm) * strength

body = sprite[..., :3] * gain
# Warmth as a rotation between the red and blue ends, so nothing simply clips.
body[..., 0] += shift / 2
body[..., 2] -= shift / 2
sprite[..., :3] = np.clip(body, 0, 255)

Image.fromarray(sprite.astype(np.uint8)).save(out)
after = sprite[opaque][:, :3]
print(f'{out}: luma {have_luma:.0f} -> {luma(after).mean():.0f} (plate {want_luma:.0f}), '
      f'warmth {have_warm:+.0f} -> {(after[:, 0] - after[:, 2]).mean():+.0f} '
      f'(plate {want_warm:+.0f}), strength {strength}')
