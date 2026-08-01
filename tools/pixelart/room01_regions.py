"""The parts of Room 1 that get their own author and their own critic.

One rect per region, in native 320x144 coordinates. A region is a piece of the
frame somebody is responsible for -- the regions overlap, deliberately, because
the seams between them are where composed pictures fail and a critic looking at
a crop that stops exactly where the next author's work starts will never see a
seam.

The rects are for LOOKING at. Nothing clips drawing to them: the coach's shadow
falls across the road and the lamp's light falls across everything, and a region
that owned its rectangle exclusively could not do either.
"""

from __future__ import annotations

from dataclasses import dataclass

WIDTH, HEIGHT = 320, 144


@dataclass(frozen=True)
class Region:
    #: Short slug. Names the module that draws it and the critic that judges it.
    id: str
    #: x, y, width, height in native pixels.
    rect: tuple[int, int, int, int]
    #: How much to magnify the crop for review. Small regions get more.
    zoom: int
    #: What the critic is being asked to look at, in one line.
    brief: str


REGIONS: tuple[Region, ...] = (
    Region(
        "sky",
        (0, 0, 320, 48),
        4,
        "Night sky: the gradient, the star field, and the top of the far range.",
    ),
    Region(
        "range",
        (0, 20, 320, 40),
        4,
        "The mountain ranges: how many layers, how they overlap, where they meet the town.",
    ),
    Region(
        "town",
        (60, 30, 120, 38),
        8,
        "Consolation downhill: the mass of buildings, the lit windows, the headframe.",
    ),
    Region(
        "left_yard",
        (0, 34, 88, 96),
        8,
        "The left third: the CONSOLATION 2 MILES sign, its gantry, the fence, the wagon "
        "wheel, the lumber and the barrels.",
    ),
    Region(
        "hob",
        (64, 56, 64, 64),
        10,
        "The man on the road and his lantern: the figure, the flame, and the pool of "
        "warm light he stands in.",
    ),
    Region(
        "rail",
        (104, 58, 68, 52),
        10,
        "The hitching rail, the crate on its post, the bench, the bucket -- the middle "
        "clutter between the lamp and the team.",
    ),
    Region(
        "team",
        (142, 54, 92, 58),
        8,
        "The horse team in harness: four animals, their heads, the traces running "
        "forward to the coach.",
    ),
    Region(
        "coach",
        (210, 32, 110, 80),
        8,
        "The stagecoach: body, boot, roof cargo, wheels, lamps, the driver up top and "
        "the man at the door.",
    ),
    Region(
        "road",
        (0, 94, 320, 50),
        4,
        "The road surface: the sweep of the ruts, the standing water, the stones, and "
        "how the light dies out across it.",
    ),
    Region(
        "full",
        (0, 0, 320, 144),
        4,
        "The whole frame, as a player first sees it.",
    ),
)

BY_ID = {region.id: region for region in REGIONS}

#: Everything except the whole-frame view. These are the ones with an author.
AUTHORED = tuple(region for region in REGIONS if region.id != "full")
