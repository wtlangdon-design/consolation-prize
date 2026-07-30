"""Ships Room 3's background into art/backgrounds, where the engine reads it.

Same shape as room02_main_street.py. Separate from room03_nugget.py so the
composition module stays importable by the proof and the audit without
writing shipping assets as a side effect.
"""

from __future__ import annotations

from pathlib import Path

import room03_nugget
from palette import Palette

ROOT = Path(__file__).resolve().parents[2]


def main() -> None:
    canvas, palette, _ = room03_nugget.compose()
    # Shipping asset only. The 4x review render of this same composition is
    # written by room03_nugget.py; producing it twice under two names put
    # the same picture in renders/ as both "room-03-nugget@4x" and
    # "room-03-nugget-background@4x", which is exactly the ambiguity the
    # one-name-per-render rule exists to stop.
    native = ROOT / "art" / "backgrounds" / "room-03-nugget.png"
    canvas.save(native, palette)
    print(f"wrote {native.relative_to(ROOT)} ({canvas.width}x{canvas.height})")


if __name__ == "__main__":
    main()
