"""Furniture and props as components, not as set dressing.

Every one of these is a hotspot in doc 05 -- the piano, the chandelier, the
bar, the mirror, the stairs, the portrait, the spittoon, the stove, the
handbill. They are the things the player clicks, which makes them the
subject of the picture rather than decoration in it, and they get the same
treatment the buildings got: parameterised, reusable, drawn from ramps.

Nothing here carries text. The handbill is blank board, the same rule the
exterior signage follows -- doc 05 holds the words and the examine layer
delivers them. A drawn approximation of five lines of rules at 320x144
would be a grey smear that contradicts the real text.
"""

from __future__ import annotations

from canvas import IndexedCanvas
from dither import BAYER2, BAYER4, dither_pixel
from palette import Palette, Ramp


def bar_counter(
    canvas: IndexedCanvas, palette: Palette, x: int, y: int, width: int, height: int,
    wood: Ramp, brass: Ramp, rng, back_edge: int = 0,
) -> None:
    """The long mahogany bar. Doc 05: "Mahogany. Genuinely."

    Runs into the frame, so the far end is both higher and shallower. Its top
    is the lightest large surface in the room, which is the whole reason the
    luminance audit against Thad matters: this is what he stands in front of.
    """
    #: Rows of visible counter top. This is the single most important number
    #: in the component: at two or three rows the bar has no top surface and
    #: reads as a panelled wall with a bright line on it. A counter is
    #: identified by the slab you can see the depth of.
    top_rows = max(4, height // 5)

    for column in range(width):
        walk = column / max(1, width - 1)
        top = y + int(back_edge * (1 - walk))
        depth = int(height * (0.86 + 0.14 * walk))

        # The top slab, seen slightly from above. Light along the back edge
        # where the lamps hit it, falling toward the front lip.
        for row in range(top_rows):
            tone = 0.88 - 0.18 * (row / max(1, top_rows - 1))
            dither_pixel(canvas, x + column, top + row, wood, tone, BAYER2)
        canvas.put(x + column, top, wood.frac(0.92))                  # polish
        canvas.put(x + column, top + top_rows - 1, wood.frac(0.30))   # front lip

        # Front panel below the lip, fielded into bays.
        for row in range(top_rows, depth):
            fall = (row - top_rows) / max(1, depth - top_rows)
            bay = 0.05 if (column // 11) % 2 else -0.04
            tone = 0.40 - 0.16 * fall + bay
            dither_pixel(canvas, x + column, top + row, wood, max(0.05, tone), BAYER4)
        if column % 11 == 0:
            canvas.vline(x + column, top + top_rows, depth - top_rows, wood.frac(0.16))

        # Foot rail. Dark brass, two rows, and NOT lit from within -- at the
        # top of the ramp it ran the length of the room as a glowing stripe
        # and read as neon.
        rail_y = top + depth - 3
        canvas.put(x + column, rail_y, brass.frac(0.30 if (column % 9) < 5 else 0.40))
        canvas.put(x + column, rail_y + 1, brass.frac(0.12))

    # The near end of the bar gets a return, so it terminates as an object
    # instead of running off the frame edge as a wall would.
    end_top = y + int(back_edge * 0)
    canvas.vline(x + width - 1, end_top, int(height * 0.86), wood.frac(0.22))


def back_bar(
    canvas: IndexedCanvas, palette: Palette, x: int, y: int, width: int, height: int,
    wood: Ramp, glass: Ramp, brass: Ramp, rng, mirror: bool = True,
) -> None:
    """Shelves, bottles, and the mirror doc 05 gives a hotspot of its own."""
    canvas.rect(x, y, width, height, wood.frac(0.30))
    canvas.hline(x, y, width, wood.frac(0.62))
    canvas.vline(x, y, height, wood.frac(0.52))

    if mirror:
        # The mirror. Slightly cooler and flatter than everything around it,
        # because it is returning the room rather than being lit by it.
        mx, my = x + 5, y + 4
        mw, mh = width - 10, int(height * 0.38)
        # Dark and warm, not a slab of slate. A mirror in a dim room is
        # mostly the dim room; it only lightens where it happens to be
        # returning a lamp.
        for row in range(mh):
            tone = 0.22 - 0.08 * (row / max(1, mh))
            for col in range(mw):
                dither_pixel(canvas, mx + col, my + row, glass, max(0.04, tone), BAYER4)
        canvas.outline(mx - 1, my - 1, mw + 2, mh + 2, brass.frac(0.50))
        canvas.outline(mx - 2, my - 2, mw + 4, mh + 4, wood.frac(0.20))
        # Two returned highlights -- the chandelier and the window -- and
        # nothing else. A legible reflection at this size reads as a doorway
        # and the player walks into it.
        canvas.hline(mx + mw // 3, my + mh // 3, max(3, mw // 6), glass.frac(0.52))
        canvas.put(mx + 3, my + 2, glass.frac(0.60))

    shelf_y = y + int(height * 0.56)
    for shelf in range(2):
        sy = shelf_y + shelf * max(4, (height - shelf_y + y) // 2)
        if sy + 2 >= y + height:
            break
        canvas.hline(x + 2, sy, width - 4, wood.frac(0.54))
        canvas.hline(x + 2, sy + 1, width - 4, wood.frac(0.18))
        cursor = x + 3
        while cursor < x + width - 4:
            if rng.random() < 0.34:
                cursor += 2 + rng.randrange(0, 3)
                continue
            bottle_h = 3 + rng.randrange(0, 4)
            bottle_w = 1 + (rng.random() < 0.22)
            top = sy - bottle_h
            if top > y:
                # Bottles are glass over spirit, so they run warm and dark
                # with one catchlight. A row of pale ticks reads as a fence.
                body = brass if rng.random() < 0.5 else glass
                tone = 0.18 + 0.26 * rng.random()
                canvas.rect(cursor, top, bottle_w, bottle_h, body.frac(tone))
                canvas.put(cursor, top, body.frac(min(0.95, tone + 0.34)))
            cursor += bottle_w + 2 + rng.randrange(1, 4)


def chandelier(
    canvas: IndexedCanvas, palette: Palette, x: int, y: int, width: int,
    brass: Ramp, flame: Ramp, arms: int = 6, drop: int = 14,
) -> tuple[list[tuple[int, int]], int]:
    """Ornate brass, hanging over a dirt floor. Returns the candle positions.

    Doc 05's joke is the object's cost against the floor beneath it, so it is
    drawn as the most worked object in the room -- tiers, scrolled arms, a
    finial -- and then hung over nothing.
    """
    canvas.vline(x, y - drop, drop, brass.frac(0.34))
    canvas.put(x, y - drop, brass.frac(0.60))

    # Two tiers of ring, the upper one narrower.
    candles: list[tuple[int, int]] = []
    for tier, (scale, offset) in enumerate(((1.0, 0), (0.58, -5))):
        half = int(width * scale) // 2
        ring_y = y + offset
        canvas.hline(x - half, ring_y, half * 2, brass.frac(0.52))
        canvas.hline(x - half, ring_y + 1, half * 2, brass.frac(0.24))
        # Scrolled arms sweeping up from the ring.
        count = arms if tier == 0 else max(3, arms // 2)
        for index in range(count):
            span = (index / max(1, count - 1)) * 2 - 1
            arm_x = int(x + span * half)
            canvas.line(x, ring_y, arm_x, ring_y - 2, brass.frac(0.44))
            canvas.put(arm_x, ring_y - 3, brass.frac(0.66))
            # Candle and its flame.
            canvas.vline(arm_x, ring_y - 6, 3, flame.frac(0.72))
            candles.append((arm_x, ring_y - 7))

    # Finial underneath, and the central boss.
    canvas.put(x, y + 3, brass.frac(0.58))
    canvas.put(x, y + 4, brass.frac(0.36))
    canvas.rect(x - 1, y - 2, 3, 3, brass.frac(0.46))
    return candles, y


def upright_piano(
    canvas: IndexedCanvas, palette: Palette, x: int, y: int, width: int, height: int,
    wood: Ramp, ivory: Ramp, rng,
) -> None:
    """An upright against the wall. Doc 05: nobody here can play it.

    Drawn slightly out from the wall with its lid closed. Its keyboard is the
    only pure light-and-dark pattern in the room, which makes it read at a
    glance even at the far end of the frame.
    """
    canvas.rect(x, y, width, height, wood.frac(0.34))
    # Top lid and the moulding under it.
    canvas.hline(x, y, width, wood.frac(0.62))
    canvas.hline(x, y + 1, width, wood.frac(0.46))
    canvas.hline(x - 1, y + 2, width + 2, wood.frac(0.24))

    # Upper front panel, fielded.
    panel_h = int(height * 0.40)
    for row in range(3, panel_h):
        for col in range(2, width - 2):
            tone = 0.30 + (0.05 if (col // 6) % 2 else -0.04)
            dither_pixel(canvas, x + col, y + row, wood, max(0.05, tone), BAYER4)
    canvas.outline(x + 2, y + 3, width - 4, panel_h - 3, wood.frac(0.20))

    # Keyboard: the readable feature.
    key_y = y + panel_h + 1
    canvas.hline(x - 1, key_y - 1, width + 2, wood.frac(0.52))
    canvas.rect(x, key_y, width, 3, ivory.frac(0.88))
    for col in range(0, width, 2):
        canvas.vline(x + col, key_y, 3, ivory.frac(0.66))
    # Sharps, in the irregular 2-3 grouping that says piano and not xylophone.
    for group_start in range(0, width, 7):
        for offset in (1, 3, 5):
            sharp = x + group_start + offset
            if x < sharp < x + width - 1:
                canvas.vline(sharp, key_y, 2, wood.frac(0.06))
    canvas.hline(x, key_y + 3, width, wood.frac(0.18))

    # Lower panel and the pedal lyre.
    canvas.rect(x, key_y + 4, width, max(1, height - (key_y + 4 - y)), wood.frac(0.26))
    canvas.rect(x + width // 2 - 2, y + height - 4, 5, 3, wood.frac(0.16))
    canvas.put(x + width // 2, y + height - 2, palette.family("accent_gold").at(4))
    # A candle sconce, because a piano nobody plays still gets a light.
    canvas.vline(x + width - 5, y - 3, 3, ivory.frac(0.80))


def rough_table(
    canvas: IndexedCanvas, palette: Palette, x: int, y: int, width: int, height: int,
    wood: Ramp, rng, legs: bool = True,
) -> None:
    """A plank table. Rough, per the brief -- nothing here is joinery."""
    canvas.rect(x, y, width, 3, wood.frac(0.60))
    canvas.hline(x, y, width, wood.frac(0.82))
    canvas.hline(x, y + 3, width, wood.frac(0.18))
    for plank in range(x + 3, x + width - 1, 4):
        canvas.put(plank, y, wood.frac(0.44))
    if legs:
        for leg_x in (x + 1, x + width - 3):
            canvas.rect(leg_x, y + 3, 2, height - 3, wood.frac(0.26))
            canvas.put(leg_x, y + height - 1, wood.frac(0.12))


def rough_chair(
    canvas: IndexedCanvas, palette: Palette, x: int, y: int, height: int,
    wood: Ramp, back: bool = True, facing: int = 1, askew: int = 0,
) -> None:
    """A chair, four sticks and a back. Two pixels wide is enough at 320.

    `askew` slides the back rail off the seat, which at this size is the
    whole vocabulary available for "pulled out and not pushed back in". A
    row of squared chairs reads as furniture in a catalogue; one pixel of
    offset each way reads as a room people got up from.
    """
    seat_y = y + height // 2
    canvas.hline(x, seat_y, 4, wood.frac(0.50))
    canvas.hline(x, seat_y + 1, 4, wood.frac(0.28))
    canvas.vline(x, seat_y + 1, height - (seat_y - y) - 1, wood.frac(0.26))
    canvas.vline(x + 3, seat_y + 1, height - (seat_y - y) - 1, wood.frac(0.20))
    if back:
        rail_x = (x if facing > 0 else x + 3) + askew
        canvas.vline(rail_x, y, seat_y - y, wood.frac(0.34))
        canvas.put(rail_x, y, wood.frac(0.54))
        canvas.hline(min(rail_x, rail_x), y + 2, 3 if facing > 0 else -3, wood.frac(0.30))


def staircase(
    canvas: IndexedCanvas, palette: Palette, x: int, y: int, width: int, height: int,
    wood: Ramp, rng, steps: int = 9, rise_right: bool = True,
) -> None:
    """Stairs at the back, climbing out of frame.

    Each tread gets a lit nose and a dark riser; that alternation is what
    makes a staircase read at this size, not the diagonal.
    """
    tread = max(2, width // steps)
    riser = max(2, height // steps)
    for step in range(steps):
        step_x = x + step * tread if rise_right else x + width - (step + 1) * tread
        step_y = y + height - (step + 1) * riser
        canvas.rect(step_x, step_y, tread, riser, wood.frac(0.30))
        canvas.hline(step_x, step_y, tread, wood.frac(0.66))          # nose
        canvas.hline(step_x, step_y + 1, tread, wood.frac(0.40))
        canvas.vline(step_x, step_y, riser, wood.frac(0.16))          # riser edge
        # The dark under-stair, which is where the volume comes from.
        canvas.rect(step_x, step_y + riser, tread, y + height - (step_y + riser), wood.frac(0.17))

    # Banister, following the same diagonal a handrail's height above.
    for step in range(steps):
        step_x = x + step * tread if rise_right else x + width - (step + 1) * tread
        step_y = y + height - (step + 1) * riser
        canvas.put(step_x + tread // 2, step_y - 8, wood.frac(0.56))
        if step % 2 == 0:
            canvas.vline(step_x + tread // 2, step_y - 8, 8, wood.frac(0.34))


def handbill(
    canvas: IndexedCanvas, palette: Palette, x: int, y: int, width: int, height: int,
    paper: Ramp, rng,
) -> None:
    """Blank paper, pinned at one corner and curling at another.

    Doc 05 gives this the full five rules and calls it critical and unread.
    None of that is drawn. It is a pale rectangle that has been on a wall a
    long time, and the examine layer does the rest.
    """
    canvas.rect(x - 1, y - 1, width + 2, height + 2, palette.family('umber').at(1))
    canvas.rect(x, y, width, height, paper.frac(0.88))
    for row in range(height):
        for col in range(width):
            if rng.random() < 0.13:
                canvas.put(x + col, y + row, paper.frac(0.76))
    # Foxing along the bottom edge, and a curled bottom-right corner.
    canvas.hline(x, y + height - 1, width, paper.frac(0.64))
    canvas.put(x + width - 1, y + height - 1, paper.frac(0.34))
    canvas.put(x + width - 2, y + height - 1, paper.frac(0.44))
    # Pin, and the shadow the sheet throws below it.
    canvas.put(x + width // 2, y, palette.family("grey").at(11))
    canvas.hline(x + 1, y + height, width, palette.family("void").at(0))


def framed_portrait(
    canvas: IndexedCanvas, palette: Palette, x: int, y: int, width: int, height: int,
    frame: Ramp, faded: Ramp, rng,
) -> None:
    """A faded portrait. Low contrast on purpose -- it is faded."""
    canvas.rect(x, y, width, height, frame.frac(0.44))
    canvas.outline(x, y, width, height, frame.frac(0.64))
    inner_x, inner_y = x + 2, y + 2
    inner_w, inner_h = width - 4, height - 4
    for row in range(inner_h):
        tone = 0.52 - 0.12 * (row / max(1, inner_h))
        for col in range(inner_w):
            dither_pixel(canvas, inner_x + col, inner_y + row, faded, tone, BAYER4)
    # A head and shoulders, barely. Any more and it becomes a character.
    head_x = inner_x + inner_w // 2
    canvas.rect(head_x - 1, inner_y + 2, 3, 3, faded.frac(0.34))
    canvas.rect(head_x - 2, inner_y + 5, 5, inner_h - 5, faded.frac(0.26))
    canvas.hline(x, y + height - 1, width, frame.frac(0.20))


def spittoon(
    canvas: IndexedCanvas, palette: Palette, x: int, y: int, width: int,
    brass: Ramp,
) -> None:
    """Brass, dented. Doc 05's LISTEN line is "Regrettably, yes."."""
    height = max(3, width // 2)
    for row in range(height):
        walk = row / max(1, height - 1)
        inset = int(abs(walk - 0.45) * width * 0.30)
        canvas.hline(x + inset, y + row, width - inset * 2, brass.frac(0.30 + 0.22 * (1 - walk)))
    canvas.hline(x, y, width, brass.frac(0.62))
    canvas.put(x + width - 2, y + 1, brass.frac(0.14))
    canvas.hline(x + 1, y + height, width - 2, brass.frac(0.10))


def pot_stove(
    canvas: IndexedCanvas, palette: Palette, x: int, y: int, width: int, height: int,
    iron: Ramp, ember: Ramp, flue_top: int = 0,
) -> tuple[int, int]:
    """A cast-iron stove. Returns the door position, which is a light source."""
    canvas.rect(x, y, width, height, iron.frac(0.22))
    canvas.hline(x, y, width, iron.frac(0.42))
    canvas.vline(x, y, height, iron.frac(0.34))
    canvas.vline(x + width - 1, y, height, iron.frac(0.10))
    # Flue running up out of frame.
    flue_x = x + width // 2 - 1
    canvas.rect(flue_x, flue_top, 3, y - flue_top, iron.frac(0.26))
    canvas.vline(flue_x, flue_top, y - flue_top, iron.frac(0.40))
    # Legs.
    for leg in (x + 1, x + width - 2):
        canvas.vline(leg, y + height, 2, iron.frac(0.16))
    # The open door, glowing.
    door_x, door_y = x + width // 2 - 2, y + height // 2 - 1
    canvas.rect(door_x, door_y, 4, 3, ember.frac(0.80))
    canvas.put(door_x, door_y, ember.frac(0.60))
    canvas.outline(door_x - 1, door_y - 1, 6, 5, iron.frac(0.44))
    return door_x + 2, door_y + 1


def glassware(
    canvas: IndexedCanvas, palette: Palette, x: int, y: int, count: int, glass: Ramp, rng,
) -> None:
    """A few glasses on a surface. Doc 05's bar LISTEN is glasses and talk."""
    cursor = x
    for _ in range(count):
        height = 2 + rng.randrange(0, 2)
        canvas.vline(cursor, y - height, height, glass.frac(0.56))
        canvas.put(cursor, y - height, glass.frac(0.86))
        cursor += 2 + rng.randrange(0, 2)


# -- evidence of people, without people -------------------------------------
#
# Doc 07 puts ambient characters in this room, but the background has to hold
# up before any of them are drawn and it has to hold up in the frames where
# they have walked off. An empty saloon should read as a saloon between
# rounds, not as a saloon at four in the morning: the difference is entirely
# in what people left behind them.


def wall_hooks(
    canvas: IndexedCanvas, palette: Palette, x: int, y: int, count: int,
    peg: Ramp, rng, spacing: int = 7,
) -> None:
    """A rail of pegs with coats and hats on it.

    The single strongest "somebody is here" signal available, because a coat
    on a hook is a person who has not left. Deliberately varied: an even row
    of identical coats reads as stock, not as custom.
    """
    garments = ("umber", "grey", "pine_green", "dusk", "mud")
    canvas.hline(x - 2, y, count * spacing + 4, peg.frac(0.44))
    canvas.hline(x - 2, y + 1, count * spacing + 4, peg.frac(0.18))

    for index in range(count):
        hook_x = x + index * spacing
        canvas.put(hook_x, y + 2, peg.frac(0.56))
        if rng.random() < 0.24:
            continue                                   # an empty peg
        cloth = palette.family(garments[rng.randrange(len(garments))])
        hang = 9 + rng.randrange(0, 6)
        width = 4 + (rng.random() < 0.45)
        # Shoulders, then the body of the coat falling and narrowing.
        canvas.rect(hook_x - width // 2, y + 3, width, 2, cloth.frac(0.30))
        for row in range(2, hang):
            taper = row // 5
            canvas.rect(hook_x - width // 2 + taper, y + 3 + row,
                        max(1, width - taper * 2), 1, cloth.frac(0.22 + 0.10 * (row / hang)))
        canvas.vline(hook_x - width // 2, y + 3, hang, cloth.frac(0.38))
        if rng.random() < 0.5:
            # A hat on the same peg, above the coat.
            brim = width + 2
            canvas.hline(hook_x - brim // 2, y + 2, brim, cloth.frac(0.16))
            canvas.rect(hook_x - 1, y - 1, 3, 3, cloth.frac(0.24))


def left_glass(
    canvas: IndexedCanvas, palette: Palette, x: int, y: int, glass: Ramp, rng,
    drained: bool = False,
) -> None:
    """One glass, set down and not collected. `y` is the surface it stands on."""
    height = 3 + (rng.random() < 0.4)
    canvas.vline(x, y - height, height, glass.frac(0.30 if drained else 0.46))
    canvas.put(x, y - height, glass.frac(0.72))
    if not drained:
        # What is left in it, sitting at the bottom.
        canvas.put(x, y - 1, palette.family("accent_gold").at(3))


def standing_bottle(
    canvas: IndexedCanvas, palette: Palette, x: int, y: int, glass: Ramp,
    height: int = 7,
) -> None:
    """A bottle where somebody set it down. Neck, shoulder, body, catchlight."""
    canvas.vline(x, y - height, 2, glass.frac(0.24))              # neck
    canvas.put(x, y - height, glass.frac(0.50))                   # lip
    canvas.rect(x - 1, y - height + 2, 3, height - 2, glass.frac(0.28))
    canvas.vline(x - 1, y - height + 3, height - 4, glass.frac(0.44))
    canvas.put(x + 1, y - 1, glass.frac(0.12))


def card_hand(
    canvas: IndexedCanvas, palette: Palette, x: int, y: int, paper: Ramp, rng,
    count: int = 5,
) -> None:
    """A hand of cards left face-up on a table, fanned and abandoned.

    Pale, so it reads at a glance against dark timber, and irregular, because
    a squared-up deck reads as a block and a fan reads as a game somebody
    walked out of.
    """
    for index in range(count):
        card_x = x + index * 2
        lift = -(index % 2)
        canvas.rect(card_x, y + lift, 2, 3, paper.frac(0.80 - 0.04 * (index % 3)))
        canvas.vline(card_x, y + lift, 3, paper.frac(0.90))
        if rng.random() < 0.4:
            canvas.put(card_x + 1, y + lift + 1, palette.family("accent_red").at(4))
    # Two more face-down at an angle beside them.
    canvas.rect(x - 5, y + 1, 3, 2, paper.frac(0.44))
    canvas.rect(x - 6, y + 2, 3, 2, paper.frac(0.38))


# -- Room 5, the Assay Office. Ruling 17b identity: grey, bone, glass, brass.
#
# Cold precision, and it must not read as the Nugget rearranged. The
# separation is mostly material -- no warm family appears in any of these --
# but it is also ORDER. Everything in the Nugget is where somebody put it
# down; everything here is squared, ranked and evenly spaced, and that
# regularity is as much of the identity as the palette is.


def service_counter(
    canvas: IndexedCanvas, palette: Palette, x: int, y: int, width: int, height: int,
    top_ramp: Ramp, body: Ramp, brass: Ramp, rng, window: tuple[int, int] = (0, 0),
) -> None:
    """A counter across the middle distance with a barred service window."""
    top_rows = max(3, height // 6)
    for column in range(width):
        for row in range(top_rows):
            tone = 0.58 - 0.10 * (row / max(1, top_rows - 1))
            dither_pixel(canvas, x + column, y + row, top_ramp, tone, BAYER2)
        for row in range(top_rows, height):
            fall = (row - top_rows) / max(1, height - top_rows)
            panel = 0.03 if (column // 14) % 2 else -0.03
            dither_pixel(canvas, x + column, y + row, body,
                         max(0.04, 0.30 - 0.10 * fall + panel), BAYER4)
    canvas.hline(x, y, width, top_ramp.frac(0.72))
    canvas.hline(x, y + top_rows - 1, width, body.frac(0.16))
    for seam in range(x, x + width, 14):
        canvas.vline(seam, y + top_rows, height - top_rows, body.frac(0.14))

    # The barred window: an opening in the screen above the counter, with
    # vertical bars. This is the room's one piece of hostile architecture and
    # doc 05 hangs a hotspot on the sign beside it.
    win_x, win_w = window
    if win_w:
        # A partition standing on the counter, with the opening cut in it.
        # Bars alone stick up out of nothing and read as a freestanding cage
        # or a xylophone; it is the screen around them that makes them a
        # service window.
        grille_top = y - 22
        canvas.rect(win_x - 14, grille_top - 4, win_w + 28, 26, body.frac(0.26))
        canvas.hline(win_x - 14, grille_top - 4, win_w + 28, body.frac(0.40))
        canvas.rect(win_x - 2, grille_top - 2, win_w + 4, 24, body.frac(0.16))
        canvas.rect(win_x, grille_top, win_w, 22, body.frac(0.05))
        # Thin, dark bars. At brass 0.42 on a 4px pitch this read as a rank
        # of gold pipes and took the focal point off the balance, which is
        # the object the room is actually about.
        for bar in range(win_x + 3, win_x + win_w - 2, 5):
            canvas.vline(bar, grille_top + 1, 20, brass.frac(0.14))
        canvas.hline(win_x - 2, grille_top - 2, win_w + 4, brass.frac(0.20))
        canvas.hline(win_x, grille_top + 10, win_w, brass.frac(0.12))
        canvas.hline(win_x, y - 1, win_w, top_ramp.frac(0.80))


def vial_shelves(
    canvas: IndexedCanvas, palette: Palette, x: int, y: int, width: int, height: int,
    frame: Ramp, glass: Ramp, label: Ramp, rng, ranks: int = 3,
) -> None:
    """Sample vials in perfect order. The order is the characterisation.

    Evenly spaced, identical heights, every one labelled. Contrast this with
    the Nugget's back bar, where the bottles are deliberately irregular --
    same component idea, opposite reading, and that is the whole point of
    ruling 17b.
    """
    canvas.rect(x, y, width, height, frame.frac(0.20))
    canvas.outline(x, y, width, height, frame.frac(0.34))
    shelf_gap = height // ranks
    for rank in range(ranks):
        sy = y + (rank + 1) * shelf_gap - 1
        canvas.hline(x + 1, sy, width - 2, frame.frac(0.46))
        canvas.hline(x + 1, sy + 1, width - 2, frame.frac(0.12))
        # Vials: same height, same spacing, no exceptions.
        for vx in range(x + 3, x + width - 3, 4):
            canvas.vline(vx, sy - 4, 4, glass.frac(0.52))
            canvas.put(vx, sy - 4, glass.frac(0.74))
            canvas.put(vx, sy - 1, label.frac(0.20))     # the sample in it
            canvas.put(vx + 1, sy - 3, label.frac(0.78))  # the label, blank


def balance_under_dome(
    canvas: IndexedCanvas, palette: Palette, x: int, y: int, width: int, height: int,
    glass: Ramp, brass: Ramp, base: Ramp,
) -> None:
    """A precision balance under a glass dome.

    The brightest object in the room by design -- doc 05 has men weep in
    front of it -- which is exactly why the plan audit flagged it. Thad's
    face measures 75 below this, so anyone standing against it is a
    silhouette, and the composition puts it where no head lands.
    """
    canvas.rect(x, y + height - 3, width, 3, base.frac(0.26))
    canvas.hline(x, y + height - 3, width, base.frac(0.46))

    # Dome: a real semicircular shoulder over straight sides. Two vertical
    # arcs alone read as an easel or a music stand -- the closed curve
    # across the top is what makes it glass over something.
    import math as _math

    half = width / 2
    centre_x = x + half
    shoulder = int(height * 0.55)
    for row in range(height - 3):
        if row < shoulder:
            # Elliptical top.
            t = 1.0 - (row / max(1, shoulder - 1))
            span = half * _math.sqrt(max(0.0, 1.0 - t * t))
        else:
            span = half
        left, right = int(centre_x - span), int(centre_x + span)
        if right - left < 1:
            continue
        canvas.put(left, y + row, glass.at(glass.count - 2))
        canvas.put(right - 1, y + row, glass.frac(0.44))
        if row == 0:
            canvas.hline(left, y, right - left, glass.at(glass.count - 2))
    # Catchlight down the lit shoulder, and the knop on top.
    canvas.put(int(centre_x - half * 0.55), y + 2, glass.at(glass.count - 1))
    canvas.put(int(centre_x - half * 0.40), y + 1, glass.at(glass.count - 1))
    canvas.put(int(centre_x), y - 1, brass.frac(0.52))

    # The balance inside: a beam, a fulcrum, two pans.
    beam_y = y + height - 8
    canvas.hline(x + 3, beam_y, width - 6, brass.frac(0.60))
    canvas.vline(x + width // 2, beam_y, 5, brass.frac(0.44))
    for pan_x in (x + 3, x + width - 4):
        canvas.vline(pan_x, beam_y, 3, brass.frac(0.30))
        canvas.hline(pan_x - 1, beam_y + 3, 3, brass.frac(0.54))


def ledger_stack(
    canvas: IndexedCanvas, palette: Palette, x: int, y: int, width: int, count: int,
    board: Ramp, page: Ramp,
) -> None:
    """Squared ledgers. Not one of them out of line."""
    for index in range(count):
        top = y - index * 3
        canvas.rect(x, top, width, 3, board.frac(0.24))
        canvas.hline(x, top, width, board.frac(0.40))
        canvas.hline(x + 1, top + 1, width - 2, page.frac(0.74))   # page block
        canvas.put(x, top + 1, board.frac(0.16))


def pinned_card(
    canvas: IndexedCanvas, palette: Palette, x: int, y: int, width: int, height: int,
    paper: Ramp, rng,
) -> None:
    """A blank handwritten card. Doc 05 gives it the closes-at-four line.

    Blank, like every other sign in this game. Bright, because it is the
    thing a thorough player should want to click.
    """
    canvas.rect(x - 1, y - 1, width + 2, height + 2, palette.family("grey").at(2))
    canvas.rect(x, y, width, height, paper.at(paper.count - 2))
    # Two faint ruled lines, so it reads as written on without being read.
    canvas.hline(x + 1, y + height // 3, width - 3, paper.frac(0.52))
    canvas.hline(x + 1, y + 2 * height // 3, width - 4, paper.frac(0.56))
    canvas.put(x + width // 2, y - 1, palette.family("grey").at(10))
