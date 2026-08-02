"""Errata 40: large connected regions of near-void. Palette index 0, and nothing else.

WHAT THIS IS NOT. It is not a darkening pass on existing surfaces. Stepping
every material down its own ramp moves the histogram and changes nothing
anybody looks at -- the Nugget already had 13.1 per cent of its frame under
luminance 12 and it was in ONE THOUSAND TWO HUNDRED AND TWENTY components,
scattered through a dither, with the largest at 4.4 per cent. Measured, it
looked nearly right. Looked at, it had no black in it.

The reference has its darkest tenth at 1.9 in a handful of big connected
pools -- under tables, behind the doorway, in the roof beams -- and every
other thing in the picture is seen AGAINST those pools. So this stamps
regions, not pixels.

THREE RULES.

1. AFTER THE LIGHTING PASS. The field steps a colour along its own ramp, so
   a region stamped before it comes out grey. Void is not a lit surface any
   more than a lamp is, and both go on afterwards.

2. NEVER OVER A RESERVED BAND. Doc 18 gives the cycling elements their own
   palette entries and the whole scheme depends on those pixels being exactly
   those pixels. Every function here takes a `keep` predicate for the same
   reason `collar` does.

3. THE EDGE IS DITHERED, THE MIDDLE IS NOT. A hard-edged black rectangle is a
   hole in the picture. A pool with a Bayer edge over two or three steps is a
   shadow, and the middle -- which is most of it, and the part that does the
   work -- is flat index 0.
"""

from __future__ import annotations

from canvas import IndexedCanvas
from dither import BAYER4
from palette import Palette

#: Index 0 is void. It is not a family position; it is the one entry the
#: palette reserves for absolute black, and errata 40 is explicit that this
#: costs no palette change because it is already there.
VOID = 0


def _allowed(canvas: IndexedCanvas, x: int, y: int, keep) -> bool:
    if x < 0 or y < 0 or x >= canvas.width or y >= canvas.height:
        return False
    return not (keep and keep(x, y))


def pool(canvas: IndexedCanvas, x: int, y: int, width: int, height: int,
         feather: int = 3, keep=None, top_feather: bool = True) -> int:
    """An elliptical pool of void with a dithered rim. Returns pixels stamped.

    Used for the shadow UNDER something -- a table, a bar, a coach. The shape
    is an ellipse rather than a rectangle because a shadow under a solid
    object is not square, and at this size the four corners are the whole
    difference between a shadow and a floor tile.
    """
    stamped = 0
    cx, cy = x + width / 2, y + height / 2
    rx, ry = max(1.0, width / 2), max(1.0, height / 2)
    for py in range(y - feather, y + height + feather):
        for px in range(x - feather, x + width + feather):
            if not _allowed(canvas, px, py, keep):
                continue
            # Normalised distance from the centre of the ellipse.
            dist = ((px + 0.5 - cx) / rx) ** 2 + ((py + 0.5 - cy) / ry) ** 2
            if dist <= 1.0:
                canvas.put(px, py, VOID)
                stamped += 1
                continue
            if dist > (1.0 + feather / max(rx, ry)) ** 2:
                continue
            if not top_feather and py < cy:
                continue
            # The rim: a Bayer threshold that thins with distance, so the pool
            # dissolves into what is around it instead of ending.
            fade = (dist - 1.0) / max(1e-6, (1.0 + feather / max(rx, ry)) ** 2 - 1.0)
            if BAYER4.threshold(px, py) >= fade:
                canvas.put(px, py, VOID)
                stamped += 1
    return stamped


def band(canvas: IndexedCanvas, x: int, y: int, width: int, height: int,
         feather: int = 3, keep=None, fade_down: bool = True) -> int:
    """A horizontal band of void, dissolving on one edge only.

    Roof space and the back of a room. The ceiling is not a pool -- it is a
    mass that starts at the top of the frame and stops being black somewhere,
    and where it stops is the only edge that needs handling.
    """
    stamped = 0
    for py in range(y, y + height + feather):
        depth = py - (y + height)
        for px in range(x, x + width):
            if not _allowed(canvas, px, py, keep):
                continue
            if depth < 0:
                canvas.put(px, py, VOID)
                stamped += 1
                continue
            fade = (depth + 1) / (feather + 1)
            if BAYER4.threshold(px, py) >= fade:
                canvas.put(px, py, VOID)
                stamped += 1
    return stamped


