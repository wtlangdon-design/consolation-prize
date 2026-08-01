"""Room 1 — the man on the road, and his lantern. GRAYBOX.

A man in a long coat holding a kerosene barn lantern out to his left, and
the pool of warm light he stands in. This is where the eye lands first and
it is the only warm light source the player is meant to walk toward.
Everything else warm in the frame — the town, the coach lamps, the sign's
lantern — is scenery. This one is a person holding a thing.

HE IS SEVENTEEN BY THIRTY-SIX PIXELS AND HE HAS NO CONTRAST ON ONE SIDE.
hob.md §3: his far contour runs L 16-29 against a backdrop of 33-45 — under
ten points, and it MELTS, deliberately. He does not read by silhouette. He
reads by three things and nothing else: the lit edge on his lamp side, the
face, and the black hole between his legs. §10.8 — somebody will read the
far contour as a legibility failure and "fix" it. It is the design.

THE LANTERN LIGHTS THE GROUND BEHIND HIM, NOT HIM, and that is the frame's
cleverest move. The whole-frame study §4 measures his bbox against its
surround at −0.3 L, Michelson 0.003: AS A REGION HE IS INVISIBLE. His coat
averages 26.4 against lit ground at 58.0 — a +31.6 silhouette separation,
the largest of any object in the picture — plus one top-value pixel on his
face. §7.5 of the study: the instinct in a rebuild is to point the lamp at
the character, and doing it lifts the coat, collapses the separation, and
dissolves the most important figure in the room while every individual
measurement still looks plausible.

WHICH IS WHY HE IS SHIELDED. layout's Ctx.shield exists for regions that
author their own lit values, and this is the case it was built for: his
lamp-side rim is drawn at `mud` 7-10 (L 49-66) and must STAY there while the
ground behind him climbs past 86. The pool is applied afterwards by
`lightpass` and it must not touch him.

THE POOL CENTRES ON THE LAMP, NOT ON THE MAN — (86, 107), fifteen pixels
left of his feet. §10.1: centre it on him and he appears to be glowing,
which is both wrong and much worse. That number lives in layout because
`road` and `left_yard` both have to agree with it across a seam.

THE FLAME IS THE RESERVED BAND AND IT IS SMALL. accent_gold 4-7 measure
L 136/156/181/204 against a frame maximum of 123 everywhere else, so the
band is genuinely the brightest thing in the palette and it MOVES. §7: size
is the only control we have over how loud it is. Twenty-two to twenty-eight
pixels, total, inside x 82-89 / y 85-90 — a forty-pixel flame pulls the eye
off the man it is supposed to introduce and the cycle reads as a fault
light. The hardware around it takes accent_gold 0-3, the same family one
band below the reserve, so the object holds together and only the flame
moves.

AND THERE IS ALMOST NO GLOW IN THE AIR. §4: the airborne halo is back to
backdrop ambient by r = 8-9, and above the hand there is nothing at all —
by y=77 the backdrop is already at L 29. The lamp throws its light DOWN. A
soft radial bloom around the lantern is the single easiest way to make this
region look wrong.

WHY THE FLAME IS DRAWN BEFORE THE LIGHTING PASS HERE. hob.md §2 says a
source is not a lit surface and must go on afterwards, and the old
compositor did exactly that. It is unnecessary now: layout.keep() makes the
lighting pass skip reserved indices outright, so the flame survives the pass
untouched wherever it is drawn, and drawing it in the region that owns it
beats drawing it in the compositor. The pass additionally refuses to lift
any pixel INTO the band, which is the other half of the same guarantee.

DEFERRED to the region author:
  - §3's seven-tier value ladder on the figure. Blocked here as five.
  - §8's six load-bearing single pixels — the far brim tip at (103,74) at
    L 4 against a lit near tip at L 46, the shirt collar, the brass patch,
    the two pixels of bare right hand, the coat's front opening, the bail —
    are all placed, but the face they sit around is a mass rather than the
    measured row-by-row read in §3.
  - §8's broken bands: the pool's value bands are 5-7 px solid runs near the
    core narrowing to 2-4 outside, with a 1-2 px mottle between neighbours.
    `lightpass` currently dithers instead.
"""

