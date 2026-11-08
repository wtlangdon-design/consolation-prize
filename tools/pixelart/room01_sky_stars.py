"""THE STARS THAT TWINKLE in Room 1's opening sky (errata 157, 165).

Tyler, 2026-11-07, twice: "The stars aren't twinkling." The first answer lit a
warm glow over twelve of the brightest stars -- over pixels already at full
brightness, so nothing visibly changed. A star twinkles by going DIM and coming
back, so the renderer has to be able to put the night back over it, and that
needs the night's own colour around each star.

This reads the shipped sky (it paints nothing) and writes, for every star whose
red channel peaks above THRESHOLD, brightest first:

    [x, y, rx, ry, r, g, b]

the star's centre and half-extent in sky pixels, and the median colour of the
ring of sky just outside it. The renderer fades a star toward that colour, or
lights it up, on its own rhythm. Decorative only (invariant 9).

    python3 tools/pixelart/room01_sky_stars.py

`room01_sky_extension.py` calls it after writing a new sky, so a regenerated sky
can never twinkle empty night.
"""
import json

import numpy as np
from PIL import Image
from scipy import ndimage

SKY = 'art/backgrounds/room-01-stage-road-sky.png'
ROOM = 'content/rooms/stage-road.json'
THRESHOLD = 150   # a star, not the sky's own dither
EXTENT = 60       # warm smears wider than this are not stars

def stars(sky: np.ndarray) -> list[list[int]]:
    red = sky[..., 0].astype(np.int32)
    height, width = red.shape
    # The star's whole light, not only its core: anything well above the night around it.
    labels, count = ndimage.label(red > 70)
    picked = []
    for index, box in enumerate(ndimage.find_objects(labels), start=1):
        if box is None:
            continue
        mask = labels[box] == index
        peak = int(red[box][mask].max())
        ys, xs = box
        if peak <= THRESHOLD or xs.stop - xs.start > EXTENT or ys.stop - ys.start > EXTENT:
            continue
        # The night a few pixels out: a star's faint halo reaches past its box, and fading toward the halo would
        # leave a pale square where the star was.
        y0, y1 = max(ys.start - 8, 0), min(ys.stop + 8, height)
        x0, x1 = max(xs.start - 8, 0), min(xs.stop + 8, width)
        ring = np.ones((y1 - y0, x1 - x0), dtype=bool)
        ring[max(ys.start - 4 - y0, 0):ys.stop + 4 - y0, max(xs.start - 4 - x0, 0):xs.stop + 4 - x0] = False
        night = np.median(sky[y0:y1, x0:x1][ring], axis=0).round().astype(int)
        # The middle of its box, so that [x - rx, x + rx) x [y - ry, y + ry) covers all of it.
        rx, ry = int(np.ceil((xs.stop - xs.start) / 2)), int(np.ceil((ys.stop - ys.start) / 2))
        picked.append((peak, [
            xs.start + rx, ys.start + ry, rx, ry,
            *(int(c) for c in night),
        ]))
    picked.sort(key=lambda pair: (-pair[0], pair[1][1], pair[1][0]))
    return [star for _, star in picked]

def main() -> None:
    sky = np.asarray(Image.open(SKY).convert('RGB'))
    found = stars(sky)
    with open(ROOM, encoding='utf-8') as handle:
        room = json.load(handle)
    room['skyStars'] = found
    room['skyStarsNote'] = (
        'Errata 157, 165 (Tyler, 2026-11-07: "The stars aren\'t twinkling"): every star in the sky whose light peaks '
        'above red 150, brightest first, as [x, y, rx, ry, r, g, b] -- centre and half-extent in sky pixels, and the '
        'colour of the night just around it. Each one dims toward that colour and brightens on its own rhythm while the '
        'sky is on screen; the first twelve also flare now and then. Written by tools/pixelart/room01_sky_stars.py, '
        'never by hand. Decorative: nothing about them changes with the game (invariant 9).')
    # The layout tools/extract-content.mjs writes this file in, or its staleness check fails.
    text = json.dumps(room, indent=2, ensure_ascii=False)
    with open(ROOM, 'w', encoding='utf-8') as handle:
        handle.write(text + '\n')
    print(f'{len(found)} twinkling stars -> {ROOM}')

if __name__ == '__main__':
    main()
