"""Room 4's Sowerby, keyed from operation 5. No image operation.

HIS THIRD DRAWING, AND THE FIRST WITH NOTHING IN FRONT OF HIM. Operation 3 stood
him behind a table that does not reach him: no legs. Operation 4 drew him full
length in the room, but with a chair in front of his left leg, and the cuts of
it (GrabCut, then traced legs, then the coat's outline followed) each left a
piece of that chair or the wall in him, or a piece of him out. Tyler, on the
third: "Obviously you're not going to be able to fix it because you're cutting
from an image where a chair is in front of half of it." He allowed one more
operation (art/staging/caps.json, room-04 cap 5).

Operation 5 (reference/room-04/prompts/sowerby-03.txt) edited the room with
Thad at the left and Sowerby at the chalkboard, and asked for everything but
the two men to become flat magenta and for Sowerby to be redrawn complete, both
legs and boots. So he is keyed, not cut: every pixel that is not magenta is his,
taken straight from the 1536x1024 source, where his boots are whole (the room's
crop would take them off at the bottom).

KEYING. Magenta-ness is min(R, B) - G: the key is about 255, his darkest coat
about 0. Below 90 is him. His edge is then eroded one source pixel, so no
pixel that was blended with the key survives, and the colours under his
transparent pixels are filled from his nearest own pixel, so resampling him
cannot pull magenta into his outline.

HIS HEIGHT IS THE ROOM'S CURVE. Room 4's depth note is a standing man of 470 at
y 600 and 560 at y 840; at his soles (y 513, the foot of the back wall) that is
437, the annotation's `beyond` sample. He is resampled once to 437 (Lanczos,
alpha re-thresholded) and stands where operation 4's drawing stood, between
the front chair and the table's left end, in front of the chalkboard.

THE PENCIL. Errata 75: "Sowerby holds the pencil", and the plate paints the
judges' pencil on the table for the room without him. While he is present, a
prop of bare table -- the plate's own wood beside it, shifted over the pencil
and matched row by row -- covers it. It is opaque, a piece of plate, and starts
at y 333: above that the pencil's tip is already under judge 1's hands, which
are drawn before it.

Writes art/staging/room-04/sowerby/sowerby.png (rest, breath), pencil-cover.png
and sowerby.json, and renders/room-04-sowerby-cut.png.
"""
import json
import os
import subprocess

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-04')
SOURCE = f'{S}/sowerby-03/source.png'
PLATE = os.path.join(ROOT, 'art/backgrounds/room-04-nugget-back.png')
GAP = 2
HIS_HALF = (440, 0, 1536, 1024)  # x0, y0, x1, y1 in the source: right of Thad, who stands left of x 300
KEY = 90                         # min(R, B) - G below this is him
HEIGHT = 437                     # the room's curve at his soles, y 513 (annotation `beyond`)
FEET = (616, 513)                # where he stands: centre of his drawing, and his soles
PENCIL = (772, 333, 850, 376)    # the judges' pencil on the plate, with its shadow, below judge 1's hands
WOOD_FROM = 84                   # bare table this far right of it

src = np.asarray(Image.open(SOURCE).convert('RGB')).astype(int)
key = np.minimum(src[..., 0], src[..., 2]) - src[..., 1]
him = np.zeros(key.shape, bool)
x0, y0, x1, y1 = HIS_HALF
him[y0:y1, x0:x1] = key[y0:y1, x0:x1] < KEY
labels, count = ndi.label(him)
sizes = ndi.sum(him, labels, range(1, count + 1))
him = ndi.binary_fill_holes(labels == (1 + int(np.argmax(sizes))))
him = ndi.binary_erosion(him, iterations=1)
ys, xs = np.where(him)
t, b, l, r = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
# Under his transparent pixels, his nearest own colour, so resampling cannot reach the key.
_, (iy, ix) = ndi.distance_transform_edt(~him, return_indices=True)
filled = src[iy, ix]
rgba = np.zeros((b - t, r - l, 4), np.uint8)
rgba[..., :3] = filled[t:b, l:r]
rgba[..., 3] = np.where(him[t:b, l:r], 255, 0)
drawn = b - t
img = Image.fromarray(rgba)
scaled = np.asarray(img.resize((round(img.width * HEIGHT / drawn), HEIGHT), Image.LANCZOS)).copy()
scaled[..., 3] = np.where(scaled[..., 3] >= 128, 255, 0)
# DESPILL, to the key gate's own measure ((R + B) / 2 - G, allowed 30): a few
# dozen pixels keep a magenta cast after keying -- the pencil's tip, the edge of
# his hair. Red and blue are pulled down toward the green beside them, never
# deleted, which would tear his edge.
opaque = scaled[..., 3] > 0
rgb = scaled[..., :3].astype(int)
cast = opaque & ((rgb[..., 0] + rgb[..., 2]) / 2 - rgb[..., 1] > 24)
for c in (0, 2):
    scaled[..., c] = np.where(cast, np.minimum(rgb[..., c], rgb[..., 1] + 24), rgb[..., c])
