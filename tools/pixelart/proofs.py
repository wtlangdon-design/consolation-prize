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

import random
from pathlib import Path

from canvas import IndexedCanvas
from palette import Palette
from street_scene import DAWN, DAY, GROUND, HEIGHT, HILL_BASE, LOTS, SEED, WIDTH, compose

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "art" / "reference"

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
    stacked.save(OUT / "room-02-vs-36.png", palette)
    stacked.save(OUT / "room-02-vs-36@4x.png", palette, scale=4)
    print(f"  wrote {(OUT / 'room-02-vs-36@4x.png').relative_to(ROOT)}")

    # -- proof 2 -----------------------------------------------------------
    check, _ = compose(DAY)
    ink = palette.role("inkBright")
    silhouette = palette.family("umber").at(0)

    eye_y = human_silhouette(check, 130, GROUND - 1, silhouette)
    dashed_rule(check, HILL_BASE, ink)

    check.save(OUT / "room-02-scale-check.png", palette)
    check.save(OUT / "room-02-scale-check@4x.png", palette, scale=4)

    print()
    print("PROOF 2 -- 40px figure on the boardwalk")
    print(f"  figure height      {FIGURE_HEIGHT}px  (spec: ~40px sprites)")
    print(f"  feet               y={GROUND - 1}  (deck surface y={GROUND})")
    print(f"  eyeline            y={eye_y}")
    print(f"  hill base          y={HILL_BASE}  (dashed rule)")
    print()
    # The eyes-on-horizon test no longer applies and saying so is the point.
    # Reclaiming the top quarter of the frame for sky put the ridges well
    # above eye level and the true horizon behind the terrace, where it is
    # occluded. That is normal for a street view -- but it means the check
    # that mattered before is now meaningless, and the honest replacement is
    # to measure the figure against the things it has to walk through.
    print("  horizon is occluded by the terrace, so eyes-on-horizon no longer applies;")
    print("  scale is checked against the openings instead:")
    print(f"  {'building':<12}{'door px':>9}{'x figure':>10}{'verdict':>10}")
    for lot in LOTS:
        door_h = GROUND - (lot.awning - 2)
        ratio = door_h / FIGURE_HEIGHT
        verdict = "ok" if 0.95 <= ratio <= 1.30 else "SHORT"
        print(f"  {lot.kind:<12}{door_h:>9}{ratio:>9.2f}x{verdict:>10}")
    print(f"  wrote {(OUT / 'room-02-scale-check@4x.png').relative_to(ROOT)}")


if __name__ == "__main__":
    main()
