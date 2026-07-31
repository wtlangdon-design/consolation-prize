"""Every composed room, audited against Thad. Rulings 16, 17c and 18.

The sample geometry lives HERE, in one reviewable place, with a note on each
rectangle saying why it is where it is. Ruling 18b rule 3: the rectangles
are part of the check, not incidental to it, and getting them right is the
work. Two of them were wrong when they lived scattered across per-room proof
scripts, and both produced confident wrong answers.

Each room also declares its light sources as DRAWN extents. Overlaps are
detected rather than remembered.

WHERE A RECTANGLE GOES. A lit room is not one luminance. The Nugget's back
wall runs from 44 in the shadow behind the stairs to 107 where the window
shaft lands on it, and no single number describes it. So a surface that
spans lighting states is sampled at BOTH ENDS -- its darkest clean patch,
which is the worst case for Thad's coat and boots, and its lightest, which
is the worst case for his face. Sampling the middle would report a
comfortable average of two problems.

  `python3 legibility_audit.py --overlay` writes the sample geometry over
  each room to renders/, which is the only way to see that a rectangle has
  quietly landed on a chair.
"""

from __future__ import annotations

import sys

import room01_stage_road
import room03_nugget
import room05_assay
from legibility import LightZone, Surface, anchors, audit
from palette import Palette
from renders import RENDERS
from street_scene import DAY, compose

# ---------------------------------------------------------------------------
# ROOM 1 -- stage road, night. The verge sample used to contain Hob's lamp.
# ---------------------------------------------------------------------------
ROOM_01_LIGHTS = [
    # The watchman's lamp: hood, body and bail, x84-90 by y80-90.
    LightZone("Hob's lamp", (84, 80, 7, 11)),
    # Two pixels on the coach's near side. Small as a drawn object; its
    # illumination reaches much further, and that reach is not contamination.
    LightZone("coach lantern", (198, 93, 1, 2)),
    # The lit windows downhill, a scatter of 2x2 squares along one band.
    LightZone("town windows", (4, 58, 82, 4)),
]
ROOM_01 = [
    # All three road bands sampled at x230-310, away from the lamp.
    #
    # NOT because the lamp contaminates them -- under the drawn-extent model
    # it does not, and a road lit by a lamp is a road the player sees lit.
    # Because the unlit end of the road is the WORST CASE for his dark mass,
    # and ruling 18a is about the worst case. The lamp pool is the easy part
    # of this room; measuring it would report the easy part.
    Surface("road, near", (230, 122, 80, 22), "Near band, below the coach's wheels."),
    Surface("road, mid", (230, 108, 80, 14), "Mid band, same."),
    Surface("road, far", (270, 96, 50, 12),
            "Far band, RIGHT of the coach: at x230 this row ran through the "
            "near wheel, which is a sample of a wheel. It read the same either "
            "way -- eighty pixels of spokes did not move p10 or p90 -- which is "
            "the point. A rectangle on top of an object is not detectably wrong "
            "from its number, only from looking at it."),
    # The verge is now graded across its own height, dark at the hill base and
    # lifting toward the road, so it is not one number and one rectangle over
    # all 36 rows would average the two ends of a deliberate gradient. Split
    # where it matters: he walks on the ROAD, so a 26px head at the far edge
    # of it tops out at y74, and rows 74-90 are the only part of this band any
    # part of him is ever seen against.
    Surface("verge, behind his head", (128, 74, 48, 17),
            "x128-176, rows 74-90: the band a far-zone head stands against. "
            "Between the sign and the coach, and clear of the lamp -- the "
            "full-width version contained the lamp itself and reported the "
            "verge at 203, nearly costing the lamp its status as the uniquely "
            "brightest object in the only night exterior in the game."),
    Surface("verge, hill base", (128, 62, 48, 12),
            "The top of the band, which the grade deliberately takes down to "
            "0.20 of the grey ramp. Nothing stands in front of it -- the road "
            "is fourteen rows below -- so it is recorded, not governing.",
            behind_head=False),
]

