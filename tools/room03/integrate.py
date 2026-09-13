#!/usr/bin/env python3
"""
THE CLEAN-SHEET ROOM 3, ASSEMBLED: shell plate + the two accepted clusters.

WHAT THIS DOES AND DOES NOT DO. It writes the SHELL PLATE at the room's own
1920 x 864 and composites the cluster layers over it at the placements
`placement.py` solved, so a person can look at the room. It does not yet write
the runtime room JSON -- the layers are still composited here rather than by
the engine.

THE CROP BAND IS A REAL DECISION. The endpoint's widest size is 3:2 and the play
area is 1920 x 864, which is 2.22:1, so 416 rows of a 1920-wide shell have to
go. Three bands were composited and looked at:

    top 160   keeps the whole chandelier and loses the piano behind the card men
    top 320   keeps the piano and cuts the chandelier off entirely
    top 240   keeps the chandelier's arms AND the piano's top above the table

Both the chandelier and the piano carry canonical LOOK lines, so 240 is the band
that keeps the room's own jokes: a chandelier over a dirt floor, and a piano
nobody is at.

AND THE MAGENTA HAS TO GO BEFORE THE RESIZE, NOT AFTER. A keyed layer still has
magenta in its RGB wherever alpha is zero; resampling it mixes that magenta into
every edge pixel, and the first composite had a violet fringe around all three
bar patrons and both near chairs. Section 29 calls that contamination and it is
right. The fix is to flood each layer's transparent RGB outward from its own
edge first, so the filter has only the layer's own colours to mix.

    python3 tools/room03/integrate.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_erosion, distance_transform_edt, gaussian_filter

ROOT = Path(__file__).resolve().parents[2]
PROOF = ROOT / 'proofs/room-03/clean-sheet'
SHELL = ROOT / 'art/staging/room-03/clean-shell-01/source.png'
PLATE = ROOT / 'art/staging/room-03/clean-shell-01/room-shell-1920x864.png'
CROP_TOP = 240
ROOM = (1920, 864)

# ---- WHAT THE FIRST COMPOSITE GOT WRONG --------------------------------------
#
# Tyler, on the first assembly: "it's really bad." He was right, and the gates
# could not have told him -- they measure partitions, holes and exact
# recomposition, none of which can see a collage. Measured afterwards:
#
#   the shell reads luminance 29.7 and warmth (R-B) 26.8
#   the clusters read 37.8 and 38.3 -- 30-40% brighter and warmer
#   under the card cluster the shell is 33.3 and the cluster 44.0
#   under the bar the shell is 25.1 and the cluster 34.9
#
# So both clusters sat on the room as bright warm rectangles, and NOTHING in
# either of them was grounded: no contact shadow under the table's pedestal,
# eight chair legs, three stools or fourteen boots. Those two things together
# are most of what "pasted on" means.
#
# RELIGHT is a low-frequency match, not a filter. Each cluster keeps all its own
# detail; only its broad light is pulled toward the light the SHELL already has
# at that place, which is what makes it belong and what makes the far end of the
# room fall away the way the room does.
RELIGHT_BLUR = 80.0
# FURNITURE TAKES THE ROOM'S LIGHT HARDER THAN PEOPLE DO. Graded at one strength
# the first tuning pass pushed the card players' faces into the murk while the
# tabletop beside them stayed lit -- the floor ended up brighter than the people,
# which inverts what the eye should find first. Furniture belongs to the room;
# a face is what the room is lit FOR.
RELIGHT_STRENGTH = {'furniture': 0.86, 'actor': 0.52}
RELIGHT_FLOOR, RELIGHT_CEIL = 0.34, 1.15
FACE_LIFT = 1.10               # a last small ambient on the actors only

# CONTACT SHADOWS. A soft dark smear under the lowest pixel of every column of
# every layer, on the floor, multiplied. Radius scales with the cluster so the
# far end of the bar gets a smaller shadow than the near end, which is what
# perspective does.
SHADOW_STRENGTH = 0.62
SHADOW_RISE = 0.30             # of the blob's height, above the contact row
SHADOW_BLUR = 5.0

# THE BAR'S FAR END TERMINATED IN MID-AIR at x 1240, one of the two defects that
# got the previous lineage rejected -- I reported it fixed because the MASTER's
# end leaves its own canvas, and never checked the composite. Shifting the
# cluster left tucks that end behind the stove, which is what the room has
# standing there.
BAR_SHIFT_X = -54

STACK = [
    ('card', 'art/staging/room-03/clean-card-01/layers',
     ['card_2-behind', 'card_3-behind', 'furniture-table-complete',
      'card_2-front', 'card_3-front', 'card_1', 'card_4']),
    ('bar', 'art/staging/room-03/clean-bar-01/layers',
     ['bar_1-behind', 'furniture-bar-complete', 'bar_1-front', 'bar_2', 'bar_3']),
]


def defringe(img):
    """
    DROP THE OUTERMOST PIXEL OF EVERY LAYER. The masters are drawn against
    magenta and their edges are anti-aliased INTO it, so the outermost ring of
    each silhouette is already part magenta before anything is keyed or
    resized. Flooding the transparent margin fixed the resize, and a violet
    line still ran round all three bar patrons and both near chairs, because
    that line is in the art. A pixel of silhouette is a cheap price for it.
    """
    a = np.asarray(img).astype(np.uint8).copy()
    solid = a[:, :, 3] > 0
    inner = binary_erosion(solid, np.ones((3, 3)))
    a[:, :, 3] = np.where(inner, a[:, :, 3], 0)
    return Image.fromarray(a)


def debleed(img):
    """
    Push each layer's own colour out into its transparent margin, so a resize
    has nothing foreign to mix in. The alpha is untouched.
    """
    a = np.asarray(img).astype(np.uint8).copy()
    solid = a[:, :, 3] > 0
    if solid.all() or not solid.any():
        return Image.fromarray(a)
    _, idx = distance_transform_edt(~solid, return_indices=True)
    for c in range(3):
        ch = a[:, :, c]
        ch[~solid] = ch[idx[0], idx[1]][~solid]
    return Image.fromarray(a)


def shell_plate():
    shell = Image.open(SHELL).convert('RGB')
    up = shell.resize((ROOM[0], round(ROOM[0] * shell.height / shell.width)), Image.LANCZOS)
    return up.crop((0, CROP_TOP, ROOM[0], CROP_TOP + ROOM[1]))


def placed_layers():
    """Every cluster layer, de-fringed, resized and positioned, in draw order."""
    place = json.loads((PROOF / 'placement.json').read_text())
    out = []
    for tag, src, names in STACK:
        rec = json.loads((ROOT / src / 'decompose.json').read_text())
        s = place[tag]['scale']
        ox, oy = place[tag]['offset']
        if tag == 'bar':
            ox += BAR_SHIFT_X
        for name in names:
            spec = (rec['furnitureComplete'] if name.endswith('-complete')
                    else rec['layers'][name])
            img = debleed(defringe(Image.open(ROOT / src / f'{name}.png').convert('RGBA')))
            w = max(1, int(round(img.width * s)))
            h = max(1, int(round(img.height * s)))
            at = (int(round(ox + spec['cropInMaster'][0] * s)),
                  int(round(oy + spec['cropInMaster'][1] * s)))
            out.append((tag, name, img.resize((w, h), Image.LANCZOS), at, s))
    return out


def stamp(canvas_shape, img, at):
    """A layer's alpha, in room coordinates."""
    a = np.zeros(canvas_shape, float)
    arr = np.asarray(img)[:, :, 3].astype(float) / 255.0
    x, y = at
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(canvas_shape[1], x + img.width), min(canvas_shape[0], y + img.height)
    if x1 <= x0 or y1 <= y0:
        return a
    a[y0:y1, x0:x1] = arr[y0 - y:y1 - y, x0 - x:x1 - x]
    return a


