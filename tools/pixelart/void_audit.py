"""Errata 40's void measurement: how much true darkness a room actually has.

THE FOUR NUMBERS AND ONE MORE. Tyler measured the SCUMM Bar at median 27.3,
p10 1.9, 55.0% below luminance 30, p90 68.2, against our Room 1 at 42.7 /
20.9 / 17.8% / 76.4. The target is median 25-35, p10 under 8, below-30
45-60%.

But a histogram is not the ruling. The ruling is LARGE CONNECTED REGIONS OF
NEAR-VOID that other things are seen against -- under tables, behind the
doorway, in the roof beams -- and a histogram can be satisfied by scattering
dark pixels through a dither, which would move all four numbers and change
nothing anybody looks at. So this measures connectedness too:

  void area      what fraction of the frame is at or near palette index 0
  largest blob   the biggest connected run of it, as a fraction of the frame
  blobs >= 150px how many separate regions are big enough to read AS regions

A room that hits its numbers on noise has a tiny largest blob and hundreds of
components. A room that hits them the way the reference does has a handful of
big ones. Both are reported, because only one of them is the ruling.
"""

from __future__ import annotations

import sys
from collections import deque

from palette import Palette

#: Below this counts as "dark" for the below-30 proportion. Tyler's number.
DARK = 30.0
#: Below this counts as NEAR-VOID for the connectedness measure. The reference
#: p10 is 1.9, so this is generous: anything a viewer reads as black.
VOID = 12.0
#: A connected region smaller than this is texture, not a region.
REGION = 150


def luminance(rgb: tuple[int, int, int]) -> float:
    red, green, blue = rgb
    return 0.299 * red + 0.587 * green + 0.114 * blue


def percentile(values: list[float], fraction: float) -> float:
    if not values:
        return 0.0
    index = max(0, min(len(values) - 1, int(round(fraction * (len(values) - 1)))))
    return values[index]


def blobs(mask: list[list[bool]], width: int, height: int) -> list[int]:
    """Connected components of the near-void mask, four-connected, by size."""
    seen = [[False] * width for _ in range(height)]
    out = []
    for y0 in range(height):
        for x0 in range(width):
            if not mask[y0][x0] or seen[y0][x0]:
                continue
            size = 0
            queue = deque([(x0, y0)])
            seen[y0][x0] = True
            while queue:
                x, y = queue.popleft()
                size += 1
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < width and 0 <= ny < height and mask[ny][nx] and not seen[ny][nx]:
                        seen[ny][nx] = True
                        queue.append((nx, ny))
            out.append(size)
    out.sort(reverse=True)
    return out


def measure(canvas, palette: Palette) -> dict:
    width, height = canvas.width, canvas.height
    lum = [[0.0] * width for _ in range(height)]
    values = []
    for y in range(height):
        for x in range(width):
            value = luminance(palette.colours[canvas.get(x, y)])
            lum[y][x] = value
            values.append(value)
    values.sort()
    total = width * height
    mask = [[lum[y][x] < VOID for x in range(width)] for y in range(height)]
    sizes = blobs(mask, width, height)
    return {
        "median": percentile(values, 0.50),
        "p10": percentile(values, 0.10),
        "p90": percentile(values, 0.90),
        "below30": 100.0 * sum(1 for v in values if v < DARK) / total,
        "voidArea": 100.0 * sum(sizes) / total,
        "largest": 100.0 * (sizes[0] if sizes else 0) / total,
        "regions": sum(1 for size in sizes if size >= REGION),
        "components": len(sizes),
    }


#: THREE BANDS, NOT ONE. The original target came from MI's SCUMM Bar, which
#: is a NIGHT INTERIOR, and it does not transfer to daylight: a lit street
#: with a sky in it cannot be 55% below luminance 30 without being wrong.
#:
#: Room 13 is its own case in both directions. Errata 17b declares it a
#: near-monochrome scrubbed white room on purpose, so it is not pulled towards
#: 30 -- it wants real dark under the coffins and the table and then it stops.
REFERENCE = {"median": 27.3, "p10": 1.9, "below30": 55.0, "p90": 68.2}