# ---------------------------------------------------------------------------
# ROOM 2 -- Main Street, day. Never had a per-surface audit until now.
# ---------------------------------------------------------------------------
ROOM_02_LIGHTS: list[LightZone] = []          # exterior daylight, no point sources
ROOM_02 = [
    Surface("mud, near", (20, 126, 280, 16),
            "Near band, below the trough, which stands on the mud to y119."),
    Surface("mud, mid", (145, 104, 65, 14),
            "Between the hitching rail (x96-141) and the trough (x214-253). "
            "The full-width version ran through both."),
    Surface("mud, far", (20, 88, 280, 11),
            "Below the boardwalk lip and above the rail's feet at y100."),
    Surface("boardwalk deck", (170, 79, 41, 6),
            "The Company stretch, which doc 11 makes the one swept, empty run "
            "of walk on the street -- so it is the only place the deck can be "
            "measured as a deck. The full-width version ran through sacks, "
            "crates, lumber, three barrels, a rope coil and every awning post, "
            "and reported the deck as +21/+30 when it is +46/+63. One material "
            "the whole way across, so this stretch is representative."),
    # The building band is SIX buildings at deliberately different tones, so
    # one rectangle across it is not a surface -- it measured a spread of 165
    # and reported a failure that belonged to no single wall. Sampled at the
    # two extremes instead, which is what a head actually stands against.
    Surface("facade, cream Company", (170, 34, 40, 26),
            "The pale Improvement Company frontage -- the lightest wall in the "
            "room. Spans the clapboard AND its blinded window openings, and "
            "trips the spread warning for that reason: a head on the walk "
            "passes in front of both, and there is no version of this wall a "
            "player sees without its windows in it."),
    Surface("facade, dark timber", (66, 36, 26, 24),
            "The newspaper office, darkest of the six frontages, in shadow "
            "under its own awning. Starts at x66, not x56: the alley at x58-63 "
            "is a gap between two buildings and was pulling p10 down to 18."),
]

# ---------------------------------------------------------------------------
# ROOM 3 -- the Nugget. Every rectangle here was wrong.
# ---------------------------------------------------------------------------
# Four of six surfaces were reported contaminated and the room could not be
# judged at all. Two causes, and the light zones were only the smaller one.
#
#   The zones over-claimed. A circle around a 59x28 chandelier also covers
#   thirty rows of bare wall beneath it. Now rectangles, and the chandelier
#   is declared as the two parts it is actually drawn in.
#
#   The rectangles themselves were worse, and nothing was flagging it. The
#   old "back wall" sat on the stove and the coat hooks AND straddled the
#   dado line; "floor, mid" sat on a table and two chairs; "floor, far" sat
#   on a chair; "floor, near" sat on the spittoon its own note claimed to
#   avoid; "bar top" ran along rows 90-92 while the counter's top edge rises
#   from y96 to y90 across its length, so the left two thirds of it measured
#   the wall BEHIND the bar. That last one was reporting a FAIL.
ROOM_03_LIGHTS = [
    LightZone("chandelier rod", (150, 28, 1, 17)),
    LightZone("chandelier rings and candles", (121, 38, 59, 17)),
    LightZone("window", (10, 34, 26, 24)),
    LightZone("stove door", (111, 67, 6, 5)),
]
ROOM_03 = [
    # The wall he stands against is the DADO, not the boards: it runs from
    # y62 to the floor at y82, and a head tops out at y56 at the very back of
    # the far zone and lower everywhere else. Sampled at both lighting ends.
    Surface("back wall dado, shadowed", (151, 64, 15, 18),
            "Between the coat hooks (rail ends x150) and the staircase (x166). "
            "The darkest stretch of wall he can stand in front of."),
    Surface("back wall dado, in the shaft", (86, 64, 20, 18),
            "Between the door (ends x85) and the stove (x106), where the "
            "window shaft lands. The lightest stretch. Its dust motes are the "
            "only emissive pixels in it and they are too sparse to reach p90."),
    Surface("back wall boards", (60, 28, 26, 8),
            "Above the door frame, whose lintel occupies y36-37. The only bare "
            "upper wall wider than four pixels left of the chandelier -- the "
            "rest of it is door, handbill, stove, portrait, hooks, stairs. "
            "Above head height at every depth zone, so it is recorded rather "
            "than governing.",
            behind_head=False),
    Surface("bar top", (285, 91, 35, 3),
            "The near end only. The counter's top edge rises 6px across its "
            "length, so a rectangle spanning the whole bar cannot stay on it: "
            "the old x222-311 version left the slab entirely by mid-length and "
            "measured the room behind it, which is what produced the FAIL. "
            "Rows 91-93 stay inside the slab across x285-319 and stop above "
            "the counter's own dark front lip."),
    Surface("bar front", (222, 100, 90, 12),
            "The fielded panel, below the lip and above the foot rail, both of "
            "which are trim rather than surface."),
    Surface("floor, far in the shaft", (110, 84, 18, 11),
            "Where the window shaft first meets the floor. The lightest floor."),
    Surface("floor, mid", (150, 104, 41, 14),
            "Right of the tables, left of the bar, above the spittoon at "
            "x191-209."),
    Surface("floor, near", (216, 126, 85, 16),
            "Below the bar's foot rail, right of the spittoon. The darkest "
            "floor in the room and the worst case for his boots."),
]

