#!/usr/bin/env python3
"""Ground the foreground bar patron. ZERO IMAGE OPERATIONS.

Tyler, 2026-09-12, reviewing the live rebuilt Nugget: "the rightmost / closest
foreground bar patron does not read as properly standing on the ground."

HE IS RIGHT, AND THE MEASUREMENT SAYS BY HOW MUCH. His soles are at plate rows
700 (rear boot, x 1675) and 695 (forward boot, x 1745). The bar's plinth meets
the dirt at 770 and 790 at those columns. He is standing on the bar's own
kick-board, 70 to 95 px above the floor, and at 1:1 that is exactly what it
looks like: a man standing on a wall.

WHY A TRANSLATION AND NOT A REPAINT OF THE FEET. His two soles sit 5 px apart
in y while the floor between their columns drops 20, so his stance already
disagrees with this room's perspective by 15 px however he is placed. No
correction of one foot can fix that; a single shift can split it. At +82 the
rear sole lands 12 px below its floor row and the forward sole 13 px above
theirs -- under 3% of his height either way, which is below what an eye reads
as floating.

WHAT MAKES THE SHIFT POSSIBLE AT ALL. Moving a figure out of a baked plate
normally means inventing the scenery it uncovers, and inventing scenery is
exactly what this project does not do. Here the scenery already exists:
`art/staging/room-03/bar-rebuild-01/canvas.png` is the plate that was SENT to
the endpoint -- the same room, the same back bar, no men in it. Side by side
the two agree: same mirror panes, same shelf, same bottles in the same places,
mean difference 8 to 16 of 255 across the band behind him. So the 82-px ribbon
his outline vacates is filled with the Nugget's own back bar, from the frame
this operation was composed into. Nothing is drawn that was not already there.

The silhouette is authored, not thresholded. His coat is brown against brown
bar: a difference against the canvas isolates 12% of his box at any threshold
worth using, because the two browns agree. So the outline below is read off a
gamma-lifted 2x capture on a 10 px grid, the same way the trough's mask was cut
in phase 1.5G, and it is checked by drawing it back over the art.
"""
import json, hashlib, os
import numpy as np
from PIL import Image, ImageDraw

PLATE  = 'art/staging/room-03/rebuild-01/plate-room-03-rebuilt.png'
CANVAS = 'art/staging/room-03/bar-rebuild-01/canvas.png'
CROP   = (896, 181, 1920, 864)          # the canvas's plate window
OUT    = 'art/staging/room-03/rebuild-02/'
SHIFT  = 82
FEATHER = 3

# Plate coordinates, clockwise from the hat's left brim. Read at 2x on a 10 px
# grid off a gamma-lifted capture; a few pixels loose on purpose, because the
# ribbon is filled from the room's own back bar and a loose edge costs nothing
# while a tight one can shave his shoulder.
SILHOUETTE = [
    (1682, 220), (1688, 210), (1700, 203), (1722, 199), (1748, 202), (1762, 210),
    (1772, 222), (1774, 233), (1762, 241), (1754, 250), (1754, 276), (1772, 287),
    (1797, 304), (1807, 340), (1812, 400), (1810, 472), (1802, 532), (1797, 580),
    (1780, 602), (1777, 650), (1793, 672), (1798, 690), (1792, 704), (1745, 709),
    (1712, 703), (1707, 690), (1702, 702), (1660, 711), (1638, 708), (1633, 694),
    (1646, 678), (1650, 650), (1646, 600), (1628, 584), (1621, 520), (1619, 430),
    (1626, 378), (1638, 330), (1653, 300), (1670, 287), (1686, 276), (1684, 248),
]
# Where the two boots come down after the shift, for the contact shadows.
BOOTS = [((1675, 700 + SHIFT), 40, 9), ((1748, 695 + SHIFT), 46, 10)]


def sha(path):
    return hashlib.sha256(open(path, 'rb').read()).hexdigest()


def main():
    os.makedirs(OUT, exist_ok=True)
    plate = Image.open(PLATE).convert('RGB')
    W, H = plate.size
    canvas = Image.open(CANVAS).convert('RGB').resize(
        (CROP[2] - CROP[0], CROP[3] - CROP[1]), Image.LANCZOS)
    room_canvas = plate.copy()
    room_canvas.paste(canvas, (CROP[0], CROP[1]))

    m = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m).polygon(SILHOUETTE, fill=255)
    mask = np.asarray(m).astype(np.float32) / 255.0
    from scipy.ndimage import gaussian_filter
    soft = gaussian_filter(mask, FEATHER)

    down = np.zeros_like(soft)
    down[SHIFT:, :] = soft[:-SHIFT, :]

    P = np.asarray(plate).astype(np.float32)
    C = np.asarray(room_canvas).astype(np.float32)
    Pd = np.zeros_like(P)
    Pd[SHIFT:, :, :] = P[:-SHIFT, :, :]

    # the ribbon his outline vacates takes the man-free back bar...
    out = P * (1 - soft[:, :, None]) + C * soft[:, :, None]
    # ...and then he is laid back down 82 rows lower.
    out = out * (1 - down[:, :, None]) + Pd * down[:, :, None]

    # CONTACT. A boot that touches the floor darkens it; without that he reads
    # as placed rather than standing, which is half of what Tyler saw.
    yy, xx = np.mgrid[0:H, 0:W]
    shade = np.zeros((H, W), np.float32)
    for (cx, cy), rx, ry in BOOTS:
        d = ((xx - cx) / float(rx)) ** 2 + ((yy - cy + 3) / float(ry)) ** 2
        shade = np.maximum(shade, np.clip(1.0 - d, 0, 1))
    shade = gaussian_filter(shade, 2.0) * 0.45
    out *= (1 - shade[:, :, None] * (1 - down[:, :, None] * 0.75))

    img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
    dst = OUT + 'plate-room-03-rebuilt.png'
    img.save(dst)

    rec = {
        'schema': 1,
        'note': 'Foreground bar patron grounded by an 82-row translation, with the ribbon '
                'his outline vacates filled from the plate this operation was composed into. '
                'No image operation. Ledger unchanged at 47/47.',
        'from': PLATE, 'fromSha256': sha(PLATE),
        'ribbonSource': CANVAS, 'ribbonSourceSha256': sha(CANVAS),
        'shiftRows': SHIFT, 'featherPx': FEATHER,
        'solesBefore': {'rear': [1675, 700], 'forward': [1745, 695]},
        'floorAtThoseColumns': {'rear': 770, 'forward': 790},
        'solesAfter': {'rear': [1675, 782], 'forward': [1745, 777]},
        'residual': {'rear': -12, 'forward': 13,
                     'note': 'px from the floor row; his own stance disagrees with the room '
                             'by 15, so a translation can split the error but not remove it'},
        'silhouettePoints': len(SILHOUETTE),
        'out': dst,
    }
    rec['outSha256'] = sha(dst)
    json.dump(rec, open(OUT + 'grounding.json', 'w'), indent=1)
    print(json.dumps({k: v for k, v in rec.items() if k != 'note'}, indent=1))


main()
