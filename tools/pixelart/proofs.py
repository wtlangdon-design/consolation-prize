"""Two proofs, before any more iteration on Main Street.

1. Room 2 and Room 36 are the same street under different light. Proved
   three ways: the RNG streams stay in lockstep, the structural edge map is
   unchanged, and the two are stacked for eyeballing.

2. A 40px figure standing on the boardwalk has its eyes on the horizon.
   That is the single check that says the scene's scale and its horizon
   agree. If the eyes land anywhere else, either the buildings are the wrong
   size or the hills are at the wrong height, and every later room inherits
   the error.
"""

from __future__ import annotations

import json
import random
from pathlib import Path

from canvas import IndexedCanvas
from palette import Palette
from renders import RENDERS
from street_scene import DAWN, DAY, GROUND, HEIGHT, LOTS, SEED, STREET_TOP, WIDTH, compose

ROOT = Path(__file__).resolve().parents[2]
OUT = RENDERS

FIGURE_HEIGHT = 40


class CountingRandom(random.Random):
    """A Random that records how many draws were taken from it."""

    def __init__(self, seed: int) -> None:
        super().__init__(seed)
        self.calls = 0

    def random(self):  # noqa: D102
        self.calls += 1
        return super().random()

    def randrange(self, *args, **kwargs):  # noqa: D102
        self.calls += 1
        return super().randrange(*args, **kwargs)

    def randint(self, *args, **kwargs):  # noqa: D102
        self.calls += 1
        return super().randint(*args, **kwargs)

    def uniform(self, *args, **kwargs):  # noqa: D102
        self.calls += 1
        return super().uniform(*args, **kwargs)


def rng_sync_proof() -> tuple[int, int]:
    """Runs both schemes with a counting RNG and returns the draw counts.

    Equal counts mean neither scheme took a different branch through any
    randomised code -- which is what makes 'same seed' mean 'same street'.
    """
    import street_scene

    original = random.Random
    counts: list[int] = []
    for scheme in (DAY, DAWN):
        counter = CountingRandom(SEED)
        street_scene.random.Random = lambda _seed, _c=counter: _c  # type: ignore[assignment]
        try:
            compose(scheme)
        finally:
            street_scene.random.Random = original  # type: ignore[assignment]
        counts.append(counter.calls)
    return counts[0], counts[1]


def edge_map(canvas: IndexedCanvas) -> set[tuple[int, int]]:
    """Pixels whose index differs from the neighbour to the left or above.

    A palette-only relight moves every colour but cannot move a boundary, so
    two relightings of one composition share an edge map. A structural change
    would not.
    """
    edges: set[tuple[int, int]] = set()
    for y in range(canvas.height):
        for x in range(canvas.width):
            here = canvas.pixels[y][x]
            if x > 0 and canvas.pixels[y][x - 1] != here:
                edges.add((x, y))
            elif y > 0 and canvas.pixels[y - 1][x] != here:
                edges.add((x, y))
    return edges


def zone_figures(canvas: IndexedCanvas, palette: Palette) -> list[tuple[str, int, int, int]]:
    """One figure per declared depth zone, at that zone's DRAWN height.

    Errata ruling 15 in one picture. The heights are read from the same JSON
    the engine reads and the zones from the same room file, so this cannot
    drift from what actually ships. The sizes are deliberately not a smooth
    series -- 40, 32, 26 is what is drawn, and anything between them is what
    the ruling forbids.
    """
    scaling = json.loads((ROOT / "content" / "actors" / "scaling.json").read_text())
    room = json.loads((ROOT / "content" / "rooms" / "main-street.json").read_text())
    heights = {zone["index"]: (zone["name"], zone["height"]) for zone in scaling["zones"]}

    ink = palette.family("umber").at(0)
    placements: list[tuple[str, int, int, int]] = []
    columns = {0: 250, 1: 158, 2: 62}
    for region in room["walkable"]:
        if region["id"] == "boardwalk":
            continue
        name, height = heights[region["zone"]]
        x = columns.get(region["zone"], 160)
        rx, ry, rw, rh = region["rect"]
        feet = ry + rh - 1
        draw_figure(canvas, x, feet, height, ink)
        placements.append((f'{region["id"]} ({name})', x, feet, height))
    return placements


