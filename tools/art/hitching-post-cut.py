"""Cut Main Street's hitching rail and its three horses into an ambient sheet
(reference/hitching-post/brief.md, errata 178). No image operation.

Source: art/staging/room-02/hitching-03/sheet.png, room-02 attempt 5 -- the
group redrawn after Tyler's first look ("three copies of the same horse ...
maybe one is eating? And are hitching posts that low?"): a black with a blaze,
a palomino eating from a pile of hay, a paint pony in a striped blanket, the
rail at chest height. Four frames on one sheet, 2 x 2.

ONLY FRAMES 1 AND 3 AGREE. The generator moved the palomino and the paint
pony about 30 px sideways in frames 2 and 4, so neither can be laid over the
rest without doubling a horse; frame 3 is the whole group 19 px higher and
otherwise in place. So:
  0  frame 1, the rest: the palomino eating, the black looking out, the paint dozing;
  1  the palomino chews: its lowered head lifted 4 px off the hay (from frame 1);
  2  frame 1 with frame 3's changes: the black tosses its head, the paint looks round
     -- the pixels that differ from frame 1, widened by four, in those horses' bands;
  3  the palomino chews again, 7 px.
Frame 2 of the sheet is not used.

THE PAINT PONY'S HEAD IS FRAME 4'S (Tyler, 2026-11-08: "The horse on the right
has its head/neck through the hitching post"). In frames 1 to 3 the pony grazes
below the rail with the rail drawn across its neck. In frame 4 it stands with
its head up over the rail: frame 4 moved it, with the right post, 33 px left
and 20 up, so the rest takes everything right of x 520 from frame 4 shifted
back by that, and the palomino's hind legs where the old lowered head hung
(x 440-520, y 296-452) from frame 4 shifted by the palomino's own offset (4, 19).
The head toss then takes only the black's change from frame 3.

Then: crop to the union of every frame, take the magenta out of the outline and
anything at the key's hue (as tools/art/item-icons-cut.py does), and lay the
frames out the way the other ambient sheets are. tools/art/one-level.py --only
snaps it to the cast's grid afterwards.

usage: python3 tools/art/hitching-post-cut.py
"""
import json
import os

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SOURCE = os.path.join(ROOT, 'art/staging/room-02/hitching-03/sheet.png')
OUT = os.path.join(ROOT, 'art/actors/room-02-horses.png')
RECORD = os.path.join(ROOT, 'art/staging/room-02/hitching-03/cut.json')
CELL_W, CELL_H = 768, 512
EDGE = 4          # the cells' faint borders
DROP = 19         # sheet frame 3 sits this many rows higher than frame 1
PONY = (33, 20)   # sheet frame 4's pony and right post, back onto frame 1
LEGS = (4, 19)    # sheet frame 4's palomino, back onto frame 1
CUT = 520         # right of this column the rest is frame 4's pony
LEGS_BOX = (440, 312, 520, 452)   # where frame 1's pony hung its head, below the rail: frame 4's palomino legs
# Frame 4's pony turns its head toward the palomino, and its muzzle reaches left
# of CUT (Tyler: "The far right horse has his whole snout cut off"). It is taken
# by its own outline, traced here, because behind it frame 4's palomino saddle is
# 29 px out of place.
MUZZLE = [(492, 207), (495, 198), (502, 195), (515, 196), (516, 160), (521, 160), (522, 203),
          (527, 220), (520, 230), (502, 232), (493, 223), (492, 213)]
# The rail: frame 1's has the old pony's mane draped over it from x 520 to 590,
# so from x 470 -- a plain stretch between knots -- it is frame 4's, which is clean
# and whose knot at 610 is frame 1's knot. The two rails' rows agree to a pixel.
RAIL_ROWS = (284, 312)
RAIL_FROM = 470


