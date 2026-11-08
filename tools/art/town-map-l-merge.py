"""The square's L, taken into the map from the blend (errata 163 A4). No image operation here.

town-03 (town-map operation 8) blended the assembled L (tools/art/town-map-l.py) into one seamless drawing,
but drew the town a little smaller than the map has it. Measured on the loop road round the square:
its west edge 24 px right, its east edge 15 px left, its south edge 20 px high, and the Lane 5-10 px high
(town-01 input pixels). So the blend is stretched back -- x: 1.0345, -27.7; y: 1.0217, +2.2 -- and only
the TOWN is taken from it: the square, its loop road, the long row, the east arm, the Lane and its shops,
with the seam on the grass outside the loop, feathered. The three houses below and the church street to
the right stay the map's own, and the roads out meet the map's (the east junction within ~6 px).

Writes art/staging/town-map/town-03/merged.png, which tools/art/town-map-edit.py promote-town
--attempt 3 --image merged.png pastes into the map.
"""
import numpy as np
from PIL import Image

S = 'art/staging/town-map/town-03'
base = Image.open(f'{S}/input.png').convert('RGB')
blend = Image.open(f'{S}/source.png').convert('RGB')
AX, BX, AY, BY = 1.0345, -27.7, 1.0217, 2.2          # map = a * blend + b, per axis
warped = blend.transform(blend.size, Image.AFFINE, (1 / AX, 0, -BX / AX, 0, 1 / AY, -BY / AY), Image.BICUBIC)
w = np.asarray(warped).astype(float)
b = np.asarray(base).astype(float)
mask = np.zeros(b.shape[:2])
mask[246:848, 56:1262] = 1.0                          # the town, out to the grass past the loop road
mask[836:, 236:924] = 0.0                             # the three houses stay the map's
F = 8
from scipy import ndimage as ndi
soft = ndi.uniform_filter(ndi.binary_erosion(mask > 0, iterations=F // 2).astype(float), size=F)
out = (w * soft[..., None] + b * (1 - soft[..., None])).round().clip(0, 255).astype(np.uint8)
Image.fromarray(out).save(f'{S}/merged.png')
print(f'{S}/merged.png')