def under(canvas: IndexedCanvas, rect: tuple[int, int, int, int], depth: int = 6,
          spread: int = 2, keep=None) -> int:
    """The void directly beneath an object, wider than the object and shallow.

    A thing standing on a floor occludes the light behind it as well as under
    it. `spread` is how far past its own width the shadow reaches, and it is
    what stops a row of objects reading as a row of objects with gaps.
    """
    x, y, width, height = rect
    return pool(canvas, x - spread, y + height - depth // 2, width + spread * 2, depth,
                feather=2, keep=keep, top_feather=False)


def wedge(canvas: IndexedCanvas, x0: int, y0: int, x1: int, y1: int,
          thickness: int, keep=None) -> int:
    """A void wedge along a line: the dark side of a corner, an eave, a stair.

    The reference's roof beams and the shadow behind its doorway are this
    shape -- long, thin, following an edge already in the drawing rather than
    sitting on top of it.
    """
    stamped = 0
    steps = max(abs(x1 - x0), abs(y1 - y0), 1)
    for step in range(steps + 1):
        t = step / steps
        px = round(x0 + (x1 - x0) * t)
        py = round(y0 + (y1 - y0) * t)
        for offset in range(thickness):
            if _allowed(canvas, px, py + offset, keep):
                canvas.put(px, py + offset, VOID)
                stamped += 1
    return stamped


def rect(canvas: IndexedCanvas, x: int, y: int, width: int, height: int,
         feather: int = 2, keep=None) -> int:
    """A rectangular region of void with a dithered bottom and side edges.

    A doorway, the space under a counter, the inside of an opening. These are
    rectangles in the drawing already and making them ellipses was what turned
    the first attempt into a picture with holes in it.
    """
    stamped = 0
    for py in range(y, y + height):
        for px in range(x - feather, x + width + feather):
            if not _allowed(canvas, px, py, keep):
                continue
            over = max(x - px, px - (x + width - 1), 0)
            if over == 0:
                canvas.put(px, py, VOID)
                stamped += 1
                continue
            if BAYER4.threshold(px, py) >= over / (feather + 1):
                canvas.put(px, py, VOID)
                stamped += 1
    return stamped


def smear(canvas: IndexedCanvas, x: int, y: int, width: int, height: int,
          keep=None, floor: int = VOID, solid: bool = False,
          threshold=None) -> int:
    """A flat pool at an object's foot: wide, shallow, and thinning outwards.

    The shadow a table casts on a floor is not a circle under the table, it is
    a smear at the feet that fades along its length. Height is small on
    purpose -- anything taller reads as a hole.

    TWO OPTIONS, BOTH ADDED BECAUSE ROOM 1 NEEDED THEM AND BOTH DEFAULTING TO
    THE OLD BEHAVIOUR.

    `floor` is the index stamped instead of index 0. Rule 3 above says the
    middle of a pool is flat index 0, and that is right for a pool the frame
    reads as black -- the coach doorway, the roof space. It is wrong for a
    pool the reference measures at a value: Room 1's left-timber base is a
    connected dark component in study §1's list AND measures L 11-16, so at
    index 0 it is 15 luminance too deep and it swallows the wagon-wheel arc
    standing in it. A pool with a floor is still one connected mass at one
    value; it is simply the value the reference has.

    `solid` drops the Bayer entirely. Rule 3's dithered edge is a shadow
    dissolving into a floor. A shadow SLOT between two solids -- Room 1's
    x 28-29 gap behind the signboard, measured flat at L 1.4 -- has no floor
    to dissolve into, and an ordered checkerboard across it reads as texture
    on the object beside it rather than as a gap behind it.

    `threshold` replaces BAYER4 with any (x, y) -> 0..1 screen. It defaults to
    BAYER4 so nothing that already calls this changes, and it exists because a
    smear whose `weight` hovers near 0.5 over a wide area is a Bayer 4x4 at
    one density -- which is the exact defect room01_seams.py's lattice test
    exists to catch, and it caught this one at 0.50 against a reference whose
    worst tile anywhere is 0.39. Rule 3 asks for a rim that dissolves; it does
    not ask for an ordered screen, and at 320x144 the two are not the same
    thing. A caller covering a large flat area should pass a hashed screen.
    """
    stamped = 0
    screen = threshold if threshold is not None else BAYER4.threshold
    for py in range(y, y + height):
        fall = (py - y + 1) / (height + 1)
        for px in range(x, x + width):
            if not _allowed(canvas, px, py, keep):
                continue
            if solid:
                canvas.put(px, py, floor)
                stamped += 1
                continue
            edge = min(px - x, x + width - 1 - px) / max(1, width * 0.22)
            weight = min(1.0, edge) * (1.0 - fall * 0.7)
            if screen(px, py) < weight:
                canvas.put(px, py, floor)
                stamped += 1
    return stamped
