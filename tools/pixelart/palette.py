"""Access to the locked 256-colour palette.

Nothing in the pixel-art toolchain names a raw index. Everything asks for a
family and a position within its ramp, so a component reads as "mid-tone
weathered pine" rather than "colour 84".
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PALETTE_PATH = ROOT / "art" / "palette" / "consolation-256.json"


class Ramp:
    """One dark-to-light family. Position 0 is the darkest step."""

    def __init__(self, name: str, start: int, count: int) -> None:
        self.name = name
        self.start = start
        self.count = count

    def at(self, step: int) -> int:
        """Palette index for a ramp step, clamped to the family."""
        return self.start + max(0, min(self.count - 1, step))

    def frac(self, position: float) -> int:
        """Palette index for a 0.0-1.0 position along the ramp."""
        return self.at(round(position * (self.count - 1)))

    def span(self, position: float) -> tuple[int, int, float]:
        """The two ramp steps a fractional position falls between, plus the blend."""
        exact = max(0.0, min(1.0, position)) * (self.count - 1)
        low = int(exact)
        high = min(low + 1, self.count - 1)
        return self.at(low), self.at(high), exact - low

    def __repr__(self) -> str:
        return f"Ramp({self.name}, {self.start}..{self.start + self.count - 1})"


class Palette:
    def __init__(self, data: dict) -> None:
        if not data.get("locked"):
            raise RuntimeError("palette is not locked -- run palette_gen.py first")
        self.data = data
        self.colours: list[tuple[int, int, int]] = [
            (int(value[1:3], 16), int(value[3:5], 16), int(value[5:7], 16)) for value in data["colours"]
        ]
        self._families = {
            name: Ramp(name, span["start"], span["count"]) for name, span in data["families"].items()
        }
        self._roles: dict[str, int] = data["roles"]

        # Optional family that shadows are tinted toward. None keeps a shadow
        # in its own material, which is right under warm sun; at dawn the only
        # light reaching a shadow is the sky, so shadows go blue-grey.
        self.shadow_tint: str | None = None

        # Reverse map, so a colour can be darkened without knowing what it is.
        self._reverse: dict[int, tuple[str, int]] = {}
        for name, ramp in self._families.items():
            for step in range(ramp.count):
                self._reverse[ramp.start + step] = (name, step)

    @classmethod
    def load(cls, path: Path = PALETTE_PATH) -> "Palette":
        return cls(json.loads(path.read_text()))

    def family(self, name: str) -> Ramp:
        try:
            return self._families[name]
        except KeyError as error:
            raise KeyError(f"unknown palette family {name!r}; have {sorted(self._families)}") from error

    def role(self, name: str) -> int:
        return self._roles[name]

    def flat(self) -> list[int]:
        """Palette as a flat RGB triplet list, for Pillow's putpalette."""
        out: list[int] = []
        for red, green, blue in self.colours:
            out.extend((red, green, blue))
        return out

    def darken(self, index: int, steps: int = 1) -> int:
        """Steps a colour down its own family's ramp.

        This is how shadow works on an indexed palette: a shadow is not a
        black wash, it is the same material with less light on it. Stepping
        within the family keeps cream reading as cream and timber as timber,
        which a blend toward black would destroy.
        """
        entry = self._reverse.get(index)
        if entry is None:
            return index
        name, step = entry
        darker = self._families[name].at(max(0, step - steps))
        # Only deep shade takes the tint. A one-step turn away from the sun
        # is still lit by the sun; a cast shadow is lit by the sky instead.
        if self.shadow_tint is not None and steps >= 2:
            return self.nearest_in_family(darker, self.shadow_tint)
        return darker

    def luminance(self, index: int) -> float:
        red, green, blue = self.colours[index]
        return 0.299 * red + 0.587 * green + 0.114 * blue

    def saturation(self, index: int) -> float:
        red, green, blue = self.colours[index]
        peak = max(red, green, blue)
        return 0.0 if peak == 0 else (peak - min(red, green, blue)) / peak

    def nearest_in_family(self, index: int, family: str) -> int:
        """The entry of `family` closest in luminance to `index`.

        Re-materialising a colour at matched value is how a shadow changes
        hue without changing how dark it reads -- shifting both at once would
        just look like a mistake.
        """
        target = self.luminance(index)
        ramp = self.family(family)
        best, best_gap = ramp.at(0), None
        for step in range(ramp.count):
            candidate = ramp.at(step)
            gap = abs(self.luminance(candidate) - target)
            if best_gap is None or gap < best_gap:
                best, best_gap = candidate, gap
        return best

    def lighten(self, index: int, steps: int = 1) -> int:
        entry = self._reverse.get(index)
        if entry is None:
            return index
        name, step = entry
        return self._families[name].at(step + steps)
