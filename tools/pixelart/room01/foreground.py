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

IT IS A BOARDWALK EDGE AND A PORCH POST, AND ERRATA 32d IS WHY. 32d amends
21a in as many words: "the foreground plane must be a nameable object, not a
mass — ours obey 21a and are amorphous: a black scrub bank, a lumber pile."
This plane was the scrub bank 32d names. It was a 78-column torn diagonal
with a randomised broken top, which is neither nameable nor architectural,
and it cost the bottom-left corner 12 luminance across 1,600 px against a
reference that has a lit stony verge there — the single largest block
difference in the whole frame, and reported by `road` as "the foreground
module's occluder, not my verge."

So the black is CONCENTRATED rather than spread. A post seven px wide and
forty-three tall, a deck lip thirty-four px long, and everything else in the
corner handed back to road.md §4.3's verge, which measures within a few
luminance of the bar and was simply being painted over. 21a still gets its
near plane and its bottom-of-range; 32d gets an object with a name; 32e gets
its 40 px scale anchor, which nothing else in this frame supplies.

ITS SILHOUETTE IS STRAIGHT AND VERTICAL, which is what makes it read as
four feet away. 21a asks only that it not be a horizontal band across the
frame, and a post cropped by the bottom edge with a deck running off the
left edge is two hard verticals and one hard horizontal that both end inside
the frame. A rounded hump reads as a hill in the middle distance.

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

#: WHERE IT STANDS, AND WHY IT IS NOT IN THE CORNER.
#:
#: A near plane is only a depth cue if something is visible BEHIND it, and
#: the bottom-left corner of this frame is the one place where nothing is:
#: measured on the composite with this plane suppressed, the backdrop over
#: y 100-143 runs L 15-21 from x=0 to x=35 and does not clear 25 until x=52.
#: A near-black object there is a black shape on a black shape -- exactly the
#: "two neighbouring objects at the same value with no separation between
#: them" this pass exists to catch, and the first build of this plane put its
#: post at x 3-9, directly on left_yard's timber mass at the same value.
#:
#: The backdrop climbs steeply after that -- 32 at x=56, 43 at x=64, 53 at
#: x=72 -- because that is the lantern pool's left edge. So the post stands
#: at x 63-70, where a plane at L 4 is read against ground at L 43 and the
#: silhouette is worth 39 luminance instead of 3. That is what a foreground
#: plane is for; a corner it disappears into is not.
POST = (63, 112, 8)

#: The rail it carries, cropped by the left edge. Two members, running up to
#: the left because a rail seen from four feet away in a frame whose horizon
#: is at y=82 does exactly that. §21a: the silhouette must not be horizontal,
#: and these are the only two long diagonals in the composition.
#:
#: They pass BELOW left_yard's wagon wheels, whose lowest tyre pixel is at
#: y=114: left_yard.md §7.6 makes the far wheel's arc "the only evidence
#: there are two wheels", and a near plane that crops it deletes the object
#: it stands in front of.
RAIL_UPPER = (122, 136, 3)     # y at x=0, y at the post, thickness
RAIL_LOWER = (134, layout.HEIGHT - 1, 3)


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """Fills `canvas` -- a separate plane, pre-filled with the transparency key."""
    dark = ctx.ink("shadow_slot")
    rim = ctx.ink("horse_hide_shadow")

    post_x, post_y, post_w = POST

    for left_y, right_y, thick in (RAIL_UPPER, RAIL_LOWER):
        for x in range(0, post_x + post_w):
            walk = x / float(post_x + post_w - 1)
            top = int(round(left_y + (right_y - left_y) * walk))
            if top >= layout.HEIGHT:
                continue
            canvas.vline(x, top, min(thick, layout.HEIGHT - top), dark)
            # One pixel of umber's floor along the upper edge -- 21b's rule,
            # a family floor rather than void, so the member has an edge
            # rather than being a hole cut in the picture. The lower edge is
            # left to the silhouette: a rail lit from above has one.
            canvas.put(x, top, rim)

    canvas.rect(post_x, post_y, post_w, layout.HEIGHT - post_y, dark)
    canvas.hline(post_x, post_y, post_w, rim)
    canvas.vline(post_x, post_y, layout.HEIGHT - post_y, rim)
    canvas.vline(post_x + post_w - 1, post_y, layout.HEIGHT - post_y, rim)
