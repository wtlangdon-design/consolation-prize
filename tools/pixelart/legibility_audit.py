"""Every composed room, audited against Thad. Rulings 16, 17c and 18.

The sample geometry lives HERE, in one reviewable place, with a note on each
rectangle saying why it is where it is. Ruling 18b rule 3: the rectangles
are part of the check, not incidental to it, and getting them right is the
work. Two of them were wrong when they lived scattered across per-room proof
scripts, and both produced confident wrong answers.

Each room also declares its light sources. Overlaps are detected rather than
remembered.
"""

from __future__ import annotations

import room01_stage_road
import room03_nugget
import room05_assay
from legibility import LightZone, Surface, anchors, audit
from palette import Palette
from street_scene import DAY, compose

# ---------------------------------------------------------------------------
# ROOM 1 -- stage road, night. The verge sample used to contain Hob's lamp.
# ---------------------------------------------------------------------------
ROOM_01_LIGHTS = [
    LightZone("Hob's lamp", room01_stage_road.LAMP[0], room01_stage_road.LAMP[1] + 4, 30),
    LightZone("coach lantern", room01_stage_road.COACH_X - 16, room01_stage_road.ROAD_Y - 4, 20),
    LightZone("town glow", 24, room01_stage_road.HORIZON + 6, 44),
]
ROOM_01 = [
    # All three road bands sampled at x230-310 ONLY.
    #
    # Full width, every band fell inside the falloff of at least one of the
    # three sources -- Hob's lamp at x88, the coach lantern at x198, the town
    # glow at x24. A road lit by a lamp is not a uniform surface, and the part
    # of it worth measuring is the part the lamp is not doing the work in.
    Surface("road, near", (230, 122, 80, 22), "Near band, right of the coach lantern's reach."),
    Surface("road, mid", (230, 108, 80, 14), "Mid band, same window."),
    Surface("road, far", (230, 96, 80, 12), "Far band, same window."),
    Surface("verge", (128, 64, 48, 26),
            "x128-176. Clear of BOTH lamps: Hob's at x88 and the coach lantern "
            "at x198, whose 20px falloff the previous x140-200 rectangle sat "
            "inside. The full-width version contained Hob's lamp and reported "
            "the verge at 203, nearly costing the lamp its status as the "
            "uniquely brightest object in the only night exterior in the game.",
            behind_head=False),
]

# ---------------------------------------------------------------------------
# ROOM 2 -- Main Street, day. Never had a per-surface audit until now.
# ---------------------------------------------------------------------------
ROOM_02_LIGHTS: list[LightZone] = []          # exterior daylight, no point sources
ROOM_02 = [
    Surface("mud, near", (20, 126, 280, 16), "Near band, clear of the trough at x214-254."),
    Surface("mud, mid", (20, 106, 160, 14), "Mid band, left of the trough."),
    Surface("mud, far", (20, 90, 280, 12), "Far band, below the boardwalk lip."),
    Surface("boardwalk deck", (10, 79, 300, 7), "The deck only, not the posts under it."),
    # The building band is SIX buildings at deliberately different tones, so
    # one rectangle across it is not a surface -- it measured a spread of 165
    # and reported a failure that belonged to no single wall. Sampled at the
    # two extremes instead, which is what a head actually stands against.
    Surface("facade, cream Company", (170, 34, 40, 26),
            "The pale Improvement Company frontage -- the lightest wall in the room."),
    Surface("facade, dark timber", (56, 36, 34, 24),
            "The darkest of the six frontages, left of the alley at x96."),
]

# ---------------------------------------------------------------------------
# ROOM 3 -- the Nugget. Candles and a window.
# ---------------------------------------------------------------------------
ROOM_03_LIGHTS = [
    LightZone("chandelier", 150, 54, 40),
    LightZone("window", 23, 46, 26),
    LightZone("stove door", 114, 70, 16),
    LightZone("bar lamps", 268, 80, 30),
]
ROOM_03 = [
    Surface("back wall", (100, 60, 60, 14),
            "Between the stove (x106-122 ends y82) and the stairs (x166+). "
            "Narrow on purpose: this wall has furniture on most of it."),
    Surface("bar front", (222, 100, 90, 12), "Below the counter top, above the foot rail."),
    Surface("bar top", (222, 90, 90, 3),
            "Rows 90-92 only. Row 93 is the counter's own dark lip and its "
            "inclusion previously reported a failure on a surface that was fine."),
    Surface("floor, near", (150, 126, 140, 16), "Near mud, clear of the spittoon at x196."),
    Surface("floor, mid", (60, 104, 80, 14), "Mid floor, left of the tables."),
    Surface("floor, far", (120, 84, 40, 10), "Far floor, between stove and stairs."),
]

# ---------------------------------------------------------------------------
# ROOM 5 -- the Assay Office. Two samples here were contaminated.
# ---------------------------------------------------------------------------
ROOM_05_LIGHTS = [
    LightZone("window", 250, 51, 34),
    LightZone("stove door", 37, 108, 14),
]
ROOM_05 = [
    Surface("back wall", (100, 72, 120, 6),
            "The strip below the shelf banks and above the counter. Six rows is "
            "all the bare wall there is."),
    Surface("counter top", (155, 90, 75, 3),
            "Rows 90-92, right of the ledgers at x132-154 and under the grille "
            "rather than through it."),
    Surface("counter front", (60, 97, 170, 13), "Panelled front, above the foot line."),
    Surface("shelf bank", (100, 28, 70, 46), "The tall case, which is one material."),
    Surface("floor, near", (60, 122, 200, 18), "Near plank floor."),
    Surface("floor, mid", (100, 79, 80, 9),
            "Behind the counter, LEFT of the service grille at x186-214. The "
            "full-width version sat on the grille and reported two failures."),
]


def main() -> None:
    palette = Palette.load()
    dark, light = anchors(palette)

    rooms = [
        ("ROOM 1 -- stage road, night", room01_stage_road.compose()[0], ROOM_01, ROOM_01_LIGHTS),
        ("ROOM 2 -- Main Street, day", compose(DAY)[0], ROOM_02, ROOM_02_LIGHTS),
        ("ROOM 3 -- the Bountiful Nugget", room03_nugget.compose()[0], ROOM_03, ROOM_03_LIGHTS),
        ("ROOM 5 -- the Assay Office", room05_assay.compose()[0], ROOM_05, ROOM_05_LIGHTS),
    ]

    total_fail = total_weak = 0
    for name, canvas, surfaces, lights in rooms:
        _, fails, weak = audit(canvas, palette, name, surfaces, lights, dark, light)
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