from __future__ import annotations

from canvas import IndexedCanvas

from . import layout


#: hob.md §7's pixel budget, calibrated against the reference's 22 top-value
#: globe pixels: 10-14 px at accent_gold 4, 6-8 at step 5, 3-5 at step 6,
#: 1-2 at step 7. (band position, x from, x to, y), painted in order so each
#: hotter band bites out of the one under it -- which is how a flame is
#: shaped and also how the counts come out at 14 / 6 / 5 / 1, twenty-six
#: pixels in all, inside x 83-88 and y 85-89.
FLAME = (
    (0, 84, 87, 85),
    (0, 83, 88, 86),
    (0, 83, 88, 87),
    (0, 83, 88, 88),
    (0, 84, 87, 89),
    (1, 84, 87, 86),
    (1, 84, 87, 87),
    (1, 84, 87, 88),
    (2, 85, 86, 86),
    (2, 85, 86, 87),
    (2, 85, 86, 88),
    (3, 86, 86, 87),
)


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    with ctx.track(canvas, "hob"):
        _figure(canvas, ctx)
        _lantern(canvas, ctx)
    # Everything he is made of is authored at its final value. §3's whole
    # point is that his coat sits 31.6 L BELOW the ground the lamp lit
    # behind him; a pass that lifts him removes the only thing making him
    # read. The lantern is shielded for the opposite reason -- it is a
    # source, and a source is not a lit surface.
    hx, hy, hwidth, hheight = layout.HOB
    ctx.shield_rect(hx, hy, hwidth, hheight + 1)
    ctx.shield_rect(82, 76, 10, 18)


