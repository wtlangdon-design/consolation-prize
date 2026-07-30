"""The shell of an interior: an enclosed volume rather than a flat backdrop.

The exterior library draws a lateral stage set -- everything faces the
camera, nothing recedes, and the only depth cue is that things higher up the
frame are further away. None of that transfers. A room has to be a box the
actor is inside of, and the box has to agree with the depth zones the actor
scales by.

The geometry here is one-point perspective with the vanishing point placed
above the middle of the floor. A back wall rectangle, four trapezoids
running out to the frame edges for the two side walls, the ceiling and the
floor. Every surface is drawn with its recession explicit, so a plank on the
left wall converges toward the same point the floorboards do.

Perspective is applied to POSITION only, never to a rescaled bitmap. A
texture is re-drawn at the spacing the perspective asks for; it is never
sampled from a larger one. Errata ruling 15's reasoning about actors applies
just as hard to walls.
"""

from __future__ import annotations

from dataclasses import dataclass

from canvas import IndexedCanvas
from dither import BAYER2, BAYER4, dither_pixel
from palette import Palette, Ramp


@dataclass(frozen=True)
class Box:
    """The room as a perspective box, in screen coordinates.

    `back` is the rectangle of the far wall. The four frame corners are the
    canvas corners. Everything else is interpolated between them.
    """

    width: int
    height: int
    back_left: int
    back_right: int
    back_top: int
    back_bottom: int

    @property
    def vanishing_x(self) -> int:
        return (self.back_left + self.back_right) // 2

    @property
    def vanishing_y(self) -> int:
        return (self.back_top + self.back_bottom) // 2

    def floor_left_at(self, y: int) -> float:
        """Screen x of the left wall's foot at floor row y."""
        if y <= self.back_bottom:
            return self.back_left
        walk = (y - self.back_bottom) / max(1, self.height - self.back_bottom)
        return self.back_left * (1 - walk)

    def floor_right_at(self, y: int) -> float:
        if y <= self.back_bottom:
            return self.back_right
        walk = (y - self.back_bottom) / max(1, self.height - self.back_bottom)
        return self.back_right + (self.width - self.back_right) * walk

    def ceiling_y_at(self, x: int) -> float:
        """Screen y of the ceiling/wall join above column x."""
        if self.back_left <= x <= self.back_right:
            return self.back_top
        if x < self.back_left:
            walk = 1 - (x / max(1, self.back_left))
            return self.back_top * (1 - walk)
        walk = (x - self.back_right) / max(1, self.width - self.back_right)
        return self.back_top * (1 - walk)

    def floor_y_at(self, x: int) -> float:
        """Screen y of the wall/floor join above column x, at the sides."""
        if self.back_left <= x <= self.back_right:
            return self.back_bottom
        if x < self.back_left:
            walk = 1 - (x / max(1, self.back_left))
            return self.back_bottom + (self.height - self.back_bottom) * walk
        walk = (x - self.back_right) / max(1, self.width - self.back_right)
        return self.back_bottom + (self.height - self.back_bottom) * walk


