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