# ---------------------------------------------------------------------------
# ROOM 5 -- the Assay Office. Two samples here were contaminated.
# ---------------------------------------------------------------------------
ROOM_05_LIGHTS = [
    LightZone("window", room05_assay.WINDOW),
    LightZone("stove door", (34, 106, 6, 5)),
]
ROOM_05 = [
    Surface("back wall", (180, 21, 36, 17),
            "Above the short shelf bank, which starts at y40. The previous "
            "rectangle claimed the strip 'below the shelf banks and above the "
            "counter', and there is no such strip: the tall bank runs to y75 "
            "and the short one to y73, so rows 72-77 are four rows of shelf "
            "bottom and two of wall. It is bare wall here or nowhere.",
            behind_head=False),
    Surface("counter top", (155, 90, 75, 3),
            "Rows 90-92, right of the ledgers at x132-154 and under the grille "
            "rather than through it."),
    Surface("counter front", (60, 97, 170, 13), "Panelled front, above the foot line."),
    Surface("shelf bank", (100, 28, 70, 46),
            "The tall case. Not one material -- brass-capped amber vials in "
            "grey racks -- and sampled anyway, because it covers the wall from "
            "x98 to x217 and there is no bare part of it to prefer. This is "
            "what a head in the mid zone actually stands against."),
    Surface("floor, near", (60, 122, 130, 18),
            "Near plank floor, the floor he walks on. Stops at x189, left of "
            "the proud floorboard at x196-237."),
    Surface("floor, mid", (100, 79, 32, 6),
            "Behind the counter, above the ledger stacks at y85 and clear of "
            "the dome's foot at x76-99. Recorded, not governing: the counter "
            "runs x48-237 and he never stands behind it.",
            behind_head=False),
]


def rooms() -> list[tuple[str, str, object, list[Surface], list[LightZone]]]:
    return [
        ("ROOM 1 -- stage road, night", "room-01-stage-road",
         room01_stage_road.compose()[0], ROOM_01, ROOM_01_LIGHTS),
        ("ROOM 2 -- Main Street, day", "room-02-main-street",
         compose(DAY)[0], ROOM_02, ROOM_02_LIGHTS),
        ("ROOM 3 -- the Bountiful Nugget", "room-03-nugget",
         room03_nugget.compose()[0], ROOM_03, ROOM_03_LIGHTS),
        ("ROOM 5 -- the Assay Office", "room-05-assay-office",
         room05_assay.compose()[0], ROOM_05, ROOM_05_LIGHTS),
    ]


def overlay(palette: Palette) -> None:
    """Draw the declared geometry over each room and write it to renders/.

    A rectangle that has landed on a chair reads as a perfectly reasonable
    number. The only way to catch it is to look at where it is, so the
    geometry gets a render like everything else does.
    """
    bone = palette.family("bone")
    rust = palette.family("accent_rust")
    RENDERS.mkdir(parents=True, exist_ok=True)

    for title, slug, canvas, surfaces, lights in rooms():
        for zone in lights:
            x, y, w, h = zone.rect
            canvas.outline(x - zone.halo, y - zone.halo,
                           w + zone.halo * 2, h + zone.halo * 2, rust.frac(0.86))
        for surface in surfaces:
            x, y, w, h = surface.rect
            canvas.outline(x, y, w, h, bone.at(bone.count - 1))
        path = RENDERS / f"{slug}-samples@4x.png"
        canvas.save(path, palette, scale=4)
        print(f"wrote renders/{path.name}  ({title})")


def main() -> None:
    palette = Palette.load()

    if "--overlay" in sys.argv:
        overlay(palette)
        return

    dark, light = anchors(palette)
    total_fail = total_weak = 0
    for title, _, canvas, surfaces, lights in rooms():
        _, fails, weak = audit(canvas, palette, title, surfaces, lights, dark, light)
        total_fail += fails
        total_weak += weak
        print()

    print(f"ACROSS ALL ROOMS: {total_fail} failing surface(s), {total_weak} weak pass(es)")
    if total_weak:
        print("  A weak pass is not a failure. Ruling 18a: it is reviewed before it")
        print("  ships, because Room 1 shipped unplayable looking exactly like a")
        print("  strong pass.")
    raise SystemExit(1 if total_fail else 0)


if __name__ == "__main__":
    main()