def back_wall(
    canvas: IndexedCanvas, box: Box, ramp: Ramp, rng, base: float = 0.42,
    board: int = 7, wainscot: float | None = None,
) -> None:
    """Vertical boards on the far wall, head-on so they do not converge."""
    for x in range(box.back_left, box.back_right):
        for y in range(box.back_top, box.back_bottom):
            grain = 0.03 if ((x // board) % 2) else -0.02
            dither_pixel(canvas, x, y, ramp, max(0.04, base + grain), BAYER4)

    for seam in range(box.back_left, box.back_right, board):
        canvas.vline(seam, box.back_top, box.back_bottom - box.back_top, ramp.frac(max(0.04, base - 0.18)))

    if wainscot is not None:
        # A darker dado, which is what stops a large flat wall reading as a
        # sheet of paper with things stuck to it.
        top = int(box.back_bottom - (box.back_bottom - box.back_top) * 0.34)
        canvas.rect(box.back_left, top, box.back_right - box.back_left, box.back_bottom - top,
                    ramp.frac(max(0.03, wainscot)))
        canvas.hline(box.back_left, top, box.back_right - box.back_left, ramp.frac(min(0.95, base + 0.16)))
        canvas.hline(box.back_left, top + 1, box.back_right - box.back_left, ramp.frac(max(0.03, wainscot - 0.08)))


def side_walls(
    canvas: IndexedCanvas, box: Box, ramp: Ramp, rng, base: float = 0.34,
    board_spacing: int = 14,
) -> None:
    """The two receding walls, with boards that converge on the vanishing point.

    Board spacing is widest at the frame edge and tightest at the back wall,
    which is the entire reason these read as receding rather than as two
    darker rectangles either side.
    """
    for x in range(box.width):
        if box.back_left <= x <= box.back_right:
            continue
        top = int(box.ceiling_y_at(x))
        bottom = int(box.floor_y_at(x))
        # Further from the back wall is nearer the viewer, so slightly
        # lighter: a wall running toward you catches more of the room.
        edge_distance = (
            (box.back_left - x) / max(1, box.back_left)
            if x < box.back_left
            else (x - box.back_right) / max(1, box.width - box.back_right)
        )
        tone = base + 0.10 * edge_distance
        for y in range(max(0, top), min(box.height, bottom)):
            dither_pixel(canvas, x, y, ramp, max(0.03, tone), BAYER4)

    # Converging boards. Stepped in screen space by a spacing that grows with
    # distance from the back wall, so they crowd toward the corner.
    for side in (-1, 1):
        edge = box.back_left if side < 0 else box.back_right
        limit = 0 if side < 0 else box.width
        offset, step = board_spacing, board_spacing
        while True:
            x = edge - offset if side < 0 else edge + offset
            if (side < 0 and x <= limit) or (side > 0 and x >= limit):
                break
            top = int(box.ceiling_y_at(x))
            bottom = int(box.floor_y_at(x))
            canvas.vline(x, max(0, top), min(box.height, bottom) - max(0, top),
                         ramp.frac(max(0.03, base - 0.14)))
            step = int(step * 1.45)
            offset += step

    # The two vertical corners where the side walls meet the back wall. A
    # hard line here is what makes the box read as a box.
    for x in (box.back_left, box.back_right):
        canvas.vline(x, box.back_top, box.back_bottom - box.back_top, ramp.frac(max(0.02, base - 0.24)))


def ceiling(
    canvas: IndexedCanvas, box: Box, ramp: Ramp, rng, base: float = 0.16, beams: int = 5,
) -> None:
    """Dark overhead with beams running back into the room.

    Kept very dark on purpose. A lit ceiling in a saloon reads as a modern
    room; in 1858 the only thing up there is whatever the chandelier throws,
    and the answer is nearly nothing.
    """
    for x in range(box.width):
        join = int(box.ceiling_y_at(x))
        for y in range(0, max(0, join)):
            depth = y / max(1, join)
            dither_pixel(canvas, x, y, ramp, max(0.02, base * (0.55 + 0.45 * depth)), BAYER4)

    # Beams converge on the vanishing point.
    vanish_x, vanish_y = box.vanishing_x, box.vanishing_y
    for index in range(beams):
        frame_x = int((index + 0.5) * box.width / beams)
        canvas.line(frame_x, 0, vanish_x, vanish_y, ramp.frac(max(0.02, base - 0.08)))
        canvas.line(frame_x + 1, 0, vanish_x, vanish_y, ramp.frac(min(0.9, base + 0.10)))

    canvas.hline(box.back_left, box.back_top, box.back_right - box.back_left, ramp.frac(max(0.02, base - 0.10)))


def dirt_floor(
    canvas: IndexedCanvas, box: Box, ramp: Ramp, rng, grit: Ramp | None = None,
    base: float = 0.30,
) -> None:
    """A dirt floor in perspective. Doc 05: the chandelier hangs over this.

    Grain density falls off with distance -- the same trick the mud street
    used, but driven by the perspective rather than by screen row, so the
    texture agrees with the walls it meets.
    """
    for y in range(box.back_bottom, box.height):
        left = int(box.floor_left_at(y))
        right = int(box.floor_right_at(y))
        depth = (y - box.back_bottom) / max(1, box.height - box.back_bottom)
        # Nearer floor is fractionally darker: it is further from the
        # chandelier and out of the window shaft.
        tone = base - 0.14 * depth
        for x in range(max(0, left), min(box.width, right)):
            dither_pixel(canvas, x, y, ramp, max(0.04, tone), BAYER2)

    # Scuffed hollows and boot-churn, denser where people actually walk.
    for _ in range(150):
        y = rng.randrange(box.back_bottom, box.height)
        depth = (y - box.back_bottom) / max(1, box.height - box.back_bottom)
        left, right = int(box.floor_left_at(y)), int(box.floor_right_at(y))
        if right <= left:
            continue
        x = rng.randrange(left, right)
        length = 1 + int(rng.random() * 6 * (0.4 + depth))
        canvas.hline(x, y, length, ramp.frac(max(0.04, base - 0.10 - 0.05 * rng.random())))

    if grit is not None:
        for _ in range(34):
            y = rng.randrange(box.back_bottom, box.height)
            left, right = int(box.floor_left_at(y)), int(box.floor_right_at(y))
            if right <= left:
                continue
            canvas.put(rng.randrange(left, right), y, grit.frac(0.16 + 0.20 * rng.random()))

    # The join where floor meets back wall. Without it the two planes merge.
    canvas.hline(box.back_left, box.back_bottom, box.back_right - box.back_left,
                 ramp.frac(max(0.03, base - 0.16)))


def floor_zone_rows(box: Box, zones: int = 3) -> list[tuple[int, int]]:
    """Row spans for the depth zones, split across the floor's screen depth.

    Returned rather than hard-coded so the room JSON and the composition are
    generated from one description of where the floor actually is.
    """
    top, bottom = box.back_bottom, box.height
    spans: list[tuple[int, int]] = []
    # Uneven split: the near zone gets more rows because perspective gives
    # the foreground more screen space per unit of floor.
    weights = [0.28, 0.32, 0.40][:zones]
    total = sum(weights)
    cursor = top
    for index, weight in enumerate(weights):
        depth = int((bottom - top) * weight / total)
        end = bottom if index == zones - 1 else cursor + depth
        spans.append((cursor, end))
        cursor = end
    return spans


def doorway(
    canvas: IndexedCanvas, x: int, y: int, width: int, height: int, ramp: Ramp,
    dark: Ramp, base: float = 0.30,
) -> None:
    """A door in the back wall, standing open on somewhere much brighter.

    The opening is the second brightest thing in the room after the window,
    because outside is daylight and inside is not.
    """
    canvas.rect(x - 2, y - 2, width + 4, height + 2, ramp.frac(max(0.03, base - 0.20)))

    # The opening is DAYLIGHT. Outside is a bright street and inside is a dim
    # room, so this is the second brightest thing in the frame after the
    # window. Filling it with a mid tone -- the first attempt -- made it read
    # as a cupboard rather than the way out.
    canvas.rect(x, y, width, height, dark.at(dark.count - 2))
    for row in range(height):
        # Slight falloff up the opening, as the street outside recedes.
        if row < height // 3:
            canvas.hline(x, y + row, width, dark.at(dark.count - 4))

    # Frame, catching the outside light on its inner edge.
    canvas.vline(x - 1, y - 1, height + 1, ramp.frac(min(0.95, base + 0.30)))
    canvas.vline(x + width, y - 1, height + 1, ramp.frac(max(0.03, base - 0.10)))
    canvas.hline(x - 2, y - 2, width + 4, ramp.frac(min(0.95, base + 0.22)))

    # Batwing doors: two dark leaves across the middle third, with daylight
    # above and below them. That gap top and bottom is the entire silhouette
    # of a saloon door and it is what makes the opening legible instantly.
    leaf_top = y + height // 4
    leaf_height = height // 2
    for leaf in (0, 1):
        leaf_x = x + 1 + leaf * (width // 2)
        leaf_w = width // 2 - 2
        canvas.rect(leaf_x, leaf_top, leaf_w, leaf_height, ramp.frac(max(0.05, base - 0.14)))
        for slat in range(1, leaf_w, 3):
            canvas.vline(leaf_x + slat, leaf_top, leaf_height, ramp.frac(max(0.04, base - 0.22)))
        canvas.vline(leaf_x, leaf_top, leaf_height, ramp.frac(min(0.95, base + 0.24)))
        canvas.hline(leaf_x, leaf_top, leaf_w, ramp.frac(min(0.95, base + 0.18)))
        canvas.hline(leaf_x, leaf_top + leaf_height - 1, leaf_w, ramp.frac(max(0.03, base - 0.28)))


def interior_window(
    canvas: IndexedCanvas, x: int, y: int, width: int, height: int, frame: Ramp,
    glow: Ramp, panes: tuple[int, int] = (2, 2), base: float = 0.34,
) -> None:
    """A window seen from inside: a hole full of light with bars across it.

    Deliberately drawn near the top of the glow family. It is the source, so
    it has to out-light everything the lighting pass can lift, or the shaft
    ends up brighter than the window it comes from.
    """
    canvas.rect(x - 2, y - 2, width + 4, height + 4, frame.frac(max(0.03, base - 0.16)))
    canvas.rect(x, y, width, height, glow.at(glow.count - 2))

    cols, rows = panes
    for col in range(1, cols):
        canvas.vline(x + col * width // cols, y, height, frame.frac(max(0.04, base - 0.06)))
    for row in range(1, rows):
        canvas.hline(x, y + row * height // rows, width, frame.frac(max(0.04, base - 0.06)))

    # Sill, and the light spilling onto it.
    canvas.hline(x - 3, y + height + 2, width + 6, frame.frac(min(0.95, base + 0.34)))
    canvas.hline(x - 3, y + height + 3, width + 6, frame.frac(base))
    canvas.hline(x, y + height - 1, width, glow.at(glow.count - 1))


def plank_floor(
    canvas: IndexedCanvas, box: Box, ramp: Ramp, rng, base: float = 0.34,
    boards: int = 13,
) -> None:
    """A swept plank floor in perspective. The opposite of dirt_floor.

    Boards run away from the viewer and converge, and their spacing tightens
    with distance. Doc 05 calls this the tidiest room in the territory, so
    the grain is regular and the only irregularity is wear along the line
    people actually walk.
    """
    for y in range(box.back_bottom, box.height):
        left = int(box.floor_left_at(y))
        right = int(box.floor_right_at(y))
        depth = (y - box.back_bottom) / max(1, box.height - box.back_bottom)
        tone = base + 0.10 * depth          # nearer floor catches more light
        for x in range(max(0, left), min(box.width, right)):
            dither_pixel(canvas, x, y, ramp, max(0.04, tone), BAYER4)

    # Board seams, converging on the vanishing point.
    vanish_x, vanish_y = box.vanishing_x, box.vanishing_y
    for index in range(boards + 1):
        back_x = box.back_left + index * (box.back_right - box.back_left) / boards
        # Extend the line from the vanishing point through the back-wall
        # foot and on to the bottom of the frame.
        run = box.back_bottom - vanish_y
        if run == 0:
            continue
        scale = (box.height - vanish_y) / run
        front_x = vanish_x + (back_x - vanish_x) * scale
        canvas.line(int(back_x), box.back_bottom, int(front_x), box.height - 1,
                    ramp.frac(max(0.03, base - 0.14)))

    # Cross-joins, spaced wider as they come forward.
    y, gap = box.back_bottom + 5, 5
    while y < box.height:
        left, right = int(box.floor_left_at(y)), int(box.floor_right_at(y))
        canvas.hline(max(0, left), y, min(box.width, right) - max(0, left),
                     ramp.frac(max(0.03, base - 0.09)))
        gap = int(gap * 1.45)
        y += gap

    canvas.hline(box.back_left, box.back_bottom, box.back_right - box.back_left,
                 ramp.frac(max(0.03, base - 0.20)))
