"""Room 1 — the left yard: timber, the sign, the fence, two wheels. GRAYBOX.

The frame's LEFT REPOUSSOIR, and its job is structural before it is
descriptive. The picture opens to the right — town, road, coach, light — and
everything in this region leans against that and holds the eye in. Half the
rect is below L 25, and the lamp pool at bottom right is only impressive
because of what sits beside it.

THE REGION IS A MONOTONIC LEFT-TO-RIGHT VALUE RAMP, and left_yard.md §1
gives it as a table: mean L climbs 21.1 → 50.0 across eleven column bands,
and the max row matters more than the mean row. NOTHING IN THE LEFTMOST 24
COLUMNS EXCEEDS L 59. NOTHING IN THE LEFTMOST 32 EXCEEDS L 80. All 69 pixels
above L 110 live at x >= 76. §7.8 is the warning that goes with it: every
instinct while working at 8× on a bright monitor says the timber is
unreadably dark and needs a rim light. It does not. Its readability comes
from the stepped moonlit caps and the lit right edge at x 23-24, and from
nothing else, and adding value here flattens the ramp holding the whole
composition.

TIMBER IS NOT ONE FAMILY (§4). Distant and shaded timber is
`pine_weathered`; lit near timber is `pine_fresh`; the signboard is `umber`
and `mud` upper steps. THE FAMILY CARRIES THE PLANE, THE STEP CARRIES THE
LIGHT. Painting all the wood out of one ramp flattens the depth immediately.

AND THERE IS ONLY ONE `ochre` IN THE REGION AND IT IS FIRE. §4: ochre 8 and
13 appear in exactly three places — the lantern, the pool it throws, and the
town's windows. A rail or a rim in ochre 8 reads as a light source at native
size, which is §7.11.

THE OBJECTS ARE HIGHLIGHTS, NOT BOXES. §2.12 and §7.12: the crates, barrel,
plank and keg are each a 1-px lit top edge over a near-black body. Given
side planes, hoops and staves they become six small objects competing at
L 30-45 in the region's darkest quarter, and the wheel — the shape that
actually matters down there — disappears among them.

TWO BOUNDARY FACTS THIS FILE HONOURS AND DOES NOT DRAW:

  The man's lantern. left_yard.md §8 claims it ("authored once, here, and
  must not be duplicated next door"); hob.md §2 items 12-16 also specify it,
  down to the flame's reserved-band pixel budget, and adds the constraint
  that it must be drawn AFTER the lighting pass. layout settles it by
  filing every LANTERN_* anchor under hob.md §2, so it is drawn in `hob` and
  not here. The seam contract §8 describes still holds — there is exactly
  one lantern and it straddles x=87.

  The puddles. §2.17 puts four small cool clusters in this rect at `sky` 3.
  Standing water is the `puddles` cycling element now and `road` owns every
  pixel of it; the two nearest clusters are inside the road's own bounds.

DEFERRED to the region author:
  - the lettering is drawn as §6's ELEVEN MARKS on their 3.45 px rhythm —
    the round/stem alternation and the pitch — and not as glyphs. §6 says
    set the marks first and only then decide what each glyph's pixels are.
    Line 2 is a texture row and must never become legible.
  - §2.9's pole seams are regular here; measured they are every 3-4 px with
    the lit faces reaching L 33-40 and the seams dropping to 13-17.
  - §6's ±1 px hand-cut wobble on the board's edges. The board is IRREGULAR,
    not TILTED (§7.3), and only one of those is correctable later.
  - §2.13's wheel disc: scattered warm pixels among near-black, with no
    angular periodicity at any radius. Drawn flat here.
"""

from __future__ import annotations

from canvas import IndexedCanvas
from primitives import arc, ellipse_outline

from . import layout


#: §2.9. A three-tread staircase, not a slope. (top row, x from, x to).
TREADS = ((42, 4, 9), (45, 11, 14), (46, 15, 24))

#: §6. Eleven capitals across 38 px at 3.45 px pitch — about three pixels
#: wide by six tall with roughly half the letter pairs touching. What the
#: reader gets is a RHYTHM: round shapes at 1, 2, 5 and 10 (C O O O), a
#: single stem at 9 (I), a centre stem at 8 (T), paired stems at 3 and 11
#: (N N). At 1× the word is recognised by silhouette and length.
GLYPH_RHYTHM = ("round", "round", "stems", "s", "round", "l", "a",
                "centre", "stem", "round", "stems")
