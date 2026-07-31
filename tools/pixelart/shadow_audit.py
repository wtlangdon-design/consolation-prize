"""Ruling 21b's check, over every composed room."""

from __future__ import annotations

import shadow
import room01_stage_road
import room03_nugget
import room05_assay
import room29_ridge
import title_screen
from palette import Palette
from street_scene import DAWN, DAY, compose


def main() -> None:
    palette = Palette.load()
    rooms = [
        ("Room 1 stage road", room01_stage_road.compose()[0]),
        ("Room 2 Main Street", compose(DAY)[0]),
        ("Room 3 the Nugget", room03_nugget.compose()[0]),
        ("Room 5 assay office", room05_assay.compose()[0]),
        ("Room 29 high ridge", room29_ridge.compose()[0]),
        ("Room 36 dawn", compose(DAWN)[0]),
        ("Title screen", title_screen.compose()[0]),
    ]
    stuck = shadow.audit(palette, rooms)
    print()
    print("  A room absent from the table has no pixel at that family's floor,")
    print("  which is the strongest result available: the surface never needed")
    print("  to go below it. Room 5's identity is bone and it is not listed.")
    raise SystemExit(1 if stuck else 0)


if __name__ == "__main__":
    main()
