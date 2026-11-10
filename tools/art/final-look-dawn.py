"""The final look, section 3: Main Street at dawn on the night plate's own drawing (reference/final-look/brief.md).

final-look operation 5 relit the same small copy of Room 2's night street that room-36 operation 1 relit
(art/staging/final-look/dawn/input.png), but to the very first light -- dim, cold, the lamps out, the mountains
soft -- where the first had drawn a bright morning. tools/art/room36-dawn.py then carries only its LIGHT back onto
Room 2's own 3700 x 864 pixels, unchanged (the operation did not move the band: edge correlation best at 0,0):

    python3 tools/art/room36-dawn.py --staging art/staging/final-look/dawn --shift-y 0

This copies that candidate over art/backgrounds/room-36-main-street-dawn.png, gives its sky the east's glow
(glow_east, below), prints the numbers the brief asks
for (mean light, the ground's texture as the high-pass deviation, saturation) for the night plate, the old dawn
plate and the new, and draws every hotspot rect, walk box and exit of content/rooms/main-street-dawn.json over the
new plate (renders/room-36-main-street-dawn-with-its-rects.png), with the night street, the old dawn and the new
one above each other (renders/room-36-main-street-dawn-night-old-new.png).
"""
import json, os, shutil, subprocess, sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda p: os.path.join(ROOT, p)
STAGE = 'art/staging/final-look/dawn'
PLATE = 'art/backgrounds/room-36-main-street-dawn.png'
NIGHT = 'art/backgrounds/room-02-main-street.png'
OLD = f'{STAGE}/old-dawn.png'


def stats(path):
    a = np.asarray(Image.open(R(path)).convert('RGB')).astype(float)
    lum = a.mean(2)
    hp = lum - ndi.gaussian_filter(lum, 6)
    sat = np.asarray(Image.open(R(path)).convert('HSV'))[..., 1].astype(float)
    return {'meanLight': round(float(lum.mean()), 1), 'groundTexture': round(float(hp[400:].std()), 2),
            'saturationPct': round(float(sat.mean() / 2.55), 1)}


GLOW = 0.05     # the sky a twentieth brighter at the east (right) end than the middle, a twentieth darker at the west
PIXEL = 6       # the street's own pixel size (tools/art/room36-dawn.py)


def glow_east(path):
    """The first light comes up in the east, down the road out (right), as room-36's first morning put its glow
    (tools/art/room36-dawn.py: 'low, to the right'). Operation 5's sky is one colour across each row, which
    tools/check-plate-flat-edges.mjs reads as a picture stopping short of its frame; a broad east-west ramp, in the
    street's 6 px columns, on the sky's pixels only (each row's own sky colour, where most of the row is sky)."""
    a = np.asarray(Image.open(path).convert('RGB')).astype(float)
    H, W = a.shape[:2]
    ramp = 1 + GLOW * ((np.arange(W) // PIXEL * PIXEL) / (W - 1) * 2 - 1)
    for y in range(min(H, 260)):
        med = np.median(a[y], axis=0)
        sky = np.abs(a[y] - med).max(1) <= 8
        if sky.mean() < 0.4:
            continue
        a[y, sky] = a[y, sky] * ramp[sky, None]
    Image.fromarray(np.clip(np.round(a), 0, 255).astype(np.uint8)).save(path)


def main():
    if not os.path.exists(R(OLD)):
        shutil.copy(R(PLATE), R(OLD))
    subprocess.check_call([sys.executable, R('tools/art/room36-dawn.py'), '--staging', STAGE, '--shift-y', '0'], cwd=ROOT)
    shutil.copy(R(f'{STAGE}/candidate-3700x864.png'), R(PLATE))
    glow_east(R(PLATE))
    print(json.dumps({'night': stats(NIGHT), 'oldDawn': stats(OLD), 'newDawn': stats(PLATE)}, indent=1))

    room = json.load(open(R('content/rooms/main-street-dawn.json')))
    im = Image.open(R(PLATE)).convert('RGB')
    d = ImageDraw.Draw(im)
    for box in room['walkBoxes']:
        pts = [(p['x'], p['y']) for p in box['points']]
        d.polygon(pts, outline=(80, 255, 80))
    for h in room['hotspots']:
        x, y, w, hh = h['rect']
        d.rectangle((x, y, x + w, y + hh), outline=(0, 255, 255), width=3)
        d.text((x + 4, y + 4), h['id'], fill=(0, 255, 255))
    for e in room['exits']:
        x, y, w, hh = e['rect']
        d.rectangle((x, y, x + w, y + hh), outline=(255, 200, 0), width=3)
        d.text((x + 4, y + 4), e['id'], fill=(255, 200, 0))
    im.save(R('renders/room-36-main-street-dawn-with-its-rects.png'))
    stack = Image.new('RGB', (1850, 432 * 3 + 32), (0, 0, 0))
    for i, p in enumerate((NIGHT, OLD, PLATE)):
        stack.paste(Image.open(R(p)).convert('RGB').resize((1850, 432), Image.BOX), (0, i * 448))
    stack.save(R('renders/room-36-main-street-dawn-night-old-new.png'))


main()
