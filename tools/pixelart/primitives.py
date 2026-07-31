"""Non-rectangular drawing primitives.

WHY THIS EXISTS. Every shape in this game so far has been built from rect,
hline, vline and line. That is why the barrels read as boxes: the existing
barrel bulges at the waist and has staves and hoops, and its top is a
straight horizontal line, so the eye is never told it is a cylinder. One
missing ellipse costs the whole object.

The same absence explains the rest of it. There are no arched openings
because there is no arc. There is no rope because there is no catenary. The
wheels have spokes because somebody wrote a wheel by hand, once, and nothing
else in the game could reuse it. Rock, scrub and sacking are rectangles with
noise on them because there is no irregular closed form.

Adding density before adding these would only produce more boxes, which is
why this goes first.

EVERYTHING HERE IS INTEGER AND HARD-EDGED. Midpoint rasterisation, no
anti-aliasing, no blending, one palette index per pixel -- the same
constraint canvas.py is built on. A curve at this resolution is a staircase
and it should look like one; what makes it read as a curve is that the
staircase steps are the RIGHT ones, which is what a midpoint algorithm gives
and a hand-placed approximation does not.
"""

from __future__ import annotations

import math
import random
from typing import Callable, Iterable

from canvas import IndexedCanvas
from dither import BAYER2, BAYER4, dither_pixel
from palette import Ramp

# ---------------------------------------------------------------------------
# ellipses and arcs


def ellipse_points(cx: int, cy: int, rx: int, ry: int) -> list[tuple[int, int]]:
    """The outline of an ellipse, by the midpoint algorithm, deduplicated."""
    if rx <= 0 or ry <= 0:
        return [(cx, cy)]
    seen: set[tuple[int, int]] = set()
    x, y = 0, ry
    rx2, ry2 = rx * rx, ry * ry
    # Region 1: slope shallower than -1.
    d = ry2 - rx2 * ry + 0.25 * rx2
    dx, dy = 0, 2 * rx2 * ry
    while dx < dy:
        for sx, sy in ((x, y), (-x, y), (x, -y), (-x, -y)):
            seen.add((cx + sx, cy + sy))
        x += 1
        dx += 2 * ry2
        if d < 0:
            d += ry2 + dx
        else:
            y -= 1
            dy -= 2 * rx2
            d += ry2 + dx - dy
    # Region 2: slope steeper than -1.
    d = ry2 * (x + 0.5) ** 2 + rx2 * (y - 1) ** 2 - rx2 * ry2
    while y >= 0:
        for sx, sy in ((x, y), (-x, y), (x, -y), (-x, -y)):
            seen.add((cx + sx, cy + sy))
        y -= 1
        dy -= 2 * rx2
        if d > 0:
            d += rx2 - dy
        else:
            x += 1
            dx += 2 * ry2
            d += rx2 - dy + dx
    return sorted(seen)


def ellipse_outline(canvas: IndexedCanvas, cx: int, cy: int, rx: int, ry: int, index: int) -> None:
    for x, y in ellipse_points(cx, cy, rx, ry):
        canvas.put(x, y, index)


def ellipse_spans(cx: int, cy: int, rx: int, ry: int) -> dict[int, tuple[int, int]]:
    """Row -> (first x, last x). The fill and the shading both need this."""
    spans: dict[int, tuple[int, int]] = {}
    for x, y in ellipse_points(cx, cy, rx, ry):
        low, high = spans.get(y, (x, x))
        spans[y] = (min(low, x), max(high, x))
    return spans


def ellipse_fill(canvas: IndexedCanvas, cx: int, cy: int, rx: int, ry: int, index: int) -> None:
    for y, (left, right) in ellipse_spans(cx, cy, rx, ry).items():
        canvas.hline(left, y, right - left + 1, index)