def contact_shadows(shape, layers, hide=()):
    """
    THE FLOOR HAS TO KNOW THEY ARE THERE. For every layer, the lowest solid
    pixel of each column is a contact point; a soft smear is laid there and
    multiplied into the plate before anything is composited over it.
    """
    acc = np.zeros(shape, float)
    for tag, name, img, at, s in layers:
        if name in hide:
            continue
        a = stamp(shape, img, at)
        cols = np.nonzero(a.any(axis=0))[0]
        if not len(cols):
            continue
        blob = np.zeros(shape, float)
        for x in cols:
            ys = np.nonzero(a[:, x])[0]
            if not len(ys):
                continue
            base = ys.max()
            r = max(3.0, (ys.max() - ys.min()) * 0.10 * s + 6.0 * s)
            top = int(max(0, base - r * SHADOW_RISE))
            bot = int(min(shape[0] - 1, base + r * 0.55))
            if bot <= top:
                continue
            span = np.linspace(-1.0, 1.0, bot - top + 1)
            blob[top:bot + 1, x] = np.maximum(blob[top:bot + 1, x], 1.0 - span ** 2)
        acc = np.maximum(acc, gaussian_filter(blob, SHADOW_BLUR))
    return np.clip(acc, 0, 1)


def relight(plate, layers):
    """
    Pull each cluster's BROAD light toward the light the shell already has where
    it stands. Detail is untouched: this is a low-frequency ratio, so every
    thread of the check shirt survives -- it just stops glowing.
    """
    base = plate.astype(float)
    target = gaussian_filter(base, (RELIGHT_BLUR, RELIGHT_BLUR, 0))
    room = base.copy()
    cover = np.zeros(base.shape[:2], float)
    for tag, name, img, at, s in layers:
        cover = np.maximum(cover, stamp(base.shape[:2], img, at))
    # the clusters, drawn flat, so their own broad light can be measured
    flat = Image.fromarray(plate).convert('RGBA')
    for tag, name, img, at, s in layers:
        flat.alpha_composite(img, at)
    flat = np.asarray(flat.convert('RGB')).astype(float)
    own = gaussian_filter(flat, (RELIGHT_BLUR, RELIGHT_BLUR, 0))
    ratio = np.clip(target / np.maximum(own, 6.0), RELIGHT_FLOOR, RELIGHT_CEIL)

    people = np.zeros(base.shape[:2], float)
    for tag, name, img, at, s in layers:
        if not name.startswith('furniture'):
            people = np.maximum(people, stamp(base.shape[:2], img, at))
    strength = np.where(people[:, :, None] > 0.5,
                        RELIGHT_STRENGTH['actor'], RELIGHT_STRENGTH['furniture'])
    ratio = 1.0 + (ratio - 1.0) * strength
    graded = np.clip(flat * ratio, 0, 255)
    graded = np.where(people[:, :, None] > 0.5, np.clip(graded * FACE_LIFT, 0, 255), graded)
    m = cover[:, :, None]
    return np.clip(room * (1 - m) + graded * m, 0, 255).astype(np.uint8)