def _figure(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    coat = ctx.ink("hob_coat")
    lit = ctx.ink("hob_coat_lit")
    black = ctx.ink("shadow_slot")

    # 10a-b. The brim is TEN PIXELS ON ONE ROW and it reads because its two
    # ends are 42 points apart -- the near tip lit to L 46, the far tip the
    # darkest pixel in the region. §10.13: a symmetric dark ellipse loses the
    # light direction the whole region is built on.
    cx, cy, cwidth, cheight = layout.HOB_HAT
    canvas.rect(cx + 2, cy, cwidth - 5, 2, black)
    canvas.hline(cx, cy + 2, cwidth, ctx.ink("hob_brim", -3))
    canvas.hline(cx, cy + 3, cwidth - 1, black)
    canvas.put(cx, cy + 2, ctx.ink("hob_brim"))
    canvas.put(cx + cwidth - 1, cy + 2, black)

    # 10c. Seven by six, five pixels at the top value, a moustache that is a
    # two-pixel darkening on one row, and eyes drawn by NOT drawing them --
    # they are the gap between the brim shadow and the cheek.
    fx, fy, fwidth, fheight = layout.HOB_FACE
    canvas.rect(fx, fy, fwidth, fheight, ctx.ink("hob_face", -4))
    canvas.rect(fx + 1, fy + 1, fwidth - 2, 2, ctx.ink("hob_face"))
    canvas.hline(fx + 1, fy + 2, 2, ctx.ink("hob_face", -6))
    canvas.rect(fx + 2, fy + 3, 2, 2, ctx.ink("hob_face", -2))
    # 10d. ONE pixel, the only cool-neutral on him. It sets the chin off the
    # coat; warm it and the head fuses to the body.
    canvas.put(98, 79, ctx.ink("hob_collar"))

    # 10e. Shoulders 12 px at y=80, widening to 17 by y=89.
    kx, ky, kwidth, kheight = layout.HOB_COAT
    for row in range(kheight):
        width = 12 + min(5, row)
        left = kx + (kwidth - width) // 2
        canvas.hline(left, ky + row, width, coat)
        # The lamp-side rim: the reading edge, and the only part of him with
        # 20-33 points of separation from the backdrop.
        canvas.put(left, ky + row, lit)
        canvas.put(left + 1, ky + row, ctx.ink("hob_coat_lit", -3))
    # 10f. One pixel wide for eight rows, flaring to three by the hem. The
    # only interior line on the coat, and what stops him reading as a bell.
    canvas.vline(layout.HOB_COAT_OPENING, 84, 8, black)
    canvas.rect(layout.HOB_COAT_OPENING - 1, 92, 3, 8, black)
    # 10g. One pixel of brass on an otherwise dead-dark shoulder, and the
    # only ornament he has.
    canvas.put(102, 82, ctx.ink("lamp_glass"))
    # 10h. Two pixels of bare right hand, eighteen rows below the face and on
    # the DARK side of him -- what tells the eye there is a second arm.
    canvas.rect(106, 90, 2, 1, ctx.ink("hob_face", 2))

    # 10i. Six pixels joining the man to the lamp. §10.11: miss them and the
    # lamp hangs in mid-air next to a man.
    sx, sy, swidth, sheight = layout.HOB_SLEEVE
    canvas.line(sx + swidth - 1 + ctx.swing, sy + sheight - 1,
                sx + ctx.swing, sy, lit)
    canvas.line(sx + swidth - 1 + ctx.swing, sy + sheight,
                sx + ctx.swing, sy + 1, ctx.ink("hob_coat_lit", -2))
    # 11. Bare skin ABOVE the lantern and slightly above the shoulder -- the
    # arm is out and a little up, not hanging.
    bx, by, bwidth, bheight = layout.HOB_HAND_BAIL
    canvas.rect(bx + ctx.swing, by, bwidth, bheight, ctx.ink("hob_face", -1))

    # 10j-k. Two legs with the LIT WEDGE between them, which is the single
    # most load-bearing structure in the region: five pixels of top-value
    # road at (99-102, 103) and (99, 104). §10.7 -- it is the first thing a
    # tidy silhouette pass fills in, and without it he is a sticker.
    lx, ly, lwidth, lheight = layout.HOB_LEGS
    wx, wy, wwidth, _ = layout.HOB_LIT_WEDGE
    canvas.rect(lx, ly, wx - lx, lheight - 1, coat)
    canvas.rect(wx + wwidth, ly, lx + lwidth - wx - wwidth, lheight - 1, coat)
    canvas.rect(lx - 1, ly + 3, wx - lx + 1, 4, black)
    canvas.rect(wx + wwidth, ly + 3, lx + lwidth - wx - wwidth + 1, 4, black)


def _lantern(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§4's construction, top to bottom, and §7's pixel budget for the flame."""
    swing = ctx.swing
    hardware = ctx.ink("lamp_hardware")
    glass = ctx.ink("lamp_glass")

    bx, by, bwidth, bheight = layout.LANTERN_BAIL
    canvas.rect(bx + swing, by, bwidth, bheight, hardware)
    hx, hy, hwidth, hheight = layout.LANTERN_HOOD
    canvas.rect(hx + swing, hy, hwidth, hheight, ctx.ink("lamp_hardware", -1))
    gx, gy, gwidth, gheight = layout.LANTERN_GLOBE
    canvas.rect(gx + swing, gy, gwidth, gheight, glass)
    px, py, pwidth, pheight = layout.LANTERN_BASE
    # §7: the base plate reaches y=92 in the reference and that row is
    # OUTSIDE the element's declared bounds, so it must be unreserved gold or
    # the bounds and the object disagree. It is hardware, not flame, so it
    # already is.
    canvas.rect(px + swing, py, pwidth, pheight, ctx.ink("lamp_hardware", -1))
    canvas.hline(px + swing, py, pwidth, hardware)

    band = layout.LAMP_BAND
    for position, left, right, y in FLAME:
        canvas.rect(left + swing, y, right - left + 1, 1, band[position])