def ellipse_shaded(
    canvas: IndexedCanvas,
    cx: int,
    cy: int,
    rx: int,
    ry: int,
    ramp: Ramp,
    base: float,
    lift: float = 0.22,
    light: tuple[float, float] = (-0.5, -0.6),
) -> None:
    """A filled ellipse lit from a direction. Reads as a dome or a disc."""
    lx, ly = light
    for y, (left, right) in ellipse_spans(cx, cy, rx, ry).items():
        for x in range(left, right + 1):
            nx = (x - cx) / max(1, rx)
            ny = (y - cy) / max(1, ry)
            facing = max(0.0, -(nx * lx + ny * ly))
            dither_pixel(canvas, x, y, ramp, max(0.04, min(0.96, base + lift * facing)), BAYER2)


def arc(
    canvas: IndexedCanvas,
    cx: int,
    cy: int,
    rx: int,
    ry: int,
    index: int,
    keep: Callable[[int, int], bool],
) -> None:
    """An ellipse outline, restricted to the points `keep` accepts.

    A predicate rather than an angle range because every use in this game is
    "the top half" or "the left side" -- a quadrant test is exact at integer
    resolution and an angle test has to round, which drops pixels at the ends
    and leaves a curve with a nick in it.
    """
    for x, y in ellipse_points(cx, cy, rx, ry):
        if keep(x - cx, y - cy):
            canvas.put(x, y, index)


def upper_half(dx: int, dy: int) -> bool:
    return dy <= 0


def lower_half(dx: int, dy: int) -> bool:
    return dy >= 0


# ---------------------------------------------------------------------------
# solids


