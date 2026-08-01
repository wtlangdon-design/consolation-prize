"""Room 1 — the near plane, drawn OVER the actor. Ruling 21a. GRAYBOX.

WHAT A FOREGROUND PLANE IS FOR. 21a's cited worst case is this room: eighty
per cent of the first screen anyone plays sat inside a 58-point band, a
quarter of the range available, with nothing below luminance 20 to speak of.
A near plane is out of the light BY DEFINITION, so the bottom of the range
arrives without touching one lit surface — no re-lighting, no re-running the
legibility audit, and no argument about whether a lit thing is too dark.

WHERE IT GOES, AND WHY THE REFERENCE AGREES. 21a asks for a corner rather
than a band, because a horizontal strip across the frame reproduces the
problem it exists to solve. The bottom LEFT, because the right of this frame
is the coach, the team, the road east and every legibility sample. And the
reference independently puts its darkest ground exactly there: road.md §4.3
measures a third, independent falloff at x 0-70, y 118-144 sitting 10 to 27 L
below the light model — "the shadowed verge under the building" — and
left_yard.md §2.18 gives x 0-60, y 116-129 to foreground rubble and grass at
mean L 22.8. This plane is those two, taken down to their floor.

ONE HONEST DISCREPANCY. The reference's bottom-left corner is L 14-24; this
plane is `void` and `umber[0]`, L 0-9. The reference does not have a near
plane out of the light at all — its darkest large pool is the TOP OF THE
SKY, 1,382 px at y 0-8, and our locked palette cannot go there: sky.md §4
records that `accent_indigo[0]` at L 21.65 is the floor for a saturated
night blue, that reaching L 9 needs a 53% black checker across the top of
the frame, and that it was tested and looks like a fault. So the frame's
black has to come from somewhere else, and 21a already says where. The gap
is recorded rather than split, because a plane at L 18 would satisfy neither
document.

ITS SILHOUETTE IS A DIAGONAL WITH A BROKEN TOP. A rounded hump reads as a
hill in the middle distance rather than as something four feet from the
camera, and a flat top is the horizontal band 21a forbids.

IT IS THE LAST THING DRAWN and it is drawn onto its OWN canvas, keyed on
index 255. It cannot travel in the background PNG, because the engine draws
the actor on top of that; it needs its own image with holes in it. Index 255
is one of the palette's five duplicate blacks and nothing composes with it,
which is what makes it safe as a key.

DEFERRED to the region author:
  - the scrub standing off the brow is drawn as spikes at a fixed rhythm.
    road.md §7 wants the stones in it read as 1 px pale top edges over
    two-value bodies at saturation 0.20; here they are silhouette only.
  - left_yard.md §2.18's grass at `pine_green[0]` is not present; the whole
    plane is two values.
"""

from __future__ import annotations

from canvas import IndexedCanvas

from . import layout


#: canvas.save_rgba's key. An index nothing composes with is an index nothing
#: can lose to a key.
TRANSPARENT = 255

#: road.md §4.3's wedge, which is what this plane occupies. It reaches
#: further right at the bottom of frame than at the top, because that is what
#: a near plane cropping a corner does.
REACH = 78
BROW_TOP = 121
BROW_BOTTOM = layout.HEIGHT


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """Fills `canvas` -- a separate plane, pre-filled with the transparency key."""
    dark = ctx.ink("shadow_slot")
    rim = ctx.ink("horse_hide_shadow")
    rng = ctx.stream("foreground.brow")

    brow: list[int] = []
    for x in range(REACH):
        walk = x / REACH
        # A diagonal, and the quadratic is what keeps it from being a ramp:
        # high and near-vertical at the frame edge, falling away to nothing.
        top = BROW_TOP + int((BROW_BOTTOM - BROW_TOP) * walk * walk)
        brow.append(min(layout.HEIGHT, top))

    # Scrub standing off the brow: spikes, not lumps. At this size a sage
    # bush is a few vertical strokes of different length, and a lump reads as
    # a boulder in the middle distance.
    for _ in range(14):
        x = rng.randrange(2, REACH - 4)
        height = 3 + rng.randrange(0, 7)
        for offset in range(-2, 3):
            column = x + offset
            if not 0 <= column < REACH:
                continue
            spike = height - abs(offset) * 2 - rng.randrange(0, 3)
            if spike > 0:
                brow[column] = max(0, min(brow[column], brow[column] - spike))

    for x in range(REACH):
        top = brow[x]
        canvas.vline(x, top, layout.HEIGHT - top, dark)
        # One pixel of umber's floor along the top edge, so the mass has an
        # edge rather than being a hole cut in the picture.
        canvas.put(x, top, rim)
