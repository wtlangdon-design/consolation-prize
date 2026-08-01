"""Room 1 — the sky. GRAYBOX.

Nineteen rows of open night over a far range, thinning to five where the
range is highest. It is the first thing anyone sees in the game and it is
almost entirely still.

WHAT THIS FILE IS. A block-in from sky.md's measured anchors: the correct
three-segment gradient, the correct cut against the range, and a star field
at the correct density profile. It is NOT finished art. Everything marked
DEFERRED below names the spec section that replaces it.

WHY THE GRADIENT IS THREE SEGMENTS AND NOT A RAMP. sky.md §3 fitted both:
a power law scores rms 1.11 and a straight line 1.48 against a per-row noise
floor of 1.55, so the exponent is not doing real work and the line is drawn
straight. What the three segments buy is the *dither budget* -- rows 0-16
get no dither at all, because the reference crosses accent_indigo[0]'s
luminance at y≈17 and there is nothing to gain above that row. Seventeen
rows of one flat colour is the quietest surface in the game and §6.3 of the
whole-frame study says the calm is what makes everything below read as
worked: 14.8% of the frame reads flat and essentially all of it is here.

WHY THE STARS THIN TOWARD THE HORIZON. Every instinct says a star field
thickens where the sky meets the land. Measured (sky.md §5) it is SIX TIMES
thinner there, and there is not one star below y=38. That single number is
the most characterful measurement in the region; drawing stars into the
horizon band destroys the glow the ranges are silhouetted against.

WHY NO STAR IS AS BRIGHT AS THE LAMP. The reference's brightest sky pixel is
the exact colour of Hob's lantern, one pixel of it at (249, 3). Errata 18b
protects the lamp's status as the uniquely brightest object in the only
night exterior in the game, so the field is capped one step down at
umber[14] -- layout's `star_bright`. sky.md §6.2 flags this as a deliberate
departure from the bar and it is one somebody decided, not one that happened.

TWO PLACES sky.md AND THE LOCKED PALETTE NOW DISAGREE, both resolved by
layout:

  §4 offers `accent_indigo[2]` for faint stars. That index is 239, the first
  entry of the puddles' reserved band as of today's re-pointing. Faint stars
  are `dust[1]` (layout's `star_faint`) and the sky never touches step 2 of
  its own family -- layout §5 says in as many words that the whole safety of
  the new puddle band rests on exactly that.

  §5 asks for about one star in twenty to be cool, at `sky[0..1]`. layout's
  three star materials are all warm and the material table is the contract,
  so the field is warm throughout here. The cool minority is a decision for
  whoever finishes this region, and it is cheap to add: one extra material.

DEFERRED to the region author:
  - the twelve measured bright-star positions are placed; the remaining
    hundred-odd are generated to §5's density profile rather than measured.
  - blue-noise spacing is enforced as a hard minimum of 2 px (§5's measured
    floor) by dart-throwing. §5 asks for Poisson-disc, whose median
    nearest-neighbour spacing is 5.39 px against a Poisson field's 4.19.
  - the smoke plume at x 40-44, y 32-47 belongs to `town` (§7) and is not
    drawn here.
"""

from __future__ import annotations

from canvas import IndexedCanvas
from dither import BAYER4

from . import layout


#: sky.md §5. The twelve stars at L >= 96 are what a player actually sees;
#: the other hundred-odd are texture. Measured positions, and worth placing
#: deliberately rather than generating -- note how they are spread, one in
#: each rough sixth of the width, one high and one low in each.
BRIGHT = ((4, 1), (15, 22), (34, 19), (75, 25), (138, 14), (139, 34),
          (164, 9), (181, 17), (249, 3), (287, 1), (287, 23), (311, 35))

#: sky.md §5, stars per 1000 sky px in six-row bands from the top of frame.
#: 22.9 at the top against 3.7 at row 36-41 -- the 6:1 fall, tabulated.
DENSITY = (22.9, 14.1, 13.0, 8.9, 11.0, 8.6, 3.7)

