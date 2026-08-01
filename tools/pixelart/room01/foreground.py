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

IT IS A PORCH POST, AND ERRATA 32d IS WHY. 32d amends 21a in as many words:
"the foreground plane must be a nameable object, not a mass — ours obey 21a
and are amorphous: a black scrub bank, a lumber pile." This plane was the
scrub bank 32d names. It was a 78-column torn diagonal with a randomised
broken top, which is neither nameable nor architectural, and it cost the
bottom-left corner 12 luminance across 1,600 px against a reference that has
a lit stony verge there — the single largest block difference in the whole
frame, and reported by `road` as "the foreground module's occluder, not my
verge."

So the black is CONCENTRATED rather than spread. One post, and everything
else in the corner handed back to road.md §4.3's verge, which measures
within a few luminance of the bar and was simply being painted over. 21a
still gets its near plane and its bottom-of-range; 32d gets an object with a
name.

TWICE, in fact. The concentration was written down and then only half done:
the post arrived and a pair of 71-column rails arrived with it, and the
corner went back to being a mass with a straight edge on it. See the note at
the constants below — they are gone, and the measurements that took them out
are recorded there.

ITS SILHOUETTE IS STRAIGHT AND VERTICAL, which is what makes it read as
four feet away. 21a asks only that it not be a horizontal band across the
frame, and a post cropped by the bottom edge is two hard verticals ending
inside the frame. A rounded hump reads as a hill in the middle distance.

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

#: AND IT IS TOO TALL, WHICH IS THE THING THAT WAS ACTUALLY WRONG WITH IT.
#:
#: Everything argued above is correct and the object it produced still read as
#: a fault: a black bar standing in the middle of the road, thirty-two rows
#: high, in the one part of the frame the lamp has lit. The reasoning optimised
#: the SILHOUETTE CONTRAST -- 39 luminance against the pool's left edge, the
#: best in the corner -- and a foreground plane's job is not to win a contrast
#: measurement. It is to sit in front of things without being looked at.
#:
#: A porch post four feet from the camera is cropped by the bottom of the frame
#: AND by the left of it. Ours was cropped only at the bottom, standing free in
#: open road with lit ground on both sides, which is not where a porch post can
#: be: there is no porch. Held to twelve rows it reads as the near end of the
#: yard's timber running out of frame, which is what the reference has in that
#: corner and what left_yard is already drawing the far end of.
#:
#: 21a still gets its near plane and its occlusion. 32d still gets a nameable
#: object. The road gets the twenty rows back.
POST_ROWS = 12

#: THE TWO RAILS ARE GONE, AND THAT IS THIS ROUND'S FIX.
#:
#: This module carried two 3 px members running from the left edge up to the
#: post -- 71 columns each, both at `void`, both at L 0 -- and the docstring
#: above describes something else entirely: "a post seven px wide and
#: forty-three tall, a deck lip thirty-four px long, and everything else in
#: the corner handed back to road.md §4.3's verge." The drawing had drifted
#: from its own stated intent by a factor of four, and the drift is the whole
#: defect: 32d's answer to "a black scrub bank" was concentration, and two
#: long diagonals spread across 420 px of the bottom-left corner is the scrub
#: bank again with a straight edge on it.
#:
#: Measured. The bar's bottom-left corner, x 0-59 / y 116-143, is a lit stony
#: verge: mean L 23.2, median 22.2, p10 13.0, and 0.8% of it under L 6 --
#: road.md §4.3's "shadowed verge under the building", which is a VALUE, not
#: an occluder. The composite with these two members in it measured mean
#: 14.7, p10 0.0 and 14.2% under L 6; with them out it measures 17.4, p10
#: 8.9 and NOTHING under L 6. The two rails were the whole of that gap. They
#: did not read as a rail either -- there is no post at the left edge for
#: them to run to and nothing behind them to be near, so at 1x they are two
#: black diagonals ruled across the corner.
#:
#: What 21a and 32d actually need survives without them. The post is still a
#: nameable object, still cropped by the bottom edge, still two hard
#: verticals ending inside the frame, and still read at 39 luminance of
#: silhouette against the pool's left edge -- which is the number this plane
#: exists for and the only place in the corner where it is available. What
#: goes is 420 px of black over ground the reference draws as ground.


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """Fills `canvas` -- a separate plane, pre-filled with the transparency key."""
    dark = ctx.ink("shadow_slot")
    rim = ctx.ink("horse_hide_shadow")

    post_x, post_y, post_w = POST

    post_h = min(POST_ROWS, layout.HEIGHT - post_y)
    post_top = layout.HEIGHT - post_h

    canvas.rect(post_x, post_top, post_w, post_h, dark)
    # One pixel of umber's floor around the standing edges -- 21b's rule, a
    # family floor rather than void, so the object has an edge rather than
    # being a hole cut in the picture.
    canvas.hline(post_x, post_top, post_w, rim)
    canvas.vline(post_x, post_top, post_h, rim)
    canvas.vline(post_x + post_w - 1, post_top, post_h, rim)
