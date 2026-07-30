"""Ships Room 5's background into art/backgrounds, where the engine reads it."""

from __future__ import annotations

from pathlib import Path

import room05_assay
from palette import Palette

ROOT = Path(__file__).resolve().parents[2]


def main() -> None:
    canvas, palette, _ = room05_assay.compose()
    native = ROOT / "art" / "backgrounds" / "room-05-assay-office.png"
    canvas.save(native, palette)
    print(f"wrote {native.relative_to(ROOT)} ({canvas.width}x{canvas.height})")


if __name__ == "__main__":
    main()
