"""Room 1 — the stagecoach. GRAYBOX.

The largest single object in the frame, about 91 × 68 px, structurally the
most complex thing in the game so far, and the second thing the eye reaches
after the lantern. coach.md notes that this one region alone uses all 54
palette indices the whole 320×144 frame uses, which is a reason to draw it
early and let the rest of the room calibrate against it.

THE BODY IS NOT SEPARATED FROM THE SKY BY VALUE. §3.1: sky behind the roof
means 26.0, cargo means 36.7 — ELEVEN LUMINANCE POINTS. All the silhouette
work is done by exactly two features, both tiny: one row of ROOF RAIL at
L 47-82, and an 8 × 5 BLACK TRUNK at L 2-16 bitten out of the skyline. One
pale line above, one black notch inside. §10.4 — raise the body's value to
make it "read better" and you get a coach-shaped grey slab, you flatten the
sky the sky region worked to keep at ten indices, and the rail stops being a
line and becomes a bevel.

THE HORIZONTAL BANDING IS THE STRUCTURE (§3.2), and it survives at any size:

    cargo 31-36 → RAIL 46.8 → deck 26-31 → CORNICE SHADOW 16.9 →
    moulding 31.0 → upper panel 21-35 → WINDOW BAND 13.5-19.4 →
    the event band (lamps, faces, neckcloth) → lower panels 20-33 →
    UNDERCARRIAGE SHADOW 16-19 → wheels over road 21-27

Light, dark, mid, dark, the bright events, mid, dark. Six alternations in
forty rows. §3.2: get this ladder right in graybox and the coach is legible
before a single texture pixel is laid — which is precisely what this file is
for.

THE RAIL'S FALLOFF IS THE LIGHT DIRECTION (§5.5). It is NOT flat: L 82 at
x 239-240 down to 26 at x=279, 56 points across 41 pixels. That gradient,
plus the rear quarter panel at Lmed 12.1 against the front quarter's 31.1,
is the entire statement that the warm key comes from the LEFT — from the
lantern and the town. Draw the rail at a constant value and the coach loses
its light source.

TWO KEYS, TWO TEMPERATURES, TWO DIRECTIONS. The warm key is from the left.
The COOL key is from up and to the right, and it is the rear wheel rim's
30°-60° peak, the fence and the road ruts. Both must survive. §10.11: drift
warm and the wheels stop separating from the road; drift cool and the coach
stops being wood.

THE WHEELS ARE DRAWN TO DIFFERENT RULES, and §5.1 calls this the single most
misdrawn thing in the region. The rear one IS a wheel: two-pixel rim,
brightest upper-right, twelve one-pixel spokes at Δ24 L — not full contrast,
and broken, resolving only outside radius 5. THE FRONT ONE IS NOT A WHEEL.
It is an arc of eight to ten lit pixels in the 90°-190° sector and nothing
else; its right half is simply absent, lost into the undercarriage. And it
reads only because of a hard dark column immediately inside it at x=228 —
rim at 45-60 against shadow at 9-15, A 40-POINT DROP ACROSS ONE PIXEL.
Draw the arc without the dark column and it becomes a scratch.

THE LAMPS ARE BINDING (§7). Both coach lamps top out at `ochre[13]` and
STOP THERE. Three pixels for lamp A, two for lamp B, one ring of `ochre[8]`,
one transitional ring, then straight into the doorway's void. No bloom on
the surrounding panels — the reference throws none. And no cycling: design
invariant 9 forbids motion that conveys information, and these sit on an
object that departs, so animating them would make the coach's state readable
as motion. `accent_gold` does not appear in this region at all.

THE COACH IS AN OBJECT STATE, NOT BACKGROUND ART (§8, errata 31d). Two seams
this file must not break: the 4-pixel gap of unobstructed moonlit road at
x 222-225 between the nearest horse's rear and the front wheel's arc, which
is the reason the coach and the team can be separate layers at all; and the
strongbox's top edge, which currently has only road behind it.

DEFERRED to the region author:
  - §2.4's boot: the lit top edge and lit left corner are here, the strap
    banding at ~6 L contrast and the single buckle pixel's neighbours are not.
  - §2.23-24's figures are blocked as masses with the correct bright-head /
    near-black-hat pairing and the correct temperature split, but the
    driver's three-pixel moustache and the neckcloth's exact 5 × 8 shape are
    not drawn.
  - §5.2: there is no dither anywhere in this region and none is used here,
    but the gradation the reference gets from 208 distinct colours in a
    110 × 80 area is blocked as flat steps.
  - §2.13d's gold scroll is a 2-3 px lighter smudge and is omitted entirely
    rather than approximated.
"""

