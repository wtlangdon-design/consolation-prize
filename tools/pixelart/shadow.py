"""Shadow in the pale families. Errata ruling 21b.

`void` at index 0 is the only true black and it is a single entry with no
ramp, so nothing can be darkened toward it -- the entire lighting pass steps
within a family. Nine families reach near-black. **Four cannot approach it:**

    bone          floor 90.0   the Company frontage, the assay office's
                               identity material, the title screen's false
                               fronts, the handbill carrying the thesis
    sky           floor 52.7   every daylight exterior
    dusk          floor 49.8
    accent_gold   floor 41.4   Hob's lamp, the chandelier

The whitest material in Consolation cannot be in shadow. A bone surface in
deep shade is not renderable at all, and every room built from here would be
silently wrong in the same way.

The fix is the dawn scheme's, generalised: swap to a cooler family at MATCHED
LUMINANCE rather than darkening within the ramp. Matched on measured value,
never on ramp position -- `umber` at 0.64 and `grey` at 0.64 are nowhere near
each other, and a naive positional swap turned the darkest building on Main
Street into a mid-tone one the first time it was tried.

The palette is not reopened. This is a lighting rule.
"""

from __future__ import annotations

from palette import Palette

#: Ruling 21b's table. Each pale family and the cooler ones it may become.
#: More than one candidate because the right answer depends on the target
#: value: bone going a little dark wants dust, bone going very dark wants grey.
SWAPS: dict[str, tuple[str, ...]] = {
    "bone": ("dust", "grey"),
    "sky": ("accent_indigo", "grey"),
    "dusk": ("umber", "grey"),
    "accent_gold": ("ochre", "umber"),
}


def floor_of(palette: Palette, family: str) -> float:
    return palette.luminance(palette.family(family).at(0))


def shade(palette: Palette, family: str, target: float) -> int:
    """The index that renders `family` at luminance `target`.

    Above the family's floor this is the family's own ramp, and nothing
    happens. Below it, the family swaps -- which is the whole ruling. Callers
    do not have to know whether their material is one of the four; they ask
    for a value and get one.
    """
    ramp = palette.family(family)
    if target >= floor_of(palette, family):
        return _nearest(palette, family, target)

    best, best_gap = None, None
    for candidate in SWAPS.get(family, ()):
        index = _nearest(palette, candidate, target)
        gap = abs(palette.luminance(index) - target)
        if best_gap is None or gap < best_gap:
            best, best_gap = index, gap
    # A family with no declared swap cannot go below its floor, and saying so
    # by returning the floor is better than silently returning something else.
    return best if best is not None else ramp.at(0)


def _nearest(palette: Palette, family: str, target: float) -> int:
    ramp = palette.family(family)
    return min((ramp.at(step) for step in range(ramp.count)),
               key=lambda index: abs(palette.luminance(index) - target))


def audit(palette: Palette, rooms, threshold: float = 2.0, verbose: bool = True) -> int:
    """Pale-family surfaces sitting ON their floor. Ruling 21b's check.

    A pixel at a pale family's floor is a pixel that WANTED to be darker and
    could not be. It is not proof of a defect -- a bone surface may legitimately
    be at 90 in full light -- so this reports counts and the darkest thing
    around them, and a run of floor pixels surrounded by much darker
    neighbours is the signature the ruling is about.
    """
    floors = {name: floor_of(palette, name) for name in SWAPS}
    families = {}
    for name in SWAPS:
        ramp = palette.family(name)
        families[name] = ramp.at(0)

    flagged = 0
    if verbose:
        print("RULING 21b -- pale-family surfaces at their floor")
        print(f"  {'room':<24}{'family':<14}{'px at floor':>12}{'median neighbour':>18}")
    for label, canvas in rooms:
        for name, index in families.items():
            spots = [(x, y) for y in range(canvas.height) for x in range(canvas.width)
                     if canvas.get(x, y) == index]
            if not spots:
                continue
            around = []
            for x, y in spots:
                for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < canvas.width and 0 <= ny < canvas.height:
                        neighbour = canvas.get(nx, ny)
                        if neighbour != index:
                            around.append(palette.luminance(neighbour))
            median = sorted(around)[len(around) // 2] if around else float("nan")
            # The signature: a floor pixel whose surroundings are markedly
            # darker than it is. That is a surface in shadow that could not
            # follow its neighbours down.
            stuck = median < floors[name] - 12
            if verbose:
                mark = "  <- stuck at the floor" if stuck else ""
                print(f"  {label:<24}{name:<14}{len(spots):>12}{median:>18.1f}{mark}")
            if stuck:
                flagged += 1
    if verbose and flagged == 0:
        print("  no pale surface is sitting at its floor with darker neighbours")
    return flagged
