"""Palette cycling, composition side. Doc 18.

Colour resolves only at export, so animating a background costs nothing but
rotating entries within a reserved band of the palette while every pixel index
stays exactly where it was. No frames, no extra art.

The whole technique rests on one guarantee, and this module is that guarantee:

    A CYCLED INDEX MAY APPEAR ONLY INSIDE ITS OWN ELEMENT.

Doc 18 implementation note 1. If the lamp's warm band also paints a window
frame, the window frame flickers, and it flickers in a way that reads as a
rendering fault rather than as a lamp. So the bands are declared in room JSON,
reserved here at composition time, and verified before anything is written.

`reserve()` clamps trespassers out of the band; `verify()` proves none are
left. Clamping rather than failing is deliberate for this room: the two
trespassers in Room 1 are the coach lantern and the clasp on Thad's case, both
accent_gold, both of which doc 17 already requires to be dimmer than Hob's
lamp. Pushing them below the lamp's reserved band enforces a rule the design
had stated and nothing had been checking.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from fractions import Fraction
from math import gcd
from pathlib import Path

from canvas import IndexedCanvas
from palette import Palette

ROOT = Path(__file__).resolve().parents[2]

MODES = ("rotate", "pingpong", "pulse")
#: Doc 18 discipline rule 4. Faster than this reads as a glitch at 320x144.
MAX_RATE = 4.0
#: Doc 18 discipline rule 1.
MAX_ELEMENTS = 2


@dataclass(frozen=True)
class Element:
    """One cycling element, resolved to absolute palette indices."""

    id: str
    mode: str
    rate: float
    phase: float
    first: int
    count: int
    bounds: tuple[int, int, int, int]

    @property
    def indices(self) -> range:
        return range(self.first, self.first + self.count)

    def contains(self, x: int, y: int) -> bool:
        bx, by, bw, bh = self.bounds
        return bx <= x < bx + bw and by <= y < by + bh


def load(room_id: str, palette: Palette) -> list[Element]:
    """The room's declared elements, with family-relative ramps resolved."""
    manifest = json.loads((ROOT / "content" / "manifest.json").read_text(encoding="utf-8"))
    for relative in manifest["rooms"]:
        data = json.loads((ROOT / relative).read_text(encoding="utf-8"))
        if data["id"] != room_id:
            continue
        out = []
        for entry in data.get("cycling", []):
            ramp = palette.family(entry["ramp"]["family"])
            out.append(Element(
                id=entry["id"], mode=entry["mode"], rate=entry["rate"],
                phase=entry.get("phase", 0.0),
                first=ramp.start + entry["ramp"]["start"], count=entry["ramp"]["count"],
                bounds=tuple(entry["bounds"]),
            ))
        return out
    raise KeyError(f"no room declares id {room_id!r}")


def offset(element: Element, step: int) -> int:
    """Which way the band is rotated at whole step `step` of the cycle.

    `rotate` and `pingpong` WRAP: they are loops, and the ramp they run on is
    a loop -- water and fire come back round.

    `pulse` CLAMPS, and that is not a detail. Hob's lamp reserves four entries
    spanning luminance 136 to 203, so a wrapping pulse would drop its core to
    its darkest entry every second beat. That is a strobe. Doc 18 asks for "a
    carried flame in still air", which is the whole element swelling by one
    ramp step and its brightest pixel staying put.
    """
    if element.mode == "rotate":
        return step % element.count
    if element.mode == "pingpong":
        span = max(1, 2 * (element.count - 1))
        walk = step % span
        return walk if walk < element.count else span - walk
    if element.mode == "pulse":
        return step % 2
    raise ValueError(f"unknown cycling mode: {element.mode}")


def phase_count(element: Element) -> int:
    """How many distinct states this element has. Every one gets measured."""
    if element.mode == "rotate":
        return element.count
    if element.mode == "pingpong":
        return max(1, 2 * (element.count - 1))
    return 2


def step_at(element: Element, seconds: float) -> int:
    """Which whole step this element is on at a wall-clock time."""
    return int(seconds * element.rate + element.phase * phase_count(element))


def mapping(elements: list[Element], steps: list[int]) -> dict[int, int]:
    """index -> the index whose COLOUR it currently shows, one step each.

    Steps are per element, not shared. Two elements at 0.6 and 0.25 Hz are on
    different clocks, and a single counter for both would animate a room that
    does not exist.
    """
    out: dict[int, int] = {}
    for element, step in zip(elements, steps):
        shift = offset(element, step)
        for position, index in enumerate(element.indices):
            if element.mode == "pulse":
                out[index] = element.first + min(element.count - 1, position + shift)
            else:
                out[index] = element.first + (position + shift) % element.count
    return out