def fgmask(rgb, min_area=150):
    r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
    fg = ~((r > 170) & (b > 160) & (g < 110))
    fg[:EDGE] = fg[-EDGE:] = False
    fg[:, :EDGE] = fg[:, -EDGE:] = False
    lab, n = ndimage.label(fg)
    areas = ndimage.sum(fg, lab, range(1, n + 1))
    return np.isin(lab, [i + 1 for i, a in enumerate(areas) if a >= min_area])


def despill(rgba):
    out = rgba.astype(int)
    pink = pink_edge(out)
    opaque = out[..., 3] > 0
    near = ndimage.binary_dilation(~opaque, iterations=2) & opaque
    mx, mn = out[..., :3].max(-1), out[..., :3].min(-1)
    hue = np.degrees(np.arctan2(np.sqrt(3) * (out[..., 1] - out[..., 2]),
                                2 * out[..., 0] - out[..., 1] - out[..., 2])) % 360
    tinted = near | (opaque & (hue > 285) & (hue < 335) & (mx - mn > 25))
    # And the outline ink: the generator's near-black is plum (19,11,20) where it was
    # drawn against magenta -- key spill, which tools/check-residual-key.mjs reads as
    # keyed background. Nothing in the horses is that dark and that purple.
    r0, g0, b0 = out[..., 0], out[..., 1], out[..., 2]
    tinted |= opaque & (mx < 48) & (r0 - g0 >= 4) & (b0 - g0 >= 4)
    r, g, b = out[..., 0], out[..., 1], out[..., 2]
    # An outline pixel that is more key than drawing -- the hay's wisps, blended
    # with the magenta they were drawn on -- is dropped: despilled, it turned pink.
    blended = near & ((np.minimum(r, b) - g) > 12)
    out[blended] = 0
    r, g, b = out[..., 0], out[..., 1], out[..., 2]
    excess = np.where(tinted & ~blended, np.clip(np.minimum(r, b) - g, 0, None), 0)
    out[..., 0] = np.clip(r - excess, 0, 255)
    out[..., 2] = np.clip(b - excess, 0, 255)
    out = inpaint(out, pink)
    return out.astype(np.uint8)


def pink_edge(out):
    """Pixels within 3 of the edge that are gold or brown blended with the magenta
    they were drawn on: red above green, and blue not far below it (hay has blue
    far below green). Marked on the colours as
    generated, before the despill turns them red."""
    opaque = out[..., 3] > 0
    edge = ndimage.binary_dilation(~opaque, iterations=3) & opaque
    r, g, b = out[..., 0], out[..., 1], out[..., 2]
    return edge & (r - g > 12) & (b - g > -10)


def inpaint(out, pink):
    """Each marked pixel takes the median colour of its clean opaque neighbours
    -- the hay's wisps end in hay colour, not red -- or goes if it has none."""
    pink = pink & (out[..., 3] > 0)
    opaque = out[..., 3] > 0
    for _ in range(4):
        if not pink.any():
            break
        ys, xs = np.where(pink)
        fixed = np.zeros_like(pink)
        for y, x in zip(ys, xs):
            y0, y1, x0, x1 = max(0, y - 1), y + 2, max(0, x - 1), x + 2
            ok = opaque[y0:y1, x0:x1] & ~pink[y0:y1, x0:x1]
            if ok.any():
                out[y, x, :3] = np.median(out[y0:y1, x0:x1, :3][ok], axis=0)
                fixed[y, x] = True
        pink &= ~fixed
    out[pink] = 0
    return out


def shift(img, dx, dy, fill):
    out = np.empty_like(img)
    out[...] = fill
    h, w = img.shape[:2]
    out[max(0, dy):h + min(0, dy), max(0, dx):w + min(0, dx)] = \
        img[max(0, -dy):h + min(0, -dy), max(0, -dx):w + min(0, -dx)]
    return out