#: §5: "none at all below y 38". Not "few". None.
STAR_FLOOR = 38

#: §5: 119 stars clear +15 luminance and survive quantisation into the locked
#: palette. That is the number that matters for drawing; the 151 and the 74
#: quoted elsewhere are the same field at different thresholds.
STAR_COUNT = 119

#: §5: no two star pixels are adjacent anywhere in the frame.
MIN_SPACING = 2


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    body = ctx.ink("night_sky")
    horizon = ctx.ink("night_sky_horizon")

    flat_to = layout.SKY_FLAT_TO
    ramp_from, ramp_to = layout.SKY_RAMP_ROWS

    for x in range(layout.WIDTH):
        # The sky owns the cut and the range fills below it (sky.md §7). One
        # row of full sky, the next row of full mountain -- the bar shows a
        # single blended row at every mountain edge and it is a resampling
        # artefact, not an edge anybody drew.
        cut = layout.far_crest(x)
        for y in range(min(cut, layout.HEIGHT)):
            if y <= flat_to:
                canvas.put(x, y, body)
            elif y < ramp_to:
                # §5: ordered 4x4, density rising about one sixteenth per row,
                # 1/16 at row 17 to 15/16 at row 31. Fifteen rows, seventeen
                # levels -- very nearly one level per row, which is why 4x4 is
                # the right matrix and 8x8 reads as a textured stratum.
                density = (y - flat_to) / (ramp_to - flat_to)
                canvas.put(x, y, horizon if BAYER4.threshold(x, y) < density else body)
            else:
                # §3: the plateau is only reached where the range is low. On
                # the left massif the skyline sits above row 32 and the sky is
                # cut off mid-ramp, so the left summits separate about 3.5
                # luminance less strongly than the centre-right ones. That is
                # correct. Do not even it out.
                canvas.put(x, y, horizon)

    _stars(canvas, ctx)


def _stars(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """A warm field on a short discrete ladder, thinning toward the horizon."""
    rng = ctx.stream("sky.stars")
    taken: set[tuple[int, int]] = set()

    def free(x: int, y: int) -> bool:
        if not 0 <= x < layout.WIDTH or not 0 <= y <= STAR_FLOOR:
            return False
        # §6.11 and range.md §7.11: a star on a silhouette is the single most
        # visible way to destroy the depth read. Measured: none, down to y=36.
        if y >= layout.far_crest(x):
            return False
        for dy in range(-MIN_SPACING, MIN_SPACING + 1):
            for dx in range(-MIN_SPACING, MIN_SPACING + 1):
                if (x + dx, y + dy) in taken:
                    return False
        return True

    for x, y in BRIGHT:
        if free(x, y):
            taken.add((x, y))
            canvas.put(x, y, ctx.ink("star_bright"))

    # §5: a short, discrete brightness ladder, not a continuous range -- the
    # reference has 11 stars sharing one exact colour, 21 another, 8 a third.
    # Five or six steps is right; three materials and one offset gives four.
    ladder = (("star_bright", 0),) * 6 + (("star_mid", 1),) * 21 \
        + (("star_mid", 0),) * 29 + (("star_faint", 0),) * 63

    weights = [(band, DENSITY[band]) for band in range(len(DENSITY))]
    total = sum(weight for _, weight in weights)
    placed = 0
    for attempt in range(20000):
        if placed >= STAR_COUNT - len(BRIGHT):
            break
        pick = rng.random() * total
        band = 0
        for index, (_, weight) in enumerate(weights):
            pick -= weight
            if pick <= 0:
                band = index
                break
        y = band * 6 + rng.randrange(6)
        x = rng.randrange(layout.WIDTH)
        if not free(x, y):
            continue
        taken.add((x, y))
        material, offset = ladder[placed % len(ladder)]
        # §5: every star is ONE PIXEL. The 2x2 footprints in the bar are
        # resampling; verified against image A, where a star spans 1.25-1.75
        # of A's internal pixels and about 1.0 of ours.
        canvas.put(x, y, ctx.ink(material, offset))
        placed += 1