def mapping_at(elements: list[Element], seconds: float) -> dict[int, int]:
    return mapping(elements, [step_at(e, seconds) for e in elements])


def change_times(elements: list[Element]) -> tuple[list[float], float]:
    """Every instant the picture changes, and the length of the whole loop.

    A cycling room has far fewer distinct pictures than it has frames -- Room 1
    has sixty-four in eighty seconds -- so anything that wants to look at all of
    them should walk the changes, not the clock.
    """
    if not elements:
        return [0.0], 0.0
    # Exact arithmetic, not floats. 0.6 Hz over two states is a period of
    # exactly ten thirds of a second, and rounding that to milliseconds before
    # taking a common multiple turned an eighty-second loop into a fifteen-hour
    # one with forty-two thousand frames in it.
    periods = [Fraction(phase_count(e)) / Fraction(e.rate).limit_denominator(1000)
               for e in elements]
    loop = periods[0]
    for period in periods[1:]:
        loop = loop * period / _gcd(loop, period)
    instants = {Fraction(0)}
    for element in elements:
        gap = 1 / Fraction(element.rate).limit_denominator(1000)
        tick = Fraction(0)
        while tick < loop:
            instants.add(tick)
            tick += gap
    return [float(tick) for tick in sorted(instants)], float(loop)


def _gcd(a: Fraction, b: Fraction) -> Fraction:
    return Fraction(gcd(a.numerator * b.denominator, b.numerator * a.denominator),
                    a.denominator * b.denominator)


def reserve(canvas: IndexedCanvas, palette: Palette, elements: list[Element]) -> int:
    """Pushes every trespasser out of every reserved band. Returns how many.

    A pixel inside a reserved band but outside that element's bounds is moved
    to the step below the band. Below, not above: every band in the game so far
    is reserved for the brightest thing in its family, and something that was
    competing with a lamp should lose.
    """
    moved = 0
    for element in elements:
        below = max(0, element.first - 1)
        for y in range(canvas.height):
            for x in range(canvas.width):
                index = canvas.get(x, y)
                if index in element.indices and not element.contains(x, y):
                    canvas.put(x, y, below)
                    moved += 1
    return moved


def verify(canvas: IndexedCanvas, elements: list[Element]) -> None:
    """Raises unless every reserved index is inside its element. Doc 18 note 1."""
    if len(elements) > MAX_ELEMENTS:
        raise RuntimeError(
            f"{len(elements)} cycling elements; doc 18 allows {MAX_ELEMENTS} per room")
    seen: dict[int, str] = {}
    for element in elements:
        if element.mode not in MODES:
            raise RuntimeError(f"{element.id}: unknown mode {element.mode!r}")
        if not 0 < element.rate <= MAX_RATE:
            raise RuntimeError(f"{element.id}: rate {element.rate} outside 0..{MAX_RATE} Hz")
        for index in element.indices:
            if index in seen:
                raise RuntimeError(
                    f"{element.id} and {seen[index]} both reserve index {index}")
            seen[index] = element.id

    for y in range(canvas.height):
        for x in range(canvas.width):
            index = canvas.get(x, y)
            owner = seen.get(index)
            if owner is None:
                continue
            element = next(e for e in elements if e.id == owner)
            if not element.contains(x, y):
                raise RuntimeError(
                    f"reserved index {index} ({owner}) drawn at {x},{y}, outside "
                    f"its declared bounds {element.bounds} -- it would flicker")


def extremes(elements: list[Element]) -> list[dict[int, int]]:
    """Every mapping the room can ever be in.

    The CARTESIAN PRODUCT of the elements' states, not one shared counter.
    Doc 18 note 3 says the legibility check measures the extremes of the cycle
    rather than the base frame, and the extreme of a two-element room is a
    combination of states, not a moment in either element's own loop.
    """
    out = [[]]
    for element in elements:
        out = [combination + [step] for combination in out
               for step in range(phase_count(element))]
    return [mapping(elements, steps) for steps in out]


def recolour(canvas: IndexedCanvas, table: dict[int, int]) -> IndexedCanvas:
    """The same picture with the reserved bands rotated. Every index stays put."""
    if not table:
        return canvas
    out = IndexedCanvas(canvas.width, canvas.height)
    for y in range(canvas.height):
        for x in range(canvas.width):
            index = canvas.get(x, y)
            out.put(x, y, table.get(index, index))
    return out