from __future__ import annotations

import math

from canvas import IndexedCanvas
from primitives import arc, ellipse_outline

from . import layout


#: §2.17. L 82 at x 239-240 falling monotonically to 26 at x=279.
RAIL_LEFT_L, RAIL_RIGHT_L = 82.0, 26.0

#: §5.1. Twelve spokes at ~30° pitch, one pixel wide, and they only
#: physically separate outside r≈5 — inside that the pitch is under 2.5 px
#: and the reference LETS THEM MERGE rather than fighting it.
SPOKES = 12
SPOKE_INNER = 5.0


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    if not ctx.with_coach:
        return
    # ONE TAGGED OBJECT. A stagecoach is a stagecoach; tagging its boot, its
    # door and its wheels separately would answer errata 32a's question about
    # a vehicle instead of about the composition.
    with ctx.track(canvas, "the coach"):
        _behind(canvas, ctx)
        _shell(canvas, ctx)
        _roof(canvas, ctx)
        _figures_upper(canvas, ctx)
        _running_gear(canvas, ctx)
        _figures_lower(canvas, ctx)
    ctx.shield_rect(210, 32, 110, 76)


# ---------------------------------------------------------------------------


def _behind(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.2-3. Two faint rails and a stack that must never become kegs.

    §10.14: the keg stack's whole range is L 13-32, entirely BELOW the coach
    body's median. In image A it is a pyramid of round barrel ends; at
    320×144 not one keg resolves. It is warm-brown texture at the frame edge
    and it must stay there.
    """
    fx, fy, fwidth, fheight = layout.COACH_FENCE
    canvas.hline(fx, fy + 4, fwidth, ctx.ink("coach_body", 1))
    canvas.hline(fx, fy + 8, fwidth, ctx.ink("coach_body"))
    canvas.vline(fx + 9, fy + 4, fheight - 4, ctx.ink("coach_body_rear", 2))

    kx, ky, kwidth, kheight = layout.COACH_KEGS
    canvas.rect(kx, ky, kwidth, kheight, ctx.ink("coach_body_rear", 3))
    for row in range(ky, ky + kheight, 6):
        canvas.hline(kx, row, kwidth, ctx.ink("coach_body_rear", 4))


def _shell(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    body = ctx.ink("coach_body")
    rear = ctx.ink("coach_body_rear")
    dark = ctx.ink("coach_void")

    bx, by, bwidth, bheight = layout.COACH_BOOT
    canvas.rect(bx, by, bwidth, bheight, ctx.ink("coach_body_rear", 2))
    canvas.hline(bx + 3, by + 1, bwidth - 6, ctx.ink("coach_roof_rail", -4))
    canvas.vline(bx + 4, by + 3, bheight - 6, ctx.ink("coach_body", 2))
    # §2.4: one brass buckle, A SINGLE PIXEL, and that is the whole strap set.
    canvas.put(*layout.COACH_BUCKLE, ctx.ink("brass"))
    sx, sy, swidth, _ = layout.COACH_BOOT_SHELF
    canvas.hline(sx, sy, swidth, ctx.ink("coach_body", 1))

    rx, ry, rwidth, rheight = layout.COACH_REAR_QUARTER
    canvas.rect(rx, ry, rwidth, rheight, rear)

    ux, uy, uwidth, uheight = layout.COACH_UPPER_PANEL
    canvas.rect(ux, uy, uwidth, uheight, body)
    wx, wy, wwidth, wheight = layout.COACH_WINDOW_BAND
    canvas.rect(wx, wy, wwidth, wheight, ctx.ink("coach_body", -2))
    # §2.7's rows climb 31.0 → 21.5 → 25.8 → 31.2 → 35.1; the body is a dark
    # red-brown mahogany and its rows are not a ramp.
    canvas.hline(ux, uy + 4, uwidth, ctx.ink("coach_body", 2))

    fx, fy, fwidth, fheight = layout.COACH_FRONT_QUARTER
    # §2.9: a dark recess with a dead-black column at its left. It is NOT a
    # glazed window -- there is no frame, no glass event, nothing but a hole.
    canvas.rect(fx, fy, fwidth, fheight, ctx.ink("coach_body_rear", 1))
    canvas.vline(fx, fy, fheight, dark)
    px, py, pwidth, pheight = layout.COACH_DOOR_PILLAR
    canvas.rect(px, py, pwidth, pheight, ctx.ink("coach_body", 1))

    # §3.4 and §2.11. Lmed 2.6, sixty per cent `void`, left edge DEAD
    # VERTICAL for 22 unbroken rows. A 26-point drop across one pixel, held —
    # the single most valuable line in the region after the rail, and it goes
    # in before any of the door's ornament.
    dx, dy, dwidth, dheight = layout.COACH_DOORWAY
    canvas.rect(dx, dy, dwidth, dheight, dark)
    _lamp(canvas, ctx, layout.COACH_LAMP_A, 3)

    lx, ly, lwidth, lheight = layout.COACH_DOOR_LEAF
    canvas.rect(lx, ly, lwidth, lheight, ctx.ink("coach_body", 1))
    gx, gy, gwidth, gheight = layout.COACH_DOOR_WINDOW
    # §2.13a: in image A this opening has a rounded top corner; at this size
    # it is a plain rectangle.
    canvas.rect(gx, gy, gwidth, gheight, ctx.ink("coach_body_rear"))
    canvas.vline(gx + 2, gy, gheight, dark)
    canvas.vline(gx + 3, gy, gheight, dark)
    _lamp(canvas, ctx, layout.COACH_LAMP_B, 2)
    # §2.13c: kick moulding and two studs.
    canvas.hline(lx + 3, ly + 18, 10, ctx.ink("coach_roof_rail", -3))
    canvas.put(lx + 5, ly + 20, ctx.ink("brass"))
    canvas.put(lx + 10, ly + 20, ctx.ink("brass"))

    # §2.8. One pixel wide, 23 rows, and the second most important vertical
    # in the region: the coach's leading edge taking the warm key from the
    # left. x=237 is a dimmer support beside it.
    cx, cy, _, cheight = layout.COACH_FRONT_POST
    canvas.vline(cx - 1, cy, cheight, ctx.ink("coach_body", 1))
    canvas.vline(cx, cy, cheight, ctx.ink("coach_roof_rail", -2))

    fbx, fby, fbwidth, fbheight = layout.COACH_FRONT_BOOT
    canvas.rect(fbx, fby, fbwidth, fbheight, ctx.ink("coach_body", 2))
    canvas.line(fbx + 2, fby + 10, fbx + 10, fby + 16, ctx.ink("coach_roof_rail", -4))


def _lamp(canvas: IndexedCanvas, ctx: layout.Ctx, at: tuple[int, int],
          core: int) -> None:
    """§7.3. Two ramp steps, one ring, nothing beyond, and no bloom.

    The reference ties these to the carried lantern on peak value and lets
    the lantern win on area alone. Our palette can do better and §7.2 says it
    should: the lantern spends the reserved `accent_gold` band and these stop
    at `ochre[13]`, opening a gap of at least +9.9 L that the reference does
    not have. At 320×144 a two-pixel lamp the same value as the hero light
    reads as a second hero light.
    """
    x, y = at
    canvas.rect(x - 1, y - 1, core + 2, 3, ctx.ink("coach_lamp_ring"))
    canvas.rect(x, y, core, 1, ctx.ink("coach_lamp"))


def _roof(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    dx, dy, dwidth, dheight = layout.COACH_ROOF_DECK
    canvas.rect(dx, dy, dwidth, dheight, ctx.ink("coach_body", 2))
    sx, sy, swidth, _ = layout.COACH_CORNICE_SHADOW
    # The darkest horizontal in the upper body, one row tall, running the
    # full width. It is what makes the roof sit ON the body instead of
    # floating (§2.15).
    canvas.hline(sx, sy, swidth, ctx.ink("coach_body_rear", 1))
    mx, my, mwidth, _ = layout.COACH_BELT_MOULDING
    canvas.hline(mx, my, mwidth, ctx.ink("coach_body", 3))

    cx, cy, cwidth, cheight = layout.COACH_CARGO
    canvas.rect(cx, cy + 1, cwidth, cheight - 1, ctx.ink("coach_cargo"))
    # §2.18: the top edge undulates, y=44 at the crest and y=49 at the
    # troughs, and `accent_indigo[0]` shows THROUGH the gaps between lashed
    # bundles. That is the one place a background family belongs inside the
    # object silhouette, and it is why the cargo's top edge reads as lumpy
    # rather than as a solid.
    for x in range(cx, cx + cwidth):
        crest = 44 + (0 if 265 <= x <= 271 else 1 + (x % 7 == 0) + (x % 11 == 0))
        canvas.vline(x, crest, 49 - crest, ctx.ink("coach_cargo", 1))
    canvas.rect(cx, cy + 1, 13, 6, ctx.ink("coach_cargo", 2))

    # §2.18b. Eight by five, L 2-16, sitting directly against a sky of 20-21.
    # A NEGATIVE SHAPE bitten out of the skyline, doing half the silhouette
    # work for the whole coach. §10.6: it looks like a hole because it is one.
    tx, ty, twidth, theight = layout.COACH_BLACK_TRUNK
    canvas.rect(tx, ty, twidth, theight, ctx.ink("coach_void"))

    # The rail goes on LAST of the roof group, over the cargo, because it is
    # a single row and any cargo drawn over it breaks the line (§2's draw
    # order note).
    rx, ry, rwidth, _ = layout.COACH_ROOF_RAIL
    ramp = ctx.ramp("coach_roof_rail")
    palette = ctx.palette
    for column in range(rwidth):
        target = RAIL_LEFT_L + (RAIL_RIGHT_L - RAIL_LEFT_L) * column / (rwidth - 1)
        best, gap = 0, None
        for step in range(ramp.count):
            distance = abs(palette.luminance(ramp.at(step)) - target)
            if gap is None or distance < gap:
                best, gap = step, distance
        canvas.put(rx + column, ry, ramp.at(best))
    # §2.17: a partial second bright row at y=48, x 260-277, where a lashed
    # bundle behind it catches the same light.
    canvas.hline(260, ry - 1, 18, ctx.ink("coach_roof_rail", -3))


def _figures_upper(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.23. The driver — the ONLY figure in the region read against the sky.

    His warm silhouette starts at y=43 and everything above is sky. Below the
    waist the warm coat over cool trousers is what keeps his legs off the
    coach, and §3.6 says taking the temperature split out dissolves both men
    into the vehicle at 2× viewing distance.
    """
    x0, y0, width, height = layout.COACH_DRIVER
    canvas.rect(x0 + 10, y0, 10, 4, ctx.ink("coach_void"))       # hat crown
    canvas.hline(x0 + 10, y0 + 3, 10, ctx.ink("coach_void"))     # brim
    fx, fy, fwidth, fheight = layout.COACH_DRIVER_FACE
    canvas.rect(fx, fy, fwidth, fheight, ctx.ink("brass", 2))
    canvas.put(fx + 2, fy + 1, ctx.ink("coach_lamp"))
    canvas.rect(x0 + 10, y0 + 8, 11, 8, ctx.ink("coach_cargo", 2))   # warm coat
    canvas.rect(x0 + 1, y0 + 15, 11, 10, ctx.ink("coach_iron", -1))  # cool trousers
    canvas.rect(x0, y0 + 23, 8, 5, ctx.ink("coach_void"))            # boots
    # §2.23: hands on the reins, two clusters, and the traces' last three
    # pixels are the only bright part of their whole run.
    canvas.rect(x0 + 4, y0 + 14, 4, 2, ctx.ink("brass", 1))
    canvas.rect(x0 + 10, y0 + 14, 4, 2, ctx.ink("brass", 1))


def _running_gear(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    iron = ctx.ink("coach_iron")
    dark = ctx.ink("coach_void")

    # §2.20 first as a mass: the undercarriage shadow band at y 81-83.
    canvas.rect(238, 81, 46, 3, ctx.ink("coach_body_rear"))

    cx, cy, rx, ry = layout.COACH_REAR_WHEEL
    centre_x, centre_y = int(cx), int(cy)
    for dy in range(-int(ry), int(ry) + 1):
        for dx in range(-int(rx), int(rx) + 1):
            if (dx / rx) ** 2 + (dy / ry) ** 2 <= 1.0:
                canvas.put(centre_x + dx, centre_y + dy, ctx.ink("coach_body_rear", 1))
    # §5.1: spokes at Δ24 L against the disc, NOT full contrast, and broken.
    # §10.2 — drawn cleanly they read as a pinwheel, and a radial pattern at
    # 320×144 reads as MOTION, which invariant 9 forbids on a static object.
    spoke = ctx.ink("coach_iron", 1)
    for index in range(SPOKES):
        angle = math.tau * index / SPOKES
        for radius in range(int(SPOKE_INNER), int(rx)):
            if (index + radius) % 3 == 0:
                continue
            canvas.put(centre_x + int(round(math.cos(angle) * radius)),
                       centre_y + int(round(math.sin(angle) * radius * ry / rx)),
                       spoke)
    # §5.1's rim: two pixels thick, peaking at 55-60 across the 30°-60°
    # sector (upper right) and bottoming at 29 on the left. The cool key
    # comes from up and to the right and the rim is its clearest statement.
    for inset in (0, 1):
        ellipse_outline(canvas, centre_x, centre_y, int(rx) - inset,
                        int(ry) - inset, iron)
    arc(canvas, centre_x, centre_y, int(rx), int(ry), ctx.ink("coach_roof_rail", -2),
        lambda dx, dy: dy < 0 and dx > 0)
    canvas.rect(centre_x - 1, centre_y - 1, 3, 3, ctx.ink("coach_iron", 1))
    canvas.hline(centre_x + 3, centre_y, 13, iron)             # §2.19d, the axle

    # §5.1. NOT A WHEEL. The 90°-190° sector only, eight to ten pixels, and
    # its right half is simply absent.
    fx, fy, frx, fry = layout.COACH_FRONT_WHEEL
    arc(canvas, fx, fy, frx, fry, ctx.ink("coach_roof_rail", -3),
        lambda dx, dy: dx <= 0)
    sx, sy, swidth, sheight = layout.COACH_FRONT_WHEEL_SHADOW
    canvas.rect(sx, sy, swidth, sheight, dark)

    # §2.21: a broken lit diagonal, stepping down as it runs right.
    bx, by, bwidth, _ = layout.COACH_STEP_BOARD
    canvas.hline(bx, by, 9, ctx.ink("coach_roof_rail", -3))
    canvas.hline(bx + 8, by + 1, 7, ctx.ink("coach_roof_rail", -3))

    # §9. The only two contact darkenings on this road. There is no
    # coach-shaped cast shadow (§6): measured, the road under the coach is
    # BRIGHTER than the road to its right, because the depth gradient wins
    # over the object.
    ax, ay, awidth, aheight = layout.COACH_REAR_CONTACT
    canvas.rect(ax, ay, awidth, aheight, ctx.ink("coach_body_rear"))
    px, py, pwidth, pheight = layout.COACH_FRONT_CONTACT
    canvas.rect(px, py, pwidth, pheight, ctx.ink("coach_body_rear", 1))


def _figures_lower(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.24. The standing man goes on AFTER the wheels — his legs cross the
    front wheel's right edge at x 237-240.

    Face and neckcloth together are a 5 × 8 mass at p50 46.3 against a coat
    at 30.5 and a doorway at 2.6. It is the brightest sustained area of the
    coach and where the eye lands after the lantern. §10.10: eyes at this
    size produce a skull.
    """
    x0, y0, width, height = layout.COACH_STANDING_MAN
    canvas.rect(x0 + 4, y0, 8, 4, ctx.ink("coach_void"))            # hat
    fx, fy, fwidth, fheight = layout.COACH_STANDING_FACE
    canvas.rect(fx, fy, fwidth, fheight - 3, ctx.ink("brass", 2))
    canvas.hline(fx, fy + 2, fwidth - 1, ctx.ink("coach_lamp"))
    canvas.rect(fx + 1, fy + 5, fwidth - 1, 3, ctx.ink("coach_lamp_ring"))  # neckcloth
    canvas.rect(x0 + 1, y0 + 12, 14, 18, ctx.ink("coach_iron", -1))  # cool coat
    canvas.rect(x0 + 3, y0 + 21, 10, 9, ctx.ink("coach_body_rear", 2))
    # §2.24: the raised right hand grips the door frame and crosses the
    # doorway's blackness. Three pixels, and it is what makes him half in
    # and half out.
    canvas.rect(x0 + 16, y0 + 9, 4, 3, ctx.ink("coach_lamp_ring"))
    canvas.rect(x0, y0 + 15, 2, 3, ctx.ink("brass", 1))

    # §2.25. Lit lid edge, flat face, ONE warm lock pixel.
    bx, by, bwidth, bheight = layout.COACH_STRONGBOX
    canvas.rect(bx, by, bwidth, bheight, ctx.ink("coach_body", 1))
    canvas.hline(bx, by, bwidth, ctx.ink("coach_roof_rail", -4))
    canvas.put(bx + 1, by, ctx.ink("coach_roof_rail", -1))
    canvas.put(bx + 3, by, ctx.ink("coach_roof_rail", -1))
    canvas.put(*layout.COACH_STRONGBOX_LOCK, ctx.ink("brass", -1))
