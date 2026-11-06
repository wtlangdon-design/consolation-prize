"""The cabin at the top of the claims road, cut from the plate as a prop so the miners walk BEHIND it
(Tyler, 2026-11-06: the men at the top were "just randomly walking across a building"; he chose "Behind
the cabin"). Its pixels are the plate's own, so it is invisible until someone is behind it; drawn in the
room's depth order with its base on the road's edge (y 201), it hides a walker whose feet are above that.

Writes art/props/room-22-cabin.png and prints the prop's x, y and frame for content/rooms/claims-road.json.
Usage: room22-cabin.py
"""
import json, os
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
plate = Image.open(os.path.join(ROOT, 'art/backgrounds/room-22-claims-road.png')).convert('RGBA')
# The cabin's outline on the plate: eave, roof, the back corner, the far wall, its base on the road.
POLY = [(1809, 160), (1818, 152), (1856, 136), (1879, 142), (1886, 150), (1886, 192), (1872, 199), (1840, 201), (1809, 201)]
x0, y0 = min(p[0] for p in POLY), min(p[1] for p in POLY)
x1, y1 = max(p[0] for p in POLY) + 1, max(p[1] for p in POLY) + 1
crop = plate.crop((x0, y0, x1, y1))
mask = Image.new('L', crop.size, 0)
ImageDraw.Draw(mask).polygon([(x - x0, y - y0) for x, y in POLY], fill=255)
a = np.asarray(crop).copy(); a[..., 3] = np.asarray(mask)
Image.fromarray(a).save(os.path.join(ROOT, 'art/props/room-22-cabin.png'))
w, h = crop.size
print(json.dumps({'x': x0 + w // 2, 'y': y1 - 1, 'frame': [0, 0, w, h]}))