GLYPH_PITCH = 3.45


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    # SIX TAGGED OBJECTS, and the grouping is the answer to errata 32a's
    # actual question: does the composition read as a row of things on one
    # baseline? The beam, the chains, the board and its lamp are ONE HANGING
    # SIGN -- §5's occlusion order has them interpenetrating and the sign
    # does not exist without the beam it hangs from. Likewise the crates,
    # barrel, plank and keg are one heap, which is how §2.12 measures them.
    with ctx.track(canvas, "timber yard"):
        _timber(canvas, ctx)
    _shadow_slot(canvas, ctx)
    with ctx.track(canvas, "hanging sign"):
        _gantry(canvas, ctx)
        _signboard(canvas, ctx)
        _gantry_lamp(canvas, ctx)
    with ctx.track(canvas, "corral panel"):
        _corral(canvas, ctx)
    with ctx.track(canvas, "sign post"):
        _sign_post(canvas, ctx)
    with ctx.track(canvas, "crate stack"):
        _clutter(canvas, ctx)
    with ctx.track(canvas, "wheel pair"):
        _wheels(canvas, ctx)


# ---------------------------------------------------------------------------


def _timber(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.9. The region's anchor, almost entirely one value band."""
    body = ctx.ink("timber_body")
    seam = ctx.ink("timber_far")
    cap = ctx.ink("timber_cap")
    x0, y0, width, height = layout.TIMBER_MASS

    for top, left, right in TREADS:
        canvas.rect(left, top, right - left + 1, y0 + height - top, body)
        # §5: one moonlit cap per tread, and they are what separates the
        # timber silhouette from the ridge behind it — which is only
        # 5-10 L points away. One pixel each, and load-bearing.
        canvas.hline(left, top, right - left + 1, cap)
    canvas.rect(x0, 55, width, y0 + height - 55, body)

    # Vertical pole seams. The mass is a stack of poles seen end-on and
    # the seams are the only interior information it gets.
    for x in range(x0, x0 + width, 4):
        canvas.vline(x, 55, y0 + height - 55, seam)
    # §2.9's near-horizontal pale runs. Image A carries a wire X-brace
    # across this face; at 320×144 it does not survive (§7.7) and two
    # clean diagonals would be the only diagonal lines in the region.
    for rail_y in (70, 84, 89):
        canvas.hline(x0, rail_y, width - 1, cap)
    # §2.9's lit right edge: a warm 1-px vertical, and what keeps the
    # mass from bleeding into the shadow slot beside it.
    canvas.vline(x0 + width - 1, 60, 29, ctx.ink("sign_letter", 2))

    # §2.9's lower posts and crate, x 0-10, y 96-122.
    canvas.rect(0, 96, 11, 26, ctx.ink("timber_far"))
    canvas.hline(0, 96, 11, ctx.ink("timber_body"))
    canvas.vline(4, 96, 26, ctx.ink("shadow_slot"))


def _shadow_slot(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.10 and §7.9. The darkest pixels in the region, and the reason the
    signboard reads at all.

    Columns 28-29 fall to L 1.4. It will look like a hole. If it comes up to
    L 20 "so the timber's edge shows", the board's left end loses forty
    luminance points of separation and starts to look glued to the lumber.
    """
    x0, y0, width, height = layout.SHADOW_SLOT
    canvas.rect(x0, y0, width, height, ctx.ink("timber_far", -1))
    canvas.rect(x0 + 3, y0, 2, height, ctx.ink("shadow_slot"))


def _gantry(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.5 and §2.6. Three rows of beam, and three one-pixel hangers.

    The hangers are the entire mechanism by which the sign and the lamp read
    as suspended. §7.4: at 2 px they become posts and the sign stops hanging.
    """
    x0, y0, width, _ = layout.GANTRY_BEAM
    canvas.hline(x0, y0, width, ctx.ink("timber_far"))
    canvas.hline(x0, y0 + 1, width, ctx.ink("sign_board", -4))
    canvas.hline(x0, y0 + 2, width, ctx.ink("sign_board", -5))
    # §2.5: its junction with the timber falls away as a short diagonal.
    canvas.line(24, 54, 29, 61, ctx.ink("timber_far"))

    for x, material in ((layout.SIGN_CHAIN_LEFT, "shadow_slot"),
                        (layout.SIGN_CHAIN_RIGHT, "timber_far"),
                        (layout.LANTERN_HOOK, "timber_body")):
        canvas.vline(x, 57, 5, ctx.ink(material))
    canvas.vline(layout.SIGN_CHAIN_RIGHT + 1, 57, 5, ctx.ink("timber_far"))


def _signboard(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.7 and §3. The highest local contrast in the whole frame.

    The board is NOT FLAT: it carries a lateral gradient of about +13 L from
    its left sixth to its right end, because the lantern hangs off that end.
    The letters ride that ramp; they do not sit on an even field, and flat
    black letters on a flat board would be the same drawing with all the age
    taken out.
    """
    face_x, face_y, face_w, face_h = layout.SIGN_BOARD_FACE
    for column in range(face_w):
        # Six steps of umber across 43 columns is the measured +13 L.
        offset = -2 + int(3 * column / face_w)
        canvas.vline(face_x + column, face_y, face_h, ctx.ink("sign_board", offset))
    # §5: the top of the board is a continuous pale run at L 69-95, and
    # it is one of only three hard edges in the region.
    canvas.hline(face_x, face_y, face_w, ctx.ink("sign_board_lit"))
    canvas.hline(face_x + 24, face_y, face_w - 24, ctx.ink("sign_board_lit", 1))
    # §6: a plank seam between the two lines, running brighter than the
    # field either side. It is the board's construction showing, not a rule.
    canvas.hline(face_x, face_y + 9, face_w, ctx.ink("sign_board", 1))
    # §5: the board's RIGHT end is a hard edge, L 74.6 to 18.3 in one
    # pixel; its LEFT end ramps instead, which is what stops the board
    # looking pasted on.
    canvas.vline(face_x - 1, face_y + 1, face_h - 1, ctx.ink("sign_board", -4))

    _lettering(canvas, ctx)


def _lettering(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§6. Draw the word, not the letters.

    Eleven marks on their rhythm, one-pixel stems, half the pairs touching.
    §7.1: the instinct on the one piece of type in the frame is to make sure
    the player can read it, and widening, spacing or squaring the glyphs
    turns a weathered painted board into a signpost decal. The player is
    TOLD what it says by being able to LOOK at it.
    """
    ink = ctx.ink("sign_letter")
    x0, y0, _, height = layout.SIGN_LINE_1
    for position, shape in enumerate(GLYPH_RHYTHM):
        left = x0 + int(round(position * GLYPH_PITCH))
        if shape == "round":
            canvas.outline(left, y0, 3, height, ink)
        elif shape == "stems":
            canvas.vline(left, y0, height, ink)
            canvas.vline(left + 2, y0, height, ink)
            canvas.line(left, y0, left + 2, y0 + height - 1, ink)
        elif shape == "stem":
            canvas.vline(left + 1, y0, height, ink)
        elif shape == "centre":
            canvas.hline(left, y0, 3, ink)
            canvas.vline(left + 1, y0, height, ink)
        elif shape == "l":
            canvas.vline(left, y0, height, ink)
            canvas.hline(left, y0 + height - 1, 3, ink)
        elif shape == "a":
            canvas.vline(left, y0 + 1, height - 1, ink)
            canvas.vline(left + 2, y0 + 1, height - 1, ink)
            canvas.hline(left, y0, 3, ink)
            canvas.hline(left, y0 + 3, 3, ink)
        else:
            canvas.hline(left, y0, 3, ink)
            canvas.hline(left, y0 + height // 2, 3, ink)
            canvas.hline(left, y0 + height - 1, 3, ink)
            canvas.vline(left, y0, height // 2, ink)
            canvas.vline(left + 2, y0 + height // 2, height // 2, ink)

    # §6 and §7.2: "2 MILES" is 4 px tall and 20 px wide and it is SUPPOSED
    # to be a smudge. A shorter, fainter row of ticks under the main word,
    # never legible, and it must not be made legible.
    lx, ly, lwidth, lheight = layout.SIGN_LINE_2
    faint = ctx.ink("sign_letter", 1)
    for position in range(7):
        canvas.vline(lx + int(round(position * 2.9)), ly, lheight, faint)
    canvas.hline(lx, ly + lheight - 1, lwidth, faint)


def _gantry_lamp(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.8 and §7.10. Twelve pixels of ochre 13, and NO GROUND POOL.

    Its influence dies within about four pixels: it lights the board's right
    end and stops. Giving it a pool puts two light sources in the left third
    and destroys the reason the road brightens to the right. hob.md §7 adds
    the harder constraint — it must sit below Hob's lamp and must never
    reach the reserved accent_gold band.
    """
    x0, y0, width, height = layout.GANTRY_LAMP
    core_x, core_y = layout.GANTRY_LAMP_CORE
    canvas.rect(x0, y0, width, height, ctx.ink("timber_far"))
    canvas.rect(core_x - 1, core_y - 2, 4, 6, ctx.ink("lit_window_bright"))
    canvas.rect(core_x, core_y - 1, 2, 4, ctx.ink("lit_window_hot"))
    canvas.hline(x0, y0, width, ctx.ink("timber_body"))
    # The one thing it does light: the board's right end, x 74-76 at y 66-68,
    # which jumps to L 75-85 and nothing beyond.
    canvas.rect(71, 66, 3, 3, ctx.ink("sign_board_lit", 1))
    ctx.shield_rect(x0, y0, width, height)


def _corral(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.4 and §7.13. Four rails, each a single lit pixel row, and a post.

    THE PANEL IS TWELVE PIXELS LONG and stops dead at the capped post at
    x 70-72. Running it on to the region edge fills the space the lantern
    pool needs. There is no rail body at this size — a rail IS its lit edge,
    and two-pixel rails at 4-px pitch alias into a striped block at integer
    upscale.
    """
    for index, rail_y in enumerate(layout.CORRAL_RAIL_ROWS):
        # Measured means 32.7 / 48.9 / 36.7 / 27.8 — the second rail is
        # the bright one, and they are not a ladder of equal lights.
        offset = (-1, 2, 0, -2)[index]
        canvas.hline(57, rail_y, 12, ctx.ink("weathered_rail", offset))
        canvas.hline(57, rail_y + 1, 12, ctx.ink("timber_far", -1))
    px, py, pwidth, pheight = layout.CORRAL_POST
    canvas.rect(px, py, pwidth, pheight, ctx.ink("timber_body"))
    canvas.vline(px + pwidth - 1, py, pheight, ctx.ink("post_mid"))
    canvas.hline(px, py, pwidth, ctx.ink("timber_cap"))


def _sign_post(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.11 and §7.14. Seven pixels across, split hard, and never softened.

    It stays at L 22-26 all the way down while the ground behind it climbs
    from 25 to 61, so it silhouettes hardest from y≈100 down. That unbroken
    dark vertical crossing the lit road is the region's strongest depth cue.
    It is SHIELDED from the lighting pass for exactly that reason: letting
    the lamp wrap around it removes it, and the pool's own left cut is at
    x 58-62, one pixel away.
    """
    x0, y0, width, height = layout.SIGN_POST
    canvas.rect(x0, y0, width, height, ctx.ink("timber_far"))
    canvas.rect(x0 + 1, y0, 2, height, ctx.ink("shadow_slot"))
    canvas.rect(x0 + 3, y0, 2, height, ctx.ink("timber_body"))
    canvas.rect(x0 + 5, y0, 2, height, ctx.ink("post_mid"))
    # §2.11: its foot dissolves into the dark foreground around y 118-120; it
    # does not get a base.
    ctx.shield_rect(x0, y0, width, height)


def _clutter(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.12. Five objects, and each one is a lit top edge with dark under it."""
    boxes = (
        ("upper crate", layout.CRATE_UPPER, 2),
        ("lower crate", layout.CRATE_LOWER, 0),
        ("open barrel", layout.OPEN_BARREL, -1),
        ("plank lid", layout.PLANK_LID, 3),
        ("small keg", layout.SMALL_KEG, 1),
    )
    for _name, (x0, y0, width, height), lift in boxes:
        canvas.rect(x0, y0, width, height, ctx.ink("timber_far", -1))
        canvas.hline(x0, y0, width, ctx.ink("timber_cap", lift))
        ctx.shield_rect(x0, y0, width, height)


def _wheels(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.13 and §7.5-6. Two wheels, and neither is drawn as a wheel.

    The far one exists ONLY as a cool 1-px tyre arc down its outer left. It
    is the only evidence there are two, and drawing it properly puts two
    competing circles in a 16-pixel span. The near one is a warm rim over a
    dark disc: measured on rings at radius 4-8 the interior has standard
    deviation 13-17 and NO ANGULAR PERIODICITY, so a clean spoked hub
    produces a bicycle wheel and a moiré at integer scaling — a mechanically
    regular object in the darkest corner of the frame, which drags the eye
    straight to it.
    """
    far_x, far_y, far_r, _ = layout.WAGON_WHEEL_FAR
    # The outer left only, x 12-21 against a centre at x=23. A predicate
    # rather than an angle range, because a quadrant test is exact at
    # integer resolution and an angle test rounds and nicks the ends.
    arc(canvas, far_x, far_y, far_r, far_r, ctx.ink("timber_cap", -1),
        lambda dx, dy: dx <= -2)

    near_x, near_y, near_rx, near_ry = layout.WAGON_WHEEL_NEAR
    for dy in range(-near_ry, near_ry + 1):
        for dx in range(-near_rx, near_rx + 1):
            if (dx / near_rx) ** 2 + (dy / near_ry) ** 2 > 1.0:
                continue
            canvas.put(near_x + dx, near_y + dy, ctx.ink("shadow_slot"))
    ellipse_outline(canvas, near_x, near_y, near_rx, near_ry, ctx.ink("post_mid"))
    ctx.shield_rect(near_x - near_rx, near_y - near_ry,
                    near_rx * 2 + 1, near_ry * 2 + 1)