def descum(arr):
    """
    THE LAST FIFTEEN PIXELS OF THE KEY. Section 29 does not have a tolerance --
    a cluster boundary contains intended content or it does not -- and after
    defringe and debleed there were still fifteen pixels in the room where the
    green channel sat far below both red and blue, which is magenta and nothing
    a lamp-lit oak room can make. They are single, scattered pixels on the brass
    foot rail and the chair rails, so they survived every edge-based pass by not
    being on an edge.

    The test is deliberately narrow: bright in red AND blue, and green at least
    25 below both. No authored colour in this room is inside that (the reddest
    thing in frame, the check shirt, runs green 20-30 below red but its blue is
    darker still). Those pixels get their green lifted to the floor of the test,
    which is the smallest change that stops them being magenta.
    """
    a = arr.astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lo = np.minimum(r, b)
    bad = (r > 90) & (b > 90) & (g < lo - 25)
    if bad.any():
        a[..., 1] = np.where(bad, lo - 25, g)
        print(f'  descum: {int(bad.sum())} key-residue pixels neutralised')
    return np.clip(a, 0, 255).astype(np.uint8)


def compose(hide=(), shadows=True, grade=True):
    layers = [l for l in placed_layers() if l[1] not in hide]
    plate = np.asarray(shell_plate().convert('RGB')).astype(float)
    if shadows:
        sh = contact_shadows(plate.shape[:2], layers)
        plate = plate * (1.0 - sh[:, :, None] * SHADOW_STRENGTH)
    plate = np.clip(plate, 0, 255).astype(np.uint8)
    if grade:
        return Image.fromarray(descum(relight(plate, layers)))
    room = Image.fromarray(plate).convert('RGBA')
    for tag, name, img, at, s in layers:
        room.alpha_composite(img, at)
    return Image.fromarray(descum(np.asarray(room.convert('RGB'))))


def main():
    plate = shell_plate()
    PLATE.parent.mkdir(parents=True, exist_ok=True)
    plate.save(PLATE)
    print(f'wrote {PLATE}  {plate.width}x{plate.height}  (crop band top {CROP_TOP})')

    room = compose()
    out = PROOF / 'room-composite.png'
    room.save(out)
    print(f'wrote {out}')

    # WHAT THE SHELL ALONE LOOKS LIKE, which is the people-free confirmation.
    plate.save(PROOF / 'room-shell-people-free.png')
    print(f'wrote {PROOF / "room-shell-people-free.png"}')


if __name__ == '__main__':
    main()