scaled[scaled[..., 3] == 0] = 0

os.makedirs(f'{S}/sowerby', exist_ok=True)
f0, f1 = f'{S}/sowerby/frame-0.png', f'{S}/sowerby/frame-1.png'
Image.fromarray(scaled).save(f0)
subprocess.run(['python3', os.path.join(ROOT, 'tools/rig/ambient-breath.py'), f0, f1], check=True)
h, w = scaled.shape[:2]
sheet = np.zeros((h + 2 * GAP, 2 * w + 3 * GAP, 4), np.uint8)
sheet[GAP:GAP + h, GAP:GAP + w] = scaled
sheet[GAP:GAP + h, 2 * GAP + w:2 * GAP + 2 * w] = np.asarray(Image.open(f1).convert('RGBA'))
Image.fromarray(sheet).save(f'{S}/sowerby/sowerby.png')
os.remove(f0)
os.remove(f1)

# THE PENCIL COVER, drawn while he is present.
plate = np.asarray(Image.open(PLATE).convert('RGB')).astype(float)
px0, py0, px1, py1 = PENCIL
patch = np.zeros((py1 - py0, px1 - px0, 4), np.uint8)
for y in range(py0, py1):
    target = np.concatenate([plate[y, px0 - 12:px0 - 3], plate[y, px1 + 3:px1 + 12]]).mean(0)
    source = plate[y, px0 + WOOD_FROM - 12:px1 + WOOD_FROM + 12].mean(0)
    patch[y - py0, :, :3] = np.clip(plate[y, px0 + WOOD_FROM:px1 + WOOD_FROM] + (target - source), 0, 255)
patch[..., 3] = 255
Image.fromarray(patch).save(f'{S}/sowerby/pencil-cover.png')

record = {
    'sheet': 'art/staging/room-04/sowerby/sowerby.png',
    'frames': [[GAP, GAP, int(w), int(h)], [2 * GAP + w, GAP, int(w), int(h)]],
    'anchor': {'x': FEET[0], 'y': FEET[1]},
    'drawnHeight': int(drawn), 'height': HEIGHT, 'key': KEY,
    'cutBox': [int(l), int(t), int(r - l), int(drawn)], 'pixels': int(him.sum()),
    'pencilCover': {'staged': 'art/staging/room-04/sowerby/pencil-cover.png',
                    'x': (px0 + px1) // 2, 'y': py1 - 1, 'frames': [[0, 0, px1 - px0, py1 - py0]]},
    'source': 'room-04 attempt 5 (art/staging/room-04/sowerby-03/source.png), keyed from the 1536x1024 source',
}
json.dump(record, open(f'{S}/sowerby/sowerby.json', 'w'), indent=1)

view = np.asarray(Image.open(SOURCE).convert('RGB'))[t - 8:b + 8, l - 8:r + 8].copy()
view[~him[t - 8:b + 8, l - 8:r + 8]] = [0, 255, 0]
Image.fromarray(view).save(os.path.join(ROOT, 'renders/room-04-sowerby-cut.png'))
print(json.dumps({k: record[k] for k in ('frames', 'anchor', 'drawnHeight', 'height', 'pixels', 'cutBox')}))