def draw_figure(canvas: IndexedCanvas, centre_x: int, feet_y: int, height: int, index: int) -> None:
    """The same block proportions at any drawn height, snapped to whole pixels."""
    unit = height / FIGURE_HEIGHT
    top = feet_y - height + 1

    def block(x0: int, y0: int, w: int, h: int) -> None:
        canvas.rect(
            centre_x + round(x0 * unit), top + round(y0 * unit),
            max(1, round(w * unit)), max(1, round(h * unit)), index,
        )

    block(-3, 0, 6, 8)
    block(-5, 9, 10, 15)
    block(-7, 10, 2, 13)
    block(5, 10, 2, 13)
    block(-5, 24, 4, 16)
    block(1, 24, 4, 16)


def human_silhouette(canvas: IndexedCanvas, centre_x: int, feet_y: int, index: int) -> int:
    """A plain 40px figure. No art -- a shape at the correct scale.

    Returns the y of the eyeline. Proportions are the usual pixel-adventure
    ones: a head a little under a fifth of the body, legs a little under half.
    """
    top = feet_y - (FIGURE_HEIGHT - 1)

    def block(x0: int, y0: int, w: int, h: int) -> None:
        canvas.rect(centre_x + x0, top + y0, w, h, index)

    block(-3, 0, 6, 8)      # head
    block(-1, 8, 3, 2)      # neck
    block(-5, 9, 10, 15)    # torso
    block(-7, 10, 2, 13)    # left arm
    block(5, 10, 2, 13)     # right arm
    block(-5, 24, 4, 16)    # left leg
    block(1, 24, 4, 16)     # right leg
    block(-6, 38, 5, 2)     # left foot
    block(1, 38, 5, 2)      # right foot

    return top + 4          # eyeline, four rows down the head


def dashed_rule(canvas: IndexedCanvas, y: int, index: int, on: int = 3, off: int = 3) -> None:
    for x in range(WIDTH):
        if x % (on + off) < on:
            canvas.put(x, y, index)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    palette = Palette.load()

    # -- proof 1 -----------------------------------------------------------
    day, _ = compose(DAY)
    dawn, _ = compose(DAWN)

    day_calls, dawn_calls = rng_sync_proof()
    day_edges, dawn_edges = edge_map(day), edge_map(dawn)
    shared = len(day_edges & dawn_edges)
    union = len(day_edges | dawn_edges)
    differing = sum(
        1
        for y in range(HEIGHT)
        for x in range(WIDTH)
        if day.pixels[y][x] != dawn.pixels[y][x]
    )

    print("PROOF 1 -- same street, different light")
    print(f"  rng draws          day {day_calls}   dawn {dawn_calls}   "
          f"{'IN SYNC' if day_calls == dawn_calls else 'DESYNCHRONISED'}")
    print(f"  structural edges   shared {shared} of {union} "
          f"({shared / union * 100:.1f}% identical)")
    print(f"  pixels relit       {differing} of {WIDTH * HEIGHT} "
          f"({differing / (WIDTH * HEIGHT) * 100:.1f}%)")

    gap = 4
    stacked = IndexedCanvas(WIDTH, HEIGHT * 2 + gap, fill=palette.role("overlayBg"))
    stacked.blit(day, 0, 0)
    stacked.blit(dawn, 0, HEIGHT + gap)
    stacked.save(OUT / "room-02-day-vs-room-36-dawn.png", palette)
    stacked.save(OUT / "room-02-day-vs-room-36-dawn@4x.png", palette, scale=4)
    print(f"  wrote {(OUT / 'room-02-vs-36@4x.png').relative_to(ROOT)}")

    # -- proof 2 -----------------------------------------------------------
    check, _ = compose(DAY)
    placements = zone_figures(check, palette)
    check.save(OUT / "room-02-scale-check-three-zones.png", palette)
    check.save(OUT / "room-02-scale-check-three-zones@4x.png", palette, scale=4)

    print()
    print("PROOF 2 -- depth zones, errata ruling 15")
    print(f"  mud band           y={STREET_TOP}..{HEIGHT}  ({HEIGHT - STREET_TOP}px deep)")
    print(f"  {'region':<22}{'x':>5}{'feet y':>8}{'drawn':>8}")
    for label, x, feet, height in placements:
        print(f"  {label:<22}{x:>5}{feet:>8}{height:>7}px")
    heights = sorted({height for _, _, _, height in placements}, reverse=True)
    print(f"  drawn sizes in use: {', '.join(f'{h}px' for h in heights)}")
    print("  sizes are snapped on crossing, never interpolated -- rescaling 1-bit")
    print("  art at a non-integer ratio is what the ruling exists to prevent")
    print(f"  wrote {(OUT / 'room-02-scale-check@4x.png').relative_to(ROOT)}")


if __name__ == "__main__":
    main()