def frames():
    sheet = np.asarray(Image.open(SOURCE).convert('RGB'))
    cell = lambda i: sheet[(i // 2) * CELL_H:(i // 2 + 1) * CELL_H, (i % 2) * CELL_W:(i % 2 + 1) * CELL_W]
    first = cell(0)
    four = cell(3)
    one = first.copy()
    pony = shift(four, PONY[0], PONY[1], np.array([255, 0, 255], np.uint8))
    legs = shift(four, LEGS[0], LEGS[1], np.array([255, 0, 255], np.uint8))
    one[LEGS_BOX[1]:LEGS_BOX[3], LEGS_BOX[0]:LEGS_BOX[2]] = legs[LEGS_BOX[1]:LEGS_BOX[3], LEGS_BOX[0]:LEGS_BOX[2]]
    one[:, CUT:] = pony[:, CUT:]
    one[RAIL_ROWS[0]:RAIL_ROWS[1], RAIL_FROM:CUT] = pony[RAIL_ROWS[0]:RAIL_ROWS[1], RAIL_FROM:CUT]
    outline = Image.new('L', (CELL_W, CELL_H), 0)
    ImageDraw.Draw(outline).polygon(MUZZLE, fill=1)
    muzzle = ndimage.binary_dilation(np.asarray(outline).astype(bool), iterations=1)
    one[muzzle] = pony[muzzle]
    m1 = fgmask(one)
    three = shift(cell(2), 0, DROP, np.array([255, 0, 255], np.uint8))
    m3 = fgmask(three)
    yy, xx = np.mgrid[0:CELL_H, 0:CELL_W]
    rest = np.dstack([one, np.where(m1, 255, 0)]).astype(np.uint8)
    # The black's head, left of the palomino and above the rail.
    band = (xx < 300) & (yy < 330)
    moved = (np.abs(three.astype(int) - one.astype(int)).sum(-1) > 60) & (m3 | m1) & band
    region = ndimage.binary_dilation(moved, iterations=4) & band
    toss = np.dstack([np.where(region[..., None], three, one),
                      np.where(np.where(region, m3, m1), 255, 0)]).astype(np.uint8)
    # The palomino's lowered head, clear of the hay below it and the black's legs left of it.
    head = (xx >= 300) & (xx < 392) & (yy >= 318) & (yy < 424) & m1

    def chew(up):
        out = rest.copy()
        out[head] = 0
        lifted = np.zeros_like(rest)
        lifted[head] = rest[head]
        lifted = shift(lifted, 0, -up, np.array([0, 0, 0, 0], np.uint8))
        keep = lifted[..., 3] > 0
        out[keep] = lifted[keep]
        return out

    return [rest, chew(4), toss, chew(7)]


def main():
    fr = frames()
    union = np.zeros((CELL_H, CELL_W), bool)
    for f in fr:
        union |= f[..., 3] > 0
    ys, xs = np.where(union)
    x0, x1, y0, y1 = int(xs.min()), int(xs.max()) + 1, int(ys.min()), int(ys.max()) + 1
    w, h = x1 - x0, y1 - y0
    sheet = Image.new('RGBA', (len(fr) * (w + 2) + 2, h + 4), (0, 0, 0, 0))
    rects = []
    for i, f in enumerate(fr):
        sheet.alpha_composite(Image.fromarray(despill(f[y0:y1, x0:x1]), 'RGBA'), (2 + i * (w + 2), 2))
        rects.append([2 + i * (w + 2), 2, int(w), int(h)])
    sheet.save(OUT)
    rest = fr[0][y0:y1, x0:x1, 3] > 0
    rows = np.where(rest.any(1))[0]
    record = {'sheet': os.path.relpath(OUT, ROOT), 'source': os.path.relpath(SOURCE, ROOT), 'frames': rects,
              'figureHeight': int(rows.max() - rows.min() + 1),
              'frameNote': '0 rest: the palomino eating, the black looking out, the paint pony with its head up over the rail · '
                           '1 the palomino chews · 2 the black tosses its head · 3 the palomino chews'}
    with open(RECORD, 'w') as f:
        json.dump(record, f, indent=1)
    print(os.path.relpath(OUT, ROOT), sheet.size, 'frames', len(rects), 'frame', (int(w), int(h)),
          'rest height', record['figureHeight'])


if __name__ == '__main__':
    main()