BANDS = {
    "interior": {"median": (25.0, 35.0), "p10": (0.0, 8.0), "below30": (45.0, 60.0)},
    "day": {"median": (45.0, 60.0), "p10": (0.0, 15.0), "below30": (20.0, 30.0)},
    "monochrome": {"median": (80.0, 100.0), "p10": (0.0, 40.0), "below30": (15.0, 20.0)},
}

#: Which band each composed room answers to. Night exteriors take the interior
#: band -- Room 1 is a night road and it landed inside it.
BAND_OF = {
    "ROOM 1": "interior", "ROOM 3": "interior", "ROOM 5": "interior",
    "ROOM 18": "interior", "ROOM 19": "interior",
    "ROOM 2": "day", "ROOM 29": "day", "ROOM 36": "day",
    "ROOM 13": "monochrome",
}


def band_for(name: str) -> str:
    for prefix, band in BAND_OF.items():
        if name.startswith(prefix + " ") or name == prefix:
            return band
    raise KeyError(f"{name} is not assigned a band -- assign one before measuring it")


def verdict(stats: dict, band: str) -> str:
    misses = [key for key, (low, high) in BANDS[band].items()
              if not low <= stats[key] <= high]
    return "in the window" if not misses else f"outside: {', '.join(misses)}"


def report(name: str, stats: dict) -> bool:
    band = band_for(name)
    print(f"{name}   [{band}]")
    print(f"  median {stats['median']:6.1f}   p10 {stats['p10']:6.1f}   "
          f"below 30 {stats['below30']:5.1f}%   p90 {stats['p90']:6.1f}")
    print(f"  near-void {stats['voidArea']:5.1f}% of frame, largest region "
          f"{stats['largest']:5.1f}%, {stats['regions']} region(s) over {REGION}px "
          f"({stats['components']} components)")
    print(f"  {verdict(stats, band)}")
    return verdict(stats, band) == "in the window"


def rooms():
    import room01_hero
    import room01_stage_road
    import room02_main_street
    import room03_nugget
    import room05_assay
    import room29_ridge
    import rooms_batch_a
    from street_scene import DAY

    yield "ROOM 1 -- stage road, night", room01_stage_road.compose(with_coach=True)[0]
    yield "ROOM 1 -- stage road, BESPOKE", room01_hero.compose()[0]
    yield "ROOM 2 -- Main Street, day", room02_main_street.compose(DAY)[0]
    yield "ROOM 3 -- the Nugget", room03_nugget.compose()[0]
    yield "ROOM 5 -- the assay office", room05_assay.compose()[0]
    yield "ROOM 29 -- the ridge", room29_ridge.compose()[0]
    yield "ROOM 18 -- the hotel lobby", rooms_batch_a.hotel_lobby()[0]
    yield "ROOM 19 -- Thad's room", rooms_batch_a.thads_room()[0]
    yield "ROOM 13 -- the undertaker's", rooms_batch_a.undertakers()[0]


def main() -> int:
    palette = Palette.load()
    print(f"REFERENCE  MI SCUMM Bar: median {REFERENCE['median']}, p10 {REFERENCE['p10']}, "
          f"below 30 {REFERENCE['below30']}%, p90 {REFERENCE['p90']}")
    for name, limits in BANDS.items():
        print(f"BAND {name:<11} median {limits['median'][0]:.0f}-{limits['median'][1]:.0f}, "
              f"p10 under {limits['p10'][1]:.0f}, "
              f"below-30 {limits['below30'][0]:.0f}-{limits['below30'][1]:.0f}%")
    print()
    only = sys.argv[1:]
    outside = 0
    for name, canvas in rooms():
        if only and not any(token.lower() in name.lower() for token in only):
            continue
        if not report(name, measure(canvas, palette)):
            outside += 1
        print()
    print(f"{outside} room(s) outside the window")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