def cylinder(
    canvas: IndexedCanvas,
    x: int,
    y: int,
    width: int,
    height: int,
    ramp: Ramp,
    base: float = 0.46,
    lid_lift: float = 0.30,
    lid_depth: int | None = None,
    waist: float = 1.6,
) -> int:
    """A standing cylinder seen from slightly above. Returns the lid's centre y.

    THE LID IS THE WHOLE POINT. A barrel with a flat top is a box with lines
    on it; the ellipse is what says the eye is above the rim. Its depth is
    about a fifth of the width, which is the amount of tilt Main Street's
    camera has -- more and the room turns into a plan view.
    """
    ry = lid_depth if lid_depth is not None else max(3, width // 4)
    cx = x + width // 2
    top = y + ry

    for row in range(height):
        # Widest at the waist, so the silhouette is not two parallel lines.
        bulge = 1.0 - abs((row / max(1, height - 1)) - 0.5) * 2
        inset = max(0, round((1 - bulge) * waist))
        left, right = x + inset, x + width - inset
        for col in range(left, right):
            across = (col - left) / max(1, (right - left) - 1)
            tone = base + 0.26 * (1 - across) - 0.20 * max(0.0, across - 0.62) * 2.4
            dither_pixel(canvas, col, top + row, ramp, max(0.05, min(0.95, tone)), BAYER2)
        canvas.put(left - 1, top + row, ramp.frac(0.05))
        canvas.put(right, top + row, ramp.frac(0.05))

    # The lid, and the near rim below it. Drawn after the body so the ellipse
    # sits on top of the staves rather than being overpainted by them.
    ellipse_shaded(canvas, cx, top, width // 2, ry, ramp, base + lid_lift, lift=0.18)
    arc(canvas, cx, top, width // 2, ry, ramp.frac(min(0.96, base + lid_lift + 0.20)), upper_half)
    arc(canvas, cx, top, width // 2, ry, ramp.frac(max(0.04, base - 0.16)), lower_half)
    return top


def barrel(
    canvas: IndexedCanvas,
    x: int,
    y: int,
    width: int,
    height: int,
    ramp: Ramp,
    hoops: Ramp,
    rng: random.Random,
    base: float = 0.46,
    open_top: bool = False,
) -> None:
    """A staved barrel: lid, hoops, staves, a highlight and a bung."""
    ry = max(3, width // 4)
    top = cylinder(canvas, x, y, width, height, ramp, base=base,
                   lid_lift=0.0 if open_top else 0.34, lid_depth=ry)
    cx = x + width // 2

    # Staves stop short of the lid, because they are the SIDE of the barrel
    # and the lid is the end grain. Running them over the ellipse was what
    # made the old barrel read flat even after it got a bulge.
    for stave in range(x + 2, x + width - 1, 3):
        canvas.vline(stave, top + 2, height - 3, ramp.frac(max(0.05, base - 0.18)))

    # THE HOOPS ARE ARCS. A hoop round a cylinder seen from above bows
    # toward the viewer, and how much it bows says how far below the eye
    # that hoop is. Drawn as straight lines -- which is how they were --
    # they cancel the lid's curvature and the object goes back to being a
    # box with lines on it. This is the single change that does the most.
    waist = 1.6                       # the same profile cylinder() uses
    for hoop_y, bow in ((top + 2, ry - 1), (top + height // 2, ry), (top + height - 3, ry - 1)):
        bulge = 1.0 - abs(((hoop_y - top) / max(1, height - 1)) - 0.5) * 2
        inset = max(0, round((1 - bulge) * waist))
        half = max(2, (width - 2 * inset) // 2)
        arc(canvas, cx, hoop_y, half, max(1, bow), hoops.frac(0.44), lower_half)
        arc(canvas, cx, hoop_y - 1, half, max(1, bow), hoops.frac(0.20), lower_half)

    if open_top:
        ellipse_fill(canvas, cx, top, max(1, width // 2 - 1), max(1, ry - 1),
                     ramp.frac(max(0.03, base - 0.30)))
        arc(canvas, cx, top, width // 2, ry, ramp.frac(min(0.96, base + 0.34)), upper_half)
    else:
        # The bung, off-centre, on the lid.
        canvas.put(cx - 1 + rng.randrange(-1, 2), top - max(0, ry - 2),
                   ramp.frac(max(0.04, base - 0.26)))

    # A vertical highlight two staves in from the lit edge.
    canvas.vline(x + 2, top + 2, height - 4, ramp.frac(min(0.96, base + 0.30)))


def sack(
    canvas: IndexedCanvas,
    x: int,
    base_y: int,
    width: int,
    height: int,
    ramp: Ramp,
    rng: random.Random,
    tone: float = 0.56,
) -> None:
    """A slumped sack: wide at the bottom, gathered and tied at the neck.

    The old one was a rounded rectangle. What makes a sack read is that the
    silhouette is asymmetric and the widest point is low -- a bag of flour
    sits down into itself.
    """
    lean = rng.choice((-1, 0, 0, 1))
    for row in range(height):
        t = row / max(1, height - 1)
        # Widest about two thirds down, rounding over at the shoulder and
        # settling square onto the ground. A monotonic curve gives a cone;
        # what makes a sack is that the silhouette comes back IN below its
        # widest point, because the bottom is sitting on something.
        profile = 0.34 + 0.66 * math.sin(min(1.0, t * 1.18) * math.pi * 0.62) ** 0.8
        if t > 0.86:
            profile *= 1.0 - 0.10 * ((t - 0.86) / 0.14)
        half = max(1, round(width * profile / 2))
        cx = x + width // 2 + round(lean * (1 - t) * 2)
        for col in range(cx - half, cx + half + 1):
            across = (col - (cx - half)) / max(1, 2 * half)
            dither_pixel(canvas, col, base_y - height + 1 + row, ramp,
                         max(0.04, tone + 0.20 * (1 - across) - 0.16 * max(0.0, across - 0.6) * 2),
                         BAYER2)
        canvas.put(cx - half - 1, base_y - height + 1 + row, ramp.frac(0.06))
        canvas.put(cx + half + 1, base_y - height + 1 + row, ramp.frac(0.06))

    # The tie, and the gathered ears above it.
    neck_y = base_y - height + 1
    canvas.hline(x + width // 2 - 1, neck_y + 1, 3, ramp.frac(max(0.04, tone - 0.26)))
    canvas.put(x + width // 2 - 2, neck_y - 1, ramp.frac(min(0.95, tone + 0.14)))
    canvas.put(x + width // 2 + 2, neck_y - 1, ramp.frac(min(0.95, tone + 0.14)))

    # Creases. Cloth over a soft load falls in folds that converge on the
    # tie, and two of them are the difference between sacking and an egg.
    for side, drift in ((-1, 0.32), (1, 0.46)):
        for row in range(3, height - 2):
            t = row / max(1, height - 1)
            canvas.put(x + width // 2 + round(side * width * drift * t),
                       base_y - height + 1 + row,
                       ramp.frac(max(0.04, tone - 0.16)))


def organic_mass(
    canvas: IndexedCanvas,
    cx: int,
    base_y: int,
    rx: int,
    ry: int,
    ramp: Ramp,
    rng: random.Random,
    tone: float = 0.40,
    lumps: int = 5,
) -> None:
    """Rock, spoil, a heap of anything. An ellipse with a broken silhouette.

    Drawn as several overlapping ellipses rather than one with noise on the
    edge: noise on an edge reads as a rectangle with a bad edge, and
    overlapping lobes read as a mass. The lobes all sit ON the ground line,
    so the thing has weight.
    """
    lobes = [(cx, base_y - ry, rx, ry)]
    for i in range(lumps):
        # Deliberately proud of the parent: a lobe wholly inside it changes
        # nothing, and a silhouette that is still an ellipse is still a pill.
        angle = (i / lumps) * math.pi + rng.uniform(-0.3, 0.3)
        lr = max(2, round(rx * rng.uniform(0.34, 0.58)))
        lh = max(2, round(ry * rng.uniform(0.60, 1.25)))
        ox = round(math.cos(angle) * rx * rng.uniform(0.55, 0.95))
        oy = round(math.sin(angle) * ry * rng.uniform(0.45, 0.85))
        lobes.append((cx + ox, base_y - lh - oy, lr, lh))

    for lx, ly, lr, lh in lobes:
        ellipse_shaded(canvas, lx, ly, lr, lh, ramp, tone, lift=0.20)
    # Flatten anything that fell below the ground line.
    for lx, ly, lr, lh in lobes:
        for y in range(base_y + 1, ly + lh + 1):
            spans = ellipse_spans(lx, ly, lr, lh).get(y)
            if spans:
                canvas.hline(spans[0], y, spans[1] - spans[0] + 1, canvas.get(spans[0], base_y + 1))
    # A dark contact line, so it sits on the ground rather than floating.
    canvas.hline(cx - rx, base_y, 2 * rx + 1, ramp.frac(0.05))


# ---------------------------------------------------------------------------
# linework


def catenary(x0: int, y0: int, x1: int, y1: int, sag: float) -> list[tuple[int, int]]:
    """Points along a hanging line. Rope does not go straight between posts."""
    span = max(1, abs(x1 - x0))
    points = []
    for step in range(span + 1):
        t = step / span
        x = round(x0 + (x1 - x0) * t)
        # cosh, normalised so the ends meet the posts exactly.
        droop = (math.cosh((t - 0.5) * 2.4) - math.cosh(1.2)) / (1 - math.cosh(1.2))
        y = round(y0 + (y1 - y0) * t + sag * droop)
        points.append((x, y))
    return points


def rope(
    canvas: IndexedCanvas,
    points: Iterable[tuple[int, int]],
    ramp: Ramp,
    tone: float = 0.52,
    twist: int = 3,
) -> None:
    """A line with a twist in it. One pixel of rope is a line; two is rope."""
    for index, (x, y) in enumerate(points):
        canvas.put(x, y, ramp.frac(tone if index % twist else min(0.95, tone + 0.22)))
        canvas.put(x, y + 1, ramp.frac(max(0.04, tone - 0.22)))


def chain(
    canvas: IndexedCanvas,
    points: list[tuple[int, int]],
    ramp: Ramp,
    tone: float = 0.46,
    link: int = 3,
) -> None:
    """Alternating links: one upright, one seen edge-on. Reads at 3px."""
    for index, (x, y) in enumerate(points):
        if index % link == 0:
            canvas.put(x, y, ramp.frac(min(0.95, tone + 0.26)))
            canvas.put(x, y + 1, ramp.frac(max(0.04, tone - 0.18)))
        elif index % link == 1:
            canvas.put(x, y, ramp.frac(tone))


def spoked_wheel(
    canvas: IndexedCanvas,
    cx: int,
    cy: int,
    radius: int,
    ramp: Ramp,
    spokes: int = 10,
    tone: float = 0.30,
    squash: float = 1.0,
) -> None:
    """A cart wheel: felloe, tyre, hub, and spokes that taper to the hub.

    `squash` is how much the wheel is turned away from the camera. At 1.0 it
    is edge-on to the viewer; below that it becomes an ellipse, which is what
    a wheel on the far side of a coach actually does.
    """
    ry = max(2, round(radius * squash))
    rim = ramp.frac(tone)
    bright = ramp.frac(min(0.95, tone + 0.24))

    ellipse_outline(canvas, cx, cy, radius, ry, rim)
    ellipse_outline(canvas, cx, cy, radius - 1, max(1, ry - 1), bright)
    ellipse_outline(canvas, cx, cy, max(1, radius - 2), max(1, ry - 2), rim)

    for index in range(spokes):
        angle = (index / spokes) * math.tau
        ex = cx + round(math.cos(angle) * (radius - 2))
        ey = cy + round(math.sin(angle) * (ry - 2))
        hx = cx + round(math.cos(angle) * 2)
        hy = cy + round(math.sin(angle) * 2)
        canvas.line(hx, hy, ex, ey, ramp.frac(min(0.95, tone + 0.14)))

    ellipse_fill(canvas, cx, cy, 2, max(1, round(2 * squash)), ramp.frac(max(0.04, tone - 0.14)))
    canvas.put(cx, cy, bright)


def arch(
    canvas: IndexedCanvas,
    x: int,
    y: int,
    width: int,
    height: int,
    ramp: Ramp,
    tone: float = 0.30,
    rise: int | None = None,
) -> None:
    """An arched opening: jambs, a semicircular head, and a keystone.

    The head is a half-ellipse rather than a half-circle so the opening can
    be taller or shallower than it is wide without the curve going wrong --
    a doorway and a cellar hatch are the same primitive.
    """
    springing = rise if rise is not None else width // 2
    cx = x + width // 2
    head_y = y + springing

    ellipse_spans_top = ellipse_spans(cx, head_y, width // 2, springing)
    for row, (left, right) in ellipse_spans_top.items():
        if row > head_y:
            continue
        canvas.hline(left, row, right - left + 1, ramp.frac(tone))
    canvas.rect(x, head_y, width, max(0, height - springing), ramp.frac(tone))

    arc(canvas, cx, head_y, width // 2, springing, ramp.frac(min(0.95, tone + 0.26)), upper_half)
    canvas.vline(x, head_y, max(0, height - springing), ramp.frac(min(0.95, tone + 0.26)))
    canvas.vline(x + width - 1, head_y, max(0, height - springing),
                 ramp.frac(max(0.04, tone - 0.12)))
    # Keystone.
    canvas.rect(cx - 1, y - 1, 3, 3, ramp.frac(min(0.95, tone + 0.34)))


def cast_shadow_ellipse(
    canvas: IndexedCanvas,
    cx: int,
    cy: int,
    rx: int,
    ry: int,
    darken,
) -> None:
    """An elliptical contact shadow, darkening whatever is already there.

    Not a fill: a shadow is a modification of the ground, and painting a flat
    dark ellipse over dithered mud puts a hole in the texture. `darken` takes
    a palette index and returns a darker one in the same family.
    """
    for y, (left, right) in ellipse_spans(cx, cy, rx, ry).items():
        for x in range(left, right + 1):
            nx = (x - cx) / max(1, rx)
            ny = (y - cy) / max(1, ry)
            steps = 2 if (nx * nx + ny * ny) < 0.45 else 1
            canvas.put(x, y, darken(canvas.get(x, y), steps))
